import { useCallback, useEffect, useState } from 'react';
import { getTickets, getStats, createTicket, updateTicket } from './api';
import { STATUSES, STATUS_LABELS } from './constants';
import StatsBar from './components/StatsBar';
import TicketForm from './components/TicketForm';
import TicketList from './components/TicketList';

const LIMIT = 10;

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, statsData] = await Promise.all([
        getTickets({ status: statusFilter, page, limit: LIMIT }),
        getStats(),
      ]);

      // If the current page became empty (e.g. last ticket moved out of the filter), step back
      if (list.data.length === 0 && page > 1) {
        setPage(Math.max(list.pagination.totalPages, 1));
        return;
      }

      setTickets(list.data);
      setPagination(list.pagination);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (ticket) => {
    await createTicket(ticket);
    // Jump to page 1 so the new ticket is visible (newest first)
    if (page !== 1) setPage(1);
    else await loadData();
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateTicket(id, { status });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <div className="container">
      <h1>Support Tickets</h1>

      <StatsBar stats={stats} />

      <TicketForm onCreate={handleCreate} />

      <section className="card">
        <div className="list-header">
          <h2>Tickets</h2>
          <label>
            Status{' '}
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="error">{error}</p>}

        <TicketList
          tickets={tickets}
          loading={loading}
          onStatusChange={handleStatusChange}
        />

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1 || loading}
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.totalPages || loading}
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}