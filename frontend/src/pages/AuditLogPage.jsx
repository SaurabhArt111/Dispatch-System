import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { auditApi } from '../services/resources';
import { formatDateTime } from '../utils/formatters';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await auditApi.list({ limit: 80 });
      setLogs(res.logs);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <Loader label="Loading audit log…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>Audit Log</h1>
        <p className="text-muted">Every sensitive action taken across the system, for accountability.</p>
      </div>

      <Card>
        {logs.length === 0 ? (
          <EmptyState icon="🧾" title="No audit entries yet" />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l._id}>
                    <td className="text-muted">{formatDateTime(l.createdAt)}</td>
                    <td>{l.actor?.name || l.actorLabel || 'System'}</td>
                    <td><span className="badge badge-accent">{l.action}</span></td>
                    <td className="text-muted mono">{l.entityType} {l.entityId ? `#${String(l.entityId).slice(-6)}` : ''}</td>
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
