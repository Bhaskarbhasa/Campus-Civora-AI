import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://campus-civora-ai.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 35000,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('campus_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting token from AsyncStorage', error);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  sendOTP: (email) => api.post('/auth/send-otp', { email }),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  setPassword: (tempToken, password) => api.post('/auth/set-password', { tempToken, password }),
};

export const complaintAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  getStats: () => api.get('/complaints/stats'),
  create: (formData) => api.post('/complaints', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  addComment: (id, text) => api.post(`/complaints/${id}/comments`, { text }),
  supportComplaint: (id) => api.post(`/complaints/${id}/community-support`),
  verifyCompletion: (id, data) => api.post(`/complaints/${id}/verify-completion`, data),
};

export const lostFoundAPI = {
  getAll: (params) => api.get('/lost-found', { params }),
  getById: (id) => api.get(`/lost-found/${id}`),
  create: (formData) => api.post('/lost-found', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  claim: (id, data) => api.post(`/lost-found/${id}/claim`, data),
};

export const petitionAPI = {
  getAll: (params) => api.get('/petitions', { params }),
  getById: (id) => api.get(`/petitions/${id}`),
  create: (data) => api.post('/petitions', data),
  vote: (id, payload) => api.post(`/petitions/${id}/vote`, payload),
  support: (id, comment = '') => api.post(`/petitions/${id}/vote`, { vote: 'support', comment }),
  oppose: (id, reason = '') => api.post(`/petitions/${id}/vote`, { vote: 'oppose', reason }),
};

export const pollAPI = {
  getAll: (params) => api.get('/polls', { params }),
  getById: (id) => api.get(`/polls/${id}`),
  create: (data) => api.post('/polls', data),
  vote: (id, selectedOptions) => api.post(`/polls/${id}/vote`, { 
    selectedOptions: Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions] 
  }),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
};

export default api;
