import API from '../api/client';

export const authService = {
  register: (name, email, password) =>
    API.post('/auth/register', { name, email, password }),

  login: (email, password) =>
    API.post('/auth/login', { email, password }),

  getCurrentUser: () =>
    API.get('/auth/me'),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};