import { useLayoutEffect, useMemo, useRef } from 'react';
import { hatStelle, rasterBereich } from '../../../lib/rasterkarte.js';

/**
 * Der Nebel als Bildpunkte: ein Punkt je Rasterfeld, hochskaliert vom
 * Browser. Das ist um Größenordnungen billiger, als tausend Rechtecke zu
 * malen, und läuft auch auf einem iPad flüssig.
 *
 * Drei Zustände, wie man es von einer Karte erwartet, auf der man schon war:
 *
 *   unerkundet   – schwarz. Da war noch niemand.
 *   erkundet     – gedämpft. Man weiß, wie es dort aussieht, sieht aber
 *                  gerade nicht hin: das Gelände bleibt, wer dort steht nicht.
 *   im Blick     – klar. Hier reicht Licht oder Dunkelsicht hin.
 *
 * Die mittlere Stufe entsteht nur, wenn der Server eine Sicht mitgeschickt
 * hat; sonst bleibt es beim alten Zweiklang aus auf und zu.
 */
export default function Nebelschicht({ scene, fog, sicht, dm }) {
  const canvasRef = useRef(null);
  const { g, minX, minY, cols, rows } = useMemo(() => rasterBereich(scene), [scene]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cols <= 0 || rows <= 0) return;
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext('2d');
    const bild = ctx.createImageData(cols, rows);
    // Die Spielleitung schaut durch den Nebel hindurch, die Runde nicht.
    const zu = dm ? 130 : 255;
    const erinnert = dm ? 70 : 168;

    // Beide Karten liegen im selben Raster wie dieses Bild, Stelle für Stelle.
    // Deshalb genügt ein laufender Zähler statt einer Rechnung je Feld – bei
    // 40 000 Feldern ist das der Unterschied zwischen flüssig und ruckelig.
    for (let stelle = 0; stelle < cols * rows; stelle++) {
      const offen = hatStelle(fog, stelle);
      const p = stelle * 4;
      bild.data[p] = 12;
      bild.data[p + 1] = 9;
      bild.data[p + 2] = 6;
      bild.data[p + 3] = !offen ? zu : sicht && !hatStelle(sicht, stelle) ? erinnert : 0;
    }
    ctx.putImageData(bild, 0, 0);
  }, [cols, rows, fog, sicht, dm]);

  if (cols <= 0 || rows <= 0) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute"
      style={{
        left: scene.gridOffsetX + minX * g,
        top: scene.gridOffsetY + minY * g,
        width: cols * g,
        height: rows * g,
        imageRendering: 'pixelated',
        // Für die Runde deckt der Nebel auch die Figuren zu – was im
        // Dunkeln steht, steht im Dunkeln. Die Spielleitung schaut über
        // ihre Figuren hinweg durch den Schleier.
        zIndex: dm ? 5 : 25,
      }}
    />
  );
}

/**
 * Eine Figur auf der Karte.
 *
 * Steht in Kartenpunkten (`left`/`top`), nicht in Bildschirmpunkten – die
 * Transformation des Behälters erledigt den Rest. Der Balken darunter
 * erscheint nur, wenn Trefferpunkte bekannt sind: Bei Monstern bekommt die
 * Runde sie nicht, und dann soll dort auch nichts stehen.
 */
