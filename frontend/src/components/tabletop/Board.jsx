import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { mediaApi } from '../../lib/api.js';

const MIN_SCALE = 0.12;
const MAX_SCALE = 4;

/** Rasterfelder, die eine Karte umfasst – auch bei verschobenem Raster. */
export function rasterBereich(scene) {
  const g = Math.max(4, scene.gridSize);
  const minX = Math.floor((0 - scene.gridOffsetX) / g);
  const minY = Math.floor((0 - scene.gridOffsetY) / g);
  const maxX = Math.floor((Math.max(1, scene.width) - 1 - scene.gridOffsetX) / g);
  const maxY = Math.floor((Math.max(1, scene.height) - 1 - scene.gridOffsetY) / g);
  return { g, minX, minY, cols: maxX - minX + 1, rows: maxY - minY + 1 };
}

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
function Nebel({ scene, fog, sicht, dm }) {
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

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const feld = `${minX + i},${minY + j}`;
        const offen = fog.has(feld);
        const p = (j * cols + i) * 4;
        bild.data[p] = 12;
        bild.data[p + 1] = 9;
        bild.data[p + 2] = 6;
        bild.data[p + 3] = !offen ? zu : sicht && !sicht.has(feld) ? erinnert : 0;
      }
    }
    ctx.putImageData(bild, 0, 0);
  }, [cols, rows, minX, minY, fog, sicht, dm]);

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

