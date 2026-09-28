/**
 * Die Klangleiste – für alle am Tisch.
 *
 * Sie zeigt, was die Spielleitung aufgelegt hat, und spielt es ab: unten
 * links, klein, und aufklappbar zu Spotifys eigenem Fenster mit Titelbild,
 * Fortschritt und Lautstärke.
 *
 * Drei Dinge sind hier bewusst entschieden:
 *
 * 1. *Mithören ist freiwillig, und zwar für jede und jeden einzeln.* Wer am
 *    selben Tisch sitzt wie die Spielleitung, hört die Musik schon aus deren
 *    Lautsprecher und will sie nicht doppelt. Wer zu Hause sitzt, tippt
 *    einmal auf „Mithören“. Die Wahl merkt sich der Browser – nicht der
 *    Server, denn sie geht niemanden sonst etwas an.
 *
 * 2. *Einmal tippen muss sein.* Kein Browser lässt eine Seite ungefragt Ton
 *    machen. Das ist keine Lücke im Almanach, sondern eine Regel des
 *    Browsers, und eine gute.
 *
 * 3. *Den Takt gibt die Spielleitung.* Anhalten, weiterlaufen, und
 *    „gleichziehen“, wenn die Runde auseinandergelaufen ist. Alles andere –
 *    Lautstärke, stumm, das eigene Ohr – bleibt bei jedem selbst.
 *
 * Liegt nichts auf, ist die Leiste nicht da. Sie soll nicht daran erinnern,
 * dass es sie gibt.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../lib/auth.jsx';
import { useKlang } from '../../lib/daten.js';
import { ambienceApi } from '../../lib/api.js';
import { IconChevronRight, IconLink, IconNote, IconPause, IconPlay, IconSpeaker, IconSync } from '../icons.jsx';
import Klangspieler from './Klangspieler.jsx';

const ART = {
  playlist: 'Wiedergabeliste',
  album: 'Album',
  track: 'Stück',
  artist: 'Künstler',
};

const SCHLUESSEL = 'almanach:mithoeren';

/** Die eigene Wahl aus dem Browser holen. Geht das schief, hört man eben nicht mit. */
function gemerktesMithoeren() {
  try {
    return localStorage.getItem(SCHLUESSEL) === 'ja';
  } catch {
    return false;
  }
}

export default function Klangleiste() {
  const { isDm } = useAuth();
  const { klang } = useKlang();
  const [mithoeren, setMithoeren] = useState(gemerktesMithoeren);
  const [offen, setOffen] = useState(false);

  // Wo der eigene Spieler gerade steht. Die Spielleitung schickt das beim
  // Anhalten und beim Gleichziehen zum Server – daran hängen alle anderen.
  //
  // Bewusst ein Merkzettel (`useRef`) und kein Zustand: Der Spieler meldet
  // sich jede Sekunde. Als Zustand würde die halbe Leiste sekündlich neu
  // gezeichnet, und niemand sähe einen Unterschied – gebraucht wird die Zahl
  // nur in dem Augenblick, in dem jemand einen der drei Knöpfe drückt.
  const stand = useRef({ position: 0, spielt: false });
  const merken = useCallback((neu) => {
    stand.current = neu;
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SCHLUESSEL, mithoeren ? 'ja' : 'nein');
    } catch {
      // Ein Browser ohne Speicher ist kein Grund, die Musik zu verweigern.
    }
  }, [mithoeren]);

  if (!klang?.uri) return null;

  const takt = (spielt) =>
    ambienceApi.steuerung({ spielt, position: stand.current.position }).catch(() => {});

  return (
    // Unten links: Der Würfelbeutel sitzt rechts, die Seitenleiste des
    // Spieltisches ebenfalls. Was hier steht, ist eine Randnotiz und soll
    // niemandem die Karte verdecken.
    <div className="fixed bottom-20 left-3 z-30 w-[min(22rem,calc(100vw-1.5rem))] md:bottom-4 md:left-4">
      <div className="panel shadow-lg shadow-black/20">
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <IconNote size={16} className={`shrink-0 ${klang.spielt ? 'text-gold' : 'text-faint'}`} />

          <button
            onClick={() => setOffen((o) => !o)}
            className="min-w-0 flex-1 text-left"
            title={offen ? 'Zuklappen' : 'Aufklappen'}
          >
            <p className="truncate font-display text-[14px] text-ink">{klang.name}</p>
            <p className="truncate text-[13px] text-faint">
              {klang.notes || ART[klang.kind] || 'Ambiente'}
              {!klang.spielt && ' · angehalten'}
            </p>
          </button>

          <button
            onClick={() => {
              setMithoeren((m) => !m);
              setOffen(true);
            }}
            title={
              mithoeren
                ? 'Nicht mehr über dieses Gerät mithören'
                : 'Über dieses Gerät mithören – einmal tippen genügt'
            }
            aria-label={mithoeren ? 'Mithören beenden' : 'Mithören'}
            className={`flex h-10 w-10 shrink-0 items-center justify-center border ${
              mithoeren ? 'border-gold bg-gold/20 text-ink' : 'border-rule text-sepia hover:text-ink'
            }`}
          >
            <IconSpeaker size={16} />
          </button>

          <a
            href={klang.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="In Spotify öffnen – dort läuft es ganz, auch ohne Premium im Browser"
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-rule text-sepia hover:border-gold hover:text-ink"
            aria-label="In Spotify öffnen"
          >
            <IconLink size={16} />
          </a>

          <IconChevronRight
            size={14}
            className={`shrink-0 text-faint transition-transform ${offen ? '-rotate-90' : 'rotate-90'}`}
          />
        </div>

        {mithoeren && (
          <div className={offen ? 'px-2.5 pb-2.5' : 'h-0 overflow-hidden'}>
            <Klangspieler klang={klang} hoehe={offen ? 152 : 80} onStand={merken} />
          </div>
        )}

        {offen && !mithoeren && (
          <p className="px-3 pb-2.5 text-[13px] text-sepia italic">
            Tipp auf den Lautsprecher, um über dieses Gerät mitzuhören. Ohne angemeldetes Spotify-Premium im
            selben Browser gibt es 30-Sekunden-Ausschnitte; der Verweis daneben öffnet das Stück ganz.
          </p>
        )}

        {offen && isDm && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-dashed border-rule px-2.5 py-2">
            <button
              onClick={() => takt(!klang.spielt)}
              className="btn-plate flex min-h-9 items-center gap-1.5 px-2.5 text-[12px]"
              title={klang.spielt ? 'Für alle anhalten' : 'Für alle weiterlaufen lassen'}
            >
              {klang.spielt ? <IconPause size={13} /> : <IconPlay size={13} />}
              {klang.spielt ? 'Anhalten' : 'Weiter'}
            </button>
            <button
              onClick={() => takt(true)}
              className="btn-plate flex min-h-9 items-center gap-1.5 px-2.5 text-[12px]"
              title="Alle auf deine Stelle ziehen"
            >
              <IconSync size={13} /> Gleichziehen
            </button>
            <span className="flex-1" />
            <button
              onClick={() => ambienceApi.stille()}
              className="px-1 font-display text-[10px] tracking-[0.10em] text-faint uppercase hover:text-rubric"
              title="Nichts mehr aufliegen lassen"
            >
              Stille
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
