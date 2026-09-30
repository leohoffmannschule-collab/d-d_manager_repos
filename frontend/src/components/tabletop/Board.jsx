import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mediaApi } from '../../lib/api.js';
import { felderImBereich, rasterBereich } from '../../lib/rasterkarte.js';
import { useAnsicht } from './useAnsicht.js';
import { usePinselabdruck } from './usePinselabdruck.js';
import Nebelschicht from './brett/Nebelschicht.jsx';
import Figur, { Auswahlring } from './brett/Figur.jsx';
import Rasternetz from './brett/Rasternetz.jsx';
import Nebelvorschau from './brett/Nebelvorschau.jsx';
import Lineal from './brett/Lineal.jsx';
import Zeigefinger from './brett/Zeigefinger.jsx';
import { px } from '../../lib/stilwerte.js';

/**
 * Der Spieltisch: Karte, Raster, Figuren, Nebel, Lineal, Zeigefinger.
 *
 * Diese Datei tut nur noch **zwei** Dinge, und das ist ihr ganzer Zweck:
 *
 *   1. Sie nimmt die Zeigerereignisse entgegen und entscheidet, was ein
 *      Aufsetzen, Ziehen und Loslassen gerade bedeutet.
 *   2. Sie setzt die Teile übereinander, die das Ergebnis zeigen.
 *
 * Alles andere liegt daneben und lässt sich einzeln lesen:
 *
 *   useAnsicht.js        Maßstab und Verschiebung, Rad und Kneifen
 *   usePinselabdruck.js  welche Felder ein Nebelstrich trifft
 *   brett/Nebelschicht   der Nebel als Bildpunkte
 *   brett/Figur          eine Figur samt Lebensbalken, und der Auswahlring
 *   brett/Rasternetz     das Netz über der Karte
 *   brett/Nebelvorschau  was der nächste Strich träfe
 *   brett/Lineal         die Entfernung in Feldern
 *   brett/Zeigefinger    „Da!“
 *
 * Wer hier etwas ändert, sollte die **drei Koordinatensysteme**
 * auseinanderhalten:
 *
 *   1. Bildschirmpunkte – was ein Zeigerereignis liefert (`e.clientX`).
 *   2. Kartenpunkte     – Bildpunkte auf der Karte selbst, unabhängig von
 *                         Zoom und Verschiebung. `zuSzene()` rechnet um.
 *   3. Rasterfelder     – „3,7“, die Sprache des Nebels. `feldKoord()`
 *                         rechnet Kartenpunkte in Felder um.
 *
 * Gezoomt und geschoben wird nicht durch Umrechnen jedes einzelnen Dings,
 * sondern durch *eine* CSS-Transformation auf dem Behälter: alles darin
 * wandert mit. Deshalb dürfen Figuren in Kartenpunkten positioniert werden
 * und niemand muss beim Zoomen rechnen.
 *
 * Bedient wird mit *Pointer Events* statt Maus- und Berührungsereignissen:
 * ein Satz Rückrufe für Maus, Finger und Stift.
 */
