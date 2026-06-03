import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';

// Positions allowed to post announcements
const POSTER_POSITIONS = [
  'president',
  'vice president',
  'vice president for academic affairs (vpaa)',
  'vice president for academic affairs',
  'vice president for administration',
  'vice president for finance',
  'vp', 'vpaa',
  'dean',
  'associate dean',
  'program chair / department head',
  'hr manager',
  'administrative officer',
  'school registrar',
];

function canPost(userData) {
  if (!userData) return false;
  const role = userData.role?.toLowerCase() || '';
  const pos = userData.position?.toLowerCase() || '';
  if (role === 'admin' || role === 'superadmin') return true;
  return POSTER_POSITIONS.includes(pos);
}

export default function Announcements() {
  const { userData, currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', pinned: false, expiresAt: '' });
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const fileInputRef = useRef();

  const isPoster = canPost(userData);

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadMedia = (file) => new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop();
    const path = `announcements/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);
    task.on('state_changed',
      snap => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;
    try {
      setUploading(true);
      let mediaUrl = null;
      let mediaType = null;
      if (mediaFile) {
        mediaUrl = await uploadMedia(mediaFile);
        mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
      }
      await addDoc(collection(db, 'announcements'), {
        title: formData.title,
        content: formData.content,
        pinned: formData.pinned,
        expiresAt: formData.expiresAt || null,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        createdBy: userData?.name || currentUser?.email,
        createdByPosition: userData?.position || '',
        createdAt: new Date().toISOString(),
      });
      await addDoc(collection(db, 'audit_logs'), {
        action: 'Announcement Created',
        actorName: userData?.name || currentUser?.email,
        details: `Created announcement: "${formData.title}"`,
        timestamp: new Date().toISOString(),
      });
      setFormData({ title: '', content: '', pinned: false, expiresAt: '' });
      removeMedia();
      setUploadProgress(0);
      setShowForm(false);
      fetchAnnouncements();
    } catch (err) {
      console.error('Error creating announcement:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      await addDoc(collection(db, 'audit_logs'), {
        action: 'Announcement Deleted',
        actorName: userData?.name || currentUser?.email,
        details: `Deleted announcement: "${title}"`,
        timestamp: new Date().toISOString(),
      });
      fetchAnnouncements();
    } catch (err) {
      console.error('Error deleting announcement:', err);
    }
  };

  const pinned = announcements.filter(a => a.pinned);
  const regular = announcements.filter(a => !a.pinned);

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="ann-header">
        <div>
          <h1 style={{ marginBottom: 4 }}>Announcements</h1>
          <p style={{ marginBottom: 0 }}>Company updates and news.</p>
        </div>
        {isPoster && (
          <button className="ann-post-btn" onClick={() => setShowForm(v => !v)}>
            {showForm ? '✕ Cancel' : '+ New Announcement'}
          </button>
        )}
      </div>

      {/* Post Form */}
      {isPoster && showForm && (
        <div className="ann-form-card">
          <h3 style={{ margin: '0 0 20px' }}>Create Announcement</h3>
          <form onSubmit={handleSubmit}>
            <div className="ann-form-group">
              <label className="ann-label">Title <span style={{ color: '#dc2626' }}>*</span></label>
              <input className="ann-input" type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder="Announcement title" />
            </div>
            <div className="ann-form-group">
              <label className="ann-label">Content <span style={{ color: '#dc2626' }}>*</span></label>
              <textarea className="ann-textarea" name="content" value={formData.content} onChange={handleInputChange} required rows="5" placeholder="Write the announcement..." />
            </div>

            {/* Media upload */}
            <div className="ann-form-group">
              <label className="ann-label">Attach Image or Video <span style={{ color: '#6b7280', fontWeight: 400 }}>(optional)</span></label>
              {!mediaPreview ? (
                <div className="ann-media-dropzone" onClick={() => fileInputRef.current?.click()}>
                  <div className="ann-media-dropzone-icon">+</div>
                  <span>Click to attach an image or video</span>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>JPG, PNG, GIF, MP4, MOV — max 50 MB</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                    onChange={handleMediaChange}
                  />
                </div>
              ) : (
                <div className="ann-media-preview-wrap">
                  {mediaFile?.type.startsWith('video/') ? (
                    <video src={mediaPreview} className="ann-media-preview" controls />
                  ) : (
                    <img src={mediaPreview} className="ann-media-preview" alt="preview" />
                  )}
                  <button type="button" className="ann-media-remove" onClick={removeMedia}>✕ Remove</button>
                </div>
              )}
            </div>

            <div className="ann-form-row">
              <label className="ann-checkbox-label">
                <input type="checkbox" name="pinned" checked={formData.pinned} onChange={handleInputChange} />
                Pin to top
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label className="ann-label" style={{ margin: 0 }}>Expires</label>
                <input className="ann-input" style={{ width: 'auto' }} type="date" name="expiresAt" value={formData.expiresAt} onChange={handleInputChange} />
              </div>
            </div>

            {uploading && (
              <div className="ann-progress-bar-wrap">
                <div className="ann-progress-bar" style={{ width: `${uploadProgress}%` }} />
                <span className="ann-progress-label">Uploading… {uploadProgress}%</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18, gap: 10 }}>
              <button type="button" className="ann-cancel-btn" onClick={() => { setShowForm(false); removeMedia(); }}>Cancel</button>
              <button type="submit" className="ann-publish-btn" disabled={uploading}>
                {uploading ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements list */}
      {loading ? <p>Loading announcements...</p> : (
        announcements.length === 0 ? (
          <div className="ann-empty">
            <p>No announcements right now. Check back later.</p>
          </div>
        ) : (
          <div className="ann-list">
            {[...pinned, ...regular].map(ann => {
              const expired = ann.expiresAt && new Date(ann.expiresAt) < new Date();
              const isExpanded = expandedId === ann.id;
              const PREVIEW_LENGTH = 200;
              const needsTruncate = ann.content.length > PREVIEW_LENGTH;
              return (
                <div key={ann.id} className={`ann-card${ann.pinned ? ' pinned' : ''}${expired ? ' expired' : ''}`}>
                  <div className="ann-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {ann.pinned && <span className="ann-pin-badge">Pinned</span>}
                      {expired && <span className="ann-expired-badge">Expired</span>}
                      <h3 className="ann-title">{ann.title}</h3>
                    </div>
                    {isPoster && (
                      <button className="ann-delete-btn" onClick={() => handleDelete(ann.id, ann.title)}>Delete</button>
                    )}
                  </div>

                  {/* Media */}
                  {ann.mediaUrl && (
                    <div className="ann-media-container">
                      {ann.mediaType === 'video' ? (
                        <video src={ann.mediaUrl} className="ann-media-display" controls />
                      ) : (
                        <img src={ann.mediaUrl} className="ann-media-display" alt={ann.title} />
                      )}
                    </div>
                  )}

                  <p className="ann-content">
                    {needsTruncate && !isExpanded
                      ? ann.content.slice(0, PREVIEW_LENGTH) + '…'
                      : ann.content}
                  </p>
                  {needsTruncate && (
                    <button className="ann-read-more" onClick={() => setExpandedId(isExpanded ? null : ann.id)}>
                      {isExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}

                  <div className="ann-meta">
                    Posted by <strong>{ann.createdBy}</strong>
                    {ann.createdByPosition && ` (${ann.createdByPosition})`}
                    {' · '}{new Date(ann.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    {ann.expiresAt && ` · Expires ${new Date(ann.expiresAt).toLocaleDateString()}`}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
