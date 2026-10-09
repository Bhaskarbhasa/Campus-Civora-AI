import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://campus-civora-ai.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
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
};

export const complaintAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  create: (formData) => api.post('/complaints', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  verifyCompletion: (id, data) => api.put(`/complaints/${id}/verify`, data),
};

export const lostFoundAPI = {
  getAll: () => api.get('/lost-found'),
  create: (formData) => api.post('/lost-found', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
};

export default api;
