import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, getState, setState } from '../db.js';
import { isDm, requireAuth, requireDm } from '../auth.js';
import { broadcast, originClient, presence } from '../events.js';
import * as chronik from '../chronicle.js';
import { figurenFeld, sichtFelder } from '../sicht.js';

const router = Router();
router.use(requireAuth);

const toNumber = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/* --- Umwandlung ---------------------------------------------------------- */

function rowToScene(row) {
  return {
    id: row.id,
    name: row.name,
    mediaId: row.media_id,
    width: row.width,
    height: row.height,
    gridSize: row.grid_size,
    gridOffsetX: row.grid_offset_x,
    gridOffsetY: row.grid_offset_y,
    gridVisible: !!row.grid_visible,
    fogEnabled: !!row.fog_enabled,
    dark: !!row.dark,
    mapId: row.map_id,
    fog: JSON.parse(row.fog),
    createdAt: row.created_at,
  };
}

function rowToToken(row) {
  return {
    id: row.id,
    sceneId: row.scene_id,
    name: row.name,
    x: row.x,
    y: row.y,
    size: row.size,
    color: row.color,
    mediaId: row.media_id,
    characterId: row.character_id,
    combatantId: row.combatant_id,
    hidden: !!row.hidden,
    lightBright: row.light_bright ?? 0,
    lightDim: row.light_dim ?? 0,
  };
}

const holeSzene = (id) => db.prepare('SELECT * FROM scenes WHERE id = ?').get(id);
const holeFigur = (id) => db.prepare('SELECT * FROM tokens WHERE id = ?').get(id);
const aktiveSzeneId = () => getState('szene', null);

function figuren(sceneId) {
  return db.prepare('SELECT * FROM tokens WHERE scene_id = ? ORDER BY created_at').all(sceneId).map(rowToToken);
}

/* --- Wer sieht was? ------------------------------------------------------ */

/**
 * Die Sinne hinter den Figuren. Eine Figur sieht, was ihr Charakterblatt
 * hergibt – Dunkelsicht, Blindsicht und was sonst noch eingetragen ist.
 */
function sinneJeFigur(tokens) {
  const kennungen = [...new Set(tokens.map((t) => t.characterId).filter(Boolean))];
  const sinne = new Map();
  if (kennungen.length === 0) return sinne;

  const platzhalter = kennungen.map(() => '?').join(',');
  const blaetter = db.prepare(`SELECT id, data FROM characters WHERE id IN (${platzhalter})`).all(...kennungen);
  const jeCharakter = new Map();
  for (const blatt of blaetter) {
    try {
      jeCharakter.set(blatt.id, JSON.parse(blatt.data)?.combat?.senses ?? null);
    } catch {
      jeCharakter.set(blatt.id, null);
    }
  }
  for (const token of tokens) {
    if (token.characterId) sinne.set(token.id, jeCharakter.get(token.characterId) ?? null);
  }
  return sinne;
}

/** Steht diese Figur auf einem Feld, das der Betrachter sehen kann? */
function figurSichtbar(token, szene, offen, sicht) {
  const { fx, fy } = figurenFeld(token, szene);
  const feld = `${fx},${fy}`;
  // Was die Spielleitung nie aufgedeckt hat, steht auch nicht im Datenstrom.
  // Bisher lag der Nebel nur *über* der Figur – das war Kulisse, keine Deckung.
  if (szene.fogEnabled && !offen.has(feld)) return false;
  if (sicht && !sicht.has(feld)) return false;
  return true;
}

/**
 * Was von dieser Szene geht an diese Person?
 *
 * Die Spielleitung sieht alles – es sei denn, sie schaut gerade durch die
 * Augen einer ihrer Figuren (NSC-Steuerung). Dann gilt für sie dieselbe
 * Rechnung wie für die Runde, und zwar buchstäblich dieselbe: Es gibt nur
 * diese eine Stelle, an der Sicht entsteht.
 */
function szenenSicht(user) {
  const id = aktiveSzeneId();
  if (!id) return null;
  const row = holeSzene(id);
  if (!row) return null;

  const szene = rowToScene(row);
  const alle = figuren(szene.id);
  const offen = new Set(szene.fog);
  const durchAugen = durchAugenVon(user, alle);

  if (isDm(user) && !durchAugen) {
    return { ...szene, tokens: alle, sicht: null, nscSicht: null, aktiv: true };
  }

  const eigene = durchAugen ? [durchAugen] : meineFiguren(user, alle);
  const sicht = sichtFelder(szene, alle, eigene, sinneJeFigur(alle));
  const eigeneKennungen = new Set(eigene.map((t) => t.id));

  const sichtbar = alle.filter((token) => {
    if (eigeneKennungen.has(token.id)) return true;
    if (!durchAugen && token.hidden) return false;
    return figurSichtbar(token, szene, offen, sicht);
  });

  return {
    ...szene,
    tokens: sichtbar,
    sicht: sicht ? [...sicht] : null,
    nscSicht: durchAugen?.id ?? null,
    aktiv: true,
  };
}

