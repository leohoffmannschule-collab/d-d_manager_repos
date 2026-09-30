import { px } from '../../../lib/stilwerte.js';

/**
 * Das Rasternetz über der Karte.
 *
 * Gezeichnet wird es in stile/spieltisch.css aus zwei gekreuzten
 * Linienmustern – hier stehen nur Feldgröße und Versatz.
 *
 * Unterhalb einer gewissen Kantenlänge auf dem Schirm wird es gar nicht
 * erst gezeigt: Ein Raster, dessen Felder fünf Bildpunkte groß sind, ist
 * kein Raster mehr, sondern ein Grauschleier.
 */
const RASTER_AB = 5;

export default function Rasternetz({ scene, feld, massstab }) {
  if (!scene.gridVisible || feld * massstab < RASTER_AB) return null;

  return (
    <div
      className="tisch-raster pointer-events-none absolute inset-0"
      style={{
        '--feld': px(feld),
        '--versatz-x': px(scene.gridOffsetX),
        '--versatz-y': px(scene.gridOffsetY),
      }}
    />
  );
}
