import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Eye, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { complaintAPI } from '../../services/api';
import { STATUS_LABELS, CATEGORY_ICONS, PRIORITY_CONFIG, timeAgo, formatDate } from '../../utils/constants';

export default function WardenDashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [verifyNote, setVerifyNote] = useState('');
  const [verifyAction, setVerifyAction] = useState('');
  const [processing, setProcessing] = useState(false);

  const { user } = useAuthStore();
  const pendingStatuses = user?.role === 'chief_warden' ? ['verified', 'escalated'] : ['submitted', 'under_verification', 'ai_processing'];

  const [stats, setStats] = useState({ pending: 0, verified: 0, rejected: 0, total: 0 });

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await complaintAPI.getAll({ limit: 50 });
      const all = data.complaints || [];
      setComplaints(all);
      setStats({
        total: all.length,
        pending: all.filter((c) => pendingStatuses.includes(c.status)).length,
        verified: all.filter((c) => c.status === (user?.role === 'chief_warden' ? 'approved' : 'verified')).length,
        rejected: all.filter((c) => c.status === 'rejected').length,
      });
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleVerify = async () => {
    if (!verifyNote && verifyAction === 'reject') return toast.error('Please provide a rejection reason.');
    setProcessing(true);
    try {
      if (user?.role === 'chief_warden') {
        const action = verifyAction === 'verify' ? 'approve' : 'reject';
        await complaintAPI.approve(activeComplaint._id, { action, note: verifyNote });
        toast.success(action === 'approve' ? '✅ Complaint approved and forwarded to Maintenance' : '❌ Complaint rejected');
      } else {
        await complaintAPI.verify(activeComplaint._id, { action: verifyAction, note: verifyNote });
        if (verifyAction === 'verify') {
          const isAcademic = ['class_advisor', 'lab_assistant', 'faculty'].includes(user?.role);
          toast.success(isAcademic ? '✅ Complaint approved and forwarded to Maintenance' : '✅ Complaint verified and forwarded to Chief Warden');
        } else {
          toast.success('❌ Complaint rejected');
        }
      }
      setActiveComplaint(null);
      setVerifyNote('');
      setVerifyAction('');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally { setProcessing(false); }
  };

  const priorityOrder = { emergency: 0, high: 1, medium: 2, low: 3 };
  const sortedComplaints = [...complaints].sort((a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4));

  const getTitle = () => {
    if (['class_advisor', 'faculty'].includes(user?.role)) return 'Class Advisor Dashboard';
    if (user?.role === 'lab_assistant') return 'Lab Assistant Dashboard';
    if (user?.role === 'chief_warden') return 'Chief Warden Dashboard';
    return 'Warden Dashboard';
  };

  const getSubtitle = () => {
    if (['class_advisor', 'faculty'].includes(user?.role) || user?.role === 'lab_assistant') return 'Review and verify academic complaints';
    return 'Review and verify hostel complaints';
  };

  return (
    <DashboardLayout title={getTitle()} subtitle={getSubtitle()}>
      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Awaiting Review', value: stats.pending, color: '#F59E0B', icon: Clock },
          { label: 'Verified Today', value: stats.verified, color: '#10B981', icon: CheckCircle },
          { label: 'Rejected', value: stats.rejected, color: '#F43F5E', icon: XCircle },
          { label: 'Total Complaints', value: stats.total, color: '#00D4FF', icon: TrendingUp },
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
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>📋 Complaints Awaiting Review</h2>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map((n) => <div key={n} className="skeleton" style={{ height: 80 }} />)}
          </div>
        ) : sortedComplaints.filter((c) => pendingStatuses.includes(c.status)).length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <p style={{ color: 'var(--text-secondary)' }}>No pending complaints. All up to date!</p>
          </div>
        ) : (
          sortedComplaints
            .filter((c) => pendingStatuses.includes(c.status))
            .map((complaint, i) => {
              const priority = PRIORITY_CONFIG[complaint.priority] || {};
              return (
                <motion.div
                  key={complaint._id}
                  className="card"
                  style={{ padding: '16px 20px', marginBottom: 12, cursor: 'pointer', border: complaint.priority === 'emergency' ? '1px solid rgba(244,63,94,0.4)' : '1px solid var(--border-subtle)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 24, flexShrink: 0, marginTop: 4 }}>{CATEGORY_ICONS[complaint.category] || '📋'}</div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {complaint.title}
                        </h3>
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, background: priority.bg, color: priority.color, flexShrink: 0 }}>
                          {complaint.priority === 'emergency' && '🚨 '}{priority.label}
                        </span>
                      </div>

                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {complaint.description}
                      </p>

                      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>👤 {complaint.complainantId?.name || 'Unknown'}</span>
                        <span>📍 {complaint.location?.building}</span>
                        <span>🕐 {timeAgo(complaint.createdAt)}</span>
                        {complaint.communitySupport?.length > 0 && <span style={{ color: 'var(--cyan)' }}>👥 {complaint.communitySupport.length} affected</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/complaints/${complaint._id}`)}
                        id={`view-complaint-${i}`}
                      >
                        <Eye size={14} /> View
                      </button>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => { setActiveComplaint(complaint); setVerifyAction('verify'); }}
                        id={`verify-complaint-${i}`}
                      >
                        <CheckCircle size={14} /> {user?.role === 'chief_warden' ? 'Approve' : 'Verify'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => { setActiveComplaint(complaint); setVerifyAction('reject'); }}
                        id={`reject-complaint-${i}`}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
        )}
      </div>

      {/* Verify/Approve/Reject Modal */}
      {activeComplaint && (
        <div className="modal-overlay" onClick={() => setActiveComplaint(null)}>
          <motion.div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {verifyAction === 'verify' ? (
                  ['chief_warden', 'class_advisor', 'lab_assistant', 'faculty'].includes(user?.role) ? '✅ Approve Complaint' : '✅ Verify Complaint'
                ) : '❌ Reject Complaint'}
              </h3>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setActiveComplaint(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', marginBottom: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{activeComplaint.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{activeComplaint.description}</div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {verifyAction === 'verify' ? (user?.role === 'chief_warden' ? 'Approval Note (optional)' : 'Verification Note (optional)') : 'Rejection Reason *'}
                </label>
                <textarea
                  className="form-input form-textarea"
                  style={{ minHeight: 100 }}
                  placeholder={verifyAction === 'verify' ? (user?.role === 'chief_warden' ? 'Any notes for the maintenance team...' : 'Confirm your findings or add any observations...') : 'Explain why this complaint is being rejected...'}
                  value={verifyNote}
                  onChange={(e) => setVerifyNote(e.target.value)}
                  id="verify-note-input"
                />
              </div>

              {verifyAction === 'verify' && (
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 13, color: 'var(--text-secondary)' }}>
                  ✅ {user?.role === 'chief_warden' ? 'After approval, this complaint will be forwarded to the Maintenance Supervisor.' : 'After verification, this complaint will be forwarded to the Chief Warden for approval.'}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setActiveComplaint(null)}>Cancel</button>
              <button
                className={verifyAction === 'verify' ? 'btn btn-success' : 'btn btn-danger'}
                onClick={handleVerify}
                disabled={processing}
                id="confirm-verify-btn"
              >
                {processing ? <div className="spinner spinner-sm" /> : (
                  verifyAction === 'verify' ? (
                    ['chief_warden', 'class_advisor', 'lab_assistant', 'faculty'].includes(user?.role) ? '✅ Confirm Approval' : '✅ Confirm Verification'
                  ) : '❌ Confirm Rejection'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
