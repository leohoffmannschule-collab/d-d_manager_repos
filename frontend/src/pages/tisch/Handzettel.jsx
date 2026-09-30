/**
 * Die ausgeteilten Handzettel in der Seitenleiste – für alle am Tisch.
 *
 * Nur die ausgeteilten: Was die Spielleitung noch hinter dem Schirm hält,
 * schickt der Server einem Spielerfenster gar nicht erst (siehe
 * lib/daten.js, useNotizen).
 */
import { useNotizen } from '../../lib/daten.js';

export default function Handzettel() {
  const { handzettel } = useNotizen();

  if (handzettel.length === 0) {
    return <p className="text-sepia italic">Noch hat die Spielleitung nichts ausgeteilt.</p>;
  }

  return (
    <ul className="space-y-3">
      {handzettel.map((n) => (
        <li key={n.id} className="border border-rule bg-panel-soft p-3">
          <h3 className="font-display text-[15px] font-semibold text-ink">{n.title}</h3>
          {n.tags.length > 0 && (
            <p className="mt-0.5 flex flex-wrap gap-1">
              {n.tags.map((t) => (
                <span key={t} className="border border-rule px-1.5 text-[13px] text-faint">
                  {t}
                </span>
              ))}
            </p>
          )}
          <p className="mt-1.5 whitespace-pre-wrap text-sepia">{n.content}</p>
        </li>
      ))}
    </ul>
  );
}