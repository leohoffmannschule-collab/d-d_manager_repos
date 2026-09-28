import { mediaApi } from '../../../lib/api.js';

export default function Figur({ token, scene, hp, aktiv, beweglich, ziehend }) {
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
            className={`figur-balken ${anteil > 0.5 ? 'figur-balken-gut' : 'figur-balken-schlecht'}`}
            style={{ '--anteil': `${anteil * 100}%` }}
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

/**
 * Der gestrichelte Ring um die gewählte Figur – nur für die Spielleitung.
 *
 * Steht hier und nicht in einer eigenen Datei, weil er dieselbe Sache zeigt
 * wie die Figur darunter: welche gerade gemeint ist.
 */
export function Auswahlring({ token, scene }) {
  if (!token) return null;
  const groesse = token.size * scene.gridSize;
  return (
    <span
      className="pointer-events-none absolute z-[15] border-2 border-dashed border-gold-soft"
      style={{ left: token.x - 3, top: token.y - 3, width: groesse + 6, height: groesse + 6 }}
    />
  );
}
