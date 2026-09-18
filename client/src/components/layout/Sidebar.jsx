import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, Search, Bell, LogOut, Settings,
  ChevronRight, AlertTriangle, Menu, X, TrendingUp, Vote, MapPin,
  Shield, Wrench, BookOpen, Bus, Utensils, ClipboardList, Star,
  Activity, Package
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { getInitials, ROLE_LABELS } from '../../utils/constants';
import { notificationAPI } from '../../services/api';

const NAV_CONFIG = {
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/student/dashboard' },
    { label: 'My Complaints', icon: FileText, to: '/student/complaints' },
    { label: 'New Complaint', icon: AlertTriangle, to: '/student/complaints/new' },
    { label: 'Petitions', icon: ClipboardList, to: '/student/petitions' },
    { label: 'Polls', icon: Vote, to: '/student/polls' },
    { label: 'Lost & Found', icon: Search, to: '/student/lost-found' },
    { label: 'Notifications', icon: Bell, to: '/student/notifications' },
  ],
  warden: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/warden/dashboard' },
    { label: 'Complaints', icon: FileText, to: '/warden/complaints' },
    { label: 'Users', icon: Users, to: '/warden/users' },
    { label: 'Notifications', icon: Bell, to: '/student/notifications' },
  ],
  chief_warden: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/chief-warden/dashboard' },
    { label: 'Complaints', icon: FileText, to: '/chief-warden/complaints' },
    { label: 'Users', icon: Users, to: '/chief-warden/users' },
    { label: 'Polls', icon: Vote, to: '/chief-warden/polls' },
    { label: 'Analytics', icon: TrendingUp, to: '/analytics' },
    { label: 'Notifications', icon: Bell, to: '/student/notifications' },
  ],
  maintenance_supervisor: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/maintenance/supervisor/dashboard' },
    { label: 'All Complaints', icon: FileText, to: '/maintenance/supervisor/complaints' },
    { label: 'Technicians', icon: Users, to: '/maintenance/supervisor/technicians' },
    { label: 'Analytics', icon: TrendingUp, to: '/analytics' },
    { label: 'Notifications', icon: Bell, to: '/student/notifications' },
  ],
};

// Technician roles all use same nav
const TECHNICIAN_ROLES = ['electrician', 'plumber', 'carpenter', 'civil_maintenance', 'network_technician', 'housekeeping'];
TECHNICIAN_ROLES.forEach((role) => {
  NAV_CONFIG[role] = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/maintenance/technician/dashboard' },
    { label: 'My Work Orders', icon: Wrench, to: '/maintenance/technician/work-orders' },
    { label: 'Notifications', icon: Bell, to: '/student/notifications' },
  ];
});

NAV_CONFIG.hod = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/hod/dashboard' },
  { label: 'Complaints', icon: FileText, to: '/hod/complaints' },
  { label: 'Analytics', icon: TrendingUp, to: '/analytics' },
  { label: 'Notifications', icon: Bell, to: '/student/notifications' },
];

NAV_CONFIG.dean = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dean/dashboard' },
  { label: 'Complaints', icon: FileText, to: '/dean/complaints' },
  { label: 'Petitions', icon: ClipboardList, to: '/dean/petitions' },
  { label: 'Polls', icon: Vote, to: '/dean/polls' },
  { label: 'Analytics', icon: TrendingUp, to: '/analytics' },
  { label: 'Notifications', icon: Bell, to: '/student/notifications' },
];

NAV_CONFIG.student_welfare = NAV_CONFIG.dean;

['registrar', 'principal', 'director', 'super_admin'].forEach((role) => {
  NAV_CONFIG[role] = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
    { label: 'All Complaints', icon: FileText, to: '/admin/complaints' },
    { label: 'Petitions', icon: ClipboardList, to: '/admin/petitions' },
    { label: 'Polls', icon: Vote, to: '/admin/polls' },
    { label: 'Users', icon: Users, to: '/admin/users' },
    { label: 'Analytics', icon: TrendingUp, to: '/analytics' },
    { label: 'Lost & Found', icon: Package, to: '/admin/lost-found' },
    { label: 'Audit Logs', icon: Activity, to: '/admin/audit-logs' },
    { label: 'Notifications', icon: Bell, to: '/student/notifications' },
    { label: 'Settings', icon: Settings, to: '/admin/settings' },
  ];
});

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = NAV_CONFIG[user?.role] || NAV_CONFIG.student;

  useEffect(() => {
    notificationAPI.getAll({ unreadOnly: 'true' })
      .then(({ data }) => setUnreadCount(data.unreadCount || 0))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">CA</div>
          <div className="sidebar-logo-text">
            <span>Campus CIVORA AI</span>
            <span>Amrita Vishwa Vidyapeetham</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            const isNotif = item.to.includes('notifications');

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => onClose?.()}
              >
                <Icon size={17} />
                {item.label}
                {isNotif && unreadCount > 0 && (
                  <span className="badge badge-rose ml-auto">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
                {isActive && !isNotif && <ChevronRight size={14} className="ml-auto" style={{ color: 'var(--cyan)' }} />}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => navigate('/profile')}>
            <div className="sidebar-user-avatar">
              {user?.profilePhoto?.url
                ? <img src={user.profilePhoto.url} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : getInitials(user?.name)}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name truncate">{user?.name}</div>
              <div className="sidebar-user-role">{ROLE_LABELS[user?.role] || user?.role}</div>
            </div>
          </div>

          <button
            className="sidebar-link"
            style={{ width: '100%', marginTop: 4, color: 'var(--rose)' }}
            onClick={handleLogout}
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
