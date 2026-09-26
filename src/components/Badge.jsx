import { formatLabel } from '../utils/format';

export function StatusBadge({ status }) {
  return <span className={`badge status-${status}`}>{formatLabel(status)}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`badge priority-${priority}`}>{formatLabel(priority)}</span>;
}
