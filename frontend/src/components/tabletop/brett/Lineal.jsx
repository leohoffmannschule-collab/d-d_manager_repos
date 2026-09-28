import { weiteText } from '../../../lib/rasterkarte.js';

/**
 * Das Lineal: eine gestrichelte Linie mit der Entfernung daran.
 *
 * Gezählt wird in **Feldern**, nicht in Bildpunkten – und zwar nach der
 * Regel des Spiels: die längere der beiden Seiten. Schräg zu laufen kostet
 * in D&D 5e nicht mehr als geradeaus, und genau so soll es dastehen.
 *
 * Alle Strichstärken und die Schriftgröße werden durch den Maßstab geteilt.
 * Sonst wäre die Linie bei 400 % vier Mal so dick wie bei 100 % – sie soll
 * aber immer gleich aussehen.
 */
export default function Lineal({ lineal, scene, feld, massstab }) {
  if (!lineal) return null;

  const felder = Math.max(
    Math.abs(Math.round((lineal.bis.x - lineal.von.x) / feld)),
    Math.abs(Math.round((lineal.bis.y - lineal.von.y) / feld))
  );

  return (
    <svg className="pointer-events-none absolute inset-0 overflow-visible">
      <line
        x1={lineal.von.x}
        y1={lineal.von.y}
        x2={lineal.bis.x}
        y2={lineal.bis.y}
        stroke="#d9b451"
        strokeWidth={Math.max(2, 3 / massstab)}
        strokeDasharray={`${feld / 4} ${feld / 6}`}
      />
      {/* Heller Text mit dunklem Rand ringsum: So bleibt er über jeder Karte
          lesbar. In SVG macht das `stroke` samt `paint-order`, nicht ein
          Schatten wie im übrigen HTML. */}
      <text
        x={lineal.bis.x + 8}
        y={lineal.bis.y - 8}
        fill="#e8cf8d"
        style={{ fontSize: Math.max(12, 16 / massstab), paintOrder: 'stroke' }}
        stroke="#14100a"
        strokeWidth={Math.max(2, 4 / massstab)}
      >
        {felder} Felder · {weiteText(scene, felder)}
      </text>
    </svg>
  );
}
