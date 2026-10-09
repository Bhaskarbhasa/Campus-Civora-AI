export const COLORS = {
  bgPrimary: '#F8FAFC',
  bgSecondary: '#F1F5F9',
  bgCard: '#FFFFFF',
  
  borderSubtle: '#E2E8F0',
  borderMuted: '#CBD5E1',
  borderActive: '#2563EB',
  
  primary: '#2563EB',         // Royal Blue
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  
  cyan: '#0EA5E9',
  cyanLight: '#F0F9FF',
  
  violet: '#8B5CF6',          // AI Engine Violet
  violetLight: '#F5F3FF',
  
  emerald: '#10B981',         // Resolved
  emeraldLight: '#ECFDF5',
  
  amber: '#F59E0B',           // In Progress / Warning
  amberLight: '#FEF3C7',
  
  rose: '#F43F5E',            // Emergency / Danger
  roseLight: '#FFE4E6',
  
  textPrimary: '#0F172A',     // Dark slate
  textSecondary: '#475569',   // Mid slate
  textMuted: '#64748B',       // Light slate
  textDisabled: '#94A3B8',
  
  white: '#FFFFFF',
};

export const STATUS_CONFIG = {
  submitted: { label: 'Submitted', color: '#2563EB', bg: '#EFF6FF', icon: '📝' },
  ai_processing: { label: 'AI Processing', color: '#D97706', bg: '#FEF3C7', icon: '🤖' },
  under_verification: { label: 'Under Verification', color: '#0284C7', bg: '#F0F9FF', icon: '🔍' },
  verified: { label: 'Verified', color: '#059669', bg: '#ECFDF5', icon: '✅' },
  approved: { label: 'Approved', color: '#059669', bg: '#ECFDF5', icon: '👍' },
  assigned: { label: 'Assigned', color: '#D97706', bg: '#FFFBEB', icon: '👷' },
  work_in_progress: { label: 'In Progress', color: '#EA580C', bg: '#FFEDD5', icon: '🔧' },
  completed: { label: 'Completed', color: '#059669', bg: '#D1FAE5', icon: '🎉' },
  pending_student_verification: { label: 'Verify Completion', color: '#7C3AED', bg: '#EDE9FE', icon: '⭐' },
  closed: { label: 'Closed', color: '#64748B', bg: '#F1F5F9', icon: '📁' },
  rejected: { label: 'Rejected', color: '#DC2626', bg: '#FEE2E2', icon: '❌' },
  escalated: { label: 'Escalated', color: '#E11D48', bg: '#FFE4E6', icon: '⚠️' },
};

export const CATEGORY_ICONS = {
  electrical: '⚡',
  plumbing: '💧',
  internet_connectivity: '🌐',
  classroom_equipment: '🖥️',
  laboratory_equipment: '🔬',
  hostel_facilities: '🛏️',
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
  other: '📌',
};

export const SHADOWS = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
};
