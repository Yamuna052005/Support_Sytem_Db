import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ticketApi, userApi } from '../api';
import { getErrorMessage, getFieldErrors } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge, StatusBadge } from '../components/Badge';
import CommentThread from '../components/CommentThread';
import TicketForm from '../components/TicketForm';
import AgentTicketPanel from '../components/AgentTicketPanel';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import { formatDate } from '../utils/format';

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user, isAgent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null); // { status, message }
  const [notice, setNotice] = useState(location.state?.created ? 'Ticket created successfully.' : '');
  const [actionError, setActionError] = useState('');

  const [editing, setEditing] = useState(false);
  const [editErrors, setEditErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [t, c] = await Promise.all([ticketApi.get(id), ticketApi.comments(id)]);
      setTicket(t);
      setComments(c);
    } catch (err) {
      setLoadError({ status: err.response?.status, message: getErrorMessage(err, 'Could not load this ticket.') });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isAgent) userApi.agents().then(setAgents).catch(() => setAgents([]));
  }, [isAgent]);

  if (loading) return <Loader label="Loading ticket..." />;

  if (loadError) {
    const title =
      loadError.status === 404 ? 'Ticket not found' : loadError.status === 403 ? 'Access denied' : 'Something went wrong';
    return (
      <div className="narrow">
        <Link to="/dashboard" className="back-link">← Back to dashboard</Link>
        <div className="card">
          <h1 className="card-title">{title}</h1>
          <Alert onRetry={loadError.status >= 500 || !loadError.status ? load : undefined}>{loadError.message}</Alert>
        </div>
      </div>
    );
  }

  const isOwner = ticket.user_id === user.id;
  const customerCanEdit = isOwner && !isAgent && ['open', 'in_progress'].includes(ticket.status);
  const canDelete = isAgent || (isOwner && ticket.status === 'open');

  const handleAgentSaved = (updated) => {
    setTicket(updated);
    setNotice('Ticket updated.');
    setActionError('');
  };

  const handleEdit = async (values) => {
    setSaving(true);
    setActionError('');
    try {
      const updated = await ticketApi.update(ticket.id, values);
      setTicket(updated);
      setEditing(false);
      setNotice('Ticket updated.');
    } catch (err) {
      setEditErrors(getFieldErrors(err));
      setActionError(getErrorMessage(err, 'Could not update the ticket.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const message = isAgent
      ? `Delete ticket #${ticket.id}? This cannot be undone.`
      : `Withdraw ticket #${ticket.id}? It will be permanently deleted.`;
    if (!window.confirm(message)) return;

    setDeleting(true);
    setActionError('');
    try {
      await ticketApi.remove(ticket.id);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not delete the ticket.'));
      setDeleting(false);
    }
  };

  return (
    <>
      <Link to="/dashboard" className="back-link">← Back to {isAgent ? 'all tickets' : 'my tickets'}</Link>

      <div className="ticket-header">
        <div>
          <p className="muted small">Ticket #{ticket.id}</p>
          <h1>{ticket.subject}</h1>
          <div className="badge-row">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
      </div>

      <Alert type="success">{notice}</Alert>
      <Alert>{actionError}</Alert>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="card">
            <div className="card-title-row">
              <h2 className="card-title">Description</h2>
              {customerCanEdit && !editing && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditing(true); setNotice(''); }}>
                  Edit
                </button>
              )}
            </div>
            {editing ? (
              <TicketForm
                initialValues={{ subject: ticket.subject, description: ticket.description, priority: ticket.priority }}
                onSubmit={handleEdit}
                onCancel={() => { setEditing(false); setEditErrors({}); }}
                submitting={saving}
                serverErrors={editErrors}
                submitLabel="Save changes"
              />
            ) : (
              <p className="description">{ticket.description}</p>
            )}
          </section>

          <CommentThread
            ticketId={ticket.id}
            comments={comments}
            currentUserId={user.id}
            onAdded={(c) => setComments((list) => [...list, c])}
          />
        </div>

        <aside className="detail-side">
          <section className="card">
            <h2 className="card-title">Details</h2>
            <dl className="meta-list">
              <dt>Customer</dt>
              <dd>
                {ticket.customer_name}
                <div className="muted small">{ticket.customer_email}</div>
              </dd>
              <dt>Assigned to</dt>
              <dd>{ticket.assigned_to_name || <span className="muted">Unassigned</span>}</dd>
              <dt>Created</dt>
              <dd>{formatDate(ticket.created_at)}</dd>
              <dt>Last updated</dt>
              <dd>{formatDate(ticket.updated_at)}</dd>
            </dl>
          </section>

          {isAgent && (
            <AgentTicketPanel ticket={ticket} agents={agents} currentUserId={user.id} onSaved={handleAgentSaved} />
          )}

          {canDelete && (
            <section className="card danger-zone">
              <h2 className="card-title">{isAgent ? 'Delete ticket' : 'Withdraw ticket'}</h2>
              <p className="muted small">
                {isAgent
                  ? 'Remove spam or duplicate tickets permanently.'
                  : 'No longer need help? You can withdraw this ticket while it is still open.'}
              </p>
              <button type="button" className="btn btn-danger btn-block" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : isAgent ? 'Delete ticket' : 'Withdraw ticket'}
              </button>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
