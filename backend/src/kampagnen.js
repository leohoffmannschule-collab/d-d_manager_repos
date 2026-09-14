import fs from 'node:fs';
import path from 'node:path';
import { db, mediaDir } from './db.js';

/**
 * Der Papierkorb für Kampagnen.
 *
 * Gelöscht wird in zwei Schritten. Zuerst wandert eine Kampagne nur in den
 * Papierkorb: Sie verschwindet aus allen Listen, aber kein Zeichen ihrer
 * Daten ist fort – ein Fehlgriff kostet so nichts weiter als einen Klick auf
 * „Wiederherstellen“. Erst nach Ablauf der Frist (oder auf ausdrücklichen
 * Wunsch) wird wirklich alles entfernt, samt der hochgeladenen Bilder.
 *
 * Das ist Absicht: Was hier gelöscht wird, sind Monate an Spielabenden.
 */

export const FRIST_TAGE = 30;

/** Tabellen, die eine campaign_id tragen. Kinder daran hängen per FK mit. */
const TABELLEN = [
  'characters', 'combatants', 'library', 'notes', 'rolls', 'messages',
  'scenes', 'maps', 'encounters', 'stash_items', 'ambience', 'game_sessions',
];

/** Wie viele Tage bleiben dieser Kampagne noch im Papierkorb? */
export function verbleibendeTage(deletedAt) {
  const vergangen = (Date.now() - new Date(deletedAt).getTime()) / (24 * 60 * 60 * 1000);
  return Math.max(0, Math.ceil(FRIST_TAGE - vergangen));
}

/**
 * Alles entfernen, was zu dieser Kampagne gehört – ohne Netz und doppelten
 * Boden. Die Bilddateien gehen zuerst: Bliebe die Datenbank stehen und die
 * Dateien wären fort, sähe die Runde kaputte Karten; andersherum liegen nur
 * ein paar verwaiste Dateien herum, die niemanden stören.
 */
export function endgueltigEntfernen(campaignId) {
  const bilder = db.prepare('SELECT filename FROM media WHERE campaign_id = ?').all(campaignId);
  for (const { filename } of bilder) {
    fs.rmSync(path.join(mediaDir, filename), { force: true });
  }

  for (const tabelle of [...TABELLEN, 'media']) {
    db.prepare(`DELETE FROM ${tabelle} WHERE campaign_id = ?`).run(campaignId);
  }

  // Der Kleinkram der Kampagne: aktive Szene, Vorhang, Kampfrunde, Beute.
  db.prepare("DELETE FROM app_state WHERE key LIKE ? ESCAPE '\\'").run(`${campaignId.replace(/[%_\\]/g, '\\$&')}:%`);

  // Sitzungen, die noch auf diese Kampagne zeigen, stehen sonst im Leeren.
  db.prepare('UPDATE auth_sessions SET campaign_id = NULL WHERE campaign_id = ?').run(campaignId);

  // Mitgliedschaften hängen per Fremdschlüssel daran und gehen mit.
  db.prepare('DELETE FROM campaigns WHERE id = ?').run(campaignId);
}

/**
 * Was die Frist überschritten hat, wird geräumt. Läuft beim Start des Servers
 * und jedes Mal, wenn jemand in den Papierkorb sieht – ein eigener Zeitgeber
 * wäre für einen Almanach, der ohnehin selten tagelang durchläuft, Aufwand
 * ohne Gewinn.
 */
export function raeumePapierkorb() {
  const grenze = new Date(Date.now() - FRIST_TAGE * 24 * 60 * 60 * 1000).toISOString();
  const faellig = db
    .prepare('SELECT id FROM campaigns WHERE deleted_at IS NOT NULL AND deleted_at < ?')
    .all(grenze);
  for (const { id } of faellig) endgueltigEntfernen(id);
  return faellig.length;
}
