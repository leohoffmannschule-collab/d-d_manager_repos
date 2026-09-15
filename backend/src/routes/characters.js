import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { db, mediaDir } from '../db.js';
import { isDm, requireAuth, requireDm } from '../auth.js';
import { broadcast, originClient } from '../events.js';
import { sendeSzene } from './scenes.js';

const router = Router();

router.use(requireAuth);

function rowToCharacter(row) {
  return {
    id: row.id,
    name: row.name,
    system: row.system,
    data: JSON.parse(row.data),
    ownerId: row.owner_id,
    ownerName: row.owner_name ?? null,
    shared: !!row.shared,
    npc: !!row.npc,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Kurzfassung für Übersichten, Spieltisch und Kampfliste. */
function summary(row) {
  const character = rowToCharacter(row);
  const className = character.data?.className ?? '';
  const level = character.data?.level;
  return {
    id: character.id,
    name: character.name,
    system: character.system,
    ownerId: character.ownerId,
    ownerName: character.ownerName,
    shared: character.shared,
    npc: character.npc,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
    classLevel: [className, className && level ? level : ''].filter(Boolean).join(' '),
    race: character.data?.race ?? '',
    portrait: character.data?.portrait ?? '',
    hp: character.data?.combat?.hp ?? null,
    ac: character.data?.combat?.armorClass ?? null,
    initiative:
      Math.floor(((Number(character.data?.abilities?.dex) || 10) - 10) / 2) +
      (Number(character.data?.combat?.initiativeBonus) || 0),
  };
}

const SELECT = `SELECT c.*, u.name AS owner_name FROM characters c LEFT JOIN users u ON u.id = c.owner_id`;

const holen = (id, campaignId) => db.prepare(`${SELECT} WHERE c.id = ? AND c.campaign_id = ?`).get(id, campaignId);

// Charaktere ohne Besitzer stammen aus der Zeit vor den Konten – sie gehören
// der Spielleitung, bis sie jemandem zugewiesen werden.
const darfBearbeiten = (user, row) => isDm(user) || row.owner_id === user.id;

/**
 * NSC-Blätter sind der Zettel der Spielleitung hinter dem Schirm: die Werte
 * des Wirts, des Räuberhauptmanns, des Drachen. Sie bleiben dort, auch wenn
 * das Blatt versehentlich als „geteilt“ markiert ist – deshalb wird das hier
 * *vor* allen anderen Regeln geprüft, nicht danach.
 */
const darfSehen = (user, row) => {
  if (isDm(user)) return true;
  if (row.npc) return false;
  return row.owner_id === user.id || !!row.shared;
};

/** Die Sinne aus einem gespeicherten Blatt, ohne dass ein Fehler alles reißt. */
function sinneAus(rohesJson) {
  try {
    return JSON.parse(rohesJson)?.combat?.senses ?? null;
  } catch {
    return null;
  }
}

function meldeAenderung(row, req) {
  broadcast('charakter:aktualisiert', summary(row), { exceptClient: originClient(req), campaignId: req.campaignId });
}

// GET /api/characters – eigene Charaktere, dazu die geteilten der Mitspieler
router.get('/', (req, res) => {
  const rows = isDm(req.user)
    ? db.prepare(`${SELECT} WHERE c.campaign_id = ? ORDER BY c.updated_at DESC`).all(req.campaignId)
    : db
        .prepare(
          `${SELECT} WHERE c.campaign_id = ? AND c.npc = 0 AND (c.owner_id = ? OR c.shared = 1) ORDER BY c.updated_at DESC`
        )
        .all(req.campaignId, req.user.id);
  res.json(rows.map(summary));
});

// GET /api/characters/:id
router.get('/:id', (req, res) => {
  const row = holen(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'charakter_nicht_gefunden', error: 'Charakter nicht gefunden' });
  if (!darfSehen(req.user, row)) return res.status(403).json({ code: 'blatt_nicht_sichtbar', error: 'Dieses Blatt ist nicht für dich bestimmt.' });
  res.json({ ...rowToCharacter(row), editable: darfBearbeiten(req.user, row) });
});

// POST /api/characters – create
router.post('/', (req, res) => {
  const { name, system = 'dnd5e', data = {} } = req.body ?? {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ code: 'name_fehlt', error: 'Name ist erforderlich' });
  }
  // Ein NSC-Blatt ist nie geteilt – sonst wäre es keins.
  const npc = isDm(req.user) && req.body?.npc === true;
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO characters (id, name, system, data, owner_id, shared, npc, campaign_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, name.trim(), system, JSON.stringify(data), req.user.id, npc ? 0 : 1, npc ? 1 : 0, req.campaignId, now, now);
  const row = holen(id, req.campaignId);
  meldeAenderung(row, req);
  res.status(201).json(rowToCharacter(row));
});

