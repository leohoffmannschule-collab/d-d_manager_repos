import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { isDm, requireAuth, requireDm } from '../auth.js';
import { broadcast } from '../events.js';
import * as chronik from '../chronicle.js';

const router = Router();
router.use(requireAuth);

// 'sl' = geheime Vorbereitung, 'runde' = ausgeteiltes Handout für alle.
const SICHTBARKEIT = new Set(['sl', 'runde']);

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

router.get('/', (req, res) => {
  const rows = isDm(req.user)
    ? db.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all()
    : db.prepare("SELECT * FROM notes WHERE visibility = 'runde' ORDER BY updated_at DESC").all();
  res.json(rows.map(rowToNote));
});

router.post('/', requireDm, (req, res) => {
  const body = req.body ?? {};
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return res.status(400).json({ error: 'Titel ist erforderlich.' });
  }
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO notes (id, title, content, tags, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    body.title.trim().slice(0, 150),
    typeof body.content === 'string' ? body.content.slice(0, 20000) : '',
    JSON.stringify(Array.isArray(body.tags) ? body.tags.filter((t) => typeof t === 'string').slice(0, 20) : []),
    SICHTBARKEIT.has(body.visibility) ? body.visibility : 'sl',
    now,
    now
  );
  const note = rowToNote(db.prepare('SELECT * FROM notes WHERE id = ?').get(id));
  if (note.visibility === 'runde') {
    broadcast('notizen:aktualisiert', {});
    chronik.log({ kind: 'handzettel', text: `Die Runde erhält: „${note.title}“.`, meta: { noteId: note.id } });
  }
  res.status(201).json(note);
});

router.put('/:id', requireDm, (req, res) => {
  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Notiz nicht gefunden.' });

  const body = req.body ?? {};
  db.prepare('UPDATE notes SET title = ?, content = ?, tags = ?, visibility = ?, updated_at = ? WHERE id = ?').run(
    typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 150) : row.title,
    typeof body.content === 'string' ? body.content.slice(0, 20000) : row.content,
    Array.isArray(body.tags)
      ? JSON.stringify(body.tags.filter((t) => typeof t === 'string').slice(0, 20))
      : row.tags,
    SICHTBARKEIT.has(body.visibility) ? body.visibility : row.visibility,
    new Date().toISOString(),
    row.id
  );
  const note = rowToNote(db.prepare('SELECT * FROM notes WHERE id = ?').get(row.id));
  // Auch beim Zurückziehen eines Handouts müssen die Spieler es verschwinden sehen.
  if (note.visibility === 'runde' || row.visibility === 'runde') broadcast('notizen:aktualisiert', {});
  if (note.visibility === 'runde' && row.visibility !== 'runde') {
    chronik.log({ kind: 'handzettel', text: `Die Runde erhält: „${note.title}“.`, meta: { noteId: note.id } });
  }
  res.json(note);
});

router.delete('/:id', requireDm, (req, res) => {
  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Notiz nicht gefunden.' });
  db.prepare('DELETE FROM notes WHERE id = ?').run(row.id);
  if (row.visibility === 'runde') broadcast('notizen:aktualisiert', {});
  res.status(204).end();
});

export default router;
