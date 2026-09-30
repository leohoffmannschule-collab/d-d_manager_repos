/**
 * Die eigenen Kampagnen: auflisten, anlegen, hineinwechseln, umbenennen.
 *
 * Welche Kampagne offen ist, hängt an der **Sitzung**, nicht am Konto
 * (`auth_sessions.campaign_id`). Dieselbe Spielleitung kann deshalb in zwei
 * Browserfenstern in zwei Kampagnen sitzen.
 */
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, transaktion } from '../../db.js';
import { istMitglied, requireDm, setSessionCampaign } from '../../auth.js';
import { saeVorlagen } from '../../vorlagen/index.js';
import { darfVerwalten, holen, pruefeName } from './regeln.js';

const router = Router();

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
      // Beides, damit die Oberfläche nicht nur weiß, *ob* jemand hier
      // bestimmen darf, sondern im Zweifel auch sagen kann, wer sonst.
      darfVerwalten: darfVerwalten({ created_by: von }, req.user),
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
  transaktion(() => {
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
  });
  setSessionCampaign(req.sessionToken, id);
  res.status(201).json({ id, name: req.body.name.trim(), created_at: jetzt });
});

// POST /api/campaigns/:id/aktiv – in diese Kampagne wechseln.
//
// Dieselbe Prüfung wie requireCampaign: Eine Kampagne im Papierkorb zählt
// nicht. Sonst ließe sie sich hier wählen, und jeder folgende Weg wiese die
// Sitzung mit 409 zurück in die Auswahl – ein Kreis ohne Ausgang.
router.post('/:id/aktiv', (req, res) => {
  if (!istMitglied(req.params.id, req.user.id)) {
    return res.status(403).json({ code: 'nicht_dabei', error: 'Du bist kein Mitglied dieser Kampagne.' });
  }

  setSessionCampaign(req.sessionToken, req.params.id);
  res.status(204).end();
});

/**
 * PATCH /api/campaigns/:id  { name }
 *
 * Umbenennen. Harmloser als alles andere hier: Der Name hängt an nichts –
 * Charaktere, Szenen und Beute zeigen auf die Kennung der Kampagne, nie auf
 * ihren Namen. Es gibt deshalb auch nichts nachzuziehen.
 *
 * Bestimmen darf trotzdem nur, wer die Kampagne angelegt hat: Es ist ihr
 * Name, und in den Listen der Mitspieler steht er ebenfalls.
 */
router.patch('/:id', (req, res) => {
  const kampagne = holen(req.params.id);
  if (!kampagne || kampagne.deleted_at) {
    return res.status(404).json({ code: 'kampagne_nicht_gefunden', error: 'Kampagne nicht gefunden.' });
  }
  if (!darfVerwalten(kampagne, req.user)) {
    return res.status(403).json({
      code: 'nicht_angelegt',
      error: 'Umbenennen darf nur, wer diese Kampagne angelegt hat.',
    });
  }

  const fehler = pruefeName(req.body?.name);
  if (fehler) return res.status(400).json({ code: 'name_ungueltig', error: fehler });

  const name = req.body.name.trim();
  db.prepare('UPDATE campaigns SET name = ? WHERE id = ?').run(name, kampagne.id);
  res.json({ id: kampagne.id, name, vorher: kampagne.name });
});

export default router;
