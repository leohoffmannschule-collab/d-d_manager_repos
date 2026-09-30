/**
 * Ein Kapitel des Abends: Überschrift mit Uhrzeit, darunter die Einträge.
 *
 * Kapitel beginnen an Szenenwechseln (siehe kapitel.js); was davor
 * geschah, steht unter „Zu Beginn“.
 */
import Eintrag from './Eintrag.jsx';
import { uhrzeit } from './kapitel.js';

export default function Kapitel({ kapitel: k, isDm, onLoeschen }) {
  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center gap-2.5">
        <h3 className="font-display text-[14px] tracking-[0.12em] text-rubric uppercase">{k.titel}</h3>
        <span className="h-px flex-1 bg-rule" />
        <span className="font-display text-[12px] text-faint">{uhrzeit(k.zeit)}</span>
      </div>
      <ul>
        {k.eintraege.map((e) => (
          <Eintrag
            key={e.id}
            eintrag={e}
            isDm={isDm}
            onLoeschen={onLoeschen}
          />
        ))}
      </ul>
    </section>
  );
}
