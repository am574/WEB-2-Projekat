import { useEffect, useState } from 'react';
import travelPlanService from '../../services/travelPlanService';
import { ACTIVITY_STATUSES } from '../../models/Activity';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';

const STATUS_COLORS = { Planned: 'secondary', Reserved: 'primary', Completed: 'success', Cancelled: 'danger' };

export default function ActivitiesTab({ planId }) {
  const [activities, setActivities] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');
  const [view, setView] = useState('list');

  useEffect(() => { load(); }, [planId]);

  const load = async () => {
    try {
      setLoading(true);
      const [acts, dests] = await Promise.all([
        travelPlanService.getActivities(planId),
        travelPlanService.getDestinations(planId),
      ]);
      setActivities(acts);
      setDestinations(dests);
    } catch { setError('Failed to load activities.'); }
    finally { setLoading(false); }
  };

  function emptyForm() {
    return { destinationId: '', name: '', date: '', time: '', location: '', description: '', estimatedCost: '', status: 'Planned' };
  }

  const handleEdit = (a) => {
    setEditing(a.id);
    setForm({ destinationId: a.destinationId || '', name: a.name, date: a.date, time: a.time || '', location: a.location || '', description: a.description || '', estimatedCost: a.estimatedCost ?? '', status: a.status });
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const payload = { ...form, destinationId: form.destinationId || null, estimatedCost: form.estimatedCost !== '' ? parseFloat(form.estimatedCost) : null, time: form.time || null };
    try {
      if (editing) {
        const updated = await travelPlanService.updateActivity(editing, payload);
        setActivities(prev => prev.map(a => a.id === editing ? updated : a));
        setEditing(null);
      } else {
        const created = await travelPlanService.createActivity(planId, payload);
        setActivities(prev => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
        setShowForm(false);
      }
      setForm(emptyForm());
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save activity.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this activity?')) return;
    try {
      await travelPlanService.removeActivity(id);
      setActivities(prev => prev.filter(a => a.id !== id));
    } catch { alert('Failed to delete activity.'); }
  };

  // Group by date for calendar view
  const grouped = activities.reduce((acc, a) => {
    const key = a.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Activities</h5>
        <div className="d-flex gap-2">
          <div className="btn-group btn-group-sm">
            <button className={`btn ${view === 'list' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setView('list')}>List</button>
            <button className={`btn ${view === 'calendar' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setView('calendar')}>Calendar</button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm()); }}>+ Add Activity</button>
        </div>
      </div>
      <ErrorMessage message={error} />

      {(showForm || editing) && (
        <div className="card mb-3">
          <div className="card-body">
            <h6>{editing ? 'Edit Activity' : 'New Activity'}</h6>
            <ErrorMessage message={formError} />
            <form onSubmit={handleSubmit}>
              <div className="row g-2 mb-2">
                <div className="col-md-8">
                  <input className="form-control" placeholder="Activity name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required maxLength={200} />
                </div>
                <div className="col-md-4">
                  <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    {ACTIVITY_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="row g-2 mb-2">
                <div className="col-md-4">
                  <label className="form-label small">Date *</label>
                  <input type="date" className="form-control" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Time</label>
                  <input type="time" className="form-control" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Est. Cost ($)</label>
                  <input type="number" className="form-control" placeholder="0" value={form.estimatedCost} onChange={e => setForm(p => ({ ...p, estimatedCost: e.target.value }))} min={0} />
                </div>
              </div>
              <div className="row g-2 mb-2">
                <div className="col-md-6">
                  <input className="form-control" placeholder="Location" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} maxLength={300} />
                </div>
                <div className="col-md-6">
                  <select className="form-select" value={form.destinationId} onChange={e => setForm(p => ({ ...p, destinationId: e.target.value }))}>
                    <option value="">No destination</option>
                    {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <textarea className="form-control mb-2" placeholder="Description" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} maxLength={1000} />
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary btn-sm">Save</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm()); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activities.length === 0
        ? <p className="text-muted">No activities added yet.</p>
        : view === 'list'
          ? <ActivityList activities={activities} onEdit={handleEdit} onDelete={handleDelete} />
          : <CalendarView grouped={grouped} onEdit={handleEdit} onDelete={handleDelete} />
      }
    </div>
  );
}

function ActivityList({ activities, onEdit, onDelete }) {
  return (
    <div className="list-group">
      {activities.map(a => (
        <div key={a.id} className="list-group-item d-flex justify-content-between align-items-start">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <strong>{a.name}</strong>
              <span className={`badge bg-${STATUS_COLORS[a.status]}`}>{a.status}</span>
            </div>
            <p className="mb-0 small text-muted">
              {a.date}{a.time ? ` at ${a.time}` : ''}{a.location ? ` · ${a.location}` : ''}
              {a.estimatedCost ? ` · $${a.estimatedCost}` : ''}
            </p>
          </div>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => onEdit(a)}>Edit</button>
            <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(a.id)}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarView({ grouped, onEdit, onDelete }) {
  return (
    <div>
      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, acts]) => (
        <div key={date} className="mb-3">
          <h6 className="text-primary border-bottom pb-1">{date}</h6>
          <div className="list-group">
            {acts.map(a => (
              <div key={a.id} className="list-group-item d-flex justify-content-between align-items-start">
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small">{a.time || '--:--'}</span>
                    <strong>{a.name}</strong>
                    <span className={`badge bg-${STATUS_COLORS[a.status]}`}>{a.status}</span>
                  </div>
                  {a.location && <p className="mb-0 small text-muted">📍 {a.location}</p>}
                </div>
                <div className="d-flex gap-1">
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => onEdit(a)}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(a.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
