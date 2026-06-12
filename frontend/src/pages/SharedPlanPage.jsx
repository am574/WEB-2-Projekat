import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import sharingService from '../services/sharingService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

export default function SharedPlanPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', notes: '' });
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    sharingService.getSharedPlan(token)
      .then(d => {
        setData(d);
        setEditForm({ name: d.plan.name, description: d.plan.description || '', notes: d.plan.notes || '' });
      })
      .catch(err => setError(err.response?.data?.message || 'This share link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    setSaveError('');
    setSaving(true);
    try {
      const updated = await sharingService.editSharedPlan(token, editForm);
      setData(prev => ({ ...prev, plan: { ...prev.plan, ...updated } }));
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <LoadingSpinner />
    </div>
  );

  if (error) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center">
        <h3>Link Unavailable</h3>
        <ErrorMessage message={error} />
        <Link to="/" className="btn btn-primary mt-2">Go to App</Link>
      </div>
    </div>
  );

  const { plan, accessType } = data;
  const canEdit = accessType === 'EDIT';

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">{plan.name}</h2>
          <p className="text-muted mb-0">{plan.startDate} → {plan.endDate}</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className={`badge ${canEdit ? 'bg-warning text-dark' : 'bg-info text-dark'}`}>
            {canEdit ? 'Edit Access' : 'View Only'}
          </span>
          {canEdit && !editing && (
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditing(true)}>
              Edit Plan
            </button>
          )}
          <Link to="/" className="btn btn-outline-primary btn-sm">Sign In</Link>
        </div>
      </div>

      {editing && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title mb-3">Edit Plan</h5>
            <ErrorMessage message={saveError} />
            <div className="mb-3">
              <label className="form-label">Plan Name</label>
              <input
                className="form-control"
                value={editForm.name}
                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={3}
                value={editForm.description}
                onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Notes</label>
              <textarea
                className="form-control"
                rows={2}
                value={editForm.notes}
                onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="btn btn-outline-secondary" onClick={() => { setEditing(false); setSaveError(''); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="row g-3">
        <div className="col-md-8">
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">About this Trip</h5>
              {plan.description ? <p>{plan.description}</p> : <p className="text-muted">No description.</p>}
              {plan.notes && <><hr /><p className="text-muted small">{plan.notes}</p></>}
            </div>
          </div>

          {plan.destinations?.length > 0 && (
            <div className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">Destinations</h5>
                <div className="row g-2">
                  {plan.destinations.map(d => (
                    <div key={d.id} className="col-md-6">
                      <div className="border rounded p-2">
                        <strong>{d.name}</strong>
                        <p className="small text-muted mb-0">📍 {d.location}</p>
                        <p className="small mb-0">{d.arrivalDate} → {d.departureDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {plan.activities?.length > 0 && (
            <div className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">Activities</h5>
                <div className="list-group list-group-flush">
                  {plan.activities.map(a => (
                    <div key={a.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between">
                        <div>
                          <strong>{a.name}</strong>
                          <p className="small text-muted mb-0">
                            {a.date}{a.time ? ` at ${a.time}` : ''}
                            {a.location ? ` · ${a.location}` : ''}
                          </p>
                        </div>
                        <span className="badge bg-secondary align-self-start">{a.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-md-4">
          <div className="card bg-primary text-white mb-3">
            <div className="card-body text-center">
              <h6>Planned Budget</h6>
              <h3>${plan.budget?.toLocaleString()}</h3>
            </div>
          </div>

          {plan.checklistItems?.length > 0 && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Checklist</h5>
                {plan.checklistItems.map(item => (
                  <div key={item.id} className="d-flex align-items-center gap-2 mb-1">
                    <input type="checkbox" readOnly checked={item.isCompleted} className="form-check-input" />
                    <span className={item.isCompleted ? 'text-muted text-decoration-line-through' : ''}>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-center mt-5 text-muted small">
        Shared via <strong>TravelPlanner</strong> · <Link to="/">Create your own plan</Link>
      </div>
    </div>
  );
}
