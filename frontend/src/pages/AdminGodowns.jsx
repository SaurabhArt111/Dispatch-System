import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';
import ErrorState from '../components/ui/ErrorState';
import Modal from '../components/ui/Modal';
import { godownApi } from '../services/resources';
import { useToast } from '../context/ToastContext';
import { formatDateTime } from '../utils/formatters';

export default function AdminGodowns() {
  const { push } = useToast();
  const [godowns, setGodowns] = useState([]);
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', location: '' });
  const [busy, setBusy] = useState(false);
  const [pairingFor, setPairingFor] = useState(null);
  const [newPairing, setNewPairing] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [g, s] = await Promise.all([godownApi.list(), godownApi.listScreens()]);
      setGodowns(g); setScreens(s);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load godowns');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await godownApi.create(form);
      push({ title: 'Godown created', variant: 'success' });
      setShowForm(false);
      setForm({ code: '', name: '', location: '' });
      load();
    } catch (e) {
      push({ title: 'Could not create godown', message: e.response?.data?.message, variant: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function handleGeneratePairing() {
    setBusy(true);
    try {
      const screen = await godownApi.createScreenPairing(pairingFor._id, 'Main TV');
      setNewPairing(screen);
      load();
    } catch (e) {
      push({ title: 'Could not create pairing code', message: e.response?.data?.message, variant: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loader label="Loading godowns…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>Godowns &amp; Screens</h1>
          <p className="text-muted">Manage godown master data and pair TV screens for live boards.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Godown</button>
      </div>

      <Card title="Godowns">
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Code</th><th>Name</th><th>Location</th><th>Pending Jobs</th><th></th></tr></thead>
            <tbody>
              {godowns.map((g) => (
                <tr key={g._id}>
                  <td className="mono">{g.code}</td>
                  <td>{g.name}</td>
                  <td className="text-muted">{g.location || '—'}</td>
                  <td>{g.pendingJobs}</td>
                  <td><button className="btn btn-secondary btn-sm" onClick={() => { setPairingFor(g); setNewPairing(null); }}>Pair TV Screen</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Paired Screens">
        {screens.length === 0 ? (
          <div className="text-muted">No screens paired yet.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Godown</th><th>Device</th><th>Status</th><th>Last seen</th></tr></thead>
              <tbody>
                {screens.map((s) => (
                  <tr key={s._id}>
                    <td className="mono">{s.godown?.code}</td>
                    <td>{s.deviceLabel}</td>
                    <td>
                      {s.isPaired ? (
                        <span className={`badge ${s.isOnline ? 'badge-success' : 'badge-neutral'}`}><span className="badge-dot" />{s.isOnline ? 'Online' : 'Offline'}</span>
                      ) : (
                        <span className="badge badge-signal"><span className="badge-dot" />Awaiting pairing</span>
                      )}
                    </td>
                    <td className="text-muted">{formatDateTime(s.lastSeenAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showForm && (
        <Modal title="Add Godown" onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate}>
            <div className="field"><label>Code</label><input required placeholder="S-28" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} /></div>
            <div className="field"><label>Name</label><input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="field"><label>Location</label><input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} /></div>
            <button className="btn btn-primary btn-block" type="submit" disabled={busy}>Create godown</button>
          </form>
        </Modal>
      )}

      {pairingFor && (
        <Modal title={`Pair TV Screen — ${pairingFor.code}`} onClose={() => setPairingFor(null)}>
          {newPairing ? (
            <div className="stack" style={{ textAlign: 'center' }}>
              <div className="text-muted">Enter this code on the Godown TV at <code>/godown-screen/{pairingFor.code}</code>:</div>
              <div className="pairing-code-input" style={{ padding: 'var(--space-4)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                {newPairing.pairingCode}
              </div>
              <div className="field-hint">This code can only be used once and expires once the TV is paired.</div>
            </div>
          ) : (
            <div className="stack">
              <p className="text-muted">Generate a one-time pairing code for a new TV / display device for this godown. No daily login required afterwards.</p>
              <button className="btn btn-primary" onClick={handleGeneratePairing} disabled={busy}>Generate pairing code</button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
