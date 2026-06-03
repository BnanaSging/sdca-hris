import React, { useState, useMemo } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

// Positions that are self-approving (no supervisor above them)
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

const LEAVE_INFO = {
  Vacation: {
    icon: '',
    color: '#0ea5e9',
    bg: '#f0f9ff',
    border: '#bae6fd',
    description: 'For planned rest, travel, or personal activities.',
    policy: 'Must be filed at least 3 days before the start date.',
  },
  Sick: {
    icon: '',
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
    description: 'For illness or medical appointments.',
    policy: 'Medical certificate required if absence exceeds 2 consecutive days.',
  },
  Maternity: {
    icon: '',
    color: '#ec4899',
    bg: '#fdf2f8',
    border: '#fbcfe8',
    description: 'For employees who are pregnant and eligible under company policy.',
    policy: 'Governed by company policy and applicable labor laws.',
  },
  Paternity: {
    icon: '',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    description: 'For employees whose spouse has given birth.',
    policy: 'Governed by company policy and applicable labor laws.',
  },
  Birthday: {
    icon: '',
    color: '#f97316',
    bg: '#fff7ed',
    border: '#fed7aa',
    description: 'Celebrate your birthday with a day off!',
    policy: 'May be taken on any day within your birth month.',
  },
};

export default function ApplyLeave() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    contactNumber: '',
    workHandover: '',
  });
  const [medCertFile, setMedCertFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const availableLeaveTypes = useMemo(() => {
    const types = [
      { value: 'Vacation', label: 'Vacation Leave' },
      { value: 'Sick', label: 'Sick Leave' },
    ];
    const gender = userData?.gender?.toLowerCase();
    if (gender === 'female') types.push({ value: 'Maternity', label: 'Maternity Leave' });
    if (gender === 'male') types.push({ value: 'Paternity', label: 'Paternity Leave' });
    if (userData?.birthday) {
      const birthMonth = parseInt(userData.birthday.split('-')[1]) - 1;
      if (new Date().getMonth() === birthMonth) {
        types.push({ value: 'Birthday', label: 'Birthday Leave' });
      }
    }
    return types;
  }, [userData]);

  const leaveDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const diff =
      (new Date(formData.endDate + 'T00:00:00') - new Date(formData.startDate + 'T00:00:00')) /
      86400000;
    return diff >= 0 ? diff + 1 : 0;
  }, [formData.startDate, formData.endDate]);

  const requiresMedCert = formData.leaveType === 'Sick' && leaveDays > 2;
  const selectedInfo = LEAVE_INFO[formData.leaveType];
  const isExec = EXEC_POSITIONS.includes(userData?.position?.toLowerCase() || '');

  const vacationMinDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  }, []);
  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'leaveType') {
      setMedCertFile(null);
      setError('');
    }
  };

  const validate = () => {
    if (!formData.leaveType) return 'Please select a leave type.';
    if (!formData.startDate || !formData.endDate) return 'Please select both start and end dates.';
    if (!formData.reason.trim()) return 'Please provide a reason for your leave.';
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const start = new Date(formData.startDate + 'T00:00:00');
    const end = new Date(formData.endDate + 'T00:00:00');
    if (end < start) return 'End date cannot be before the start date.';
    if (formData.leaveType === 'Vacation') {
      const diffDays = (start - todayDate) / 86400000;
      if (diffDays < 3)
        return 'Vacation leave must be filed at least 3 days before the intended start date.';
    }
    if (requiresMedCert && !medCertFile) {
      return 'A Medical Certificate is required for sick leave exceeding 2 consecutive days.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);
    try {
      setLoading(true);
      setError('');
      const status = isExec ? 'Approved' : 'Pending';
      let medCertUrl = null,
        medCertFileName = null;
      if (medCertFile) {
        const fileRef = ref(
          storage,
          `med_certs/${currentUser.uid}_${Date.now()}_${medCertFile.name}`
        );
        await uploadBytes(fileRef, medCertFile);
        medCertUrl = await getDownloadURL(fileRef);
        medCertFileName = medCertFile.name;
      }
      await addDoc(collection(db, 'leaves'), {
        userId: currentUser.uid,
        userName: userData?.name || currentUser.email,
        userPosition: userData?.position || '',
        userDepartment: userData?.department || '',
        supervisorId: userData?.supervisorId || null,
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        leaveDays,
        reason: formData.reason,
        contactNumber: formData.contactNumber,
        workHandover: formData.workHandover,
        status,
        medCertUrl,
        medCertFileName,
        requestedAt: new Date().toISOString(),
      });
      await addDoc(collection(db, 'audit_logs'), {
        action: isExec ? 'Leave Auto-Approved (Executive)' : 'Applied for Leave',
        actorName: userData?.name || currentUser.email,
        details: `${formData.leaveType} leave from ${formData.startDate} to ${formData.endDate} (${leaveDays} day${leaveDays !== 1 ? 's' : ''}). Status: ${status}.`,
        timestamp: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError('Failed to submit leave request. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Success State ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="dashboard">
        <div className="leave-success-card">
          <div className="leave-success-icon">{isExec ? '' : ''}</div>
          <h2>{isExec ? 'Leave Automatically Approved!' : 'Request Submitted!'}</h2>
          <p>
            {isExec
              ? 'As an executive, your leave has been automatically approved.'
              : 'Your leave request has been submitted and is pending approval from your supervisor.'}
          </p>
          <div className="leave-success-summary">
            <div className="leave-success-row">
              <span>Type</span>
              <strong>
                {formData.leaveType} Leave
              </strong>
            </div>
            <div className="leave-success-row">
              <span>From</span>
              <strong>{formData.startDate}</strong>
            </div>
            <div className="leave-success-row">
              <span>To</span>
              <strong>{formData.endDate}</strong>
            </div>
            <div className="leave-success-row">
              <span>Duration</span>
              <strong>
                {leaveDays} day{leaveDays !== 1 ? 's' : ''}
              </strong>
            </div>
          </div>
          <div className="leave-success-actions">
            <button className="leave-submit-btn" onClick={() => navigate('/leave')}>
              View My Leaves
            </button>
            <button
              className="leave-submit-btn leave-btn-secondary"
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  leaveType: '',
                  startDate: '',
                  endDate: '',
                  reason: '',
                  contactNumber: '',
                  workHandover: '',
                });
                setMedCertFile(null);
              }}
            >
              Apply Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Form ──────────────────────────────────────────────────────────────
  return (
    <div className="dashboard">
      {/* Page Header */}
      <div className="leave-page-header">
        <div>
          <h1 style={{ marginBottom: 4 }}>Apply for Leave</h1>
          <p style={{ marginBottom: 0 }}>
            Filing as <strong>{userData?.name}</strong> &bull; {userData?.position},{' '}
            {userData?.department}
            {isExec && <span className="leave-exec-badge">Executive — Auto-Approved</span>}
          </p>
        </div>
        <Link to="/leave" className="leave-back-link">
          ← Back to Leave List
        </Link>
      </div>

      <div className="leave-form-layout">
        {/* ── Left: Form ── */}
        <div className="leave-form-card">
          {error && <div className="leave-error">{error}</div>}
          <form onSubmit={handleSubmit}>

            {/* Step 1: Leave Type */}
            <div className="leave-section-title">
              <span className="leave-step-badge">1</span> Leave Type
            </div>
            <div className="leave-type-grid">
              {availableLeaveTypes.map((t) => {
                const info = LEAVE_INFO[t.value];
                const active = formData.leaveType === t.value;
                return (
                  <button
                    type="button"
                    key={t.value}
                    className={`leave-type-card${active ? ' active' : ''}`}
                    style={active ? { borderColor: info.color, background: info.bg } : {}}
                    onClick={() =>
                      handleChange({ target: { name: 'leaveType', value: t.value } })
                    }
                  >
                    <span className="leave-type-label">{t.label}</span>
                    {active && (
                      <span className="leave-type-check" style={{ color: info.color }}>
                        &#10003;
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedInfo && (
              <div
                className="leave-policy-notice"
                style={{ borderLeftColor: selectedInfo.color, background: selectedInfo.bg }}
              >
                <strong style={{ color: selectedInfo.color }}>
                  {formData.leaveType} Leave
                </strong>
                <p>{selectedInfo.description}</p>
                <p className="leave-policy-rule">Policy: {selectedInfo.policy}</p>
              </div>
            )}

            {/* Step 2: Dates */}
            <div className="leave-section-title" style={{ marginTop: 28 }}>
              <span className="leave-step-badge">2</span> Leave Duration
            </div>
            <div className="leave-date-grid">
              <div className="leave-form-group">
                <label className="leave-label">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="leave-input"
                  min={formData.leaveType === 'Vacation' ? vacationMinDate : today}
                  required
                />
              </div>
              <div className="leave-form-group">
                <label className="leave-label">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="leave-input"
                  min={formData.startDate || today}
                  required
                />
              </div>
            </div>
            {leaveDays > 0 && (
              <div className="leave-duration-summary">
                <span>
                  <strong>{leaveDays}</strong> day{leaveDays !== 1 ? 's' : ''} of leave
                </span>
                <span className="leave-duration-range">
                  {formData.startDate} → {formData.endDate}
                </span>
              </div>
            )}

            {/* Step 3: Details */}
            <div className="leave-section-title" style={{ marginTop: 28 }}>
              <span className="leave-step-badge">3</span> Details
            </div>

            <div className="leave-form-group">
              <label className="leave-label">
                Reason for Leave <span className="leave-required">*</span>
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows={4}
                className="leave-textarea"
                placeholder={
                  formData.leaveType === 'Sick'
                    ? 'Describe your illness or medical condition...'
                    : formData.leaveType === 'Vacation'
                    ? 'Describe your plans (e.g., family vacation, rest, travel)...'
                    : 'Explain the reason for your leave request...'
                }
                required
              />
              <span className="leave-char-count">{formData.reason.length} characters</span>
            </div>

            <div className="leave-form-group">
              <label className="leave-label">
                Contact Number While on Leave{' '}
                <span className="leave-optional">(optional)</span>
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                className="leave-input"
                placeholder="e.g. 09XX-XXX-XXXX"
              />
            </div>

            <div className="leave-form-group">
              <label className="leave-label">
                Work Handover / Coverage Plan{' '}
                <span className="leave-optional">(optional)</span>
              </label>
              <textarea
                name="workHandover"
                value={formData.workHandover}
                onChange={handleChange}
                rows={3}
                className="leave-textarea"
                placeholder="Who will handle your tasks? Any pending deadlines or responsibilities to note..."
              />
            </div>

            {/* Medical Certificate Upload */}
            {requiresMedCert && (
              <div className="leave-form-group leave-medcert-box">
                <label className="leave-label">
                  Medical Certificate <span className="leave-required">* Required</span>
                </label>
                <p className="leave-medcert-hint">
                  Since your sick leave exceeds 2 consecutive days, a Medical Certificate is
                  mandatory. Upload a scan or photo (PDF, JPG, or PNG).
                </p>
                <input
                  type="file"
                  id="medCert"
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  onChange={(e) => setMedCertFile(e.target.files[0] || null)}
                />
                {medCertFile ? (
                  <div className="leave-file-preview">
                    <span>{medCertFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setMedCertFile(null)}
                      className="leave-upload-clear"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label htmlFor="medCert" className="leave-upload-dropzone">
                    <span style={{ fontSize: '1.8rem' }}>+</span>
                    <span>Click to choose file</span>
                    <span className="leave-dropzone-hint">PDF, JPG, or PNG</span>
                  </label>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !formData.leaveType}
              className="leave-submit-btn"
            >
              {loading
                ? 'Submitting...'
                : isExec
                ? 'Submit & Auto-Approve'
                : 'Submit Leave Request'}
            </button>
          </form>
        </div>

        {/* ── Right: Summary Sidebar ── */}
        <aside className="leave-sidebar-panel">
          <div className="leave-summary-card">
            <h3 className="leave-summary-title">Request Summary</h3>
            <div className="leave-summary-row">
              <span>Employee</span>
              <strong>{userData?.name || '—'}</strong>
            </div>
            <div className="leave-summary-row">
              <span>Position</span>
              <strong>{userData?.position || '—'}</strong>
            </div>
            <div className="leave-summary-row">
              <span>Department</span>
              <strong>{userData?.department || '—'}</strong>
            </div>
            <hr className="leave-summary-divider" />
            <div className="leave-summary-row">
              <span>Leave Type</span>
              <strong>
                {formData.leaveType ? `${formData.leaveType} Leave` : '—'}
              </strong>
            </div>
            <div className="leave-summary-row">
              <span>Start Date</span>
              <strong>{formData.startDate || '—'}</strong>
            </div>
            <div className="leave-summary-row">
              <span>End Date</span>
              <strong>{formData.endDate || '—'}</strong>
            </div>
            <div className="leave-summary-row">
              <span>Duration</span>
              <strong>
                {leaveDays > 0 ? `${leaveDays} day${leaveDays !== 1 ? 's' : ''}` : '—'}
              </strong>
            </div>
            <hr className="leave-summary-divider" />
            <div className="leave-summary-row">
              <span>Approval</span>
              <strong style={{ color: isExec ? '#16a34a' : '#d97706' }}>
                {isExec ? 'Auto-Approved' : 'Requires Approval'}
              </strong>
            </div>
            {requiresMedCert && (
              <div className="leave-summary-row">
                <span>Med Cert</span>
                <strong style={{ color: medCertFile ? '#16a34a' : '#dc2626' }}>
                  {medCertFile ? 'Attached' : 'Required'}
                </strong>
              </div>
            )}
          </div>

          <div className="leave-policy-card">
            <h3 className="leave-summary-title">Leave Policies</h3>
            {availableLeaveTypes.map((t) => {
              const info = LEAVE_INFO[t.value];
              return (
                <div
                  key={t.value}
                  className="leave-policy-item"
                  style={{ borderLeftColor: info.color }}
                >
                  <strong style={{ color: info.color }}>
                    {t.label}
                  </strong>
                  <p>{info.policy}</p>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
