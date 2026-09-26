import { PRIORITIES, STATUSES } from '../utils/validation';
import { formatLabel } from '../utils/format';

const toOptions = (values, allLabel) => [
  { value: '', label: allLabel },
  ...values.map((v) => ({ value: v, label: formatLabel(v) })),
];

const SORT_OPTIONS = [
  { value: '', label: 'Newest first' },
  { value: 'updated_at', label: 'Recently updated' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'subject', label: 'Subject' },
];

function Select({ label, value, onChange, options }) {
  return (
    <label className="filter">
      <span className="filter-label">{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Search + filter bar shared by both dashboards.
 * `agentMode` adds the assignee filter and sort controls.
 */
export default function TicketFilters({ filters, onChange, onReset, agentMode = false, agents = [] }) {
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="filters" role="search">
      <label className="filter filter-search">
        <span className="filter-label">Search</span>
        <input
          className="input"
          type="search"
          placeholder={agentMode ? 'Subject, description, customer or #id' : 'Search your tickets'}
          value={filters.search}
          onChange={(e) => onChange('search', e.target.value)}
          maxLength={100}
        />
      </label>

      <Select
        label="Status"
        value={filters.status}
        onChange={(v) => onChange('status', v)}
        options={toOptions(STATUSES, 'All statuses')}
      />
      <Select
        label="Priority"
        value={filters.priority}
        onChange={(v) => onChange('priority', v)}
        options={toOptions(PRIORITIES, 'All priorities')}
      />

      {agentMode && (
        <Select
          label="Assignee"
          value={filters.assigned_to}
          onChange={(v) => onChange('assigned_to', v)}
          options={[
            { value: '', label: 'Anyone' },
            { value: 'me', label: 'Assigned to me' },
            { value: 'unassigned', label: 'Unassigned' },
            ...agents.map((a) => ({ value: String(a.id), label: a.name })),
          ]}
        />
      )}

      <Select label="Sort by" value={filters.sort} onChange={(v) => onChange('sort', v)} options={SORT_OPTIONS} />
      <Select
        label="Order"
        value={filters.order}
        onChange={(v) => onChange('order', v)}
        options={[
          { value: '', label: 'Descending' },
          { value: 'asc', label: 'Ascending' },
        ]}
      />

      {hasFilters && (
        <button type="button" className="btn btn-ghost btn-sm filter-reset" onClick={onReset}>
          Clear filters
        </button>
      )}
    </div>
  );
}
