import { createContext, useContext, useState, useCallback } from 'react';
import travelPlanService from '../services/travelPlanService';

const TravelPlanContext = createContext(null);

export function TravelPlanProvider({ children }) {
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await travelPlanService.getAll();
      setPlans(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load plans.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlan = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await travelPlanService.getById(id);
      setCurrentPlan(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load plan.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPlan = async (data) => {
    const plan = await travelPlanService.create(data);
    setPlans(prev => [plan, ...prev]);
    return plan;
  };

  const updatePlan = async (id, data) => {
    const updated = await travelPlanService.update(id, data);
    setPlans(prev => prev.map(p => p.id === id ? updated : p));
    if (currentPlan?.id === id) setCurrentPlan(updated);
    return updated;
  };

  const removePlan = async (id) => {
    await travelPlanService.remove(id);
    setPlans(prev => prev.filter(p => p.id !== id));
    if (currentPlan?.id === id) setCurrentPlan(null);
  };

  return (
    <TravelPlanContext.Provider value={{
      plans, currentPlan, loading, error,
      fetchPlans, fetchPlan, createPlan, updatePlan, removePlan,
      setCurrentPlan
    }}>
      {children}
    </TravelPlanContext.Provider>
  );
}

export function useTravelPlan() {
  return useContext(TravelPlanContext);
}
