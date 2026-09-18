import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, ArrowRight, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { complaintAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { STATUS_LABELS, CATEGORY_LABELS, CATEGORY_ICONS, PRIORITY_CONFIG, timeAgo } from '../../utils/constants';

const PRIORITY_BADGE = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority] || {};
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 99,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
      textTransform: 'uppercase',
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {priority === 'emergency' && '🚨 '}{cfg.label || priority}
    </span>
  );
};

export default function ComplaintsListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (search) params.search = search;

      const { data } = await complaintAPI.getAll(params);
      setComplaints(data.complaints || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, [page, statusFilter, categoryFilter]);

  const statusOptions = ['', 'submitted', 'under_verification', 'verified', 'approved', 'assigned', 'work_in_progress', 'completed', 'pending_student_verification', 'closed', 'rejected'];

  const pageTitle = user?.role === 'student' ? 'My Complaints' : (user?.role === 'maintenance_supervisor' || user?.role === 'electrician' || user?.role === 'plumber') ? 'Work Orders' : 'Campus Complaints';

  return (
    <DashboardLayout
      title={pageTitle}
      subtitle={`${total} complaint${total !== 1 ? 's' : ''} found`}
      actions={
        user?.role === 'student' ? (
          <button className="btn btn-primary" onClick={() => navigate('/student/complaints/new')} id="file-complaint-btn">
            <Plus size={16} /> File Complaint
          </button>
        ) : null
      }
    >
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="input-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16} className="input-icon" />
          <input
            className="form-input"
            placeholder="Search complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchComplaints()}
            id="complaint-search"
          />
        </div>

        <select
          className="form-select"
          style={{ width: 180 }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          id="status-filter"
        >
          <option value="">All Statuses</option>
          {statusOptions.filter(Boolean).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: 180 }}
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          id="category-filter"
        >
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3,4,5].map((n) => <div key={n} className="skeleton" style={{ height: 90, borderRadius: 14 }} />)}
        </div>
      ) : complaints.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No complaints found</h3>
          <p className="text-secondary text-sm">
            {statusFilter || categoryFilter ? 'Try changing your filters.' : 'You haven\'t filed any complaints yet.'}
          </p>
          {!statusFilter && !categoryFilter && (
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/student/complaints/new')}>
              <AlertTriangle size={16} /> File Your First Complaint
            </button>
          )}
        </div>
      ) : (
        <AnimatePresence>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {complaints.map((complaint, i) => (
              <motion.div
                key={complaint._id}
                className="card"
                style={{ padding: '20px 22px', cursor: 'pointer' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/complaints/${complaint._id}`)}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  {/* Category Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  }}>
                    {CATEGORY_ICONS[complaint.category] || '📋'}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {complaint.title}
                      </h3>
                      <div className={`status-chip status-${complaint.status}`} style={{ flexShrink: 0 }}>
                        {STATUS_LABELS[complaint.status] || complaint.status}
                      </div>
                    </div>

                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {complaint.description}
                    </p>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <PRIORITY_BADGE priority={complaint.priority} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        📍 {complaint.location?.building}
                        {complaint.location?.room && ` • Room ${complaint.location.room}`}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>🕐 {timeAgo(complaint.createdAt)}</span>
                      {complaint.communitySupport?.length > 0 && (
                        <span style={{ fontSize: 12, color: 'var(--cyan)' }}>👥 {complaint.communitySupport.length} supporting</span>
                      )}
                    </div>
                  </div>

                  <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 4 }} />
                </div>

                {/* AI Analysis indicator */}
                {complaint.aiAnalysis?.processed && (
                  <div style={{
                    marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)',
                    display: 'flex', gap: 8, alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--violet)', fontWeight: 600 }}>🤖 AI Analyzed</span>
                    {complaint.aiAnalysis?.summary && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {complaint.aiAnalysis.summary}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>← Previous</button>
          <span style={{ padding: '6px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
            Page {page} of {Math.ceil(total / LIMIT)}
          </span>
          <button className="btn btn-ghost btn-sm" disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </DashboardLayout>
  );
}
