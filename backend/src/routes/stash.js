/**
 * Die Beutekiste: eintragen, verteilen, teilen, auszahlen.
 *
 * Was die Runde gemeinsam findet, gehört erst einmal allen – und wird am Ende
 * des Abends geteilt. Beides erledigt der Almanach: Gegenstände und Münzen
 * liegen in einer gemeinsamen Kiste, die alle sehen und füllen dürfen, und das
 * Teilen rechnet er aus, statt es dem Tisch zu überlassen (die Rechnung selbst
 * steht in ../beute.js).
 *
 * Nur das Auszahlen ist der Spielleitung vorbehalten: Es schreibt in fremde
 * Charakterblätter.
 */
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, setState, transaktion } from '../db.js';
import { requireAuth, requireDm } from '../auth.js';
import { broadcast, originClient } from '../events.js';
import * as chronik from '../chronicle.js';
import { meldeBlatt } from '../blattmeldung.js';
import { kopiereGegenstand, meldeNachZiel, zielPruefen } from '../uebernehmen.js';
import { KEINE_MUENZEN, MUENZEN, MUENZNAME, inKupfer, kiste, muenzen, rowToItem, teile } from '../beute.js';
import { hatText, jetzt, toNumber } from '../werte.js';

const router = Router();
router.use(requireAuth);

const menge = (wert) => Math.max(1, Math.min(9999, parseInt(wert, 10) || 1));

/**
 * Wer einen Gegenstand trägt, muss ein Blatt *dieser* Kampagne sein – oder
 * niemand. Ohne die Prüfung schlüge eine erfundene Kennung erst am
 * Fremdschlüssel fehl, und aus einem Tippfehler würde ein 500er.
 */
function traegerPruefen(holderId, campaignId) {
  if (holderId == null || holderId === '') return { ok: true, id: null };
  const da = db.prepare('SELECT 1 FROM characters WHERE id = ? AND campaign_id = ?').get(holderId, campaignId);
  return da ? { ok: true, id: holderId } : { ok: false };
}

const traegerFehlt = (res) =>
  res.status(400).json({ code: 'charakter_nicht_gefunden', error: 'Diesen Charakter gibt es in dieser Kampagne nicht.' });

function melden(req) {
  broadcast('beute', kiste(req.campaignId), { exceptClient: originClient(req), campaignId: req.campaignId });
}

// GET /api/stash – die Beutekiste dieser Kampagne: Gegenstände und Münzen.
router.get('/', (req, res) => {
  res.json(kiste(req.campaignId));
});

// POST /api/stash/items – jede und jeder darf eintragen, was gefunden wurde
router.post('/items', (req, res) => {
  const body = req.body ?? {};
  if (!hatText(body.name)) {
    return res.status(400).json({ code: 'name_fehlt', error: 'Ohne Namen kein Eintrag.' });
  }
  const traeger = traegerPruefen(body.holderId, req.campaignId);
  if (!traeger.ok) return traegerFehlt(res);

  const id = randomUUID();
  db.prepare(
    'INSERT INTO stash_items (id, name, qty, weight, notes, holder_id, campaign_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    body.name.trim().slice(0, 120),
    menge(body.qty),
    Math.max(0, toNumber(body.weight, 0)),
    typeof body.notes === 'string' ? body.notes.slice(0, 500) : '',
    traeger.id,
    req.campaignId,
    jetzt()
  );
  melden(req);
  res.status(201).json(rowToItem(db.prepare('SELECT * FROM stash_items WHERE id = ?').get(id)));
});

// PUT /api/stash/items/:id  { name?, qty?, weight?, notes?, holderId? } –
// ändern, auch wer den Gegenstand trägt. Der Träger muss ein Blatt dieser
// Kampagne sein.
router.put('/items/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM stash_items WHERE id = ? AND campaign_id = ?').get(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'gegenstand_nicht_gefunden', error: 'Gegenstand nicht gefunden.' });
  const body = req.body ?? {};
  const traeger = 'holderId' in body ? traegerPruefen(body.holderId, req.campaignId) : { ok: true, id: row.holder_id };
  if (!traeger.ok) return traegerFehlt(res);

  db.prepare('UPDATE stash_items SET name = ?, qty = ?, weight = ?, notes = ?, holder_id = ? WHERE id = ?').run(
    hatText(body.name) ? body.name.trim().slice(0, 120) : row.name,
    'qty' in body ? menge(body.qty) : row.qty,
    'weight' in body ? Math.max(0, toNumber(body.weight, row.weight)) : row.weight,
    typeof body.notes === 'string' ? body.notes.slice(0, 500) : row.notes,
    traeger.id,
    row.id
  );
  melden(req);
  res.json(rowToItem(db.prepare('SELECT * FROM stash_items WHERE id = ?').get(row.id)));
});

