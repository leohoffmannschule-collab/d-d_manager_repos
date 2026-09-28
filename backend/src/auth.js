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
 * Zwei Entscheidungen, die man kennen sollte:
 *
 * *Kennwörter* werden mit `scrypt` und einem zufälligen Salz gehasht und
 * nie im Klartext gespeichert. Verglichen wird mit `timingSafeEqual`, das
 * immer gleich lange braucht – ein gewöhnlicher Vergleich verriete über die
 * Antwortzeit, wie viele Zeichen schon stimmen.
 *
 * *Sitzungen* liegen als Zufallskennzeichen im Cookie, in der Datenbank
 * aber nur als Hash davon. Wer die Datenbank in die Hände bekäme, könnte
 * sich damit also trotzdem nicht anmelden.
 */
import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { db } from './db.js';
import { trenne } from './events.js';

export const COOKIE_NAME = 'almanach_sitzung';
const SESSION_DAYS = 30;

/* --- Passwörter --------------------------------------------------------- */

// scrypt steckt in Node selbst – kein bcrypt, das auf dem Pi kompiliert werden
// müsste. Die Parameter sind so gewählt, dass ein Anmeldeversuch auf einem
// Raspberry Pi 5 rund eine Zehntelsekunde kostet: für uns unmerklich, für
// jemanden, der Passwörter durchprobiert, teuer.
//
// Gerechnet wird *asynchron*, im Hintergrund-Faden von Node. Die
// synchrone Fassung hielte für diese Zehntelsekunde den ganzen Server an –
// jeder Live-Kanal, jeder Wurf am Tisch stünde still, solange sich jemand
// anmeldet. Und wer es darauf anlegt, könnte ihn mit Anmeldeversuchen
// lahmlegen, ohne je ein Kennwort zu treffen.
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
const scryptAsync = promisify(scrypt);

/** @returns {Promise<string>} `scrypt$N$r$p$salz$hash`, alles zum Prüfen Nötige in einer Zeile */
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, SCRYPT.keylen, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

/**
 * Stimmt das Kennwort? Die Parameter stehen im gespeicherten Hash selbst –
 * so bleiben alte Hashes prüfbar, auch wenn `SCRYPT` oben einmal steigt.
 *
 * @returns {Promise<boolean>} nie eine Ausnahme: ein kaputter Hash heißt „nein“
 */
export async function verifyPassword(password, stored) {
  try {
    const [scheme, N, r, p, salt, hash] = String(stored).split('$');
    if (scheme !== 'scrypt') return false;
    const expected = Buffer.from(hash, 'base64');
    const actual = await scryptAsync(password, Buffer.from(salt, 'base64'), expected.length, {
      N: Number(N),
      r: Number(r),
      p: Number(p),
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/**
 * Ein Hash, gegen den geprüft wird, wenn es den Namen gar nicht gibt.
 *
 * Ohne ihn verriete die Antwortzeit, welche Namen der Almanach kennt: Ein
 * unbekannter Name käme sofort zurück, ein bekannter erst nach der
 * Zehntelsekunde scrypt. So kostet beides gleich viel. Einmal gerechnet und
 * dann behalten – er muss nur *irgendein* gültiger Hash sein.
 */
let scheinHash = null;
export function vergleichsHash() {
  scheinHash ??= hashPassword(randomBytes(16).toString('hex'));
  return scheinHash;
}

/* --- Anmeldungen -------------------------------------------------------- */

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

function userForToken(token) {
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

/* --- Cookies ------------------------------------------------------------ */

export function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() !== name) continue;
    // attachUser läuft vor *jeder* Anfrage. Ein kaputt kodiertes Cookie
    // („%E0“) darf deshalb nicht werfen – sonst bekäme dieser Browser auf
    // jeden Weg ein 500 statt schlicht „nicht angemeldet“.
    try {
      return decodeURIComponent(part.slice(index + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

export function setSessionCookie(req, res, token) {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_DAYS * 24 * 60 * 60}`,
  ];
  // Über den Cloudflare-Tunnel kommt alles als HTTPS an; im Heimnetz per
  // http:// darf das Merkmal nicht gesetzt werden, sonst kommt das Cookie
  // gar nicht erst an.
  //
  // `req.secure` und nichts sonst: Express wertet `X-Forwarded-Proto` nur
  // aus, wenn der Absender ein vertrauenswürdiger Zwischenschritt ist
  // (`trust proxy` in server.js). Den Kopf hier selbst zu lesen, hieße
  // jedem zu glauben, der ihn mitschickt.
  if (req.secure) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res) {
  res.append('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

/* --- Middleware --------------------------------------------------------- */

/** Vor jedem Weg: Wer fragt, und in welcher Kampagne sitzt er gerade? */
export function attachUser(req, res, next) {
  req.sessionToken = readCookie(req, COOKIE_NAME);
  req.user = userForToken(req.sessionToken);
  req.campaignId = req.user?.campaignId ?? null;
  next();
}

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

export function requireDm(req, res, next) {
  if (!req.user) return res.status(401).json({ code: 'nicht_angemeldet', error: 'Bitte zuerst anmelden.' });
  if (req.user.role !== 'sl') {
    return res.status(403).json({ code: 'nur_spielleitung', error: 'Das ist der Spielleitung vorbehalten.' });
  }
  next();
}

export const isDm = (user) => user?.role === 'sl';

/* --- Konten ------------------------------------------------------------- */

export const nameKey = (name) => name.trim().toLowerCase();

export function countUsers() {
  return db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
}

/**
 * Ein Konto anlegen. Erwartet den schon gerechneten Hash, nicht das
 * Kennwort: Das Rechnen ist asynchron, das Anlegen soll es nicht sein –
 * sonst könnte zwischen „Name frei?“ und „Name belegt“ eine zweite Anfrage
 * denselben Namen einschieben (siehe routes/auth.js, /register).
 */
export function createUser({ name, passwordHash, role, color }) {
  const id = randomUUID();
  db.prepare(
    'INSERT INTO users (id, name, name_key, password_hash, role, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name.trim(), nameKey(name), passwordHash, role, color, new Date().toISOString());
  return db.prepare('SELECT id, name, role, color, created_at FROM users WHERE id = ?').get(id);
}
