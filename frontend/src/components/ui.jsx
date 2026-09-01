import { Fleuron, IconCheck, IconMinus, IconPlus } from './icons.jsx';

/** Überschrift in Rubrikrot, mit goldenem Stern und durchlaufender Linie. */
export function Rubric({ children, className = '' }) {
  return (
    <div className={`mb-3 flex items-center gap-2.5 ${className}`}>
      <Fleuron className="text-gold" />
      <h2 className="font-display text-[15px] font-semibold tracking-[0.14em] text-rubric uppercase">{children}</h2>
      <span className="h-px flex-1 bg-rule" />
    </div>
  );
}

/** Aufgelegtes Velinblatt. */
export function Card({ title, children, className = '' }) {
  return (
    <section className={`panel p-4 sm:p-5 ${className}`}>
      {title && <Rubric>{title}</Rubric>}
      {children}
    </section>
  );
}

export function FieldLabel({ children }) {
  return (
    <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">{children}</span>
  );
}

export function TextField({ label, value, onChange, placeholder, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field-line"
      />
    </label>
  );
}

export function TextAreaField({ label, value, onChange, rows = 3, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="field-box resize-y leading-relaxed"
      />
    </label>
  );
}

export function NumberField({ label, value, onChange, className = '', min, step = 1 }) {
  return (
    <label className={`block ${className}`}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <input
        type="number"
        inputMode="numeric"
        value={value ?? 0}
        min={min}
        step={step}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className="field-line font-display"
      />
    </label>
  );
}

export function Stepper({ label, value, onChange, min = 0, max = 999 }) {
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, (value ?? 0) - 1))}
          className="btn-plate flex h-11 w-11 shrink-0 items-center justify-center"
          aria-label="Weniger"
        >
          <IconMinus size={17} />
        </button>
        <input
          type="number"
          inputMode="numeric"
          value={value ?? 0}
          onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
          className="h-11 w-14 border border-rule bg-panel-soft text-center font-display text-lg text-ink focus:border-rubric focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, (value ?? 0) + 1))}
          className="btn-plate flex h-11 w-11 shrink-0 items-center justify-center"
          aria-label="Mehr"
        >
          <IconPlus size={17} />
        </button>
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex min-h-11 items-center gap-2.5 text-left">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center border-[1.5px] border-rule-strong ${
          checked ? 'bg-rubric text-rubric-ink' : 'bg-transparent'
        }`}
      >
        {checked && <IconCheck size={12} />}
      </span>
      {label && <span className="text-ink">{label}</span>}
    </button>
  );
}