/** Die Figuren, die dieser Person gehören. */
function meineFiguren(user, alle) {
  const meine = db.prepare('SELECT id FROM characters WHERE owner_id = ?').all(user.id).map((c) => c.id);
  if (meine.length === 0) return [];
  const gehoert = new Set(meine);
  return alle.filter((t) => t.characterId && gehoert.has(t.characterId));
}

/** Schaut die Spielleitung gerade durch die Augen einer Figur? */
function durchAugenVon(user, alle) {
  if (!isDm(user)) return null;
  const kennung = getState('nsc_sicht', null);
  return kennung ? (alle.find((t) => t.id === kennung) ?? null) : null;
}

export function sendeSzene() {
  broadcast('szene', szenenSicht({ role: 'sl' }), { role: 'sl' });
  // Jede Person am Tisch sieht etwas anderes – also bekommt auch jede ihre
  // eigene Fassung. Nur wer verbunden ist, bekommt überhaupt eine.
  for (const person of presence()) {
    if (person.role === 'sl') continue;
    broadcast('szene', szenenSicht(person), { userIds: [person.id] });
  }
  merkeFiguren();
}

/**
 * Nach einem Nebelstrich wandert nur die Änderung übers Netz – aber wenn
 * dabei eine Figur auftaucht oder verschwindet, muss auch das ankommen.
 * Gesendet wird nur, wenn sich wirklich etwas geändert hat; ein Pinselstrich
 * über schon aufgedecktes Land soll nicht fünf Figurenlisten auslösen.
 */
const letzteFiguren = new Map();

function figurenKennung(sicht) {
  return (sicht?.tokens ?? []).map((t) => t.id).join('|');
}

function merkeFiguren() {
  for (const person of presence()) {
    letzteFiguren.set(person.id, figurenKennung(szenenSicht(person)));
  }
}

export function sendeFigurenWennGeaendert() {
  for (const person of presence()) {
    const sicht = szenenSicht(person);
    const kennung = figurenKennung(sicht);
    if (letzteFiguren.get(person.id) === kennung) continue;
    letzteFiguren.set(person.id, kennung);
    broadcast('figuren', sicht?.tokens ?? [], { userIds: [person.id] });
  }
}

/** Darf diese Person die Figur bewegen? */
function darfBewegen(user, tokenRow) {
  if (isDm(user)) return true;
  if (tokenRow.hidden) return false;
  if (!tokenRow.character_id) return false;
  const character = db.prepare('SELECT owner_id FROM characters WHERE id = ?').get(tokenRow.character_id);
  return character?.owner_id === user.id;
}

/**
 * Eine Figur hat sich geändert.
 *
 * Früher genügte es, die eine Figur zu schicken. Seit die Sicht an Positionen
 * und Lichtquellen hängt, ändert ein Schritt zur Seite womöglich, was die
 * halbe Runde sieht – also geht die ganze Szene neu hinaus. Das passiert beim
 * Loslassen, nicht während des Ziehens, und kostet deshalb nichts.
 *
 * Nur das auslösende Fenster bekommt seine eigene Figur zurückgemeldet,
 * damit die gezogene Figur nicht kurz zurückspringt.
 */
function meldeFigur(row, req) {
  // Schaut die Spielleitung durch fremde Augen, gilt für sie dieselbe
  // Rechnung wie für die Runde – dann genügt die einzelne Figur nicht.
  if (getState('nsc_sicht', null)) {
    broadcast('szene', szenenSicht({ role: 'sl' }), { role: 'sl' });
  } else {
    broadcast('figur', rowToToken(row), { role: 'sl', exceptClient: originClient(req) });
  }

  for (const person of presence()) {
    if (person.role === 'sl') continue;
    broadcast('szene', szenenSicht(person), { userIds: [person.id] });
  }
  merkeFiguren();
}

/* --- Szenen -------------------------------------------------------------- */

// GET /api/scenes – die Spielleitung sieht alle, die Runde nur die aktive
router.get('/', (req, res) => {
  if (!isDm(req.user)) return res.json(szenenSicht(req.user) ? [szenenSicht(req.user)] : []);
  const aktiv = aktiveSzeneId();
  res.json(
    db
      .prepare('SELECT * FROM scenes ORDER BY created_at DESC')
      .all()
      .map((row) => ({ ...rowToScene(row), aktiv: row.id === aktiv, tokenCount: figuren(row.id).length }))
  );
});

