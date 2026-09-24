export default function EmptyState({ icon = '📭', title = 'Nothing here yet', message, action }) {
  return (
    <div className="state-box">
      <div className="state-icon">{icon}</div>
      <div className="state-title">{title}</div>
      {message && <div>{message}</div>}
      {action && <div style={{ marginTop: 'var(--space-4)' }}>{action}</div>}
    </div>
  );
}
