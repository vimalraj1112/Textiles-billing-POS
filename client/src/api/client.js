import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mathi_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const onLogin = window.location.pathname === '/login';
      localStorage.removeItem('mathi_token');
      localStorage.removeItem('mathi_user');
      if (!onLogin) window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;