import { useState } from 'react';
import { ticketApi } from '../api';
import { getErrorMessage, getFieldErrors } from '../api/client';
import { validateComment } from '../utils/validation';
import { formatDate, timeAgo } from '../utils/format';
import Alert from './Alert';

export default function CommentThread({ ticketId, comments, currentUserId, onAdded }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateComment(text);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const comment = await ticketApi.addComment(ticketId, text.trim());
      setText('');
      onAdded(comment);
    } catch (err) {
      setError(getFieldErrors(err).comment || getErrorMessage(err, 'Could not add your comment.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="card-title">
        Conversation <span className="muted">({comments.length})</span>
      </h2>

      {comments.length === 0 ? (
        <p className="muted">No responses yet.</p>
      ) : (
        <ol className="comment-list">
          {comments.map((c) => (
            <li
              key={c.id}
              className={`comment ${c.author_role === 'agent' ? 'from-agent' : 'from-customer'}${
                c.user_id === currentUserId ? ' is-mine' : ''
              }`}
            >
              <div className="comment-meta">
                <strong>{c.author_name}</strong>
                <span className={`role-pill role-${c.author_role}`}>{c.author_role}</span>
                <time dateTime={c.created_at} title={formatDate(c.created_at)} className="muted small">
                  {timeAgo(c.created_at)}
                </time>
              </div>
              <p className="comment-body">{c.comment}</p>
            </li>
          ))}
        </ol>
      )}

      <form className="comment-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="new-comment" className="sr-only">
          Add a comment
        </label>
        <textarea
          id="new-comment"
          className={error ? 'input has-error' : 'input'}
          rows={3}
          placeholder="Write a reply..."
          value={text}
          maxLength={2000}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError('');
          }}
          aria-invalid={Boolean(error)}
        />
        <Alert>{error}</Alert>
        <div className="form-actions">
          <span className="muted small">{text.length}/2000</span>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Sending...' : 'Add comment'}
          </button>
        </div>
      </form>
    </section>
  );
}
