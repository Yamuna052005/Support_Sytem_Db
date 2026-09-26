import { useNavigate } from 'react-router-dom';
import { PriorityBadge, StatusBadge } from './Badge';
import { formatDate, timeAgo } from '../utils/format';

/**
 * Responsive ticket table: a normal table on wide screens, stacked cards on phones
 * (each cell shows its column name via data-label, see index.css).
 */
export default function TicketList({ tickets, showCustomer = false, emptyMessage = 'No tickets found.' }) {
  const navigate = useNavigate();

  if (!tickets.length) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  const open = (id) => navigate(`/tickets/${id}`);

  return (
    <div className="table-wrap">
      <table className="ticket-table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Subject</th>
            {showCustomer && <th scope="col">Customer</th>}
            <th scope="col">Status</th>
            <th scope="col">Priority</th>
            <th scope="col">Assigned to</th>
            <th scope="col">Updated</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr
              key={t.id}
              className="clickable-row"
              onClick={() => open(t.id)}
              onKeyDown={(e) => e.key === 'Enter' && open(t.id)}
              tabIndex={0}
              aria-label={`Open ticket ${t.id}: ${t.subject}`}
            >
              <td data-label="#" className="cell-id">#{t.id}</td>
              <td data-label="Subject" className="cell-subject">{t.subject}</td>
              {showCustomer && (
                <td data-label="Customer">
                  <div>{t.customer_name}</div>
                  <div className="muted small">{t.customer_email}</div>
                </td>
              )}
              <td data-label="Status"><StatusBadge status={t.status} /></td>
              <td data-label="Priority"><PriorityBadge priority={t.priority} /></td>
              <td data-label="Assigned to">
                {t.assigned_to_name || <span className="muted">Unassigned</span>}
              </td>
              <td data-label="Updated" title={formatDate(t.updated_at)}>{timeAgo(t.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
