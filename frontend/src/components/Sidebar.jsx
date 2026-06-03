import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const { userData, currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const position = userData?.position?.toLowerCase() || '';
  const EXEC_POSITIONS = [
    'president', 'vp', 'vpaa',
    'vice president',
    'vice president for academic affairs (vpaa)',
    'vice president for academic affairs',
    'vice president for administration',
    'vice president for finance',
  ];
  const isAdmin = userData?.role?.toLowerCase() === 'admin' ||
    userData?.position?.toLowerCase() === 'admin' ||
    userData?.role?.toLowerCase() === 'superadmin' ||
    EXEC_POSITIONS.includes(position);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      where('read', '==', false),
    );
    const unsub = onSnapshot(q, snap => setUnreadCount(snap.size));
    return () => unsub();
  }, [currentUser]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/image/logo-header.png" alt="HR Portal Logo" className="sidebar-logo" />
      </div>
      <nav className="nav-links">
        <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? "active" : ""}`}>
          <span style={{ marginRight: '10px' }}></span> Home
        </NavLink>
        <NavLink to="/announcements" className={({isActive}) => `nav-link ${isActive ? "active" : ""}`}>
          <span style={{ marginRight: '10px' }}></span> Announcements
        </NavLink>
        <NavLink to="/notifications" className={({isActive}) => `nav-link ${isActive ? "active" : ""}`}>
          <span style={{ marginRight: '10px' }}>🔔</span> Notifications
          {unreadCount > 0 && (
            <span className="sidebar-notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </NavLink>
        {isAdmin && (
          <NavLink to="/employees" className={({isActive}) => `nav-link ${isActive ? "active" : ""}`}>
            <span style={{ marginRight: '10px' }}></span> Employees
          </NavLink>
        )}
        <NavLink to="/leave" className={({isActive}) => `nav-link ${isActive ? "active" : ""}`}>
          <span style={{ marginRight: '10px' }}></span> Leaves
        </NavLink>
        <NavLink to="/apply-leave" className={({isActive}) => `nav-link ${isActive ? "active" : ""}`}>
          <span style={{ marginRight: '10px' }}></span> Apply
        </NavLink>
        {isAdmin && (
          <NavLink to="/audit" className={({isActive}) => `nav-link ${isActive ? "active" : ""}`}>
            <span style={{ marginRight: '10px' }}></span> Audit Logs
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
