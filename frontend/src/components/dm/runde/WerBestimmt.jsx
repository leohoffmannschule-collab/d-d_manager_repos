import { useAuth } from '../../../lib/auth.jsx';
import { useCampaign } from '../../../lib/campaign.jsx';
import { Rubric } from '../../ui.jsx';

/**
 * Der Hinweis für alle, die über diese Kampagne *nicht* bestimmen.
 *
 * Ohne ihn stünde an dieser Stelle einfach nichts, und eine zweite
 * Spielleitung suchte den Umbenennen- und den Löschen-Kasten vergebens.
 * Ein leerer Fleck ist schlimmer als eine Absage, die sagt, woran es liegt.
 */
export default function WerBestimmt() {
  const { isDm } = useAuth();
  const { active } = useCampaign();

  if (!isDm || !active || active.darfVerwalten) return null;

  return (
    <section className="panel p-4">
      <Rubric>Diese Kampagne</Rubric>
      <p className="text-sepia italic">
        Über „{active.name}“ bestimmt nur {active.angelegtVon ?? 'die Spielleitung'} – wer eine Kampagne anlegt,
        entscheidet auch über ihren Namen und ihr Ende.
      </p>
    </section>
  );
}
