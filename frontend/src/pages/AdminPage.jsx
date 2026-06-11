import { useEffect, useState } from 'react';
import Navbar from '../components/common/Navbar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import authService from '../services/authService';
import travelPlanService from '../services/travelPlanService';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([authService.getAllUsers(), travelPlanService.getAllAdmin()])
      .then(([u, p]) => { setUsers(u); setPlans(p); })
      .catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteUser = async (id) => {
    if (id === user.id) return alert("You can't delete your own account.");
    if (!confirm('Delete this user account?')) return;
    try {
      await authService.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch { alert('Failed to delete user.'); }
  };

  const handleDeletePlan = async (id) => {
    if (!confirm('Delete this travel plan and all its data?')) return;
    try {
      await travelPlanService.removeAdmin(id);
      setPlans(prev => prev.filter(p => p.id !== id));
    } catch { alert('Failed to delete plan.'); }
  };

  const getUserEmail = (userId) => users.find(u => u.id === userId)?.email || userId;

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <h2 className="mb-4">Admin Panel</h2>
        <ErrorMessage message={error} />
        {loading ? <LoadingSpinner /> : (
          <>
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span>Registered Users</span>
                <span className="badge bg-secondary">{users.length} total</span>
              </div>
              <div className="card-body">
                {users.length === 0
                  ? <p className="text-muted">No users found.</p>
                  : <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr><th>Name</th><th>Email</th><th>Role</th><th>Registered</th><th></th></tr>
                        </thead>
                        <tbody>
                          {users.map(u => (
                            <tr key={u.id}>
                              <td>
                                {u.firstName} {u.lastName}
                                {u.id === user.id && <span className="badge bg-primary ms-2">You</span>}
                              </td>
                              <td>{u.email}</td>
                              <td>
                                <span className={`badge ${u.role === 'Admin' ? 'bg-danger' : 'bg-secondary'}`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="text-muted small">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                              </td>
                              <td>
                                {u.id !== user.id && (
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteUser(u.id)}>
                                    Delete
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                }
              </div>
            </div>

            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span>All Travel Plans</span>
                <span className="badge bg-secondary">{plans.length} total</span>
              </div>
              <div className="card-body">
                {plans.length === 0
                  ? <p className="text-muted">No plans found.</p>
                  : <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr><th>Plan Name</th><th>Owner</th><th>Dates</th><th>Budget</th><th></th></tr>
                        </thead>
                        <tbody>
                          {plans.map(p => (
                            <tr key={p.id}>
                              <td><strong>{p.name}</strong></td>
                              <td className="text-muted small">{getUserEmail(p.userId)}</td>
                              <td className="small">{p.startDate} → {p.endDate}</td>
                              <td>${p.budget?.toLocaleString()}</td>
                              <td>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeletePlan(p.id)}>
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                }
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
