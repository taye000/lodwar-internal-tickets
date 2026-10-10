import { STATUSES, STATUS_LABELS, PRIORITY_LABELS } from '../constants';

export default function TicketList({ tickets, loading, onStatusChange }) {
  if (loading && tickets.length === 0) {
    return <p className="muted">Loading tickets…</p>;
  }

  if (tickets.length === 0) {
    return <p className="muted">No tickets found.</p>;
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>
                <div className="ticket-title">{ticket.title}</div>
                {ticket.description && (
                  <div className="ticket-description">{ticket.description}</div>
                )}
              </td>
              <td>
                <span className={`badge priority-${ticket.priority}`}>
                  {PRIORITY_LABELS[ticket.priority]}
                </span>
              </td>
              <td>
                <select
                  className={`status-select status-${ticket.status}`}
                  value={ticket.status}
                  onChange={(e) => onStatusChange(ticket.id, e.target.value)}
                  aria-label={`Status for ${ticket.title}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </td>
              <td className="muted">
                {new Date(ticket.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}