/**
 * Sitzungen: anmelden, abmelden, wiedererkennen.
 *
 * *Sitzungen* liegen als Zufallskennzeichen im Cookie, in der Datenbank aber
 * nur als Hash davon. Wer die Datenbank in die Hände bekäme, könnte sich
 * damit also trotzdem nicht anmelden.
 *
 * Zu jeder Sitzung gehört außerdem die gerade gewählte Kampagne
 * (`auth_sessions.campaign_id`) – sie hängt an der Anmeldung, nicht am
 * Konto, damit dieselbe Person in zwei Fenstern zwei Kampagnen offen haben
 * kann.
 */
import { createHash, randomBytes } from 'node:crypto';
import { db } from '../db.js';
import { trenne } from '../events.js';

/** Wie lange eine Anmeldung ohne Besuch hält. */
export const SESSION_DAYS = 30;

// In der Datenbank liegt nur der Hash des Anmelde-Tokens. Wer die Datei in die
// Hände bekommt, kann sich damit trotzdem nicht anmelden.
function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Neue Sitzung. Gehört das Konto genau einer Kampagne an, ist die gleich
 * gewählt – bei mehreren entscheidet die Person selbst (Kampagnenauswahl
 * nach der Anmeldung), also bleibt campaign_id dann zunächst leer.
 */
export function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const now = new Date().toISOString();
  const mitgliedschaften = db
    .prepare(
      `SELECT m.campaign_id FROM campaign_members m
         JOIN campaigns c ON c.id = m.campaign_id
        WHERE m.user_id = ? AND c.deleted_at IS NULL`
    )
    .all(userId);
  const campaignId = mitgliedschaften.length === 1 ? mitgliedschaften[0].campaign_id : null;
  db.prepare(
    'INSERT INTO auth_sessions (token_hash, user_id, campaign_id, created_at, last_seen) VALUES (?, ?, ?, ?, ?)'
  ).run(tokenHash(token), userId, campaignId, now, now);
  return token;
}

/**
 * Eine Anmeldung beenden – und mit ihr die offenen Live-Kanäle dieser
 * Anmeldung. Ohne das Zweite hörte ein abgemeldetes Fenster weiter mit,
 * was am Tisch geschieht, bis jemand es schließt.
 */
export function destroySession(token) {
  if (!token) return;
  db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(tokenHash(token));
  trenne({ sitzung: token });
}

/** Alle Anmeldungen eines Kontos beenden – nach Kennwortwechsel oder Löschen. */
export function destroyAllSessions(userId) {
  db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(userId);
  trenne({ userId });
}

/**
 * Wer steckt hinter diesem Anmelde-Kennzeichen – oder niemand?
 *
 * Nach dreißig Tagen ohne Besuch ist eine Sitzung abgelaufen und wird dabei
 * gleich gelöscht. Der Zeitpunkt des letzten Besuchs wird nur einmal je
 * Stunde nachgetragen (siehe unten).
 *
 * @returns {{ id, name, role, color, campaignId } | null}
 */
export function userForToken(token) {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.role, u.color, s.last_seen, s.campaign_id
         FROM auth_sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ?`
    )
    .get(tokenHash(token));
  if (!row) return null;

  const age = Date.now() - new Date(row.last_seen).getTime();
  if (age > SESSION_DAYS * 24 * 60 * 60 * 1000) {
    destroySession(token);
    return null;
  }
  // Nur einmal pro Stunde schreiben – sonst gäbe es bei jedem Bildaufruf
  // einen Schreibzugriff auf die SD-Karte.
  if (age > 60 * 60 * 1000) {
    db.prepare('UPDATE auth_sessions SET last_seen = ? WHERE token_hash = ?').run(
      new Date().toISOString(),
      tokenHash(token)
    );
  }
  return { id: row.id, name: row.name, role: row.role, color: row.color, campaignId: row.campaign_id };
}

/**
 * Ist dieses Konto Mitglied der Kampagne – oder war es das nicht (mehr)?
 * Eine im Papierkorb liegende Kampagne zählt nicht: Wer noch mit ihr in der
 * Sitzung steht, wird zur Auswahl zurückgeschickt.
 */
export function istMitglied(campaignId, userId) {
  if (!campaignId) return false;
  return !!db
    .prepare(
      `SELECT 1 FROM campaign_members m
         JOIN campaigns c ON c.id = m.campaign_id
        WHERE m.campaign_id = ? AND m.user_id = ? AND c.deleted_at IS NULL`
    )
    .get(campaignId, userId);
}

/** Trägt die gewählte Kampagne in die laufende Sitzung ein. */
export function setSessionCampaign(token, campaignId) {
  db.prepare('UPDATE auth_sessions SET campaign_id = ? WHERE token_hash = ?').run(campaignId, tokenHash(token));
}
