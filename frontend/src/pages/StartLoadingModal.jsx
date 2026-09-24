import { useEffect, useState } from 'react';
import Modal from '../components/ui/Modal';
import { dcApi, rollApi, vehicleApi, dispatchApi } from '../services/resources';
import { useToast } from '../context/ToastContext';

export default function StartLoadingModal({ onClose, onCreated }) {
  const { push } = useToast();
  const [dcs, setDcs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [dcId, setDcId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [scannedRolls, setScannedRolls] = useState([]);
  const [selectedRolls, setSelectedRolls] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [loadingRolls, setLoadingRolls] = useState(false);

  useEffect(() => {
    (async () => {
      const [dcRes, vehicleRes] = await Promise.all([dcApi.list({ limit: 30 }), vehicleApi.list()]);
      setDcs(dcRes.dcs);
      setVehicles(vehicleRes.filter((v) => v.isActive));
    })();
  }, []);

  useEffect(() => {
    if (!dcId) { setScannedRolls([]); return; }
    (async () => {
      setLoadingRolls(true);
      try {
        const { jobs } = await dcApi.get(dcId);
        const rollLists = await Promise.all(jobs.map((j) => rollApi.listForJob(j._id)));
        const all = rollLists.flat().filter((r) => r.status === 'SCANNED');
        setScannedRolls(all);
        setSelectedRolls(new Set(all.map((r) => r._id)));
      } finally {
        setLoadingRolls(false);
      }
    })();
  }, [dcId]);

  function toggleRoll(id) {
    setSelectedRolls((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (!dcId || !vehicleId || selectedRolls.size === 0) return;
    setBusy(true);
    try {
      const dispatch = await dispatchApi.startLoading({ dcId, vehicleId, rollIds: Array.from(selectedRolls) });
      push({ title: 'Loading session started', variant: 'success' });
      onCreated?.(dispatch);
    } catch (e) {
      push({ title: 'Could not start loading', message: e.response?.data?.message, variant: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Start Vehicle Loading" onClose={onClose} width="560px">
      <div className="stack">
        <div className="field">
          <label>Delivery Challan</label>
          <select value={dcId} onChange={(e) => setDcId(e.target.value)}>
            <option value="">Select DC…</option>
            {dcs.map((dc) => <option key={dc._id} value={dc._id}>{dc.dcNumber} — {dc.billTo}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Vehicle</label>
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">Select vehicle…</option>
            {vehicles.map((v) => <option key={v._id} value={v._id}>{v.vehicleNumber} — {v.driverName} ({v.type.replace('_', ' ')})</option>)}
          </select>
        </div>

        {dcId && (
          <div>
            <div className="field-hint" style={{ marginBottom: 6 }}>Scanned &amp; verified rolls for this DC</div>
            {loadingRolls ? (
              <div className="text-muted">Loading…</div>
            ) : scannedRolls.length === 0 ? (
              <div className="text-muted">No scanned rolls found yet for this DC. Rolls must be packed, QR-generated and scanned first.</div>
            ) : (
              <div className="stack" style={{ maxHeight: 220, overflowY: 'auto' }}>
                {scannedRolls.map((r) => (
                  <label key={r._id} className="flex-gap" style={{ padding: '6px 0' }}>
                    <input type="checkbox" style={{ width: 'auto' }} checked={selectedRolls.has(r._id)} onChange={() => toggleRoll(r._id)} />
                    <span className="mono">{r.rollId}</span>
                    <span className="text-muted">Qty {r.qty}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <button className="btn btn-primary" disabled={busy || !dcId || !vehicleId || selectedRolls.size === 0} onClick={handleSubmit}>
          Start loading with {selectedRolls.size} roll(s)
        </button>
      </div>
    </Modal>
  );
}
