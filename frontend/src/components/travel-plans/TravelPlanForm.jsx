import { useState } from 'react';

export default function TravelPlanForm({ initial = {}, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    description: initial.description || '',
    startDate: initial.startDate || '',
    endDate: initial.endDate || '',
    budget: initial.budget || 0,
    notes: initial.notes || '',
  });

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, budget: parseFloat(form.budget) });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Name *</label>
        <input name="name" className="form-control" value={form.name} onChange={handleChange} required maxLength={200} />
      </div>
      <div className="mb-3">
        <label className="form-label">Description</label>
        <textarea name="description" className="form-control" rows={2} value={form.description} onChange={handleChange} maxLength={1000} />
      </div>
      <div className="row g-2 mb-3">
        <div className="col">
          <label className="form-label">Start Date *</label>
          <input name="startDate" type="date" className="form-control" value={form.startDate} onChange={handleChange} required />
        </div>
        <div className="col">
          <label className="form-label">End Date *</label>
          <input name="endDate" type="date" className="form-control" value={form.endDate} onChange={handleChange} required min={form.startDate} />
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label">Budget ($) *</label>
        <input name="budget" type="number" className="form-control" value={form.budget} onChange={handleChange} min={0} required />
      </div>
      <div className="mb-3">
        <label className="form-label">Notes</label>
        <textarea name="notes" className="form-control" rows={2} value={form.notes} onChange={handleChange} maxLength={2000} />
      </div>
      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-primary">Save</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
