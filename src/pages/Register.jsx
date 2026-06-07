import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    department: 'IT',
    position: '',
    birthday: '',
    gender: 'male',
    supervisorId: ''
  });
    const [supervisors, setSupervisors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersSnap, deptsSnap, posSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'departments')),
          getDocs(collection(db, 'positions'))
        ]);
        setSupervisors(usersSnap.docs.map(d => ({ id: d.id, name: d.data().name, position: d.data().position })));
        setDepartments(deptsSnap.docs.map(d => d.data().name));
        setPositions(posSnap.docs.map(d => ({ title: d.data().title, dept: d.data().department })));
      } catch (e) {
        console.error('Could not load data:', e);
      }
    };
    fetchData();
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
      const fullName = `${formData.firstName} ${formData.lastName}`;
      const email = `${formData.firstName.toLowerCase()}${formData.lastName.toLowerCase()}@sdca.edu.ph`;
      const userData = {
        name: fullName,
        email,
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label>First Name</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div>
              <label>Last Name</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>
          <label>Email (auto-generated)</label>
          <input
            type="text"
            readOnly
            value={
              formData.firstName || formData.lastName
                ? `${formData.firstName.toLowerCase()}${formData.lastName.toLowerCase()}@sdca.edu.ph`
                : ''
            }
            placeholder="firstname+lastname@sdca.edu.ph"
            style={{ background: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }}
          />

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label>Department</label>
                <select name="department" value={formData.department} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '4px' }}>
                  {departments.length === 0 && <option value="IT">IT</option>}
                  {departments.map((d, i) => (
                    <option key={i} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Position</label>
                <select name="position" value={formData.position} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '4px' }}>
                  <option value="">— Select position —</option>
                  {positions
                    .filter(p => !p.dept || p.dept === formData.department || p.dept === 'Any / Not Specified' || p.dept === 'Any')
                    .map((p, i) => (
                      <option key={i} value={p.title}>{p.title}</option>
                    ))}
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
            <option value="">â€” None (Top-level / No supervisor) â€”</option>
            {supervisors.map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.position ? ` (${s.position})` : ''}</option>
            ))}
          </select>

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



