/**
 * Die Zeigefinger: kurz aufleuchtende Ringe mit dem Namen dessen, der
 * gezeigt hat.
 *
 * „Da!“ – am echten Tisch tippt man auf die Karte. Über drei Städte hinweg
 * geht das nicht, also gibt es das hier. Gespeichert wird nichts; nach
 * wenigen Sekunden ist der Ring fort (siehe lib/daten.jsx, usePings).
 *
 * Der Ring ist genau ein Feld groß – so zeigt er nicht auf einen Punkt,
 * sondern auf die Stelle, um die es geht.
 */
export default function Zeigefinger({ pings, feld }) {
  return pings.map((ping) => (
    <span
      key={ping.key}
      className="pointer-events-none absolute z-30"
      style={{ left: ping.x, top: ping.y, transform: 'translate(-50%, -50%)' }}
    >
      <span
        className="block animate-ping rounded-full"
        style={{ width: feld, height: feld, border: `3px solid ${ping.color}` }}
      />
      <span
        className="absolute top-full left-1/2 mt-1 -translate-x-1/2 whitespace-nowrap font-display text-[12px]"
        style={{ color: ping.color }}
      >
        {ping.name}
      </span>
    </span>
  ));
}
