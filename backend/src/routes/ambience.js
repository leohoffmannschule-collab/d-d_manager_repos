/**
 * Der Klangteppich.
 *
 * Hier liegen Spotify-Adressen, sonst nichts – kein Ton geht je durch diesen
 * Server. Er sammelt, was die Spielleitung vorbereitet hat, sagt der Runde,
 * was gerade dran ist, und gibt den Takt vor: läuft es gerade, und an welcher
 * Stelle. Abgespielt wird in den Browsern der Runde, von Spotify selbst.
 *
 * Die Sammlung gehört der ganzen Runde: Dieselbe Tavernenmusik passt in jede
 * Geschichte. Was gerade aufliegt, gilt dagegen nur für die eine Kampagne –
 * sonst wechselte der anderen Runde mitten im Spiel die Musik.
 *
 * Drei Felder tragen das Gleichschalten, und ihr Zusammenspiel ist der Kern:
 *
 *   `spielt`    Soll gerade Musik laufen?
 *   `position`  An welcher Stelle des Stückes, in Sekunden.
 *   `stand`     Wann `position` gemessen wurde.
 *
 * Aus den letzten beiden rechnet jedes Fenster selbst aus, wo es stehen
 * müsste: `position + (jetzt − stand)`. Deshalb muss der Server nichts
 * ticken lassen und nichts nachschicken – ein Fenster, das eine Minute
 * später dazukommt, findet die Stelle von allein.
 *
 * Was der Almanach dabei *nicht* tut: Er verlangt kein Spotify-Konto, keinen
 * Entwicklerschlüssel und keine Freischaltliste. Das geht, weil die Runde
 * Spotifys eigenen Einbettungsspieler benutzt (siehe
 * frontend/src/components/klang/Klangspieler.jsx). Der Preis dafür steht
 * dort: ohne angemeldetes Premium-Konto im selben Browser gibt es
 * 30-Sekunden-Ausschnitte statt ganzer Stücke.
 */
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { requireAuth, requireDm } from '../auth.js';
import * as chronik from '../chronicle.js';
import { aktuellerKlang, holen, klangAuflegen, rowToKlang, setzeKlang, spotifyAdresse, stelle } from '../klang.js';
import { hatText, jetzt, schlagworte } from '../werte.js';

const router = Router();
router.use(requireAuth);

/* --- Zweige -------------------------------------------------------------- */

// GET /api/ambience/aktiv – die ganze Runde darf wissen, was dran ist.
router.get('/aktiv', (req, res) => {
  res.json(aktuellerKlang(req.campaignId));
});

// GET /api/ambience – die Sammlung ist Vorbereitung und bleibt beim DM.
router.get('/', requireDm, (req, res) => {
  res.json(db.prepare('SELECT * FROM ambience ORDER BY name COLLATE NOCASE').all().map(rowToKlang));
});

