/**
 * Anmeldung und Zutritt: Kennwörter, Sitzungen, Rollen, Kampagnenzugehörigkeit.
 *
 * Hier liegen die Wächter, die vor fast jedem Weg des Servers stehen:
 *
 *   attachUser      – hängt `req.user` und `req.campaignId` an jede Anfrage
 *   requireAuth     – ohne Anmeldung ist Schluss (401)
 *   requireDm       – nur die Spielleitung (403)
 *   requireCampaign – erst eine Kampagne wählen (409)
 *
 * **Das ist der wirkliche Schutz des Almanachs.** Die Oberfläche versteckt
 * zwar Knöpfe, aber wer die Adresse kennt, kann jeden Weg von Hand
 * aufrufen. Was hier nicht geprüft wird, ist nicht geschützt.
 *
 * Diese Datei ist nur der Eingang. Gebaut wird nebenan in `anmeldung/`:
 *
 *   anmeldung/kennwort.js  hashen und prüfen (scrypt, zeitgleich verglichen)
 *   anmeldung/sitzung.js   Sitzungen anlegen, beenden, wiedererkennen
 *   anmeldung/keks.js      das Anmelde-Cookie lesen, setzen, löschen
 *   anmeldung/waechter.js  die vier Wächter oben
 *   anmeldung/konten.js    Konten anlegen und zählen
 *
 * Alle Wege holen sich, was sie brauchen, von hier – so bleibt es eine
 * einzige Adresse, egal wie die Teile dahinter geschnitten sind.
 */
export { hashPassword, verifyPassword, vergleichsHash } from './anmeldung/kennwort.js';
export {
  SESSION_DAYS,
  createSession,
  destroyAllSessions,
  destroySession,
  istMitglied,
  setSessionCampaign,
} from './anmeldung/sitzung.js';
export { COOKIE_NAME, clearSessionCookie, readCookie, setSessionCookie } from './anmeldung/keks.js';
export { attachUser, isDm, requireAuth, requireCampaign, requireDm } from './anmeldung/waechter.js';
export { countUsers, createUser, nameKey } from './anmeldung/konten.js';
