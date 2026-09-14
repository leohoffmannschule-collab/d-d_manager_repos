import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { requireAuth, requireDm, setSessionCampaign } from '../auth.js';
import { endgueltigEntfernen, FRIST_TAGE, raeumePapierkorb, verbleibendeTage } from '../kampagnen.js';
import { saeVorlagen } from '../vorlagen/index.js';

const router = Router();

router.use(requireAuth);

function pruefeName(name) {
  if (typeof name !== 'string' || name.trim().length < 2) return 'Der Name braucht mindestens zwei Zeichen.';
  if (name.trim().length > 60) return 'Der Name ist zu lang.';
  return null;
}

/**
 * Löschen darf nur, wer die Kampagne angelegt hat – und niemand sonst, auch
 * keine andere Spielleitung. Bei alten Kampagnen ohne vermerkten Urheber
 * (aus der Zeit vor den Kampagnen) tritt die Spielleitung an diese Stelle,
 * sonst ließen sie sich nie wieder loswerden.
 */
function darfLoeschen(kampagne, user) {
  if (kampagne.created_by) return kampagne.created_by === user.id;
  return user.role === 'sl';
}

/** Der abgetippte Name muss stimmen – Wort für Wort. */
function nameBestaetigt(kampagne, eingabe) {
  return typeof eingabe === 'string' && eingabe.trim() === kampagne.name;
}

// GET /api/campaigns – die eigenen Kampagnen, dazu welche gerade aktiv ist.
router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.id, c.name, c.created_at, c.created_by, u.name AS urheber,
              (SELECT COUNT(*) FROM campaign_members m WHERE m.campaign_id = c.id) AS mitglieder
         FROM campaigns c
         JOIN campaign_members cm ON cm.campaign_id = c.id
         LEFT JOIN users u ON u.id = c.created_by
        WHERE cm.user_id = ? AND c.deleted_at IS NULL
        ORDER BY c.created_at`
    )
    .all(req.user.id);
  res.json({
    kampagnen: rows.map(({ created_by: von, urheber, ...rest }) => ({
      ...rest,
      // Beides, damit die Oberfläche nicht nur weiß, *ob* jemand löschen darf,
      // sondern im Zweifel auch sagen kann, wer es stattdessen dürfte.
      darfLoeschen: darfLoeschen({ created_by: von }, req.user),
      angelegtVon: urheber ?? null,
    })),
    aktive: req.campaignId,
  });
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

/* --- Papierkorb ---------------------------------------------------------- */

const holen = (id) => db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);

/**
 * DELETE /api/campaigns/:id  { name }
 *
 * In den Papierkorb, nicht ins Nichts: Die Kampagne verschwindet aus allen
 * Listen, ihre Daten bleiben die Frist über liegen (siehe kampagnen.js).
 * Verlangt wird der abgetippte Name – ein Fehlgriff im Menü soll keine
 * Kampagne kosten.
 */
router.delete('/:id', (req, res) => {
  const kampagne = holen(req.params.id);
  if (!kampagne || kampagne.deleted_at) {
    return res.status(404).json({ code: 'kampagne_nicht_gefunden', error: 'Kampagne nicht gefunden.' });
  }
  if (!darfLoeschen(kampagne, req.user)) {
    return res.status(403).json({
      code: 'nicht_angelegt',
      error: 'Löschen darf nur, wer diese Kampagne angelegt hat.',
    });
  }
  if (!nameBestaetigt(kampagne, req.body?.name)) {
    return res.status(400).json({
      code: 'name_stimmt_nicht',
      error: 'Zum Bestätigen muss der Name der Kampagne genau abgetippt werden.',
    });
  }

  db.prepare('UPDATE campaigns SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), kampagne.id);
  // Alle, die gerade darin sitzen, landen bei der nächsten Anfrage wieder in
  // der Kampagnenauswahl – sonst liefen sie ins Leere.
  db.prepare('UPDATE auth_sessions SET campaign_id = NULL WHERE campaign_id = ?').run(kampagne.id);
  res.json({ id: kampagne.id, name: kampagne.name, frist: FRIST_TAGE });
});

// GET /api/campaigns/papierkorb – was man selbst weggeräumt hat, samt Restfrist.
router.get('/papierkorb', (req, res) => {
  raeumePapierkorb();
  const rows = db
    .prepare('SELECT id, name, created_by, deleted_at FROM campaigns WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC')
    .all()
    .filter((k) => darfLoeschen(k, req.user))
    .map((k) => ({ id: k.id, name: k.name, geloeschtAm: k.deleted_at, tageUebrig: verbleibendeTage(k.deleted_at) }));
  res.json(rows);
});

// POST /api/campaigns/:id/wiederherstellen
router.post('/:id/wiederherstellen', (req, res) => {
  const kampagne = holen(req.params.id);
  if (!kampagne || !kampagne.deleted_at) {
    return res.status(404).json({ code: 'kampagne_nicht_gefunden', error: 'Im Papierkorb liegt sie nicht.' });
  }
  if (!darfLoeschen(kampagne, req.user)) {
    return res.status(403).json({ code: 'nicht_angelegt', error: 'Das darf nur, wer die Kampagne angelegt hat.' });
  }
  db.prepare('UPDATE campaigns SET deleted_at = NULL WHERE id = ?').run(kampagne.id);
  res.json({ id: kampagne.id, name: kampagne.name });
});

/**
 * DELETE /api/campaigns/:id/endgueltig  { name }
 *
 * Jetzt und ohne Wiederkehr: Charaktere, Chronik, Karten, Beute und die
 * hochgeladenen Bilder dieser Kampagne sind danach fort. Auch hier muss der
 * Name abgetippt werden, und liegen muss sie ohnehin schon im Papierkorb.
 */
router.delete('/:id/endgueltig', (req, res) => {
  const kampagne = holen(req.params.id);
  if (!kampagne || !kampagne.deleted_at) {
    return res.status(404).json({
      code: 'nicht_im_papierkorb',
      error: 'Endgültig entfernen lässt sich nur, was schon im Papierkorb liegt.',
    });
  }
  if (!darfLoeschen(kampagne, req.user)) {
    return res.status(403).json({ code: 'nicht_angelegt', error: 'Das darf nur, wer die Kampagne angelegt hat.' });
  }
  if (!nameBestaetigt(kampagne, req.body?.name)) {
    return res.status(400).json({
      code: 'name_stimmt_nicht',
      error: 'Zum Bestätigen muss der Name der Kampagne genau abgetippt werden.',
    });
  }

  endgueltigEntfernen(kampagne.id);
  res.status(204).end();
});

export default router;
