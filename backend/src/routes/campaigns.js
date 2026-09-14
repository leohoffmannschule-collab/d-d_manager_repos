import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { requireAuth, requireDm, setSessionCampaign } from '../auth.js';
import { saeVorlagen } from '../vorlagen/index.js';

const router = Router();

router.use(requireAuth);

function pruefeName(name) {
  if (typeof name !== 'string' || name.trim().length < 2) return 'Der Name braucht mindestens zwei Zeichen.';
  if (name.trim().length > 60) return 'Der Name ist zu lang.';
  return null;
}

// GET /api/campaigns – die eigenen Kampagnen, dazu welche gerade aktiv ist.
router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.id, c.name, c.created_at,
              (SELECT COUNT(*) FROM campaign_members m WHERE m.campaign_id = c.id) AS mitglieder
         FROM campaigns c
         JOIN campaign_members cm ON cm.campaign_id = c.id
        WHERE cm.user_id = ?
        ORDER BY c.created_at`
    )
    .all(req.user.id);
  res.json({ kampagnen: rows, aktive: req.campaignId });
});

// POST /api/campaigns { name } – neue Kampagne, wer sie anlegt, ist gleich dabei.
router.post('/', requireDm, (req, res) => {
  const fehler = pruefeName(req.body?.name);
  if (fehler) return res.status(400).json({ code: 'name_ungueltig', error: fehler });

  const id = randomUUID();
  const jetzt = new Date().toISOString();
  db.prepare('INSERT INTO campaigns (id, name, created_by, created_at) VALUES (?, ?, ?, ?)').run(
    id,
    req.body.name.trim(),
    req.user.id,
    jetzt
  );
  db.prepare('INSERT INTO campaign_members (campaign_id, user_id, joined_at) VALUES (?, ?, ?)').run(
    id,
    req.user.id,
    jetzt
  );
  // Eine frische Kampagne ist leer, und leer lässt sich schwer beurteilen –
  // deshalb liegen von Anfang an zwölf fertige Charaktere hinter dem Schirm.
  saeVorlagen(id);
  setSessionCampaign(req.sessionToken, id);
  res.status(201).json({ id, name: req.body.name.trim(), created_at: jetzt });
});

// POST /api/campaigns/:id/aktiv – in diese Kampagne wechseln.
router.post('/:id/aktiv', (req, res) => {
  const mitglied = db
    .prepare('SELECT 1 FROM campaign_members WHERE campaign_id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!mitglied) return res.status(403).json({ code: 'nicht_dabei', error: 'Du bist kein Mitglied dieser Kampagne.' });

  setSessionCampaign(req.sessionToken, req.params.id);
  res.status(204).end();
});

// GET /api/campaigns/:id/mitglieder
router.get('/:id/mitglieder', requireDm, (req, res) => {
  const kampagne = db.prepare('SELECT id FROM campaigns WHERE id = ?').get(req.params.id);
  if (!kampagne) return res.status(404).json({ code: 'kampagne_nicht_gefunden', error: 'Kampagne nicht gefunden.' });

  res.json(
    db
      .prepare(
        `SELECT u.id, u.name, u.role, u.color, m.joined_at
           FROM campaign_members m JOIN users u ON u.id = m.user_id
          WHERE m.campaign_id = ?
          ORDER BY u.role = 'sl' DESC, u.name COLLATE NOCASE`
      )
      .all(req.params.id)
  );
});

// POST /api/campaigns/:id/mitglieder { userId }
router.post('/:id/mitglieder', requireDm, (req, res) => {
  const kampagne = db.prepare('SELECT id FROM campaigns WHERE id = ?').get(req.params.id);
  if (!kampagne) return res.status(404).json({ code: 'kampagne_nicht_gefunden', error: 'Kampagne nicht gefunden.' });

  const konto = db.prepare('SELECT id FROM users WHERE id = ?').get(req.body?.userId);
  if (!konto) return res.status(404).json({ code: 'konto_nicht_gefunden', error: 'Konto nicht gefunden.' });

  db.prepare(
    `INSERT INTO campaign_members (campaign_id, user_id, joined_at) VALUES (?, ?, ?)
     ON CONFLICT(campaign_id, user_id) DO NOTHING`
  ).run(req.params.id, konto.id, new Date().toISOString());
  res.status(204).end();
});

// DELETE /api/campaigns/:id/mitglieder/:userId
router.delete('/:id/mitglieder/:userId', requireDm, (req, res) => {
  db.prepare('DELETE FROM campaign_members WHERE campaign_id = ? AND user_id = ?').run(
    req.params.id,
    req.params.userId
  );
  // Wer gerade dort spielte, steht sonst in einer Kampagne, zu der er keinen Zutritt mehr hat.
  db.prepare('UPDATE auth_sessions SET campaign_id = NULL WHERE campaign_id = ? AND user_id = ?').run(
    req.params.id,
    req.params.userId
  );
  res.status(204).end();
});

export default router;
