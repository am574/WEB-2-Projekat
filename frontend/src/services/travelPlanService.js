import axios from 'axios';
import { TravelPlan } from '../models/TravelPlan';
import { Destination } from '../models/Destination';
import { Activity } from '../models/Activity';
import { ChecklistItem } from '../models/ChecklistItem';

const BASE_URL = import.meta.env.VITE_TRAVEL_PLAN_SERVICE_URL;

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const travelPlanService = {
  // Travel Plans
  async getAll() {
    const res = await api.get('/api/travel-plans');
    return res.data.map(p => new TravelPlan(p));
  },

  async getById(id) {
    const res = await api.get(`/api/travel-plans/${id}`);
    return new TravelPlan(res.data);
  },

  async create(data) {
    const res = await api.post('/api/travel-plans', data);
    return new TravelPlan(res.data);
  },

  async update(id, data) {
    const res = await api.put(`/api/travel-plans/${id}`, data);
    return new TravelPlan(res.data);
  },

  async remove(id) {
    await api.delete(`/api/travel-plans/${id}`);
  },

  // Destinations
  async getDestinations(planId) {
    const res = await api.get(`/api/travel-plans/${planId}/destinations`);
    return res.data.map(d => new Destination(d));
  },

  async createDestination(planId, data) {
    const res = await api.post(`/api/travel-plans/${planId}/destinations`, data);
    return new Destination(res.data);
  },

  async updateDestination(id, data) {
    const res = await api.put(`/api/destinations/${id}`, data);
    return new Destination(res.data);
  },

  async removeDestination(id) {
    await api.delete(`/api/destinations/${id}`);
  },

  // Activities
  async getActivities(planId) {
    const res = await api.get(`/api/travel-plans/${planId}/activities`);
    return res.data.map(a => new Activity(a));
  },

  async createActivity(planId, data) {
    const res = await api.post(`/api/travel-plans/${planId}/activities`, data);
    return new Activity(res.data);
  },

  async updateActivity(id, data) {
    const res = await api.put(`/api/activities/${id}`, data);
    return new Activity(res.data);
  },

  async removeActivity(id) {
    await api.delete(`/api/activities/${id}`);
  },

  // Checklist
  async getChecklist(planId) {
    const res = await api.get(`/api/travel-plans/${planId}/checklist`);
    return res.data.map(c => new ChecklistItem(c));
  },

  async createChecklistItem(planId, data) {
    const res = await api.post(`/api/travel-plans/${planId}/checklist`, data);
    return new ChecklistItem(res.data);
  },

  async updateChecklistItem(id, data) {
    const res = await api.put(`/api/checklist/${id}`, data);
    return new ChecklistItem(res.data);
  },

  async toggleChecklistItem(id) {
    const res = await api.patch(`/api/checklist/${id}/toggle`);
    return new ChecklistItem(res.data);
  },

  async removeChecklistItem(id) {
    await api.delete(`/api/checklist/${id}`);
  },

  // Admin
  async getAllAdmin() {
    const res = await api.get('/api/travel-plans/admin/all');
    return res.data.map(p => new TravelPlan(p));
  },

  async removeAdmin(id) {
    await api.delete(`/api/travel-plans/admin/${id}`);
  },
};

export default travelPlanService;
