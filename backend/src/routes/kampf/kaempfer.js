/**
 * Die Kämpfer selbst: eintragen, ändern, Schaden geben, Initiative setzen,
 * wieder herausnehmen.
 *
 * Alles hier ist Sache der Spielleitung – mit einer Ausnahme: Die eigene
 * Initiative darf auch die Runde selbst eintragen. Wessen Kämpfer welcher
 * ist, entscheidet der Weg, nicht die Oberfläche.
 */
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, setState, transaktion } from '../../db.js';
import { isDm, requireDm } from '../../auth.js';
import * as chronik from '../../chronicle.js';
import { TYPEN, alleKaempfer, holen, meta } from '../../kampf/umwandlung.js';
import { antwort } from '../../kampf/sicht.js';
import { syncCharakter } from '../../kampf/blatt.js';
import { verbergeGemeinsam } from '../../kampf/verbergen.js';
import { saubererBonus } from '../../kampf/initiative.js';
import { sendeSzene } from '../../spieltisch/melden.js';
import { hatText, texte, toNumber } from '../../werte.js';

// `GET /api/encounter` steht in ../encounter.js, vor diesem Router – hier
// stand früher ein zweiter, der nie erreicht wurde.
const router = Router();

// POST /api/encounter/combatants  { name, type?, initiative?, initiativeBonus?,
// hp?, maxHp?, ac?, conditions?, notes?, characterId?, hidden? } – einen Kämpfer von Hand in den
// Kampf setzen. Meist kommen Kämpfer über „Runde holen“, das Bestiarium oder
// eine vorbereitete Begegnung; dieser Weg ist für den Rest.
router.post('/combatants', requireDm, (req, res) => {
  const { name, type, initiative, initiativeBonus, hp, maxHp, ac, conditions, notes, characterId, hidden } = req.body ?? {};
  if (!hatText(name)) {
    return res.status(400).json({ code: 'name_fehlt', error: 'Name ist erforderlich.' });
  }
  // Ein Kämpfer, der an einem Blatt hängt, schreibt dessen Trefferpunkte
  // mit (kampf/blatt.js). Also nur an ein Blatt dieser Kampagne – und eine
  // erfundene Kennung ist ein 400, kein Fremdschlüssel-500.
  if (
    characterId != null &&
    !db.prepare('SELECT 1 FROM characters WHERE id = ? AND campaign_id = ?').get(characterId, req.campaignId)
  ) {
    return res.status(400).json({ code: 'charakter_nicht_gefunden', error: 'Dieses Blatt gibt es in dieser Kampagne nicht.' });
  }
  const hpValue = toNumber(hp, 0);
  db.prepare(
    `INSERT INTO combatants (id, name, type, initiative, initiative_bonus, hp, max_hp, ac, conditions, notes, character_id,
                             media_id, hidden, campaign_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    name.trim().slice(0, 100),
    TYPEN.has(type) ? type : 'monster',
    toNumber(initiative, 0),
    saubererBonus(initiativeBonus),
    hpValue,
    toNumber(maxHp, hpValue),
    toNumber(ac, 10),
    JSON.stringify(texte(conditions)),
    typeof notes === 'string' ? notes.slice(0, 500) : '',
    characterId ?? null,
    req.body?.mediaId ?? null,
    hidden ? 1 : 0,
    req.campaignId,
    new Date().toISOString()
  );
  antwort(req, res);
});

// PUT /api/encounter/combatants/:id – Werte eines Kämpfers ändern: Initiative,
// Zustände, verborgen oder nicht. Trefferpunkte gehen besser über /damage,
// das mit temporären TP und der Null richtig umgeht.
router.put('/combatants/:id', requireDm, (req, res) => {
  const row = holen(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'kaempfer_nicht_gefunden', error: 'Kämpfer nicht gefunden.' });

  const body = req.body ?? {};
  const felder = {
    name: hatText(body.name) ? body.name.trim().slice(0, 100) : row.name,
    type: TYPEN.has(body.type) ? body.type : row.type,
    initiative: 'initiative' in body ? toNumber(body.initiative, row.initiative) : row.initiative,
    initiative_bonus: 'initiativeBonus' in body ? saubererBonus(body.initiativeBonus, row.initiative_bonus) : row.initiative_bonus,
    hp: 'hp' in body ? toNumber(body.hp, row.hp) : row.hp,
    max_hp: 'maxHp' in body ? toNumber(body.maxHp, row.max_hp) : row.max_hp,
    ac: 'ac' in body ? toNumber(body.ac, row.ac) : row.ac,
    conditions: Array.isArray(body.conditions) ? JSON.stringify(texte(body.conditions)) : row.conditions,
    notes: 'notes' in body && typeof body.notes === 'string' ? body.notes.slice(0, 500) : row.notes,
    hidden: 'hidden' in body ? (body.hidden ? 1 : 0) : row.hidden,
  };

  // Wird der Kämpfer verborgen oder aufgedeckt, gehen seine Figuren auf dem
  // Tisch mit (kampf/verbergen.js) – im selben Block wie die Zeile selbst.
  const gespiegelt = transaktion(() => {
    db.prepare(
      `UPDATE combatants SET name = ?, type = ?, initiative = ?, initiative_bonus = ?, hp = ?, max_hp = ?, ac = ?,
              conditions = ?, notes = ?, hidden = ? WHERE id = ?`
    ).run(
      felder.name,
      felder.type,
      felder.initiative,
      felder.initiative_bonus,
      felder.hp,
      felder.max_hp,
      felder.ac,
      felder.conditions,
      felder.notes,
      felder.hidden,
      row.id
    );
    return felder.hidden !== row.hidden ? verbergeGemeinsam(row.id, felder.hidden, req.campaignId) : null;
  });
  if (gespiegelt?.figuren > 0) sendeSzene(req.campaignId);

  if (felder.hp !== row.hp || felder.max_hp !== row.max_hp) syncCharakter(holen(row.id, req.campaignId), req.campaignId);

  // Zustände landen als Satz in der Chronik – bei verborgenen Kämpfern
  // verdeckt, sonst erführe die Runde dort, wer hinter dem Schirm steht.
  if (felder.conditions !== row.conditions) {
    const vorher = new Set(JSON.parse(row.conditions));
    const nachher = JSON.parse(felder.conditions);
    const neu = nachher.filter((c) => !vorher.has(c));
    const weg = [...vorher].filter((c) => !nachher.includes(c));
    if (neu.length || weg.length) {
      chronik.log({
        kind: 'zustand',
        actor: req.user.name,
        target: felder.name,
        text: [
          neu.length ? `${felder.name} ist jetzt ${neu.join(', ')}.` : '',
          weg.length ? `${felder.name} ist nicht mehr ${weg.join(', ')}.` : '',
        ]
          .filter(Boolean)
          .join(' '),
        meta: { target: felder.name, added: neu, removed: weg },
        secret: !!felder.hidden,
      }, req.campaignId);
    }
  }

  antwort(req, res);
});

// POST /api/encounter/combatants/:id/damage – negative Werte heilen
router.post('/combatants/:id/damage', requireDm, (req, res) => {
  const row = holen(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'kaempfer_nicht_gefunden', error: 'Kämpfer nicht gefunden.' });
  const amount = toNumber(req.body?.amount, 0);
  // Nie unter null, und Heilung nie über das Maximum – es sei denn, es ist
  // keins eingetragen (0), dann darf es beliebig hoch gehen.
  const hp = Math.max(0, Math.min(row.max_hp || Number.MAX_SAFE_INTEGER, row.hp - amount));
  db.prepare('UPDATE combatants SET hp = ? WHERE id = ?').run(hp, row.id);
  syncCharakter(holen(row.id, req.campaignId), req.campaignId);

  if (amount !== 0) {
    chronik.log({
      kind: amount > 0 ? 'schaden' : 'heilung',
      actor: req.user.name,
      target: row.name,
      text:
        amount > 0
          ? `${row.name} nimmt ${amount} Schaden.`
          : `${row.name} wird um ${-amount} Trefferpunkte geheilt.`,
      meta: { target: row.name, amount, hp, maxHp: row.max_hp },
      // Von verborgenen Kämpfern soll die Runde nichts mitbekommen.
      secret: !!row.hidden,
    }, req.campaignId);
  }
  if (hp === 0 && row.hp > 0) {
    chronik.log({
      kind: 'tod',
      actor: req.user.name,
      target: row.name,
      text: `${row.name} geht zu Boden.`,
      meta: { target: row.name, type: row.type },
      secret: !!row.hidden,
    }, req.campaignId);
  }

  antwort(req, res);
});

/**
 * POST /api/encounter/combatants/:id/initiative  { value }
 *
 * Zu Beginn jedes Kampfes würfelt die ganze Runde. Bisher musste die
 * Spielleitung fünf Zahlen abtippen – hier trägt jede und jeder den eigenen
 * Wurf selbst ein. Fremde Zeilen bleiben tabu.
 */
router.post('/combatants/:id/initiative', (req, res) => {
  const row = holen(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'kaempfer_nicht_gefunden', error: 'Kämpfer nicht gefunden.' });

  if (!isDm(req.user)) {
    if (!row.character_id) return res.status(403).json({ code: 'kaempfer_fremd', error: 'Diese Zeile gehört nicht dir.' });
    // Ein Blatt hinter dem Schirm führt die Spielleitung, auch wenn es noch
    // jemandem gehört (siehe `fuehrtSelbst` in routes/charaktere/blatt.js).
    const charakter = db.prepare('SELECT owner_id, npc FROM characters WHERE id = ?').get(row.character_id);
    if (!charakter || charakter.npc || charakter.owner_id !== req.user.id) {
      return res.status(403).json({ code: 'kaempfer_fremd', error: 'Diese Zeile gehört jemand anderem.' });
    }
  }

  db.prepare('UPDATE combatants SET initiative = ? WHERE id = ?').run(toNumber(req.body?.value, 0), row.id);
  antwort(req, res);
});

// DELETE /api/encounter/combatants/:id – einen Kämpfer aus dem Kampf nehmen.
// War er gerade dran, ist es danach der, der in der Reihenfolge an seine
// Stelle rückt.
router.delete('/combatants/:id', requireDm, (req, res) => {
  const row = holen(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'kaempfer_nicht_gefunden', error: 'Kämpfer nicht gefunden.' });

  const reihenfolge = alleKaempfer(req.campaignId);
  const index = reihenfolge.findIndex((c) => c.id === row.id);
  db.prepare('DELETE FROM combatants WHERE id = ?').run(row.id);

  const aktuell = meta(req.campaignId);
  if (aktuell.activeCombatantId === row.id) {
    const rest = alleKaempfer(req.campaignId);
    setState('kampf', req.campaignId, { ...aktuell, activeCombatantId: rest[index]?.id ?? rest[0]?.id ?? null });
  }
  antwort(req, res);
});

export default router;
