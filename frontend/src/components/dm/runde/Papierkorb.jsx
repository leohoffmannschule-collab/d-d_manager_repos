import { useCallback, useEffect, useState } from 'react';
import { useCampaign } from '../../../lib/campaign.jsx';
import { Rubric } from '../../ui.jsx';
import { IconTrash } from '../../icons.jsx';

/**
 * Der Papierkorb: weggeräumte Kampagnen samt Restfrist.
 *
 * Gezeigt werden nur eigene – der Server gibt niemandem den Papierkorb
 * einer fremden Spielleitung heraus. Liegt nichts darin, ist der ganze
 * Abschnitt fort; ein leerer Papierkorb muss nicht erwähnt werden.
 *
 * Zwei Wege hinaus: „Zurückholen“ (ein Klick, die Kampagne ist wieder da)
 * und „endgültig …“, das erst ein Feld aufklappt, in das der Name
 * abgetippt werden muss. Danach ist alles fort, ohne Wiederkehr.
 */
export default function Papierkorb() {
  const { restore, purge, papierkorb } = useCampaign();
  const [korb, setKorb] = useState([]);
  // Je Kampagne der Entwurf der Bestätigung. `undefined` heißt: zugeklappt.
  const [endgueltig, setEndgueltig] = useState({});
  const [fehler, setFehler] = useState('');

  const laden = useCallback(() => {
    papierkorb().then(setKorb).catch(() => {});
  }, [papierkorb]);

  useEffect(() => {
    laden();
  }, [laden]);

  if (korb.length === 0) return null;

  const umschalten = (id) =>
    setEndgueltig((s) => ({ ...s, [id]: s[id] === undefined ? '' : undefined }));

  async function endgueltigLoeschen(e, kampagne) {
    e.preventDefault();
    try {
      await purge(kampagne.id, endgueltig[kampagne.id]);
      setEndgueltig((s) => ({ ...s, [kampagne.id]: undefined }));
      laden();
    } catch (err) {
      setFehler(err.message);
    }
  }

  return (
    <section className="panel p-4">
      <Rubric>Papierkorb</Rubric>
      <ul className="space-y-2">
        {korb.map((k) => (
          <li key={k.id} className="border border-rule bg-panel-soft p-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="min-w-0 flex-1 truncate text-ink">{k.name}</span>
              <span className="shrink-0 text-[15px] text-sepia italic">
                noch {k.tageUebrig} {k.tageUebrig === 1 ? 'Tag' : 'Tage'}
              </span>
              <button
                onClick={async () => {
                  await restore(k.id);
                  laden();
                }}
                className="btn-plate min-h-11 px-3 text-[13px]"
              >
                Zurückholen
              </button>
              <button onClick={() => umschalten(k.id)} className="min-h-11 px-2 text-[13px] text-sepia hover:text-rubric">
                endgültig …
              </button>
            </div>

            {endgueltig[k.id] !== undefined && (
              <form
                onSubmit={(e) => endgueltigLoeschen(e, k)}
                className="mt-2 flex flex-wrap gap-2 border-t border-dashed border-rule pt-2"
              >
                <input
                  value={endgueltig[k.id]}
                  onChange={(e) => setEndgueltig((s) => ({ ...s, [k.id]: e.target.value }))}
                  placeholder={`„${k.name}“ abtippen – danach ist alles fort`}
                  className="field-box min-w-[12rem] flex-1"
                />
                <button
                  type="submit"
                  disabled={endgueltig[k.id]?.trim() !== k.name}
                  className="btn btn-seal disabled:opacity-40"
                >
                  <IconTrash size={16} /> Endgültig löschen
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
      {fehler && <p className="mt-3 text-rubric">{fehler}</p>}
    </section>
  );
}
