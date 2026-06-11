import { useEffect, useState } from 'react';
import travelPlanService from '../../services/travelPlanService';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ChecklistTab({ planId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newText, setNewText] = useState('');
  const [addError, setAddError] = useState('');

  useEffect(() => { load(); }, [planId]);

  const load = async () => {
    try {
      setLoading(true);
      setItems(await travelPlanService.getChecklist(planId));
    } catch { setError('Failed to load checklist.'); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    setAddError('');
    try {
      const created = await travelPlanService.createChecklistItem(planId, { name: newText.trim() });
      setItems(prev => [...prev, created]);
      setNewText('');
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add item.');
    }
  };

  const handleToggle = async (id) => {
    try {
      const updated = await travelPlanService.toggleChecklistItem(id);
      setItems(prev => prev.map(i => i.id === id ? updated : i));
    } catch { alert('Failed to toggle item.'); }
  };

  const handleDelete = async (id) => {
    try {
      await travelPlanService.removeChecklistItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch { alert('Failed to delete item.'); }
  };

  if (loading) return <LoadingSpinner />;

  const done = items.filter(i => i.isCompleted).length;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Checklist</h5>
        {items.length > 0 && (
          <span className="text-muted small">{done}/{items.length} completed</span>
        )}
      </div>
      <ErrorMessage message={error} />

      {items.length > 0 && (
        <div className="progress mb-3" style={{ height: 8 }}>
          <div className="progress-bar bg-success" style={{ width: `${(done / items.length) * 100}%` }} />
        </div>
      )}

      <form onSubmit={handleAdd} className="d-flex gap-2 mb-3">
        <input
          className="form-control"
          placeholder="Add checklist item..."
          value={newText}
          onChange={e => setNewText(e.target.value)}
          maxLength={500}
        />
        <button type="submit" className="btn btn-primary">Add</button>
      </form>
      {addError && <ErrorMessage message={addError} />}

      {items.length === 0
        ? <p className="text-muted">No checklist items yet.</p>
        : <div className="list-group">
            {items.map(item => (
              <div key={item.id} className="list-group-item d-flex align-items-center gap-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={item.isCompleted}
                  onChange={() => handleToggle(item.id)}
                  style={{ width: 20, height: 20, cursor: 'pointer' }}
                />
                <span className={`flex-grow-1 ${item.isCompleted ? 'text-muted text-decoration-line-through' : ''}`}>
                  {item.name}
                </span>
                <button className="btn btn-sm btn-outline-danger ms-auto" onClick={() => handleDelete(item.id)}>✕</button>
              </div>
            ))}
          </div>
      }
    </div>
  );
}
