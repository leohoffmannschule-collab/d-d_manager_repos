import { useState } from 'react';
import { useCampaign } from '../../../lib/campaign.jsx';
import { Rubric } from '../../ui.jsx';
import { IconTrash } from '../../icons.jsx';

/**
 * Die Kampagne wegräumen.
 *
 * Nichts davon geht mit einem Klick: Der Name muss abgetippt werden, und
 * selbst dann liegt die Kampagne erst einmal nur im Papierkorb. Wer sich
 * vergreift, holt sie mit einem Klick zurück und hat nichts verloren.
 *
 * Was hier gelöscht wird, sind Monate an Spielabenden – deshalb die rote
 * Umrandung, deshalb das Abtippen.
 */
export default function KampagneLoeschen() {
  const { active, remove } = useCampaign();
  const [bestaetigung, setBestaetigung] = useState('');
  const [fehler, setFehler] = useState('');

  if (!active?.darfVerwalten) return null;

  const stimmt = bestaetigung.trim() === active.name;

  async function loeschen(e) {
    e.preventDefault();
    setFehler('');
    try {
      // Danach ist diese Ansicht fort: Ohne aktive Kampagne landet man in
      // der Auswahl. Hier also nichts mehr setzen.
      await remove(active.id, bestaetigung);
    } catch (err) {
      setFehler(err.message);
    }
  }

  return (
    <section className="panel border-rubric/40 p-4">
      <Rubric>Diese Kampagne löschen</Rubric>
      <p className="mb-3 text-sepia italic">
        „{active.name}“ verschwindet aus allen Listen. Charaktere, Chronik, Szenen und Beute bleiben 30 Tage im
        Papierkorb liegen und lassen sich zurückholen – erst danach ist es endgültig. Die Kartenbibliothek gehört
        der ganzen Runde und bleibt in jedem Fall erhalten.
      </p>

      <form onSubmit={loeschen} className="flex flex-wrap gap-2">
        <input
          value={bestaetigung}
          onChange={(e) => setBestaetigung(e.target.value)}
          placeholder={`Zum Bestätigen „${active.name}“ abtippen`}
          className="field-box min-w-[12rem] flex-1"
        />
        <button
          type="submit"
          disabled={!stimmt}
          className="btn btn-seal disabled:opacity-40"
          title={stimmt ? 'In den Papierkorb legen' : 'Der Name stimmt noch nicht'}
        >
          <IconTrash size={16} /> In den Papierkorb
        </button>
      </form>

      {fehler && <p className="mt-3 text-rubric">{fehler}</p>}
    </section>
  );
}
