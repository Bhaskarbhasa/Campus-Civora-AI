import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';

import useAuthStore from './store/authStore';
import { getDashboardRoute } from './utils/constants';

// Eager imports for critical pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/auth/LoginPage';

// Lazy imports for pages
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const ComplaintsListPage = lazy(() => import('./pages/student/ComplaintsListPage'));
const NewComplaintPage = lazy(() => import('./pages/student/NewComplaintPage'));
const ComplaintDetailPage = lazy(() => import('./pages/student/ComplaintDetailPage'));
const WardenDashboard = lazy(() => import('./pages/warden/WardenDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'));

// Shared lazy pages
const PetitionsPage = lazy(() => import('./pages/shared/PetitionsPage'));
const PollsPage = lazy(() => import('./pages/shared/PollsPage'));
const LostFoundPage = lazy(() => import('./pages/shared/LostFoundPage'));
const NotificationsPage = lazy(() => import('./pages/shared/NotificationsPage'));
const AnalyticsPage = lazy(() => import('./pages/shared/AnalyticsPage'));
const MaintenanceDashboard = lazy(() => import('./pages/maintenance/MaintenanceDashboard'));
const TechnicianDashboard = lazy(() => import('./pages/maintenance/TechnicianDashboard'));
const ProfilePage = lazy(() => import('./pages/shared/ProfilePage'));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
    <div style={{ textAlign: 'center' }}>
      <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading Campus CIVORA AI...</p>
    </div>
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to={getDashboardRoute(user?.role)} replace />;
  return <Outlet />;
};

// Public only route (redirect to dashboard if logged in)
const PublicRoute = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) return <Navigate to={getDashboardRoute(user?.role)} replace />;
  return <Outlet />;
};

const TECHNICIAN_ROLES = ['electrician', 'plumber', 'carpenter', 'civil_maintenance', 'network_technician', 'housekeeping'];
const ADMIN_ROLES = ['super_admin', 'principal', 'director', 'registrar'];
const AUTHORITY_ROLES = [...ADMIN_ROLES, 'dean', 'student_welfare', 'hod', 'chief_warden', 'warden'];

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-muted)',
            borderRadius: 12,
            fontSize: 14,
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#000' } },
          error: { iconTheme: { primary: '#F43F5E', secondary: '#000' } },
        }}
      />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* === PUBLIC ROUTES === */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<LoginPage />} />
          </Route>

          {/* === STUDENT ROUTES === */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/complaints" element={<ComplaintsListPage />} />
            <Route path="/student/complaints/new" element={<NewComplaintPage />} />
            <Route path="/student/complaints/:id" element={<ComplaintDetailPage />} />
            <Route path="/student/petitions" element={<PetitionsPage />} />
            <Route path="/student/polls" element={<PollsPage />} />
            <Route path="/student/lost-found" element={<LostFoundPage />} />
            <Route path="/student/notifications" element={<NotificationsPage />} />
          </Route>

          {/* === WARDEN ROUTES === */}
          <Route element={<ProtectedRoute allowedRoles={['warden']} />}>
            <Route path="/warden/dashboard" element={<WardenDashboard />} />
            <Route path="/warden/complaints" element={<ComplaintsListPage />} />
            <Route path="/warden/users" element={<UserManagementPage />} />
          </Route>

          {/* === CHIEF WARDEN ROUTES === */}
          <Route element={<ProtectedRoute allowedRoles={['chief_warden']} />}>
            <Route path="/chief-warden/dashboard" element={<WardenDashboard />} />
            <Route path="/chief-warden/complaints" element={<ComplaintsListPage />} />
            <Route path="/chief-warden/users" element={<UserManagementPage />} />
            <Route path="/chief-warden/polls" element={<PollsPage />} />
          </Route>

          {/* === ACADEMIC VERIFIERS ROUTES === */}
          <Route element={<ProtectedRoute allowedRoles={['class_advisor', 'lab_assistant']} />}>
            <Route path="/advisor/dashboard" element={<WardenDashboard />} />
            <Route path="/lab/dashboard" element={<WardenDashboard />} />
            <Route path="/advisor/complaints" element={<ComplaintsListPage />} />
            <Route path="/lab/complaints" element={<ComplaintsListPage />} />
          </Route>

          {/* === MAINTENANCE SUPERVISOR === */}
          <Route element={<ProtectedRoute allowedRoles={['maintenance_supervisor']} />}>
            <Route path="/maintenance/supervisor/dashboard" element={<MaintenanceDashboard />} />
            <Route path="/maintenance/supervisor/complaints" element={<ComplaintsListPage />} />
            <Route path="/maintenance/supervisor/technicians" element={<UserManagementPage />} />
          </Route>

          {/* === TECHNICIAN ROUTES === */}
          <Route element={<ProtectedRoute allowedRoles={TECHNICIAN_ROLES} />}>
            <Route path="/maintenance/technician/dashboard" element={<TechnicianDashboard />} />
            <Route path="/maintenance/technician/work-orders" element={<ComplaintsListPage />} />
          </Route>

          {/* === HOD ROUTES === */}
          <Route element={<ProtectedRoute allowedRoles={['hod', 'dean', 'student_welfare']} />}>
            <Route path="/hod/dashboard" element={<AdminDashboard />} />
            <Route path="/hod/complaints" element={<ComplaintsListPage />} />
            <Route path="/dean/dashboard" element={<AdminDashboard />} />
            <Route path="/dean/complaints" element={<ComplaintsListPage />} />
            <Route path="/dean/petitions" element={<PetitionsPage />} />
            <Route path="/dean/polls" element={<PollsPage />} />
            <Route path="/welfare/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* === ADMIN ROUTES === */}
          <Route element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/complaints" element={<ComplaintsListPage />} />
            <Route path="/admin/petitions" element={<PetitionsPage />} />
            <Route path="/admin/polls" element={<PollsPage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/lost-found" element={<LostFoundPage />} />
            <Route path="/admin/audit-logs" element={<NotificationsPage />} />
            <Route path="/admin/settings" element={<ProfilePage />} />
          </Route>

          {/* === SHARED PROTECTED ROUTES === */}
          <Route element={<ProtectedRoute />}>
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
          </Route>

          {/* === ROOT REDIRECT === */}
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function RootRedirect() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={getDashboardRoute(user?.role)} replace />;
}

function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: 'var(--bg-primary)' }}>
      <div style={{ fontSize: 80 }}>404</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Page Not Found</h1>
      <p style={{ color: 'var(--text-secondary)' }}>The page you're looking for doesn't exist.</p>
      <a href="/" className="btn btn-primary">Go Home</a>
    </div>
  );
}

export default App;
