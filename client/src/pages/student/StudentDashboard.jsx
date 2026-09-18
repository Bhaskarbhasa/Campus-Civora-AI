import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, FileText, TrendingUp, Clock, CheckCircle, Plus, ArrowRight, Activity, Star } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { complaintAPI, analyticsAPI } from '../../services/api';
import { STATUS_LABELS, CATEGORY_ICONS, timeAgo, getStatusColor } from '../../utils/constants';

const StatCard = ({ icon: Icon, label, value, color, trend, delay = 0 }) => (
  <motion.div
    className="stat-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    style={{ '--accent-color': color }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${color}20`,
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} style={{ color }} />
      </div>
      {trend !== undefined && (
        <span style={{ fontSize: 12, color: trend >= 0 ? 'var(--emerald)' : 'var(--rose)', fontWeight: 600 }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 4 }}>{value}</div>
    <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
      background: `linear-gradient(90deg, ${color}, transparent)`,
      borderRadius: '0 0 14px 14px', opacity: 0.5,
    }} />
  </motion.div>
);

const ComplaintRow = ({ complaint, onClick }) => {
  const statusColor = getStatusColor(complaint.status);
  return (
    <motion.div
      className="card"
      style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
      onClick={onClick}
      whileHover={{ scale: 1.005 }}
      transition={{ duration: 0.15 }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0
      }}>
        {CATEGORY_ICONS[complaint.category] || '📋'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {complaint.title}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{complaint.location?.building}</span>
          <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>•</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(complaint.createdAt)}</span>
        </div>
      </div>

      <div className={`status-chip status-${complaint.status}`}>
        {STATUS_LABELS[complaint.status] || complaint.status}
      </div>

      <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </motion.div>
  );
};

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ myComplaints: 0, myClosed: 0, myPetitions: 0, recentComplaints: [] });
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, complaintsRes] = await Promise.all([
          analyticsAPI.getMyStats(),
          complaintAPI.getAll({ limit: 5 }),
        ]);
        setStats(statsRes.data.analytics || {});
        setComplaints(complaintsRes.data.complaints || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const statCards = [
    { icon: FileText,     label: 'Total Complaints',    value: stats.myComplaints || 0, color: '#00D4FF', delay: 0 },
    { icon: CheckCircle,  label: 'Resolved',            value: stats.myClosed || 0,      color: '#10B981', delay: 0.1 },
    { icon: Clock,        label: 'Active Issues',       value: (stats.myComplaints || 0) - (stats.myClosed || 0), color: '#F59E0B', delay: 0.2 },
    { icon: Star,         label: 'My Petitions',        value: stats.myPetitions || 0,   color: '#8B5CF6', delay: 0.3 },
  ];

  const quickActions = [
    { label: 'New Complaint', icon: '🚨', color: '#F43F5E', to: '/student/complaints/new', desc: 'Report an issue' },
    { label: 'My Complaints', icon: '📋', color: '#00D4FF', to: '/student/complaints', desc: 'Track your reports' },
    { label: 'Petitions',     icon: '✊', color: '#8B5CF6', to: '/student/petitions', desc: 'Raise community voice' },
    { label: 'Polls',         icon: '🗳️', color: '#F59E0B', to: '/student/polls', desc: 'Vote on decisions' },
    { label: 'Lost & Found',  icon: '🔍', color: '#10B981', to: '/student/lost-found', desc: 'Report lost items' },
    { label: 'Notifications', icon: '🔔', color: '#F97316', to: '/student/notifications', desc: 'View all updates' },
  ];

  return (
    <DashboardLayout
      title="Student Dashboard"
      subtitle={`${greeting}, ${user?.name?.split(' ')[0]}! 👋`}
      actions={
        <button className="btn btn-primary" onClick={() => navigate('/student/complaints/new')} id="new-complaint-btn">
          <Plus size={16} /> New Complaint
        </button>
      }
    >
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(139,92,246,0.08) 100%)',
          border: '1px solid rgba(0,212,255,0.2)',
          borderRadius: 18,
          padding: '20px 24px',
          marginBottom: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            {greeting}, {user?.name?.split(' ')[0]}! 👋
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {user?.rollNumber} • {user?.department} • Year {user?.year} • {user?.hostelBlock}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/student/complaints/new')}
          id="dashboard-new-complaint-btn"
        >
          <AlertTriangle size={16} /> Report Issue
        </button>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
        {/* Quick Actions */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} style={{ color: 'var(--cyan)' }} /> Quick Actions
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {quickActions.map((action) => (
              <motion.button
                key={action.to}
                onClick={() => navigate(action.to)}
                className="card"
                style={{
                  padding: '16px', cursor: 'pointer',
                  textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8,
                  border: 'none', background: 'var(--bg-card)',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id={`quick-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div style={{ fontSize: 24 }}>{action.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: action.color }}>{action.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{action.desc}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Recent Complaints */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} style={{ color: 'var(--cyan)' }} /> Recent Complaints
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/student/complaints')}>
              View all <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map((n) => (
                <div key={n} className="skeleton" style={{ height: 70, borderRadius: 14 }} />
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No complaints yet.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => navigate('/student/complaints/new')}>
                <Plus size={14} /> File First Complaint
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {complaints.map((c) => (
                <ComplaintRow key={c._id} complaint={c} onClick={() => navigate(`/complaints/${c._id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
