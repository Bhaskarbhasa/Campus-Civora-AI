import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken }, { withCredentials: true });
        const { accessToken, user } = res.data;
        localStorage.setItem('accessToken', accessToken);
        if (res.data.refreshToken) localStorage.setItem('refreshToken', res.data.refreshToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  sendOTP: (email) => api.post('/auth/send-otp', { email }),
  staffSetup: (email) => api.post('/auth/staff-setup', { email }),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  setPassword: (tempToken, password) => api.post('/auth/set-password', { tempToken, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
};

// Complaints
export const complaintAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  create: (formData) => api.post('/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  verify: (id, data) => api.post(`/complaints/${id}/verify`, data),
  approve: (id, data) => api.post(`/complaints/${id}/approve`, data),
  assign: (id, data) => api.post(`/complaints/${id}/assign`, data),
  updateWork: (id, formData) => api.patch(`/complaints/${id}/update-work`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  verifyCompletion: (id, data) => api.post(`/complaints/${id}/verify-completion`, data),
  addCommunitySupport: (id, data) => api.post(`/complaints/${id}/community-support`, data),
  addComment: (id, data) => api.post(`/complaints/${id}/comments`, data),
  getStats: () => api.get('/complaints/stats'),
};

// Petitions
export const petitionAPI = {
  getAll: (params) => api.get('/petitions', { params }),
  getById: (id) => api.get(`/petitions/${id}`),
  create: (data) => api.post('/petitions', data),
  vote: (id, data) => api.post(`/petitions/${id}/vote`, data),
  decide: (id, data) => api.post(`/petitions/${id}/decide`, data),
};

// Polls
export const pollAPI = {
  getAll: (params) => api.get('/polls', { params }),
  getById: (id) => api.get(`/polls/${id}`),
  create: (data) => api.post('/polls', data),
  vote: (id, data) => api.post(`/polls/${id}/vote`, data),
};

// Lost & Found
export const lostFoundAPI = {
  getAll: (params) => api.get('/lost-found', { params }),
  getById: (id) => api.get(`/lost-found/${id}`),
  create: (formData) => api.post('/lost-found', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  claim: (id, data) => api.post(`/lost-found/${id}/claim`, data),
};

// Notifications
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Analytics
export const analyticsAPI = {
  getUniversity: () => api.get('/analytics/university'),
  getDepartment: (dept) => api.get(`/analytics/department/${dept}`),
  getMyStats: () => api.get('/analytics/me'),
};

// Users
export const userAPI = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.patch('/users/me', data),
  getAll: (params) => api.get('/admin/users', { params }),
  create: (data) => api.post('/admin/users', data),
  update: (id, data) => api.put(`/admin/users/${id}`, data),
  deactivate: (id) => api.delete(`/admin/users/${id}`),
};

// Admin
export const adminAPI = {
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
};

export default api;
