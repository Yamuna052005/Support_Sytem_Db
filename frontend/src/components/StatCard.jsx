export default function StatCard({ label, value, tone = 'default', onClick, active = false }) {
  const content = (
    <>
      <span className="stat-value">{value ?? '–'}</span>
      <span className="stat-label">{label}</span>
    </>
  );

  if (!onClick) return <div className={`stat-card tone-${tone}`}>{content}</div>;

  return (
    <button
      type="button"
      className={`stat-card tone-${tone} is-clickable${active ? ' is-active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {content}
    </button>
  );
}
