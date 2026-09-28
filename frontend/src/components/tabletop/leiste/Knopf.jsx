/**
 * Ein Leistenknopf.
 *
 * Alle vier Teile der Werkzeugleiste benutzen ihn, damit „gewählt“ überall
 * gleich aussieht: golden umrandet, heller Grund. Alles übrige – `onClick`,
 * `title`, `disabled` – reicht er unverändert an den Knopf durch.
 */
export default function Knopf({ aktiv, children, ...rest }) {
  return (
    <button
      {...rest}
      className={`flex min-h-11 items-center gap-1.5 border px-3 font-display text-[11px] tracking-[0.10em] uppercase ${
        aktiv ? 'border-gold bg-gold/20 text-ink' : 'border-rule text-sepia hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}
