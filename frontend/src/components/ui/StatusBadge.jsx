import { statusLabel } from '../../utils/formatters';

const COLOR_MAP = {
  PENDING: 'neutral',
  PROCESSING: 'info',
  ON_HOLD: 'danger',
  TRANSFER_REQUESTED: 'signal',
  TRANSFERRED: 'signal',
  RECEIVED: 'info',
  PACKING: 'accent',
  PACKED: 'accent',
  READY_FOR_DISPATCH: 'success',
  CREATED: 'neutral',
  QR_GENERATED: 'info',
  SCANNED: 'accent',
  LOADED: 'signal',
  DISPATCHED: 'success',
  LOADING: 'signal',
  CANCELLED: 'danger',
  SUCCESS: 'success',
  FAILED: 'danger',
  SKIPPED_DUPLICATE: 'neutral'
};

export default function StatusBadge({ status }) {
  const variant = COLOR_MAP[status] || 'neutral';
  return (
    <span className={`badge badge-${variant}`}>
      <span className="badge-dot" />
      {statusLabel(status)}
    </span>
  );
}
