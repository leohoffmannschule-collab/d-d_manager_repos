/**
 * Der Spieler: Spotifys eigenes Fenster, in die Seite eingelassen.
 *
 * Wie es funktioniert – und was es kostet:
 *
 * Spotify erlaubt jedem, eine Wiedergabeliste als kleines Fenster in die
 * eigene Seite zu setzen. Dafür braucht der Almanach *nichts*: keinen
 * Entwicklerschlüssel, keine Freischaltliste, kein Konto, kein Geld. Das ist
 * der Grund, warum es diesen Weg gibt und nicht den großen
 * („Web Playback SDK“), der all das verlangen würde – und obendrein von
 * jedem einzelnen Zuhörer ein Premium-Konto.
 *
 * Der Preis dieses Weges ist ehrlich zu nennen, weil er am Spieltisch
 * auffällt:
 *
 *   – Wer im selben Browser bei Spotify **angemeldet** ist und **Premium**
 *     hat, hört die Stücke ganz.
 *   – Alle anderen hören **30-Sekunden-Ausschnitte**. Für Tavernengemurmel
 *     reicht das nicht, für „hier kommt der Drache“ schon.
 *   – Browser lassen Ton nicht ungefragt los. Deshalb muss jede und jeder am
 *     Tisch **einmal** auf „Mithören“ tippen. Danach folgt das Fenster von
 *     allein, den ganzen Abend.
 *
 * Und das Gleichschalten:
 *
 * Die Spielleitung gibt den Takt vor (`spielt`, `position`, `stand`), der
 * Server schickt ihn über den Live-Kanal an alle. Dieses Bauteil hält
 * daraus einen *Wunsch* fest und zieht den Spieler bei jeder Rückmeldung ein
 * Stück in dessen Richtung. Das ist mit Absicht kein einmaliges Kommando,
 * sondern eine Regelung: Wer zu spät dazukommt, wessen Leitung stockt oder
 * wer kurz stummschaltet, findet von selbst wieder zurück.
 *
 * Eine Grenze bleibt, und sie steht auch in der Oberfläche: Bei einer
 * *Wiedergabeliste* lässt sich von außen nur die Stelle im laufenden Stück
 * setzen, nicht das wievielte Stück. Wer später dazukommt, beginnt deshalb
 * beim ersten. Für einen einzelnen Titel oder ein Album stimmt die Stelle
 * dagegen auf die Sekunde.
 */
import { useEffect, useRef, useState } from 'react';
import { spotifyRahmen, zielstelle } from './spotifyRahmen.js';

/** Ab dieser Abweichung wird nachgezogen – darunter lohnt das Ruckeln nicht. */
const TOLERANZ = 4;

/** Und höchstens so oft, damit sich Sprung und Rückmeldung nicht aufschaukeln. */
const SPRUNGPAUSE = 5000;

export default function Klangspieler({ klang, hoehe = 152, onStand }) {
  const kasten = useRef(null);
  const steuerung = useRef(null);
  const wunsch = useRef({ uri: null, spielt: false });
  const letzterSprung = useRef(0);
  const [fehler, setFehler] = useState('');

  // Den Wunsch bei jeder Änderung frisch hinlegen. Er wird nicht hier
  // ausgeführt, sondern unten bei jeder Rückmeldung des Spielers – siehe
  // Erklärkopf.
  wunsch.current = { uri: klang?.uri ?? null, spielt: !!klang?.spielt, klang };

  useEffect(() => {
    let lebt = true;
    const gebautMit = klang?.uri ?? '';

    spotifyRahmen()
      .then((api) => {
        if (!lebt || !kasten.current) return;
        api.createController(
          kasten.current,
          { uri: gebautMit, width: '100%', height: hoehe },
          (regler) => {
            if (!lebt) {
              regler.destroy();
              return;
            }
            steuerung.current = regler;

            // Das Bauen dauert einen Augenblick. Hat die Spielleitung in
            // diesem Augenblick etwas anderes aufgelegt, ist der Wunsch
            // schon weiter als das, womit der Spieler gebaut wurde.
            if (wunsch.current.uri && wunsch.current.uri !== gebautMit) regler.loadUri(wunsch.current.uri);

            regler.addListener('playback_update', ({ data }) => {
              const stelle = (data?.position ?? 0) / 1000;
              onStand?.({ position: stelle, spielt: !data?.isPaused });
              nachziehen(regler, stelle, !!data?.isPaused);
            });
          }
        );
      })
      .catch((err) => lebt && setFehler(err.message));

    return () => {
      lebt = false;
      steuerung.current?.destroy?.();
      steuerung.current = null;
    };
    // Absichtlich nur einmal: Der Spieler wird gebaut, wenn dieses Bauteil
    // erscheint, und mit ihm wieder abgeräumt. Alles Weitere – anderes
    // Stück, anhalten, springen – läuft über den Wunsch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ein anderes Stück: Das muss sofort geschehen und nicht erst bei der
  // nächsten Rückmeldung – die käme ja noch vom alten.
  useEffect(() => {
    const regler = steuerung.current;
    if (!regler || !klang?.uri) return;
    regler.loadUri(klang.uri);
    letzterSprung.current = 0;
  }, [klang?.uri]);

  /**
   * Einen Schritt in Richtung Wunsch – mehr nicht.
   *
   * Absichtlich zurückhaltend: erst der Laufzustand, dann die Stelle, und
   * die auch nur, wenn sie wirklich auseinanderliegen. Ein Spieler, der bei
   * jeder Rückmeldung springt, klingt wie eine hängende Schallplatte.
   */
  function nachziehen(regler, stelle, pausiert) {
    const { spielt, klang: stand } = wunsch.current;

    if (spielt && pausiert) {
      regler.resume();
      return;
    }
    if (!spielt && !pausiert) {
      regler.pause();
      return;
    }
    if (!spielt) return;

    const ziel = zielstelle(stand);
    if (Math.abs(ziel - stelle) <= TOLERANZ) return;
    if (Date.now() - letzterSprung.current < SPRUNGPAUSE) return;
    letzterSprung.current = Date.now();
    regler.seek(ziel);
  }

  if (fehler) {
    return (
      <p className="px-1 py-2 text-[14px] text-sepia italic">
        {fehler} Der Verweis daneben führt trotzdem zu Spotify.
      </p>
    );
  }

  // Spotify ersetzt diesen Kasten durch sein eigenes Fenster.
  return <div ref={kasten} className="w-full overflow-hidden rounded-[4px]" />;
}
