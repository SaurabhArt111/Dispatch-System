import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import StartLoadingModal from './StartLoadingModal';
import LoadDispatchModal from './LoadDispatchModal';
import { dispatchApi } from '../services/resources';
import { useRealtime } from '../context/RealtimeContext';
import { formatDateTime } from '../utils/formatters';

export default function DispatchOffice() {
  const { socket } = useRealtime();
  const [board, setBoard] = useState(null);
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStart, setShowStart] = useState(false);
  const [activeDispatch, setActiveDispatch] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [boardData, list] = await Promise.all([dispatchApi.board(), dispatchApi.list()]);
      setBoard(boardData);
      setDispatches(list);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load dispatch office');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const onNotif = (n) => {
      if (['JOB_STATUS', 'DISPATCHED', 'NEW_DC'].includes(n.type)) load();
    };
    socket.on('notification', onNotif);
    return () => socket.off('notification', onNotif);
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Loader label="Loading dispatch office…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>Dispatch Office</h1>
          <p className="text-muted">Packed → QR → Print → Scan → Verify → Vehicle Loading → Loaded → Dispatched</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowStart(true)}>+ Start Loading</button>
      </div>

      <div className="board-cols">
        <div className="stat-card"><div className="stat-label">Packed</div><div className="stat-value">{board.packed}</div></div>
        <div className="stat-card"><div className="stat-label">QR Generated</div><div className="stat-value">{board.qrGenerated}</div></div>
        <div className="stat-card"><div className="stat-label">Ready (Scanned)</div><div className="stat-value stat-accent">{board.ready}</div></div>
        <div className="stat-card"><div className="stat-label">Loaded</div><div className="stat-value">{board.loaded}</div></div>
        <div className="stat-card"><div className="stat-label">Dispatched</div><div className="stat-value">{board.dispatched}</div></div>
      </div>

      <Card title="Loading Sessions">
        {dispatches.length === 0 ? (
          <EmptyState icon="🚚" title="No loading sessions yet" message="Start a vehicle loading session once rolls are packed, QR'd and scanned." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>DC No.</th><th>Vehicle</th><th>Rolls</th><th>Status</th><th>Started</th><th></th></tr></thead>
              <tbody>
                {dispatches.map((d) => (
                  <tr key={d._id}>
                    <td className="mono">{d.dc?.dcNumber}</td>
                    <td>{d.vehicle?.vehicleNumber} <span className="text-muted">({d.vehicle?.driverName})</span></td>
                    <td>{(d.loadedRolls || []).length} / {(d.expectedRolls || []).length}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td className="text-muted">{formatDateTime(d.createdAt)}</td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => setActiveDispatch(d)}>Open</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showStart && (
        <StartLoadingModal
          onClose={() => setShowStart(false)}
          onCreated={(d) => { setShowStart(false); load(); setActiveDispatch(d); }}
        />
      )}
      {activeDispatch && (
        <LoadDispatchModal dispatch={activeDispatch} onClose={() => setActiveDispatch(null)} onChanged={load} />
      )}
    </div>
  );
}
