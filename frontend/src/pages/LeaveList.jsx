import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where, updateDoc, doc, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const STATUS_STYLE = {
  Approved: { background: '#dcfce7', color: '#166534' },
  Denied:   { background: '#fee2e2', color: '#991b1b' },
  Pending:  { background: '#fef9c3', color: '#854d0e' },
};

const EXEC_POSITIONS = [
  'president',
  'vp',
  'vpaa',
  'vice president',
  'vice president for academic affairs (vpaa)',
  'vice president for academic affairs',
  'vice president for administration',
  'vice president for finance',
];

export default function LeaveList() {
  const { currentUser, userData } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const position = userData?.position?.toLowerCase() || '';
  const isAdmin = userData?.role?.toLowerCase() === 'admin' ||
    userData?.position?.toLowerCase() === 'admin' ||
    EXEC_POSITIONS.includes(position);

  const isITHead = userData?.department === 'IT' && 
    (position === 'it officer' || position.includes('director') || position.includes('head') || position.includes('chair'));

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      let results = [];
      if (isAdmin) {
        // Admin sees everything
        const snap = await getDocs(collection(db, 'leaves'));
        results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } else {
        // Own leaves
        const mySnap = await getDocs(query(collection(db, 'leaves'), where('userId', '==', currentUser.uid)));
        results = mySnap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Subordinate leaves (supervisorId stored on each leave at submission time)
        const subSnap = await getDocs(query(collection(db, 'leaves'), where('supervisorId', '==', currentUser.uid)));
        const subLeaves = subSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(l => l.userId !== currentUser.uid);
        
        let itLeaves = [];
        if (isITHead) {
          const itSnap = await getDocs(query(collection(db, 'leaves'), where('userDepartment', '==', 'IT')));
          itLeaves = itSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(l => l.userId !== currentUser.uid);
        }

        results = [...results, ...subLeaves, ...itLeaves];

        // Ensure no duplicates
        const uniqueResults = [];
        const seen = new Set();
        for (const l of results) {
          if (!seen.has(l.id)) {
            seen.add(l.id);
            uniqueResults.push(l);
          }
        }
        results = uniqueResults;
      }
      results.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
      setLeaves(results);
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isAdmin, isITHead]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleUpdateStatus = async (leaveId, newStatus, leave) => {
    try {
      await updateDoc(doc(db, 'leaves', leaveId), { status: newStatus, updatedAt: new Date().toISOString(), updatedBy: currentUser.uid });
      await addDoc(collection(db, 'audit_logs'), {
        action: `Leave ${newStatus}`,
        actorName: userData?.name || currentUser.email,
        details: `${leave.leaveType} leave for ${leave.userName} was ${newStatus.toLowerCase()}.`,
        timestamp: new Date().toISOString(),
      });
      // Create leave approval notification for the employee
      await addDoc(collection(db, 'notifications'), {
        userId: leave.userId,
        type: 'leave_approval',
        title: `Leave ${newStatus}`,
        message: `Your ${leave.leaveType} leave request (${leave.startDate} → ${leave.endDate}) has been ${newStatus.toLowerCase()}.`,
        read: false,
        createdAt: new Date().toISOString(),
        relatedId: leaveId,
      });
      setSelected(null);
      fetchLeaves();
    } catch (err) {
      console.error('Error updating leave:', err);
    }
  };

  // Only admin/exec, the assigned supervisor, or the IT Head (for IT department) can approve/deny
  const canApprove = (leave) => {
    if (isAdmin) return true;
    if (leave.userDepartment === 'IT') return isITHead;
    return leave.supervisorId === currentUser.uid;
  };

  const hasSubordinates = leaves.some(l => l.userId !== currentUser.uid);

  return (
    <div className="dashboard">
      <h1>Leave Management</h1>
      <p>{isAdmin ? 'All employee leave requests.' : hasSubordinates ? 'Your leave history and requests from your subordinates.' : 'Your leave history.'}</p>

      {loading ? <p>Loading...</p> : (
        <div className="card" style={{ marginTop: '20px', overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th className="leave-th">Employee</th>
                <th className="leave-th">Type</th>
                <th className="leave-th">Dates</th>
                <th className="leave-th">Days</th>
                <th className="leave-th">Status</th>
                <th className="leave-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '28px', textAlign: 'center', color: '#9ca3af' }}>No leave requests found.</td></tr>
              ) : leaves.map(leave => (
                <tr
                  key={leave.id}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                  onClick={() => setSelected(leave)}
                >
                  <td className="leave-td">
                    <span style={{ fontWeight: 600 }}>{leave.userName}</span>
                    {leave.userId === currentUser.uid && <span className="leave-own-badge">You</span>}
                  </td>
                  <td className="leave-td">{leave.leaveType}</td>
                  <td className="leave-td" style={{ whiteSpace: 'nowrap' }}>{leave.startDate} → {leave.endDate}</td>
                  <td className="leave-td" style={{ textAlign: 'center' }}>{leave.leaveDays ?? '—'}</td>
                  <td className="leave-td">
                    <span className="leave-status-badge" style={STATUS_STYLE[leave.status] || STATUS_STYLE.Pending}>{leave.status}</span>
                  </td>
                  <td className="leave-td" onClick={e => e.stopPropagation()}>
                    {leave.status === 'Pending' && canApprove(leave) && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="leave-action-btn approve" onClick={() => handleUpdateStatus(leave.id, 'Approved', leave)}>Approve</button>
                        <button className="leave-action-btn deny" onClick={() => handleUpdateStatus(leave.id, 'Denied', leave)}>Deny</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Leave Detail Modal ── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ margin: 0 }}>{selected.leaveType} Leave</h2>
                <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.88rem' }}>
                  Submitted by <strong>{selected.userName}</strong>
                  {selected.userPosition && ` — ${selected.userPosition}`}
                  {selected.userDepartment && `, ${selected.userDepartment}`}
                </p>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-grid">
                <div className="modal-field">
                  <span className="modal-field-label">Start Date</span>
                  <span className="modal-field-value">{selected.startDate}</span>
                </div>
                <div className="modal-field">
                  <span className="modal-field-label">End Date</span>
                  <span className="modal-field-value">{selected.endDate}</span>
                </div>
                <div className="modal-field">
                  <span className="modal-field-label">Duration</span>
                  <span className="modal-field-value">{selected.leaveDays ?? '—'} day{selected.leaveDays !== 1 ? 's' : ''}</span>
                </div>
                <div className="modal-field">
                  <span className="modal-field-label">Status</span>
                  <span className="leave-status-badge" style={STATUS_STYLE[selected.status] || STATUS_STYLE.Pending}>{selected.status}</span>
                </div>
                <div className="modal-field">
                  <span className="modal-field-label">Filed On</span>
                  <span className="modal-field-value">{selected.requestedAt ? new Date(selected.requestedAt).toLocaleString() : '—'}</span>
                </div>
              </div>

              <div className="modal-field" style={{ marginTop: 16 }}>
                <span className="modal-field-label">Reason</span>
                <p className="modal-reason">{selected.reason || '—'}</p>
              </div>

              {selected.contactNumber && (
                <div className="modal-field" style={{ marginTop: 12 }}>
                  <span className="modal-field-label">Contact While on Leave</span>
                  <span className="modal-field-value">{selected.contactNumber}</span>
                </div>
              )}

              {selected.workHandover && (
                <div className="modal-field" style={{ marginTop: 12 }}>
                  <span className="modal-field-label">Work Handover / Coverage</span>
                  <p className="modal-reason">{selected.workHandover}</p>
                </div>
              )}

              {selected.leaveType === 'Sick' && (
                <div className="modal-medcert-box">
                  <span className="modal-field-label">Medical Certificate</span>
                  {selected.medCertUrl ? (
                    <a href={selected.medCertUrl} target="_blank" rel="noreferrer" className="modal-medcert-link">
                      View / Download — {selected.medCertFileName || 'Medical Certificate'}
                    </a>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '0.88rem' }}>No medical certificate attached.</span>
                  )}
                </div>
              )}
            </div>

            {selected.status === 'Pending' && canApprove(selected) && (
              <div className="modal-footer">
                <button
                  className="leave-action-btn approve"
                  style={{ padding: '10px 28px', fontSize: '0.92rem' }}
                  onClick={() => handleUpdateStatus(selected.id, 'Approved', selected)}
                >
                  Approve
                </button>
                <button
                  className="leave-action-btn deny"
                  style={{ padding: '10px 28px', fontSize: '0.92rem' }}
                  onClick={() => handleUpdateStatus(selected.id, 'Denied', selected)}
                >
                  Deny
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
