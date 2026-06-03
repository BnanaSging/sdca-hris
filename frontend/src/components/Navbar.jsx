import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { userData, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const initials = userData?.name
    ? userData.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
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
      <div className="navbar-left">
        <span className="navbar-title">SDCA HRIS</span>
      </div>
      <div className="navbar-right" ref={dropdownRef}>
        <button className="navbar-profile-btn" onClick={() => setOpen(prev => !prev)}>
          <div className="navbar-avatar">{initials}</div>
          <div className="navbar-user-info">
            <span className="navbar-user-name">{userData?.name || 'User'}</span>
            <span className="navbar-user-role">{userData?.role || userData?.position || 'Employee'}</span>
          </div>
          <svg className={`navbar-chevron ${open ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              My Profile
            </button>
            <button className="navbar-dropdown-item logout" onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
