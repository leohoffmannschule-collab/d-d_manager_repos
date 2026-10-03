/**
 * Die Vorschau, wenn mehrere Blattdateien auf einmal eingelesen werden –
 * bevor irgendetwas gespeichert wird.
 *
 * Je Datei eine Zeile: welches Blatt darin steht, was mit ihm geschehen
 * soll, und – aufklappbar – was das Einlesen bemerkt hat und was sich am
 * vorhandenen Blatt ändern würde. Den Vorschlag macht lib/einfuhr/stapel.js;
 * hier lässt er sich je Datei ändern:
 *
 *   „X“ aktualisieren   nur, wenn die Datei zu einem Blatt gehört, das man
 *                       ändern darf
 *   als neues Blatt     immer möglich; die Spielleitung kann es gleich
 *                       hinter den Schirm stellen („als NSC“), einzeln oder
 *                       für alle neuen auf einmal
 *   auslassen           die Datei bleibt draußen
 *
 * „Übernehmen“ speichert der Reihe nach und schreibt zu jeder Zeile, wie es
 * ausging. Was gelang, bleibt gespeichert, auch wenn eine andere Datei
 * scheitert.
 */
import { useState } from 'react';
import Abschnitt from './Abschnitt.jsx';

/** Wie eine Zeile nach dem Übernehmen ausging, in Worten und Farbe. */
const AUSGANG = {
  angelegt: { text: 'angelegt', klasse: 'text-gold' },
  aktualisiert: { text: 'aktualisiert', klasse: 'text-gold' },
  ausgelassen: { text: 'ausgelassen', klasse: 'text-faint' },
  fehler: { text: 'nicht gespeichert', klasse: 'text-rubric' },
};

/** Der Zustand einer Datei in einem Satz – vor dem Übernehmen. */
function lage(p) {
  if (p.fehler) return `Nicht lesbar: ${p.fehler}`;
  if (p.hinweis) return p.hinweis;
  if (p.passend) {
    const n = p.aenderungen.length;
    return `Gehört zu „${p.passend.name}“ – ${n === 1 ? 'eine Änderung' : `${n} Änderungen`}.`;
  }
  return 'Im Almanach gibt es dazu kein Blatt, das du ändern darfst – es wird neu angelegt.';
}

/**
 * Eine Datei im Stapel.
 *
 * @param {object} props
 * @param {object} props.p           der Posten aus lib/einfuhr/stapel.js
 * @param {boolean} props.nscMoeglich  die Spielleitung darf „als NSC“ wählen
 * @param {object|null} props.ausgang  wie das Übernehmen ausging, sonst null
 * @param {boolean} props.gesperrt   während des Übernehmens und danach
 * @param {(aenderung: object) => void} props.onAendern
 */
function Zeile({ p, nscMoeglich, ausgang, gesperrt, onAendern }) {
  const einzelheiten = p.gelesen && (p.gelesen.sichtbar.length || p.gelesen.hinweise.length || p.aenderungen?.length);
  return (
    <li className="border border-rule bg-panel-soft px-3 py-2.5">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <b className="text-ink">{p.gelesen?.name ?? 'Unlesbare Datei'}</b>
        {p.gelesen && <span className="text-sepia">{p.gelesen.system === 'dnd5e' ? 'D&D 5e' : 'freies Blatt'}</span>}
        <span className="min-w-0 truncate text-[13px] text-faint">{p.datei}</span>
        {ausgang && (
          <span className={`ml-auto font-display text-[12px] tracking-[0.12em] uppercase ${AUSGANG[ausgang.status].klasse}`}>
            {AUSGANG[ausgang.status].text}
          </span>
        )}
      </div>
      <p className={`text-[14px] ${p.fehler ? 'text-rubric' : 'text-sepia'}`}>{lage(p)}</p>
      {ausgang?.meldung && <p className="text-[14px] text-rubric">{ausgang.meldung}</p>}

      {p.gelesen && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <select
            value={p.wahl}
            disabled={gesperrt}
            onChange={(e) => onAendern({ wahl: e.target.value })}
            className="field-box w-64 max-w-full"
            aria-label={`Was mit „${p.gelesen.name}“ geschehen soll`}
          >
            {p.passend && <option value="aktualisieren">„{p.passend.name}“ aktualisieren</option>}
            <option value="neu">als neues Blatt anlegen</option>
            <option value="auslassen">auslassen</option>
          </select>
          {nscMoeglich && p.wahl === 'neu' && (
            <label className="flex items-center gap-2 text-[14px] text-sepia">
              <input
                type="checkbox"
                checked={p.npc}
                disabled={gesperrt}
                onChange={(e) => onAendern({ npc: e.target.checked })}
              />
              als NSC
            </label>
          )}
        </div>
      )}

      {einzelheiten ? (
        <details className="mt-1.5">
          <summary className="cursor-pointer text-[14px] text-sepia">Einzelheiten</summary>
          <div className="mt-2">
            <Abschnitt titel="Auf der Seite geändert und übernommen" eintraege={p.gelesen.sichtbar} />
            <Abschnitt titel="Hinweise" eintraege={p.gelesen.hinweise} klasse="text-sepia" />
            {p.passend && <Abschnitt titel={`Was sich an „${p.passend.name}“ ändert`} eintraege={p.aenderungen} />}
          </div>
        </details>
      ) : null}
    </li>
  );
}

