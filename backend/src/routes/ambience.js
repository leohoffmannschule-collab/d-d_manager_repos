import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, getState, setState } from '../db.js';
import { requireAuth, requireDm } from '../auth.js';
import { broadcast } from '../events.js';
import * as chronik from '../chronicle.js';

const router = Router();
router.use(requireAuth);

/**
 * Der Klangteppich.
 *
 * Hier liegen Spotify-Links, sonst nichts. Der Almanach spielt nichts ab und
 * kennt kein Spotify-Konto: Er sammelt, was die Spielleitung vorbereitet hat,
 * und sagt der Runde, was gerade dran ist. Jeder öffnet es in seinem eigenen
 * Spotify.
 *
 * Das ist bewusst die kleine Lösung. Die große – im Browser abspielen und über
 * alle Fenster gleichschalten – verlangt von Spotify eine verschlüsselte
 * Adresse unter eigenem Namen, ein Premium-Konto je Zuhörer und eine
 * Freischaltliste. Wer den Almanach ohne eigene Domain betreibt, kann davon
 * nichts erfüllen. Ein hinterlegter Link dagegen funktioniert für jeden,
 * sofort und ohne Anmeldung.
 */

const TYPEN = new Set(['playlist', 'album', 'track', 'artist']);
const KENNUNG = /^[A-Za-z0-9]{22}$/;

/**
 * Aus dem, was der DM einfügt, eine saubere Spotify-Adresse machen.
 *
 * Erlaubt sind der Teilen-Link aus der App (auch mit Sprachkürzel wie
 * `/intl-de/` und angehängtem `?si=…`) und die rohe URI. Alles andere fällt
 * durch: Was hier hereinkommt, wird der Runde später als Verweis vorgelegt,
 * und der soll nirgendwo anders hinführen als zu Spotify.
 */
export function spotifyAdresse(eingabe) {
  const text = String(eingabe ?? '').trim();
  if (!text) return null;

  const alsUri = text.match(/^spotify:([a-z]+):([A-Za-z0-9]+)$/);
  if (alsUri) {
    const [, art, id] = alsUri;
    return TYPEN.has(art) && KENNUNG.test(id) ? { uri: `spotify:${art}:${id}`, kind: art } : null;
  }

  let adresse;
  try {
    adresse = new URL(text);
  } catch {
    return null;
  }
  if (adresse.protocol !== 'https:') return null;
  if (!['open.spotify.com', 'play.spotify.com'].includes(adresse.hostname)) return null;

  const teile = adresse.pathname
    .split('/')
    .filter(Boolean)
    .filter((t) => !/^intl-[a-z]{2,3}$/i.test(t));
  if (teile.length < 2) return null;

  const [art, id] = teile;
  return TYPEN.has(art) && KENNUNG.test(id) ? { uri: `spotify:${art}:${id}`, kind: art } : null;
}

/** Die Adresse zum Anklicken. Sie öffnet die App, wo es eine gibt, sonst den Web-Spieler. */
export function webAdresse(uri) {
  const [, art, id] = String(uri ?? '').split(':');
  return art && id ? `https://open.spotify.com/${art}/${id}` : null;
}

const sauber = (t) => typeof t === 'string' && t.trim();
const schlagworte = (liste) =>
  Array.isArray(liste) ? liste.filter(sauber).map((t) => t.trim().slice(0, 40)).slice(0, 12) : [];

function rowToKlang(row) {
  return {
    id: row.id,
    name: row.name,
    uri: row.uri,
    webUrl: webAdresse(row.uri),
    kind: row.kind,
    tags: JSON.parse(row.tags),
    notes: row.notes,
    createdAt: row.created_at,
  };
}

const holen = (id) => db.prepare('SELECT * FROM ambience WHERE id = ?').get(id);

/* --- Was gerade aufliegt ------------------------------------------------- */

const STILLE = { ambienceId: null, uri: null, webUrl: null, kind: null, name: '', notes: '', seit: null };

export const aktuellerKlang = () => ({ ...STILLE, ...(getState('klang') ?? {}) });

function setzeKlang(werte) {
  const klang = setState('klang', { ...STILLE, ...werte });
  broadcast('klang', klang);
  return klang;
}

/** Wird von der Kartenbibliothek gebraucht: Eine Karte bringt ihre Ambiente mit. */
export function klangAuflegen(ambienceId) {
  const row = holen(ambienceId);
  if (!row) return null;
  const eintrag = rowToKlang(row);
  chronik.log({
    kind: 'klang',
    target: eintrag.name,
    text: `Über dem Tisch liegt „${eintrag.name}“.`,
    meta: { ambienceId: eintrag.id, uri: eintrag.uri },
  });
  return setzeKlang({
    ambienceId: eintrag.id,
    uri: eintrag.uri,
    webUrl: eintrag.webUrl,
    kind: eintrag.kind,
    name: eintrag.name,
    notes: eintrag.notes,
    seit: new Date().toISOString(),
  });
}

