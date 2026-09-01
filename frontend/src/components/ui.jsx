export function Card({ title, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-ink-800 bg-ink-900 p-4 ${className}`}>
      {title && <h2 className="mb-3 font-display text-lg text-gold-400">{title}</h2>}
      {children}
    </section>
  );
}

export function TextField({ label, value, onChange, placeholder, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block text-xs font-medium text-parchment-100/60">{label}</span>}
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-parchment-50 placeholder:text-parchment-100/30 focus:border-gold-500 focus:outline-none"
      />
    </label>
  );
}

export function TextAreaField({ label, value, onChange, rows = 3, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block text-xs font-medium text-parchment-100/60">{label}</span>}
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full resize-y rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-parchment-50 focus:border-gold-500 focus:outline-none"
      />
    </label>
  );
}

export function NumberField({ label, value, onChange, className = '', min, step = 1 }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block text-xs font-medium text-parchment-100/60">{label}</span>}
      <input
        type="number"
        inputMode="numeric"
        value={value ?? 0}
        min={min}
        step={step}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className="w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-parchment-50 focus:border-gold-500 focus:outline-none"
      />
    </label>
  );
}

export function Stepper({ label, value, onChange, min = 0, max = 999 }) {
  return (
    <div>
      {label && <span className="mb-1 block text-xs font-medium text-parchment-100/60">{label}</span>}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, (value ?? 0) - 1))}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-700 bg-ink-800 text-lg text-parchment-50 active:scale-95"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          value={value ?? 0}
          onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
          className="w-14 rounded-lg border border-ink-700 bg-ink-800 px-1 py-1.5 text-center text-parchment-50 focus:border-gold-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, (value ?? 0) + 1))}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-700 bg-ink-800 text-lg text-parchment-50 active:scale-95"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-left"
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
          checked ? 'border-gold-500 bg-gold-500 text-ink-950' : 'border-ink-600 bg-ink-800'
        }`}
      >
        {checked && '✓'}
      </span>
      {label && <span className="text-sm text-parchment-100/80">{label}</span>}
    </button>
  );
}
