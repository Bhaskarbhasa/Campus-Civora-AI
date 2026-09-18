import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Wrench, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { complaintAPI } from '../../services/api';
import { STATUS_LABELS, CATEGORY_ICONS, PRIORITY_CONFIG, timeAgo } from '../../utils/constants';

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState([]);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await complaintAPI.getAll({ limit: 30 });
      setComplaints(data.complaints || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleUpdateWork = async (id) => {
    if (!updateStatus) return toast.error('Select a status first.');
    const formData = new FormData();
    formData.append('status', updateStatus);
    formData.append('note', note);
    files.forEach((f) => formData.append('progress', f));
    try {
      await complaintAPI.updateWork(id, formData);
      toast.success('Work status updated!');
      setUpdating(null);
      setUpdateStatus('');
      setNote('');
      setFiles([]);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update.');
    }
  };

  const stats = {
    total: complaints.length,
    inProgress: complaints.filter((c) => c.status === 'work_in_progress').length,
    pending: complaints.filter((c) => c.status === 'assigned').length,
    completed: complaints.filter((c) => ['completed', 'pending_student_verification', 'closed'].includes(c.status)).length,
  };

  return (
    <DashboardLayout title="My Work Orders" subtitle="Assigned maintenance tasks">
      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Assigned', value: stats.pending, color: '#F59E0B', icon: Clock },
          { label: 'In Progress', value: stats.inProgress, color: '#00D4FF', icon: Wrench },
          { label: 'Completed', value: stats.completed, color: '#10B981', icon: CheckCircle },
          { label: 'Total', value: stats.total, color: '#8B5CF6', icon: ArrowRight },
        ].map((s, i) => (
          <motion.div key={s.label} className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${s.color}, transparent)`, borderRadius: '0 0 14px 14px', opacity: 0.5 }} />
          </motion.div>
        ))}
      </div>

      {/* Work Orders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          [1,2,3].map((n) => <div key={n} className="skeleton" style={{ height: 100 }} />)
        ) : complaints.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>No work orders assigned</h3>
            <p className="text-secondary text-sm" style={{ marginTop: 8 }}>You're all caught up!</p>
          </div>
        ) : complaints.map((c, i) => {
          const priority = PRIORITY_CONFIG[c.priority] || {};
          const isActive = updating === c._id;
          return (
            <motion.div key={c._id} className="card" style={{ padding: '18px 20px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 26, flexShrink: 0, marginTop: 2 }}>{CATEGORY_ICONS[c.category] || '🔧'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: priority.bg, color: priority.color }}>
                        {priority.label || c.priority}
                      </span>
                      <div className={`status-chip status-${c.status}`}>{STATUS_LABELS[c.status]}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                    📍 {c.location?.building} {c.location?.room ? `• Room ${c.location.room}` : ''} • 🕐 {timeAgo(c.createdAt)}
                  </div>

                  {/* Update actions */}
                  {!['closed', 'rejected', 'duplicate'].includes(c.status) && (
                    <div>
                      {!isActive ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/complaints/${c._id}`)}>View Details</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setUpdating(c._id)} id={`update-work-${i}`}>
                            <Wrench size={13} /> Update Status
                          </button>
                        </div>
                      ) : (
                        <div style={{ marginTop: 12, padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <select className="form-select" value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)} id={`status-select-${i}`}>
                            <option value="">Select new status...</option>
                            <option value="work_in_progress">🔧 Work In Progress</option>
                            <option value="waiting_for_materials">📦 Waiting for Materials</option>
                            <option value="quality_inspection">🔎 Quality Inspection</option>
                            <option value="completed">✅ Mark as Completed</option>
                          </select>
                          <textarea className="form-input form-textarea" style={{ minHeight: 70 }} placeholder="Describe the work done, materials used, or any notes..." value={note} onChange={(e) => setNote(e.target.value)} />
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Progress Photos (Optional)</label>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="form-input"
                              onChange={(e) => setFiles(Array.from(e.target.files))}
                            />
                            {files.length > 0 && <div style={{ fontSize: 12, marginTop: 4, color: 'var(--primary)' }}>{files.length} photo(s) selected</div>}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setUpdating(null); setFiles([]); }}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={() => handleUpdateWork(c._id)} id={`submit-update-${i}`}>Update Status</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
