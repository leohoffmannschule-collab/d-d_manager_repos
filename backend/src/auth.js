import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { db } from './db.js';

export const COOKIE_NAME = 'almanach_sitzung';
const SESSION_DAYS = 30;

/* --- Passwörter --------------------------------------------------------- */

// scrypt steckt in Node selbst – kein bcrypt, das auf dem Pi kompiliert werden
// müsste. Die Parameter sind so gewählt, dass ein Anmeldeversuch auf einem
// Raspberry Pi 5 rund eine Zehntelsekunde kostet: für uns unmerklich, für
// jemanden, der Passwörter durchprobiert, teuer.
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT.keylen, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  try {
    const [scheme, N, r, p, salt, hash] = String(stored).split('$');
    if (scheme !== 'scrypt') return false;
    const expected = Buffer.from(hash, 'base64');
    const actual = scryptSync(password, Buffer.from(salt, 'base64'), expected.length, {
      N: Number(N),
      r: Number(r),
      p: Number(p),
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/* --- Anmeldungen -------------------------------------------------------- */

// In der Datenbank liegt nur der Hash des Anmelde-Tokens. Wer die Datei in die
// Hände bekommt, kann sich damit trotzdem nicht anmelden.
function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const now = new Date().toISOString();
  db.prepare('INSERT INTO auth_sessions (token_hash, user_id, created_at, last_seen) VALUES (?, ?, ?, ?)').run(
    tokenHash(token),
    userId,
    now,
    now
  );
  return token;
}

export function destroySession(token) {
  if (!token) return;
  db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(tokenHash(token));
}

export function destroyAllSessions(userId) {
  db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(userId);
}

function userForToken(token) {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.role, u.color, s.last_seen
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
  return { id: row.id, name: row.name, role: row.role, color: row.color };
}

/* --- Cookies ------------------------------------------------------------ */

export function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() !== name) continue;
    return decodeURIComponent(part.slice(index + 1).trim());
  }
  return null;
}

function isSecureRequest(req) {
  return req.secure || req.headers['x-forwarded-proto'] === 'https';
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
  if (isSecureRequest(req)) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res) {
  res.append('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

/* --- Middleware --------------------------------------------------------- */

export function attachUser(req, res, next) {
  req.sessionToken = readCookie(req, COOKIE_NAME);
  req.user = userForToken(req.sessionToken);
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ code: 'nicht_angemeldet', error: 'Bitte zuerst anmelden.' });
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

export function createUser({ name, password, role, color }) {
  const id = randomUUID();
  db.prepare(
    'INSERT INTO users (id, name, name_key, password_hash, role, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name.trim(), nameKey(name), hashPassword(password), role, color, new Date().toISOString());
  return db.prepare('SELECT id, name, role, color, created_at FROM users WHERE id = ?').get(id);
}
