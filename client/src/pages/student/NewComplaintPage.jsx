import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, X, MapPin, AlertTriangle, CheckCircle, Loader, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { complaintAPI } from '../../services/api';
import { CAMPUS_BUILDINGS, CATEGORY_LABELS, CATEGORY_ICONS, HOSTEL_BLOCKS, LABS } from '../../utils/constants';

const STEPS = [
  { id: 1, label: 'Category' },
  { id: 2, label: 'Location' },
  { id: 3, label: 'Details' },
  { id: 4, label: 'Evidence' },
  { id: 5, label: 'Review' },
];

export default function NewComplaintPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    category: '',
    subCategory: '',
    location: { building: '', floor: '', room: '', hostelBlock: '', specificArea: '' },
    title: '',
    description: '',
    priority: 'medium',
    isPublic: true,
    isEmergency: false,
    evidenceFiles: [],
  });
  const [filePreviews, setFilePreviews] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [aiMessageIndex, setAiMessageIndex] = useState(0);

  const AI_STEPS = [
    "AI Agent scanning text...",
    "Analyzing sentiment...",
    "Checking for duplicate tickets...",
    "Determining priority level...",
    "Routing to appropriate department...",
    "Finalizing report..."
  ];

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setAiMessageIndex((prev) => (prev < AI_STEPS.length - 1 ? prev + 1 : prev));
      }, 500);
    } else {
      setAiMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateLocation = (key, value) => setForm((prev) => ({ ...prev, location: { ...prev.location, [key]: value } }));

  const handleFileAdd = (files) => {
    const newFiles = Array.from(files).slice(0, 5 - form.evidenceFiles.length);
    const previews = newFiles.map((f) => ({ url: URL.createObjectURL(f), name: f.name, type: f.type }));
    setForm((prev) => ({ ...prev, evidenceFiles: [...prev.evidenceFiles, ...newFiles] }));
    setFilePreviews((prev) => [...prev, ...previews]);
  };

  const removeFile = (index) => {
    setForm((prev) => ({ ...prev, evidenceFiles: prev.evidenceFiles.filter((_, i) => i !== index) }));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileAdd(e.dataTransfer.files);
  };

  const canProceed = () => {
    if (step === 1) return !!form.category;
    if (step === 2) return !!form.location.building;
    if (step === 3) return form.title.length >= 5 && form.description.length >= 20;
    return true;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('subCategory', form.subCategory);
      
      const finalLocation = { ...form.location };
      if (form.location.building === 'Hostel' && form.location.hostelBlock) {
        finalLocation.building = form.location.hostelBlock;
      } else if (form.location.building === 'Lab' && form.location.specificArea) {
        finalLocation.building = form.location.specificArea;
      } else if (form.location.building === 'Other' && form.location.specificArea) {
        finalLocation.building = form.location.specificArea;
      }
      
      formData.append('location', JSON.stringify(finalLocation));
      formData.append('isPublic', form.isPublic);
      formData.append('isEmergency', form.isEmergency);
      form.evidenceFiles.forEach((f) => formData.append('evidence', f));

      const { data } = await complaintAPI.create(formData);
      toast.success('Complaint submitted! AI is analyzing your report... 🤖');
      navigate(`/complaints/${data.complaint._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setIsLoading(false);
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const categories = Object.entries(CATEGORY_LABELS);

  return (
    <DashboardLayout title="File a Complaint" subtitle="All fields marked with * are required">
      {/* Progress Steps */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
          <div style={{
            position: 'absolute', top: 20, left: 0, right: 0, height: 2,
            background: 'var(--border-subtle)', zIndex: 0,
          }} />
          <div style={{
            position: 'absolute', top: 20, left: 0, height: 2, zIndex: 1,
            background: 'var(--grad-primary)',
            width: `${((step - 1) / (STEPS.length - 1)) * 100}%`,
            transition: 'width 0.4s ease',
          }} />

          {STEPS.map((s) => (
            <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative', zIndex: 2 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: step >= s.id ? 'var(--grad-primary)' : 'var(--bg-card)',
                border: `2px solid ${step >= s.id ? 'transparent' : 'var(--border-muted)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
                color: step >= s.id ? '#000' : 'var(--text-muted)',
                transition: 'all 0.3s',
                boxShadow: step === s.id ? '0 0 20px rgba(0,212,255,0.4)' : 'none',
              }}>
                {step > s.id ? <CheckCircle size={18} /> : s.id}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: step >= s.id ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <div className="card" style={{ padding: 32, maxWidth: 800 }}>

        {/* Step 1: Category */}
        {step === 1 && (
          <motion.div {...stepVariants} key="step1">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>What type of issue is this?</h2>
            <p className="text-sm text-secondary" style={{ marginBottom: 24 }}>Select the category that best describes your complaint.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {categories.map(([key, label]) => (
                <motion.button
                  key={key}
                  onClick={() => updateForm('category', key)}
                  style={{
                    padding: '16px 12px', borderRadius: 14,
                    background: form.category === key ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${form.category === key ? 'rgba(0,212,255,0.4)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    transition: 'all 0.2s',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  id={`category-${key}`}
                >
                  <span style={{ fontSize: 28 }}>{CATEGORY_ICONS[key] || '📋'}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 600, textAlign: 'center',
                    color: form.category === key ? 'var(--cyan)' : 'var(--text-secondary)',
                  }}>{label}</span>
                </motion.button>
              ))}
            </div>

            {/* Emergency toggle */}
            <div style={{
              marginTop: 24, padding: '14px 18px', borderRadius: 12,
              background: form.isEmergency ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${form.isEmergency ? 'rgba(244,63,94,0.3)' : 'var(--border-subtle)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
            }} onClick={() => updateForm('isEmergency', !form.isEmergency)}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <AlertTriangle size={18} style={{ color: form.isEmergency ? 'var(--rose)' : 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: form.isEmergency ? 'var(--rose)' : 'var(--text-primary)' }}>Emergency / Urgent</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Safety hazard, immediate attention required</div>
                </div>
              </div>
              <div style={{
                width: 44, height: 24, borderRadius: 12,
                background: form.isEmergency ? 'var(--rose)' : 'var(--border-muted)',
                position: 'relative', transition: 'background 0.3s',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3,
                  left: form.isEmergency ? 23 : 3,
                  transition: 'left 0.3s',
                }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <motion.div {...stepVariants} key="step2">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Where is the issue located?</h2>
            <p className="text-sm text-secondary" style={{ marginBottom: 24 }}>Be as specific as possible to help maintenance teams locate the problem quickly.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="form-group">
                  <label className="form-label">Building Category *</label>
                  <select className="form-select" value={form.location.building} onChange={(e) => updateLocation('building', e.target.value)} id="location-building">
                    <option value="">Select a category...</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Academic Block">Academic Block</option>
                    <option value="Lab">Lab</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {form.location.building === 'Other' && (
                  <div className="form-group">
                    <label className="form-label">Specify Building / Area *</label>
                    <input className="form-input" placeholder="e.g., Main Canteen, Sports Complex" value={form.location.specificArea} onChange={(e) => updateLocation('specificArea', e.target.value)} />
                  </div>
                )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Floor</label>
                  <input className="form-input" placeholder="e.g., Ground, 1st, 2nd Floor" value={form.location.floor} onChange={(e) => updateLocation('floor', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Room / Area</label>
                  <input className="form-input" placeholder="e.g., Room 101, Lab 3, Corridor" value={form.location.room} onChange={(e) => updateLocation('room', e.target.value)} />
                </div>
              </div>

              {form.location.building === 'Hostel' && (
                <div className="form-group">
                  <label className="form-label">Hostel Name *</label>
                  <select className="form-select" value={form.location.hostelBlock} onChange={(e) => updateLocation('hostelBlock', e.target.value)}>
                    <option value="">Select hostel...</option>
                    {HOSTEL_BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}
              
              {form.location.building === 'Lab' && (
                <div className="form-group">
                  <label className="form-label">Lab Name *</label>
                  <select className="form-select" value={form.location.specificArea} onChange={(e) => updateLocation('specificArea', e.target.value)}>
                    <option value="">Select lab...</option>
                    {LABS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              )}

              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <MapPin size={16} style={{ color: 'var(--cyan)', flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Your approximate location helps route complaints to the right department faster.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <motion.div {...stepVariants} key="step3">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Describe the issue</h2>
            <p className="text-sm text-secondary" style={{ marginBottom: 24 }}>The more detail you provide, the faster the resolution.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="form-group">
                <label className="form-label">Complaint Title *</label>
                <input
                  className="form-input"
                  placeholder="Brief title (e.g., 'Fan not working in Room A-101')"
                  value={form.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  maxLength={100}
                  id="complaint-title"
                />
                <span className="form-hint">{form.title.length}/100 characters</span>
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description *</label>
                <textarea
                  className="form-input form-textarea"
                  style={{ minHeight: 140 }}
                  placeholder="Describe when it started, how it affects you, whether others are affected, any safety concerns, etc."
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  id="complaint-description"
                />
                <span className="form-hint">{form.description.length} characters (min 20)</span>
              </div>

              {/* Public toggle */}
              <div style={{
                padding: '12px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer',
              }} onClick={() => updateForm('isPublic', !form.isPublic)}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Make complaint public</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Other affected students can support this complaint</div>
                </div>
                <div style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: form.isPublic ? 'var(--cyan)' : 'var(--border-muted)',
                  position: 'relative', transition: 'background 0.3s',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3,
                    left: form.isPublic ? 23 : 3, transition: 'left 0.3s',
                  }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Evidence */}
        {step === 4 && (
          <motion.div {...stepVariants} key="step4">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Add evidence (optional)</h2>
            <p className="text-sm text-secondary" style={{ marginBottom: 24 }}>Photos, videos, or documents help verify and resolve complaints faster.</p>

            {/* Drop zone */}
            <div
              className={`file-upload-zone ${dragOver ? 'dragover' : ''}`}
              style={{ marginBottom: 20 }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Drop files here or click to upload</p>
              <p className="text-sm text-secondary">Supports JPG, PNG, WebP, MP4, PDF • Max 50MB each • Up to 5 files</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/mp4,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => handleFileAdd(e.target.files)}
                id="evidence-upload"
              />
            </div>

            {/* File previews */}
            {filePreviews.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {filePreviews.map((preview, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '4/3', background: 'var(--bg-secondary)' }}>
                    {preview.type.startsWith('image') ? (
                      <img src={preview.url} alt={preview.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 32, marginBottom: 6 }}>{preview.type === 'application/pdf' ? '📄' : '🎬'}</div>
                          <p style={{ fontSize: 10, color: 'var(--text-muted)', wordBreak: 'break-all' }}>{preview.name}</p>
                        </div>
                      </div>
                    )}
                    <button
                      style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 22, height: 22, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff',
                      }}
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <motion.div {...stepVariants} key="step5">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Review & Submit</h2>
            <p className="text-sm text-secondary" style={{ marginBottom: 24 }}>Please verify the details before submitting your complaint.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Category', value: `${CATEGORY_ICONS[form.category]} ${CATEGORY_LABELS[form.category]}` },
                { label: 'Location', value: [form.location.building, form.location.floor, form.location.room].filter(Boolean).join(' • ') },
                { label: 'Title', value: form.title },
                { label: 'Description', value: form.description },
                { label: 'Evidence', value: `${filePreviews.length} file(s) attached` },
                { label: 'Emergency', value: form.isEmergency ? '🚨 Yes — immediate attention required' : 'No' },
                { label: 'Visibility', value: form.isPublic ? '🌐 Public — others can support this complaint' : '🔒 Private' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', gap: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, width: 100, flexShrink: 0, marginTop: 1 }}>{label}</span>
                  <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{value || '—'}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 12, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🤖</span>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                After submission, our <strong style={{ color: 'var(--violet)' }}>AI engine</strong> will analyze your complaint, verify the category, predict priority, check for duplicates, and route it to the appropriate department automatically.
              </p>
            </div>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 12 }}>
          <button
            className="btn btn-ghost"
            onClick={() => step > 1 ? setStep(step - 1) : navigate('/student/complaints')}
            id="back-btn"
          >
            ← {step > 1 ? 'Back' : 'Cancel'}
          </button>

          {step < 5 ? (
            <button
              className="btn btn-primary"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              id="next-step-btn"
            >
              Continue →
            </button>
          ) : (
              <button
                className="btn btn-primary btn-lg"
                onClick={handleSubmit}
                disabled={isLoading}
                id="submit-complaint-btn"
                style={{ position: 'relative', overflow: 'hidden', minWidth: 200 }}
              >
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
                    <div className="spinner spinner-sm" />
                    <span style={{ fontSize: 13, fontFamily: 'monospace' }}>{AI_STEPS[aiMessageIndex]}</span>
                  </div>
                ) : '🚀 Submit Complaint'}
                
                {isLoading && (
                  <motion.div
                    initial={{ left: '-100%' }}
                    animate={{ left: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    style={{
                      position: 'absolute', top: 0, bottom: 0, width: '50%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      zIndex: 0
                    }}
                  />
                )}
              </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
