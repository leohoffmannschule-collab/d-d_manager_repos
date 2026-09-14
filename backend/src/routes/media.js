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

// GET /api/media/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id);
  if (!row || row.campaign_id !== req.campaignId) {
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
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
  res.setHeader('Content-Type', row.mime);
  fs.createReadStream(datei).pipe(res);
});

// DELETE /api/media/:id
router.delete('/:id', requireDm, (req, res) => {
  const row = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id);
  if (!row || row.campaign_id !== req.campaignId) {
    return res.status(404).json({ code: 'bild_nicht_gefunden', error: 'Bild nicht gefunden.' });
  }
  fs.rmSync(path.join(mediaDir, row.filename), { force: true });
  db.prepare('DELETE FROM media WHERE id = ?').run(row.id);
  res.status(204).end();
});

export default router;
