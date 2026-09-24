import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';
import ErrorState from '../components/ui/ErrorState';
import StatusBadge from '../components/ui/StatusBadge';
import { dispatchApi, dcApi, godownApi } from '../services/resources';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/formatters';

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const [board, setBoard] = useState(null);
  const [dcs, setDcs] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [dcRes, godownRes] = await Promise.all([
        dcApi.list({ limit: 6 }),
        godownApi.list()
      ]);
      setDcs(dcRes.dcs);
      setGodowns(godownRes);
      if (hasPermission('dispatch:manage')) {
        setBoard(await dispatchApi.board());
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Loader label="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="stack" style={{ gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-muted">Here's what's moving through the dispatch pipeline right now.</p>
      </div>

      {board && (
        <div className="card-grid">
          <div className="stat-card">
            <div className="stat-label">Packed</div>
            <div className="stat-value">{board.packed}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">QR Generated</div>
            <div className="stat-value">{board.qrGenerated}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ready (Scanned)</div>
            <div className="stat-value stat-accent">{board.ready}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Loaded</div>
            <div className="stat-value">{board.loaded}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Dispatched</div>
            <div className="stat-value">{board.dispatched}</div>
          </div>
        </div>
      )}

      <div className="card-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <Card title="Recent Delivery Challans" actions={<Link className="btn btn-secondary btn-sm" to="/jobs">View jobs</Link>}>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>DC No.</th><th>Bill To</th><th>Type</th><th>Synced</th></tr>
              </thead>
              <tbody>
                {dcs.map((dc) => (
                  <tr key={dc._id}>
                    <td className="mono">{dc.dcNumber}</td>
                    <td>{dc.billTo}</td>
                    <td><StatusBadge status={dc.deliveryType} /></td>
                    <td className="text-muted">{formatDateTime(dc.syncedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Godowns" subtitle="Pending jobs per godown">
          <div className="stack">
            {godowns.map((g) => (
              <div key={g._id} className="flex-between">
                <div>
                  <div style={{ fontWeight: 700 }} className="mono">{g.code}</div>
                  <div className="text-muted" style={{ fontSize: 'var(--fs-xs)' }}>{g.name}</div>
                </div>
                <span className="badge badge-accent">{g.pendingJobs} pending</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
