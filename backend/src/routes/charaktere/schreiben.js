/**
 * Blätter anlegen, speichern, zuteilen, löschen.
 *
 * Das Speichern (`PUT /:id`) ist der häufigste Weg des ganzen Almanachs:
 * Das Blatt speichert sich 600 ms nach jedem Tastendruck von selbst. Es
 * zieht zwei Dinge nach sich, die man leicht übersieht – Trefferpunkte
 * wandern zum verknüpften Kämpfer, und geänderte Sinne verschieben die Sicht
 * am Spieltisch.
 */
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, transaktion } from '../../db.js';
import { isDm } from '../../auth.js';
import { broadcast } from '../../events.js';
import { sendeSzene } from '../../spieltisch/melden.js';
import { sendeKampf } from '../../kampf/sicht.js';
import { meldeEntzug } from '../../blattmeldung.js';
import { darfBearbeiten, holen, meldeAenderung, rowToCharacter, sinneAus } from './blatt.js';

const router = Router();

/** Die Regelwerke, die ein Blatt haben kann: D&D 5e und das freie Blatt. */
const SYSTEME = new Set(['dnd5e', 'freeform']);

// POST /api/characters  { name, system?, data?, npc? } – ein neues Blatt
// anlegen: aus „Neuer Charakter“ oder aus einer mitgenommenen Datei.
router.post('/', (req, res) => {
  const { name, system = 'dnd5e', data = {} } = req.body ?? {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ code: 'name_fehlt', error: 'Name ist erforderlich' });
  }
  // Seit sich mitgenommene Blätter wieder einlesen lassen, kommt der Rumpf
  // nicht mehr nur aus „Neuer Charakter“, sondern aus einer Datei, die
  // jemand in der Hand hatte. Ein unbekanntes Regelwerk oder ein Datensatz,
  // der kein Objekt ist, ergäbe ein Blatt, das keine Seite öffnen kann.
  if (!SYSTEME.has(system) || data === null || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({ code: 'blatt_ungueltig', error: 'Dieses Blatt kann der Almanach nicht lesen.' });
  }
  // Ein NSC-Blatt ist nie geteilt – sonst wäre es keins.
  const npc = isDm(req.user) && req.body?.npc === true;
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO characters (id, name, system, data, owner_id, shared, npc, campaign_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, name.trim(), system, JSON.stringify(data), req.user.id, npc ? 0 : 1, npc ? 1 : 0, req.campaignId, now, now);
  const row = holen(id, req.campaignId);
  meldeAenderung(row, req);
  res.status(201).json(rowToCharacter(row));
});

// PUT /api/characters/:id – full update (autosave from the sheet editor)
router.put('/:id', (req, res) => {
  const existing = holen(req.params.id, req.campaignId);
  if (!existing) return res.status(404).json({ code: 'charakter_nicht_gefunden', error: 'Charakter nicht gefunden' });
  if (!darfBearbeiten(req.user, existing)) {
    return res.status(403).json({ code: 'blatt_fremd', error: 'Dieses Blatt gehört jemand anderem.' });
  }

  const { name, data } = req.body ?? {};
  // Auch hier kann der Rumpf aus einer Datei stammen: „Einlesen“ am Blatt
  // übernimmt eine bearbeitete Blattdatei (etwa nach einer KI) in dieses
  // Blatt. Ein Datensatz, der kein Objekt ist, ergäbe ein Blatt, das keine
  // Seite mehr öffnen kann – erst prüfen, dann schreiben.
  if (data !== undefined && (data === null || typeof data !== 'object' || Array.isArray(data))) {
    return res.status(400).json({ code: 'blatt_ungueltig', error: 'Dieses Blatt kann der Almanach nicht lesen.' });
  }
  const nextName = typeof name === 'string' && name.trim() ? name.trim() : existing.name;
  const nextData = data !== undefined ? JSON.stringify(data) : existing.data;
  const now = new Date().toISOString();

  // Die Sinne stehen auf dem Blatt, aber sie entscheiden, was am Spieltisch
  // im Dunkeln sichtbar ist. Wer sich Dunkelsicht einträgt, soll nicht erst
  // die Seite neu laden müssen. Verglichen wird, weil das Blatt bei jedem
  // Tastendruck speichert – und eine ganze Szene je Buchstabe wäre unsinnig.
  const sinneVorher = JSON.stringify(sinneAus(existing.data));
  const sinneNachher = JSON.stringify(sinneAus(nextData));

  db.prepare('UPDATE characters SET name = ?, data = ?, updated_at = ? WHERE id = ?').run(
    nextName,
    nextData,
    now,
    req.params.id
  );
  const row = holen(req.params.id, req.campaignId);

  // Trefferpunkte im Kampf mitziehen, damit die Spielleitung sofort sieht,
  // wenn jemand Schaden einträgt. Nur was sich wirklich ändert, wird
  // geschrieben und verkündet: Das Blatt speichert bei jedem Tastendruck,
  // und nicht jeder davon betrifft die Trefferpunkte.
  const hp = JSON.parse(row.data)?.combat?.hp;
  if (hp && Number.isFinite(Number(hp.current))) {
    const aktuell = Number(hp.current) || 0;
    const hoechst = Number(hp.max) || 0;
    const veraltet = db
      .prepare('SELECT id FROM combatants WHERE character_id = ? AND campaign_id = ? AND (hp != ? OR max_hp != ?)')
      .all(row.id, req.campaignId, aktuell, hoechst);
    if (veraltet.length) {
      const setzen = db.prepare('UPDATE combatants SET hp = ?, max_hp = ? WHERE id = ?');
      for (const { id } of veraltet) setzen.run(aktuell, hoechst, id);
      sendeKampf(req.campaignId);
    }
  }

  if (sinneVorher !== sinneNachher) sendeSzene(req.campaignId);

  meldeAenderung(row, req);
  res.json(rowToCharacter(row));
});

