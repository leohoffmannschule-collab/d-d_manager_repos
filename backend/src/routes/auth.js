import { Router } from 'express';
import { randomInt } from 'node:crypto';
import { db } from '../db.js';
import {
  clearSessionCookie,
  countUsers,
  createSession,
  createUser,
  destroyAllSessions,
  destroySession,
  hashPassword,
  nameKey,
  requireAuth,
  requireDm,
  setSessionCookie,
  verifyPassword,
} from '../auth.js';
import { broadcast } from '../events.js';

const router = Router();

const MIN_PASSWORT = 8;
const FARBEN = ['#9a2b22', '#2f6b4f', '#2d4f7c', '#6b3f8c', '#a86a1f', '#1f6f74', '#8c3f5f', '#4a5d23'];

/**
 * Bremse gegen das Durchprobieren von Passwörtern. Der Almanach hängt über
 * den Tunnel am offenen Netz, da darf niemand beliebig oft raten.
 */
const versuche = new Map();
const SPERRE_AB = 8;
const SPERRE_MS = 10 * 60 * 1000;

function drosseln(schluessel) {
  const eintrag = versuche.get(schluessel);
  if (!eintrag) return 0;
  if (Date.now() - eintrag.stand > SPERRE_MS) {
    versuche.delete(schluessel);
    return 0;
  }
  return eintrag.anzahl;
}

function fehlversuch(schluessel) {
  const eintrag = versuche.get(schluessel) ?? { anzahl: 0, stand: Date.now() };
  eintrag.anzahl += 1;
  eintrag.stand = Date.now();
  versuche.set(schluessel, eintrag);
}

function neuerEinladungscode() {
  // Ohne I, O, 0 und 1 – die verliest man beim Vorlesen am Spieltisch.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const gruppe = () => Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join('');
  return `${gruppe()}-${gruppe()}-${gruppe()}`;
}

function naechsteFarbe() {
  const benutzt = new Set(db.prepare('SELECT color FROM users').all().map((r) => r.color));
  return FARBEN.find((f) => !benutzt.has(f)) ?? FARBEN[randomInt(FARBEN.length)];
}

function pruefeName(name) {
  if (typeof name !== 'string' || name.trim().length < 2) return 'Der Name braucht mindestens zwei Zeichen.';
  if (name.trim().length > 40) return 'Der Name ist zu lang.';
  return null;
}

// GET /api/auth/status – wer bin ich, und muss der Almanach erst eingerichtet werden?
router.get('/status', (req, res) => {
  res.json({
    user: req.user,
    needsSetup: countUsers() === 0,
  });
});

// POST /api/auth/register – erste Anmeldung wird Spielleitung, danach nur mit Einladung.
router.post('/register', (req, res) => {
  const { name, password, invite } = req.body ?? {};

  const namensfehler = pruefeName(name);
  if (namensfehler) return res.status(400).json({ code: 'name_ungueltig', error: namensfehler });
  if (typeof password !== 'string' || password.length < MIN_PASSWORT) {
    return res.status(400).json({ code: 'passwort_zu_kurz', error: `Das Passwort braucht mindestens ${MIN_PASSWORT} Zeichen.` });
  }

  const erste = countUsers() === 0;
  let einladung = null;

  if (!erste) {
    const code = typeof invite === 'string' ? invite.trim().toUpperCase() : '';
    einladung = db.prepare('SELECT * FROM invites WHERE code = ?').get(code);
    if (!einladung) return res.status(403).json({ code: 'einladung_ungueltig', error: 'Dieser Einladungscode gilt nicht.' });
    if (einladung.used_by) return res.status(403).json({ code: 'einladung_verbraucht', error: 'Dieser Einladungscode wurde schon eingelöst.' });
  }

  if (db.prepare('SELECT id FROM users WHERE name_key = ?').get(nameKey(name))) {
    return res.status(409).json({ code: 'name_vergeben', error: 'Diesen Namen führt der Almanach bereits.' });
  }

  const user = createUser({
    name,
    password,
    role: erste ? 'sl' : 'spieler',
    color: naechsteFarbe(),
  });

  if (einladung) {
    db.prepare('UPDATE invites SET used_by = ?, used_at = ? WHERE code = ?').run(
      user.id,
      new Date().toISOString(),
      einladung.code
    );
  }

  setSessionCookie(req, res, createSession(user.id));
  broadcast('runde:aktualisiert', {}, { dmOnly: true });
  res.status(201).json({ user: { id: user.id, name: user.name, role: user.role, color: user.color } });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { name, password } = req.body ?? {};
  const schluessel = `${req.ip}|${nameKey(String(name ?? ''))}`;

  if (drosseln(schluessel) >= SPERRE_AB) {
    return res.status(429).json({ code: 'zu_viele_versuche', error: 'Zu viele Versuche. Bitte in zehn Minuten noch einmal.' });
  }
  if (typeof name !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ code: 'anmeldedaten_fehlen', error: 'Name und Passwort sind erforderlich.' });
  }

  const row = db.prepare('SELECT * FROM users WHERE name_key = ?').get(nameKey(name));
  if (!row || !verifyPassword(password, row.password_hash)) {
    fehlversuch(schluessel);
    return res.status(401).json({ code: 'anmeldung_falsch', error: 'Name oder Passwort stimmt nicht.' });
  }

  versuche.delete(schluessel);
  setSessionCookie(req, res, createSession(row.id));
  res.json({ user: { id: row.id, name: row.name, role: row.role, color: row.color } });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  destroySession(req.sessionToken);
  clearSessionCookie(res);
  res.status(204).end();
});

