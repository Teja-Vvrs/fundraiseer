import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Request interceptor - Token:', token ? 'Present' : 'Not found');
    console.log('Request URL:', config.url);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Added Authorization header');
    }
    
    // Handle FormData content type
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      url: response.config.url,
      status: response.status,
      data: response.data ? 'Present' : 'No data'
    });
    return response;
  },
  (error) => {
    console.error('Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    
    if (error.response?.status === 401) {
      // Only redirect to login if not already on login page and not trying to login
      if (!window.location.pathname.includes('login')) {
        console.log('Unauthorized access, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  resetPassword: ({ email, newPassword }) => api.post('/auth/reset-password', { email, newPassword }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token })
};

export const userAPI = {
  updateProfile: (userData) => api.put('/users/profile', userData),
  getProfile: () => api.get('/users/profile'),
  verifyNewEmail: (token) => api.post('/users/verify-email', { token })
};

export const campaignAPI = {
  getAllCampaigns: (params = {}) => {
    console.log('Calling getAllCampaigns with params:', params);
    return api.get('/campaigns', { params })
      .then(response => {
        console.log('getAllCampaigns response:', response);
        return response;
      })
      .catch(error => {
        console.error('getAllCampaigns error:', error);
        throw error;
      });
  },
  getCampaignById: (campaignId) => {
    console.log('Fetching campaign by ID:', campaignId);
    return api.get(`/campaigns/${campaignId}`)
      .then(response => {
        console.log('getCampaignById response:', response);
        if (!response.data) {
          throw new Error('No campaign data received');
        }
        return response;
      })
      .catch(error => {
        console.error('getCampaignById error:', error);
        if (error.response?.status === 404) {
          throw new Error('Campaign not found');
        }
        throw error;
      });
  },
  createCampaign: (campaignData) => {
    const formData = new FormData();
    
    // Add all campaign data to FormData
    Object.keys(campaignData).forEach(key => {
      if (key === 'mediaUrls' && Array.isArray(campaignData[key])) {
        // Handle mediaUrls array
        campaignData[key].forEach((url, index) => {
          formData.append(`mediaUrls[${index}]`, url);
        });
      } else if (key === 'fundUtilizationPlan') {
        // Convert object to string for FormData
        formData.append(key, JSON.stringify(campaignData[key]));
      } else {
        formData.append(key, campaignData[key]);
      }
    });

    return api.post('/campaigns/create', formData);
  },
  updateCampaign: (campaignId, campaignData) => api.put(`/campaigns/${campaignId}`, campaignData),
  deleteCampaign: (campaignId) => api.delete(`/campaigns/${campaignId}`),
  donateToCampaign: (campaignId, amount) => {
    console.log('Making donation API call:', { campaignId, amount });
    return api.post(`/campaigns/${campaignId}/donate`, { amount: parseFloat(amount) })
      .then(response => {
        console.log('Donation response:', response);
        return response;
      })
      .catch(error => {
        console.error('Donation API error:', error);
        throw error;
      });
  },
  getDonationHistory: (campaignId) => {
    console.log('Fetching donation history for campaign:', campaignId);
    return api.get(`/campaigns/${campaignId}/donations`)
      .then(response => {
        console.log('Donation history response:', response);
        return response;
      })
      .catch(error => {
        console.error('Error fetching donation history:', error);
        throw error;
      });
  },
  addComment: async (campaignId, text) => {
    try {
      const response = await api.post(`/campaigns/${campaignId}/comments`, { text });
      console.log('Comment response:', response);
      return response;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },
  deleteComment: (commentId) => api.delete(`/campaigns/comments/${commentId}`),
  reportCampaign: (campaignId, reason) => api.post(`/campaigns/${campaignId}/report`, { reason })
};

export const adminAPI = {
  getAllCampaigns: () => {
    console.log('Fetching all campaigns...');
    return api.get('/admin/campaigns')
      .then(response => {
        console.log('Campaigns response:', response);
        return response;
      })
      .catch(error => {
        console.error('Error fetching campaigns:', error);
        throw error;
      });
  },
  moderateCampaign: async (campaignId, status) => {
    console.log('Moderating campaign:', { campaignId, status });
    try {
      const response = await api.patch(`/admin/campaigns/${campaignId}/moderate`, { status });
      console.log('Moderation response:', response);
      return response;
    } catch (error) {
      console.error('Moderation error:', error.response || error);
      throw error;
    }
  },
  getUsers: () => {
    console.log('Fetching users...');
    return api.get('/admin/users')
      .then(response => {
        console.log('Users response:', response);
        return response;
      })
      .catch(error => {
        console.error('Error fetching users:', error);
        throw error;
      });
  },
  createAdmin: (userData) => api.post('/admin/create-admin', userData),
  updateUserRole: async (userId, role) => {
    console.log('Updating user role:', { userId, role });
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Convert IDs to strings for comparison
      const isCurrentUser = currentUser._id?.toString() === userId?.toString();
      
      // Prevent self-demotion
      if (isCurrentUser && role === 'user') {
        throw new Error('Cannot demote yourself from admin');
      }

      const response = await api.patch(`/admin/users/${userId}/role`, { role });
      console.log('Update role response:', response);

      // If updating another user's role to admin, force them to login again
      if (role === 'admin' && !isCurrentUser) {
        return {
          ...response,
          message: 'User role updated to admin. They will need to log in again to access admin features.'
        };
      }

      // If current user's role was changed, clear auth and redirect to login
      if (isCurrentUser) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      return response;
    } catch (error) {
      console.error('Error updating role:', error.response || error);
      throw error;
    }
  },
  getContacts: async ({ page = 1, status = '' }) => {
    const params = new URLSearchParams();
    params.append('page', page);
    if (status) params.append('status', status);
    return api.get('/contact/admin', { params });
  },
  getContactStats: async () => {
    return api.get('/contact/admin/stats');
  },
  updateContactStatus: async (contactId, data) => {
    return api.put(`/contact/admin/${contactId}`, data);
  },
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getRecentCampaigns: () => api.get('/admin/campaigns/recent'),
  getUserStats: () => api.get('/admin/users/stats'),
  exportData: (type) => api.get(`/admin/export/${type}`, { responseType: 'blob' })
};

export const dashboardAPI = {
  getUserDashboard: () => api.get('/dashboard/user'),
  getDonationHistory: () => api.get('/dashboard/donations'),
  getCampaignStats: (campaignId) => api.get(`/dashboard/campaigns/${campaignId}/stats`)
};

export const contactAPI = {
  submit: (contactData) => api.post('/contact', contactData),
  getStatus: (referenceId) => api.get(`/contact/${referenceId}`),
  getUserMessages: (page = 1) => {
    console.log('Fetching user messages with page:', page);
    return api.get('/contact/user/messages', {
      params: { page }
    })
    .then(response => {
      console.log('User messages API response:', response);
      return response;
    })
    .catch(error => {
      console.error('Error fetching user messages:', error.response || error);
      throw error;
    });
  }
};

export default api;