// PATCH /api/characters/:id  { ownerId?, shared?, npc? } – Besitz und
// Sichtbarkeit. `npc` stellt ein Blatt hinter den Schirm (true) oder holt es
// in die Runde zurück (false); beides nur die Spielleitung.
router.patch('/:id', (req, res) => {
  const existing = holen(req.params.id, req.campaignId);
  if (!existing) return res.status(404).json({ code: 'charakter_nicht_gefunden', error: 'Charakter nicht gefunden' });
  if (!darfBearbeiten(req.user, existing)) {
    return res.status(403).json({ code: 'blatt_fremd', error: 'Dieses Blatt gehört jemand anderem.' });
  }

  const { ownerId, shared, npc } = req.body ?? {};

  // Erst alle Rechte prüfen, dann schreiben. Andersherum stünde nach
  // `{ shared, npc }` von einem Spieler das `shared` schon geändert da, ehe
  // das `npc` mit 403 abgewiesen wird – eine Absage, die doch etwas getan hat.
  // Zuteilen und hinter den Schirm holen darf nur die Spielleitung.
  if ((ownerId !== undefined || npc !== undefined) && !isDm(req.user)) {
    return res.status(403).json({ code: 'nur_spielleitung', error: 'Das darf nur die Spielleitung.' });
  }
  if (ownerId != null && !db.prepare('SELECT id FROM users WHERE id = ?').get(ownerId)) {
    return res.status(400).json({ code: 'konto_nicht_gefunden', error: 'Konto nicht gefunden.' });
  }

  // Hinter den Schirm und wieder zurück – in beide Richtungen, jederzeit.
  const npcWechsel = npc !== undefined && Boolean(npc) !== Boolean(existing.npc);
  let kaempferUmgestellt = 0;

  transaktion(() => {
    if (ownerId !== undefined) db.prepare('UPDATE characters SET owner_id = ? WHERE id = ?').run(ownerId, existing.id);
    if (shared !== undefined) db.prepare('UPDATE characters SET shared = ? WHERE id = ?').run(shared ? 1 : 0, existing.id);
    if (npc !== undefined) {
      // Wer hinter dem Schirm liegt, ist nicht mehr geteilt – steht npc mit
      // im Rumpf, gewinnt es deshalb gegen ein gleichzeitiges `shared`. Wer
      // wieder hervorkommt, steht in der Runde, außer `shared: false` sagt
      // ausdrücklich anderes. Der Besitz bleibt stehen: So gehört ein Held,
      // den die Spielleitung zurückholt, wieder derselben Person.
      const geteilt = npc ? 0 : shared === undefined || shared ? 1 : 0;
      db.prepare('UPDATE characters SET npc = ?, shared = ? WHERE id = ?').run(npc ? 1 : 0, geteilt, existing.id);
    }
    // Steht das Blatt schon im Kampf, wechselt seine Zeile die Art mit: Ein
    // NSC zeigt der Runde keine Trefferpunkte, ein Held schon (kampf/sicht.js).
    // Monster bleiben Monster.
    if (npcWechsel) {
      kaempferUmgestellt = db
        .prepare('UPDATE combatants SET type = ? WHERE character_id = ? AND campaign_id = ? AND type = ?')
        .run(npc ? 'npc' : 'pc', existing.id, req.campaignId, npc ? 'pc' : 'npc').changes;
    }
  });

  const row = holen(existing.id, req.campaignId);
  meldeAenderung(row, req);
  // Wer das Blatt eben noch in seiner Übersicht hatte und es jetzt nicht mehr
  // sehen darf – weil es hinter den Schirm wanderte oder nicht mehr geteilt
  // ist –, soll es dort auch nicht weiter stehen haben.
  meldeEntzug(existing, row, req.campaignId);
  if (kaempferUmgestellt) sendeKampf(req.campaignId);
  // Wem eine Figur gehört, bestimmt, wer durch ihre Augen sieht und was
  // jemand im Nebel noch erkennt (spieltisch/sichtbarkeit.js) – also bekommt
  // jede Person ihre Sicht neu.
  if (ownerId !== undefined || npcWechsel) sendeSzene(req.campaignId);
  res.json(rowToCharacter(row));
});

// DELETE /api/characters/:id – ein Blatt löschen. Das darf, wem es gehört,
// und die Spielleitung; Figuren auf dem Tisch verlieren dabei nur ihren
// Verweis darauf.
router.delete('/:id', (req, res) => {
  const existing = holen(req.params.id, req.campaignId);
  if (!existing) return res.status(404).json({ code: 'charakter_nicht_gefunden', error: 'Charakter nicht gefunden' });
  if (!darfBearbeiten(req.user, existing)) {
    return res.status(403).json({ code: 'blatt_fremd', error: 'Dieses Blatt gehört jemand anderem.' });
  }
  db.prepare('DELETE FROM characters WHERE id = ?').run(existing.id);
  broadcast('charakter:entfernt', { id: existing.id }, { campaignId: req.campaignId });
  res.status(204).end();
});

export default router;
