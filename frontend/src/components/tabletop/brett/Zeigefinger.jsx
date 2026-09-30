import { px } from '../../../lib/stilwerte.js';

/**
 * Die Zeigefinger: kurz aufleuchtende Ringe mit dem Namen dessen, der
 * gezeigt hat.
 *
 * „Da!“ – am echten Tisch tippt man auf die Karte. Über drei Städte hinweg
 * geht das nicht, also gibt es das hier. Gespeichert wird nichts; nach
 * wenigen Sekunden ist der Ring fort (siehe lib/daten.js, usePings).
 *
 * Der Ring ist genau ein Feld groß – so zeigt er nicht auf einen Punkt,
 * sondern auf die Stelle, um die es geht.
 */
export default function Zeigefinger({ pings, feld }) {
  return pings.map((ping) => (
    <span
      key={ping.key}
      className="zeigefinger pointer-events-none z-30"
      style={{ '--x': px(ping.x), '--y': px(ping.y), '--feld': px(feld), '--farbe': ping.color }}
    >
      <span className="zeigefinger-ring block animate-ping rounded-full" />
      <span className="zeigefinger-name absolute top-full left-1/2 mt-1 -translate-x-1/2 whitespace-nowrap font-display text-[12px]">
        {ping.name}
      </span>
    </span>
  ));
}
