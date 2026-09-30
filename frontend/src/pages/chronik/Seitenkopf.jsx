/**
 * Der Kopf der Chronik: Überschrift – und für die Spielleitung der Knopf,
 * der eine Sitzung beginnt oder die laufende schließt.
 *
 * Es gibt immer höchstens eine offene Sitzung (`offene`); solange sie
 * läuft, landet alles, was am Tisch geschieht, in ihr.
 */
import { IconBook, IconPlus } from '../../components/icons.jsx';

export default function Seitenkopf({ isDm, offene, onSchliessen, onBeginnen }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold tracking-[0.08em] text-ink uppercase sm:text-[27px]">
          <IconBook size={26} className="text-gold" />
          Chronik
        </h1>
        <p className="mt-1 text-sepia italic">
          Was am Tisch geschieht, schreibt der Almanach von selbst mit – Würfe, Wunden, Auftritte und Wege.
        </p>
      </div>

      {isDm && (
        <div className="flex flex-wrap gap-2">
          {offene ? (
            <button
              onClick={onSchliessen}
              className="btn btn-plate"
            >
              Sitzung schließen
            </button>
          ) : (
            <button
              onClick={onBeginnen}
              className="btn btn-seal"
            >
              <IconPlus size={16} /> Sitzung beginnen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
