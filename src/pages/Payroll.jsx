import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const STATUS_STYLE = {
  Generated: { background: '#dcfce7', color: '#166534' },
  Transferred: { background: '#dbeafe', color: '#1e40af' },
  Pending: { background: '#fef9c3', color: '#854d0e' },
};

const EXEC_POSITIONS = [
  'president', 'vp', 'vpaa', 'vice president',
  'vice president for academic affairs (vpaa)',
  'vice president for academic affairs',
  'vice president for administration', 'vice president for finance'
];

export default function Payroll() {
  const { currentUser, userData } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const position = userData?.position?.toLowerCase() || '';
  const isFinanceOrHR = userData?.department === 'Finance' || userData?.department === 'HR' || userData?.role === 'admin' || EXEC_POSITIONS.includes(position);

  // Form State
  const [formData, setFormData] = useState({
    userId: '',
    userName: '',
    period: '',
    baseSalary: 0,
    overtimeHours: 0,
    overtimeRate: 0,
    allowances: 0,
    deductions: 0,
    taxRate: 10,
  });

  const fetchData = useCallback(async () => {
    // setLoading is already initialized to true
    try {
      if (isFinanceOrHR) {
        // Fetch all payslips
        const snap = await getDocs(collection(db, 'payslips'));
        setPayslips(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        // Fetch users for dropdown
        const userSnap = await getDocs(collection(db, 'users'));
        setUsers(userSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        // Fetch own payslips
        const snap = await getDocs(query(collection(db, 'payslips'), where('userId', '==', currentUser.uid)));
        setPayslips(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isFinanceOrHR]);

  useEffect(() => {
    const load = async () => await fetchData();
    load();
  }, [fetchData]);

  const handleCalculate = () => {
    const base = parseFloat(formData.baseSalary) || 0;
    const ot = (parseFloat(formData.overtimeHours) || 0) * (parseFloat(formData.overtimeRate) || 0);
    const allow = parseFloat(formData.allowances) || 0;
    const ded = parseFloat(formData.deductions) || 0;
    const gross = base + ot + allow;
    const tax = gross * ((parseFloat(formData.taxRate) || 0) / 100);
    const net = gross - tax - ded;
    return { gross, tax, net, otPay: ot };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { gross, tax, net, otPay } = handleCalculate();
    try {
      const selectedUser = users.find(u => u.uid === formData.userId);
      const nameToStore = selectedUser ? (selectedUser.name || selectedUser.email) : formData.userName;
      
      const payslipObj = {
        userId: formData.userId,
        userName: nameToStore,
        period: formData.period,
        baseSalary: parseFloat(formData.baseSalary) || 0,
        overtimeHours: parseFloat(formData.overtimeHours) || 0,
        overtimeRate: parseFloat(formData.overtimeRate) || 0,
        overtimePay: otPay,
        allowances: parseFloat(formData.allowances) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        taxRate: parseFloat(formData.taxRate) || 0,
        taxAmount: tax,
        grossPay: gross,
        netPay: net,
        status: 'Generated',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'payslips'), payslipObj);
      await addDoc(collection(db, 'audit_logs'), {
        action: 'Payroll Generated',
        actorName: userData?.name || currentUser.email,
        details: `Generated payroll for ${nameToStore} (Period: ${formData.period})`,
        timestamp: new Date().toISOString()
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error('Error generating payroll', err);
      alert('Failed to generate payroll.');
    }
  };

  const handleBankTransfer = async (id, userName, netPay) => {
    if(!window.confirm(`Simulate bank transfer of Php ${netPay.toLocaleString()} to ${userName}?`)) return;
    try {
      // Typically, you call the bank integration API here
      await addDoc(collection(db, 'audit_logs'), {
        action: 'Bank Transfer Initiated',
        actorName: userData?.name || currentUser.email,
        details: `Bank transfer initiated for ${userName}. Amount: Php ${netPay.toLocaleString()}`,
        timestamp: new Date().toISOString()
      });
      alert(`Successfully simulated bank transfer for ${userName}!`);
      // Update status to 'Transferred' should happen here in a real scenario
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Payroll Management</h1>
          <p>{isFinanceOrHR ? 'Manage salaries, generate payslips, and integrate transfers.' : 'View your payslips and salary history.'}</p>
        </div>
        <div>
          {isFinanceOrHR && (
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              Process New Payroll
            </button>
          )}
          {isFinanceOrHR && (
            <button className="btn-primary" style={{ marginLeft: '10px', background: '#475569' }} onClick={() => alert('Generating aggregate payroll report...')}>
              Generate Report
            </button>
          )}
        </div>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="card" style={{ marginTop: '20px', overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {isFinanceOrHR && <th className="leave-th">Employee</th>}
                <th className="leave-th">Period</th>
                <th className="leave-th">Gross Pay</th>
                <th className="leave-th">Deductions & Tax</th>
                <th className="leave-th">Net Pay</th>
                <th className="leave-th">Status</th>
                <th className="leave-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '28px', textAlign: 'center', color: '#9ca3af' }}>No payroll records found.</td></tr>
              ) : payslips.map(ps => (
                <tr key={ps.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {isFinanceOrHR && <td className="leave-td" style={{ fontWeight: 600 }}>{ps.userName}</td>}
                  <td className="leave-td">{ps.period}</td>
                  <td className="leave-td">Php {ps.grossPay?.toLocaleString()}</td>
                  <td className="leave-td">Php {(ps.deductions + ps.taxAmount)?.toLocaleString()}</td>
                  <td className="leave-td" style={{ fontWeight: 'bold' }}>Php {ps.netPay?.toLocaleString()}</td>
                  <td className="leave-td">
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600,
                      ...STATUS_STYLE[ps.status] || STATUS_STYLE.Pending 
                    }}>
                      {ps.status}
                    </span>
                  </td>
                  <td className="leave-td">
                    <button className="leave-action-btn approve" onClick={() => setSelectedPayslip(ps)}>View / Print</button>
                    {isFinanceOrHR && ps.status !== 'Transferred' && (
                      <button className="leave-action-btn" style={{ marginLeft:'8px', background: '#3b82f6', color: '#fff' }} onClick={() => handleBankTransfer(ps.id, ps.userName, ps.netPay)}>Transfer</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- ADD PAYROLL MODAL --- */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Process Salary & Payslip</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label>Employee</label>
                <select className="form-input" style={{ width: '100%' }} value={formData.userId} onChange={e => setFormData({...formData, userId: e.target.value})} required>
                  <option value="">-- Select Employee --</option>
                  {users.map(u => <option key={u.uid} value={u.uid}>{u.name || u.email} ({u.department})</option>)}
                </select>
              </div>
              <div>
                <label>Payroll Period</label>
                <input type="month" className="form-input" style={{ width: '100%' }} value={formData.period} onChange={e => setFormData({...formData, period: e.target.value})} required />
              </div>
              <div>
                <label>Base Salary (Php)</label>
                <input type="number" className="form-input" style={{ width: '100%' }} value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: e.target.value})} />
              </div>
              <div>
                <label>Overtime Hours</label>
                <input type="number" className="form-input" style={{ width: '100%' }} value={formData.overtimeHours} onChange={e => setFormData({...formData, overtimeHours: e.target.value})} />
              </div>
              <div>
                <label>Overtime Rate/Hr (Php)</label>
                <input type="number" className="form-input" style={{ width: '100%' }} value={formData.overtimeRate} onChange={e => setFormData({...formData, overtimeRate: e.target.value})} />
              </div>
              <div>
                <label>Allowances (Php)</label>
                <input type="number" className="form-input" style={{ width: '100%' }} value={formData.allowances} onChange={e => setFormData({...formData, allowances: e.target.value})} />
              </div>
              <div>
                <label>Other Deductions (Php)</label>
                <input type="number" className="form-input" style={{ width: '100%' }} value={formData.deductions} onChange={e => setFormData({...formData, deductions: e.target.value})} />
              </div>
              <div>
                <label>Tax Rate (%)</label>
                <input type="number" className="form-input" style={{ width: '100%' }} value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: e.target.value})} />
              </div>

              <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Computation Preview</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                  <span>Overtime Pay:</span> <span>Php {handleCalculate().otPay.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                  <span>Gross Pay:</span> <span>Php {handleCalculate().gross.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px', color: '#991b1b' }}>
                  <span>Taxes ({formData.taxRate}%):</span> <span>- Php {handleCalculate().tax.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #cbd5e1' }}>
                  <span>Net Pay:</span> <span>Php {handleCalculate().net.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" style={{ width: '100%' }} onClick={handleSubmit}>Generate Payslip</button>
            </div>
          </div>
        </div>
      )}

      {/* --- VIEW PAYSLIP MODAL --- */}
      {selectedPayslip && (
        <div className="modal-overlay" onClick={() => setSelectedPayslip(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} id="payslip-print-area">
            <div className="modal-header">
              <h2>Payslip Details</h2>
              <button className="modal-close" onClick={() => setSelectedPayslip(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>San Diego College - HRIS</h3>
                <p style={{ margin: 0, color: '#64748b' }}>Payslip for the period of {selectedPayslip.period}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: '20px' }}>
                <div><strong>Employee:</strong> {selectedPayslip.userName}</div>
                <div><strong>Status:</strong> {selectedPayslip.status}</div>
                <div><strong>Date Generated:</strong> {new Date(selectedPayslip.createdAt).toLocaleDateString()}</div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '8px 0' }}>Base Salary</td><td style={{ textAlign: 'right' }}>Php {selectedPayslip.baseSalary?.toLocaleString()}</td></tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '8px 0' }}>Overtime Pay ({selectedPayslip.overtimeHours} hrs)</td><td style={{ textAlign: 'right' }}>Php {selectedPayslip.overtimePay?.toLocaleString()}</td></tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '8px 0' }}>Allowances</td><td style={{ textAlign: 'right' }}>Php {selectedPayslip.allowances?.toLocaleString()}</td></tr>
                  <tr style={{ borderBottom: '2px solid #cbd5e1', fontWeight: 'bold' }}><td style={{ padding: '8px 0' }}>Gross Pay</td><td style={{ textAlign: 'right' }}>Php {selectedPayslip.grossPay?.toLocaleString()}</td></tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '8px 0', color: '#991b1b' }}>Deductions</td><td style={{ textAlign: 'right', color: '#991b1b' }}>- Php {selectedPayslip.deductions?.toLocaleString()}</td></tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '8px 0', color: '#991b1b' }}>Taxes ({selectedPayslip.taxRate}%)</td><td style={{ textAlign: 'right', color: '#991b1b' }}>- Php {selectedPayslip.taxAmount?.toLocaleString()}</td></tr>
                  <tr style={{ fontSize: '1.2rem', fontWeight: 'bold' }}><td style={{ padding: '12px 0' }}>NET PAY</td><td style={{ textAlign: 'right' }}>Php {selectedPayslip.netPay?.toLocaleString()}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => window.print()}>Print Payslip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}