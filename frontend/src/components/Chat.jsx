import { useEffect, useRef, useState } from 'react';
import { IconChat, IconClose, IconEyeOff, IconTrash } from './icons.jsx';
import { chatApi } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useChat } from '../lib/daten.jsx';

/**
 * Der Chat am Tisch.
 *
 * Wie der Würfelbeutel: ein runder Knopf unten rechts, dahinter das Fenster.
 * Wer geflüstert hat, sieht das an der Zeile; wer nicht gemeint war, bekommt
 * sie gar nicht erst – das entscheidet der Server.
 */

/** Nur die Uhrzeit; das Datum steht in der Chronik, hier stört es. */
function uhrzeit(iso) {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function Zeile({ zeile, ichBin }) {
  const geflüstert = !!zeile.toUserId;
  const vonMir = zeile.userId === ichBin;

  return (
    <li className={`px-3.5 py-2 ${geflüstert ? 'border-l-[3px] border-rubric bg-rubric/8' : ''}`}>
      <div className="flex items-baseline gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: zeile.color ?? '#a3927a' }} />
        <span className="truncate font-display text-[12px] tracking-[0.08em] text-sepia uppercase">
          {zeile.userName}
        </span>
        {geflüstert && (
          <span className="flex items-center gap-1 text-[11px] text-rubric italic">
            <IconEyeOff size={11} />
            {vonMir ? `an ${zeile.toUserName}` : 'nur an dich'}
          </span>
        )}
        <span className="ml-auto shrink-0 text-[11px] text-faint">{uhrzeit(zeile.createdAt)}</span>
      </div>
      <p className="mt-0.5 leading-relaxed text-ink" style={{ overflowWrap: 'anywhere' }}>
        {zeile.text}
      </p>
    </li>
  );
}

export default function Chat() {
  const { user, isDm } = useAuth();
  const { zeilen, aufnehmen, ungelesen, gelesen, laden } = useChat(100);
  const [offen, setOffen] = useState(false);
  const [text, setText] = useState('');
  const [an, setAn] = useState('');
  const [leute, setLeute] = useState([]);
  const [fehler, setFehler] = useState('');
  const ende = useRef(null);

  // Wer da ist, ändert sich zwischen den Abenden – beim Öffnen frisch holen.
  useEffect(() => {
    if (!offen) return;
    chatApi.wer().then(setLeute).catch(() => setLeute([]));
  }, [offen]);

  // Neueste Zeile ins Bild rücken, sobald etwas hereinkommt.
  useEffect(() => {
    if (offen) ende.current?.scrollIntoView({ block: 'end' });
  }, [offen, zeilen.length]);

  async function senden(e) {
    e.preventDefault();
    const inhalt = text.trim();
    if (!inhalt) return;
    setFehler('');
    setText('');
    try {
      // Sofort eintragen; das eigene Echo erkennt die Datenschicht wieder.
      aufnehmen(await chatApi.send(inhalt, an || null));
    } catch (err) {
      setFehler(err.message);
      setText(inhalt);
    }
  }

  async function leeren() {
    if (!window.confirm('Den ganzen Chat löschen? Das lässt sich nicht rückgängig machen.')) return;
    try {
      await chatApi.clear();
      await laden();
    } catch (err) {
      setFehler(err.message);
    }
  }

  // Jüngste zuletzt: Ein Gespräch liest man von oben nach unten.
  const verlauf = [...zeilen].reverse();

  return (
    <>
      <button
        onClick={() => {
          setOffen(true);
          gelesen();
        }}
        className="fixed right-24 bottom-24 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-panel text-rubric shadow-lg shadow-black/40 ring-2 ring-gold active:scale-95 md:bottom-6"
        aria-label="Chat öffnen"
      >
        <IconChat size={28} />
        {ungelesen > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-rubric px-1 font-display text-[12px] text-[#f0dca8] ring-2 ring-gold">
            {ungelesen > 99 ? '99+' : ungelesen}
          </span>
        )}
      </button>

      {offen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(40,28,14,0.55)] md:items-center"
          onClick={() => setOffen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-md flex-col border-t-2 border-gold bg-panel px-5 pt-5 pb-8 shadow-2xl md:border md:border-rule"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rubric">
                <IconChat size={20} />
                <h2 className="font-display text-[17px] font-semibold tracking-[0.12em] uppercase">Am Tisch</h2>
              </div>
              <div className="flex items-center gap-2">
                {isDm && zeilen.length > 0 && (
                  <button
                    onClick={leeren}
                    className="flex h-11 w-11 items-center justify-center border border-rule text-sepia"
                    aria-label="Chat leeren"
                    title="Chat leeren"
                  >
                    <IconTrash size={16} />
                  </button>
                )}
                <button
                  onClick={() => setOffen(false)}
                  className="flex h-11 w-11 items-center justify-center border border-rule text-sepia"
                  aria-label="Schließen"
                >
                  <IconClose size={16} />
                </button>
              </div>
            </div>

            <ul className="panel mb-3 min-h-[8rem] flex-1 divide-y divide-rule overflow-y-auto p-0">
              {verlauf.length === 0 ? (
                <li className="px-3.5 py-6 text-center text-sepia italic">Noch ist es still am Tisch.</li>
              ) : (
                verlauf.map((z) => <Zeile key={z.id} zeile={z} ichBin={user?.id} />)
              )}
              <li ref={ende} />
            </ul>

            {fehler && <p className="mb-2 text-rubric">{fehler}</p>}

            <form onSubmit={senden} className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <span className="font-display text-[10px] tracking-[0.16em] text-faint uppercase">An</span>
                <select
                  value={an}
                  onChange={(e) => setAn(e.target.value)}
                  className="field-box min-h-11 flex-1 text-[15px]"
                >
                  <option value="">alle am Tisch</option>
                  {leute.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.role === 'sl' ? ' (Spielleitung)' : ''}
                      {p.anwesend ? '' : ' – gerade nicht da'}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={an ? 'Flüstern …' : 'Sagen …'}
                  maxLength={2000}
                  className="field-box min-h-11 flex-1"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="min-h-11 border border-rubric-deep bg-rubric px-4 font-display text-[13px] tracking-[0.08em] text-rubric-ink uppercase disabled:opacity-40"
                >
                  Senden
                </button>
              </div>

              {an && (
                <p className="text-[13px] text-sepia italic">
                  Das liest nur {leute.find((p) => p.id === an)?.name ?? 'diese Person'} – sonst niemand, auch nicht
                  die Spielleitung.
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
