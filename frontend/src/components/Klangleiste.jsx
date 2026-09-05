import { useAuth } from '../lib/auth.jsx';
import { useKlang } from '../lib/daten.jsx';
import { ambienceApi } from '../lib/api.js';
import { IconLink, IconNote } from './icons.jsx';

const ART = {
  playlist: 'Wiedergabeliste',
  album: 'Album',
  track: 'Stück',
  artist: 'Künstler',
};

/**
 * Die Klangleiste – für alle am Tisch.
 *
 * Sie zeigt, was die Spielleitung aufgelegt hat, und öffnet es in Spotify.
 * Abgespielt wird dort, nicht hier: Jeder hört auf seinem eigenen Gerät, mit
 * seinem eigenen Konto und seiner eigenen Lautstärke. Das braucht weder
 * Premium noch eine Anmeldung im Almanach.
 *
 * Liegt nichts auf, ist die Leiste nicht da. Sie soll nicht daran erinnern,
 * dass es sie gibt.
 */
export default function Klangleiste() {
  const { isDm } = useAuth();
  const { klang } = useKlang();

  if (!klang?.uri) return null;

  return (
    // Unten links: Der Würfelbeutel sitzt rechts, die Seitenleiste des
    // Spieltisches ebenfalls. Was hier steht, ist eine Randnotiz und soll
    // niemandem die Karte verdecken.
    <div className="fixed bottom-20 left-3 z-30 max-w-[21rem] md:bottom-4 md:left-4">
      <div className="panel flex items-center gap-2.5 px-2.5 py-2 shadow-lg shadow-black/20">
        <IconNote size={16} className="shrink-0 text-gold" />

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[14px] text-ink" title={klang.name}>
            {klang.name}
          </p>
          <p className="truncate text-[13px] text-faint" title={klang.notes || undefined}>
            {klang.notes || ART[klang.kind] || 'Ambiente'}
          </p>
        </div>

        <a
          href={klang.webUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="In Spotify öffnen und anhören"
          className="flex h-10 w-10 shrink-0 items-center justify-center border border-rule text-sepia hover:border-gold hover:text-ink"
          aria-label="In Spotify öffnen"
        >
          <IconLink size={16} />
        </a>

        {isDm && (
          <button
            onClick={() => ambienceApi.stille()}
            className="shrink-0 px-1 font-display text-[10px] tracking-[0.10em] text-faint uppercase hover:text-rubric"
            title="Nichts mehr aufliegen lassen"
          >
            Stille
          </button>
        )}
      </div>
    </div>
  );
}
