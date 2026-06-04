import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';

export default function EmployeeProfileDetails({ targetUid, onEditComplete }) {
  const { currentUser, userData: currentUserData } = useAuth();
  
  // Decide permissions
  const isSelf = targetUid === currentUser.uid;
  const isHRAdmin = currentUserData?.department === 'HR' || currentUserData?.role === 'admin' || currentUserData?.role === 'superadmin';
  const canEdit = isSelf || isHRAdmin;

  const [activeTab, setActiveTab] = useState('personal');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!targetUid) return;
      try {
        setLoading(true);
        const dRec = await getDoc(doc(db, 'users', targetUid));
        if (dRec.exists()) {
          setProfileData({
            id: dRec.id,
            name: '', email: '', department: '', position: '', role: '', phone: '', address: '', birthday: '', gender: '',
            employmentHistory: [],
            education: [],
            skills: [],
            emergencyContacts: [],
            documents: [],
            ...dRec.data()
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [targetUid]);

  const handleChange = (field, val) => setProfileData(p => ({ ...p, [field]: val }));

  const handleArrayChange = (field, index, subField, val) => {
    setProfileData(p => {
      const newArray = [...p[field]];
      newArray[index] = { ...newArray[index], [subField]: val };
      return { ...p, [field]: newArray };
    });
  };

  const addArrayItem = (field, defaultObj) => {
    setProfileData(p => ({ ...p, [field]: [...p[field], defaultObj] }));
  };

  const removeArrayItem = (field, index) => {
    setProfileData(p => ({ ...p, [field]: p[field].filter((_, i) => i !== index) }));
  };

  const handleDocumentUpload = async (e) => {
    if (!e.target.files.length) return;
    const file = e.target.files[0];
    try {
      setUploading(true);
      const fileRef = ref(storage, `employee_documents/${targetUid}_${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      const docObj = { name: file.name, url, uploadedAt: new Date().toISOString() };
      addArrayItem('documents', docObj);
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = null; 
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      const { id, ...saveData } = profileData;
      await updateDoc(doc(db, 'users', targetUid), saveData);
      alert('Profile updated successfully!');
      if (onEditComplete) onEditComplete();
    } catch (err) {
      console.error(err);
      alert('Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading profile...</p>;
  if (!profileData) return <p>User not found.</p>;

  return (
    <div style={{ background: '#fff', borderRadius: '8px', padding: '0' }}>
      <div className="org-tabs" style={{ marginBottom: '15px' }}>
        {['personal', 'employment', 'education', 'skills', 'contacts', 'documents'].map(t => (
          <button 
            key={t}
            className={`org-tab ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}
            style={{ textTransform: 'capitalize' }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
        
        {/* PERSONAL INFO */}
        {activeTab === 'personal' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div><label>Full Name</label><input className="form-input" style={{ width: '100%' }} value={profileData.name} onChange={e => handleChange('name', e.target.value)} disabled={!canEdit} /></div>
            <div><label>Email Address</label><input className="form-input" style={{ width: '100%' }} value={profileData.email} disabled /></div>
            <div><label>Phone Number</label><input className="form-input" style={{ width: '100%' }} value={profileData.phone} onChange={e => handleChange('phone', e.target.value)} disabled={!canEdit} /></div>
            <div><label>Address</label><input className="form-input" style={{ width: '100%' }} value={profileData.address} onChange={e => handleChange('address', e.target.value)} disabled={!canEdit} /></div>
            
            {/* Only HR/Admins can edit core functional info like department, position, role */}
            <div><label>Department</label><input className="form-input" style={{ width: '100%' }} value={profileData.department} onChange={e => handleChange('department', e.target.value)} disabled={!isHRAdmin} /></div>
            <div><label>Position</label><input className="form-input" style={{ width: '100%' }} value={profileData.position} onChange={e => handleChange('position', e.target.value)} disabled={!isHRAdmin} /></div>
            <div><label>Role</label><input className="form-input" style={{ width: '100%' }} value={profileData.role} onChange={e => handleChange('role', e.target.value)} disabled={!isHRAdmin} /></div>
            
            <div><label>Birthday</label><input type="date" className="form-input" style={{ width: '100%' }} value={profileData.birthday} onChange={e => handleChange('birthday', e.target.value)} disabled={!canEdit} /></div>
            <div>
              <label>Gender</label>
              <select className="form-input" style={{ width: '100%' }} value={profileData.gender} onChange={e => handleChange('gender', e.target.value)} disabled={!canEdit}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        )}

        {/* EMPLOYMENT HISTORY */}
        {activeTab === 'employment' && (
          <div>
            {profileData.employmentHistory.map((hist, idx) => (
              <div key={idx} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '10px', position: 'relative' }}>
                {canEdit && <button onClick={() => removeArrayItem('employmentHistory', idx)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>&times;</button>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><label>Company</label><input className="form-input" style={{ width: '100%' }} value={hist.company} onChange={e => handleArrayChange('employmentHistory', idx, 'company', e.target.value)} disabled={!canEdit} /></div>
                  <div><label>Job Title</label><input className="form-input" style={{ width: '100%' }} value={hist.title} onChange={e => handleArrayChange('employmentHistory', idx, 'title', e.target.value)} disabled={!canEdit} /></div>
                  <div><label>Start Date</label><input type="month" className="form-input" style={{ width: '100%' }} value={hist.startDate} onChange={e => handleArrayChange('employmentHistory', idx, 'startDate', e.target.value)} disabled={!canEdit} /></div>
                  <div><label>End Date</label><input type="month" className="form-input" style={{ width: '100%' }} value={hist.endDate} onChange={e => handleArrayChange('employmentHistory', idx, 'endDate', e.target.value)} disabled={!canEdit} /></div>
                </div>
              </div>
            ))}
            {canEdit && <button className="btn-primary" style={{ background: '#e2e8f0', color: '#1e293b' }} onClick={() => addArrayItem('employmentHistory', { company: '', title: '', startDate: '', endDate: '' })}>+ Record Add</button>}
          </div>
        )}

        {/* EDUCATION */}
        {activeTab === 'education' && (
          <div>
            {profileData.education.map((edu, idx) => (
              <div key={idx} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '10px', position: 'relative' }}>
                {canEdit && <button onClick={() => removeArrayItem('education', idx)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>&times;</button>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><label>School / Institution</label><input className="form-input" style={{ width: '100%' }} value={edu.school} onChange={e => handleArrayChange('education', idx, 'school', e.target.value)} disabled={!canEdit} /></div>
                  <div><label>Degree / Course</label><input className="form-input" style={{ width: '100%' }} value={edu.degree} onChange={e => handleArrayChange('education', idx, 'degree', e.target.value)} disabled={!canEdit} /></div>
                  <div><label>Year Graduated</label><input type="number" className="form-input" style={{ width: '100%' }} value={edu.year} onChange={e => handleArrayChange('education', idx, 'year', e.target.value)} disabled={!canEdit} /></div>
                </div>
              </div>
            ))}
            {canEdit && <button className="btn-primary" style={{ background: '#e2e8f0', color: '#1e293b' }} onClick={() => addArrayItem('education', { school: '', degree: '', year: '' })}>+ Record Add</button>}
          </div>
        )}

        {/* SKILLS */}
        {activeTab === 'skills' && (
          <div>
            {profileData.skills.map((skill, idx) => (
              <div key={idx} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '10px', position: 'relative' }}>
                {canEdit && <button onClick={() => removeArrayItem('skills', idx)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>&times;</button>}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div><label>Skill / Certification</label><input className="form-input" style={{ width: '100%' }} value={skill.name} onChange={e => handleArrayChange('skills', idx, 'name', e.target.value)} disabled={!canEdit} /></div>
                  <div>
                    <label>Proficiency</label>
                    <select className="form-input" style={{ width: '100%' }} value={skill.proficiency} onChange={e => handleArrayChange('skills', idx, 'proficiency', e.target.value)} disabled={!canEdit}>
                      <option value="">--</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            {canEdit && <button className="btn-primary" style={{ background: '#e2e8f0', color: '#1e293b' }} onClick={() => addArrayItem('skills', { name: '', proficiency: '' })}>+ Record Add</button>}
          </div>
        )}

        {/* EMERGENCY CONTACTS */}
        {activeTab === 'contacts' && (
          <div>
            {profileData.emergencyContacts.map((contact, idx) => (
              <div key={idx} style={{ background: '#fef2f2', padding: '15px', borderRadius: '8px', marginBottom: '10px', position: 'relative' }}>
                {canEdit && <button onClick={() => removeArrayItem('emergencyContacts', idx)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>&times;</button>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><label>Contact Name</label><input className="form-input" style={{ width: '100%' }} value={contact.name} onChange={e => handleArrayChange('emergencyContacts', idx, 'name', e.target.value)} disabled={!canEdit} /></div>
                  <div><label>Relationship</label><input className="form-input" style={{ width: '100%' }} value={contact.relationship} onChange={e => handleArrayChange('emergencyContacts', idx, 'relationship', e.target.value)} disabled={!canEdit} /></div>
                  <div><label>Phone Number</label><input className="form-input" style={{ width: '100%' }} value={contact.phone} onChange={e => handleArrayChange('emergencyContacts', idx, 'phone', e.target.value)} disabled={!canEdit} /></div>
                </div>
              </div>
            ))}
            {canEdit && <button className="btn-primary" style={{ background: '#fca5a5', color: '#7f1d1d' }} onClick={() => addArrayItem('emergencyContacts', { name: '', relationship: '', phone: '' })}>+ Add Contact</button>}
          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === 'documents' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              {profileData.documents.map((docItem, idx) => (
                <div key={idx} style={{ background: '#f8fafc', padding: '10px 15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{docItem.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(docItem.uploadedAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a href={docItem.url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>View</a>
                    {canEdit && <button onClick={() => removeArrayItem('documents', idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>Delete</button>}
                  </div>
                </div>
              ))}
              {profileData.documents.length === 0 && <p style={{ color: '#9ca3af', fontStyle: 'italic', gridColumn: 'span 2' }}>No documents stored.</p>}
            </div>

            {canEdit && (
              <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '15px' }}>
                <label style={{ fontWeight: 600 }}>Upload New Document</label>
                <input 
                  type="file" 
                  className="form-input" 
                  style={{ width: '100%', marginTop: '5px' }} 
                  onChange={handleDocumentUpload} 
                  disabled={uploading} 
                />
                {uploading && <div style={{ fontSize: '0.85rem', color: '#2563eb', marginTop: 4 }}>Uploading to secure file storage...</div>}
                <div style={{ fontSize: '0.8rem', marginTop: 4, color: '#64748b' }}>Accepted: PDFs, Word Docs, Images (Contracts, Valid IDs, Certifications)</div>
              </div>
            )}
          </div>
        )}

      </div>

      {canEdit && (
        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>
          <button className="btn-primary" onClick={saveProfile} disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      )}
    </div>
  );
}