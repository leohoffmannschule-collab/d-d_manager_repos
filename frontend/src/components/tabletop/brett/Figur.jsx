/**
 * Eine Figur auf dem Tisch: runde Scheibe mit Bild oder Anfangsbuchstabe,
 * darunter Lebensbalken und Namensschild – und der Auswahlring, der zeigt,
 * welche Figur die Spielleitung gerade bearbeitet.
 *
 * Alles hier steht in *Kartenpunkten*: `token.x`/`token.y` ist die obere
 * linke Ecke auf der Karte, die Größe ein Vielfaches der Feldgröße
 * (`token.size` = 1 für mittelgroß, 2 für groß …). Gezoomt wird nicht hier,
 * sondern über die Bühne, in der die Figur steht (Board.jsx).
 *
 * Der Lebensbalken erscheint nur, wenn Trefferpunkte bekannt sind: Bei
 * Monstern bekommt die Runde sie nicht, und dann soll dort auch nichts
 * stehen.
 *
 * Die Werte gehen als CSS-Variablen hinaus, die Regeln stehen in
 * stile/spieltisch/figuren.css.
 */
import { mediaApi } from '../../../lib/api.js';
import { prozent, px } from '../../../lib/stilwerte.js';
import Laufwert from '../../Laufwert.jsx';

/**
 * @param {object} props
 * @param {object} props.token      die Figur (x, y, size, name, color, mediaId, hidden)
 * @param {object} props.scene      die Szene – für die Feldgröße
 * @param {{current:number,max:number}|null} props.hp  Trefferpunkte, falls die Figur im Kampf steht
 * @param {boolean} props.aktiv     ist gerade am Zug (goldener Ring)
 * @param {boolean} props.beweglich darf von diesem Fenster gezogen werden (Zeiger)
 * @param {boolean} props.ziehend   wird gerade gezogen (liegt oben, leicht durchscheinend)
 */
export default function Figur({ token, scene, hp, aktiv, beweglich, ziehend }) {
  const g = scene.gridSize;
  const groesse = token.size * g;
  const anteil = hp?.max ? Math.max(0, Math.min(1, (hp.current ?? 0) / hp.max)) : null;

  return (
    <Laufwert
      als="div"
      data-token={token.id}
      className={`figur select-none ${beweglich ? 'cursor-grab' : 'cursor-default'} ${
        ziehend ? 'z-20 opacity-90' : 'z-10'
      }`}
      werte={{ '--x': px(token.x), '--y': px(token.y), '--groesse': px(groesse) }}
    >
      <Laufwert
        als="div"
        className={`figur-scheibe relative flex h-full w-full items-center justify-center overflow-hidden rounded-full ${
          aktiv ? 'ring-[3px] ring-gold' : 'ring-2 ring-black/40'
        } ${token.hidden ? 'opacity-55 saturate-50' : ''}`}
        // Mit Bild keine Farbe: Die Scheibe bleibt dann durchsichtig.
        werte={{ '--figur-farbe': token.mediaId ? null : token.color }}
      >
        {token.mediaId ? (
          <img src={mediaApi.url(token.mediaId)} alt="" draggable={false} className="h-full w-full object-cover" />
        ) : (
          <Laufwert
            als="span"
            className="figur-buchstabe font-display font-bold"
            werte={{ '--schrift': px(Math.max(11, groesse * 0.42)) }}
          >
            {(token.name || '?').charAt(0).toUpperCase()}
          </Laufwert>
        )}
      </Laufwert>

      {anteil !== null && (
        <Laufwert
          als="span"
          className="figur-balkenrahmen absolute -bottom-1 left-1/2 flex h-1.5 -translate-x-1/2 overflow-hidden border border-black/50 bg-black/60"
          werte={{ '--breite': px(groesse * 0.86) }}
        >
          <Laufwert
            als="span"
            className={`figur-balken ${anteil > 0.5 ? 'figur-balken-gut' : 'figur-balken-schlecht'}`}
            werte={{ '--anteil': prozent(anteil) }}
          />
        </Laufwert>
      )}

      {token.name && (
        <Laufwert
          als="span"
          className="figur-name pointer-events-none absolute top-full left-1/2 mt-1.5 -translate-x-1/2 whitespace-nowrap bg-black/65 px-1.5 py-0.5 font-display"
          werte={{ '--schrift': px(Math.max(9, Math.min(14, g * 0.17))) }}
        >
          {token.name}
        </Laufwert>
      )}
    </Laufwert>
  );
}

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
    <Laufwert
      als="span"
      className="auswahlring pointer-events-none z-[15] border-2 border-dashed border-gold-soft"
      werte={{ '--x': px(token.x), '--y': px(token.y), '--groesse': px(groesse) }}
    />
  );
}