/**
 * @param {object} props
 * @param {object[]} props.posten      aus `stapelLesen`
 * @param {boolean} [props.nscMoeglich]  die Spielleitung liest ein
 * @param {(posten: object[], fortschritt: (index: number, ergebnis: object) => void) => Promise<void>} props.onUebernehmen
 * @param {() => void} props.onSchliessen
 */
export default function Sammelvorschau({ posten: anfang, nscMoeglich, onUebernehmen, onSchliessen }) {
  const [posten, setPosten] = useState(anfang);
  const [ausgaenge, setAusgaenge] = useState({});
  const [phase, setPhase] = useState('wahl'); // 'wahl' | 'laeuft' | 'fertig'

  const aendern = (index, aenderung) =>
    setPosten((liste) => liste.map((p, i) => (i === index ? { ...p, ...aenderung } : p)));
  const zuTun = posten.filter((p) => p.wahl !== 'auslassen').length;
  const neue = posten.filter((p) => p.wahl === 'neu');
  const alleNsc = neue.length > 0 && neue.every((p) => p.npc);

  async function uebernehmen() {
    setPhase('laeuft');
    await onUebernehmen(posten, (index, ergebnis) => setAusgaenge((a) => ({ ...a, [index]: ergebnis })));
    setPhase('fertig');
  }

  const gelungen = Object.values(ausgaenge).filter((e) => e.status === 'angelegt' || e.status === 'aktualisiert').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(40,28,14,0.55)] px-4"
      onClick={phase === 'laeuft' ? undefined : onSchliessen}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stapel-titel"
        onClick={(e) => e.stopPropagation()}
        className="panel flex max-h-[88vh] w-full max-w-2xl flex-col p-5"
      >
        <h2 id="stapel-titel" className="mb-1 font-display text-[15px] font-semibold tracking-[0.14em] text-rubric uppercase">
          Blätter aus {posten.length} Dateien
        </h2>
        <p className="mb-3 text-sepia">
          {phase === 'fertig'
            ? `Fertig: ${gelungen === 1 ? 'ein Blatt' : `${gelungen} Blätter`} gespeichert.`
            : 'Prüfe für jede Datei, was mit ihr geschehen soll. Gespeichert wird erst mit „Übernehmen“.'}
        </p>

        {nscMoeglich && neue.length > 1 && phase === 'wahl' && (
          <label className="mb-3 flex items-center gap-2 text-sepia">
            <input
              type="checkbox"
              checked={alleNsc}
              onChange={(e) => setPosten((liste) => liste.map((p) => (p.wahl === 'neu' ? { ...p, npc: e.target.checked } : p)))}
            />
            Alle neuen Blätter hinter den Schirm stellen (als NSC)
          </label>
        )}

        <ul className="-mx-1 mb-4 min-h-0 space-y-2 overflow-y-auto px-1">
          {posten.map((p, i) => (
            <Zeile
              key={`${i}-${p.datei}`}
              p={p}
              nscMoeglich={nscMoeglich}
              ausgang={ausgaenge[i] ?? null}
              gesperrt={phase !== 'wahl'}
              onAendern={(aenderung) => aendern(i, aenderung)}
            />
          ))}
        </ul>

        <div className="flex flex-wrap gap-2.5">
          {phase !== 'fertig' && (
            <button
              type="button"
              disabled={phase === 'laeuft' || zuTun === 0}
              onClick={uebernehmen}
              className="btn btn-seal disabled:opacity-60"
            >
              {phase === 'laeuft' ? 'speichert …' : zuTun === 1 ? 'Ein Blatt übernehmen' : `${zuTun} Blätter übernehmen`}
            </button>
          )}
          <button
            type="button"
            disabled={phase === 'laeuft'}
            onClick={onSchliessen}
            className={`btn ${phase === 'fertig' ? 'btn-seal' : 'btn-plate'} disabled:opacity-60`}
          >
            {phase === 'fertig' ? 'Schließen' : 'Abbrechen'}
          </button>
        </div>
      </div>
    </div>
  );
}
