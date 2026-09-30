/**
 * Was der Tisch zeigt, wenn keine Karte darauf liegt: entweder den
 * geschlossenen Vorhang oder die Bitte, eine Karte aufzulegen – jeweils in
 * zwei Fassungen, für die Spielleitung und für die Runde.
 *
 * Der Satz für die Runde verrät beim Vorhang absichtlich nichts über das,
 * was dahinter aufgebaut wird.
 */
import { IconFog, IconMap } from '../../components/icons.jsx';

export default function LeererTisch({ vorhang, isDm }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[var(--tisch-grund)] px-6 text-center">
      {vorhang ? (
        <>
          <IconFog size={36} className="tisch-hinweis-zeichen" />
          <p className="tisch-hinweis-titel font-display text-[15px] tracking-[0.14em] uppercase">
            Der Vorhang ist zu
          </p>
          <p className="max-w-sm text-[var(--tisch-schrift-matt)] italic">
            {isDm
              ? 'Die Runde sieht gerade nichts vom Tisch. Leg in Ruhe auf, stell die Gegner, mal den Nebel – und öffne oben, wenn du so weit bist.'
              : 'Die Spielleitung baut auf. Gleich geht es weiter – Kampf, Beute und Handzettel stehen rechts schon bereit.'}
          </p>
        </>
      ) : (
        <>
          <IconMap size={34} className="tisch-hinweis-karte" />
          <p className="max-w-sm text-[var(--tisch-schrift-matt)] italic">
            {isDm
              ? 'Noch liegt keine Karte auf dem Tisch. Lade eine hoch – bis dahin lässt sich rechts trotzdem kämpfen, teilen und lesen.'
              : 'Die Spielleitung hat noch keine Karte aufgelegt. Kampf, Beute und Handzettel stehen rechts trotzdem bereit.'}
          </p>
        </>
      )}
    </div>
  );
}
