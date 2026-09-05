import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, getState, setState } from '../db.js';
import { requireAuth, requireDm } from '../auth.js';
import { broadcast, originClient } from '../events.js';
import * as chronik from '../chronicle.js';

const router = Router();
router.use(requireAuth);

/**
 * Die Beutekiste.
 *
 * Was die Runde gemeinsam findet, gehört erst einmal allen – und wird am Ende
 * des Abends geteilt. Beides erledigt der Almanach: Gegenstände und Münzen
 * liegen in einer gemeinsamen Kiste, die alle sehen und füllen dürfen, und das
 * Teilen rechnet er aus, statt es dem Tisch zu überlassen.
 */

// Der übliche Umrechnungskurs: alles in Kupfer, dann wieder hinauf.
const KURS = { pp: 1000, gp: 100, ep: 50, sp: 10, cp: 1 };
const MUENZEN = ['pp', 'gp', 'ep', 'sp', 'cp'];
const MUENZNAME = { pp: 'Platin', gp: 'Gold', ep: 'Elektrum', sp: 'Silber', cp: 'Kupfer' };

const LEER = { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };
const toNumber = (wert, ersatz) => (Number.isFinite(Number(wert)) ? Number(wert) : ersatz);

const inKupfer = (muenzen) => MUENZEN.reduce((summe, m) => summe + (toNumber(muenzen?.[m], 0) || 0) * KURS[m], 0);

/**
 * Kupfer wieder in Münzen fassen – ohne Elektrum, das am Tisch ohnehin
 * niemand haben will.
 */
function ausKupfer(kupfer) {
  let rest = Math.max(0, Math.floor(kupfer));
  const heraus = { ...LEER };
  for (const m of ['pp', 'gp', 'sp', 'cp']) {
    heraus[m] = Math.floor(rest / KURS[m]);
    rest -= heraus[m] * KURS[m];
  }
  return heraus;
}

/**
 * Beute teilen, so wie es am Tisch wirklich zugeht.
 *
 * Es wird von der größten Münze zur kleinsten gegangen. Was sich nicht glatt
 * aufteilen lässt, wird in kleinere Münzen gewechselt und weitergereicht –
 * niemals umgekehrt. Sonst bekäme jemand ein Platinstück ausgezahlt, das die
 * Runde nie besessen hat: Aus 43 Gold werden 14 Gold je Kopf und nicht
 * „1 Platin, 4 Gold“.
 *
 * Elektrum wird dabei nur angenommen, nie ausgegeben: Wer welches in der
 * Kiste hat, bekommt es in Silber gewechselt zurück. An kaum einem Tisch
 * will jemand Elektrumstücke gereicht bekommen.
 *
 * Am Ende bleibt höchstens eine Handvoll Kupfer übrig, die sich nicht mehr
 * teilen lässt. Wer die bekommt, ist eine Frage für den Tisch.
 */
function teile(vorrat, anteile) {
  const proKopf = { ...LEER };
  // Vorhandenes Elektrum wandert gleich in den Übertrag und kommt weiter
  // unten als Silber und Kupfer wieder heraus.
  let uebertrag = (toNumber(vorrat.ep, 0) || 0) * KURS.ep;

  for (const m of ['pp', 'gp', 'sp', 'cp']) {
    const vorhanden = (toNumber(vorrat[m], 0) || 0) * KURS[m] + uebertrag;
    const stuecke = Math.floor(vorhanden / KURS[m]);
    proKopf[m] = Math.floor(stuecke / anteile);
    uebertrag = vorhanden - proKopf[m] * anteile * KURS[m];
  }

  return { proKopf, rest: ausKupfer(uebertrag), restInKupfer: uebertrag };
}

const muenzen = () => ({ ...LEER, ...(getState('beute', LEER) ?? LEER) });

function rowToItem(row) {
  return {
    id: row.id,
    name: row.name,
    qty: row.qty,
    weight: row.weight,
    notes: row.notes,
    holderId: row.holder_id,
    createdAt: row.created_at,
  };
}

const alleGegenstaende = () =>
  db.prepare('SELECT * FROM stash_items ORDER BY created_at').all().map(rowToItem);

function melden(req) {
  broadcast('beute', { items: alleGegenstaende(), coins: muenzen() }, { exceptClient: originClient(req) });
}

// GET /api/stash
router.get('/', (req, res) => {
  res.json({ items: alleGegenstaende(), coins: muenzen() });
});

// POST /api/stash/items – jede und jeder darf eintragen, was gefunden wurde
router.post('/items', (req, res) => {
  const body = req.body ?? {};
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return res.status(400).json({ code: 'name_fehlt', error: 'Ohne Namen kein Eintrag.' });
  }
  const id = randomUUID();
  db.prepare(
    'INSERT INTO stash_items (id, name, qty, weight, notes, holder_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    body.name.trim().slice(0, 120),
    Math.max(1, Math.min(9999, parseInt(body.qty, 10) || 1)),
    Math.max(0, toNumber(body.weight, 0)),
    typeof body.notes === 'string' ? body.notes.slice(0, 500) : '',
    body.holderId ?? null,
    new Date().toISOString()
  );
  melden(req);
  res.status(201).json(rowToItem(db.prepare('SELECT * FROM stash_items WHERE id = ?').get(id)));
});

