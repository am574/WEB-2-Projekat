import { useEffect, useState } from 'react';
import expenseService from '../../services/expenseService';
import { EXPENSE_CATEGORIES } from '../../models/Expense';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ExpensesTab({ planId }) {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');

  useEffect(() => { load(); }, [planId]);

  const load = async () => {
    try {
      setLoading(true);
      const [exp, sum] = await Promise.all([
        expenseService.getAll(planId),
        expenseService.getBudgetSummary(planId)
      ]);
      setExpenses(exp);
      setSummary(sum);
    } catch { setError('Failed to load expenses.'); }
    finally { setLoading(false); }
  };

  function emptyForm() {
    return { name: '', category: 'Other', amount: '', date: '', description: '' };
  }

  const handleEdit = (e) => {
    setEditing(e.id);
    setForm({ name: e.name, category: e.category, amount: e.amount, date: e.date, description: e.description || '' });
    setShowForm(false);
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setFormError('');
    const payload = { ...form, amount: parseFloat(form.amount) };
    try {
      if (editing) {
        const updated = await expenseService.update(editing, payload);
        setExpenses(prev => prev.map(e => e.id === editing ? updated : e));
        setEditing(null);
      } else {
        const created = await expenseService.create(planId, payload);
        setExpenses(prev => [...prev, created]);
        setShowForm(false);
      }
      setForm(emptyForm());
      const sum = await expenseService.getBudgetSummary(planId);
      setSummary(sum);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save expense.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await expenseService.remove(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      const sum = await expenseService.getBudgetSummary(planId);
      setSummary(sum);
    } catch { alert('Failed to delete expense.'); }
  };

  if (loading) return <LoadingSpinner />;

  const spentPct = summary ? Math.min((summary.totalSpent / summary.plannedBudget) * 100, 100) : 0;

  return (
    <div>
      <ErrorMessage message={error} />

      {summary && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Budget Summary</h5>
            <div className="row g-3 mb-3">
              <div className="col-md-4 text-center">
                <p className="text-muted small mb-1">Planned Budget</p>
                <h4 className="text-primary">${summary.plannedBudget.toLocaleString()}</h4>
              </div>
              <div className="col-md-4 text-center">
                <p className="text-muted small mb-1">Total Spent</p>
                <h4 className="text-danger">${summary.totalSpent.toLocaleString()}</h4>
              </div>
              <div className="col-md-4 text-center">
                <p className="text-muted small mb-1">Remaining</p>
                <h4 className={summary.remaining >= 0 ? 'text-success' : 'text-danger'}>
                  ${summary.remaining.toLocaleString()}
                </h4>
              </div>
            </div>
            <div className="progress mb-2" style={{ height: 10 }}>
              <div className={`progress-bar ${spentPct >= 100 ? 'bg-danger' : 'bg-primary'}`} style={{ width: `${spentPct}%` }} />
            </div>
            {Object.keys(summary.byCategory || {}).length > 0 && (
              <div className="d-flex flex-wrap gap-2 mt-2">
                {Object.entries(summary.byCategory).map(([cat, amt]) => (
                  <span key={cat} className="badge bg-light text-dark border">{cat}: ${amt.toLocaleString()}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between mb-3">
        <h5>Expenses</h5>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm()); }}>+ Add Expense</button>
      </div>

      {(showForm || editing) && (
        <div className="card mb-3">
          <div className="card-body">
            <h6>{editing ? 'Edit Expense' : 'New Expense'}</h6>
            <ErrorMessage message={formError} />
            <form onSubmit={handleSubmit}>
              <div className="row g-2 mb-2">
                <div className="col-md-6">
                  <input className="form-control" placeholder="Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required maxLength={200} />
                </div>
                <div className="col-md-3">
                  <select className="form-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-md-3">
                  <input type="number" className="form-control" placeholder="Amount *" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required min={0} />
                </div>
              </div>
              <div className="row g-2 mb-2">
                <div className="col-md-4">
                  <label className="form-label small">Date *</label>
                  <input type="date" className="form-control" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
                </div>
                <div className="col-md-8">
                  <label className="form-label small">Description</label>
                  <input className="form-control" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} maxLength={1000} />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary btn-sm">Save</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm()); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {expenses.length === 0
        ? <p className="text-muted">No expenses recorded yet.</p>
        : <div className="table-responsive">
            <table className="table table-hover">
              <thead><tr><th>Name</th><th>Category</th><th>Amount</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td>{e.name}</td>
                    <td><span className="badge bg-secondary">{e.category}</span></td>
                    <td><strong>${e.amount.toLocaleString()}</strong></td>
                    <td>{e.date}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleEdit(e)}>Edit</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(e.id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      }
    </div>
  );
}