export default function Board({
  scene,
  fog,
  sicht = null,
  tokens = [],
  combatants = [],
  activeCombatantId = null,
  dm = false,
  mode = 'bewegen',
  canMoveToken = () => false,
  onMoveToken,
  onPaintFog,
  onPing,
  pings = [],
  selectedTokenId = null,
  onSelectToken,
  pinsel = 1,
}) {
  const huelle = useRef(null);
  // Was gerade gezogen wird: eine Figur, die Karte, ein Nebelstrich oder
  // ein aufgezogenes Rechteck. `null` heißt: nichts.
  const [ziehen, setZiehen] = useState(null);
  const [lineal, setLineal] = useState(null);
  // Das Feld unter dem Zeiger – nur fürs Vorzeigen des Pinselabdrucks.
  const [zeigerFeld, setZeigerFeld] = useState(null);
  // Alle aufliegenden Zeiger. Zwei heißen Kneifen und Schieben.
  const zeiger = useRef(new Map());

  const { g } = useMemo(() => rasterBereich(scene), [scene]);
  const nebelModus = mode === 'nebel-auf' || mode === 'nebel-zu';

  const { ansicht, setAnsicht, zuSzene, zoomen } = useAnsicht(huelle, scene);
  const { alsRechteck, feldKoord, abdruecken, strichBeginnen, vorschau } = usePinselabdruck({
    scene,
    pinsel,
    mode,
    onPaintFog,
    zeigerFeld,
  });

  // Werkzeug gewechselt: Der Abdruck unter dem Zeiger hat ausgedient.
  useEffect(() => {
    if (!nebelModus) setZeigerFeld(null);
  }, [nebelModus]);

  /* --- Die Zeiger -------------------------------------------------------- */

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

  /* --- Anzeige ----------------------------------------------------------- */

  /** Der Kämpfer zu einer Figur – für Trefferpunkte und „ist dran“. */
  const kampfWert = useCallback(
    (token) =>
      combatants.find((c) => c.id === token.combatantId || (token.characterId && c.characterId === token.characterId)),
    [combatants]
  );

  const abdruckGrenzen = vorschau(ziehen);

  return (
    <div
      ref={huelle}
      onPointerDown={beiZeigerAb}
      onPointerMove={beiZeigerBewegung}
      onPointerUp={beiZeigerAuf}
      onPointerCancel={beiZeigerAuf}
      onPointerLeave={() => setZeigerFeld(null)}
      className={`tisch-flaeche relative h-full w-full overflow-hidden bg-[var(--tisch-grund)] ${
        mode === 'bewegen' ? 'cursor-grab' : mode === 'zeigen' ? 'cursor-pointer' : 'cursor-crosshair'
      }`}
    >
      {/* Eine Transformation für alles: Karte, Raster, Figuren und Nebel
          liegen darin und wandern beim Zoomen gemeinsam. */}
      <div
        className="tisch-buehne"
        style={{
          '--tx': px(ansicht.tx),
          '--ty': px(ansicht.ty),
          '--massstab': ansicht.scale,
          '--breite': px(scene.width || 1),
          '--hoehe': px(scene.height || 1),
        }}
      >
        {scene.mediaId ? (
          <img
            src={mediaApi.url(scene.mediaId)}
            alt={scene.name}
            draggable={false}
            className="absolute inset-0 h-full w-full select-none"
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--tisch-leer)]" />
        )}

        <Rasternetz scene={scene} feld={g} massstab={ansicht.scale} />

        {tokens.map((token) => {
          const gezogen = ziehen?.art === 'figur' && ziehen.id === token.id;
          const kampf = kampfWert(token);
          return (
            <Figur
              key={token.id}
              token={gezogen ? { ...token, x: ziehen.x, y: ziehen.y } : token}
              scene={scene}
              hp={kampf && kampf.maxHp ? { current: kampf.hp, max: kampf.maxHp } : null}
              aktiv={!!kampf && kampf.id === activeCombatantId}
              beweglich={canMoveToken(token)}
              ziehend={gezogen}
            />
          );
        })}

        {selectedTokenId && dm && (
          <Auswahlring token={tokens.find((t) => t.id === selectedTokenId)} scene={scene} />
        )}

        {scene.fogEnabled && <Nebelschicht scene={scene} fog={fog} sicht={sicht} dm={dm} />}

        <Nebelvorschau
          grenzen={dm && nebelModus ? abdruckGrenzen : null}
          scene={scene}
          feld={g}
          massstab={ansicht.scale}
          aufdecken={mode === 'nebel-auf'}
          mitMass={ziehen?.art === 'nebel-rechteck'}
        />

        <Lineal lineal={lineal} scene={scene} feld={g} massstab={ansicht.scale} />

        <Zeigefinger pings={pings} feld={g} />
      </div>

      <div className="tisch-marke pointer-events-none absolute right-3 bottom-3 flex items-center gap-2 bg-black/45 px-2.5 py-1 font-display text-[11px] tracking-[0.10em] uppercase">
        {Math.round(ansicht.scale * 100)} %
      </div>
    </div>
  );
}
