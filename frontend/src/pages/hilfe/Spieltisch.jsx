/**
 * Hilfe: der Spieltisch – Karte, Figuren, Nebel, Messen und Zeigen aus der
 * Sicht der Runde.
 */
import { Card } from '../../components/ui.jsx';

export default function Spieltisch() {
  return (
    <Card title="Der Spieltisch">
      <ul className="flex list-disc flex-col gap-1.5 pl-5 leading-relaxed text-ink marker:text-rubric">
        <li>
          Mit einem Finger oder der gedrückten Maustaste wird die Karte geschoben, mit dem Mausrad oder
          zwei Fingern gezoomt. Auch eine Karte über zweihundert Meter lässt sich so ganz herauszoomen –
          dann verschwinden die Rasterlinien, weil sie bei der Größe nur noch ein Grauschleier wären.
        </li>
        <li>Die eigene Figur lässt sich ziehen; beim Loslassen schnappt sie auf das Raster ein. Fremde Figuren bewegt nur die Spielleitung.</li>
        <li>
          Über der Karte liegt deine Werkzeugleiste: <span className="font-display">Bewegen</span>,{' '}
          <span className="font-display">Messen</span> und <span className="font-display">Zeigen</span>. Mit Messen
          ziehst du ein Lineal, das die Entfernung in Feldern und in Fuß oder Metern zeigt – nur bei dir, und auch
          über dunklem Gelände. Mit Zeigen tippst du eine Stelle an, und sie leuchtet bei allen kurz auf, mit
          deinem Namen. Am Rechner geht Zeigen auch mit <span className="font-display">Alt+Klick</span>. Zum
          Figurenziehen zurück auf Bewegen.
        </li>
        <li>Jede Bewegung, jeder Wurf und jede Änderung der Trefferpunkte steht sofort bei allen anderen auf dem Schirm.</li>
        <li>
          Trägst du unter <span className="font-display">Kampf → Widerstand und Sinne</span> eine{' '}
          <span className="font-display">Sichtweite</span> ein, bekommst du einen offenen Bereich um deine
          Figur – so weit, wie dein Blick reicht. Er hängt an ihr und bewegt sich nur, wenn sie sich bewegt.
          Wo du schon warst, bleibt gedämpft sichtbar; wer dort gerade steht, siehst du nicht mehr. Ohne
          Eintrag siehst du wie bisher alles Aufgedeckte.
        </li>
        <li>
          Ist die Szene <span className="font-display">dunkel</span>, reicht dein Blick so weit, wie deine
          Sichtweite <span className="font-display">oder deine eigene Lichtquelle</span> trägt – was von
          beidem weiter ist. Eine Fackel erweitert dein Sichtfeld also wirklich. Innerhalb davon siehst du,
          was beleuchtet ist und was deine Dunkelsicht erfasst; fremdes Licht hilft dir nur so weit, wie
          dein eigener Blick ohnehin hinreicht.
        </li>
      </ul>
    </Card>
  );
}