/* --- Zweige -------------------------------------------------------------- */

// GET /api/ambience/aktiv – die ganze Runde darf wissen, was dran ist.
router.get('/aktiv', (req, res) => {
  res.json(aktuellerKlang());
});

// GET /api/ambience – die Sammlung ist Vorbereitung und bleibt beim DM.
router.get('/', requireDm, (req, res) => {
  res.json(db.prepare('SELECT * FROM ambience ORDER BY name COLLATE NOCASE').all().map(rowToKlang));
});

router.post('/', requireDm, (req, res) => {
  const body = req.body ?? {};
  const adresse = spotifyAdresse(body.uri ?? body.link);
  if (!adresse) {
    return res.status(400).json({
      code: 'keine_spotify_adresse',
      error: 'Das ist kein Spotify-Link auf eine Wiedergabeliste, ein Album, ein Stück oder einen Künstler.',
    });
  }
  if (!sauber(body.name)) {
    return res.status(400).json({ code: 'name_fehlt', error: 'Name ist erforderlich.' });
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO ambience (id, name, uri, kind, tags, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    body.name.trim().slice(0, 120),
    adresse.uri,
    adresse.kind,
    JSON.stringify(schlagworte(body.tags)),
    typeof body.notes === 'string' ? body.notes.slice(0, 2000) : '',
    new Date().toISOString()
  );
  res.status(201).json(rowToKlang(holen(id)));
});

router.put('/:id', requireDm, (req, res) => {
  const row = holen(req.params.id);
  if (!row) return res.status(404).json({ code: 'klang_nicht_gefunden', error: 'Ambiente nicht gefunden.' });
  const body = req.body ?? {};

  let uri = row.uri;
  let kind = row.kind;
  if (body.uri !== undefined || body.link !== undefined) {
    const adresse = spotifyAdresse(body.uri ?? body.link);
    if (!adresse) {
      return res.status(400).json({ code: 'keine_spotify_adresse', error: 'Das ist kein Spotify-Link.' });
    }
    uri = adresse.uri;
    kind = adresse.kind;
  }

  db.prepare('UPDATE ambience SET name = ?, uri = ?, kind = ?, tags = ?, notes = ? WHERE id = ?').run(
    sauber(body.name) ? body.name.trim().slice(0, 120) : row.name,
    uri,
    kind,
    'tags' in body ? JSON.stringify(schlagworte(body.tags)) : row.tags,
    typeof body.notes === 'string' ? body.notes.slice(0, 2000) : row.notes,
    row.id
  );

  const frisch = rowToKlang(holen(row.id));
  // Liegt gerade genau dieses auf, wandert die Änderung sofort mit – sonst
  // stünde am Tisch noch der alte Name oder der alte Verweis.
  if (aktuellerKlang().ambienceId === frisch.id) {
    setzeKlang({ ...aktuellerKlang(), uri: frisch.uri, webUrl: frisch.webUrl, kind: frisch.kind, name: frisch.name, notes: frisch.notes });
  }
  res.json(frisch);
});

router.delete('/:id', requireDm, (req, res) => {
  const row = holen(req.params.id);
  if (!row) return res.status(404).json({ code: 'klang_nicht_gefunden', error: 'Ambiente nicht gefunden.' });

  db.prepare('DELETE FROM ambience WHERE id = ?').run(row.id);
  db.prepare('UPDATE maps SET ambience_id = NULL WHERE ambience_id = ?').run(row.id);
  // Was gelöscht ist, soll auch nicht mehr am Tisch stehen.
  if (aktuellerKlang().ambienceId === row.id) setzeKlang({});
  res.status(204).end();
});

// POST /api/ambience/:id/auflegen
router.post('/:id/auflegen', requireDm, (req, res) => {
  const klang = klangAuflegen(req.params.id);
  if (!klang) return res.status(404).json({ code: 'klang_nicht_gefunden', error: 'Ambiente nicht gefunden.' });
  res.json(klang);
});

// POST /api/ambience/stille – nichts liegt mehr auf.
router.post('/stille', requireDm, (req, res) => {
  chronik.log({ kind: 'klang', text: 'Die Musik verstummt.' });
  res.json(setzeKlang({}));
});

export default router;
