import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ticketApi } from '../api';
import { getErrorMessage } from '../api/client';

const FILTER_KEYS = ['search', 'status', 'priority', 'assigned_to', 'sort', 'order'];

/** Filters live in the URL (?status=open&sort=priority) so views can be bookmarked and shared. */
export function useTicketFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo(
    () => Object.fromEntries(FILTER_KEYS.map((key) => [key, params.get(key) || ''])),
    [params],
  );

  const setFilter = useCallback(
    (key, value) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const resetFilters = useCallback(() => setParams({}, { replace: true }), [setParams]);

  // Replace all filters with a single one (or clear everything when value is empty).
  const setOnlyFilter = useCallback(
    (key, value) => setParams(value ? { [key]: value } : {}, { replace: true }),
    [setParams],
  );

  return { filters, setFilter, setOnlyFilter, resetFilters };
}

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/** Fetches the ticket list whenever the filters change (search is debounced). */
export function useTickets(filters) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const search = useDebounced(filters.search);
  const { status, priority, assigned_to: assignedTo, sort, order } = filters;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const params = { search, status, priority, assigned_to: assignedTo, sort, order };
    // Only send filters that are set.
    Object.keys(params).forEach((k) => !params[k] && delete params[k]);

    ticketApi
      .list(params)
      .then((data) => !cancelled && setTickets(data))
      .catch((err) => !cancelled && setError(getErrorMessage(err, 'Could not load tickets.')))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [search, status, priority, assignedTo, sort, order, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  return { tickets, loading, error, reload };
}
