import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Reports() {
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const empSnapshot = await getDocs(collection(db, "users")); // Assuming users collection for employees
        const empData = empSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEmployees(empData);

        const leaveSnapshot = await getDocs(collection(db, "leaves")); // Check what your leave collection is actually named. (usually leaves)
        const leaveData = leaveSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeaveRequests(leaveData);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching report data: ", error);
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  if (loading) return <div className="loading-state">Loading reports...</div>;

  // Analytics logic
  const totalEmployees = employees.length;
  const departments = {};
  employees.forEach(emp => {
    const dept = emp.department || 'Unassigned';
    departments[dept] = (departments[dept] || 0) + 1;
  });

  const leaveStatusCount = {
    Pending: 0,
    Approved: 0,
    Rejected: 0
  };
  
  leaveRequests.forEach(leave => {
    const status = leave.status || 'Pending';
    if (leaveStatusCount[status] !== undefined) {
      leaveStatusCount[status]++;
    } else {
       leaveStatusCount[status] = 1;
    }
  });

  return (
    <div className="page-container" style={{ padding: '20px' }}>
      <h2>Reports & Analytics</h2>
      
      <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {/* Headcount Card */}
        <div className="report-card" style={{ padding: '20px', backgroundColor: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #eee)', borderRadius: '8px' }}>
          <h3>Total Headcount</h3>
          <p style={{ fontSize: '2.5em', fontWeight: 'bold', margin: '10px 0', color: 'var(--primary-color)' }}>{totalEmployees}</p>
        </div>

        {/* Department Breakdown */}
        <div className="report-card" style={{ padding: '20px', backgroundColor: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #eee)', borderRadius: '8px' }}>
          <h3>Employees by Department</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {Object.entries(departments).map(([dept, count]) => (
              <li key={dept} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color, #eee)' }}>
                <span>{dept}</span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        </div>

        {/* Leave Statistics */}
        <div className="report-card" style={{ padding: '20px', backgroundColor: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #eee)', borderRadius: '8px' }}>
          <h3>Leave Analytics</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#f39c12' }}>
              <span>Pending</span>
              <strong>{leaveStatusCount.Pending || 0}</strong>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#27ae60' }}>
              <span>Approved</span>
              <strong>{leaveStatusCount.Approved || 0}</strong>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#c0392b' }}>
              <span>Rejected</span>
              <strong>{leaveStatusCount.Rejected || 0}</strong>
            </li>
            {Object.entries(leaveStatusCount).map(([status, count]) => {
              if (status !== 'Pending' && status !== 'Approved' && status !== 'Rejected') {
                 return (
                  <li key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span>{status}</span>
                    <strong>{count}</strong>
                  </li>
                 )
              }
              return null;
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
