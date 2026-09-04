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
 * Der Server spielt selbst keine Musik und kennt auch niemandes Spotify-Konto.
 * Er hält nur fest, *was* gerade laufen soll – eine Adresse wie
 * `spotify:playlist:…`, dazu Zufallswiedergabe und eine Lautstärke. Wer
 * zuhören will, verbindet sein eigenes Spotify im Browser; der Ton entsteht
 * dort. Das ist keine Bequemlichkeit, sondern Absicht: So liegen auf dem Pi
 * keine fremden Zugangsdaten, und die Runde spielt aus fünf Wohnzimmern
 * trotzdem unter derselben Musik.
 */

const ZUGANG = process.env.SPOTIFY_CLIENT_ID || '';

const TYPEN = new Set(['playlist', 'album', 'track', 'artist']);
const KENNUNG = /^[A-Za-z0-9]{22}$/;

/**
 * Aus dem, was der DM einfügt, eine saubere Spotify-Adresse machen.
 *
 * Erlaubt sind der Teilen-Link aus der App (auch mit Sprachkürzel wie
 * `/intl-de/` und angehängtem `?si=…`) und die rohe URI. Alles andere fällt
 * durch: Diese Zeichenkette geben wir später jedem Browser der Runde zum
 * Abspielen, sie soll also nichts anderes sein können als eine Adresse bei
 * Spotify.
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

const clamp = (wert, min, max) => Math.min(max, Math.max(min, wert));
const zahl = (wert, ersatz) => (Number.isFinite(Number(wert)) ? Number(wert) : ersatz);

const sauber = (t) => typeof t === 'string' && t.trim();
const schlagworte = (liste) =>
  Array.isArray(liste) ? liste.filter(sauber).map((t) => t.trim().slice(0, 40)).slice(0, 12) : [];

function rowToKlang(row) {
  return {
    id: row.id,
    name: row.name,
    uri: row.uri,
    kind: row.kind,
    imageUrl: row.image_url,
    tags: JSON.parse(row.tags),
    shuffle: !!row.shuffle,
    volume: row.volume,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

const holen = (id) => db.prepare('SELECT * FROM ambience WHERE id = ?').get(id);

/* --- Was gerade läuft ---------------------------------------------------- */

const STILLE = { ambienceId: null, uri: null, kind: null, name: '', imageUrl: '', shuffle: true, volume: 45, playing: false, startedAt: null };

export const aktuellerKlang = () => ({ ...STILLE, ...(getState('klang') ?? {}) });

function sendeKlang(klang) {
  broadcast('klang', klang);
  return klang;
}

/**
 * Den Klangteppich setzen. `playing: false` heißt Pause, `uri: null` Stille.
 * Beides geht an alle Fenster – auch an das auslösende, denn der DM hört ja
 * selbst mit.
 */
function setzeKlang(werte) {
  return sendeKlang(setState('klang', { ...aktuellerKlang(), ...werte }));
}

/** Wird von anderen Zweigen gebraucht: Eine Karte bringt ihre Ambiente mit. */
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
    kind: eintrag.kind,
    name: eintrag.name,
    imageUrl: eintrag.imageUrl,
    shuffle: eintrag.shuffle,
    volume: eintrag.volume,
    playing: true,
    startedAt: new Date().toISOString(),
  });
}

/* --- Zweige -------------------------------------------------------------- */

/**
 * GET /api/ambience/einrichtung
 *
 * Die Kennung der Spotify-Anwendung. Sie ist nicht geheim – bei der
 * Anmeldung mit PKCE steht sie ohnehin in der Adresszeile –, aber sie sagt
 * der Oberfläche, ob überhaupt etwas eingerichtet ist.
 */
router.get('/einrichtung', (req, res) => {
  res.json({ clientId: ZUGANG, eingerichtet: !!ZUGANG });
});