// POST /api/ambience  { name, link, tags?, notes? }
//
// Einen Spotify-Link in die Klangbibliothek legen. Angenommen wird jede
// Schreibweise, die Spotify selbst herausgibt – geteilter Link, Adresse aus
// dem Browser, spotify:-Kennung –, gespeichert wird immer die Kennung.
// Und nur die: Kein Stück, keine Datei, kein Konto – siehe den Kopf dieser Datei.
router.post('/', requireDm, (req, res) => {
  const body = req.body ?? {};
  const adresse = spotifyAdresse(body.uri ?? body.link);
  if (!adresse) {
    return res.status(400).json({
      code: 'keine_spotify_adresse',
      error: 'Das ist kein Spotify-Link auf eine Wiedergabeliste, ein Album, ein Stück oder einen Künstler.',
    });
  }
  if (!hatText(body.name)) {
    return res.status(400).json({ code: 'name_fehlt', error: 'Name ist erforderlich.' });
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO ambience (id, name, uri, kind, tags, notes, campaign_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    body.name.trim().slice(0, 120),
    adresse.uri,
    adresse.kind,
    JSON.stringify(schlagworte(body.tags)),
    typeof body.notes === 'string' ? body.notes.slice(0, 2000) : '',
    req.campaignId,
    jetzt()
  );
  res.status(201).json(rowToKlang(holen(id)));
});

// PUT /api/ambience/:id – umbenennen, neu verschlagworten oder auf einen
// anderen Link zeigen lassen. Nur, was mitgeschickt wird, ändert sich.
router.put('/:id', requireDm, (req, res) => {
  const row = holen(req.params.id);
  if (!row) return res.status(404).json({ code: 'klang_nicht_gefunden', error: 'Ambiente nicht gefunden.' });
  const body = req.body ?? {};

  let uri = row.uri;
  let kind = row.kind;
  if (body.uri !== undefined || body.link !== undefined) {
    const adresse = spotifyAdresse(body.uri ?? body.link);
    if (!adresse) {
      return res.status(400).json({ code: 'keine_spotify_adresse', error: 'Das ist kein Spotify-Link.' });
    }
    uri = adresse.uri;
    kind = adresse.kind;
  }

  db.prepare('UPDATE ambience SET name = ?, uri = ?, kind = ?, tags = ?, notes = ? WHERE id = ?').run(
    hatText(body.name) ? body.name.trim().slice(0, 120) : row.name,
    uri,
    kind,
    'tags' in body ? JSON.stringify(schlagworte(body.tags)) : row.tags,
    typeof body.notes === 'string' ? body.notes.slice(0, 2000) : row.notes,
    row.id
  );

  const frisch = rowToKlang(holen(row.id));
  // Liegt gerade genau dieses auf, wandert die Änderung sofort mit – sonst
  // stünde am Tisch noch der alte Name oder der alte Verweis.
  if (aktuellerKlang(req.campaignId).ambienceId === frisch.id) {
    setzeKlang(req.campaignId, {
      ...aktuellerKlang(req.campaignId),
      uri: frisch.uri,
      webUrl: frisch.webUrl,
      kind: frisch.kind,
      name: frisch.name,
      notes: frisch.notes,
    });
  }
  res.json(frisch);
});

// DELETE /api/ambience/:id – aus der Bibliothek nehmen. Karten, die diese
// Ambiente mitbrachten, bringen danach keine mehr mit.
router.delete('/:id', requireDm, (req, res) => {
  const row = holen(req.params.id);
  if (!row) return res.status(404).json({ code: 'klang_nicht_gefunden', error: 'Ambiente nicht gefunden.' });

  db.prepare('DELETE FROM ambience WHERE id = ?').run(row.id);
  db.prepare('UPDATE maps SET ambience_id = NULL WHERE ambience_id = ?').run(row.id);
  // Was gelöscht ist, soll auch nicht mehr am Tisch stehen.
  if (aktuellerKlang(req.campaignId).ambienceId === row.id) setzeKlang(req.campaignId, {});
  res.status(204).end();
});

// POST /api/ambience/:id/auflegen – diese Ambiente für die ganze Runde
// auflegen. Sie beginnt am Anfang und läuft; jedes Fenster bekommt sie über
// den Live-Kanal (`klang`) und spielt sie im eigenen Spotify-Rahmen ab.
router.post('/:id/auflegen', requireDm, (req, res) => {
  const klang = klangAuflegen(req.params.id, req.campaignId);
  if (!klang) return res.status(404).json({ code: 'klang_nicht_gefunden', error: 'Ambiente nicht gefunden.' });
  res.json(klang);
});

/**
 * POST /api/ambience/steuerung  { spielt, position }
 *
 * Der Taktstock der Spielleitung: anhalten, weiterlaufen lassen, oder alle
 * wieder auf dieselbe Stelle ziehen.
 *
 * `position` kommt aus dem Fenster der Spielleitung – dort weiß der
 * Spotify-Spieler, wo er gerade steht. Der Server glaubt es ihr und
 * vermerkt nur, *wann* sie es gesagt hat; daraus rechnet jedes andere
 * Fenster seine eigene Stelle aus.
 *
 * Liegt nichts auf, gibt es auch nichts zu steuern.
 */
router.post('/steuerung', requireDm, (req, res) => {
  const klang = aktuellerKlang(req.campaignId);
  if (!klang.uri) return res.status(409).json({ code: 'klang_still', error: 'Es liegt gerade nichts auf.' });

  res.json(
    setzeKlang(req.campaignId, {
      ...klang,
      spielt: req.body?.spielt !== false,
      position: stelle(req.body?.position),
      stand: jetzt(),
    })
  );
});

// POST /api/ambience/stille – nichts liegt mehr auf.
router.post('/stille', requireDm, (req, res) => {
  chronik.log({ kind: 'klang', text: 'Die Musik verstummt.' }, req.campaignId);
  res.json(setzeKlang(req.campaignId, {}));
});

export default router;
