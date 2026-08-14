import axios from 'axios';

// Detect if we are running in the browser on localhost
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isLocalNetwork = /^(192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|10\.)/.test(window.location.hostname);

// Use Vite's proxy for all local requests (bypasses Windows Firewall completely)
// In production/build, it falls back to VITE_API_URL or origin/api
let BASE_URL = import.meta.env.VITE_API_URL;

// If we are in Vite development mode, just use /api to hit the Vite proxy
if (import.meta.env.DEV) {
  BASE_URL = '/api';
} else if (!BASE_URL) {
  BASE_URL = `${window.location.origin}/api`;
}

export const API_ORIGIN = BASE_URL === '/api' ? '' : BASE_URL.replace('/api', '');

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor — har bir so'rovga JWT token qo'shish
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — 401 bo'lsa logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Agar so'rov login sahifasidan kelsa va 401 bo'lsa, redirect qilmaslik kerak
    if (error.response?.status === 401 && !error.config.url.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('guest');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
