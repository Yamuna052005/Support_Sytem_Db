import axios from 'axios';

export const TOKEN_KEY = 'std_token';

// Use the Vercel environment variable in production.
// Use the local backend on port 5055 during development.
const API_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV
    ? 'http://localhost:5055/api'
    : 'https://support-sytem-db.onrender.com/api'
);

const client = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT to every request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Lets AuthContext react to an expired/invalid session anywhere in the app.
let onUnauthorized = () => {};

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthCall) onUnauthorized();
    return Promise.reject(error);
  },
);

/** Turn an axios error into a user-friendly message. */
export function getErrorMessage(
  error,
  fallback = 'Something went wrong. Please try again.'
) {
  if (error?.response?.data?.message) return error.response.data.message;

  if (error?.code === 'ECONNABORTED') {
    return 'The server took too long to respond.';
  }

  if (error?.request && !error?.response) {
    return 'Cannot reach the server. Check your connection.';
  }

  return fallback;
}

/** Field-level validation errors from the API as { field: message }. */
export function getFieldErrors(error) {
  const list = error?.response?.data?.errors || [];
  return Object.fromEntries(list.map((e) => [e.field, e.message]));
}

export default client;
