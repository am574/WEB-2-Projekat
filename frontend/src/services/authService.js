import axios from 'axios';
import { User } from '../models/User';

const BASE_URL = import.meta.env.VITE_AUTH_SERVICE_URL;

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const authService = {
  async register(firstName, lastName, email, password) {
    const res = await api.post('/api/auth/register', { firstName, lastName, email, password });
    return { token: res.data.token, user: new User(res.data.user) };
  },

  async login(email, password) {
    const res = await api.post('/api/auth/login', { email, password });
    return { token: res.data.token, user: new User(res.data.user) };
  },

  async getAllUsers() {
    const res = await api.get('/api/users');
    return res.data.map(u => new User(u));
  },

  async deleteUser(id) {
    await api.delete(`/api/users/${id}`);
  },
};

export default authService;
