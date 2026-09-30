/**
 * Die Anmeldebremse.
 *
 * Nach zu vielen Fehlversuchen je Absender und Name ist für eine Weile
 * Schluss (429). Das macht das Durchprobieren von Kennwörtern aussichtslos,
 * ohne jemanden auszusperren, der sich nur vertippt hat.
 */

/**
 * Bremse gegen das Durchprobieren von Passwörtern. Der Almanach hängt über
 * den Tunnel am offenen Netz, da darf niemand beliebig oft raten.
 *
 * Gezählt wird je Absender *und* Name. Eine Sperre nur je Name ließe jeden
 * Fremden die Spielleitung aussperren, indem er ihren Namen achtmal falsch
 * eintippt; eine nur je Absender träfe hinter einem gemeinsamen Anschluss
 * die ganze Runde.
 *
 * Die Zählung liegt nur im Speicher – ein Neustart vergisst sie. Das ist
 * hinnehmbar: Wer den Server neu starten kann, braucht kein Kennwort zu raten.
 */
const versuche = new Map();
/** Ab so vielen Fehlversuchen gibt es 429. */
export const SPERRE_AB = 8;
const SPERRE_MS = 10 * 60 * 1000;
// Wer mit immer neuen Namen rät, legt immer neue Einträge an. Ab dieser
// Größe wird aufgeräumt, damit die Bremse selbst nicht zum Speicherleck wird.
const AUFRAEUMEN_AB = 1000;

function aufraeumen() {
  const grenze = Date.now() - SPERRE_MS;
  for (const [schluessel, eintrag] of versuche) {
    if (eintrag.stand < grenze) versuche.delete(schluessel);
  }
}

/**
 * Wie viele Fehlversuche stehen für diesen Schlüssel (`Absender|Name`)?
 * Ein abgelaufener Eintrag zählt als null und wird dabei gleich entfernt.
 */
export function drosseln(schluessel) {
  const eintrag = versuche.get(schluessel);
  if (!eintrag) return 0;
  if (Date.now() - eintrag.stand > SPERRE_MS) {
    versuche.delete(schluessel);
    return 0;
  }
  return eintrag.anzahl;
}

/** Einen Versuch verbuchen – vor dem Prüfen, siehe anmeldung.js. */
export function fehlversuch(schluessel) {
  if (versuche.size >= AUFRAEUMEN_AB) aufraeumen();
  const eintrag = versuche.get(schluessel) ?? { anzahl: 0, stand: Date.now() };
  eintrag.anzahl += 1;
  eintrag.stand = Date.now();
  versuche.set(schluessel, eintrag);
}

/** Wer richtig lag, fängt wieder bei null an. */
export function erfolg(schluessel) {
  versuche.delete(schluessel);
}
