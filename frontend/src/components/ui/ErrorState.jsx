export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="state-box state-error">
      <div className="state-icon">⚠️</div>
      <div className="state-title">Couldn't load this</div>
      <div>{message}</div>
      {onRetry && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <button className="btn btn-secondary btn-sm" onClick={onRetry}>Try again</button>
        </div>
      )}
    </div>
  );
}
