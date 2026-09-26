import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTicketFilters, useTickets } from '../hooks/useTickets';
import TicketFilters from '../components/TicketFilters';
import TicketList from '../components/TicketList';
import Loader from '../components/Loader';
import Alert from '../components/Alert';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { filters, setFilter, resetFilters } = useTicketFilters();
  const { tickets, loading, error, reload } = useTickets(filters);
  const filtered = Object.values(filters).some(Boolean);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My tickets</h1>
          <p className="muted">Hi {user.name.split(' ')[0]}, here are your support requests.</p>
        </div>
        <Link to="/tickets/new" className="btn btn-primary">
          + New ticket
        </Link>
      </div>

      <TicketFilters filters={filters} onChange={setFilter} onReset={resetFilters} />

      {error ? (
        <Alert onRetry={reload}>{error}</Alert>
      ) : loading ? (
        <Loader label="Loading your tickets..." />
      ) : (
        <TicketList
          tickets={tickets}
          emptyMessage={
            filtered ? (
              'No tickets match your filters.'
            ) : (
              <>
                You haven&apos;t raised any tickets yet. <Link to="/tickets/new">Create your first ticket</Link>.
              </>
            )
          }
        />
      )}
    </>
  );
}
