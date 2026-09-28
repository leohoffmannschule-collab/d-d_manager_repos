/**
 * Die Wege rund um Konten: anmelden, abmelden, einrichten, einladen,
 * verwalten.
 *
 * Drei Dinge, die hier anders sind als überall sonst im Almanach:
 *
 *   – *Das erste Konto führt die Spielleitung.* Nicht weil jemand es
 *     auswählt, sondern weil es das erste ist. Danach braucht jedes weitere
 *     einen Einladungscode; ohne den stünde ein Almanach, der im Netz
 *     erreichbar ist, jedem offen, der die Adresse kennt.
 *   – *Die Anmeldung wird gedrosselt.* Nach zu vielen Fehlversuchen je
 *     Absender und Name ist für eine Weile Schluss (429). Das macht das
 *     Durchprobieren von Kennwörtern aussichtslos, ohne jemanden
 *     auszusperren, der sich nur vertippt hat.
 *   – *Das erste Konto bekommt gleich eine Kampagne* samt zwölf Vorlagen,
 *     sonst stünde die frisch eingerichtete Spielleitung vor einem leeren
 *     Almanach ohne Weg hinein.
 */
import { Router } from 'express';
import { randomInt, randomUUID } from 'node:crypto';
import { db, transaktion } from '../db.js';
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
  setSessionCampaign,
  setSessionCookie,
  vergleichsHash,
  verifyPassword,
} from '../auth.js';
import { saeVorlagen } from '../vorlagen/index.js';
import { broadcast, trenne } from '../events.js';
import { asynchron } from '../asynchron.js';
import { istFarbe, jetzt } from '../werte.js';

const router = Router();

const MIN_PASSWORT = 8;
const FARBEN = ['#9a2b22', '#2f6b4f', '#2d4f7c', '#6b3f8c', '#a86a1f', '#1f6f74', '#8c3f5f', '#4a5d23'];

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
const SPERRE_AB = 8;
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
  if (versuche.size >= AUFRAEUMEN_AB) aufraeumen();
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

const passwortZuKurz = (res) =>
  res.status(400).json({ code: 'passwort_zu_kurz', error: `Das Passwort braucht mindestens ${MIN_PASSWORT} Zeichen.` });

const letzteSpielleitung = () => db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'sl'").get().n <= 1;

/** Die Kampagne, die das allererste Konto vorfindet – samt zwölf Vorlagen. */
function ersteKampagne(userId) {
  const id = randomUUID();
  const stand = jetzt();
  db.prepare('INSERT INTO campaigns (id, name, created_by, created_at) VALUES (?, ?, ?, ?)').run(
    id,
    'Erste Kampagne',
    userId,
    stand
  );
  db.prepare('INSERT INTO campaign_members (campaign_id, user_id, joined_at) VALUES (?, ?, ?)').run(id, userId, stand);
  saeVorlagen(id);
  return id;
}

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

// POST /api/auth/login
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

  versuche.delete(schluessel);
  setSessionCookie(req, res, createSession(row.id));
  res.json({ user: { id: row.id, name: row.name, role: row.role, color: row.color } });
}));

// POST /api/auth/logout
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

/**
 * PATCH /api/auth/users/:id { role?, color?, password? }
 *
 * Erst wird *alles* geprüft, dann *alles* geschrieben. Andersherum stünde
 * nach „neue Rolle, aber zu kurzes Kennwort“ die Rolle schon geändert da,
 * während die Antwort „400, nichts passiert“ behauptet.
 */
router.patch('/users/:id', requireDm, asynchron(async (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ code: 'konto_nicht_gefunden', error: 'Konto nicht gefunden.' });

  const { role, color, password } = req.body ?? {};
  const neueRolle = role && role !== row.role ? role : null;
  const neuesKennwort = typeof password === 'string' && password ? password : null;

  if (neueRolle) {
    if (!['sl', 'spieler'].includes(neueRolle)) {
      return res.status(400).json({ code: 'unbekannte_rolle', error: 'Unbekannte Rolle.' });
    }
    // Es muss immer jemand die Spielleitung innehaben.
    if (row.role === 'sl' && letzteSpielleitung()) {
      return res.status(400).json({ code: 'letzte_spielleitung', error: 'Es braucht mindestens eine Spielleitung.' });
    }
  }
  if (neuesKennwort && neuesKennwort.length < MIN_PASSWORT) return passwortZuKurz(res);

  const hash = neuesKennwort ? await hashPassword(neuesKennwort) : null;

  transaktion(() => {
    if (neueRolle) db.prepare('UPDATE users SET role = ? WHERE id = ?').run(neueRolle, row.id);
    if (istFarbe(color)) db.prepare('UPDATE users SET color = ? WHERE id = ?').run(color, row.id);
    if (hash) db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, row.id);
  });

  // Neues Kennwort: alle Anmeldungen weg (das trennt auch die Live-Kanäle).
  // Neue Rolle: Die Anmeldung bleibt, aber offene Kanäle hören noch mit der
  // alten Rolle mit – eine entzogene Spielleitung sähe sonst weiter die
  // verdeckten Würfe. Getrennt verbinden sie sich mit der neuen Rolle neu.
  if (hash) destroyAllSessions(row.id);
  else if (neueRolle) trenne({ userId: row.id });

  broadcast('runde:aktualisiert', {}, { dmOnly: true });
  res.json(db.prepare('SELECT id, name, role, color, created_at FROM users WHERE id = ?').get(row.id));
}));

router.delete('/users/:id', requireDm, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ code: 'konto_nicht_gefunden', error: 'Konto nicht gefunden.' });
  if (row.id === req.user.id) return res.status(400).json({ code: 'eigenes_konto', error: 'Das eigene Konto lässt sich nicht löschen.' });
  if (row.role === 'sl' && letzteSpielleitung()) {
    return res.status(400).json({ code: 'letzte_spielleitung', error: 'Es braucht mindestens eine Spielleitung.' });
  }
  // Die Charaktere bleiben erhalten und fallen an die Spielleitung zurück –
  // im selben Block wie das Löschen, sonst gäbe es nach einem Abbruch
  // Blätter, deren Besitzer es nicht mehr gibt.
  transaktion(() => {
    db.prepare('UPDATE characters SET owner_id = ? WHERE owner_id = ?').run(req.user.id, row.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(row.id);
  });
  // Die Anmeldungen gehen per Fremdschlüssel mit – die offenen Kanäle nicht.
  trenne({ userId: row.id });
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
  const stand = jetzt();
  db.prepare('INSERT INTO invites (code, note, created_at) VALUES (?, ?, ?)').run(code, note, stand);
  res.status(201).json({ code, note, created_at: stand, used_at: null, used_by_name: null });
});

router.delete('/invites/:code', requireDm, (req, res) => {
  const info = db.prepare('DELETE FROM invites WHERE code = ?').run(req.params.code.toUpperCase());
  if (info.changes === 0) return res.status(404).json({ code: 'einladung_nicht_gefunden', error: 'Einladung nicht gefunden.' });
  res.status(204).end();
});

export default router;
