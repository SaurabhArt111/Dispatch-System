import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { role: 'Super Admin', email: 'superadmin@dispatch.local' },
  { role: 'Admin', email: 'admin@dispatch.local' },
  { role: 'Dispatch Manager', email: 'dispatch.manager@dispatch.local' },
  { role: 'Dispatch Operator', email: 'dispatch.operator@dispatch.local' },
  { role: 'Godown Manager (S-28)', email: 'godown.manager@dispatch.local' },
  { role: 'Godown Operator (S-17)', email: 'godown.operator@dispatch.local' },
  { role: 'Viewer', email: 'viewer@dispatch.local' }
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const from = location.state?.from?.pathname || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <img src="/icons/icon-192.png" alt="" />
          <div>
            <div className="login-brand-title">Dispatch Management</div>
            <div className="login-brand-sub">Godowns · Packing · QR · Vehicles</div>
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@dispatch.local" />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <div className="field-error" style={{ marginBottom: 'var(--space-3)' }}>{error}</div>}
            <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="login-demo-box">
          <strong>Demo credentials</strong> — password for every account: <code>Password@123</code>
          <table>
            <tbody>
              {DEMO_ACCOUNTS.map((acc) => (
                <tr key={acc.email}>
                  <td className="role-cell">{acc.role}</td>
                  <td className="mono">{acc.email}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEmail(acc.email)}>Use</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
