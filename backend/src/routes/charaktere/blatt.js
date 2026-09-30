/**
 * Ein Charakterblatt zwischen Datenbank und Antwort – und wer es sehen oder
 * ändern darf.
 *
 * Hier stehen die Regeln, die jeder Weg der Charaktere braucht:
 *
 *   darfSehen       NSC-Blätter nur die Spielleitung; sonst eigene und geteilte
 *   darfBearbeiten  die Spielleitung und wem das Blatt gehört
 *
 * Und die zwei Formen, in denen ein Blatt hinausgeht: vollständig
 * (`rowToCharacter`) und als Kurzfassung für Listen (`summary`).
 */
import { db } from '../../db.js';
import { isDm } from '../../auth.js';
import { originClient } from '../../events.js';
import { meldeBlatt } from '../../blattmeldung.js';

/** Eine Zeile aus `characters` so, wie die Oberfläche sie bekommt – das Blatt als Objekt. */
export function rowToCharacter(row) {
  return {
    id: row.id,
    name: row.name,
    system: row.system,
    data: JSON.parse(row.data),
    ownerId: row.owner_id,
    ownerName: row.owner_name ?? null,
    shared: !!row.shared,
    npc: !!row.npc,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Kurzfassung für Übersichten, Spieltisch und Kampfliste. */
export function summary(row) {
  const character = rowToCharacter(row);
  const className = character.data?.className ?? '';
  const level = character.data?.level;
  return {
    id: character.id,
    name: character.name,
    system: character.system,
    ownerId: character.ownerId,
    ownerName: character.ownerName,
    shared: character.shared,
    npc: character.npc,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
    classLevel: [className, className && level ? level : ''].filter(Boolean).join(' '),
    race: character.data?.race ?? '',
    portrait: character.data?.portrait ?? '',
    hp: character.data?.combat?.hp ?? null,
    ac: character.data?.combat?.armorClass ?? null,
    initiative:
      Math.floor(((Number(character.data?.abilities?.dex) || 10) - 10) / 2) +
      (Number(character.data?.combat?.initiativeBonus) || 0),
  };
}

// Jede Abfrage holt den Namen des Besitzers gleich mit.
export const SELECT = `SELECT c.*, u.name AS owner_name FROM characters c LEFT JOIN users u ON u.id = c.owner_id`;

/** Ein Blatt dieser Kampagne – eines aus einer fremden gibt es für diesen Weg nicht. */
export const holen = (id, campaignId) => db.prepare(`${SELECT} WHERE c.id = ? AND c.campaign_id = ?`).get(id, campaignId);

// Charaktere ohne Besitzer stammen aus der Zeit vor den Konten – sie gehören
// der Spielleitung, bis sie jemandem zugewiesen werden.
export const darfBearbeiten = (user, row) => isDm(user) || row.owner_id === user.id;

/**
 * NSC-Blätter sind der Zettel der Spielleitung hinter dem Schirm: die Werte
 * des Wirts, des Räuberhauptmanns, des Drachen. Sie bleiben dort, auch wenn
 * das Blatt versehentlich als „geteilt“ markiert ist – deshalb wird das hier
 * *vor* allen anderen Regeln geprüft, nicht danach.
 *
 * Dieselbe Regel gilt für den Live-Kanal und steht dafür noch einmal in
 * ../../blattmeldung.js (`spielerSiehtBlatt`). Wer sie hier ändert, ändert
 * sie dort mit.
 */
export const darfSehen = (user, row) => {
  if (isDm(user)) return true;
  if (row.npc) return false;
  return row.owner_id === user.id || !!row.shared;
};

/** Die Sinne aus einem gespeicherten Blatt, ohne dass ein Fehler alles reißt. */
export function sinneAus(rohesJson) {
  try {
    return JSON.parse(rohesJson)?.combat?.senses ?? null;
  } catch {
    return null;
  }
}

/**
 * Den anderen Fenstern der Kampagne die Kurzfassung schicken – dem eigenen
 * nicht, und nur denen, die das Blatt sehen dürfen (siehe blattmeldung.js).
 */
export function meldeAenderung(row, req) {
  meldeBlatt(row, summary(row), { exceptClient: originClient(req), campaignId: req.campaignId });
}