// GET /api/scenes/aktiv – was gerade auf dem Tisch liegt
router.get('/aktiv', (req, res) => {
  res.json(szenenSicht(req.user));
});

router.post('/', requireDm, (req, res) => {
  const body = req.body ?? {};
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return res.status(400).json({ code: 'name_fehlt', error: 'Name ist erforderlich.' });
  }
  const id = randomUUID();
  db.prepare(
    `INSERT INTO scenes (id, name, media_id, width, height, grid_size, grid_offset_x, grid_offset_y,
                         grid_visible, fog_enabled, fog, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, 1, ?, '[]', ?)`
  ).run(
    id,
    body.name.trim().slice(0, 100),
    body.mediaId ?? null,
    toNumber(body.width, 0),
    toNumber(body.height, 0),
    clamp(toNumber(body.gridSize, 70), 10, 500),
    body.fogEnabled === false ? 0 : 1,
    new Date().toISOString()
  );
  // Die erste Szene kommt gleich auf den Tisch.
  if (!aktiveSzeneId()) setState('szene', id);
  sendeSzene();
  res.status(201).json(rowToScene(holeSzene(id)));
});

router.put('/:id', requireDm, (req, res) => {
  const row = holeSzene(req.params.id);
  if (!row) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });
  const body = req.body ?? {};

  db.prepare(
    `UPDATE scenes SET name = ?, media_id = ?, width = ?, height = ?, grid_size = ?,
            grid_offset_x = ?, grid_offset_y = ?, grid_visible = ?, fog_enabled = ?, dark = ?
       WHERE id = ?`
  ).run(
    typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 100) : row.name,
    'mediaId' in body ? (body.mediaId ?? null) : row.media_id,
    'width' in body ? toNumber(body.width, row.width) : row.width,
    'height' in body ? toNumber(body.height, row.height) : row.height,
    'gridSize' in body ? clamp(toNumber(body.gridSize, row.grid_size), 10, 500) : row.grid_size,
    'gridOffsetX' in body ? clamp(toNumber(body.gridOffsetX, row.grid_offset_x), -500, 500) : row.grid_offset_x,
    'gridOffsetY' in body ? clamp(toNumber(body.gridOffsetY, row.grid_offset_y), -500, 500) : row.grid_offset_y,
    'gridVisible' in body ? (body.gridVisible ? 1 : 0) : row.grid_visible,
    'fogEnabled' in body ? (body.fogEnabled ? 1 : 0) : row.fog_enabled,
    'dark' in body ? (body.dark ? 1 : 0) : row.dark,
    row.id
  );
  sendeSzene();
  res.json(rowToScene(holeSzene(row.id)));
});

router.delete('/:id', requireDm, (req, res) => {
  const row = holeSzene(req.params.id);
  if (!row) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });
  db.prepare('DELETE FROM scenes WHERE id = ?').run(row.id);
  if (aktiveSzeneId() === row.id) {
    setState('szene', db.prepare('SELECT id FROM scenes ORDER BY created_at DESC').get()?.id ?? null);
  }
  sendeSzene();
  res.status(204).end();
});

/** Eine Szene auf den Tisch legen – auch aus der Kartenbibliothek heraus. */
export function aktiviereSzene(row) {
  setState('szene', row.id);
  chronik.log({ kind: 'szene', text: `Die Runde erreicht: ${row.name}.`, meta: { sceneId: row.id, name: row.name } });
  sendeSzene();
}

// POST /api/scenes/:id/aktivieren – Szene auf den Tisch legen
router.post('/:id/aktivieren', requireDm, (req, res) => {
  const row = holeSzene(req.params.id);
  if (!row) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });
  aktiviereSzene(row);
  res.json(rowToScene(row));
});

/**
 * POST /api/scenes/nsc-sicht  { tokenId }
 *
 * Die Spielleitung sieht das Brett standardmäßig ganz – sie muss ja wissen,
 * was hinter dem Hügel steht. Manchmal will sie aber genau das Gegenteil:
 * sehen, was ihr Späher sieht, bevor sie ihn losschickt.
 *
 * Gerechnet wird das nicht im Browser, sondern hier – mit derselben Funktion,
 * die auch für die Runde rechnet. Ein Vorschaubild, das anders rechnet als
 * das Original, wäre keine Hilfe, sondern eine Falle.
 *
 * `tokenId: null` schaltet zurück auf die Vogelperspektive.
 */
