/**
 * Was der nächste Nebelstrich träfe.
 *
 * Golden beim Aufdecken, rot beim Verhüllen – dieselbe Sprache wie in der
 * Werkzeugleiste. Beim aufgezogenen Rechteck steht zusätzlich darüber, wie
 * viele Felder es werden; beim Pinsel wäre das nur Gezappel.
 *
 * `grenzen` kommt aus usePinselabdruck und ist bereits auf die Karte
 * beschnitten – hier wird nichts mehr gerechnet außer der Umrechnung von
 * Feldern in Bildpunkte.
 */
export default function Nebelvorschau({ grenzen, scene, feld, massstab, aufdecken, mitMass }) {
  if (!grenzen) return null;

  const spalten = grenzen.x2 - grenzen.x1 + 1;
  const zeilen = grenzen.y2 - grenzen.y1 + 1;

  return (
    <div
      className={`tisch-vorschau ${aufdecken ? 'tisch-vorschau-auf' : 'tisch-vorschau-zu'}`}
      // Die Farben stehen im Stilblatt. Hier steht, wo das Rechteck liegt –
      // und wie dick sein Rand sein muss, damit er bei jedem Zoom gleich
      // dick *aussieht*.
      style={{
        left: scene.gridOffsetX + grenzen.x1 * feld,
        top: scene.gridOffsetY + grenzen.y1 * feld,
        width: spalten * feld,
        height: zeilen * feld,
        '--strichstaerke': `${Math.max(1, 2 / massstab)}px`,
      }}
    >
      {mitMass && (
        <span
          className="tisch-marke absolute bottom-full left-0 mb-1 whitespace-nowrap font-display"
          style={{ fontSize: Math.max(11, 14 / massstab) }}
        >
          {spalten} × {zeilen} Felder
        </span>
      )}
    </div>
  );
}
