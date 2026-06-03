import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection, query, where, orderBy, getDocs,
  updateDoc, doc, writeBatch,
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const TYPE_CONFIG = {
  announcement: { icon: '📢', label: 'Announcement',     color: '#2563eb', bg: '#eff6ff' },
  holiday:      { icon: '🎉', label: 'Holiday Notice',   color: '#7c3aed', bg: '#f5f3ff' },
  leave_approval:{ icon: '📋', label: 'Leave Update',    color: '#059669', bg: '#ecfdf5' },
  payroll:      { icon: '💰', label: 'Payroll',          color: '#d97706', bg: '#fffbeb' },
  training:     { icon: '📚', label: 'Training Reminder',color: '#dc2626', bg: '#fef2f2' },
};

const FILTERS = [
  { key: 'all',           label: 'All' },
  { key: 'announcement',  label: 'Announcements' },
  { key: 'holiday',       label: 'Holidays' },
  { key: 'leave_approval',label: 'Leave' },
  { key: 'payroll',       label: 'Payroll' },
  { key: 'training',      label: 'Training' },
];

export default function Notifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, [currentUser]);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
      );
      const snap = await getDocs(q);
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(db);
      unread.forEach(n => batch.update(doc(db, 'notifications', n.id), { read: true }));
      await batch.commit();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="notif-page">

      {/* ── Page Header ── */}
      <div className="notif-page-header">
        <div>
          <div className="notif-page-title">🔔 Notifications</div>
          <div className="notif-page-subtitle">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : "You're all caught up — no unread notifications"}
          </div>
        </div>
        {unreadCount > 0 && (
          <button className="notif-mark-all-btn" onClick={markAllAsRead}>
            ✓ Mark all as read
          </button>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="notif-stats-row">
        <div className="notif-stat-chip">
          <span>Total</span>
          <span className="notif-stat-chip-num">{notifications.length}</span>
        </div>
        {unreadCount > 0 && (
          <div className="notif-stat-chip blue">
            <span>Unread</span>
            <span className="notif-stat-chip-num">{unreadCount}</span>
          </div>
        )}
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
          const count = notifications.filter(n => n.type === key).length;
          if (count === 0) return null;
          return (
            <div key={key} className="notif-stat-chip" style={{ cursor: 'pointer' }} onClick={() => setFilter(key)}>
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
              <span className="notif-stat-chip-num">{count}</span>
            </div>
          );
        })}
      </div>

      {/* ── Filter tabs ── */}
      <div className="notif-filter-bar">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`notif-filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.key !== 'all' && <span>{TYPE_CONFIG[f.key]?.icon}</span>}
            {f.label}
            {f.key !== 'all' && notifications.filter(n => n.type === f.key && !n.read).length > 0 && (
              <span style={{
                background: filter === f.key ? 'rgba(255,255,255,0.35)' : '#ef4444',
                color: '#fff',
                borderRadius: '999px',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '1px 6px',
                marginLeft: 2,
              }}>
                {notifications.filter(n => n.type === f.key && !n.read).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Notification list ── */}
      {loading ? (
        <div className="notif-empty">
          <div className="notif-empty-icon">⏳</div>
          <p>Loading your notifications…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="notif-empty">
          <div className="notif-empty-icon">🔕</div>
          <p>No notifications{filter !== 'all' ? ' in this category' : ''} yet.</p>
        </div>
      ) : (
        <div className="notif-list">
          {filtered.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.announcement;
            return (
              <div
                key={n.id}
                className={`notif-item ${!n.read ? 'unread' : ''}`}
                onClick={() => !n.read && markAsRead(n.id)}
                title={!n.read ? 'Click to mark as read' : undefined}
              >
                <div className="notif-icon-wrap" style={{ background: cfg.bg, color: cfg.color }}>
                  {cfg.icon}
                </div>
                <div className="notif-content">
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-message">{n.message}</div>
                  <div className="notif-meta">
                    <span className="notif-type-badge" style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                    <span className="notif-time">🕐 {formatTime(n.createdAt)}</span>
                    {!n.read && (
                      <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600 }}>
                        · tap to mark read
                      </span>
                    )}
                  </div>
                </div>
                {!n.read && <div className="notif-unread-dot" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