// POST /api/auth/password – eigenes Passwort ändern
router.post('/password', requireAuth, (req, res) => {
  const { current, next } = req.body ?? {};
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!verifyPassword(String(current ?? ''), row.password_hash)) {
    return res.status(403).json({ code: 'passwort_falsch', error: 'Das bisherige Passwort stimmt nicht.' });
  }
  if (typeof next !== 'string' || next.length < MIN_PASSWORT) {
    return res.status(400).json({ code: 'passwort_zu_kurz', error: `Das Passwort braucht mindestens ${MIN_PASSWORT} Zeichen.` });
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(next), req.user.id);
  destroyAllSessions(req.user.id);
  setSessionCookie(req, res, createSession(req.user.id));
  res.status(204).end();
});

/* --- Verwaltung durch die Spielleitung ---------------------------------- */

router.get('/users', requireDm, (req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.role, u.color, u.created_at,
              (SELECT COUNT(*) FROM characters c WHERE c.owner_id = u.id) AS characters
         FROM users u ORDER BY u.role = 'sl' DESC, u.name COLLATE NOCASE`
    )
    .all();
  res.json(rows);
});

router.patch('/users/:id', requireDm, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ code: 'konto_nicht_gefunden', error: 'Konto nicht gefunden.' });

  const { role, color, password } = req.body ?? {};

  if (role && role !== row.role) {
    if (!['sl', 'spieler'].includes(role)) return res.status(400).json({ code: 'unbekannte_rolle', error: 'Unbekannte Rolle.' });
    // Es muss immer jemand die Spielleitung innehaben.
    if (row.role === 'sl' && db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'sl'").get().n <= 1) {
      return res.status(400).json({ code: 'letzte_spielleitung', error: 'Es braucht mindestens eine Spielleitung.' });
    }
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, row.id);
  }
  if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) {
    db.prepare('UPDATE users SET color = ? WHERE id = ?').run(color, row.id);
  }
  if (typeof password === 'string' && password) {
    if (password.length < MIN_PASSWORT) {
      return res.status(400).json({ code: 'passwort_zu_kurz', error: `Das Passwort braucht mindestens ${MIN_PASSWORT} Zeichen.` });
    }
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), row.id);
    destroyAllSessions(row.id);
  }

  broadcast('runde:aktualisiert', {}, { dmOnly: true });
  res.json(db.prepare('SELECT id, name, role, color, created_at FROM users WHERE id = ?').get(row.id));
});

router.delete('/users/:id', requireDm, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ code: 'konto_nicht_gefunden', error: 'Konto nicht gefunden.' });
  if (row.id === req.user.id) return res.status(400).json({ code: 'eigenes_konto', error: 'Das eigene Konto lässt sich nicht löschen.' });
  if (row.role === 'sl' && db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'sl'").get().n <= 1) {
    return res.status(400).json({ code: 'letzte_spielleitung', error: 'Es braucht mindestens eine Spielleitung.' });
  }
  // Die Charaktere bleiben erhalten und fallen an die Spielleitung zurück.
  db.prepare('UPDATE characters SET owner_id = ? WHERE owner_id = ?').run(req.user.id, row.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(row.id);
  broadcast('runde:aktualisiert', {}, { dmOnly: true });
  res.status(204).end();
});

router.get('/invites', requireDm, (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT i.code, i.note, i.created_at, i.used_at, u.name AS used_by_name
           FROM invites i LEFT JOIN users u ON u.id = i.used_by
          ORDER BY i.created_at DESC`
      )
      .all()
  );
});

router.post('/invites', requireDm, (req, res) => {
  const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 80) : '';
  const code = neuerEinladungscode();
  db.prepare('INSERT INTO invites (code, note, created_at) VALUES (?, ?, ?)').run(
    code,
    note,
    new Date().toISOString()
  );
  res.status(201).json({ code, note, created_at: new Date().toISOString(), used_at: null, used_by_name: null });
});

router.delete('/invites/:code', requireDm, (req, res) => {
  const info = db.prepare('DELETE FROM invites WHERE code = ?').run(req.params.code.toUpperCase());
  if (info.changes === 0) return res.status(404).json({ code: 'einladung_nicht_gefunden', error: 'Einladung nicht gefunden.' });
  res.status(204).end();
});

export default router;
