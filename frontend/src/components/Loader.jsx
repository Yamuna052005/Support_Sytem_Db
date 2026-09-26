export default function Loader({ label = 'Loading...', inline = false }) {
  return (
    <div className={inline ? 'loader loader-inline' : 'loader'} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
