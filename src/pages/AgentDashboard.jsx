import { useCallback, useEffect, useState } from 'react';
import { ticketApi, userApi } from '../api';
import { getErrorMessage } from '../api/client';
import { useTicketFilters, useTickets } from '../hooks/useTickets';
import TicketFilters from '../components/TicketFilters';
import TicketList from '../components/TicketList';
import StatCard from '../components/StatCard';
import Loader from '../components/Loader';
import Alert from '../components/Alert';

export default function AgentDashboard() {
  const { filters, setFilter, setOnlyFilter, resetFilters } = useTicketFilters();
  const { tickets, loading, error, reload } = useTickets(filters);
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');
  const [agents, setAgents] = useState([]);

  const loadStats = useCallback(() => {
    setStatsError('');
    ticketApi
      .stats()
      .then(setStats)
      .catch((err) => setStatsError(getErrorMessage(err, 'Could not load statistics.')));
  }, []);

  useEffect(() => {
    loadStats();
    userApi.agents().then(setAgents).catch(() => setAgents([]));
  }, [loadStats]);

  // Clicking a stat card applies that filter (clicking it again clears it).
  const quickFilter = (key, value) => () => setOnlyFilter(key, filters[key] === value ? '' : value);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Support dashboard</h1>
          <p className="muted">Overview of all customer tickets.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => { reload(); loadStats(); }}>
          Refresh
        </button>
      </div>

      <Alert onRetry={loadStats}>{statsError}</Alert>
      <section className="stats-grid" aria-label="Ticket statistics">
        <StatCard label="Total tickets" value={stats?.total} />
        <StatCard label="Open" value={stats?.open} tone="blue" onClick={quickFilter('status', 'open')} active={filters.status === 'open'} />
        <StatCard label="In progress" value={stats?.in_progress} tone="amber" onClick={quickFilter('status', 'in_progress')} active={filters.status === 'in_progress'} />
        <StatCard label="Resolved" value={stats?.resolved} tone="green" onClick={quickFilter('status', 'resolved')} active={filters.status === 'resolved'} />
        <StatCard label="Unassigned (active)" value={stats?.unassigned} tone="red" onClick={quickFilter('assigned_to', 'unassigned')} active={filters.assigned_to === 'unassigned'} />
        <StatCard label="Assigned to me" value={stats?.assigned_to_me} tone="purple" onClick={quickFilter('assigned_to', 'me')} active={filters.assigned_to === 'me'} />
      </section>

      <TicketFilters filters={filters} onChange={setFilter} onReset={resetFilters} agentMode agents={agents} />

      {error ? (
        <Alert onRetry={reload}>{error}</Alert>
      ) : loading ? (
        <Loader label="Loading tickets..." />
      ) : (
        <>
          <p className="muted small result-count">
            {tickets.length} ticket{tickets.length === 1 ? '' : 's'}
          </p>
          <TicketList tickets={tickets} showCustomer emptyMessage="No tickets match your filters." />
        </>
      )}
    </>
  );
}
