import axios from 'axios';

const normalizeBaseURL = (rawUrl) => {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);

    // Render services expose an internal port (e.g., 10000) that must not be used externally.
    // Drop any explicit port for external hosts so the default (80/443) is used instead.
    const isExternalHost = url.hostname !== 'localhost' && url.hostname !== '127.0.0.1';
    if (isExternalHost && url.port) {
      url.port = '';
    }

    return url.toString().replace(/\/$/, '');
  } catch (err) {
    // Fall back to the raw string with a trimmed trailing slash.
    return rawUrl.replace(/\/$/, '');
  }
};

const resolveBaseURL = () => {
  const envBaseURL = normalizeBaseURL(process.env.REACT_APP_API_URL);
  if (envBaseURL) return envBaseURL;

  // When frontend and backend are served from the same host (e.g., Render),
  // prefer the current origin to avoid CORS and port mismatches.
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    const sameOriginApi = `${window.location.origin}/api`;
    return normalizeBaseURL(sameOriginApi);
  }

  // Local development fallback.
  return normalizeBaseURL('http://localhost:5000/api');
};

const baseURL = resolveBaseURL();

// Exported for non-axios consumers (e.g., fetch in offline helpers).
export const API_BASE_URL = baseURL;

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