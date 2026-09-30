/**
 * Die Kopfzeilen, die jede Antwort des Almanachs trägt – die zweite Mauer.
 *
 * Die erste Mauer ist, dass der Almanach nichts Fremdes als Code ausführt:
 * React setzt Texte als Texte, erzeugtes HTML ist entschärft, und was die
 * Runde nicht sehen soll, wird ihr gar nicht erst geschickt. Die Kopfzeilen
 * hier sagen dem Browser zusätzlich, was er dieser Seite überhaupt erlauben
 * soll. Rutscht eines Tages doch ein Stück fremdes HTML durch – ein Name mit
 * `<img onerror=…>` an einer Stelle, die jemand übersehen hat –, führt der
 * Browser es trotzdem nicht aus.
 *
 * Die Content-Security-Policy im Einzelnen:
 *
 *   default-src 'self'      was nicht eigens genannt ist, nur vom Almanach
 *   script-src              eigene Skripte; dazu Spotifys Einbettungs-
 *                           schnittstelle (components/klang/spotifyRahmen.js),
 *                           die ihren Hauptteil vom CDN nachlädt. Kein
 *                           'unsafe-inline', kein 'unsafe-eval': Seit der
 *                           Almanach atomar ist, steht kein Skript im Markup
 *                           (auch aussehen.js ist eine eigene Datei).
 *   style-src               eigene Stilblätter. Kein 'unsafe-inline' – die
 *                           wenigen Werte aus dem Zustand setzt React über
 *                           das CSSOM (`style={{ '--x': … }}`), und das
 *                           erlaubt die Richtlinie ohnehin.
 *   img-src                 eigene Bilder, dazu `data:` (Bildnisse stehen als
 *                           data:-Adresse im Blatt) und `blob:` (Vorschau
 *                           beim Hochladen)
 *   font-src                die drei Schriften liegen im Bau selbst
 *   connect-src 'self'      fetch und der Live-Kanal – nur zum eigenen Server
 *   frame-src               nur Spotifys Spieler darf als Rahmen hinein
 *   frame-ancestors 'self'  niemand darf den Almanach einrahmen (dieselbe
 *                           Absicht wie X-Frame-Options, das für ältere
 *                           Browser stehen bleibt)
 *   object-src 'none'       keine Plugins
 *   base-uri, form-action   kein umgebogenes <base>, kein Formular, das
 *                           woandershin schickt
 *
 * Beim Entwickeln (`npm run dev`) liefert Vite die Oberfläche aus, nicht
 * dieser Server – dort gilt die Richtlinie nicht, und Vites schnelles
 * Nachladen (das Skripte ins Markup schreibt) funktioniert weiter.
 */

/** Die Richtlinie als eine Zeile, wie sie in der Kopfzeile steht. */
export const RICHTLINIE = [
  "default-src 'self'",
  "script-src 'self' https://open.spotify.com https://*.spotifycdn.com",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  'frame-src https://open.spotify.com',
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
].join('; ');

/**
 * Express-Zwischenschritt: setzt die Kopfzeilen auf jede Antwort.
 *
 * Auch auf die Antworten der Schnittstelle – sie schaden dort nicht, und
 * eine JSON-Antwort, die jemand direkt im Browser öffnet, ist damit ebenso
 * geschützt wie die Seite selbst.
 */
export function sicherheitsKopfzeilen(req, res, next) {
  // Hochgeladene Karten und Bildnisse gibt der Server so zurück, wie sie
  // abgelegt wurden – der Browser soll den Typ nicht selbst erraten.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  // Keine fremde Seite darf den Almanach in einen Rahmen setzen und darüber
  // einen unsichtbaren Knopf legen („Kampagne endgültig entfernen“).
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Content-Security-Policy', RICHTLINIE);
  next();
}
