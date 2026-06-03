import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: 'IT',
    position: '',
    birthday: '',
    gender: 'male',
    supervisorId: ''
  });
  const [supervisors, setSupervisors] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        setSupervisors(snap.docs.map(d => ({ id: d.id, name: d.data().name, position: d.data().position })));
      } catch (e) {
        console.error('Could not load supervisors:', e);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    try {
      setLoading(true);
      setError('');
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        department: formData.department,
        position: formData.position,
        birthday: formData.birthday,
        gender: formData.gender,
        supervisorId: formData.supervisorId || null,
        createdAt: new Date().toISOString(),
        role: 'employee',
        leave_package: 'standard'
      };
      const docRef = await addDoc(collection(db, 'users'), userData);
      await login(docRef.id, userData);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Failed to create an account. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <img src="/image/logo-main.png" alt="Company Logo" style={{ display: 'block', width: '250px', height: '250px', margin: '0 auto', padding: '0', border: '0' }} />
      <div className="login-card" style={{ maxWidth: '520px' }}>
        <h1>Register</h1>
        <p>Create a new HRIS account.</p>
        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>{error}</div>}

        <form className="login-form" onSubmit={handleRegister}>
          <label>Full Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label>Department</label>
              <select name="department" value={formData.department} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '4px' }}>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
                <option value="Academic">Academic</option>
                <option value="Administration">Administration</option>
              </select>
            </div>
            <div>
              <label>Position</label>
              <select name="position" value={formData.position} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '4px' }}>
                <option value="">— Select position —</option>
                <optgroup label="Executive">
                  <option>President</option>
                  <option>Vice President</option>
                  <option>Vice President for Academic Affairs (VPAA)</option>
                  <option>Vice President for Administration</option>
                  <option>Vice President for Finance</option>
                </optgroup>
                <optgroup label="Academic">
                  <option>Dean</option>
                  <option>Associate Dean</option>
                  <option>Program Chair / Department Head</option>
                  <option>Professor</option>
                  <option>Associate Professor</option>
                  <option>Assistant Professor</option>
                  <option>Instructor</option>
                  <option>Lecturer</option>
                  <option>Laboratory Instructor</option>
                  <option>Teacher / Faculty Member</option>
                  <option>School Registrar</option>
                  <option>Guidance Counselor</option>
                  <option>School Nurse</option>
                  <option>Librarian</option>
                </optgroup>
                <optgroup label="Administrative">
                  <option>HR Manager</option>
                  <option>HR Officer</option>
                  <option>HR Assistant</option>
                  <option>Administrative Officer</option>
                  <option>Administrative Assistant</option>
                  <option>Executive Assistant</option>
                  <option>Records Officer</option>
                  <option>Cashier</option>
                  <option>Accounting Officer</option>
                  <option>Bookkeeper</option>
                  <option>Finance Officer</option>
                  <option>Payroll Officer</option>
                  <option>IT Officer</option>
                  <option>IT Support Specialist</option>
                  <option>Facilities Officer</option>
                  <option>Security Officer</option>
                  <option>Utility / Maintenance Staff</option>
                  <option>Driver</option>
                  <option>Canteen Staff</option>
                </optgroup>
                <optgroup label="Support Services">
                  <option>Enrollment Officer</option>
                  <option>Student Affairs Officer</option>
                  <option>Marketing Officer</option>
                  <option>Public Relations Officer</option>
                  <option>Communications Officer</option>
                  <option>Research Coordinator</option>
                  <option>Extension Services Coordinator</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label>Birthday</label>
              <input type="date" name="birthday" value={formData.birthday} onChange={handleChange} required />
            </div>
            <div>
              <label>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '4px' }}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <label>Direct Supervisor</label>
          <select name="supervisorId" value={formData.supervisorId} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', marginBottom: '6px' }}>
            <option value="">— None (Top-level / No supervisor) —</option>
            {supervisors.map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.position ? ` (${s.position})` : ''}</option>
            ))}
          </select>

          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required />
            </div>
            <div>
              <label>Confirm Password</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
            </div>
          </div>

          <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
          <p style={{ textAlign: 'center', marginTop: '15px' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

