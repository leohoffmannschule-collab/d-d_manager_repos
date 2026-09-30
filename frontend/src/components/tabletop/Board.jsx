/**
 * Der Spieltisch: Karte, Raster, Figuren, Nebel, Lineal, Zeigefinger.
 *
 * Diese Datei tut nur noch eines: Sie setzt die Teile übereinander, die
 * zeigen, was auf dem Tisch liegt. Was ein Aufsetzen, Ziehen und Loslassen
 * gerade bedeutet, entscheidet useZeiger.js.
 *
 * Alles andere liegt daneben und lässt sich einzeln lesen:
 *
 *   useZeiger.js         was Aufsetzen, Ziehen und Loslassen bedeuten
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mediaApi } from '../../lib/api.js';
import { rasterBereich } from '../../lib/rasterkarte.js';
import { useAnsicht } from './useAnsicht.js';
import { usePinselabdruck } from './usePinselabdruck.js';
import { useZeiger } from './useZeiger.js';
import Nebelschicht from './brett/Nebelschicht.jsx';
import Figur, { Auswahlring } from './brett/Figur.jsx';
import Rasternetz from './brett/Rasternetz.jsx';
import Nebelvorschau from './brett/Nebelvorschau.jsx';
import Lineal from './brett/Lineal.jsx';
import Zeigefinger from './brett/Zeigefinger.jsx';
import { px } from '../../lib/stilwerte.js';
import Laufwert from '../Laufwert.jsx';

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
  // Das Feld unter dem Zeiger – nur fürs Vorzeigen des Pinselabdrucks.
  const [zeigerFeld, setZeigerFeld] = useState(null);

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

  const { ziehen, lineal, beiZeigerAb, beiZeigerBewegung, beiZeigerAuf } = useZeiger({
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
  });

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
      <Laufwert
        als="div"
        className="tisch-buehne"
        werte={{
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
      </Laufwert>

      <div className="tisch-marke pointer-events-none absolute right-3 bottom-3 flex items-center gap-2 bg-black/45 px-2.5 py-1 font-display text-[11px] tracking-[0.10em] uppercase">
        {Math.round(ansicht.scale * 100)} %
      </div>
    </div>
  );
}
