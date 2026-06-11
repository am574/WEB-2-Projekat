import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTravelPlan } from '../context/TravelPlanContext';
import Navbar from '../components/common/Navbar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import TravelPlanCard from '../components/travel-plans/TravelPlanCard';
import TravelPlanForm from '../components/travel-plans/TravelPlanForm';

export default function DashboardPage() {
  const { plans, loading, error, fetchPlans, createPlan, removePlan } = useTravelPlan();
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleCreate = async (data) => {
    setFormError('');
    try {
      await createPlan(data);
      setShowForm(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create plan.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this travel plan?')) return;
    try {
      await removePlan(id);
    } catch {
      alert('Failed to delete plan.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">My Travel Plans</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Plan</button>
        </div>

        {showForm && (
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">New Travel Plan</h5>
              <ErrorMessage message={formError} />
              <TravelPlanForm
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        )}

        <ErrorMessage message={error} />
        {loading ? <LoadingSpinner /> : (
          plans.length === 0
            ? <p className="text-muted text-center mt-5">No travel plans yet. Create your first one!</p>
            : <div className="row g-3">
                {plans.map(plan => (
                  <div key={plan.id} className="col-md-6 col-lg-4">
                    <TravelPlanCard
                      plan={plan}
                      onClick={() => navigate(`/plans/${plan.id}`)}
                      onDelete={() => handleDelete(plan.id)}
                    />
                  </div>
                ))}
              </div>
        )}
      </div>
    </>
  );
}
