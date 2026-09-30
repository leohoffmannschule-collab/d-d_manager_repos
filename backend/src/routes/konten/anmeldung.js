/**
 * Anmelden, abmelden, einrichten, Kennwort wechseln.
 *
 * Das erste Konto führt die Spielleitung – nicht weil jemand es auswählt,
 * sondern weil es das erste ist. Danach braucht jedes weitere einen
 * Einladungscode; ohne den stünde ein Almanach, der im Netz erreichbar ist,
 * jedem offen, der die Adresse kennt.
 */
import { Router } from 'express';
import { db, transaktion } from '../../db.js';
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
  setSessionCampaign,
  setSessionCookie,
  vergleichsHash,
  verifyPassword,
} from '../../auth.js';
import { broadcast } from '../../events.js';
import { asynchron } from '../../asynchron.js';
import { jetzt } from '../../werte.js';
import { SPERRE_AB, drosseln, erfolg, fehlversuch } from './drossel.js';
import { MIN_PASSWORT, ersteKampagne, naechsteFarbe, passwortZuKurz, pruefeName } from './regeln.js';

const router = Router();

// GET /api/auth/status – wer bin ich, und muss der Almanach erst eingerichtet werden?
router.get('/status', (req, res) => {
  res.json({
    user: req.user,
    needsSetup: countUsers() === 0,
  });
});

/**
 * POST /api/auth/register { name, password, invite? }
 *
 * Das erste Konto wird Spielleitung, jedes weitere braucht eine Einladung.
 *
 * Die Reihenfolge ist wichtig. Zuerst wird – asynchron, also mit Pause –
 * das Kennwort gehasht. *Danach* kommt alles, was prüft und schreibt, in
 * einem synchronen Block ohne jede Pause dazwischen. Andersherum könnten
 * zwei gleichzeitige Anmeldungen beide „Einladung noch frei“ oder beide
 * „noch kein Konto da, ich werde Spielleitung“ lesen, bevor die jeweils
 * andere geschrieben hat.
 */
router.post('/register', asynchron(async (req, res) => {
  const { name, password, invite } = req.body ?? {};

  const namensfehler = pruefeName(name);
  if (namensfehler) return res.status(400).json({ code: 'name_ungueltig', error: namensfehler });
  if (typeof password !== 'string' || password.length < MIN_PASSWORT) return passwortZuKurz(res);

  const passwordHash = await hashPassword(password);

  // Ab hier kein await mehr – siehe oben.
  const ergebnis = transaktion(() => {
    const erste = countUsers() === 0;
    let einladung = null;

    if (!erste) {
      const code = typeof invite === 'string' ? invite.trim().toUpperCase() : '';
      einladung = db.prepare('SELECT * FROM invites WHERE code = ?').get(code);
      if (!einladung) return { status: 403, code: 'einladung_ungueltig', error: 'Dieser Einladungscode gilt nicht.' };
      if (einladung.used_by) {
        return { status: 403, code: 'einladung_verbraucht', error: 'Dieser Einladungscode wurde schon eingelöst.' };
      }
    }

    if (db.prepare('SELECT id FROM users WHERE name_key = ?').get(nameKey(name))) {
      return { status: 409, code: 'name_vergeben', error: 'Diesen Namen führt der Almanach bereits.' };
    }

    const user = createUser({ name, passwordHash, role: erste ? 'sl' : 'spieler', color: naechsteFarbe() });
    if (einladung) {
      db.prepare('UPDATE invites SET used_by = ?, used_at = ? WHERE code = ?').run(user.id, jetzt(), einladung.code);
    }

    const token = createSession(user.id);
    // Die allererste Anmeldung braucht sofort eine Kampagne, sonst stünde
    // die frisch eingerichtete Spielleitung vor einem leeren Almanach ohne
    // Weg hinein.
    if (erste) setSessionCampaign(token, ersteKampagne(user.id));
    return { user, token };
  });

  if (ergebnis.status) {
    return res.status(ergebnis.status).json({ code: ergebnis.code, error: ergebnis.error });
  }

  const { user, token } = ergebnis;
  setSessionCookie(req, res, token);
  broadcast('runde:aktualisiert', {}, { dmOnly: true });
  res.status(201).json({ user: { id: user.id, name: user.name, role: user.role, color: user.color } });
}));

// POST /api/auth/login  { name, password } – anmelden. Bei Erfolg setzt der
// Server das Anmelde-Cookie; die Antwort enthält nur das Konto. Nach acht
// Fehlversuchen je Absender und Name ist für zehn Minuten Schluss (429).
router.post('/login', asynchron(async (req, res) => {
  const { name, password } = req.body ?? {};
  const schluessel = `${req.ip}|${nameKey(String(name ?? ''))}`;

  if (drosseln(schluessel) >= SPERRE_AB) {
    return res.status(429).json({ code: 'zu_viele_versuche', error: 'Zu viele Versuche. Bitte in zehn Minuten noch einmal.' });
  }
  if (typeof name !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ code: 'anmeldedaten_fehlen', error: 'Name und Passwort sind erforderlich.' });
  }

  // Erst zählen, dann rechnen. Seit die Prüfung asynchron ist, kämen fünfzig
  // *gleichzeitige* Versuche sonst alle an der Bremse vorbei, bevor der
  // erste als Fehlschlag verbucht wäre. Wer richtig liegt, wird unten wieder
  // ausgetragen.
  fehlversuch(schluessel);

  const row = db.prepare('SELECT * FROM users WHERE name_key = ?').get(nameKey(name));
  // Auch ohne Konto wird gerechnet – sonst verriete die Antwortzeit, welche
  // Namen es gibt (siehe vergleichsHash in ../auth.js).
  const stimmt = await verifyPassword(password, row?.password_hash ?? (await vergleichsHash()));
  if (!row || !stimmt) {
    return res.status(401).json({ code: 'anmeldung_falsch', error: 'Name oder Passwort stimmt nicht.' });
  }

  erfolg(schluessel);
  setSessionCookie(req, res, createSession(row.id));
  res.json({ user: { id: row.id, name: row.name, role: row.role, color: row.color } });
}));

// POST /api/auth/logout – diese eine Anmeldung beenden (andere Geräte bleiben
// angemeldet) und ihre offenen Live-Kanäle schließen.
router.post('/logout', (req, res) => {
  destroySession(req.sessionToken);
  clearSessionCookie(res);
  res.status(204).end();
});

// POST /api/auth/password – eigenes Passwort ändern
// Nach dem Wechsel sind alle anderen Anmeldungen dieses Kontos beendet –
// wer das Kennwort ändert, tut das oft, weil ein fremdes Gerät es kennt.
router.post('/password', requireAuth, asynchron(async (req, res) => {
  const { current, next } = req.body ?? {};
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!(await verifyPassword(String(current ?? ''), row.password_hash))) {
    return res.status(403).json({ code: 'passwort_falsch', error: 'Das bisherige Passwort stimmt nicht.' });
  }
  if (typeof next !== 'string' || next.length < MIN_PASSWORT) return passwortZuKurz(res);

  const hash = await hashPassword(next);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
  destroyAllSessions(req.user.id);
  setSessionCookie(req, res, createSession(req.user.id));
  res.status(204).end();
}));

/* --- Verwaltung durch die Spielleitung ---------------------------------- */

export default router;
