import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import { transferApi } from '../services/resources';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/formatters';

export default function Transfers() {
  const { push } = useToast();
  const { hasPermission } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setTransfers(await transferApi.list());
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load transfers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function markTransferred(id) {
    try {
      await transferApi.markTransferred(id);
      push({ title: 'Marked as transferred', variant: 'success' });
      load();
    } catch (e) {
      push({ title: 'Failed', message: e.response?.data?.message, variant: 'danger' });
    }
  }

  async function confirmReceipt(id) {
    try {
      await transferApi.confirmReceipt(id);
      push({ title: 'Receipt confirmed', variant: 'success' });
      load();
    } catch (e) {
      push({ title: 'Failed', message: e.response?.data?.message, variant: 'danger' });
    }
  }

  if (loading) return <Loader label="Loading transfers…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>Transfers</h1>
        <p className="text-muted">Inter-godown transfers. Requested from a job's detail view.</p>
      </div>

      <Card>
        {transfers.length === 0 ? (
          <EmptyState icon="🔁" title="No transfers yet" />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>From</th><th>To</th><th>Status</th><th>Requested</th><th></th></tr></thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t._id}>
                    <td><span className="badge badge-neutral">{t.fromGodown?.code}</span></td>
                    <td><span className="badge badge-neutral">{t.toGodown?.code}</span></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="text-muted">{formatDateTime(t.requestedAt)}</td>
                    <td>
                      {hasPermission('transfer:manage') && t.status === 'TRANSFER_REQUESTED' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => markTransferred(t._id)}>Mark transferred</button>
                      )}
                      {hasPermission('transfer:manage') && t.status === 'TRANSFERRED' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => confirmReceipt(t._id)}>Confirm receipt</button>
                      )}
                    </td>
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
