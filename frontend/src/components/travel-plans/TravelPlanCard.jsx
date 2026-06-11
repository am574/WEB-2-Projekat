export default function TravelPlanCard({ plan, onClick, onDelete }) {
  const daysLeft = Math.ceil((new Date(plan.startDate) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="card h-100 shadow-sm" style={{ cursor: 'pointer' }} onClick={onClick}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <h5 className="card-title mb-1">{plan.name}</h5>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={e => { e.stopPropagation(); onDelete(); }}
          >✕</button>
        </div>
        {plan.description && <p className="text-muted small mb-2">{plan.description}</p>}
        <p className="mb-1 small">
          <span className="text-muted">📅 </span>
          {plan.startDate} → {plan.endDate}
        </p>
        <p className="mb-0 small">
          <span className="text-muted">💰 Budget: </span>
          <strong>${plan.budget.toLocaleString()}</strong>
        </p>
      </div>
      <div className="card-footer text-muted small">
        {daysLeft > 0 ? `Starts in ${daysLeft} days` : daysLeft === 0 ? 'Starts today!' : 'Trip in progress or completed'}
      </div>
    </div>
  );
}
