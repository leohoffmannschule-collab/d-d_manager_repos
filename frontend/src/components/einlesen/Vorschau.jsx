/**
 * Die Vorschau beim Einlesen einer Blattdatei – bevor irgendetwas
 * gespeichert wird.
 *
 * Sie zeigt, was in der Datei steht und was das Einlesen daraus gemacht
 * hat: welche Werte nur auf der sichtbaren Seite geändert waren (und
 * übernommen wurden), was repariert oder angeglichen wurde – und, wenn es
 * das Blatt im Almanach schon gibt, was sich daran ändern würde. Wer einer
 * KI eine Aufgabe gegeben hat, sieht hier, ob sie getan hat, was sie sollte.
 *
 * Zwei Wege hinaus:
 *   – „… aktualisieren“: Das vorhandene Blatt bekommt den Stand der Datei.
 *     Angeboten nur, wenn es eines gibt, das man ändern darf, und das
 *     Regelwerk passt.
 *   – „Als neues Blatt anlegen“: Das vorhandene bleibt, wie es ist. Das ist
 *     immer möglich, und wer unsicher ist, nimmt diesen Weg. Die
 *     Spielleitung kann das neue Blatt dabei gleich hinter den Schirm
 *     stellen („als NSC“).
 *
 * Für mehrere Dateien auf einmal gibt es die Sammelvorschau
 * (Sammelvorschau.jsx).
 */
import { useState } from 'react';
import Abschnitt from './Abschnitt.jsx';

/**
 * @param {object} props
 * @param {object} props.gelesen     was leseBlattdatei geliefert hat
 * @param {object|null} props.passend  das vorhandene Blatt, das aktualisiert werden kann
 * @param {string[]|null} props.aenderungen  Unterschiede zum vorhandenen Blatt
 * @param {boolean} props.fremd      die Datei stammt von einem anderen Blatt als dem geöffneten
 * @param {boolean} [props.nscMoeglich]  ein neues Blatt darf als NSC angelegt werden (Spielleitung)
 * @param {(wie: { npc: boolean }) => Promise<void>} props.onNeu
 * @param {() => Promise<void>} props.onAktualisieren
 * @param {() => void} props.onAbbrechen
 */
export default function Vorschau({ gelesen, passend, aenderungen, fremd, nscMoeglich, onNeu, onAktualisieren, onAbbrechen }) {
  const [laeuft, setLaeuft] = useState(false);
  const [alsNsc, setAlsNsc] = useState(false);
  const [fehler, setFehler] = useState('');
  const stand = gelesen.stand ? new Date(gelesen.stand).toLocaleString('de-DE') : null;

  async function tun(handlung) {
    setLaeuft(true);
    setFehler('');
    try {
      await handlung();
    } catch (err) {
      setFehler(err.message);
      setLaeuft(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(40,28,14,0.55)] px-4" onClick={onAbbrechen}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="einlesen-titel"
        onClick={(e) => e.stopPropagation()}
        className="panel flex max-h-[88vh] w-full max-w-xl flex-col p-5"
      >
        <h2 id="einlesen-titel" className="mb-1 font-display text-[15px] font-semibold tracking-[0.14em] text-rubric uppercase">
          Blatt aus Datei
        </h2>
        <p className="mb-4 text-sepia">
          <b className="text-ink">{gelesen.name}</b> · {gelesen.system === 'dnd5e' ? 'D&D 5e' : 'freies Blatt'}
          {stand && <> · ausgeführt am {stand}</>}
        </p>

        <div className="-mx-1 mb-4 min-h-0 overflow-y-auto px-1">
          <Abschnitt titel="Auf der Seite geändert und übernommen" eintraege={gelesen.sichtbar} />
          <Abschnitt titel="Hinweise" eintraege={gelesen.hinweise} klasse="text-sepia" />
          {fremd && (
            <p className="mb-4 text-rubric">
              Diese Datei wurde von einem anderen Blatt ausgeführt. Aktualisieren überschreibt „{passend?.name}“ mit ihrem
              Inhalt.
            </p>
          )}
          {passend && aenderungen && (
            <Abschnitt titel={`Was sich an „${passend.name}“ ändert`} eintraege={aenderungen} />
          )}
          {passend && aenderungen?.length === 0 && (
            <p className="mb-4 text-sepia italic">Nichts – die Datei hat denselben Stand wie das Blatt im Almanach.</p>
          )}
          {!passend && (
            <p className="mb-4 text-sepia italic">
              Im Almanach gibt es kein Blatt, das diese Datei aktualisieren könnte (oder du darfst es nicht ändern). Sie wird
              als neues Blatt angelegt.
            </p>
          )}
        </div>

        {nscMoeglich && (
          <label className="mb-3 flex items-center gap-2 text-sepia">
            <input type="checkbox" checked={alsNsc} onChange={(e) => setAlsNsc(e.target.checked)} />
            Ein neues Blatt hinter den Schirm stellen (als NSC)
          </label>
        )}
        {fehler && <p className="mb-3 text-rubric">{fehler}</p>}
        <div className="flex flex-wrap gap-2.5">
          {passend && (
            <button type="button" disabled={laeuft} onClick={() => tun(onAktualisieren)} className="btn btn-seal disabled:opacity-60">
              „{passend.name}“ aktualisieren
            </button>
          )}
          <button
            type="button"
            disabled={laeuft}
            onClick={() => tun(() => onNeu({ npc: alsNsc }))}
            className={`btn ${passend ? 'btn-plate' : 'btn-seal'} disabled:opacity-60`}
          >
            Als neues Blatt anlegen
          </button>
          <button type="button" disabled={laeuft} onClick={onAbbrechen} className="btn btn-plate disabled:opacity-60">
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
