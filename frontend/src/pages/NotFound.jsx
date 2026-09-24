import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="state-box" style={{ paddingTop: '15vh' }}>
      <div className="state-icon">🧭</div>
      <div className="state-title">Page not found</div>
      <p>The page you're looking for doesn't exist.</p>
      <div style={{ marginTop: 'var(--space-4)' }}>
        <Link className="btn btn-primary" to="/">Back to dashboard</Link>
      </div>
    </div>
  );
}
