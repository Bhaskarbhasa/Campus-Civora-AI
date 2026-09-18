import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, CheckCircle, Clock, AlertTriangle, UserPlus, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { complaintAPI, userAPI } from '../../services/api';
import { PRIORITY_CONFIG, CATEGORY_ICONS, timeAgo } from '../../utils/constants';

export default function MaintenanceDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [selectedTech, setSelectedTech] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const { data } = await complaintAPI.getAll({ limit: 50 });
      setComplaints(data.complaints || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const { data } = await userAPI.getAll({ limit: 100 });
      setTechnicians(data.data.filter(t => t.isActive));
    } catch (err) {
      console.error('Failed to fetch technicians', err);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchTechnicians();
  }, []);

  const handleAssign = async () => {
    if (!selectedTech) return toast.error('Please select a technician.');
    setProcessing(true);
    try {
      await complaintAPI.assign(activeComplaint._id, { technicianId: selectedTech, note: assignNote });
      toast.success('Complaint successfully assigned to technician.');
      setActiveComplaint(null);
      setSelectedTech('');
      setAssignNote('');
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign complaint.');
    } finally {
      setProcessing(false);
    }
  };

  const pendingAssignment = complaints.filter(c => ['approved', 'escalated'].includes(c.status));
  const inProgress = complaints.filter(c => ['assigned', 'work_in_progress'].includes(c.status));

  return (
    <DashboardLayout title="Maintenance Supervisor" subtitle="Assign and manage work orders">
      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Awaiting Assignment', value: pendingAssignment.length, color: '#F43F5E', icon: AlertTriangle },
          { label: 'Work In Progress', value: inProgress.length, color: '#F59E0B', icon: Wrench },
          { label: 'Completed Today', value: complaints.filter(c => c.status === 'completed').length, color: '#10B981', icon: CheckCircle },
          { label: 'Total Active Techs', value: technicians.length, color: '#3B82F6', icon: UserPlus },
        ].map((s, i) => (
          <motion.div key={s.label} className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${s.color}, transparent)`, borderRadius: '0 0 14px 14px', opacity: 0.5 }} />
          </motion.div>
        ))}
      </div>

      {/* Complaints Queue */}
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} style={{ color: 'var(--primary)' }} /> Complaints Awaiting Assignment
        </h2>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map((n) => <div key={n} className="skeleton" style={{ height: 80 }} />)}
          </div>
        ) : pendingAssignment.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <p style={{ color: 'var(--text-secondary)' }}>No complaints awaiting assignment. Great job!</p>
          </div>
        ) : (
          pendingAssignment.map((complaint, i) => {
            const priority = PRIORITY_CONFIG[complaint.priority] || {};
            const Icon = CATEGORY_ICONS[complaint.category] || Wrench;
            return (
              <motion.div
                key={complaint._id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ padding: 16, border: '1px solid var(--border-subtle)', borderRadius: 12, marginBottom: 12, background: 'var(--surface)', display: 'flex', gap: 16, alignItems: 'flex-start' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} style={{ color: 'var(--primary)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {complaint.title}
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: priority.bg, color: priority.color, border: `1px solid ${priority.border}`, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        {complaint.status === 'escalated' ? '🚨 ESCALATED' : priority.label}
                      </span>
                    </h3>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{complaint.description}</p>
                  
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-tertiary)', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={12} /> {complaint.category.replace(/_/g, ' ')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>📍 {complaint.location?.building} • {complaint.location?.room}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {timeAgo(complaint.createdAt)}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveComplaint(complaint)}>
                    <UserPlus size={14} /> Assign Tech
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Assignment Modal */}
      <AnimatePresence>
        {activeComplaint && (
          <div className="modal-overlay" onClick={() => setActiveComplaint(null)}>
            <motion.div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="modal-header">
                <h3 className="modal-title">🛠️ Assign Technician</h3>
                <button className="btn btn-ghost btn-icon-sm" onClick={() => setActiveComplaint(null)}>✕</button>
              </div>

              <div className="modal-body">
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', marginBottom: 18 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{activeComplaint.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Category: <strong style={{color: 'var(--text-primary)'}}>{activeComplaint.category.replace(/_/g, ' ')}</strong></div>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Technician *</label>
                  <select className="form-input form-select" value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)}>
                    <option value="">-- Choose a Technician --</option>
                    {technicians.map(t => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.role.replace(/_/g, ' ')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assignment Instructions (optional)</label>
                  <textarea
                    className="form-input form-textarea"
                    style={{ minHeight: 80 }}
                    placeholder="Specific instructions for the technician..."
                    value={assignNote}
                    onChange={(e) => setAssignNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setActiveComplaint(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAssign} disabled={processing || !selectedTech}>
                  {processing ? <div className="spinner spinner-sm" /> : 'Assign Task'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
