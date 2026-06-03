import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { userData } = useAuth();
  const [stats, setStats] = useState({ employees: 0, pendingLeaves: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      let employeesCount = 0;
      let pendingLeavesCount = 0;
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        employeesCount = usersSnap.size;

        const leavesSnap = await getDocs(collection(db, 'leaves'));
        leavesSnap.forEach(doc => {
          if (doc.data().status === 'Pending') pendingLeavesCount++;
        });

        setStats({ employees: employeesCount, pendingLeaves: pendingLeavesCount });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard">
      <h1>Home</h1>
      <p>Welcome to the SDCA HRIS.</p>
      
      <div className="card user-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
          <div className="user-avatar">
            {userData?.name?.substring(0, 2).toUpperCase() || 'GU'}
          </div>
          <div>
            <p className="date-small">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <h3 style={{ margin: '5px 0' }}>Welcome, {userData?.name || 'Guest'}</h3>
          </div>
        </div>
        <p><strong>Position:</strong> {userData?.position || 'N/A'}</p>
        <p><strong>Department:</strong> {userData?.department || 'N/A'}</p>
      </div>

      <div className="stats-grid">
        <Link to="/employees" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><h3>Total Employees</h3><p>{stats.employees}</p></Link>
        <Link to="/leave" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><h3>Pending Leaves</h3><p>{stats.pendingLeaves}</p></Link>
        <Link to="/announcements" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><h3>Announcements</h3><p>View updates</p></Link>
      </div>
    </div>
  );
}
