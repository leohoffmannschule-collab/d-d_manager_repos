/**
 * Die Zeiger auf dem Spieltisch: was ein Aufsetzen, Ziehen und Loslassen
 * gerade bedeutet.
 *
 * Eigene Datei, weil hier die eigentliche Bedienung des Tisches steckt – und
 * sie ist dicht: Maus, Finger und Stift kommen über dieselben *Pointer
 * Events* herein, zwei Finger heißen Kneifen, und je nach Werkzeug wird
 * dasselbe Ziehen zur Figurbewegung, zum Nebelstrich, zum Rechteck oder zum
 * Verschieben der Karte. Board.jsx setzt nur noch zusammen, was dabei
 * herauskommt.
 *
 * Der Haken bekommt alles, was er zum Entscheiden braucht, und gibt
 * dreierlei zurück:
 *
 *   ziehen, lineal  – was gerade gezogen oder gemessen wird (zum Zeichnen)
 *   beiZeigerAb, beiZeigerBewegung, beiZeigerAuf – die drei Rückrufe
 *
 * Das Feld unter dem Zeiger (`setZeigerFeld`) gehört dagegen dem Tisch:
 * Der Pinselabdruck braucht es, bevor dieser Haken überhaupt läuft.
 */
import { useRef, useState } from 'react';
import { felderImBereich } from '../../lib/rasterkarte.js';

