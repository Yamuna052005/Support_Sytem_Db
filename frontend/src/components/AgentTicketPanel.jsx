import { useEffect, useState } from 'react';
import { ticketApi } from '../api';
import { getErrorMessage } from '../api/client';
import { PRIORITIES, STATUSES } from '../utils/validation';
import { formatLabel } from '../utils/format';
import FormField from './FormField';
import Alert from './Alert';

const toOptions = (values) => values.map((v) => ({ value: v, label: formatLabel(v) }));

function fromTicket(ticket) {
  return {
    status: ticket.status,
    priority: ticket.priority,
    assigned_to: ticket.assigned_to ? String(ticket.assigned_to) : '',
  };
}

/** Agent controls: change status, priority and assignee. Only changed fields are sent. */
export default function AgentTicketPanel({ ticket, agents, currentUserId, onSaved }) {
  const [values, setValues] = useState(() => fromTicket(ticket));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setValues(fromTicket(ticket)), [ticket]);

  const original = fromTicket(ticket);
  const changes = Object.fromEntries(Object.entries(values).filter(([k, v]) => v !== original[k]));
  const dirty = Object.keys(changes).length > 0;

  const handleChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const save = async (payload) => {
    setSaving(true);
    setError('');
    try {
      onSaved(await ticketApi.update(ticket.id, payload));
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save changes.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dirty) return;
    const payload = { ...changes };
    if ('assigned_to' in payload) payload.assigned_to = payload.assigned_to ? Number(payload.assigned_to) : null;
    save(payload);
  };

  const assignOptions = [
    { value: '', label: 'Unassigned' },
    ...agents.map((a) => ({ value: String(a.id), label: a.id === currentUserId ? `${a.name} (me)` : a.name })),
  ];

  return (
    <section className="card">
      <h2 className="card-title">Manage ticket</h2>
      <form onSubmit={handleSubmit}>
        <FormField label="Status" name="status" as="select" value={values.status} onChange={handleChange} options={toOptions(STATUSES)} />
        <FormField label="Priority" name="priority" as="select" value={values.priority} onChange={handleChange} options={toOptions(PRIORITIES)} />
        <FormField label="Assigned agent" name="assigned_to" as="select" value={values.assigned_to} onChange={handleChange} options={assignOptions} />

        <Alert>{error}</Alert>

        <div className="stack">
          <button type="submit" className="btn btn-primary btn-block" disabled={!dirty || saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          {ticket.assigned_to !== currentUserId && (
            <button type="button" className="btn btn-ghost btn-block" disabled={saving} onClick={() => save({ assigned_to: currentUserId })}>
              Assign to me
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
