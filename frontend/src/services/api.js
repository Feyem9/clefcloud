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
  getPartitions: async (filters = {}) => {
    const { search, category, messePart } = filters;
    let url = '/partitions?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (category) url += `category=${encodeURIComponent(category)}&`;
    if (messePart) url += `messePart=${encodeURIComponent(messePart)}&`;

    const response = await api.get(url);
    return response.data;
  },

  getFavorites: async () => {
    const response = await api.get('/partitions/favorites');
    return response.data;
  },

  toggleFavorite: async (id) => {
    const response = await api.post(`/partitions/${id}/favorite`);
    return response.data;
  },

  getPartition: async (id) => {
    const response = await api.get(`/partitions/${id}`);
    return response.data;
  },

  getDownloadUrl: async (id) => {
    const response = await api.get(`/partitions/${id}/download`);
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

  // Utilisateur — stats et partitions
  getUserStats: async () => {
    const response = await api.get('/auth/profile');
    const profile = response.data;
    return {
      totalPartitions: profile.totalPartitions || 0,
      totalDownloads: profile.totalDownloads || 0,
      totalViews: profile.totalViews || 0,
      totalFavorites: profile.totalFavorites || 0,
      recentUploads: profile.recentUploads || [],
    };
  },

  getUserPartitions: async (userId, limit = 50, offset = 0) => {
    const response = await api.get(`/users/${userId}/partitions?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  // Paiements — PayUnit
  checkoutPartition: async (partitionId) => {
    const response = await api.post('/payments/checkout/partition', { partitionId });
    return response.data;
  },

  checkoutPremium: async () => {
    const response = await api.post('/payments/checkout/premium');
    return response.data;
  },
};

export default apiService;