// GET /api/ambience/aktiv – die ganze Runde darf wissen, was läuft.
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
    `INSERT INTO ambience (id, name, uri, kind, image_url, tags, shuffle, volume, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    body.name.trim().slice(0, 120),
    adresse.uri,
    adresse.kind,
    typeof body.imageUrl === 'string' ? body.imageUrl.slice(0, 500) : '',
    JSON.stringify(schlagworte(body.tags)),
    body.shuffle === false ? 0 : 1,
    clamp(Math.round(zahl(body.volume, 45)), 0, 100),
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

  db.prepare(
    `UPDATE ambience SET name = ?, uri = ?, kind = ?, image_url = ?, tags = ?, shuffle = ?, volume = ?, notes = ?
       WHERE id = ?`
  ).run(
    sauber(body.name) ? body.name.trim().slice(0, 120) : row.name,
    uri,
    kind,
    typeof body.imageUrl === 'string' ? body.imageUrl.slice(0, 500) : row.image_url,
    'tags' in body ? JSON.stringify(schlagworte(body.tags)) : row.tags,
    'shuffle' in body ? (body.shuffle ? 1 : 0) : row.shuffle,
    'volume' in body ? clamp(Math.round(zahl(body.volume, row.volume)), 0, 100) : row.volume,
    typeof body.notes === 'string' ? body.notes.slice(0, 2000) : row.notes,
    row.id
  );

  const frisch = rowToKlang(holen(row.id));
  // Läuft gerade genau dieses Stück, wandert die Änderung sofort mit – sonst
  // stünde in der Leiste der Runde noch der alte Name oder die alte Lautstärke.
  if (aktuellerKlang().ambienceId === frisch.id) {
    setzeKlang({ uri: frisch.uri, kind: frisch.kind, name: frisch.name, imageUrl: frisch.imageUrl, volume: frisch.volume });
  }
  res.json(frisch);
});

router.delete('/:id', requireDm, (req, res) => {
  const row = holen(req.params.id);
  if (!row) return res.status(404).json({ code: 'klang_nicht_gefunden', error: 'Ambiente nicht gefunden.' });

  db.prepare('DELETE FROM ambience WHERE id = ?').run(row.id);
  db.prepare('UPDATE maps SET ambience_id = NULL WHERE ambience_id = ?').run(row.id);
  // Was gelöscht ist, soll nicht weiterlaufen.
  if (aktuellerKlang().ambienceId === row.id) setzeKlang({ ...STILLE });
  res.status(204).end();
});

// POST /api/ambience/:id/auflegen
router.post('/:id/auflegen', requireDm, (req, res) => {
  const klang = klangAuflegen(req.params.id);
  if (!klang) return res.status(404).json({ code: 'klang_nicht_gefunden', error: 'Ambiente nicht gefunden.' });
  res.json(klang);
});

// POST /api/ambience/pause | /weiter | /stille
router.post('/pause', requireDm, (req, res) => res.json(setzeKlang({ playing: false })));

router.post('/weiter', requireDm, (req, res) => {
  const jetzt = aktuellerKlang();
  if (!jetzt.uri) return res.status(409).json({ code: 'nichts_aufgelegt', error: 'Es ist nichts aufgelegt.' });
  res.json(setzeKlang({ playing: true }));
});

router.post('/stille', requireDm, (req, res) => {
  chronik.log({ kind: 'klang', text: 'Die Musik verstummt.' });
  res.json(setzeKlang({ ...STILLE }));
});

/**
 * POST /api/ambience/lautstaerke – die Lautstärke *dieser Auflage*.
 *
 * Sie ist ein Vorschlag des DM, mit dem er Kampfmusik gegen Schankraum
 * abstimmt. Wie laut es am Ende wird, entscheidet jeder für sich in der
 * eigenen Klangleiste.
 */
router.post('/lautstaerke', requireDm, (req, res) => {
  const jetzt = aktuellerKlang();
  const volume = clamp(Math.round(zahl(req.body?.volume, jetzt.volume)), 0, 100);
  // Wo die Ambiente herkommt, merkt sie sich den neuen Pegel gleich mit.
  if (jetzt.ambienceId) db.prepare('UPDATE ambience SET volume = ? WHERE id = ?').run(volume, jetzt.ambienceId);
  res.json(setzeKlang({ volume }));
});

export default router;
