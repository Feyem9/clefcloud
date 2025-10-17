/**
 * Service API pour communiquer avec le backend NestJS
 * Base URL: http://localhost:3000/api
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Classe pour gérer les requêtes HTTP vers le backend
 */
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Récupérer le token d'authentification depuis le localStorage
   */
  getAuthToken() {
    return localStorage.getItem('accessToken');
  }

  /**
   * Définir le token d'authentification
   */
  setAuthToken(token) {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  /**
   * Récupérer le refresh token
   */
  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Définir le refresh token
   */
  setRefreshToken(token) {
    if (token) {
      localStorage.setItem('refreshToken', token);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }

  /**
   * Méthode générique pour faire des requêtes HTTP
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Ajouter le token d'authentification si disponible
    if (token && !options.skipAuth) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      // Si le token est expiré (401), essayer de le rafraîchir
      if (response.status === 401 && !options.skipAuth && !endpoint.includes('/auth/refresh-token')) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Réessayer la requête avec le nouveau token
          config.headers['Authorization'] = `Bearer ${this.getAuthToken()}`;
          const retryResponse = await fetch(url, config);
          return this.handleResponse(retryResponse);
        }
      }

      return this.handleResponse(response);
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  /**
   * Gérer la réponse HTTP
   */
  async handleResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || 'Une erreur est survenue');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  /**
   * Rafraîchir le token d'accès
   */
  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken();
    const email = localStorage.getItem('userEmail');

    if (!refreshToken || !email) {
      this.logout();
      return false;
    }

    try {
      const data = await this.request('/auth/refresh-token', {
        method: 'POST',
        body: JSON.stringify({ refreshToken, email }),
        skipAuth: true,
      });

      if (data.tokens && data.tokens.accessToken) {
        this.setAuthToken(data.tokens.accessToken);
        if (data.tokens.idToken) {
          localStorage.setItem('idToken', data.tokens.idToken);
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      return false;
    }
  }

  /**
   * Déconnexion (nettoyer les tokens)
   */
  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('user');
  }

  // ========================================
  // AUTHENTIFICATION
  // ========================================

  /**
   * Inscription
   */
  async signup(email, password, phone) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, phone }),
      skipAuth: true,
    });
  }

  /**
   * Confirmer l'inscription avec le code
   */
  async confirmSignup(email, code) {
    return this.request('/auth/confirm-signup', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
      skipAuth: true,
    });
  }

  /**
   * Connexion
   */
  async signin(email, password) {
    const data = await this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });

    // Sauvegarder les tokens
    if (data.tokens) {
      this.setAuthToken(data.tokens.accessToken);
      this.setRefreshToken(data.tokens.refreshToken);
      if (data.tokens.idToken) {
        localStorage.setItem('idToken', data.tokens.idToken);
      }
    }

    // Sauvegarder l'email et les infos utilisateur
    if (data.user) {
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  }

  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  async getProfile() {
    return this.request('/auth/me');
  }

  /**
   * Changer le mot de passe
   */
  async changePassword(oldPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  /**
   * Déconnexion (côté serveur)
   */
  async signout() {
    try {
      await this.request('/auth/signout', {
        method: 'POST',
      });
    } finally {
      this.logout();
    }
  }

  /**
   * Mot de passe oublié
   */
  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    });
  }

  /**
   * Confirmer la réinitialisation du mot de passe
   */
  async confirmForgotPassword(email, code, newPassword) {
    return this.request('/auth/confirm-forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
      skipAuth: true,
    });
  }

  /**
   * Renvoyer le code de confirmation
   */
  async resendConfirmationCode(email) {
    return this.request('/auth/resend-confirmation-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    });
  }

  // ========================================
  // PARTITIONS
  // ========================================

  /**
   * Récupérer toutes les partitions
   */
  async getPartitions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/partitions${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Récupérer une partition par ID
   */
  async getPartition(id) {
    return this.request(`/partitions/${id}`);
  }

  /**
   * Upload une partition
   */
  async uploadPartition(formData) {
    const url = `${this.baseURL}/partitions/upload`;
    const token = this.getAuthToken();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData, // Ne pas définir Content-Type pour FormData
    });

    return this.handleResponse(response);
  }

  /**
   * Supprimer une partition
   */
  async deletePartition(id) {
    return this.request(`/partitions/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Obtenir l'URL de téléchargement
   */
  async getDownloadUrl(id) {
    return this.request(`/partitions/${id}/download`);
  }

  // ========================================
  // FAVORIS
  // ========================================

  /**
   * Ajouter une partition aux favoris
   */
  async addToFavorites(partitionId) {
    return this.request(`/partitions/${partitionId}/favorite`, {
      method: 'POST',
    });
  }

  /**
   * Retirer une partition des favoris
   */
  async removeFromFavorites(partitionId) {
    return this.request(`/partitions/${partitionId}/favorite`, {
      method: 'DELETE',
    });
  }

  /**
   * Récupérer la liste des favoris
   */
  async getFavorites(limit = 20, offset = 0) {
    return this.request(`/partitions/favorites/list?limit=${limit}&offset=${offset}`);
  }

  // ========================================
  // STATISTIQUES
  // ========================================

  /**
   * Récupérer les statistiques de l'utilisateur
   */
  async getUserStats() {
    return this.request('/partitions/stats/user');
  }

  /**
   * Récupérer les partitions populaires
   */
  async getPopularPartitions(limit = 10) {
    return this.request(`/partitions/stats/popular?limit=${limit}`);
  }

  // ========================================
  // UTILISATEURS
  // ========================================

  /**
   * Récupérer un profil utilisateur
   */
  async getUserProfile(userId) {
    return this.request(`/users/${userId}`);
  }

  /**
   * Récupérer les partitions d'un utilisateur
   */
  async getUserPartitions(userId, limit = 10, offset = 0) {
    return this.request(`/users/${userId}/partitions?limit=${limit}&offset=${offset}`);
  }

  /**
   * Mettre à jour le profil
   */
  async updateProfile(userId, data) {
    return this.request(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

// Exporter une instance unique (singleton)
const apiService = new ApiService();
export default apiService;
