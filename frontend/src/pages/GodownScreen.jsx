import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { screenApi } from '../services/resources';
import { useSocket } from '../hooks/useSocket';
import { useTheme } from '../context/ThemeContext';
import { playNotificationChime } from '../utils/sound';
import { formatDate, formatTime } from '../utils/formatters';
import StatusBadge from '../components/ui/StatusBadge';

function storageKey(code) {
  return `dms.screenToken.${code}`;
}

export default function GodownScreen() {
  const { godownCode } = useParams();
  const { theme, toggleTheme } = useTheme();
  const [token, setToken] = useState(() => localStorage.getItem(storageKey(godownCode)));
  const [pairingCode, setPairingCode] = useState('');
  const [pairError, setPairError] = useState('');
  const [pairing, setPairing] = useState(false);
  const [godown, setGodown] = useState(null);
  const [deviceLabel, setDeviceLabel] = useState('');
  const [jobs, setJobs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [now, setNow] = useState(new Date());
  const [highlighted, setHighlighted] = useState(new Set());
  const alertIdRef = useRef(1);

  const { socket, connected } = useSocket(token, 'screen');

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Force TV scale while this screen is mounted
  useEffect(() => {
    document.documentElement.setAttribute('data-scale', 'tv');
    return () => document.documentElement.removeAttribute('data-scale');
  }, []);

  async function loadJobs(activeToken) {
    try {
      const data = await screenApi.jobs(activeToken);
      setGodown(data.godown);
      setJobs(data.jobs);
    } catch (e) {
      // token might be stale/invalid -- fall back to pairing screen
      localStorage.removeItem(storageKey(godownCode));
      setToken(null);
    }
  }

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const who = await screenApi.whoami(token);
        if (cancelled) return;
        setGodown(who.godown);
        setDeviceLabel(who.deviceLabel);
        await loadJobs(token);
      } catch (e) {
        localStorage.removeItem(storageKey(godownCode));
        setToken(null);
      }
    })();
    const heartbeat = setInterval(() => screenApi.heartbeat(token).catch(() => {}), 30000);
    return () => { cancelled = true; clearInterval(heartbeat); };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!socket) return undefined;
    const onNotif = (n) => {
      if (n.payload?.jobId) setHighlighted((s) => new Set(s).add(n.payload.jobId));
      if (['NEW_DC', 'JOB_STATUS', 'ROLLS_CREATED', 'TRANSFER_UPDATE'].includes(n.type)) {
        loadJobs(token);
      }
      if (n.type === 'NEW_DC') {
        const id = alertIdRef.current++;
        setAlerts((list) => [...list, { id, ...n }]);
        playNotificationChime();
        setTimeout(() => setAlerts((list) => list.filter((a) => a.id !== id)), 9000);
      }
    };
    socket.on('notification', onNotif);
    return () => socket.off('notification', onNotif);
  }, [socket, token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePair(e) {
    e.preventDefault();
    setPairError('');
    setPairing(true);
    try {
      const result = await screenApi.pair(pairingCode.trim());
      localStorage.setItem(storageKey(godownCode), result.token);
      setToken(result.token);
    } catch (e2) {
      setPairError(e2.response?.data?.message || 'Invalid pairing code');
    } finally {
      setPairing(false);
    }
  }

  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [jobs]
  );

  if (!token) {
    return (
      <div className="pairing-shell">
        <div className="card pairing-card">
          <h2 style={{ marginBottom: 'var(--space-2)' }}>Pair Godown Screen</h2>
          <p className="text-muted" style={{ marginBottom: 'var(--space-5)' }}>
            Godown <strong className="mono">{godownCode}</strong> — enter the one-time pairing code shown in the Admin panel.
          </p>
          <form onSubmit={handlePair}>
            <div className="field">
              <input
                className="pairing-code-input"
                autoFocus
                required
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
              />
            </div>
            {pairError && <div className="field-error" style={{ marginBottom: 'var(--space-3)' }}>{pairError}</div>}
            <button className="btn btn-primary btn-block" type="submit" disabled={pairing}>Pair this screen</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="tv-shell">
      <div className="tv-header">
        <div>
          <div className="tv-godown-id">{godown?.code || godownCode}</div>
          <div className="text-muted">{godown?.name} {deviceLabel && `· ${deviceLabel}`}</div>
        </div>
        <div className="flex-gap" style={{ gap: 'var(--space-5)' }}>
          <div className="tv-status-pill">
            <span className={`tv-status-dot ${connected ? '' : 'offline'}`} />
            {connected ? 'Online' : 'Reconnecting…'}
          </div>
          <div>
            <div className="tv-clock">{formatTime(now)}</div>
            <div className="tv-clock-date">{formatDate(now)}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <div className="card" style={{ flex: 1 }}>
        <div className="card-header">
          <div className="card-title" style={{ fontSize: 'var(--fs-lg)' }}>Today's Delivery Challans / Jobs</div>
          <span className="badge badge-accent" style={{ fontSize: 'var(--fs-sm)' }}>{sortedJobs.length} total</span>
        </div>
        <div className="table-wrap">
          <table className="data-table tv-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>DC No.</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedJobs.map((job) => (
                <tr key={job._id} className={job.isNew_ || highlighted.has(job._id) ? 'row-new' : ''}>
                  <td>{job.dc?.billTo}</td>
                  <td className="mono">{job.dc?.dcNumber}</td>
                  <td>{job.items?.map((i) => i.itemName).join(', ')}</td>
                  <td className="mono">{job.items?.reduce((sum, i) => sum + i.qty, 0)}</td>
                  <td><StatusBadge status={job.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="tv-alert-stack">
        {alerts.map((a) => (
          <div className="tv-alert" key={a.id}>
            <div className="tv-alert-title">🔔 NEW DELIVERY CHALLAN</div>
            <div className="tv-alert-dc">{a.payload?.dcNumber}</div>
            <div className="tv-alert-row"><span>{a.payload?.billTo}</span></div>
            <div className="tv-alert-row">
              <span>{a.payload?.items?.map((i) => i.itemName).join(', ')}</span>
              <span>QTY: {a.payload?.items?.reduce((s, i) => s + i.qty, 0)}</span>
            </div>
            <div className="tv-alert-row"><span>GODOWN: {a.payload?.godownCode}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
