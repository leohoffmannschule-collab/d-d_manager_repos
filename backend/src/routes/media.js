/**
 * Bilder: hochladen und ausliefern.
 *
 * Bilder liegen als **Dateien** neben der Datenbank (im Ordner `medien`),
 * nicht in ihr. Nur der Verweis steht in der Tabelle `media`. Der Grund:
 * Eine Battlemap hat gern zehn Megabyte, und eine Datenbank, in der
 * dreihundert davon stecken, lässt sich weder schnell lesen noch bequem
 * sichern.
 *
 * Hochgeladen wird als `data:`-URL im JSON-Rumpf statt als multipart-
 * Formular. Das spart ein zusätzliches Paket auf dem Server, und der
 * Browser erzeugt so eine URL aus einer ausgewählten Datei von selbst.
 * Deshalb hat dieser Weg auch einen eigenen, größeren Rahmen (20 MB) und
 * steht in server.js *vor* dem allgemeinen JSON-Leser.
 *
 * Bilder gehören der ganzen Runde, nicht einer Kampagne: Dieselbe Karte
 * soll in jeder Geschichte aufliegen können, ohne ein zweites Mal
 * hochgeladen zu werden.
 */
import { Router } from 'express';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { db, mediaDir } from '../db.js';
import { requireAuth, requireDm } from '../auth.js';

const router = Router();

// Karten sind groß – deshalb hier ein eigener, großzügigerer Rahmen als für
// den Rest der API. Ankommen darf eine data:-URL, wie sie der Browser aus
// einer ausgewählten Datei erzeugt; so braucht es kein multipart-Paket.
const MAX_BYTES = 12 * 1024 * 1024;
const ERLAUBT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

router.use(requireAuth);

// POST /api/media  { dataUrl, filename }
//
// Ein Bild ablegen – eine Karte, ein Bildnis, das Bild einer Figur. Es kommt
// als data:-URL, wird als Datei neben die Datenbank gelegt (data/medien/) und
// bekommt eine Kennung, unter der GET es wieder ausliefert. Erlaubt sind nur
// die Bildformate oben, und höchstens MAX_BYTES.
router.post('/', express.json({ limit: '20mb' }), (req, res) => {
  const { dataUrl } = req.body ?? {};
  const treffer = /^data:([\w./+-]+);base64,(.+)$/s.exec(String(dataUrl ?? ''));
  if (!treffer) return res.status(400).json({ code: 'bild_fehlt', error: 'Es wurde kein Bild übergeben.' });

  const mime = treffer[1];
  const endung = ERLAUBT[mime];
  if (!endung) {
    return res.status(415).json({ code: 'bildformat_nicht_erlaubt', error: 'Nur PNG, JPEG, WebP, GIF oder AVIF können abgelegt werden.' });
  }

  const bytes = Buffer.from(treffer[2], 'base64');
  if (bytes.length === 0) return res.status(400).json({ code: 'bild_leer', error: 'Die Bilddatei ist leer.' });
  if (bytes.length > MAX_BYTES) {
    return res.status(413).json({ code: 'bild_zu_gross', error: `Das Bild ist größer als ${Math.round(MAX_BYTES / 1024 / 1024)} MB.` });
  }

  if (!req.campaignId) return res.status(409).json({ code: 'keine_kampagne', error: 'Bitte zuerst eine Kampagne wählen.' });

  const id = randomUUID();
  fs.writeFileSync(path.join(mediaDir, `${id}.${endung}`), bytes);
  db.prepare('INSERT INTO media (id, filename, mime, bytes, campaign_id, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    id,
    `${id}.${endung}`,
    mime,
    bytes.length,
    req.campaignId,
    new Date().toISOString()
  );
  res.status(201).json({ id, url: `/api/media/${id}`, bytes: bytes.length });
});

/**
 * GET /api/media/:id
 *
 * Bilder gehören der Runde, nicht einer Kampagne: Dieselbe Karte soll in jeder
 * Geschichte aufliegen können, ohne ein zweites Mal hochgeladen zu werden.
 * Zu sehen bekommt sie ohnehin nur, wer angemeldet ist *und* die Kennung
 * kennt – und die steht nur in einer Szene, die die Spielleitung aufgelegt hat.
 */
router.get('/:id', (req, res, next) => {
  const row = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ code: 'bild_nicht_gefunden', error: 'Bild nicht gefunden.' });
  }
  const datei = path.join(mediaDir, row.filename);
  if (!fs.existsSync(datei)) {
    // Der Eintrag steht, die Datei fehlt: Das passiert beim Umziehen auf ein
    // anderes Gerät, wenn der Ordner „medien“ nicht (oder eine Ebene zu tief)
    // mitgekommen ist. Stillschweigend ein leeres Bild zu liefern, hieße die
    // Spielleitung im Dunkeln stehen zu lassen – deshalb steht es im Protokoll.
    console.warn(`  Bilddatei fehlt: ${datei}  (Eintrag ${row.id} ist da, die Datei nicht)`);
    return res.status(404).json({ code: 'bilddatei_fehlt', error: 'Zu diesem Bild fehlt die Datei auf der Platte.' });
  }

  // Der Inhalt zu einer Kennung ändert sich nie – der Browser darf ihn also
  // behalten. Auf dem Spieltisch spart das jede Menge Nachladen.
  //
  // `sendFile` statt eines eigenen Lesestroms: Ein Strom ohne Fehlerhörer
  // reißt bei einem Lesefehler (Datei zwischen Prüfen und Öffnen weg,
  // fehlende Rechte) den ganzen Server mit. `sendFile` meldet den Fehler an
  // `next`, und nebenbei beherrscht es Teilanfragen und ETags.
  //
  // Mit `root` und dem nackten Dateinamen, nicht mit dem ganzen Pfad:
  // `sendFile` verweigert Pfade mit einem Punktordner darin – und läge der
  // Datenordner etwa unter `~/.almanach`, gäbe es sonst kein einziges Bild.
  res.sendFile(
    row.filename,
    { root: mediaDir, headers: { 'Content-Type': row.mime, 'Cache-Control': 'private, max-age=31536000, immutable' } },
    (fehler) => {
      // Ein abgebrochener Abruf (Seite weitergeblättert) ist kein Fehler des
      // Servers und gehört nicht ins Protokoll.
      if (fehler && fehler.code !== 'ECONNABORTED') next(fehler);
    }
  );
});

// DELETE /api/media/:id – ein Bild samt Datei löschen. Wer es noch zeigt (eine
// Szene, eine Figur), zeigt danach ins Leere; die Kartenbibliothek räumt
// deshalb über `bildFreigeben` nur ab, was niemand mehr braucht.
router.delete('/:id', requireDm, (req, res) => {
  const row = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ code: 'bild_nicht_gefunden', error: 'Bild nicht gefunden.' });
  }
  fs.rmSync(path.join(mediaDir, row.filename), { force: true });
  db.prepare('DELETE FROM media WHERE id = ?').run(row.id);
  res.status(204).end();
});

export default router;
