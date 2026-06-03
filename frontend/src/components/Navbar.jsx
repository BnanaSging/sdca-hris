import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { db } from '../firebase';
import {
  collection, query, where, orderBy, onSnapshot, updateDoc, doc, limit,
} from 'firebase/firestore';

export default function Navbar() {
  const { userData, logout, currentUser } = useAuth();
  const { dark, setDark } = useDarkMode();
  const [open, setOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const navigate = useNavigate();

  const initials = userData?.name
    ? userData.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  // Real-time unread notifications listener
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(10),
    );
    const unsub = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const TYPE_ICON = {
    announcement: '📢', holiday: '🎉', leave_approval: '📋', payroll: '💰', training: '📚',
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleProfile = () => {
    setOpen(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  return (
    <header className="navbar">
      {/* Left — brand */}
      <div className="navbar-left">
        <span className="navbar-title">SDCA HRIS</span>
      </div>

      {/* Right — action buttons + profile */}
      <div className="navbar-actions">

        {/* ── Dark mode toggle ── */}
        <button
          className="navbar-icon-btn"
          onClick={() => setDark(d => !d)}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={dark ? 'Light mode' : 'Dark mode'}
        >
          {dark ? (
            /* Sun icon */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            /* Moon icon */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>

        {/* ── Notification bell ── */}
        <div className="navbar-bell-wrap" ref={bellRef}>
          <button
            className={`navbar-icon-btn ${bellOpen ? 'active' : ''}`}
            onClick={() => { setBellOpen(v => !v); setOpen(false); }}
            aria-label="Notifications"
            title="Notifications"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span className="navbar-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {bellOpen && (
            <div className="navbar-notif-dropdown">
              {/* Header */}
              <div className="navbar-notif-header">
                <div className="navbar-notif-header-left">
                  <span className="navbar-notif-title">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="navbar-notif-unread-count">{unreadCount} new</span>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="navbar-notif-list">
                {notifications.length === 0 ? (
                  <div className="navbar-notif-empty">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    <span>You're all caught up!</span>
                  </div>
                ) : (
                  notifications.slice(0, 8).map(n => (
                    <div
                      key={n.id}
                      className={`navbar-notif-item ${!n.read ? 'unread' : ''}`}
                      onClick={() => { if (!n.read) markAsRead(n.id); }}
                    >
                      <span className="navbar-notif-item-icon">{TYPE_ICON[n.type] || '🔔'}</span>
                      <div className="navbar-notif-item-body">
                        <div className="navbar-notif-item-title">{n.title}</div>
                        <div className="navbar-notif-item-msg">{n.message}</div>
                        <div className="navbar-notif-item-time">
                          {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                        </div>
                      </div>
                      {!n.read && <div className="navbar-notif-dot" />}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <button
                className="navbar-notif-see-all"
                onClick={() => { setBellOpen(false); navigate('/notifications'); }}
              >
                View all notifications
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="navbar-divider" />

        {/* ── Profile dropdown ── */}
        <div className="navbar-right" ref={dropdownRef}>
          <button className="navbar-profile-btn" onClick={() => { setOpen(prev => !prev); setBellOpen(false); }}>
            <div className="navbar-avatar">{initials}</div>
            <div className="navbar-user-info">
              <span className="navbar-user-name">{userData?.name || 'User'}</span>
              <span className="navbar-user-role">{userData?.role || userData?.position || 'Employee'}</span>
            </div>
            <svg className={`navbar-chevron ${open ? 'open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {open && (
            <div className="navbar-dropdown">
              <div className="navbar-dropdown-header">
                <div className="navbar-avatar navbar-avatar-lg">{initials}</div>
                <div>
                  <p className="navbar-dropdown-name">{userData?.name || 'User'}</p>
                  <p className="navbar-dropdown-email">{userData?.email || ''}</p>
                </div>
              </div>
              <hr className="navbar-dropdown-divider" />
              <button className="navbar-dropdown-item" onClick={handleProfile}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                My Profile
              </button>
              <button className="navbar-dropdown-item logout" onClick={handleLogout}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
