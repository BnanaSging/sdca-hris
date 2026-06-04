import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export default function OrgStructure() {
  const [activeTab, setActiveTab] = useState('chart');
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ id: null, name: '', manager: '' });

  const [showPosModal, setShowPosModal] = useState(false);
  const [posForm, setPosForm] = useState({ id: null, title: '', department: '', level: '' });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [usersSnap, deptsSnap, posSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'departments')),
        getDocs(collection(db, 'positions'))
      ]);

      setEmployees(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setDepartments(deptsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPositions(posSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching org data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDept = async (e) => {
    e.preventDefault();
    if (!deptForm.name) return alert("Department Name is required");
    try {
      if (deptForm.id) {
        await updateDoc(doc(db, 'departments', deptForm.id), {
          name: deptForm.name,
          manager: deptForm.manager
        });
      } else {
        await addDoc(collection(db, 'departments'), {
          name: deptForm.name,
          manager: deptForm.manager
        });
      }
      setShowDeptModal(false);
      fetchData();
    } catch (error) {
      console.error("Error saving dept", error);
    }
  };

  const handleSavePos = async (e) => {
    e.preventDefault();
    if (!posForm.title) return alert("Position Title is required");
    try {
      if (posForm.id) {
        await updateDoc(doc(db, 'positions', posForm.id), {
          title: posForm.title,
          department: posForm.department,
          level: posForm.level
        });
      } else {
        await addDoc(collection(db, 'positions'), {
          title: posForm.title,
          department: posForm.department,
          level: posForm.level
        });
      }
      setShowPosModal(false);
      fetchData();
    } catch (error) {
      console.error("Error saving pos", error);
    }
  };

  const handleDeleteDept = async (id) => {
    if(window.confirm('Are you sure you want to delete this department?')) {
      await deleteDoc(doc(db, 'departments', id));
      fetchData();
    }
  };

  const handleDeletePos = async (id) => {
    if(window.confirm('Are you sure you want to delete this position?')) {
      await deleteDoc(doc(db, 'positions', id));
      fetchData();
    }
  };

  const getEmployeeCount = (deptName) => {
    return employees.filter(e => e.department === deptName).length;
  };

  const groupedTree = {};
  employees.forEach(e => {
    const dept = e.department || 'Unassigned';
    if (!groupedTree[dept]) groupedTree[dept] = [];
    groupedTree[dept].push(e);
  });

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Organization Structure</h1>
          <p>View and manage company departments and roles.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px', marginBottom: '20px' }}>
        <button 
          className={activeTab === 'chart' ? "btn-primary" : "btn-secondary"} 
          onClick={() => setActiveTab('chart')}
        >
          Org Chart View
        </button>
        <button 
          className={activeTab === 'departments' ? "btn-primary" : "btn-secondary"} 
          onClick={() => setActiveTab('departments')}
        >
          Departments
        </button>
        <button 
          className={activeTab === 'positions' ? "btn-primary" : "btn-secondary"} 
          onClick={() => setActiveTab('positions')}
        >
          Positions Data
        </button>
      </div>

      {loading ? (
        <p>Loading Organization Data...</p>
      ) : (
        <>
          {activeTab === 'chart' && (
            <div className="card" style={{ padding: '30px', minHeight: '500px' }}>
              <h3 style={{ marginBottom: '20px' }}>Company Hierarchy</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {Object.keys(groupedTree).map(dept => (
                  <div key={dept} className="org-dept-card">
                    <h4 className="org-dept-title">
                      {dept} <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 'normal' }}>({groupedTree[dept].length} employees)</span>
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                      {groupedTree[dept].map(emp => (
                        <div key={emp.id} className="org-emp-card">
                          <div className="org-emp-name">{emp.name}</div>
                          <div className="org-emp-title">{emp.position || 'No Title'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'departments' && (
            <div className="card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <h3>Department Management</h3>
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      setDeptForm({ id: null, name: '', manager: '' });
                      setShowDeptModal(true);
                    }}
                  >+ Add Department</button>
                </div>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px' }}>Department Name</th>
                      <th style={{ padding: '12px' }}>Head / Manager</th>
                      <th style={{ padding: '12px' }}>Employee Count</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                          No departments defined. (You can create them here!)
                        </td>
                      </tr>
                    ) : (
                      departments.map(d => (
                        <tr key={d.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold' }}>{d.name}</td>
                          <td style={{ padding: '12px' }}>{d.manager || 'Unassigned'}</td>
                          <td style={{ padding: '12px' }}>{getEmployeeCount(d.name)}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button className="leave-action-btn" style={{ background: '#eff6ff', color: '#2563eb', marginRight: '5px' }} onClick={() => { setDeptForm(d); setShowDeptModal(true); }}>Edit</button>
                            <button className="leave-action-btn deny" onClick={() => handleDeleteDept(d.id)}>Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'positions' && (
            <div className="card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <h3>Position Management</h3>
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      setPosForm({ id: null, title: '', department: '', level: '' });
                      setShowPosModal(true);
                    }}
                  >+ Add Position</button>
                </div>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px' }}>Title</th>
                      <th style={{ padding: '12px' }}>Department</th>
                      <th style={{ padding: '12px' }}>Level / Tier</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                          No positions defined. (You can create them here!)
                        </td>
                      </tr>
                    ) : (
                      positions.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold' }}>{p.title}</td>
                          <td style={{ padding: '12px' }}>{p.department || 'Any'}</td>
                          <td style={{ padding: '12px' }}>{p.level || 'Standard'}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button className="leave-action-btn" style={{ background: '#eff6ff', color: '#2563eb', marginRight: '5px' }} onClick={() => { setPosForm(p); setShowPosModal(true); }}>Edit</button>
                            <button className="leave-action-btn deny" onClick={() => handleDeletePos(p.id)}>Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dept Modal */}
      {showDeptModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{deptForm.id ? 'Edit Department' : 'Add Department'}</h3>
              <button className="modal-close" onClick={() => setShowDeptModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveDept}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="modal-field">
                  <label className="modal-field-label">Department Name</label>
                  <input required className="leave-input" value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} placeholder="e.g. Finance" />
                </div>
                <div className="modal-field">
                  <label className="modal-field-label">Manager</label>
                  <input className="leave-input" value={deptForm.manager} onChange={e => setDeptForm({...deptForm, manager: e.target.value})} placeholder="e.g. John Doe" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowDeptModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pos Modal */}
      {showPosModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{posForm.id ? 'Edit Position' : 'Add Position'}</h3>
              <button className="modal-close" onClick={() => setShowPosModal(false)}>×</button>
            </div>
            <form onSubmit={handleSavePos}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="modal-field">
                  <label className="modal-field-label">Job Title</label>
                  <input required className="leave-input" value={posForm.title} onChange={e => setPosForm({...posForm, title: e.target.value})} placeholder="e.g. Software Engineer" />
                </div>
                <div className="modal-field">
                  <label className="modal-field-label">Department</label>
                  <select className="leave-select" value={posForm.department} onChange={e => setPosForm({...posForm, department: e.target.value})}>
                    <option value="">Any / Not Specified</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-field">
                  <label className="modal-field-label">Level / Tier</label>
                  <input className="leave-input" value={posForm.level} onChange={e => setPosForm({...posForm, level: e.target.value})} placeholder="e.g. Senior, Junior, Management" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowPosModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}


