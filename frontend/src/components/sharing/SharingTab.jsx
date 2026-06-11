import { useEffect, useState } from 'react';
import sharingService from '../../services/sharingService';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';

export default function SharingTab({ planId }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ accessType: 'VIEW', expiresAt: '' });
  const [createError, setCreateError] = useState('');
  const [newToken, setNewToken] = useState(null);

  useEffect(() => { load(); }, [planId]);

  const load = async () => {
    try {
      setLoading(true);
      setTokens(await sharingService.getTokensForPlan(planId));
    } catch { setError('Failed to load share tokens.'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    try {
      const created = await sharingService.createShareToken(planId, {
        accessType: form.accessType,
        expiresAt: form.expiresAt || null,
      });
      setTokens(prev => [...prev, created]);
      setNewToken(created);
      setCreating(false);
      setForm({ accessType: 'VIEW', expiresAt: '' });
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create share link.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Revoke this share link?')) return;
    try {
      await sharingService.deleteShareToken(id);
      setTokens(prev => prev.filter(t => t.id !== id));
      if (newToken?.id === id) setNewToken(null);
    } catch { alert('Failed to revoke share link.'); }
  };

  const shareUrl = (token) =>
    `${window.location.origin}/shared/${token}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Share Plan</h5>
        <button className="btn btn-primary btn-sm" onClick={() => { setCreating(true); setNewToken(null); }}>+ Create Share Link</button>
      </div>
      <ErrorMessage message={error} />

      {creating && (
        <div className="card mb-3">
          <div className="card-body">
            <h6>New Share Link</h6>
            <ErrorMessage message={createError} />
            <form onSubmit={handleCreate}>
              <div className="row g-2 mb-2">
                <div className="col-md-6">
                  <label className="form-label small">Access Type</label>
                  <select className="form-select" value={form.accessType} onChange={e => setForm(p => ({ ...p, accessType: e.target.value }))}>
                    <option value="VIEW">View only</option>
                    <option value="EDIT">Edit access</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small">Expires At (optional)</label>
                  <input type="datetime-local" className="form-control" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary btn-sm">Generate Link</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setCreating(false); setCreateError(''); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {newToken && (
        <div className="alert alert-success">
          <h6>Share link created!</h6>
          <div className="d-flex gap-2 align-items-center mb-2">
            <input className="form-control form-control-sm" readOnly value={shareUrl(newToken.token)} />
            <button className="btn btn-sm btn-outline-secondary text-nowrap" onClick={() => copyToClipboard(shareUrl(newToken.token))}>Copy</button>
          </div>
          {newToken.qrCodeBase64 && (
            <div className="text-center">
              <p className="small text-muted">QR Code:</p>
              <img src={`data:image/png;base64,${newToken.qrCodeBase64}`} alt="QR Code" style={{ width: 180, height: 180 }} />
            </div>
          )}
        </div>
      )}

      {tokens.length === 0
        ? <p className="text-muted">No active share links.</p>
        : <div className="list-group">
            {tokens.map(t => {
              const expired = t.expiresAt && new Date(t.expiresAt) < new Date();
              return (
                <div key={t.id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1 me-2">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className={`badge ${t.accessType === 'EDIT' ? 'bg-warning text-dark' : 'bg-info text-dark'}`}>
                          {t.accessType === 'EDIT' ? 'Edit' : 'View'}
                        </span>
                        {expired && <span className="badge bg-danger">Expired</span>}
                      </div>
                      <div className="d-flex gap-2 align-items-center">
                        <input className="form-control form-control-sm" readOnly value={shareUrl(t.token)} />
                        <button className="btn btn-sm btn-outline-secondary text-nowrap" onClick={() => copyToClipboard(shareUrl(t.token))}>Copy</button>
                      </div>
                      {t.expiresAt && (
                        <p className="small text-muted mt-1 mb-0">
                          Expires: {new Date(t.expiresAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(t.id)}>Revoke</button>
                  </div>
                </div>
              );
            })}
          </div>
      }
    </div>
  );
}