// PUT /api/characters/:id – full update (autosave from the sheet editor)
router.put('/:id', (req, res) => {
  const existing = holen(req.params.id, req.campaignId);
  if (!existing) return res.status(404).json({ code: 'charakter_nicht_gefunden', error: 'Charakter nicht gefunden' });
  if (!darfBearbeiten(req.user, existing)) {
    return res.status(403).json({ code: 'blatt_fremd', error: 'Dieses Blatt gehört jemand anderem.' });
  }

  const { name, data } = req.body ?? {};
  const nextName = typeof name === 'string' && name.trim() ? name.trim() : existing.name;
  const nextData = data !== undefined ? JSON.stringify(data) : existing.data;
  const now = new Date().toISOString();

  // Die Sinne stehen auf dem Blatt, aber sie entscheiden, was am Spieltisch
  // im Dunkeln sichtbar ist. Wer sich Dunkelsicht einträgt, soll nicht erst
  // die Seite neu laden müssen. Verglichen wird, weil das Blatt bei jedem
  // Tastendruck speichert – und eine ganze Szene je Buchstabe wäre unsinnig.
  const sinneVorher = JSON.stringify(sinneAus(existing.data));
  const sinneNachher = JSON.stringify(sinneAus(nextData));

  db.prepare('UPDATE characters SET name = ?, data = ?, updated_at = ? WHERE id = ?').run(
    nextName,
    nextData,
    now,
    req.params.id
  );
  const row = holen(req.params.id, req.campaignId);

  // Trefferpunkte im Kampf mitziehen, damit die Spielleitung sofort sieht,
  // wenn jemand Schaden einträgt.
  const hp = JSON.parse(row.data)?.combat?.hp;
  if (hp && Number.isFinite(Number(hp.current))) {
    const linked = db.prepare('SELECT id FROM combatants WHERE character_id = ? AND campaign_id = ?').all(row.id, req.campaignId);
    for (const combatant of linked) {
      db.prepare('UPDATE combatants SET hp = ?, max_hp = ? WHERE id = ?').run(
        Number(hp.current) || 0,
        Number(hp.max) || 0,
        combatant.id
      );
    }
    if (linked.length) broadcast('kampf:aktualisiert', {}, { campaignId: req.campaignId });
  }

  if (sinneVorher !== sinneNachher) sendeSzene(req.campaignId);

  meldeAenderung(row, req);
  res.json(rowToCharacter(row));
});

// PATCH /api/characters/:id – Besitz und Sichtbarkeit
router.patch('/:id', (req, res) => {
  const existing = holen(req.params.id, req.campaignId);
  if (!existing) return res.status(404).json({ code: 'charakter_nicht_gefunden', error: 'Charakter nicht gefunden' });
  if (!darfBearbeiten(req.user, existing)) {
    return res.status(403).json({ code: 'blatt_fremd', error: 'Dieses Blatt gehört jemand anderem.' });
  }

  const { ownerId, shared, npc } = req.body ?? {};

  if (ownerId !== undefined) {
    // Nur die Spielleitung teilt Charaktere zu.
    if (!isDm(req.user)) return res.status(403).json({ code: 'nur_spielleitung', error: 'Das darf nur die Spielleitung.' });
    if (ownerId !== null && !db.prepare('SELECT id FROM users WHERE id = ?').get(ownerId)) {
      return res.status(400).json({ code: 'konto_nicht_gefunden', error: 'Konto nicht gefunden.' });
    }
    db.prepare('UPDATE characters SET owner_id = ? WHERE id = ?').run(ownerId, existing.id);
  }
  if (shared !== undefined) {
    db.prepare('UPDATE characters SET shared = ? WHERE id = ?').run(shared ? 1 : 0, existing.id);
  }
  if (npc !== undefined) {
    // Ein Blatt hinter den Schirm holen darf nur die Spielleitung – und wer
    // dort liegt, ist nicht mehr geteilt.
    if (!isDm(req.user)) return res.status(403).json({ code: 'nur_spielleitung', error: 'Das darf nur die Spielleitung.' });
    db.prepare('UPDATE characters SET npc = ?, shared = ? WHERE id = ?').run(npc ? 1 : 0, npc ? 0 : 1, existing.id);
  }

  const row = holen(existing.id, req.campaignId);
  meldeAenderung(row, req);
  res.json(rowToCharacter(row));
});

// DELETE /api/characters/:id
router.delete('/:id', (req, res) => {
  const existing = holen(req.params.id, req.campaignId);
  if (!existing) return res.status(404).json({ code: 'charakter_nicht_gefunden', error: 'Charakter nicht gefunden' });
  if (!darfBearbeiten(req.user, existing)) {
    return res.status(403).json({ code: 'blatt_fremd', error: 'Dieses Blatt gehört jemand anderem.' });
  }
  db.prepare('DELETE FROM characters WHERE id = ?').run(existing.id);
  broadcast('charakter:entfernt', { id: existing.id }, { campaignId: req.campaignId });
  res.status(204).end();
});

