/**
 * Hilfe: Musik am Tisch – was der Klangteppich tut und was nicht.
 */
import { Card } from '../../components/ui.jsx';

export default function Musik() {
  return (
    <Card title="Musik am Tisch">
      <p className="leading-relaxed text-ink">
        Legt die Spielleitung eine Ambiente auf, erscheint unten die{' '}
        <span className="font-display">Klangleiste</span> mit dem Namen und einem Knopf{' '}
        <span className="font-display">In Spotify öffnen</span>. Der Almanach spielt nichts ab – er sagt nur,
        was dran ist. Du hörst es in deinem eigenen Spotify, auf deinem eigenen Gerät und so laut, wie du
        magst. Das geht mit jedem Spotify-Konto, auch ohne Premium, und wer nicht mithören will, klickt
        einfach nicht.
      </p>
    </Card>
  );
}
