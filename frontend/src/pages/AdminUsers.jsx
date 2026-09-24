import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';
import ErrorState from '../components/ui/ErrorState';
import Modal from '../components/ui/Modal';
import Avatar from '../components/ui/Avatar';
import { userApi, godownApi } from '../services/resources';
import { useToast } from '../context/ToastContext';
import { formatDateTime } from '../utils/formatters';

const EMPTY_FORM = { name: '', email: '', password: '', roleId: '', assignedGodowns: [] };

export default function AdminUsers() {
  const { push } = useToast();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [sessionsFor, setSessionsFor] = useState(null);
  const [sessions, setSessions] = useState([]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [u, r, g] = await Promise.all([userApi.list(), userApi.roles(), godownApi.list()]);
      setUsers(u); setRoles(r); setGodowns(g);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await userApi.create(form);
      push({ title: 'User created', variant: 'success' });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e) {
      push({ title: 'Could not create user', message: e.response?.data?.message, variant: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(u) {
    try {
      await userApi.update(u.id, { isActive: !u.isActive });
      push({ title: u.isActive ? 'User disabled' : 'User enabled', variant: 'success' });
      load();
    } catch (e) {
      push({ title: 'Update failed', message: e.response?.data?.message, variant: 'danger' });
    }
  }

  async function forceLogout(u) {
    try {
      await userApi.forceLogout(u.id);
      push({ title: `All sessions revoked for ${u.name}`, variant: 'success' });
    } catch (e) {
      push({ title: 'Failed', message: e.response?.data?.message, variant: 'danger' });
    }
  }

  async function viewSessions(u) {
    setSessionsFor(u);
    setSessions(await userApi.sessions(u.id));
  }

  async function revokeSession(id) {
    await userApi.revokeSession(id);
    setSessions(await userApi.sessions(sessionsFor.id));
  }

  function toggleGodown(id) {
    setForm((f) => ({
      ...f,
      assignedGodowns: f.assignedGodowns.includes(id) ? f.assignedGodowns.filter((x) => x !== id) : [...f.assignedGodowns, id]
    }));
  }

  if (loading) return <Loader label="Loading users…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>Users &amp; Roles</h1>
          <p className="text-muted">Manage accounts, RBAC roles and godown access.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add User</button>
      </div>

      <Card>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>User</th><th>Role</th><th>Godowns</th><th>Status</th><th>Last login</th><th></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex-gap">
                      <Avatar name={u.name} color={u.avatarColor} size={28} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div className="text-muted" style={{ fontSize: 'var(--fs-xs)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-accent">{u.role?.label}</span></td>
                  <td className="text-muted">{u.assignedGodowns?.map((g) => g.code).join(', ') || 'All / N.A.'}</td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                      <span className="badge-dot" />{u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="text-muted">{formatDateTime(u.lastLoginAt)}</td>
                  <td>
                    <div className="flex-gap">
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(u)}>{u.isActive ? 'Disable' : 'Enable'}</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => forceLogout(u)}>Force logout</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => viewSessions(u)}>Sessions</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <Modal title="Add User" onClose={() => setShowForm(false)} width="480px">
          <form onSubmit={handleCreate}>
            <div className="field"><label>Name</label><input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="field"><label>Email</label><input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
            <div className="field"><label>Password</label><input required type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></div>
            <div className="field">
              <label>Role</label>
              <select required value={form.roleId} onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}>
                <option value="">Select role…</option>
                {roles.map((r) => <option key={r._id} value={r._id}>{r.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Assigned Godowns (leave empty for full access roles)</label>
              <div className="stack">
                {godowns.map((g) => (
                  <label key={g._id} className="flex-gap">
                    <input type="checkbox" style={{ width: 'auto' }} checked={form.assignedGodowns.includes(g._id)} onChange={() => toggleGodown(g._id)} />
                    {g.code} — {g.name}
                  </label>
                ))}
              </div>
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={busy}>Create user</button>
          </form>
        </Modal>
      )}

      {sessionsFor && (
        <Modal title={`Sessions — ${sessionsFor.name}`} onClose={() => setSessionsFor(null)}>
          {sessions.length === 0 ? <div className="text-muted">No active sessions.</div> : (
            <div className="stack">
              {sessions.map((s) => (
                <div key={s._id} className="flex-between">
                  <div>
                    <div style={{ fontSize: 'var(--fs-sm)' }}>{s.userAgent?.slice(0, 40) || 'Unknown device'}</div>
                    <div className="text-muted" style={{ fontSize: 'var(--fs-xs)' }}>{formatDateTime(s.createdAt)} · {s.isRevoked ? 'Revoked' : 'Active'}</div>
                  </div>
                  {!s.isRevoked && <button className="btn btn-ghost btn-sm" onClick={() => revokeSession(s._id)}>Revoke</button>}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
