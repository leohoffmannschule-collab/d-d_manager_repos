/**
 * Die Wächter vor den Wegen des Servers.
 *
 *   attachUser      – hängt `req.user` und `req.campaignId` an jede Anfrage
 *   requireAuth     – ohne Anmeldung ist Schluss (401)
 *   requireDm       – nur die Spielleitung (403)
 *   requireCampaign – erst eine Kampagne wählen (409)
 *
 * In server.js steht ein Wächter *vor* dem Router eines Zweiges
 * (`app.use('/api/characters', requireCampaign, …)`) und gilt damit für
 * jeden Weg darin; innerhalb eines Routers steht `requireDm` vor den
 * einzelnen Wegen, die nur die Spielleitung gehen darf.
 */
import { COOKIE_NAME, readCookie } from './keks.js';
import { istMitglied, userForToken } from './sitzung.js';

/** Vor jedem Weg: Wer fragt, und in welcher Kampagne sitzt er gerade? */
export function attachUser(req, res, next) {
  req.sessionToken = readCookie(req, COOKIE_NAME);
  req.user = userForToken(req.sessionToken);
  req.campaignId = req.user?.campaignId ?? null;
  next();
}

/** Ohne Anmeldung ist Schluss: 401 `nicht_angemeldet`. */
export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ code: 'nicht_angemeldet', error: 'Bitte zuerst anmelden.' });
  next();
}

/**
 * Für alles, was am Spieltisch entsteht: ohne gewählte Kampagne (oder ohne
 * weiterhin gültige Mitgliedschaft darin) gibt es hier nichts zu holen.
 */
export function requireCampaign(req, res, next) {
  if (!req.user) return res.status(401).json({ code: 'nicht_angemeldet', error: 'Bitte zuerst anmelden.' });
  if (!req.campaignId || !istMitglied(req.campaignId, req.user.id)) {
    return res.status(409).json({ code: 'keine_kampagne', error: 'Bitte zuerst eine Kampagne wählen.' });
  }
  next();
}

/** Nur die Spielleitung: 401 ohne Anmeldung, 403 `nur_spielleitung` mit falscher Rolle. */
export function requireDm(req, res, next) {
  if (!req.user) return res.status(401).json({ code: 'nicht_angemeldet', error: 'Bitte zuerst anmelden.' });
  if (req.user.role !== 'sl') {
    return res.status(403).json({ code: 'nur_spielleitung', error: 'Das ist der Spielleitung vorbehalten.' });
  }
  next();
}

/** Führt dieses Konto die Spielleitung? Für Entscheidungen *innerhalb* eines Weges. */
export const isDm = (user) => user?.role === 'sl';