router.post('/nsc-sicht', requireDm, (req, res) => {
  const kennung = req.body?.tokenId ?? null;
  if (kennung !== null) {
    const figur = holeFigur(kennung);
    if (!figur) return res.status(404).json({ code: 'figur_nicht_gefunden', error: 'Figur nicht gefunden.' });
    if (figur.scene_id !== aktiveSzeneId()) {
      return res.status(409).json({ code: 'figur_andere_szene', error: 'Diese Figur steht nicht auf dem Tisch.' });
    }
  }
  setState('nsc_sicht', kennung);
  broadcast('szene', szenenSicht({ role: 'sl' }), { role: 'sl' });
  res.json({ nscSicht: kennung });
});

/* --- Nebel des Krieges --------------------------------------------------- */

const MAX_FELDER = 40000;

// POST /api/scenes/:id/nebel  { cells: ['3,4', …], revealed: true }
router.post('/:id/nebel', requireDm, (req, res) => {
  const row = holeSzene(req.params.id);
  if (!row) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });

  const cells = Array.isArray(req.body?.cells)
    ? req.body.cells.filter((c) => typeof c === 'string' && /^-?\d+,-?\d+$/.test(c)).slice(0, 4000)
    : [];
  if (cells.length === 0) return res.json({ ok: true });

  const revealed = req.body?.revealed !== false;
  const offen = new Set(JSON.parse(row.fog));
  for (const cell of cells) {
    if (revealed) offen.add(cell);
    else offen.delete(cell);
  }

  const naechste = [...offen].slice(0, MAX_FELDER);
  db.prepare('UPDATE scenes SET fog = ? WHERE id = ?').run(JSON.stringify(naechste), row.id);

  // Nur die Änderung wandert übers Netz, nicht die ganze Karte.
  broadcast('nebel', { sceneId: row.id, cells, revealed }, { exceptClient: originClient(req) });
  // Deckt der Strich eine Figur auf oder wieder zu, muss auch das ankommen.
  sendeFigurenWennGeaendert();
  res.json({ ok: true, offen: naechste.length });
});

// POST /api/scenes/:id/nebel/alles  { revealed: true|false }
router.post('/:id/nebel/alles', requireDm, (req, res) => {
  const row = holeSzene(req.params.id);
  if (!row) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });
  const revealed = req.body?.revealed === true;

  let fog = [];
  if (revealed) {
    // Dieselbe Feldrechnung wie im Browser: Bei verschobenem Raster fängt
    // das erste Feld links oben bei einem negativen Index an.
    const g = row.grid_size;
    const minX = Math.floor(-row.grid_offset_x / g);
    const minY = Math.floor(-row.grid_offset_y / g);
    const maxX = Math.floor((Math.max(1, row.width) - 1 - row.grid_offset_x) / g);
    const maxY = Math.floor((Math.max(1, row.height) - 1 - row.grid_offset_y) / g);
    for (let y = minY; y <= maxY && fog.length < MAX_FELDER; y++) {
      for (let x = minX; x <= maxX && fog.length < MAX_FELDER; x++) fog.push(`${x},${y}`);
    }
  }
  db.prepare('UPDATE scenes SET fog = ? WHERE id = ?').run(JSON.stringify(fog), row.id);
  sendeSzene();
  res.json({ ok: true, offen: fog.length });
});

/* --- Figuren ------------------------------------------------------------- */

