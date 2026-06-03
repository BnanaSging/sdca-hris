import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search states
  const [searchDate, setSearchDate] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchDept, setSearchDept] = useState('');
  const [searchPos, setSearchPos] = useState('');

  useEffect(() => {
    const fetchLogsAndUsers = async () => {
      try {
        const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const logList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const uSnap = await getDocs(collection(db, 'users'));
        const uList = uSnap.docs.map(doc => doc.data());
        
        setLogs(logList);
        setUsers(uList);
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogsAndUsers();
  }, []);

  const getLogUser = (name) => {
    return users.find(u => (u.name || '') === name || (u.email || '') === name) || {};
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const uName = log.performedBy || log.actorName || 'System';
      const userMatched = getLogUser(uName);
      
      const logDept = (userMatched.department || '').toLowerCase();
      const logPos = (userMatched.position || '').toLowerCase();
      
      let formattedDate = '';
      if (log.timestamp) {
        if (typeof log.timestamp.toDate === 'function') {
          formattedDate = log.timestamp.toDate().toISOString().split('T')[0];
        } else {
          formattedDate = new Date(log.timestamp).toISOString().split('T')[0];
        }
      }

      const matchDate = searchDate ? formattedDate === searchDate : true;
      const matchName = searchName ? uName.toLowerCase().includes(searchName.toLowerCase()) : true;
      const matchDept = searchDept ? logDept.includes(searchDept.toLowerCase()) : true;
      const matchPos = searchPos ? logPos.includes(searchPos.toLowerCase()) : true;

      return matchDate && matchName && matchDept && matchPos;
    });
  }, [logs, searchDate, searchName, searchDept, searchPos, users]);

  const exportCSV = () => {
    if (filteredLogs.length === 0) return alert('No logs to export.');

    const headers = ['Timestamp', 'Action', 'User', 'Department', 'Position', 'Details'];
    const rows = filteredLogs.map(log => {
      const uName = log.performedBy || log.actorName || 'System';
      const userMatched = getLogUser(uName);
      
      let formattedDate = 'Invalid Date';
      if (log.timestamp) {
        if (typeof log.timestamp.toDate === 'function') {
          formattedDate = log.timestamp.toDate().toLocaleString();
        } else {
          formattedDate = new Date(log.timestamp).toLocaleString();
        }
      }
      
      const dept = userMatched.department || 'N/A';
      const pos = userMatched.position || 'N/A';
      const details = log.details ? log.details.replace(/"/g, '""') : '';

      return " + formattedDate + ", " + log.action + ", " + uName + ", " + dept + ", " + pos + ", " + details + ";
    });

    const csvContent = headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Audit_Logs_Export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h1>Audit Logs</h1>
          <p>System activity log for tracking changes.</p>
        </div>
        <button onClick={exportCSV} className="btn-primary" style={{ marginTop: '20px' }}>
          Export as CSV
        </button>
      </div>

      <div className="card" style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Date</label>
          <input 
            type="date" 
            className="leave-input" style={{ marginTop: '5px' }} 
            value={searchDate} 
            onChange={e => setSearchDate(e.target.value)} 
          />
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Name</label>
          <input 
            type="text" 
            placeholder="Search by name" 
            className="leave-input" style={{ marginTop: '5px' }} 
            value={searchName} 
            onChange={e => setSearchName(e.target.value)} 
          />
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Department</label>
          <input 
            type="text" 
            placeholder="Search by dept." 
            className="leave-input" style={{ marginTop: '5px' }} 
            value={searchDept} 
            onChange={e => setSearchDept(e.target.value)} 
          />
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Position</label>
          <input 
            type="text" 
            placeholder="Search by position" 
            className="leave-input" style={{ marginTop: '5px' }} 
            value={searchPos} 
            onChange={e => setSearchPos(e.target.value)} 
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button 
            className="btn-secondary" style={{ marginBottom: '5px' }} 
            onClick={() => { setSearchDate(''); setSearchName(''); setSearchDept(''); setSearchPos(''); }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading logs...</p>
      ) : (
        <div className="card" style={{ marginTop: '20px', overflowX: 'auto', padding: 0 }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: '600' }}>Timestamp</th>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: '600' }}>Action</th>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: '600' }}>User / Affected</th>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: '600' }}>Department</th>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: '600' }}>Position</th>
                <th style={{ padding: '12px 14px', color: '#6b7280', fontWeight: '600' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>No logs match your search.</td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  let formattedDate = 'Invalid Date';
                  if (log.timestamp) {
                    if (typeof log.timestamp.toDate === 'function') {
                      formattedDate = log.timestamp.toDate().toLocaleString();
                    } else {
                      formattedDate = new Date(log.timestamp).toLocaleString();
                    }
                  }
                  
                  const uName = log.performedBy || log.actorName || 'System';
                  const userMatched = getLogUser(uName);

                  return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{formattedDate}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontWeight: '600', color: '#374151' }}>{log.action}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '500' }}>{uName}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{userMatched.department || '—'}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{userMatched.position || '—'}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{log.details}</td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}



