import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Intercepteur pour ajouter le token Firebase à chaque requête
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('clefcloud_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const apiService = {
  // Authentification
  setAuthToken: (token) => {
    if (token) {
      localStorage.setItem('clefcloud_token', token);
    } else {
      localStorage.removeItem('clefcloud_token');
    }
  },

  validateToken: async (token) => {
    const response = await api.post('/auth/validate', { token });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('clefcloud_token');
  },

  // Partitions
  getPartitions: async () => {
    const response = await api.get('/partitions');
    return response.data;
  },

  getPartition: async (id) => {
    const response = await api.get(`/partitions/${id}`);
    return response.data;
  },

  // Upload avec PDF et Audio
  createPartition: async (formData) => {
    const response = await api.post('/partitions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deletePartition: async (id) => {
    const response = await api.delete(`/partitions/${id}`);
    return response.data;
  },

  // Profil
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

export default apiService;
