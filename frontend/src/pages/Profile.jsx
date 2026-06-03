import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import EmployeeProfileDetails from '../components/EmployeeProfileDetails';

export default function Profile() {
  const { currentUser, userData } = useAuth();

  const initials = userData?.name
    ? userData.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <div className="dashboard">
      <h1>My Profile</h1>
      <p>View and edit your personal employment records.</p>
      
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap', marginTop: '20px' }}>
        <div className="profile-card" style={{ flex: '1', minWidth: '280px', maxWidth: '350px' }}>
          <div className="profile-avatar-section" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="profile-avatar-large" style={{ margin: '0 auto' }}>{initials}</div>
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <h2 className="profile-name">{userData?.name || 'Unknown User'}</h2>
              <p className="profile-sub">{userData?.position || 'Employee'} &bull; {userData?.department || 'N/A'}</p>
              <div style={{ marginTop: '5px' }}>
                <span className="emp-role-badge" data-role={userData?.role?.toLowerCase()}>{userData?.role || 'employee'}</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            <p style={{ margin: '5px 0' }}><strong>Email:</strong> {userData?.email}</p>
            <p style={{ margin: '5px 0' }}><strong>System ID:</strong> {currentUser?.uid}</p>
          </div>
        </div>

        <div className="card" style={{ flex: '2', minWidth: '400px', padding: '20px' }}>
          {currentUser?.uid && <EmployeeProfileDetails targetUid={currentUser.uid} />}
        </div>
      </div>
    </div>
  );
}
