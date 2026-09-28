/**
 * Der Ablauf des Kampfes: eine Runde weiter, eine zurück, von vorn – und
 * die beiden Handgriffe, die eine Runde vorbereiten.
 *
 * „Eine Runde weiter“ ist mehr als ein Zeiger, der wandert: Am Ende der
 * Reihe beginnt eine neue Kampfrunde, und rückwärts über den Anfang hinaus
 * geht es in die vorige zurück. Das steht deshalb einmal in `zug()` und
 * wird für beide Richtungen benutzt.
 */
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, setState } from '../../db.js';
import { requireDm } from '../../auth.js';
import { rollD20 } from '../../dice.js';
import * as chronik from '../../chronicle.js';
import { alleKaempfer, meta } from '../../kampf/umwandlung.js';
import { toNumber } from '../../werte.js';
import { antwort } from '../../kampf/sicht.js';

const router = Router();

/**
 * POST /api/encounter/next-turn  |  /prev-turn
 *
 * @param {1|-1} richtung vorwärts oder rückwärts durch die Reihenfolge
 */
function zug(richtung) {
  return (req, res) => {
    const kaempfer = alleKaempfer(req.campaignId);
    const aktuell = meta(req.campaignId);
    if (kaempfer.length === 0) {
      setState('kampf', req.campaignId, { ...aktuell, activeCombatantId: null });
      return antwort(req, res);
    }
    const index = kaempfer.findIndex((c) => c.id === aktuell.activeCombatantId);
    // Noch niemand dran (oder der Aktive wurde entfernt): Vorwärts fängt
    // beim Ersten an, rückwärts beim Letzten – ohne die Runde zu zählen.
    if (index === -1) {
      setState('kampf', req.campaignId, {
        ...aktuell,
        activeCombatantId: richtung > 0 ? kaempfer[0].id : kaempfer[kaempfer.length - 1].id,
      });
      return antwort(req, res);
    }
    let next = index + richtung;
    let round = aktuell.round;
    if (next >= kaempfer.length) {
      next = 0;
      round += 1;
    } else if (next < 0) {
      next = kaempfer.length - 1;
      round = Math.max(1, round - 1);
    }
    setState('kampf', req.campaignId, { round, activeCombatantId: kaempfer[next].id });
    if (round !== aktuell.round) {
      chronik.log({ kind: 'runde', text: `Kampfrunde ${round} beginnt.`, meta: { round } }, req.campaignId);
    }
    antwort(req, res);
  };
}

router.post('/next-turn', requireDm, zug(1));
router.post('/prev-turn', requireDm, zug(-1));

// POST /api/encounter/reset
router.post('/reset', requireDm, (req, res) => {
  const meta_ = meta(req.campaignId);
  const zahl = db.prepare('SELECT COUNT(*) AS n FROM combatants WHERE campaign_id = ?').get(req.campaignId).n;
  db.prepare('DELETE FROM combatants WHERE campaign_id = ?').run(req.campaignId);
  setState('kampf', req.campaignId, { round: 1, activeCombatantId: null });
  if (zahl > 0) {
    chronik.log(
      {
        kind: 'kampf',
        text: `Der Kampf endet nach ${meta_.round} ${meta_.round === 1 ? 'Runde' : 'Runden'}.`,
        meta: { rounds: meta_.round, kapitel: true },
      },
      req.campaignId
    );
  }
  antwort(req, res);
});

// POST /api/encounter/roll-initiative – für alle NSC und Monster ohne Wert
router.post('/roll-initiative', requireDm, (req, res) => {
  // Helden würfeln selbst (siehe kaempfer.js, /initiative); hier nur, was
  // die Spielleitung führt. Eine 0 gilt als „noch nicht gewürfelt“.
  const nurLeere = req.body?.onlyEmpty !== false;
  const setzen = db.prepare('UPDATE combatants SET initiative = ? WHERE id = ?');
  for (const row of db.prepare("SELECT * FROM combatants WHERE type != 'pc' AND campaign_id = ?").all(req.campaignId)) {
    if (nurLeere && row.initiative !== 0) continue;
    setzen.run(rollD20(), row.id);
  }
  antwort(req, res);
});

// POST /api/encounter/party – die Charaktere der Runde in den Kampf holen
router.post('/party', requireDm, (req, res) => {
  const vorhanden = new Set(
    db
      .prepare('SELECT character_id FROM combatants WHERE character_id IS NOT NULL AND campaign_id = ?')
      .all(req.campaignId)
      .map((r) => r.character_id)
  );
  // „Die Runde“ sind die geteilten Blätter – NSC-Blätter nie, auch nicht,
  // wenn eines versehentlich als geteilt markiert ist.
  const charaktere = db.prepare('SELECT * FROM characters WHERE shared = 1 AND npc = 0 AND campaign_id = ?').all(req.campaignId);
  const now = new Date().toISOString();
  const einfuegen = db.prepare(
    `INSERT INTO combatants (id, name, type, initiative, hp, max_hp, ac, conditions, notes, character_id, media_id, hidden, campaign_id, created_at)
     VALUES (?, ?, 'pc', 0, ?, ?, ?, '[]', '', ?, ?, 0, ?, ?)`
  );

  for (const row of charaktere) {
    if (vorhanden.has(row.id)) continue;
    const data = JSON.parse(row.data);
    const hp = data?.combat?.hp ?? {};
    einfuegen.run(
      randomUUID(),
      row.name,
      toNumber(hp.current, 0),
      toNumber(hp.max, 0),
      toNumber(data?.combat?.armorClass ?? data?.combat?.ac, 10),
      row.id,
      data?.miniMediaId ?? null,
      req.campaignId,
      now
    );
  }
  chronik.log({ kind: 'kampf', text: 'Ein Kampf beginnt.', meta: { kapitel: true } }, req.campaignId);
  antwort(req, res);
});

export default router;
