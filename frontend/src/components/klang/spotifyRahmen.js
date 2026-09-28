/**
 * Spotifys Einbettungsspieler herholen – einmal für das ganze Fenster.
 *
 * Spotify liefert dafür ein kleines Skript aus, das sich auf eine sehr alte
 * Art meldet: Es ruft, wenn es fertig ist, eine Funktion namens
 * `window.onSpotifyIframeApiReady` auf. Das ist kein Versprechen (`Promise`)
 * und kein Ereignis, sondern genau *eine* Stelle im Fenster – wer sie
 * zweimal besetzt, überschreibt die erste.
 *
 * Deshalb steht das Anfordern hier und nur hier: Diese Datei baut aus dem
 * Rückruf ein Versprechen, merkt es sich und gibt bei jedem weiteren Aufruf
 * dasselbe zurück. Zwei Klangleisten im selben Fenster – etwa die Leiste
 * unten und die aufgeklappte Tafel – teilen sich so ein Skript.
 *
 * Das Skript kommt von `open.spotify.com`. Es ist das einzige Fremdskript im
 * ganzen Almanach, und es wird erst geholt, wenn wirklich jemand etwas
 * auflegt – wer ohne Musik spielt, lädt es nie.
 */

const QUELLE = 'https://open.spotify.com/embed/iframe-api/v1';

let versprechen = null;

export function spotifyRahmen() {
  if (versprechen) return versprechen;

  versprechen = new Promise((erfuellen, verwerfen) => {
    // Im Serverlauf (Tests, Vorrendern) gibt es kein Fenster.
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      verwerfen(new Error('Kein Fenster – hier läuft kein Spieler.'));
      return;
    }

    // Ist das Skript schon da (etwa nach einem schnellen Wechsel hin und
    // zurück), meldet es sich nicht noch einmal. Dann liegt die fertige
    // Schnittstelle aber bereits im Fenster.
    if (window.Spotify?.createController) {
      erfuellen(window.Spotify);
      return;
    }

    window.onSpotifyIframeApiReady = (api) => erfuellen(api);

    const vorhanden = document.querySelector(`script[src="${QUELLE}"]`);
    if (vorhanden) return;

    const skript = document.createElement('script');
    skript.src = QUELLE;
    skript.async = true;
    skript.onerror = () => {
      // Damit ein späterer Versuch es noch einmal probieren darf.
      versprechen = null;
      verwerfen(new Error('Spotify ist gerade nicht erreichbar.'));
    };
    document.head.appendChild(skript);
  });

  return versprechen;
}

/**
 * Wo müsste dieses Fenster gerade stehen?
 *
 * Der Server sagt: „Bei Sekunde `position`, gemessen um `stand`, und es
 * läuft.“ Daraus rechnet jedes Fenster selbst – ohne dass der Server
 * irgendetwas nachschicken müsste.
 *
 * Läuft es nicht, steht die Zeit; dann gilt `position` unverändert.
 */
export function zielstelle(klang, jetzt = Date.now()) {
  const position = Number(klang?.position) || 0;
  if (!klang?.spielt || !klang?.stand) return position;
  const vergangen = (jetzt - new Date(klang.stand).getTime()) / 1000;
  return Math.max(0, position + (Number.isFinite(vergangen) ? vergangen : 0));
}
