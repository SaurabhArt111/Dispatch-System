import { useState } from 'react';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import { dispatchApi, qrApi } from '../services/resources';
import { useToast } from '../context/ToastContext';

export default function LoadDispatchModal({ dispatch, onClose, onChanged }) {
  const { push } = useToast();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState(dispatch);

  const loadedIds = new Set((current.loadedRolls || []).map((r) => (typeof r === 'string' ? r : r._id)));
  const allLoaded = (current.expectedRolls || []).every((r) => loadedIds.has(typeof r === 'string' ? r : r._id));

  async function handleScan(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    try {
      const found = await qrApi.lookup(code.trim());
      const res = await dispatchApi.scanIntoLoad(current._id, found.roll.id);
      setCurrent(res.dispatch);
      push({ title: `${found.roll.rollId} loaded`, variant: 'success' });
      setCode('');
      onChanged?.();
    } catch (e2) {
      push({ title: 'Scan failed', message: e2.response?.data?.message, variant: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmLoaded() {
    setBusy(true);
    try {
      const updated = await dispatchApi.confirmLoaded(current._id);
      setCurrent(updated);
      push({ title: 'Loading confirmed', variant: 'success' });
      onChanged?.();
    } catch (e) {
      push({ title: 'Could not confirm', message: e.response?.data?.message, variant: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function handleDispatch() {
    setBusy(true);
    try {
      const updated = await dispatchApi.markDispatched(current._id);
      setCurrent(updated);
      push({ title: 'Vehicle dispatched 🚚', variant: 'success' });
      onChanged?.();
      onClose();
    } catch (e) {
      push({ title: 'Could not dispatch', message: e.response?.data?.message, variant: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Vehicle Loading" onClose={onClose} width="520px">
      <div className="stack">
        <div className="flex-between">
          <StatusBadge status={current.status} />
          <span className="text-muted">{loadedIds.size} / {current.expectedRolls?.length || 0} rolls loaded</span>
        </div>

        {current.status === 'LOADING' && (
          <form onSubmit={handleScan} className="flex-gap">
            <input
              autoFocus
              placeholder="Scan or paste roll QR code…"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" type="submit" disabled={busy}>Scan</button>
          </form>
        )}

        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Roll</th><th>Status</th></tr></thead>
            <tbody>
              {(current.expectedRolls || []).map((r) => {
                const id = typeof r === 'string' ? r : r._id;
                const label = typeof r === 'string' ? r : r.rollId;
                return (
                  <tr key={id}>
                    <td className="mono">{label}</td>
                    <td>{loadedIds.has(id) ? <span className="badge badge-success"><span className="badge-dot" />Loaded</span> : <span className="badge badge-neutral"><span className="badge-dot" />Pending</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {current.status === 'LOADING' && (
          <button className="btn btn-secondary" disabled={!allLoaded || busy} onClick={handleConfirmLoaded}>
            Confirm loading complete
          </button>
        )}
        {current.status === 'LOADED' && (
          <button className="btn btn-primary" disabled={busy} onClick={handleDispatch}>
            Mark as Dispatched
          </button>
        )}
        {current.status === 'DISPATCHED' && (
          <div className="state-box"><div className="state-icon">✅</div><div className="state-title">Dispatched</div></div>
        )}
      </div>
    </Modal>
  );
}
