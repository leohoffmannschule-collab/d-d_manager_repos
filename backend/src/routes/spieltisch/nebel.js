/**
 * Der Nebel des Krieges: Striche setzen, alles verhüllen, alles aufdecken.
 *
 * Gespeichert wird der Nebel als JSON-Liste der aufgedeckten Felder
 * (`["3,4", "3,5", …]`) in `scenes.fog`. Zum Browser wandert er dagegen als
 * Bitkarte, ein Bit je Feld (siehe ../../sicht.js, `alsBitkarte`) – und ein
 * einzelner Strich nur als die Felder, die er berührt.
 */
import { Router } from 'express';
import { db } from '../../db.js';
import { requireDm } from '../../auth.js';
import { broadcast, originClient } from '../../events.js';
import { holeSzene, offeneFelder, rowToScene } from '../../spieltisch/umwandlung.js';
import { rasterBereich } from '../../sicht.js';
import { sendeFigurenWennGeaendert, sendeSzene } from '../../spieltisch/melden.js';

const router = Router();

// 200 x 200 Felder sind 40 000 – bei einem Meter je Feld also die
// zweihundert Meter, die eine große Außenkarte braucht. Etwas Kopfraum
// darüber, damit ein leicht verschobenes Raster nicht schon anstößt.
const MAX_FELDER = 65536;

// POST /api/scenes/:id/nebel  { cells: ['3,4', …], revealed: true }
//
// Felder aufdecken oder wieder verhüllen – ein Pinselstrich der
// Spielleitung. Die Oberfläche bündelt die Felder eines Strichs, bevor sie
// schickt (pages/tisch/useNebelpinsel.js); höchstens 4000 je Anfrage.
router.post('/:id/nebel', requireDm, (req, res) => {
  const row = holeSzene(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });

  const cells = Array.isArray(req.body?.cells)
    ? req.body.cells.filter((c) => typeof c === 'string' && /^-?\d+,-?\d+$/.test(c)).slice(0, 4000)
    : [];
  if (cells.length === 0) return res.json({ ok: true });

  const revealed = req.body?.revealed !== false;
  const offen = offeneFelder(row);
  for (const cell of cells) {
    if (revealed) offen.add(cell);
    else offen.delete(cell);
  }

  const naechste = [...offen].slice(0, MAX_FELDER);
  db.prepare('UPDATE scenes SET fog = ? WHERE id = ?').run(JSON.stringify(naechste), row.id);

  // Nur die Änderung wandert übers Netz, nicht die ganze Karte.
  broadcast('nebel', { sceneId: row.id, cells, revealed }, { exceptClient: originClient(req), campaignId: req.campaignId });
  // Deckt der Strich eine Figur auf oder wieder zu, muss auch das ankommen.
  sendeFigurenWennGeaendert(req.campaignId);
  res.json({ ok: true, offen: naechste.length });
});

// POST /api/scenes/:id/nebel/alles  { revealed: true|false } – die ganze Karte
// auf einmal aufdecken oder zudecken.
router.post('/:id/nebel/alles', requireDm, (req, res) => {
  const row = holeSzene(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });
  const revealed = req.body?.revealed === true;

  let fog = [];
  if (revealed) {
    // Dieselbe Feldrechnung wie überall (sicht.js, und im Browser
    // lib/rasterkarte.js): Bei verschobenem Raster fängt das erste Feld links
    // oben bei einem negativen Index an.
    const { minX, minY, maxX, maxY } = rasterBereich(rowToScene(row));
    for (let y = minY; y <= maxY && fog.length < MAX_FELDER; y++) {
      for (let x = minX; x <= maxX && fog.length < MAX_FELDER; x++) fog.push(`${x},${y}`);
    }
  }
  db.prepare('UPDATE scenes SET fog = ? WHERE id = ?').run(JSON.stringify(fog), row.id);
  sendeSzene(req.campaignId);
  res.json({ ok: true, offen: fog.length });
});

export default router;
