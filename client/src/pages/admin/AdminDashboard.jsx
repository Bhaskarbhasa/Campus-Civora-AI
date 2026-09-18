import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, TrendingUp, AlertTriangle, CheckCircle, Clock, Activity, BarChart2 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { analyticsAPI } from '../../services/api';
import { CATEGORY_LABELS } from '../../utils/constants';

const COLORS = ['#00D4FF', '#8B5CF6', '#F59E0B', '#10B981', '#F43F5E', '#F97316', '#06B6D4', '#EC4899'];

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getUniversity()
      .then(({ data }) => setAnalytics(data.analytics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardLayout title="Admin Dashboard">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
        {[1,2,3,4].map((n) => <div key={n} className="skeleton" style={{ height: 130 }} />)}
      </div>
      <div className="skeleton" style={{ height: 300 }} />
    </DashboardLayout>
  );

  const overview = analytics?.overview || {};
  const monthlyData = analytics?.monthlyTrend?.map((m) => ({
    name: new Date(m._id.year, m._id.month - 1).toLocaleString('en', { month: 'short' }),
    complaints: m.count,
  })) || [];

  const categoryData = (analytics?.byCategory || [])
    .filter((c) => c._id)
    .slice(0, 8)
    .map((c) => ({ name: CATEGORY_LABELS[c._id] || c._id, value: c.count }));

  const statusData = (analytics?.byStatus || []).map((s) => ({ name: s._id?.replace(/_/g, ' '), value: s.count }));

  const stats = [
    { label: 'Total Complaints', value: overview.totalComplaints || 0, icon: FileText, color: '#00D4FF', sub: 'All time' },
    { label: 'Open Issues', value: overview.openComplaints || 0, icon: Clock, color: '#F59E0B', sub: 'Need attention' },
    { label: 'Resolved', value: overview.closedComplaints || 0, icon: CheckCircle, color: '#10B981', sub: `${overview.totalComplaints ? Math.round((overview.closedComplaints / overview.totalComplaints) * 100) : 0}% resolution rate` },
    { label: 'Emergency', value: overview.emergencyComplaints || 0, icon: AlertTriangle, color: '#F43F5E', sub: 'Critical issues' },
    { label: 'Total Users', value: overview.totalUsers || 0, icon: Users, color: '#8B5CF6', sub: `${overview.totalStudents || 0} students` },
    { label: 'Active Petitions', value: overview.activePetitions || 0, icon: TrendingUp, color: '#F97316', sub: 'Under review' },
    { label: 'Avg Resolution', value: analytics?.avgResolutionHours ? `${analytics.avgResolutionHours}h` : 'N/A', icon: Activity, color: '#06B6D4', sub: 'Average time' },
    { label: 'Satisfaction', value: analytics?.satisfactionScore ? `${analytics.satisfactionScore}/5` : 'N/A', icon: BarChart2, color: '#EC4899', sub: 'Student rating' },
  ];

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="Amrita Vishwa Vidyapeetham — Campus CIVORA AI">
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 3 }}>{s.value}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.sub}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${s.color}, transparent)`, borderRadius: '0 0 14px 14px', opacity: 0.5 }} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
        {/* Monthly Trend */}
        <motion.div className="card" style={{ padding: 24 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>📈 Monthly Complaints Trend</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', borderRadius: 10 }} labelStyle={{ color: 'var(--text-primary)', fontWeight: 700 }} itemStyle={{ color: 'var(--cyan)' }} />
                <Area type="monotone" dataKey="complaints" stroke="#00D4FF" fill="url(#grad)" strokeWidth={2.5} dot={{ fill: '#00D4FF', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No trend data yet</div>
          )}
        </motion.div>

        {/* Category breakdown */}
        <motion.div className="card" style={{ padding: 24 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>🗂️ Complaints by Category</h3>
          {categoryData.length > 0 ? (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', borderRadius: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {categoryData.slice(0, 6).map((c, i) => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data yet</div>}
        </motion.div>
      </div>

      {/* Status Distribution */}
      <motion.div className="card" style={{ padding: 24 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>🏷️ Complaint Status Distribution</h3>
        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statusData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', borderRadius: 10 }} labelStyle={{ color: 'var(--text-primary)', fontWeight: 700 }} itemStyle={{ color: 'var(--cyan)' }} />
              <Bar dataKey="value" fill="#00D4FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data yet</div>}
      </motion.div>
    </DashboardLayout>
  );
}
