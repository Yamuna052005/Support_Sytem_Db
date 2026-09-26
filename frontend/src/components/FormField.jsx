/**
 * Label + input/select/textarea + error message, with the accessibility wiring done once.
 * `as` picks the element; `options` ([{ value, label }]) is used when as="select".
 */
export default function FormField({ label, name, error, as = 'input', options = [], hint, ...props }) {
  const id = `field-${name}`;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const common = {
    id,
    name,
    'aria-invalid': Boolean(error),
    'aria-describedby': describedBy,
    className: error ? 'input has-error' : 'input',
    ...props,
  };

  let control;
  if (as === 'select') {
    control = (
      <select {...common}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else if (as === 'textarea') {
    control = <textarea {...common} />;
  } else {
    control = <input {...common} />;
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {control}
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="field-hint">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
