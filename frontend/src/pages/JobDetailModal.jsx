import { useEffect, useState } from 'react';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import { rollApi, qrApi, transferApi, jobApi } from '../services/resources';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const STATUS_FLOW = [
  'PENDING', 'PROCESSING', 'ON_HOLD', 'RECEIVED',
  'PACKING', 'PACKED', 'READY_FOR_DISPATCH'
];

export default function JobDetailModal({ job, onClose, onChanged }) {
  const { hasPermission } = useAuth();
  const { push } = useToast();
  const [rolls, setRolls] = useState([]);
  const [loadingRolls, setLoadingRolls] = useState(true);
  const [selectedItem, setSelectedItem] = useState(job.items?.[0]?._id || '');
  const [rollQtys, setRollQtys] = useState(['']);
  const [override, setOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [transferTarget, setTransferTarget] = useState('');

  async function loadRolls() {
    setLoadingRolls(true);
    try {
      const jobRolls = await rollApi.listForJob(job._id);
      setRolls(jobRolls);
    } catch (e) {
      push({ title: 'Failed to load rolls', message: e.response?.data?.message, variant: 'danger' });
    } finally {
      setLoadingRolls(false);
    }
  }

  useEffect(() => { loadRolls(); }, [job._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedItemObj = job.items?.find((i) => i._id === selectedItem);
  const rollSum = rollQtys.reduce((acc, v) => acc + (Number(v) || 0), 0);
  const mismatch = selectedItemObj && rollSum !== selectedItemObj.qty;

  async function handleCreateRolls(e) {
    e.preventDefault();
    if (!selectedItem) return;
    setBusy(true);
    try {
      await rollApi.create({
        itemId: selectedItem,
        rolls: rollQtys.filter((v) => v !== '').map((qty) => ({ qty: Number(qty) })),
        override: mismatch ? override : false,
        overrideReason
      });
      push({ title: 'Rolls created', variant: 'success' });
      setRollQtys(['']);
      setOverride(false);
      setOverrideReason('');
      await loadRolls();
      onChanged?.();
    } catch (e) {
      push({ title: 'Could not create rolls', message: e.response?.data?.message, variant: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerateQR(rollId) {
    try {
      await qrApi.generate(rollId);
      push({ title: 'QR code generated', variant: 'success' });
      await loadRolls();
    } catch (e) {
      push({ title: 'QR generation failed', message: e.response?.data?.message, variant: 'danger' });
    }
  }

  async function handleMarkPacked() {
    setBusy(true);
    try {
      await rollApi.markPacked(job._id);
      push({ title: 'Job marked as PACKED', variant: 'success' });
      onChanged?.();
      onClose();
    } catch (e) {
      push({ title: 'Failed to mark packed', message: e.response?.data?.message, variant: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusChange(status) {
    setBusy(true);
    try {
      await jobApi.updateStatus(job._id, status);
      push({ title: `Status updated to ${status.replace(/_/g, ' ')}`, variant: 'success' });
      onChanged?.();
    } catch (e) {
      push({ title: 'Status update failed', message: e.response?.data?.message, variant: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function handleRequestTransfer() {
    if (!transferTarget) return;
    setBusy(true);
    try {
      await transferApi.request({ jobId: job._id, toGodownCode: transferTarget });
      push({ title: `Transfer requested to ${transferTarget}`, variant: 'success' });
      onChanged?.();
      onClose();
    } catch (e) {
      push({ title: 'Transfer request failed', message: e.response?.data?.message, variant: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`${job.dc?.dcNumber || ''} — ${job.godown?.code || ''}`} onClose={onClose} width="640px">
      <div className="stack">
        <div className="flex-between">
          <div>
            <div style={{ fontWeight: 700 }}>{job.dc?.billTo}</div>
            <div className="text-muted" style={{ fontSize: 'var(--fs-xs)' }}>{job.dc?.billAddress}</div>
          </div>
          <StatusBadge status={job.status} />
        </div>

        <div>
          <div className="field-hint" style={{ marginBottom: 6 }}>Items in this job</div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Item</th><th>Screen</th><th>Qty</th></tr></thead>
              <tbody>
                {job.items?.map((i) => (
                  <tr key={i._id}>
                    <td>{i.itemName}</td>
                    <td className="text-muted">{i.screenName || '—'}</td>
                    <td className="mono">{i.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {hasPermission('job:manage') && (
          <div className="field">
            <label>Update status</label>
            <select value={job.status} onChange={(e) => handleStatusChange(e.target.value)} disabled={busy}>
              {STATUS_FLOW.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        )}

        <hr className="divider" />

        {hasPermission('roll:manage') && (
          <form onSubmit={handleCreateRolls}>
            <div className="field-hint" style={{ marginBottom: 6 }}>Create rolls (packing)</div>
            <div className="field">
              <label>Item</label>
              <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
                {job.items?.map((i) => (
                  <option key={i._id} value={i._id}>{i.itemName} (Qty: {i.qty})</option>
                ))}
              </select>
            </div>
            {rollQtys.map((v, idx) => (
              <div className="roll-input-row" key={idx}>
                <input
                  type="number" min="1" placeholder={`Roll ${idx + 1} qty`} value={v}
                  onChange={(e) => setRollQtys((arr) => arr.map((x, i2) => (i2 === idx ? e.target.value : x)))}
                />
                {rollQtys.length > 1 && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRollQtys((arr) => arr.filter((_, i2) => i2 !== idx))}>Remove</button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRollQtys((arr) => [...arr, ''])}>+ Add roll</button>

            {mismatch && (
              <div className="field" style={{ marginTop: 'var(--space-3)' }}>
                <div className="field-error">Roll total ({rollSum}) does not match item quantity ({selectedItemObj?.qty}).</div>
                <label className="flex-gap" style={{ marginTop: 6 }}>
                  <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} style={{ width: 'auto' }} />
                  Authorize override
                </label>
                {override && (
                  <input placeholder="Reason for override" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} style={{ marginTop: 6 }} />
                )}
              </div>
            )}

            <button className="btn btn-primary btn-sm" type="submit" disabled={busy || (mismatch && !override)} style={{ marginTop: 'var(--space-3)' }}>
              Create rolls
            </button>
          </form>
        )}

        <hr className="divider" />

        <div>
          <div className="field-hint" style={{ marginBottom: 6 }}>Rolls</div>
          {loadingRolls ? (
            <div className="text-muted">Loading rolls…</div>
          ) : rolls.length === 0 ? (
            <div className="text-muted">No rolls created yet.</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Roll ID</th><th>Qty</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {rolls.map((r) => (
                    <tr key={r._id}>
                      <td className="mono">{r.rollId}</td>
                      <td>{r.qty}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>
                        {r.status === 'CREATED' && hasPermission('qr:generate') && (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleGenerateQR(r._id)}>Generate QR</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {hasPermission('packing:manage') && rolls.length > 0 && (
          <button className="btn btn-secondary" onClick={handleMarkPacked} disabled={busy}>Mark job as PACKED</button>
        )}

        {hasPermission('transfer:manage') && (
          <>
            <hr className="divider" />
            <div className="form-row">
              <div className="field">
                <label>Request transfer to godown</label>
                <input placeholder="e.g. S-17" value={transferTarget} onChange={(e) => setTransferTarget(e.target.value.toUpperCase())} />
              </div>
              <button className="btn btn-secondary" style={{ alignSelf: 'flex-end', height: 42 }} onClick={handleRequestTransfer} disabled={busy || !transferTarget}>
                Request transfer
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
