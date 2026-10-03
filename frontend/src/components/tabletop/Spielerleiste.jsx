/**
 * Die Werkzeugleiste über dem Spieltisch für die Runde: Bewegen, Messen,
 * Zeigen.
 *
 * Die Spielleitung hat ihre eigene, größere Leiste (SceneBar.jsx). Die
 * Runde bekommt daraus, was niemandem etwas wegnimmt (siehe
 * leiste/werkzeugliste.js, `fuerAlle`):
 *
 *   Bewegen  die eigene Figur ziehen, die Karte schieben – wie bisher
 *   Messen   ziehen, und das Lineal zeigt die Entfernung; es steht nur im
 *            eigenen Fenster und verschwindet beim Loslassen
 *   Zeigen   antippen, und die Stelle leuchtet bei allen kurz auf – mit der
 *            eigenen Farbe und dem eigenen Namen
 *
 * Unter den Knöpfen steht, was das gewählte Werkzeug tut. Am Telefon gibt
 * es kein Überfahren mit der Maus, das einen `title` zeigte – und kein
 * Alt+Klick, mit dem man am Rechner schon immer zeigen konnte.
 */
import Knopf from './leiste/Knopf.jsx';
import { WERKZEUGE_FUER_ALLE } from './leiste/werkzeugliste.js';

/**
 * @param {object} props
 * @param {string} props.mode     das gewählte Werkzeug (pages/Tabletop.jsx hält es)
 * @param {(id: string) => void} props.onMode
 */
export default function Spielerleiste({ mode, onMode }) {
  const gewaehlt = WERKZEUGE_FUER_ALLE.find((w) => w.id === mode) ?? WERKZEUGE_FUER_ALLE[0];
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-rule bg-panel-soft px-3 py-2">
      {WERKZEUGE_FUER_ALLE.map(({ id, label, Icon, hinweis }) => (
        <Knopf
          key={id}
          aktiv={gewaehlt.id === id}
          aria-pressed={gewaehlt.id === id}
          onClick={() => onMode(id)}
          title={hinweis}
        >
          <Icon size={14} /> {label}
        </Knopf>
      ))}
      <span className="ml-1 min-w-0 flex-1 basis-48 text-[13px] text-faint italic">{gewaehlt.hinweis}</span>
    </div>
  );
}
