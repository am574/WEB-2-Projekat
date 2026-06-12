import axios from 'axios';
import { ShareToken } from '../models/ShareToken';

const BASE_URL = import.meta.env.VITE_SHARING_SERVICE_URL;

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const sharingService = {
  async getTokensForPlan(planId) {
    const res = await api.get(`/api/travel-plans/${planId}/share`);
    return res.data.map(t => new ShareToken(t));
  },

  async createShareToken(planId, { accessType, expiresAt = null }) {
    const res = await api.post(`/api/travel-plans/${planId}/share`, { accessType, expiresAt });
    return new ShareToken(res.data);
  },

  async getSharedPlan(token) {
    const res = await api.get(`/api/shared/${token}`);
    return res.data;
  },

  async editSharedPlan(token, data) {
    const res = await api.put(`/api/shared/${token}`, data);
    return res.data;
  },

  async deleteShareToken(id) {
    await api.delete(`/api/sharing/${id}`);
  },
};

export default sharingService;
