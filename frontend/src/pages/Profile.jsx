import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { userData } = useAuth();

  const initials = userData?.name
    ? userData.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const fields = [
    { label: 'Full Name', value: userData?.name },
    { label: 'Email Address', value: userData?.email },
    { label: 'Department', value: userData?.department },
    { label: 'Position', value: userData?.position },
    { label: 'Role', value: userData?.role },
  ];

  return (
    <div className="dashboard">
      <h1>My Profile</h1>
      <p>View your account information.</p>

      <div className="profile-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar-large">{initials}</div>
          <div>
            <h2 className="profile-name">{userData?.name || 'Unknown User'}</h2>
            <p className="profile-sub">{userData?.position || 'Employee'} &bull; {userData?.department || 'N/A'}</p>
          </div>
        </div>

        <div className="profile-fields">
          {fields.map(f => f.value ? (
            <div className="profile-field" key={f.label}>
              <span className="profile-field-label">{f.label}</span>
              <span className="profile-field-value">{f.value}</span>
            </div>
          ) : null)}
        </div>
      </div>
    </div>
  );
}
