import { useEffect, useState } from 'react';
import FormField from './FormField';
import { PRIORITIES, validateTicket } from '../utils/validation';
import { formatLabel } from '../utils/format';

const PRIORITY_OPTIONS = PRIORITIES.map((p) => ({ value: p, label: formatLabel(p) }));
const EMPTY = { subject: '', description: '', priority: 'medium' };
// Stable default so the effect below doesn't re-run on every render.
const NO_ERRORS = {};

/** Create/edit form for a ticket's subject, description and priority. */
export default function TicketForm({
  initialValues = EMPTY,
  onSubmit,
  onCancel,
  submitting = false,
  serverErrors = NO_ERRORS,
  submitLabel = 'Save',
}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  // Show field errors returned by the API.
  useEffect(() => setErrors(serverErrors), [serverErrors]);

  const handleChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErrors((errs) => ({ ...errs, [e.target.name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateTicket(values);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    onSubmit({
      subject: values.subject.trim(),
      description: values.description.trim(),
      priority: values.priority,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField
        label="Subject"
        name="subject"
        value={values.subject}
        onChange={handleChange}
        error={errors.subject}
        maxLength={200}
        placeholder="Short summary of the problem"
      />
      <FormField
        label="Description"
        name="description"
        as="textarea"
        rows={6}
        value={values.description}
        onChange={handleChange}
        error={errors.description}
        maxLength={5000}
        placeholder="What happened? What did you expect? Any steps to reproduce?"
        hint={`${values.description.length}/5000 characters`}
      />
      <FormField
        label="Priority"
        name="priority"
        as="select"
        value={values.priority}
        onChange={handleChange}
        error={errors.priority}
        options={PRIORITY_OPTIONS}
      />
      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