function Figur({ token, scene, hp, aktiv, beweglich, ziehend }) {
  const g = scene.gridSize;
  const groesse = token.size * g;
  const anteil = hp?.max ? Math.max(0, Math.min(1, (hp.current ?? 0) / hp.max)) : null;

  return (
    <div
      data-token={token.id}
      className={`absolute select-none ${beweglich ? 'cursor-grab' : 'cursor-default'} ${
        ziehend ? 'z-20 opacity-90' : 'z-10'
      }`}
      style={{ left: token.x, top: token.y, width: groesse, height: groesse }}
    >
      <div
        className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-full ${
          aktiv ? 'ring-[3px] ring-gold' : 'ring-2 ring-black/40'
        } ${token.hidden ? 'opacity-55 saturate-50' : ''}`}
        style={{ backgroundColor: token.mediaId ? undefined : token.color }}
      >
        {token.mediaId ? (
          <img src={mediaApi.url(token.mediaId)} alt="" draggable={false} className="h-full w-full object-cover" />
        ) : (
          <span
            className="font-display font-bold text-[#f4ead2]"
            style={{ fontSize: Math.max(11, groesse * 0.42) }}
          >
            {(token.name || '?').charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {anteil !== null && (
        <span
          className="absolute -bottom-1 left-1/2 flex h-1.5 -translate-x-1/2 overflow-hidden border border-black/50 bg-black/60"
          style={{ width: groesse * 0.86 }}
        >
          <span
            className="h-full"
            style={{ width: `${anteil * 100}%`, backgroundColor: anteil > 0.5 ? '#2f6b4f' : '#9a2b22' }}
          />
        </span>
      )}

      {token.name && (
        <span
          className="pointer-events-none absolute top-full left-1/2 mt-1.5 -translate-x-1/2 whitespace-nowrap bg-black/65 px-1.5 py-0.5 font-display text-[#f2e4c2]"
          style={{ fontSize: Math.max(9, Math.min(14, g * 0.17)) }}
        >
          {token.name}
        </span>
      )}
    </div>
  );
}

/**
 * Der Spieltisch selbst: Karte, Raster, Nebel und Figuren, mit Schieben,
 * Zoomen, Ziehen der Figuren, Nebelpinsel, Lineal und Zeigefinger.
 */
export default function Board({
  scene,
  fog,
  sicht,
  tokens,
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
}) {
  const huelle = useRef(null);
  const [ansicht, setAnsicht] = useState({ scale: 1, tx: 0, ty: 0 });
  const [ziehen, setZiehen] = useState(null);
  const [lineal, setLineal] = useState(null);
  const zeiger = useRef(new Map());
  const gepasst = useRef(null);

  const { g } = useMemo(() => rasterBereich(scene), [scene]);

  /** Bildpunkte der Karte aus einem Bildschirmpunkt. */
  const zuSzene = useCallback(
    (clientX, clientY) => {
      const box = huelle.current.getBoundingClientRect();
      return {
        x: (clientX - box.left - ansicht.tx) / ansicht.scale,
        y: (clientY - box.top - ansicht.ty) / ansicht.scale,
      };
    },
    [ansicht]
  );

  const feld = useCallback(
    (punkt) => `${Math.floor((punkt.x - scene.gridOffsetX) / g)},${Math.floor((punkt.y - scene.gridOffsetY) / g)}`,
    [g, scene.gridOffsetX, scene.gridOffsetY]
  );

  // Beim ersten Anzeigen die Karte einpassen.
  useEffect(() => {
    if (gepasst.current === scene.id || !huelle.current || !scene.width) return;
    gepasst.current = scene.id;
    const box = huelle.current.getBoundingClientRect();
    const scale = Math.min(box.width / scene.width, box.height / scene.height, 1);
    setAnsicht({
      scale: Math.max(MIN_SCALE, scale),
      tx: (box.width - scene.width * scale) / 2,
      ty: (box.height - scene.height * scale) / 2,
    });
  }, [scene.id, scene.width, scene.height]);

  const zoomen = useCallback((faktor, punktX, punktY) => {
    setAnsicht((a) => {
      const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, a.scale * faktor));
      const wirklich = scale / a.scale;
      return {
        scale,
        tx: punktX - (punktX - a.tx) * wirklich,
        ty: punktY - (punktY - a.ty) * wirklich,
      };
    });
  }, []);

  function beiRad(e) {
    e.preventDefault();
    const box = huelle.current.getBoundingClientRect();
    zoomen(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - box.left, e.clientY - box.top);
  }

  function beiZeigerAb(e) {
    huelle.current.setPointerCapture(e.pointerId);
    zeiger.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Zwei Finger: nur schieben und zoomen.
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
    if (mode === 'nebel-auf' || mode === 'nebel-zu') {
      onPaintFog?.([feld(punkt)], mode === 'nebel-auf');
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
    if (!zeiger.current.has(e.pointerId)) return;
    const vorher = [...zeiger.current.values()];
    zeiger.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Kneifen zum Zoomen.
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
      onPaintFog?.([feld(punkt)], mode === 'nebel-auf');
    } else if (ziehen.art === 'figur') {
      setZiehen((z) => ({ ...z, x: punkt.x - z.greifX, y: punkt.y - z.greifY }));
    }
  }

  function beiZeigerAuf(e) {
    zeiger.current.delete(e.pointerId);
    huelle.current.releasePointerCapture?.(e.pointerId);

    if (lineal) {
      setLineal(null);
      return;
    }
    if (ziehen?.art === 'figur') {
      // Auf das Raster einschnappen.
      const x = Math.round((ziehen.x - scene.gridOffsetX) / g) * g + scene.gridOffsetX;
      const y = Math.round((ziehen.y - scene.gridOffsetY) / g) * g + scene.gridOffsetY;
      onMoveToken?.(ziehen.id, x, y);
    }
    setZiehen(null);
  }

  const kampfWert = useCallback(
    (token) => combatants.find((c) => c.id === token.combatantId || (token.characterId && c.characterId === token.characterId)),
    [combatants]
  );

  const felder = lineal
    ? Math.max(
        Math.abs(Math.round((lineal.bis.x - lineal.von.x) / g)),
        Math.abs(Math.round((lineal.bis.y - lineal.von.y) / g))
      )
    : 0;

  return (
    <div
      ref={huelle}
      onWheel={beiRad}
      onPointerDown={beiZeigerAb}
      onPointerMove={beiZeigerBewegung}
      onPointerUp={beiZeigerAuf}
      onPointerCancel={beiZeigerAuf}
      className={`relative h-full w-full overflow-hidden bg-[#14100a] ${
        mode === 'bewegen' ? 'cursor-grab' : mode === 'zeigen' ? 'cursor-pointer' : 'cursor-crosshair'
      }`}
      style={{ touchAction: 'none' }}
    >
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${ansicht.tx}px, ${ansicht.ty}px) scale(${ansicht.scale})`,
          width: scene.width || 1,
          height: scene.height || 1,
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
          <div className="absolute inset-0 bg-[#241c12]" />
        )}

        {scene.gridVisible && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(0,0,0,0.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.28) 1px, transparent 1px)',
              backgroundSize: `${g}px ${g}px`,
              backgroundPosition: `${scene.gridOffsetX}px ${scene.gridOffsetY}px`,
            }}
          />
        )}

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
          <SelectionRing token={tokens.find((t) => t.id === selectedTokenId)} scene={scene} />
        )}

        {scene.fogEnabled && <Nebel scene={scene} fog={fog} sicht={sicht} dm={dm} />}

        {lineal && (
          <svg className="pointer-events-none absolute inset-0 overflow-visible">
            <line
              x1={lineal.von.x}
              y1={lineal.von.y}
              x2={lineal.bis.x}
              y2={lineal.bis.y}
              stroke="#d9b451"
              strokeWidth={Math.max(2, 3 / ansicht.scale)}
              strokeDasharray={`${g / 4} ${g / 6}`}
            />
            <text
              x={lineal.bis.x + 8}
              y={lineal.bis.y - 8}
              fill="#e8cf8d"
              style={{ fontSize: Math.max(12, 16 / ansicht.scale), paintOrder: 'stroke' }}
              stroke="#14100a"
              strokeWidth={Math.max(2, 4 / ansicht.scale)}
            >
              {felder} Felder · {felder * 5} Fuß
            </text>
          </svg>
        )}

        {pings.map((ping) => (
          <span
            key={ping.key}
            className="pointer-events-none absolute z-30"
            style={{ left: ping.x, top: ping.y, transform: 'translate(-50%, -50%)' }}
          >
            <span
              className="block animate-ping rounded-full"
              style={{ width: g, height: g, border: `3px solid ${ping.color}` }}
            />
            <span
              className="absolute top-full left-1/2 mt-1 -translate-x-1/2 whitespace-nowrap font-display text-[12px]"
              style={{ color: ping.color }}
            >
              {ping.name}
            </span>
          </span>
        ))}
      </div>

      <div className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-2 bg-black/45 px-2.5 py-1 font-display text-[11px] tracking-[0.10em] text-[#e8cf8d] uppercase">
        {Math.round(ansicht.scale * 100)} %
      </div>
    </div>
  );
}

function SelectionRing({ token, scene }) {
  if (!token) return null;
  const groesse = token.size * scene.gridSize;
  return (
    <span
      className="pointer-events-none absolute z-[15] border-2 border-dashed border-gold-soft"
      style={{ left: token.x - 3, top: token.y - 3, width: groesse + 6, height: groesse + 6 }}
    />
  );
}
