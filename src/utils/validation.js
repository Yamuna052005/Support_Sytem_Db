// Client-side validation. Mirrors the backend rules so users get instant feedback;
// the server still validates everything independently.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  return errors;
}

export function validateRegister({ name, email, password, confirmPassword }) {
  const errors = validateLogin({ email, password });
  const trimmedName = name.trim();
  if (!trimmedName) errors.name = 'Name is required';
  else if (trimmedName.length < 2 || trimmedName.length > 100) errors.name = 'Name must be 2-100 characters';

  if (password) {
    if (password.length < 8 || password.length > 72) errors.password = 'Password must be 8-72 characters';
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      errors.password = 'Password must contain at least one letter and one number';
    }
  }
  if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match';
  return errors;
}

export function validateTicket({ subject, description, priority }) {
  const errors = {};
  const s = subject.trim();
  const d = description.trim();
  if (!s) errors.subject = 'Subject is required';
  else if (s.length < 5 || s.length > 200) errors.subject = 'Subject must be 5-200 characters';
  if (!d) errors.description = 'Description is required';
  else if (d.length < 10 || d.length > 5000) errors.description = 'Description must be 10-5000 characters';
  if (!PRIORITIES.includes(priority)) errors.priority = 'Choose a priority';
  return errors;
}

export function validateComment(comment) {
  const c = comment.trim();
  if (!c) return 'Comment cannot be empty';
  if (c.length > 2000) return 'Comment must be at most 2000 characters';
  return '';
}