router.post('/:id/figuren', requireDm, (req, res) => {
  const szene = holeSzene(req.params.id);
  if (!szene) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });

  const body = req.body ?? {};
  const id = randomUUID();
  db.prepare(
    `INSERT INTO tokens (id, scene_id, name, x, y, size, color, media_id, character_id, combatant_id,
                         hidden, light_bright, light_dim, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    szene.id,
    typeof body.name === 'string' ? body.name.slice(0, 60) : '',
    toNumber(body.x, 0),
    toNumber(body.y, 0),
    clamp(toNumber(body.size, 1), 1, 6),
    /^#[0-9a-f]{6}$/i.test(body.color ?? '') ? body.color : '#9a2b22',
    body.mediaId ?? null,
    body.characterId ?? null,
    body.combatantId ?? null,
    body.hidden ? 1 : 0,
    clamp(toNumber(body.lightBright, 0), 0, 200),
    clamp(toNumber(body.lightDim, 0), 0, 200),
    new Date().toISOString()
  );
  const row = holeFigur(id);
  meldeFigur(row, req);
  res.status(201).json(rowToToken(row));
});

// PATCH /api/scenes/figuren/:id – Bewegen darf auch, wem die Figur gehört
router.patch('/figuren/:id', (req, res) => {
  const row = holeFigur(req.params.id);
  if (!row) return res.status(404).json({ code: 'figur_nicht_gefunden', error: 'Figur nicht gefunden.' });
  if (!darfBewegen(req.user, row)) return res.status(403).json({ code: 'figur_fremd', error: 'Diese Figur gehört jemand anderem.' });

  const body = req.body ?? {};
  const nurBewegen = !isDm(req.user);

  db.prepare(
    `UPDATE tokens SET x = ?, y = ?, name = ?, size = ?, color = ?, media_id = ?, hidden = ?,
            light_bright = ?, light_dim = ? WHERE id = ?`
  ).run(
    'x' in body ? toNumber(body.x, row.x) : row.x,
    'y' in body ? toNumber(body.y, row.y) : row.y,
    !nurBewegen && typeof body.name === 'string' ? body.name.slice(0, 60) : row.name,
    !nurBewegen && 'size' in body ? clamp(toNumber(body.size, row.size), 1, 6) : row.size,
    !nurBewegen && /^#[0-9a-f]{6}$/i.test(body.color ?? '') ? body.color : row.color,
    !nurBewegen && 'mediaId' in body ? (body.mediaId ?? null) : row.media_id,
    !nurBewegen && 'hidden' in body ? (body.hidden ? 1 : 0) : row.hidden,
    !nurBewegen && 'lightBright' in body ? clamp(toNumber(body.lightBright, row.light_bright), 0, 200) : row.light_bright,
    !nurBewegen && 'lightDim' in body ? clamp(toNumber(body.lightDim, row.light_dim), 0, 200) : row.light_dim,
    row.id
  );

  const next = holeFigur(row.id);
  meldeFigur(next, req);
  res.json(rowToToken(next));
});

router.delete('/figuren/:id', requireDm, (req, res) => {
  const row = holeFigur(req.params.id);
  if (!row) return res.status(404).json({ code: 'figur_nicht_gefunden', error: 'Figur nicht gefunden.' });
  db.prepare('DELETE FROM tokens WHERE id = ?').run(row.id);
  // Mit der Figur geht womöglich ihre Fackel – das ändert, was alle sehen.
  if (getState('nsc_sicht', null) === row.id) setState('nsc_sicht', null);
  broadcast('figur:entfernt', { id: row.id }, { role: 'sl' });
  sendeSzene();
  res.status(204).end();
});

// POST /api/scenes/:id/figuren/aus-kampf – alle Kämpfer als Figuren auslegen
router.post('/:id/figuren/aus-kampf', requireDm, (req, res) => {
  const szene = holeSzene(req.params.id);
  if (!szene) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });

  const vorhanden = new Set(
    db
      .prepare('SELECT combatant_id FROM tokens WHERE scene_id = ? AND combatant_id IS NOT NULL')
      .all(szene.id)
      .map((r) => r.combatant_id)
  );
  const kaempfer = db.prepare('SELECT * FROM combatants ORDER BY initiative DESC').all();
  const now = new Date().toISOString();
  const raster = szene.grid_size;

  let platz = 0;
  const einfuegen = db.prepare(
    `INSERT INTO tokens (id, scene_id, name, x, y, size, color, media_id, character_id, combatant_id, hidden, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`
  );

  for (const k of kaempfer) {
    if (vorhanden.has(k.id)) continue;
    // In einer Reihe am oberen Rand ablegen; die Spielleitung schiebt sie
    // dann an ihren Platz.
    einfuegen.run(
      randomUUID(),
      szene.id,
      k.name,
      (platz % 12) * raster,
      Math.floor(platz / 12) * raster,
      k.type === 'pc' ? '#2d4f7c' : k.type === 'npc' ? '#2f6b4f' : '#9a2b22',
      // Wer eine Figur gegossen hat, steht damit auf der Karte.
      k.media_id ?? null,
      k.character_id,
      k.id,
      k.hidden,
      now
    );
    platz += 1;
  }

  sendeSzene();
  res.status(201).json({ created: platz });
});

/* --- Zeigen -------------------------------------------------------------- */

// POST /api/scenes/ping – ein kurzes Aufleuchten für alle, nichts wird gespeichert
router.post('/ping', (req, res) => {
  const body = req.body ?? {};
  broadcast('ping', {
    x: toNumber(body.x, 0),
    y: toNumber(body.y, 0),
    color: req.user.color,
    name: req.user.name,
    at: Date.now(),
  });
  res.status(204).end();
});

export default router;