export function useZeiger({
  huelle,
  scene,
  tokens,
  mode,
  nebelModus,
  feld: g,
  ansicht,
  setAnsicht,
  zuSzene,
  zoomen,
  pinsel: { alsRechteck, feldKoord, abdruecken, strichBeginnen },
  setZeigerFeld,
  canMoveToken,
  onSelectToken,
  onPing,
  onMoveToken,
  onPaintFog,
}) {
  // Was gerade gezogen wird: eine Figur, die Karte, ein Nebelstrich oder
  // ein aufgezogenes Rechteck. `null` heißt: nichts.
  const [ziehen, setZiehen] = useState(null);
  const [lineal, setLineal] = useState(null);
  // Alle aufliegenden Zeiger. Zwei heißen Kneifen und Schieben.
  const zeiger = useRef(new Map());

  /**
   * Ein Finger, eine Maustaste oder ein Stift setzt auf.
   *
   * `setPointerCapture` ist die wichtige Zeile: Von da an bekommt dieses
   * Element alle weiteren Ereignisse dieses Zeigers, auch wenn er die Hülle
   * verlässt. Ohne das bliebe eine Figur hängen, sobald man sie über den
   * Rand des Tisches zieht.
   *
   * Die Reihenfolge der Abfragen ist die Rangfolge: Zeigen und Messen gehen
   * vor, dann der Nebel, dann das Ziehen einer Figur, und ganz zuletzt das
   * Schieben der Karte als Rückfallebene.
   */
  function beiZeigerAb(e) {
    huelle.current.setPointerCapture(e.pointerId);
    zeiger.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Zwei Finger heißen immer Kneifen und Schieben – nie Malen. Sonst
    // zöge man beim Aufziehen der Karte eine Nebelspur hinter sich her.
    if (zeiger.current.size > 1) {
      setZiehen(null);
      return;
    }

    const punkt = zuSzene(e.clientX, e.clientY);
    const tokenEl = e.target.closest?.('[data-token]');
    const token = tokenEl ? tokens.find((t) => t.id === tokenEl.dataset.token) : null;

    if (mode === 'zeigen' || e.altKey) {
      onPing?.(punkt);
      return;
    }
    if (mode === 'messen') {
      setLineal({ von: punkt, bis: punkt });
      return;
    }
    if (nebelModus) {
      if (alsRechteck) {
        const ecke = feldKoord(punkt);
        setZiehen({ art: 'nebel-rechteck', von: ecke, bis: ecke });
        return;
      }
      strichBeginnen();
      abdruecken(punkt);
      setZiehen({ art: 'nebel' });
      return;
    }
    if (token && canMoveToken(token)) {
      onSelectToken?.(token.id);
      setZiehen({
        art: 'figur',
        id: token.id,
        greifX: punkt.x - token.x,
        greifY: punkt.y - token.y,
        x: token.x,
        y: token.y,
      });
      return;
    }
    if (token) onSelectToken?.(token.id);
    setZiehen({ art: 'karte', vonX: e.clientX, vonY: e.clientY, tx: ansicht.tx, ty: ansicht.ty });
  }

  function beiZeigerBewegung(e) {
    // Der Abdruck folgt dem Zeiger auch ohne gedrückte Taste – sonst malte
    // man bei 5×5 ins Blaue. Neu gesetzt wird nur beim Feldwechsel.
    if (nebelModus) {
      const unterm = feldKoord(zuSzene(e.clientX, e.clientY));
      setZeigerFeld((alt) => (alt && alt.x === unterm.x && alt.y === unterm.y ? alt : unterm));
    }

    if (!zeiger.current.has(e.pointerId)) return;
    const vorher = [...zeiger.current.values()];
    zeiger.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Kneifen zum Zoomen: Der Abstand der beiden Finger ist der Faktor.
    if (zeiger.current.size === 2) {
      const jetzt = [...zeiger.current.values()];
      const abstand = (p) => Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      const alt = abstand(vorher);
      const neu = abstand(jetzt);
      if (alt > 0 && neu > 0) {
        const box = huelle.current.getBoundingClientRect();
        zoomen(neu / alt, (jetzt[0].x + jetzt[1].x) / 2 - box.left, (jetzt[0].y + jetzt[1].y) / 2 - box.top);
      }
      return;
    }

    const punkt = zuSzene(e.clientX, e.clientY);

    if (lineal) {
      setLineal((l) => ({ ...l, bis: punkt }));
      return;
    }
    if (!ziehen) return;

    if (ziehen.art === 'karte') {
      setAnsicht((a) => ({
        ...a,
        tx: ziehen.tx + (e.clientX - ziehen.vonX),
        ty: ziehen.ty + (e.clientY - ziehen.vonY),
      }));
    } else if (ziehen.art === 'nebel') {
      abdruecken(punkt);
    } else if (ziehen.art === 'nebel-rechteck') {
      setZiehen((z) => ({ ...z, bis: feldKoord(punkt) }));
    } else if (ziehen.art === 'figur') {
      setZiehen((z) => ({ ...z, x: punkt.x - z.greifX, y: punkt.y - z.greifY }));
    }
  }

  /**
   * Der Zeiger hebt ab. Hier wird abgeschlossen, was begonnen wurde: Die
   * Figur schnappt aufs Raster ein, das Rechteck wird angewendet, das
   * Lineal verschwindet.
   */
  function beiZeigerAuf(e) {
    zeiger.current.delete(e.pointerId);
    huelle.current.releasePointerCapture?.(e.pointerId);

    if (lineal) {
      setLineal(null);
      return;
    }
    if (ziehen?.art === 'nebel-rechteck') {
      const felder = felderImBereich(scene, ziehen.von.x, ziehen.von.y, ziehen.bis.x, ziehen.bis.y);
      if (felder.length) onPaintFog?.(felder, mode === 'nebel-auf');
      setZiehen(null);
      return;
    }
    strichBeginnen();
    if (ziehen?.art === 'figur') {
      // Auf das Raster einschnappen. Gerundet, nicht abgeschnitten – sonst
      // rutschte jede Figur beim Loslassen nach links oben.
      const x = Math.round((ziehen.x - scene.gridOffsetX) / g) * g + scene.gridOffsetX;
      const y = Math.round((ziehen.y - scene.gridOffsetY) / g) * g + scene.gridOffsetY;
      onMoveToken?.(ziehen.id, x, y);
    }
    setZiehen(null);
  }

  return { ziehen, lineal, beiZeigerAb, beiZeigerBewegung, beiZeigerAuf };
}
