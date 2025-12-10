import axios from 'axios';

const normalizeBaseURL = (rawUrl) => {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);

    // Render services expose an internal port (e.g., 10000) that must not be used externally.
    const isExternalHost = url.hostname !== 'localhost' && url.hostname !== '127.0.0.1';
    if (isExternalHost && url.protocol === 'https:' && url.port) {
      url.port = '';
    }

    return url.toString().replace(/\/$/, '');
  } catch (err) {
    // Fall back to the raw string with a trimmed trailing slash.
    return rawUrl.replace(/\/$/, '');
  }
};

const fallbackBaseURL =
  process.env.NODE_ENV === 'production'
    ? 'https://lunar-calendar-app.onrender.com/api'
    : 'http://localhost:5000/api';

const baseURL = normalizeBaseURL(process.env.REACT_APP_API_URL) || fallbackBaseURL;

const API = axios.create({
  baseURL
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default API;