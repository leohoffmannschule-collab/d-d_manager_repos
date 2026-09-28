import { useCallback, useRef } from 'react';
import { bereichGrenzen, felderImPinsel, pinselGrenzen, rasterBereich } from '../../lib/rasterkarte.js';

/**
 * Der Nebelpinsel: welche Felder ein Strich trifft.
 *
 * Reine Rechnung, kein Aussehen – deshalb eine eigene Datei neben dem
 * Spieltisch. Sie beantwortet zwei Fragen:
 *
 *   *Was träfe der nächste Strich?* → `vorschau`, damit man es sieht,
 *   bevor man klickt. Ohne das wäre ein 5×5-Pinsel ein Ratespiel.
 *
 *   *Was hat der Strich getroffen?* → `abdruecken`, samt der Strecke seit
 *   dem letzten Abdruck.
 *
 * Die Strecke ist der Kniff: Zwischen zwei Bildern springt der Zeiger bei
 * einem schnellen Strich über mehrere Felder. Ohne die Zwischenschritte
 * bliebe eine Perlenkette stehen statt eines Strichs.
 */
export function usePinselabdruck({ scene, pinsel, mode, onPaintFog, zeigerFeld }) {
  const { g } = rasterBereich(scene);
  const alsRechteck = pinsel === 'rechteck';
  const groesse = alsRechteck ? 1 : Math.max(1, Number(pinsel) || 1);

  // Wo der letzte Abdruck saß. Als useRef, weil es zwischen zwei Bildern
  // überdauern muss, ohne ein Neuzeichnen auszulösen.
  const letzter = useRef(null);

  /** Kartenpunkt in Feldkoordinaten – die Sprache des Nebels. */
  const feldKoord = useCallback(
    (punkt) => ({
      x: Math.floor((punkt.x - scene.gridOffsetX) / g),
      y: Math.floor((punkt.y - scene.gridOffsetY) / g),
    }),
    [g, scene.gridOffsetX, scene.gridOffsetY]
  );

  /** Einen Abdruck setzen – und die Strecke seit dem letzten mit. */
  const abdruecken = useCallback(
    (punkt) => {
      const jetzt = feldKoord(punkt);
      const vorher = letzter.current;
      letzter.current = jetzt;

      const felder = new Set(felderImPinsel(scene, jetzt.x, jetzt.y, groesse));
      if (vorher) {
        const schritte = Math.max(Math.abs(jetzt.x - vorher.x), Math.abs(jetzt.y - vorher.y));
        for (let i = 1; i < schritte; i++) {
          const x = Math.round(vorher.x + ((jetzt.x - vorher.x) * i) / schritte);
          const y = Math.round(vorher.y + ((jetzt.y - vorher.y) * i) / schritte);
          for (const f of felderImPinsel(scene, x, y, groesse)) felder.add(f);
        }
      }
      if (felder.size) onPaintFog?.([...felder], mode === 'nebel-auf');
    },
    [feldKoord, scene, groesse, onPaintFog, mode]
  );

  /** Einen neuen Strich beginnen: Der vorige zählt nicht mehr dazu. */
  const strichBeginnen = useCallback(() => {
    letzter.current = null;
  }, []);

  /**
   * Was der nächste Strich träfe, als Rechteck in Feldkoordinaten – für die
   * Vorschau auf der Karte. `ziehen` ist das gerade aufgezogene Rechteck,
   * falls eines im Gange ist.
   */
  const vorschau = useCallback(
    (ziehen) => {
      if (ziehen?.art === 'nebel-rechteck') {
        return bereichGrenzen(scene, ziehen.von.x, ziehen.von.y, ziehen.bis.x, ziehen.bis.y);
      }
      if (!zeigerFeld) return null;
      return pinselGrenzen(scene, zeigerFeld.x, zeigerFeld.y, alsRechteck ? 1 : groesse);
    },
    [scene, zeigerFeld, alsRechteck, groesse]
  );

  return { alsRechteck, feldKoord, abdruecken, strichBeginnen, vorschau };
}
