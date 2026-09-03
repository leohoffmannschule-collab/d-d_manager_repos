import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, getState, setState } from '../db.js';
import { isDm, requireAuth, requireDm } from '../auth.js';
import { broadcast } from '../events.js';
import { rollD20 } from '../dice.js';

const router = Router();
router.use(requireAuth);

const TYPEN = new Set(['pc', 'npc', 'monster']);
const toNumber = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

function meta() {
  return getState('kampf', { round: 1, activeCombatantId: null });
}

function rowToCombatant(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    initiative: row.initiative,
    hp: row.hp,
    maxHp: row.max_hp,
    ac: row.ac,
    conditions: JSON.parse(row.conditions),
    notes: row.notes,
    characterId: row.character_id,
    hidden: !!row.hidden,
  };
}

/** Nach Initiative absteigend, bei Gleichstand alphabetisch. */
function alleKaempfer() {
  return db
    .prepare('SELECT * FROM combatants ORDER BY initiative DESC, name COLLATE NOCASE')
    .all()
    .map(rowToCombatant);
}

/**
 * Was die Spielleitung sieht: alles. Was die Runde sieht: keine versteckten
 * Kämpfer, und von Monstern nur den Zustand statt der genauen Trefferpunkte –
 * sonst rechnet der Tisch aus, wie viel das Ungetüm noch aushält.
 */
function zustand(hp, maxHp) {
  if (!maxHp || hp <= 0) return hp <= 0 ? 'kampfunfähig' : 'unversehrt';
  const anteil = hp / maxHp;
  if (anteil >= 1) return 'unversehrt';
  if (anteil > 0.66) return 'leicht verletzt';
  if (anteil > 0.33) return 'verwundet';
  return 'schwer verwundet';
}

export function encounterView(user) {
  const kaempfer = alleKaempfer();
  const sichtbar = isDm(user)
    ? kaempfer
    : kaempfer
        .filter((c) => !c.hidden)
        .map((c) =>
          c.type === 'pc'
            ? { ...c, notes: '' }
            : {
                ...c,
                hp: null,
                maxHp: null,
                ac: null,
                notes: '',
                status: zustand(c.hp, c.maxHp),
              }
        );
  return { ...meta(), combatants: sichtbar };
}

/** Beide Fassungen an alle offenen Fenster schicken. */
export function sendeKampf() {
  broadcast('kampf', encounterView({ role: 'sl' }), { role: 'sl' });
  broadcast('kampf', encounterView({ role: 'spieler' }), { role: 'spieler' });
}

function antwort(req, res) {
  sendeKampf();
  res.json(encounterView(req.user));
}

/** Trefferpunkte auf das verknüpfte Charakterblatt zurückschreiben. */
function syncCharakter(combatant) {
  if (!combatant.character_id) return;
  const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(combatant.character_id);
  if (!row) return;
  const data = JSON.parse(row.data);
  data.combat = data.combat ?? {};
  data.combat.hp = { ...(data.combat.hp ?? {}), current: combatant.hp, max: combatant.max_hp };
  db.prepare('UPDATE characters SET data = ?, updated_at = ? WHERE id = ?').run(
    JSON.stringify(data),
    new Date().toISOString(),
    row.id
  );
  broadcast('charakter:aktualisiert', {
    id: row.id,
    name: row.name,
    hp: data.combat.hp,
    ownerId: row.owner_id,
    shared: !!row.shared,
  });
}

const holen = (id) => db.prepare('SELECT * FROM combatants WHERE id = ?').get(id);

// GET /api/encounter
router.get('/', (req, res) => {
  res.json(encounterView(req.user));
});

