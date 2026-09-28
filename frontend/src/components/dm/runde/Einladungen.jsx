import { useState } from 'react';
import { authApi } from '../../../lib/api.js';
import { useEinladungen } from '../../../lib/daten.jsx';
import { Rubric } from '../../ui.jsx';
import { IconCheck, IconKey, IconLink, IconPlus, IconTrash } from '../../icons.jsx';

export default /**
 * Einladungscodes: erzeugen, kopieren, zurückziehen.
 *
 * Jeder Code gilt für genau ein Konto und verfällt mit dem Einlösen. Das
 * ist die einzige Tür in den Almanach hinein – ohne Code kein Konto.
 */
function Einladungen() {
  const { einladungen, offene, laden } = useEinladungen();
  const [notiz, setNotiz] = useState('');
  const [kopiert, setKopiert] = useState(null);

  async function kopieren(code) {
    // Die Zwischenablage gibt es nur in „sicherem“ Kontext; über den Tunnel
    // ist das gegeben, im Heimnetz per http:// nicht immer.
    try {
      await navigator.clipboard.writeText(code);
      setKopiert(code);
      setTimeout(() => setKopiert(null), 1500);
    } catch {
      setKopiert(null);
    }
  }

  return (
    <section className="panel p-4">
      <Rubric>Einladungen</Rubric>
      <p className="mb-3 text-sepia italic">
        Wer dem Almanach beitreten soll, braucht einen Code. Jeder Code gilt für genau ein Konto.
      </p>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await authApi.createInvite(notiz);
          setNotiz('');
          laden();
        }}
        className="mb-4 flex flex-wrap gap-2.5"
      >
        <input
          value={notiz}
          onChange={(e) => setNotiz(e.target.value)}
          placeholder="Für wen? (nur als Merkhilfe)"
          className="field-box min-w-[10rem] flex-1"
        />
        <button type="submit" className="btn btn-seal">
          <IconPlus size={16} /> Code erzeugen
        </button>
      </form>

      {offene.length === 0 ? (
        <p className="text-sepia italic">Kein offener Code.</p>
      ) : (
        <ul className="space-y-1.5">
          {offene.map((e) => (
            <li key={e.code} className="flex flex-wrap items-center gap-3 border border-rule bg-panel-soft px-3 py-2">
              <button
                onClick={() => kopieren(e.code)}
                className="flex items-center gap-2 font-display text-[17px] tracking-[0.14em] text-ink"
                title="in die Zwischenablage legen"
              >
                {kopiert === e.code ? <IconCheck size={16} className="text-gold" /> : <IconLink size={16} className="text-faint" />}
                {e.code}
              </button>
              {e.note && <span className="text-sepia italic">{e.note}</span>}
              <span className="flex-1" />
              <button
                onClick={async () => {
                  await authApi.removeInvite(e.code);
                  laden();
                }}
                className="flex h-11 w-11 items-center justify-center text-sepia hover:text-rubric"
                aria-label="Code zurückziehen"
              >
                <IconTrash size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {einladungen.some((e) => e.used_at) && (
        <p className="mt-3 text-[15px] text-faint">
          Eingelöst:{' '}
          {einladungen
            .filter((e) => e.used_at)
            .map((e) => e.used_by_name)
            .join(', ')}
        </p>
      )}
    </section>
  );
}
