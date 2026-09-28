import { useState } from 'react';
import { useCampaign } from '../../../lib/campaign.jsx';
import { Rubric } from '../../ui.jsx';
import { IconCheck, IconQuill } from '../../icons.jsx';

/**
 * Die Kampagne umbenennen.
 *
 * Der harmlose der beiden Eingriffe an dieser Stelle – deshalb ohne rote
 * Umrandung und ohne Abtippen zur Bestätigung. Der Name hängt an nichts:
 * Charaktere, Szenen und Beute zeigen auf die Kennung der Kampagne, nie
 * auf ihren Namen. Es gibt also nichts nachzuziehen.
 */
export default function KampagneUmbenennen() {
  const { active, rename } = useCampaign();
  const [entwurf, setEntwurf] = useState('');
  const [gelungen, setGelungen] = useState('');
  const [fehler, setFehler] = useState('');

  if (!active?.darfVerwalten) return null;

  // Zwei Gründe, den Knopf zu sperren – und für jeden ein eigener Satz,
  // damit niemand rätselt, warum sich nichts tut.
  const zuKurz = entwurf.trim().length < 2;
  const schonSo = entwurf.trim() === active.name;

  async function umbenennen(e) {
    e.preventDefault();
    setFehler('');
    setGelungen('');
    try {
      const vorher = active.name;
      await rename(active.id, entwurf);
      setGelungen(`Aus „${vorher}“ wurde „${entwurf.trim()}“.`);
      setEntwurf('');
    } catch (err) {
      setFehler(err.message);
    }
  }

  return (
    <section className="panel p-4">
      <Rubric>Diese Kampagne umbenennen</Rubric>
      <p className="mb-3 text-sepia italic">
        Ändert nur den Namen; alles, was darin liegt, bleibt unberührt. Bei den Mitspielern steht der neue Name,
        sobald sie die Seite das nächste Mal laden.
      </p>

      <form onSubmit={umbenennen} className="flex flex-wrap gap-2">
        <input
          value={entwurf}
          onChange={(e) => setEntwurf(e.target.value)}
          placeholder={active.name}
          maxLength={60}
          className="field-box min-w-[12rem] flex-1"
        />
        <button
          type="submit"
          disabled={zuKurz || schonSo}
          className="btn btn-seal disabled:opacity-40"
          title={zuKurz ? 'Mindestens zwei Zeichen' : schonSo ? 'Das ist schon der Name' : 'Umbenennen'}
        >
          <IconQuill size={16} /> Umbenennen
        </button>
      </form>

      {fehler && <p className="mt-3 text-rubric">{fehler}</p>}
      {gelungen && (
        <p className="mt-3 flex items-center gap-1.5 text-gold">
          <IconCheck size={14} /> {gelungen}
        </p>
      )}
    </section>
  );
}
