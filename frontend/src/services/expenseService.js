import axios from 'axios';
import { Expense } from '../models/Expense';

const BASE_URL = import.meta.env.VITE_EXPENSE_SERVICE_URL;

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const expenseService = {
  async getAll(planId) {
    const res = await api.get(`/api/travel-plans/${planId}/expenses`);
    return res.data.map(e => new Expense(e));
  },

  async create(planId, data) {
    const res = await api.post(`/api/travel-plans/${planId}/expenses`, data);
    return new Expense(res.data);
  },

  async update(id, data) {
    const res = await api.put(`/api/expenses/${id}`, data);
    return new Expense(res.data);
  },

  async remove(id) {
    await api.delete(`/api/expenses/${id}`);
  },

  async getBudgetSummary(planId) {
    const res = await api.get(`/api/travel-plans/${planId}/budget-summary`);
    return res.data;
  },
};

export default expenseService;
