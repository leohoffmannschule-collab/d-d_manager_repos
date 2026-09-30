/**
 * Die Liste der Sitzungen am linken Rand: Titel, Datum, Zahl der Einträge –
 * und ein „läuft“ an der offenen.
 */
export default function Sitzungsliste({ sitzungen, gewaehlt, onWaehlen }) {
  return (
    <ul className="space-y-1.5">
      {sitzungen.map((s) => (
        <li key={s.id}>
          <button
            onClick={() => onWaehlen(s.id)}
            className={`w-full border px-3 py-2.5 text-left ${
              gewaehlt === s.id ? 'border-gold bg-gold/12' : 'border-rule bg-panel hover:border-gold'
            }`}
          >
            <span className="block truncate font-display text-[15px] text-ink">{s.title}</span>
            <span className="text-[14px] text-faint">
              {new Date(s.startedAt).toLocaleDateString('de-DE')} · {s.anzahl} Einträge
              {s.laufend && <span className="text-rubric"> · läuft</span>}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
