import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { Activity, Users, Clock, AlertTriangle, FileText, CheckCircle, BarChart2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { analyticsAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { CATEGORY_LABELS, STATUS_LABELS } from '../../utils/constants';

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#F43F5E', '#0EA5E9', '#EC4899', '#6366F1'];

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await analyticsAPI.getUniversity();
        setData(res.data.analytics);
      } catch (err) {
        toast.error('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) return (
    <DashboardLayout title="Platform Analytics">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {[1,2,3,4].map(n => <div key={n} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="skeleton" style={{ height: 350, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 350, borderRadius: 16 }} />
      </div>
    </DashboardLayout>
  );

  const { overview, byCategory, byStatus, byPriority, byBuilding, monthlyTrend, avgResolutionHours, satisfactionScore } = data;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trendData = monthlyTrend?.map(d => ({
    name: `${monthNames[d._id.month - 1]} ${d._id.year}`,
    Complaints: d.count
  })) || [];

  const categoryData = byCategory?.map(d => ({
    name: CATEGORY_LABELS[d._id] || d._id,
    value: d.count
  })) || [];

  const statusData = byStatus?.map(d => ({
    name: STATUS_LABELS[d._id] || d._id,
    value: d.count
  })) || [];

  return (
    <DashboardLayout
      title="Platform Analytics"
      subtitle="University-wide metrics and performance data."
    >
      {/* Top Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={<FileText size={20} color="var(--violet)" />} title="Total Complaints" value={overview.totalComplaints} />
        <StatCard icon={<CheckCircle size={20} color="var(--emerald)" />} title="Closed Issues" value={overview.closedComplaints} />
        <StatCard icon={<AlertTriangle size={20} color="var(--rose)" />} title="Emergencies" value={overview.emergencyComplaints} />
        <StatCard icon={<Users size={20} color="var(--cyan)" />} title="Active Users" value={overview.totalUsers} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard icon={<Clock size={20} color="var(--amber)" />} title="Avg Resolution Time" value={avgResolutionHours ? `${avgResolutionHours} hrs` : 'N/A'} />
        <StatCard icon={<Star size={20} color="var(--amber)" />} title="Satisfaction Score" value={satisfactionScore ? `${satisfactionScore}/5.0` : 'N/A'} />
        <StatCard icon={<BarChart2 size={20} color="var(--primary)" />} title="Active Polls" value={overview.activePolls} />
        <StatCard icon={<Activity size={20} color="var(--emerald)" />} title="Active Petitions" value={overview.activePetitions} />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Trend Chart */}
        <motion.div className="card" style={{ padding: 24 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Complaints Trend (6 Months)</h3>
          <div style={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)' }} 
                  itemStyle={{ color: 'var(--violet)' }}
                />
                <Line type="monotone" dataKey="Complaints" stroke="var(--violet)" strokeWidth={3} dot={{ r: 4, fill: 'var(--violet)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div className="card" style={{ padding: 24 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Complaints by Category</h3>
          <div style={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value">
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8 }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        {/* Status Distribution */}
        <motion.div className="card" style={{ padding: 24 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Current Status Distribution</h3>
          <div style={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={11} width={100} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8 }} />
                <Bar dataKey="value" fill="var(--emerald)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Building Hotspots */}
        <motion.div className="card" style={{ padding: 24 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Hotspots (Top Buildings)</h3>
          <div style={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byBuilding} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="_id" stroke="var(--text-muted)" fontSize={11} angle={-45} textAnchor="end" />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8 }} />
                <Bar dataKey="count" fill="var(--cyan)" radius={[4, 4, 0, 0]}>
                  {byBuilding?.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index+3) % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

    </DashboardLayout>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <motion.div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
          {value}
        </div>
      </div>
    </motion.div>
  );
}
