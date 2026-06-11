import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import ErrorMessage from '../components/common/ErrorMessage';

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await authService.register(
        form.firstName, form.lastName, form.email, form.password
      );
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-body p-4">
          <h3 className="card-title text-center mb-4 text-primary fw-bold">TravelApp</h3>
          <h5 className="text-center text-muted mb-4">Create an account</h5>
          <ErrorMessage message={error} />
          <form onSubmit={handleSubmit}>
            <div className="row g-2 mb-3">
              <div className="col">
                <label className="form-label">First Name</label>
                <input name="firstName" className="form-control" value={form.firstName} onChange={handleChange} required maxLength={100} />
              </div>
              <div className="col">
                <label className="form-label">Last Name</label>
                <input name="lastName" className="form-control" value={form.lastName} onChange={handleChange} required maxLength={100} />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input name="email" type="email" className="form-control" value={form.email} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input name="password" type="password" className="form-control" value={form.password} onChange={handleChange} required minLength={6} />
            </div>
            <button className="btn btn-primary w-100" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>
          <p className="text-center mt-3 mb-0 text-muted">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
