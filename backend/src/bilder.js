/**
 * Bilder als Dateien ablegen – für den Upload (routes/media.js) und für das
 * Bildnis eines Charakterblattes, das eine Figur auf dem Tisch tragen soll.
 *
 * Bilder liegen als Dateien neben der Datenbank (im Ordner `medien`), nur
 * der Verweis steht in der Tabelle `media`. Ankommen dürfen sie als
 * `data:`-URL, wie der Browser sie aus einer Datei erzeugt – und wie das
 * Blatt sein Bildnis speichert (`data.portrait`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { db, mediaDir } from './db.js';

/** Höchstens so groß darf ein Bild sein. */
export const MAX_BYTES = 12 * 1024 * 1024;

/** Die erlaubten Bildformate und ihre Dateiendung. */
export const ERLAUBT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

/**
 * Eine data:-URL lesen und prüfen.
 *
 * @returns {{ mime: string, endung: string, bytes: Buffer } | { fehler: { status: number, code: string, error: string } }}
 */
export function bildLesen(dataUrl) {
  const treffer = /^data:([\w./+-]+);base64,(.+)$/s.exec(String(dataUrl ?? ''));
  if (!treffer) return { fehler: { status: 400, code: 'bild_fehlt', error: 'Es wurde kein Bild übergeben.' } };
  const mime = treffer[1];
  const endung = ERLAUBT[mime];
  if (!endung) {
    return {
      fehler: { status: 415, code: 'bildformat_nicht_erlaubt', error: 'Nur PNG, JPEG, WebP, GIF oder AVIF können abgelegt werden.' },
    };
  }
  const bytes = Buffer.from(treffer[2], 'base64');
  if (bytes.length === 0) return { fehler: { status: 400, code: 'bild_leer', error: 'Die Bilddatei ist leer.' } };
  if (bytes.length > MAX_BYTES) {
    return {
      fehler: { status: 413, code: 'bild_zu_gross', error: `Das Bild ist größer als ${Math.round(MAX_BYTES / 1024 / 1024)} MB.` },
    };
  }
  return { mime, endung, bytes };
}

/** Ein gelesenes Bild als Datei ablegen und eintragen. Gibt die Kennung zurück. */
export function bildAblegen({ mime, endung, bytes }, campaignId, dateiname = null) {
  const id = randomUUID();
  const name = dateiname ?? `${id}.${endung}`;
  fs.writeFileSync(path.join(mediaDir, name), bytes);
  db.prepare('INSERT INTO media (id, filename, mime, bytes, campaign_id, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    id,
    name,
    mime,
    bytes.length,
    campaignId,
    new Date().toISOString()
  );
  return id;
}

/**
 * Das Bild, das eine Figur zu diesem Blatt tragen soll – als Kennung in
 * `media`, oder null, wenn das Blatt keines hat.
 *
 * Zuerst ein eigens hinterlegtes Figurenbild (`data.miniMediaId`), sonst das
 * Bildnis (`data.portrait`). Das Bildnis wird dafür einmal als Datei
 * abgelegt; benannt nach seinem Inhalt (`bildnis-<Prüfsumme>`), sodass
 * dasselbe Bildnis beim nächsten Auslegen dieselbe Datei bekommt statt einer
 * weiteren. Ändert sich das Bildnis, entsteht eine neue.
 *
 * @param {string|null} characterId
 * @param {string} campaignId
 * @returns {string|null}
 */
export function bildnisFuerFigur(characterId, campaignId) {
  if (!characterId) return null;
  const row = db.prepare('SELECT data FROM characters WHERE id = ? AND campaign_id = ?').get(characterId, campaignId);
  if (!row) return null;
  let data;
  try {
    data = JSON.parse(row.data);
  } catch {
    return null;
  }
  if (data?.miniMediaId && db.prepare('SELECT 1 FROM media WHERE id = ?').get(data.miniMediaId)) return data.miniMediaId;
  const bild = bildLesen(data?.portrait);
  if (bild.fehler) return null;
  const name = `bildnis-${createHash('sha256').update(bild.bytes).digest('hex').slice(0, 32)}.${bild.endung}`;
  const vorhanden = db.prepare('SELECT id FROM media WHERE filename = ?').get(name);
  if (vorhanden && fs.existsSync(path.join(mediaDir, name))) return vorhanden.id;
  if (vorhanden) db.prepare('DELETE FROM media WHERE id = ?').run(vorhanden.id);
  return bildAblegen(bild, campaignId, name);
}