router.put('/items/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM stash_items WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ code: 'gegenstand_nicht_gefunden', error: 'Gegenstand nicht gefunden.' });
  const body = req.body ?? {};
  db.prepare('UPDATE stash_items SET name = ?, qty = ?, weight = ?, notes = ?, holder_id = ? WHERE id = ?').run(
    typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 120) : row.name,
    'qty' in body ? Math.max(1, Math.min(9999, parseInt(body.qty, 10) || 1)) : row.qty,
    'weight' in body ? Math.max(0, toNumber(body.weight, row.weight)) : row.weight,
    typeof body.notes === 'string' ? body.notes.slice(0, 500) : row.notes,
    'holderId' in body ? (body.holderId ?? null) : row.holder_id,
    row.id
  );
  melden(req);
  res.json(rowToItem(db.prepare('SELECT * FROM stash_items WHERE id = ?').get(row.id)));
});

router.delete('/items/:id', (req, res) => {
  const info = db.prepare('DELETE FROM stash_items WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ code: 'gegenstand_nicht_gefunden', error: 'Gegenstand nicht gefunden.' });
  melden(req);
  res.status(204).end();
});

// PUT /api/stash/coins
router.put('/coins', (req, res) => {
  const body = req.body ?? {};
  const naechste = { ...LEER };
  for (const m of MUENZEN) naechste[m] = Math.max(0, Math.floor(toNumber(body[m], muenzen()[m])));
  setState('beute', naechste);
  melden(req);
  res.json(naechste);
});

/**
 * GET /api/stash/teilung?anteile=4
 *
 * Rechnet nur nach, wie die Münzen aufgingen – ändert nichts. Der Rest, der
 * sich nicht glatt teilen lässt, bleibt ausdrücklich stehen: Wer ihn bekommt,
 * ist eine Frage für den Tisch und nicht für den Almanach.
 */
router.get('/teilung', (req, res) => {
  const anteile = Math.max(1, Math.min(20, parseInt(req.query.anteile, 10) || 1));
  const vorrat = muenzen();
  const { proKopf, rest } = teile(vorrat, anteile);
  res.json({ anteile, proKopf, rest, gesamtInKupfer: inKupfer(vorrat) });
});

/**
 * POST /api/stash/auszahlen  { characterIds: [...] }
 *
 * Schreibt jedem genannten Charakter seinen Anteil in den Beutel und leert die
 * Kiste bis auf den Rest. Das greift in fremde Charakterblätter ein – deshalb
 * darf es nur die Spielleitung.
 */
router.post('/auszahlen', requireDm, (req, res) => {
  const ids = Array.isArray(req.body?.characterIds) ? req.body.characterIds.slice(0, 20) : [];
  if (ids.length === 0) return res.status(400).json({ code: 'empfaenger_fehlen', error: 'Es wurde niemand genannt, der etwas bekommen soll.' });

  const charaktere = ids
    .map((id) => db.prepare('SELECT * FROM characters WHERE id = ?').get(id))
    .filter(Boolean);
  if (charaktere.length === 0) return res.status(400).json({ code: 'charakter_nicht_gefunden', error: 'Keiner dieser Charaktere ist verzeichnet.' });

  const vorrat = muenzen();
  const { proKopf: anteil, rest, restInKupfer } = teile(vorrat, charaktere.length);
  if (inKupfer(anteil) <= 0) {
    return res.status(400).json({ code: 'beute_zu_klein', error: 'In der Kiste liegt zu wenig, um sie zu teilen.' });
  }

  const jetzt = new Date().toISOString();

  for (const row of charaktere) {
    const data = JSON.parse(row.data);
    data.currency = { ...LEER, ...(data.currency ?? {}) };
    for (const m of MUENZEN) data.currency[m] = (toNumber(data.currency[m], 0) || 0) + anteil[m];
    db.prepare('UPDATE characters SET data = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(data),
      jetzt,
      row.id
    );
    broadcast('charakter:aktualisiert', {
      id: row.id,
      name: row.name,
      hp: data?.combat?.hp ?? null,
      ownerId: row.owner_id,
      shared: !!row.shared,
    });
  }

  setState('beute', rest);

  const beschreibung = MUENZEN.filter((m) => anteil[m])
    .map((m) => `${anteil[m]} ${MUENZNAME[m]}`)
    .join(', ');
  chronik.log({
    kind: 'notiz',
    actor: req.user.name,
    text: `Die Beute wird geteilt: je ${beschreibung} für ${charaktere.map((c) => c.name).join(', ')}.`,
    meta: {
      anteil,
      empfaenger: charaktere.length,
      namen: charaktere.map((c) => c.name),
      restInKupfer,
    },
  });

  melden(req);
  broadcast('beute', { items: alleGegenstaende(), coins: rest });
  res.json({ anteil, rest, empfaenger: charaktere.length });
});

export default router;
