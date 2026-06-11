import { useEffect, useState } from 'react';
import travelPlanService from '../../services/travelPlanService';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';

export default function DestinationsTab({ planId }) {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', location: '', arrivalDate: '', departureDate: '', description: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => { load(); }, [planId]);

  const load = async () => {
    try {
      setLoading(true);
      setDestinations(await travelPlanService.getDestinations(planId));
    } catch { setError('Failed to load destinations.'); }
    finally { setLoading(false); }
  };

  const resetForm = () => setForm({ name: '', location: '', arrivalDate: '', departureDate: '', description: '' });

  const handleEdit = (d) => {
    setEditing(d.id);
    setForm({ name: d.name, location: d.location, arrivalDate: d.arrivalDate, departureDate: d.departureDate, description: d.description || '' });
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editing) {
        const updated = await travelPlanService.updateDestination(editing, form);
        setDestinations(prev => prev.map(d => d.id === editing ? updated : d));
        setEditing(null);
      } else {
        const created = await travelPlanService.createDestination(planId, form);
        setDestinations(prev => [...prev, created]);
        setShowForm(false);
      }
      resetForm();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save destination.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this destination?')) return;
    try {
      await travelPlanService.removeDestination(id);
      setDestinations(prev => prev.filter(d => d.id !== id));
    } catch { alert('Failed to delete destination.'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between mb-3">
        <h5>Destinations</h5>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(true); setEditing(null); resetForm(); }}>+ Add Destination</button>
      </div>
      <ErrorMessage message={error} />

      {(showForm || editing) && (
        <div className="card mb-3">
          <div className="card-body">
            <h6>{editing ? 'Edit Destination' : 'New Destination'}</h6>
            <ErrorMessage message={formError} />
            <form onSubmit={handleSubmit}>
              <div className="row g-2 mb-2">
                <div className="col-md-6">
                  <input className="form-control" placeholder="Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required maxLength={200} />
                </div>
                <div className="col-md-6">
                  <input className="form-control" placeholder="Location *" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} required maxLength={300} />
                </div>
              </div>
              <div className="row g-2 mb-2">
                <div className="col">
                  <label className="form-label small">Arrival Date *</label>
                  <input type="date" className="form-control" value={form.arrivalDate} onChange={e => setForm(p => ({ ...p, arrivalDate: e.target.value }))} required />
                </div>
                <div className="col">
                  <label className="form-label small">Departure Date *</label>
                  <input type="date" className="form-control" value={form.departureDate} onChange={e => setForm(p => ({ ...p, departureDate: e.target.value }))} required min={form.arrivalDate} />
                </div>
              </div>
              <textarea className="form-control mb-2" placeholder="Description" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} maxLength={1000} />
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary btn-sm">Save</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setShowForm(false); setEditing(null); resetForm(); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {destinations.length === 0
        ? <p className="text-muted">No destinations added yet.</p>
        : <div className="row g-3">
            {destinations.map(d => (
              <div key={d.id} className="col-md-6">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <h6 className="mb-1">{d.name}</h6>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleEdit(d)}>Edit</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(d.id)}>✕</button>
                      </div>
                    </div>
                    <p className="text-muted small mb-1">📍 {d.location}</p>
                    <p className="small mb-0">{d.arrivalDate} → {d.departureDate}</p>
                    {d.description && <p className="small text-muted mt-1 mb-0">{d.description}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}
