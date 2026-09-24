import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import { syncApi } from '../services/resources';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDateTime } from '../utils/formatters';

export default function SyncLogPage() {
  const { hasPermission } = useAuth();
  const { push } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await syncApi.list({ limit: 50 });
      setLogs(res.logs);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load sync log');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function trigger() {
    setBusy(true);
    try {
      await syncApi.triggerMock();
      push({ title: 'Mock DC generated from System 1', variant: 'success' });
      load();
    } catch (e) {
      push({ title: 'Failed', message: e.response?.data?.message, variant: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loader label="Loading sync log…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>Sync Log</h1>
          <p className="text-muted">Every Delivery Challan sync attempt from System 1 (mock, webhook or poll).</p>
        </div>
        {hasPermission('sync:manage') && (
          <button className="btn btn-primary" onClick={trigger} disabled={busy}>⚡ Trigger mock DC</button>
        )}
      </div>

      <Card>
        {logs.length === 0 ? (
          <EmptyState icon="🔄" title="No sync activity yet" />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Time</th><th>Method</th><th>Status</th><th>DC No.</th><th>Message</th></tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l._id}>
                    <td className="text-muted">{formatDateTime(l.createdAt)}</td>
                    <td><span className="badge badge-neutral">{l.method}</span></td>
                    <td><StatusBadge status={l.status} /></td>
                    <td className="mono">{l.dcNumber || '—'}</td>
                    <td className="text-muted">{l.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