// POST /api/characters/:id/duplicate
router.post('/:id/duplicate', (req, res) => {
  const existing = holen(req.params.id, req.campaignId);
  if (!existing) return res.status(404).json({ code: 'charakter_nicht_gefunden', error: 'Charakter nicht gefunden' });
  if (!darfSehen(req.user, existing)) return res.status(403).json({ code: 'blatt_nicht_sichtbar', error: 'Dieses Blatt ist nicht für dich bestimmt.' });

  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO characters (id, name, system, data, owner_id, shared, campaign_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, `${existing.name} (Kopie)`, existing.system, existing.data, req.user.id, existing.shared, req.campaignId, now, now);
  const row = holen(id, req.campaignId);
  meldeAenderung(row, req);
  res.status(201).json(rowToCharacter(row));
});

/**
 * Ein Bild in eine andere Kampagne mitnehmen.
 *
 * Bildnisse stecken als Daten-URL im Blatt selbst und wandern von allein mit.
 * Nur die alte `miniMediaId` aus der entfernten Figurenschmiede zeigt noch auf
 * eine Datei – und Bilder gehören seit den Kampagnen zu genau einer. Ohne
 * diese Abschrift zeigte die Kopie ins Leere.
 */
function bildMitnehmen(mediaId, zielKampagne) {
  if (!mediaId) return null;
  const quelle = db.prepare('SELECT * FROM media WHERE id = ?').get(mediaId);
  if (!quelle) return null;

  const neueId = randomUUID();
  const endung = path.extname(quelle.filename);
  const datei = path.join(mediaDir, quelle.filename);
  if (!fs.existsSync(datei)) return null;

  fs.copyFileSync(datei, path.join(mediaDir, `${neueId}${endung}`));
  db.prepare('INSERT INTO media (id, filename, mime, bytes, campaign_id, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    neueId,
    `${neueId}${endung}`,
    quelle.mime,
    quelle.bytes,
    zielKampagne,
    new Date().toISOString()
  );
  return neueId;
}

/**
 * POST /api/characters/:id/kopieren  { campaignId }
 *
 * Dasselbe Blatt in einer anderen Kampagne – etwa, wenn die Runde dieselben
 * Helden in einer neuen Geschichte weiterspielt oder ein NSC ein zweites Mal
 * gebraucht wird. Kopiert wird, nicht verschoben: Das Blatt hier bleibt, wo
 * es ist, und beide gehen fortan getrennte Wege.
 */
router.post('/:id/kopieren', requireDm, (req, res) => {
  const quelle = holen(req.params.id, req.campaignId);
  if (!quelle) return res.status(404).json({ code: 'charakter_nicht_gefunden', error: 'Charakter nicht gefunden' });

  const ziel = req.body?.campaignId;
  if (ziel === req.campaignId) {
    return res.status(400).json({
      code: 'gleiche_kampagne',
      error: 'Das wäre dieselbe Kampagne – dafür gibt es die Abschrift.',
    });
  }
  // Nur in Kampagnen, in denen die Spielleitung selbst sitzt: Wer nicht
  // hineinsieht, soll auch nichts hineinlegen können.
  const dabei = db
    .prepare(
      `SELECT c.id FROM campaigns c
         JOIN campaign_members m ON m.campaign_id = c.id
        WHERE c.id = ? AND m.user_id = ? AND c.deleted_at IS NULL`
    )
    .get(ziel, req.user.id);
  if (!dabei) {
    return res.status(403).json({ code: 'ziel_unbekannt', error: 'In diese Kampagne kannst du nichts legen.' });
  }

  const data = JSON.parse(quelle.data);
  const mini = bildMitnehmen(data.miniMediaId, ziel);
  if (mini) data.miniMediaId = mini;
  else if (data.miniMediaId) delete data.miniMediaId;

  // Der Besitzer zieht nur mit, wenn er in der Zielkampagne überhaupt
  // mitspielt – sonst gehört das Blatt dort der Spielleitung.
  const besitzerBleibt =
    quelle.owner_id &&
    db.prepare('SELECT 1 FROM campaign_members WHERE campaign_id = ? AND user_id = ?').get(ziel, quelle.owner_id);

  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO characters (id, name, system, data, owner_id, shared, npc, campaign_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, quelle.name, quelle.system, JSON.stringify(data), besitzerBleibt ? quelle.owner_id : null, quelle.shared, quelle.npc, ziel, now, now);

  // Die Zielkampagne sieht das neue Blatt sofort – wer dort gerade offen hat,
  // soll nicht erst neu laden müssen.
  const kopie = holen(id, ziel);
  broadcast('charakter:aktualisiert', summary(kopie), { campaignId: ziel });
  res.status(201).json({ id, name: kopie.name, campaignId: ziel, besitzerMitgenommen: !!besitzerBleibt });
});

// GET /api/characters/:id/all – Rohdaten aller Blätter für die Spielleitung
router.get('/verwaltung/alle', requireDm, (req, res) => {
  res.json(db.prepare(`${SELECT} WHERE c.campaign_id = ? ORDER BY c.name COLLATE NOCASE`).all(req.campaignId).map(summary));
});

export default router;
