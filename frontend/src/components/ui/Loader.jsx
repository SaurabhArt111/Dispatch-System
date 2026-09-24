export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="loader-wrap">
      <div className="stack" style={{ alignItems: 'center' }}>
        <div className="spinner" />
        <div className="text-muted" style={{ fontSize: 'var(--fs-sm)' }}>{label}</div>
      </div>
    </div>
  );
}
