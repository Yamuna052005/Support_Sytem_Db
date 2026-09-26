import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ticketApi } from '../api';
import { getErrorMessage, getFieldErrors } from '../api/client';
import TicketForm from '../components/TicketForm';
import Alert from '../components/Alert';

export default function NewTicketPage() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setServerError('');
    try {
      const ticket = await ticketApi.create(values);
      navigate(`/tickets/${ticket.id}`, { replace: true, state: { created: true } });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err, 'Could not create the ticket.'));
      setSubmitting(false);
    }
  };

  return (
    <div className="narrow">
      <Link to="/dashboard" className="back-link">← Back to my tickets</Link>
      <div className="card">
        <h1 className="card-title">Raise a new ticket</h1>
        <p className="muted">Describe the problem and our support team will get back to you.</p>
        <Alert>{serverError}</Alert>
        <TicketForm
          onSubmit={handleSubmit}
          submitting={submitting}
          serverErrors={errors}
          submitLabel="Submit ticket"
          onCancel={() => navigate('/dashboard')}
        />
      </div>
    </div>
  );
}
