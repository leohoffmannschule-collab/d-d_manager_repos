/**
 * Notizen und Handzettel.
 *
 * Ein und dieselbe Sache in zwei Zuständen, unterschieden durch
 * `visibility`:
 *
 *   'sl'    – geheime Vorbereitung. Ein Spielerfenster bekommt sie nicht
 *             einmal in der Liste zu sehen.
 *   'runde' – ausgeteilter Handzettel. Steht am Spieltisch im Reiter
 *             „Handzettel“ und wird in der Chronik vermerkt.
 *
 * Austeilen und Einziehen ist also nur das Umlegen eines Feldes – deshalb
 * gibt es dafür keinen eigenen Weg, sondern ein gewöhnliches `PUT`.
 *
 * Notizen gehören zu **einer** Kampagne: Ein Steckbrief passt nicht von
 * selbst in eine andere Geschichte. Was doch überall gelten soll –
 * Hausregeln etwa –, lässt sich hinüberkopieren (`/:id/kopieren`).
 */
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { isDm, requireAuth, requireDm } from '../auth.js';
import { broadcast } from '../events.js';
import * as chronik from '../chronicle.js';
import { kopiereNotiz, meldeNachZiel, zielPruefen } from '../uebernehmen.js';
import { texte } from '../werte.js';

const router = Router();
router.use(requireAuth);

// 'sl' = geheime Vorbereitung, 'runde' = ausgeteiltes Handout für alle.
const SICHTBARKEIT = new Set(['sl', 'runde']);

const holen = (id, campaignId) => db.prepare('SELECT * FROM notes WHERE id = ? AND campaign_id = ?').get(id, campaignId);

/** Ein Zettel ist eben ausgeteilt worden – das gehört ins Protokoll des Abends. */
function ausgeteilt(note, campaignId) {
  chronik.log(
    { kind: 'handzettel', text: `Die Runde erhält: „${note.title}“.`, meta: { noteId: note.id, title: note.title } },
    campaignId
  );
}

function rowToNote(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tags: JSON.parse(row.tags),
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/notes – die Spielleitung bekommt alles, die Runde nur die
// ausgeteilten Handzettel (`visibility = 'runde'`).
router.get('/', (req, res) => {
  const rows = isDm(req.user)
    ? db.prepare('SELECT * FROM notes WHERE campaign_id = ? ORDER BY updated_at DESC').all(req.campaignId)
    : db
        .prepare("SELECT * FROM notes WHERE campaign_id = ? AND visibility = 'runde' ORDER BY updated_at DESC")
        .all(req.campaignId);
  res.json(rows.map(rowToNote));
});

// POST /api/notes  { title, content?, tags?, visibility? } – eine Notiz
// anlegen; ohne Angabe bleibt sie hinter dem Schirm. Wird sie gleich
// ausgeteilt, erfährt es die Runde sofort und die Chronik vermerkt es.
router.post('/', requireDm, (req, res) => {
  const body = req.body ?? {};
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return res.status(400).json({ code: 'titel_fehlt', error: 'Titel ist erforderlich.' });
  }
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO notes (id, title, content, tags, visibility, campaign_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    body.title.trim().slice(0, 150),
    typeof body.content === 'string' ? body.content.slice(0, 20000) : '',
    JSON.stringify(texte(body.tags)),
    SICHTBARKEIT.has(body.visibility) ? body.visibility : 'sl',
    req.campaignId,
    now,
    now
  );
  const note = rowToNote(holen(id, req.campaignId));
  if (note.visibility === 'runde') {
    broadcast('notizen:aktualisiert', {}, { campaignId: req.campaignId });
    ausgeteilt(note, req.campaignId);
  }
  res.status(201).json(note);
});

// PUT /api/notes/:id – ändern, austeilen oder zurückziehen.
router.put('/:id', requireDm, (req, res) => {
  const row = holen(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'notiz_nicht_gefunden', error: 'Notiz nicht gefunden.' });

  const body = req.body ?? {};
  db.prepare('UPDATE notes SET title = ?, content = ?, tags = ?, visibility = ?, updated_at = ? WHERE id = ?').run(
    typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 150) : row.title,
    typeof body.content === 'string' ? body.content.slice(0, 20000) : row.content,
    Array.isArray(body.tags) ? JSON.stringify(texte(body.tags)) : row.tags,
    SICHTBARKEIT.has(body.visibility) ? body.visibility : row.visibility,
    new Date().toISOString(),
    row.id
  );
  const note = rowToNote(holen(row.id, req.campaignId));
  // Auch beim Zurückziehen eines Handouts müssen die Spieler es verschwinden sehen.
  if (note.visibility === 'runde' || row.visibility === 'runde') {
    broadcast('notizen:aktualisiert', {}, { campaignId: req.campaignId });
  }
  if (note.visibility === 'runde' && row.visibility !== 'runde') ausgeteilt(note, req.campaignId);
  res.json(note);
});

// DELETE /api/notes/:id – löschen; war sie ausgeteilt, verschwindet sie
// auch bei der Runde.
router.delete('/:id', requireDm, (req, res) => {
  const row = holen(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'notiz_nicht_gefunden', error: 'Notiz nicht gefunden.' });
  db.prepare('DELETE FROM notes WHERE id = ?').run(row.id);
  if (row.visibility === 'runde') broadcast('notizen:aktualisiert', {}, { campaignId: req.campaignId });
  res.status(204).end();
});

/**
 * POST /api/notes/:id/kopieren  { campaignId }
 *
 * Denselben Zettel in einer anderen Kampagne. Handzettel gehören zu einer
 * Geschichte – der Steckbrief aus der einen Stadt passt nicht von allein in
 * die andere –, aber manchmal eben doch: dieselbe Hausregel, derselbe
 * Götterkatalog, dieselbe Karte in Worten.
 */
router.post('/:id/kopieren', requireDm, zielPruefen, (req, res) => {
  const row = holen(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'notiz_nicht_gefunden', error: 'Notiz nicht gefunden.' });

  const kopiert = kopiereNotiz(row, req.ziel);
  meldeNachZiel('notizen', req.ziel);
  res.status(201).json({ ...kopiert, campaignId: req.ziel });
});

export default router;
