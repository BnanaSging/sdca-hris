import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import EmployeeProfileDetails from '../components/EmployeeProfileDetails';

// Positions allowed to view the full employee directory
const AUTHORIZED_POSITIONS = [
  'president',
  'vice president',
  'vice president for academic affairs (vpaa)',
  'vice president for academic affairs',
  'vice president for administration',
  'vice president for finance',
  'vp',
  'vpaa',
  'dean',
  'associate dean',
  'program chair / department head',
  'hr manager',
  'administrative officer',
  'school registrar',
];

function canViewDirectory(userData) {
  if (!userData) return false;
  const role = userData.role?.toLowerCase() || '';
  const pos = userData.position?.toLowerCase() || '';
  if (role === 'admin' || role === 'superadmin') return true;
  return AUTHORIZED_POSITIONS.includes(pos);
}

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function EmployeeDirectory() {
  const { currentUser, userData } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  const authorized = canViewDirectory(userData);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!authorized) { 
        setLoading(false); 
        return; 
      }
      try {
        const snap = await getDocs(collection(db, 'users'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setEmployees(list);
      } catch (err) {
        console.error('Error fetching employees:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [authorized]);

  const filtered = employees.filter(emp => {
    const q = search.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q) ||
      emp.position?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q)
    );
  });

  if (!authorized) {
    return (
      <div className="dashboard">
        <h1>Employee Directory</h1>
        <div className="emp-access-denied">
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
          <h2>Access Restricted</h2>
          <p>The employee directory is only accessible to Program Chairs and above.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Employee Directory</h1>
          <p style={{ marginBottom: 0 }}>Click a row to view full profile.</p>
        </div>
        <input
          type="text"
          placeholder="Search by name, department, position..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="emp-search-input"
        />
      </div>

      {loading ? <p>Loading employees...</p> : (
        <div className="card" style={{ marginTop: 0, overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th className="leave-th">Name</th>
                <th className="leave-th">Department</th>
                <th className="leave-th">Position</th>
                <th className="leave-th">Email</th>
                <th className="leave-th">Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '28px', textAlign: 'center', color: '#9ca3af' }}>No employees found.</td></tr>
              ) : filtered.map(emp => (
                <tr
                  key={emp.id}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                  onClick={() => setSelected(emp)}
                >
                  <td className="leave-td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="emp-avatar-sm">{getInitials(emp.name)}</div>
                      <span style={{ fontWeight: 600 }}>{emp.name}</span>
                      {emp.id === currentUser?.uid && <span className="leave-own-badge">You</span>}
                    </div>
                  </td>
                  <td className="leave-td">{emp.department || 'â€”'}</td>
                  <td className="leave-td">{emp.position || 'â€”'}</td>
                  <td className="leave-td" style={{ color: '#6b7280' }}>{emp.email}</td>
                  <td className="leave-td">
                    <span className="emp-role-badge" data-role={emp.role?.toLowerCase()}>
                      {emp.role || 'employee'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* â”€â”€ Employee Profile Modal â”€â”€ */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-card" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="emp-avatar-lg">{getInitials(selected.name)}</div>
                <div>
                  <h2 style={{ margin: 0 }}>{selected.name}</h2>
                  <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.88rem' }}>
                    {selected.position}{selected.department ? ` â€” ${selected.department}` : ''}
                  </p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}>Ã—</button>
            </div>
            <div className="modal-body">
              <div className="emp-profile-grid">
                <div className="modal-field">
                  <span className="modal-field-label">Email</span>
                  <span className="modal-field-value">{selected.email || 'â€”'}</span>
                </div>
                <div className="modal-field">
                  <span className="modal-field-label">Role</span>
                  <span className="modal-field-value" style={{ textTransform: 'capitalize' }}>{selected.role || 'employee'}</span>
                </div>
                <div className="modal-field">
                  <span className="modal-field-label">Department</span>
                  <span className="modal-field-value">{selected.department || 'â€”'}</span>
                </div>
                <div className="modal-field">
                  <span className="modal-field-label">Position</span>
                  <span className="modal-field-value">{selected.position || 'â€”'}</span>
                </div>
                <div className="modal-field">
                  <span className="modal-field-label">Gender</span>
                  <span className="modal-field-value" style={{ textTransform: 'capitalize' }}>{selected.gender || 'â€”'}</span>
                </div>
                <div className="modal-field">
                  <span className="modal-field-label">Birthday</span>
                  <span className="modal-field-value">{selected.birthday || 'â€”'}</span>
                </div>
                <div className="modal-field" style={{ gridColumn: '1 / -1' }}>
                  <span className="modal-field-label">Member Since</span>
                  <span className="modal-field-value">{selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : 'â€”'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

