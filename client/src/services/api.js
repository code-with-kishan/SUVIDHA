import axios from 'axios';

const rawApiUrl = String(import.meta.env.VITE_API_URL || '').trim();
const normalizedApiUrl = rawApiUrl.replace(/\/$/, '');

const api = axios.create({
  baseURL: normalizedApiUrl || '/'
});

export const getApiBaseUrl = () => normalizedApiUrl || window.location.origin;

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('suvidha_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
