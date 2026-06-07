import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

export default function Dashboard() {
  const { userData } = useAuth();
  const [stats, setStats] = useState({ employees: 0, pendingLeaves: 0, totalDepartments: 0, approvedLeaves: 0 });
  const [deptData, setDeptData] = useState([]);
  const [leaveData, setLeaveData] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const leavesSnap = await getDocs(collection(db, 'leaves'));
        const deptsSnap = await getDocs(collection(db, 'departments'));

        let employeesCount = usersSnap.size;
        let totalDepartments = deptsSnap.size;
        
        let pending = 0;
        let approved = 0;
        let denied = 0;

        leavesSnap.forEach(doc => {
          const s = doc.data().status;
          if (s === 'Pending') pending++;
          else if (s === 'Approved') approved++;
          else if (s === 'Denied') denied++;
        });

        // Calculate Employees per Department
        const deptsCount = {};
        usersSnap.forEach(doc => {
          const d = doc.data().department || 'Unassigned';
          deptsCount[d] = (deptsCount[d] || 0) + 1;
        });

        const deptChartData = Object.keys(deptsCount).map(key => ({
          name: key.length > 12 ? key.substring(0,12) + '...' : key,
          employees: deptsCount[key],
          fullName: key
        }));

        setStats({ employees: employeesCount, pendingLeaves: pending, totalDepartments, approvedLeaves: approved });
        setDeptData(deptChartData.sort((a,b) => b.employees - a.employees));
        setLeaveData([
          { name: 'Approved', count: approved },
          { name: 'Pending', count: pending },
          { name: 'Denied', count: denied }
        ]);

      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)' }}>Dashboard Analytics</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {userData?.name || 'Guest'}! Here is your HR overview.</p>
        </div>
        <div style={{ background: 'var(--navbar-bg)', padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <strong>Today:</strong> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <Link to="/employees" className="card" style={{ textDecoration: 'none', color: 'inherit', borderLeft: '4px solid #3b82f6', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 5px 0' }}>Total Employees</p>
          <h2 style={{ fontSize: '2.2rem', margin: 0, color: 'var(--text-primary)' }}>{stats.employees}</h2>
        </Link>
        <Link to="/org-structure" className="card" style={{ textDecoration: 'none', color: 'inherit', borderLeft: '4px solid #8b5cf6', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 5px 0' }}>Active Departments</p>
          <h2 style={{ fontSize: '2.2rem', margin: 0, color: 'var(--text-primary)' }}>{stats.totalDepartments}</h2>
        </Link>
        <Link to="/leave" className="card" style={{ textDecoration: 'none', color: 'inherit', borderLeft: '4px solid #f59e0b', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 5px 0' }}>Pending Leaves</p>
          <h2 style={{ fontSize: '2.2rem', margin: 0, color: 'var(--text-primary)' }}>{stats.pendingLeaves}</h2>
        </Link>
        <Link to="/leave" className="card" style={{ textDecoration: 'none', color: 'inherit', borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 5px 0' }}>Approved Leaves</p>
          <h2 style={{ fontSize: '2.2rem', margin: 0, color: 'var(--text-primary)' }}>{stats.approvedLeaves}</h2>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Department Distribution (Bar Chart) */}
        <div className="card">
          <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Staff Distribution by Department</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={deptData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} dy={10} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                <RechartsTooltip cursor={{fill: 'var(--icon-hover-bg)'}} contentStyle={{backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} formatter={(value) => [value, 'Employees']} labelFormatter={(label, data) => data.length ? data[0].payload.fullName : label} />
                <Bar dataKey="employees" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leave Requests Overview (Pie Chart) */}
        <div className="card">
          <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Leave Requests Breakdown</h3>
          <div style={{ height: '300px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {leaveData.filter(d => d.count > 0).length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No leave requests found.</p>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie 
                    data={leaveData.filter(d => d.count > 0)} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={70} 
                    outerRadius={110} 
                    paddingAngle={5} 
                    dataKey="count"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {leaveData.map((entry, index) => {
                      let color = '#2563eb';
                      if(entry.name === 'Approved') color = '#10b981';
                      if(entry.name === 'Pending') color = '#f59e0b';
                      if(entry.name === 'Denied') color = '#ef4444';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <RechartsTooltip contentStyle={{backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
