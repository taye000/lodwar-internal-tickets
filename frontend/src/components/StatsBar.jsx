import { STATUSES, STATUS_LABELS } from '../constants';

export default function StatsBar({ stats }) {
  if (!stats) return null;

  return (
    <div className="stats">
      {STATUSES.map((status) => (
        <div key={status} className={`stat status-${status}`}>
          <span className="stat-count">{stats[status]}</span>
          <span className="stat-label">{STATUS_LABELS[status]}</span>
        </div>
      ))}
    </div>
  );
}