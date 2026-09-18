// Priority colors and labels
export const PRIORITY_CONFIG = {
  low:       { label: 'Low',       color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)' },
  medium:    { label: 'Medium',    color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  high:      { label: 'High',      color: '#F97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' },
  emergency: { label: 'Emergency', color: '#F43F5E', bg: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.3)' },
};

export const STATUS_LABELS = {
  submitted: 'Submitted',
  ai_processing: 'AI Processing',
  under_verification: 'Under Verification',
  verified: 'Verified',
  approved: 'Approved',
  assigned: 'Assigned',
  work_in_progress: 'Work In Progress',
  waiting_for_materials: 'Waiting for Materials',
  quality_inspection: 'Quality Inspection',
  completed: 'Completed',
  pending_student_verification: 'Pending Verification',
  closed: 'Closed',
  reopened: 'Reopened',
  rejected: 'Rejected',
  escalated: 'Escalated',
  duplicate: 'Duplicate',
  merged: 'Merged',
  on_hold: 'On Hold',
};

export const CATEGORY_LABELS = {
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  internet_connectivity: 'Internet/Network',
  classroom_equipment: 'Classroom Equipment',
  laboratory_equipment: 'Laboratory Equipment',
  hostel_facilities: 'Hostel Facilities',
  transportation: 'Transportation',
  food_services: 'Food Services',
  security: 'Security',
  housekeeping: 'Housekeeping',
  academic_grievance: 'Academic Grievance',
  examination: 'Examination',
  library: 'Library',
  sports_facilities: 'Sports Facilities',
  medical: 'Medical',
  civil_maintenance: 'Civil Maintenance',
  general_administration: 'Administration',
  other: 'Other',
};

export const CATEGORY_ICONS = {
  electrical: '⚡',
  plumbing: '🔧',
  internet_connectivity: '📶',
  classroom_equipment: '🖥️',
  laboratory_equipment: '🔬',
  hostel_facilities: '🏠',
  transportation: '🚌',
  food_services: '🍽️',
  security: '🛡️',
  housekeeping: '🧹',
  academic_grievance: '📚',
  examination: '📝',
  library: '📖',
  sports_facilities: '⚽',
  medical: '🏥',
  civil_maintenance: '🏗️',
  general_administration: '🏢',
  other: '❓',
};

export const ROLE_LABELS = {
  student: 'Student',
  faculty: 'Faculty Member',
  warden: 'Hostel Warden',
  chief_warden: 'Chief Warden',
  maintenance_supervisor: 'Maintenance Supervisor',
  electrician: 'Electrician',
  plumber: 'Plumber',
  carpenter: 'Carpenter',
  civil_maintenance: 'Civil Maintenance',
  network_technician: 'Network Technician',
  housekeeping: 'Housekeeping',
  hod: 'Head of Department',
  dean: 'Dean',
  student_welfare: 'Student Welfare',
  librarian: 'Librarian',
  transport_coordinator: 'Transport Coordinator',
  security: 'Security',
  mess_manager: 'Mess Manager',
  lab_assistant: 'Lab Assistant',
  class_advisor: 'Class Advisor',
  registrar: 'Registrar',
  principal: 'Principal',
  director: 'Director',
  super_admin: 'Super Administrator',
};

export const DEPARTMENTS = [
  'CSE', 'CSE - AI', 'CSE - CYS', 'CCE', 'ECE', 'ARE', 'MEE'
];

export const HOSTEL_BLOCKS = [
  'Koushitaki Bhavan', 'Chandogya Bhavan', 'Aitareya Bhavan', 
  'Pranava Bhavan', 'Maitri Bhavan', 'Aswini Bhavan'
];

export const LABS = [
  'RHISC Lab', 'VIBES Lab', 'ASRA Lab', 'SHIELD Lab', 
  'AI Innovation Lab', 'Computer Lab 1 & 2'
];

export const CAMPUS_BUILDINGS = [
  ...HOSTEL_BLOCKS,
  ...LABS,
  'Academic Block',
  'Central Library', 'Main Mess Hall', 'Transport Office',
  'Sports Complex', 'Medical Center', 'Administrative Block',
  'Examination Cell', 'Seminar Hall Complex', 'Cafeteria',
  'Parking Area', 'Main Gate', 'Water Plant',
];

export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getStatusColor = (status) => {
  const colors = {
    submitted: '#00D4FF', ai_processing: '#8B5CF6', under_verification: '#F59E0B',
    verified: '#00D4FF', approved: '#8B5CF6', assigned: '#F97316',
    work_in_progress: '#F59E0B', completed: '#10B981', closed: '#10B981',
    rejected: '#F43F5E', escalated: '#F43F5E', duplicate: '#64748b',
    pending_student_verification: '#F59E0B', reopened: '#F97316',
  };
  return colors[status] || '#8B9BB4';
};

export const getDashboardRoute = (role) => {
  const routes = {
    student: '/student/dashboard',
    warden: '/warden/dashboard',
    chief_warden: '/chief-warden/dashboard',
    maintenance_supervisor: '/maintenance/supervisor/dashboard',
    electrician: '/maintenance/technician/dashboard',
    plumber: '/maintenance/technician/dashboard',
    carpenter: '/maintenance/technician/dashboard',
    civil_maintenance: '/maintenance/technician/dashboard',
    network_technician: '/maintenance/technician/dashboard',
    housekeeping: '/maintenance/technician/dashboard',
    hod: '/hod/dashboard',
    dean: '/dean/dashboard',
    class_advisor: '/advisor/dashboard',
    lab_assistant: '/lab/dashboard',
    student_welfare: '/welfare/dashboard',
    librarian: '/librarian/dashboard',
    transport_coordinator: '/transport/dashboard',
    security: '/security/dashboard',
    mess_manager: '/mess/dashboard',
    registrar: '/admin/dashboard',
    principal: '/principal/dashboard',
    director: '/director/dashboard',
    super_admin: '/admin/dashboard',
  };
  return routes[role] || '/student/dashboard';
};
