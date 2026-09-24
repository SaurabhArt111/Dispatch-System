import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { vehicleApi } from '../services/resources';
import { useToast } from '../context/ToastContext';

const EMPTY_FORM = { type: 'COMPANY_VEHICLE', vehicleNumber: '', driverName: '', driverMobile: '' };

export default function Vehicles() {
  const { push } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setVehicles(await vehicleApi.list());
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await vehicleApi.create(form);
      push({ title: 'Vehicle added', variant: 'success' });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e) {
      push({ title: 'Could not add vehicle', message: e.response?.data?.message, variant: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(v) {
    try {
      await vehicleApi.update(v._id, { isActive: !v.isActive });
      load();
    } catch (e) {
      push({ title: 'Update failed', message: e.response?.data?.message, variant: 'danger' });
    }
  }

  if (loading) return <Loader label="Loading vehicles…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>Vehicles</h1>
          <p className="text-muted">Party and company vehicles used for dispatch.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Vehicle</button>
      </div>

      <Card>
        {vehicles.length === 0 ? (
          <EmptyState icon="🚛" title="No vehicles yet" />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Number</th><th>Type</th><th>Driver</th><th>Mobile</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v._id}>
                    <td className="mono">{v.vehicleNumber}</td>
                    <td><span className="badge badge-neutral">{v.type.replace('_', ' ')}</span></td>
                    <td>{v.driverName}</td>
                    <td className="mono">{v.driverMobile}</td>
                    <td>
                      <span className={`badge ${v.isActive ? 'badge-success' : 'badge-danger'}`}>
                        <span className="badge-dot" />{v.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => toggleActive(v)}>{v.isActive ? 'Deactivate' : 'Activate'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showForm && (
        <Modal title="Add Vehicle" onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate}>
            <div className="field">
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="COMPANY_VEHICLE">Company Vehicle</option>
                <option value="PARTY_VEHICLE">Party Vehicle</option>
              </select>
            </div>
            <div className="field">
              <label>Vehicle Number</label>
              <input required value={form.vehicleNumber} onChange={(e) => setForm((f) => ({ ...f, vehicleNumber: e.target.value }))} placeholder="GJ-05-AB-1234" />
            </div>
            <div className="field">
              <label>Driver Name</label>
              <input required value={form.driverName} onChange={(e) => setForm((f) => ({ ...f, driverName: e.target.value }))} />
            </div>
            <div className="field">
              <label>Driver Mobile</label>
              <input required value={form.driverMobile} onChange={(e) => setForm((f) => ({ ...f, driverMobile: e.target.value }))} />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={busy}>Add vehicle</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
