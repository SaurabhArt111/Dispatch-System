import { useEffect, useRef, useState } from 'react';
import Card from '../components/ui/Card';
import { scanApi } from '../services/resources';
import { useToast } from '../context/ToastContext';
import { playNotificationChime } from '../utils/sound';

export default function Scanning() {
  const { push } = useToast();
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const scannerRef = useRef(null);

  async function submitCode(code) {
    if (!code.trim()) return;
    try {
      const data = await scanApi.scan(code.trim());
      setResult({ ok: true, data });
      playNotificationChime();
      push({ title: `${data.roll.rollId} verified`, message: `${data.dc?.dcNumber} — ${data.item?.itemName}`, variant: 'success' });
    } catch (e) {
      setResult({ ok: false, message: e.response?.data?.message || 'Scan failed' });
      push({ title: 'Scan failed', message: e.response?.data?.message, variant: 'danger' });
    }
  }

  useEffect(() => {
    if (!cameraOn) return undefined;
    let html5QrCode;
    let cancelled = false;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelled) return;
      html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;
      html5QrCode
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 240 },
          (decodedText) => {
            submitCode(decodedText);
          },
          () => {}
        )
        .catch(() => {
          push({ title: 'Camera unavailable', message: 'Falling back to manual code entry.', variant: 'danger' });
          setCameraOn(false);
        });
    });

    return () => {
      cancelled = true;
      if (html5QrCode) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
      }
    };
  }, [cameraOn]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="scan-shell stack" style={{ gap: 'var(--space-5)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>Scan Roll</h1>
        <p className="text-muted">Verify a roll's QR code as part of the Packed → Scan → Verify workflow.</p>
      </div>

      <Card>
        {cameraOn ? (
          <div className="stack">
            <div id="qr-reader" />
            <button className="btn btn-secondary" onClick={() => setCameraOn(false)}>Stop camera</button>
          </div>
        ) : (
          <button className="btn btn-primary btn-block" onClick={() => setCameraOn(true)}>📷 Start camera scan</button>
        )}

        <hr className="divider" />

        <form onSubmit={(e) => { e.preventDefault(); submitCode(manualCode); setManualCode(''); }}>
          <div className="field">
            <label>Or enter QR code manually</label>
            <input value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="QR-ROLL-DC00982-01-XXXXXXXX" />
          </div>
          <button className="btn btn-secondary btn-block" type="submit">Verify code</button>
        </form>
      </Card>

      {result && (
        <div className={`scan-result-card ${result.ok ? '' : 'error'}`}>
          {result.ok ? (
            <>
              <div style={{ fontWeight: 800, fontSize: 'var(--fs-lg)' }} className="mono">{result.data.roll.rollId}</div>
              <div className="text-muted">DC: {result.data.dc?.dcNumber} — {result.data.dc?.billTo}</div>
              <div className="text-muted">Item: {result.data.item?.itemName}</div>
              <div className="text-muted">Qty: {result.data.roll.qty} · Godown: {result.data.roll.godown?.code}</div>
            </>
          ) : (
            <div>{result.message}</div>
          )}
        </div>
      )}
    </div>
  );
}