// POST /api/encounter/combatants
router.post('/combatants', requireDm, (req, res) => {
  const { name, type, initiative, hp, maxHp, ac, conditions, notes, characterId, hidden } = req.body ?? {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name ist erforderlich.' });
  }
  const hpValue = toNumber(hp, 0);
  db.prepare(
    `INSERT INTO combatants (id, name, type, initiative, hp, max_hp, ac, conditions, notes, character_id, hidden, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    name.trim().slice(0, 100),
    TYPEN.has(type) ? type : 'monster',
    toNumber(initiative, 0),
    hpValue,
    toNumber(maxHp, hpValue),
    toNumber(ac, 10),
    JSON.stringify(Array.isArray(conditions) ? conditions.filter((c) => typeof c === 'string').slice(0, 20) : []),
    typeof notes === 'string' ? notes.slice(0, 500) : '',
    characterId ?? null,
    hidden ? 1 : 0,
    new Date().toISOString()
  );
  antwort(req, res);
});

// PUT /api/encounter/combatants/:id
router.put('/combatants/:id', requireDm, (req, res) => {
  const row = holen(req.params.id);
  if (!row) return res.status(404).json({ error: 'Kämpfer nicht gefunden.' });

  const body = req.body ?? {};
  const felder = {
    name: 'name' in body && typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 100) : row.name,
    type: TYPEN.has(body.type) ? body.type : row.type,
    initiative: 'initiative' in body ? toNumber(body.initiative, row.initiative) : row.initiative,
    hp: 'hp' in body ? toNumber(body.hp, row.hp) : row.hp,
    max_hp: 'maxHp' in body ? toNumber(body.maxHp, row.max_hp) : row.max_hp,
    ac: 'ac' in body ? toNumber(body.ac, row.ac) : row.ac,
    conditions:
      'conditions' in body && Array.isArray(body.conditions)
        ? JSON.stringify(body.conditions.filter((c) => typeof c === 'string').slice(0, 20))
        : row.conditions,
    notes: 'notes' in body && typeof body.notes === 'string' ? body.notes.slice(0, 500) : row.notes,
    hidden: 'hidden' in body ? (body.hidden ? 1 : 0) : row.hidden,
  };

  db.prepare(
    `UPDATE combatants SET name = ?, type = ?, initiative = ?, hp = ?, max_hp = ?, ac = ?,
            conditions = ?, notes = ?, hidden = ? WHERE id = ?`
  ).run(
    felder.name,
    felder.type,
    felder.initiative,
    felder.hp,
    felder.max_hp,
    felder.ac,
    felder.conditions,
    felder.notes,
    felder.hidden,
    row.id
  );

  if (felder.hp !== row.hp || felder.max_hp !== row.max_hp) syncCharakter(holen(row.id));
  antwort(req, res);
});

// POST /api/encounter/combatants/:id/damage – negative Werte heilen
router.post('/combatants/:id/damage', requireDm, (req, res) => {
  const row = holen(req.params.id);
  if (!row) return res.status(404).json({ error: 'Kämpfer nicht gefunden.' });
  const amount = toNumber(req.body?.amount, 0);
  const hp = Math.max(0, Math.min(row.max_hp || Number.MAX_SAFE_INTEGER, row.hp - amount));
  db.prepare('UPDATE combatants SET hp = ? WHERE id = ?').run(hp, row.id);
  syncCharakter(holen(row.id));
  antwort(req, res);
});

// DELETE /api/encounter/combatants/:id
router.delete('/combatants/:id', requireDm, (req, res) => {
  const row = holen(req.params.id);
  if (!row) return res.status(404).json({ error: 'Kämpfer nicht gefunden.' });

  const reihenfolge = alleKaempfer();
  const index = reihenfolge.findIndex((c) => c.id === row.id);
  db.prepare('DELETE FROM combatants WHERE id = ?').run(row.id);

  const aktuell = meta();
  if (aktuell.activeCombatantId === row.id) {
    const rest = alleKaempfer();
    setState('kampf', { ...aktuell, activeCombatantId: rest[index]?.id ?? rest[0]?.id ?? null });
  }
  antwort(req, res);
});

// POST /api/encounter/next-turn  |  /prev-turn
function zug(richtung) {
  return (req, res) => {
    const kaempfer = alleKaempfer();
    const aktuell = meta();
    if (kaempfer.length === 0) {
      setState('kampf', { ...aktuell, activeCombatantId: null });
      return antwort(req, res);
    }
    const index = kaempfer.findIndex((c) => c.id === aktuell.activeCombatantId);
    if (index === -1) {
      setState('kampf', {
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
    setState('kampf', { round, activeCombatantId: kaempfer[next].id });
    antwort(req, res);
  };
}

router.post('/next-turn', requireDm, zug(1));
router.post('/prev-turn', requireDm, zug(-1));

// POST /api/encounter/reset
router.post('/reset', requireDm, (req, res) => {
  db.prepare('DELETE FROM combatants').run();
  setState('kampf', { round: 1, activeCombatantId: null });
  antwort(req, res);
});

// POST /api/encounter/roll-initiative – für alle NSC und Monster ohne Wert
router.post('/roll-initiative', requireDm, (req, res) => {
  const nurLeere = req.body?.onlyEmpty !== false;
  for (const row of db.prepare("SELECT * FROM combatants WHERE type != 'pc'").all()) {
    if (nurLeere && row.initiative !== 0) continue;
    db.prepare('UPDATE combatants SET initiative = ? WHERE id = ?').run(rollD20(), row.id);
  }
  antwort(req, res);
});

// POST /api/encounter/party – die Charaktere der Runde in den Kampf holen
router.post('/party', requireDm, (req, res) => {
  const vorhanden = new Set(
    db.prepare('SELECT character_id FROM combatants WHERE character_id IS NOT NULL').all().map((r) => r.character_id)
  );
  const charaktere = db.prepare('SELECT * FROM characters WHERE shared = 1').all();
  const now = new Date().toISOString();

  for (const row of charaktere) {
    if (vorhanden.has(row.id)) continue;
    const data = JSON.parse(row.data);
    const hp = data?.combat?.hp ?? {};
    db.prepare(
      `INSERT INTO combatants (id, name, type, initiative, hp, max_hp, ac, conditions, notes, character_id, hidden, created_at)
       VALUES (?, ?, 'pc', 0, ?, ?, ?, '[]', '', ?, 0, ?)`
    ).run(
      randomUUID(),
      row.name,
      toNumber(hp.current, 0),
      toNumber(hp.max, 0),
      toNumber(data?.combat?.ac, 10),
      row.id,
      now
    );
  }
  antwort(req, res);
});

export default router;
