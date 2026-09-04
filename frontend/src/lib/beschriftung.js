/**
 * Hier – und nur hier – werden die Schlüssel des Servers zu Worten.
 *
 * Der Server schickt unveränderliche Kennungen: `schwer_verwundet`,
 * `einladung_verbraucht`, `handzettel`. Wie das am Bildschirm heißt, ist
 * Sache der Oberfläche. Wer den Almanach neu gestaltet, übersetzt oder in
 * eine andere Anwendung überführt, tauscht diese Datei aus und muss dafür
 * keine einzige Zeile im Server anfassen.
 */

/** Zustand eines Kämpfers, wie ihn die Runde zu sehen bekommt. */
export const ZUSTAND = {
  unversehrt: 'unversehrt',
  leicht_verletzt: 'leicht verletzt',
  verwundet: 'verwundet',
  schwer_verwundet: 'schwer verwundet',
  kampfunfaehig: 'kampfunfähig',
};

/** Art eines Chronikeintrags. */
export const CHRONIK_ART = {
  wurf: 'Wurf',
  schaden: 'Schaden',
  heilung: 'Heilung',
  tod: 'Niedergestreckt',
  zustand: 'Zustand',
  runde: 'Kampfrunde',
  kampf: 'Kampf',
  auftritt: 'Auftritt',
  szene: 'Szene',
  klang: 'Klang',
  handzettel: 'Handzettel',
  rast: 'Rast',
  notiz: 'Anmerkung',
  stufe: 'Stufenaufstieg',
};

/** Rollen im Almanach. */
export const ROLLE = {
  sl: 'Spielleitung',
  spieler: 'Runde',
};

/**
 * Fehlerschlüssel des Servers.
 *
 * Der Server liefert zu jedem Fehler auch einen fertigen Satz mit. Hier stehen
 * nur die Fälle, in denen die Oberfläche etwas anderes sagen möchte – etwa
 * freundlicher, kürzer oder mit einem Hinweis, was nun zu tun ist.
 */
export const FEHLER = {
  nicht_angemeldet: 'Die Sitzung ist abgelaufen. Bitte melde dich noch einmal an.',
  nur_spielleitung: 'Das ist der Spielleitung vorbehalten.',
  zu_viele_versuche: 'Zu viele Versuche. Bitte in zehn Minuten noch einmal.',
  kompendium_nicht_erreichbar: 'Das Kompendium ist gerade nicht erreichbar.',
  ki_nicht_eingerichtet: 'Es ist kein Sprachmodell eingestellt – das Protokoll gibt es auch ohne.',
};

/** Beschriftung zu einem Schlüssel, mit dem Schlüssel als Rückfallebene. */
export function benenne(karte, schluessel, ersatz = null) {
  if (!schluessel) return ersatz;
  return karte[schluessel] ?? ersatz ?? schluessel;
}

/** Fehlertext: bevorzugt die eigene Fassung, sonst die des Servers. */
export function fehlertext(fehler) {
  return FEHLER[fehler?.code] ?? fehler?.message ?? 'Unbekannter Fehler.';
}