// DELETE /api/stash/items/:id – aus der Kiste nehmen.
router.delete('/items/:id', (req, res) => {
  const info = db.prepare('DELETE FROM stash_items WHERE id = ? AND campaign_id = ?').run(req.params.id, req.campaignId);
  if (info.changes === 0) return res.status(404).json({ code: 'gegenstand_nicht_gefunden', error: 'Gegenstand nicht gefunden.' });
  melden(req);
  res.status(204).end();
});

// PUT /api/stash/coins  { pp?, gp?, ep?, sp?, cp? } – die Münzen in der Kiste
// setzen. Nur, was mitgeschickt wird, ändert sich; nie unter null.
router.put('/coins', (req, res) => {
  const body = req.body ?? {};
  const naechste = { ...KEINE_MUENZEN };
  const vorher = muenzen(req.campaignId);
  for (const m of MUENZEN) naechste[m] = Math.max(0, Math.floor(toNumber(body[m], vorher[m])));
  setState('beute', req.campaignId, naechste);
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
  const vorrat = muenzen(req.campaignId);
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
  // Doppelt genannt heißt nicht doppelt bezahlt: Ohne das Entdoppeln zählte
  // ein zweimal geschickter Charakter als zwei Köpfe – und strich zwei
  // Anteile ein, während alle anderen weniger bekämen.
  const ids = Array.isArray(req.body?.characterIds) ? [...new Set(req.body.characterIds)].slice(0, 20) : [];
  if (ids.length === 0) return res.status(400).json({ code: 'empfaenger_fehlen', error: 'Es wurde niemand genannt, der etwas bekommen soll.' });

  const holen = db.prepare('SELECT * FROM characters WHERE id = ? AND campaign_id = ?');
  const charaktere = ids.map((id) => holen.get(id, req.campaignId)).filter(Boolean);
  if (charaktere.length === 0) return res.status(400).json({ code: 'charakter_nicht_gefunden', error: 'Keiner dieser Charaktere ist verzeichnet.' });

  const vorrat = muenzen(req.campaignId);
  const { proKopf: anteil, rest, restInKupfer } = teile(vorrat, charaktere.length);
  if (inKupfer(anteil) <= 0) {
    return res.status(400).json({ code: 'beute_zu_klein', error: 'In der Kiste liegt zu wenig, um sie zu teilen.' });
  }

  // Blätter und Kiste gehen zusammen: Bräche es nach dem dritten von fünf
  // Blättern ab, wäre das Gold aus der Kiste nicht fort, aber drei hätten es
  // schon – und beim zweiten Versuch bekämen sie es noch einmal.
  const stand = jetzt();
  const schreiben = db.prepare('UPDATE characters SET data = ?, updated_at = ? WHERE id = ?');
  const bezahlt = transaktion(() => {
    const blaetter = charaktere.map((row) => {
      const data = JSON.parse(row.data);
      data.currency = { ...KEINE_MUENZEN, ...data.currency };
      for (const m of MUENZEN) data.currency[m] = toNumber(data.currency[m], 0) + anteil[m];
      schreiben.run(JSON.stringify(data), stand, row.id);
      return { row, data };
    });
    setState('beute', req.campaignId, rest);
    return blaetter;
  });

  // Verkündet wird erst, was wirklich geschrieben ist.
  for (const { row, data } of bezahlt) {
    meldeBlatt(
      row,
      { id: row.id, name: row.name, hp: data?.combat?.hp ?? null, ownerId: row.owner_id, shared: !!row.shared },
      { campaignId: req.campaignId }
    );
  }

  const beschreibung = MUENZEN.filter((m) => anteil[m])
    .map((m) => `${anteil[m]} ${MUENZNAME[m]}`)
    .join(', ');
  chronik.log(
    {
      kind: 'notiz',
      actor: req.user.name,
      text: `Die Beute wird geteilt: je ${beschreibung} für ${charaktere.map((c) => c.name).join(', ')}.`,
      meta: {
        anteil,
        empfaenger: charaktere.length,
        namen: charaktere.map((c) => c.name),
        restInKupfer,
      },
    },
    req.campaignId
  );

  melden(req);
  res.json({ anteil, rest, empfaenger: charaktere.length });
});

/**
 * POST /api/stash/items/:id/kopieren  { campaignId }
 *
 * Ein Fund in einer anderen Kampagne – der Dolch, der in zwei Geschichten
 * vorkommen soll. Getragen wird er drüben nur, wenn dort jemand gleichen
 * Namens steht; sonst liegt er einfach in der Kiste.
 */
router.post('/items/:id/kopieren', requireDm, zielPruefen, (req, res) => {
  const row = db.prepare('SELECT * FROM stash_items WHERE id = ? AND campaign_id = ?').get(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'gegenstand_nicht_gefunden', error: 'Gegenstand nicht gefunden.' });

  const kopiert = kopiereGegenstand(row, req.ziel);
  meldeNachZiel('beute', req.ziel);
  res.status(201).json({ ...kopiert, campaignId: req.ziel });
});

export default router;
