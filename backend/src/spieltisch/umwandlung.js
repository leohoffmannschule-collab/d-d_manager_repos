/**
 * Zwischen Datenbank und Antwort: Zeilen in Objekte, und die immer gleichen
 * Nachschlagefragen.
 *
 * Nichts davon entscheidet etwas – hier wird nur umgeformt und geholt.
 * Deshalb steht es für sich: Wer wissen will, welche Felder eine Szene zum
 * Browser schickt, muss dafür nicht durch fünfhundert Zeilen Routen.
 *
 * Die Schreibweisen unterscheiden sich mit Absicht: In der Datenbank heißt
 * es `grid_size`, im JSON `gridSize`. Diese Datei ist die einzige Stelle,
 * an der beides aufeinandertrifft.
 */
import { db, getState } from '../db.js';

/* --- Umwandlung ---------------------------------------------------------- */

export function rowToScene(row) {
  return {
    id: row.id,
    name: row.name,
    mediaId: row.media_id,
    width: row.width,
    height: row.height,
    gridSize: row.grid_size,
    gridOffsetX: row.grid_offset_x,
    gridOffsetY: row.grid_offset_y,
    gridVisible: !!row.grid_visible,
    fogEnabled: !!row.fog_enabled,
    dark: !!row.dark,
    sight: Number(row.sight) || 0,
    unit: row.unit ?? 'fuss',
    scale: Number(row.scale) > 0 ? Number(row.scale) : 5,
    mapId: row.map_id,
    createdAt: row.created_at,
  };
}

/** Die aufgedeckten Felder einer Szene, roh aus der Datenbank. */
export function offeneFelder(row) {
  try {
    return new Set(JSON.parse(row.fog));
  } catch {
    return new Set();
  }
}

export function rowToToken(row) {
  return {
    id: row.id,
    sceneId: row.scene_id,
    name: row.name,
    x: row.x,
    y: row.y,
    size: row.size,
    color: row.color,
    mediaId: row.media_id,
    characterId: row.character_id,
    combatantId: row.combatant_id,
    hidden: !!row.hidden,
    lightBright: row.light_bright ?? 0,
    lightDim: row.light_dim ?? 0,
  };
}

export const holeSzene = (id, campaignId) => db.prepare('SELECT * FROM scenes WHERE id = ? AND campaign_id = ?').get(id, campaignId);
// Figuren tragen ihre Kampagne nicht selbst – sie hängen an einer Szene, die
// es bereits tut. Der Verbund verhindert, dass eine Figur aus einer fremden
// Kampagne über ihre bloße Kennung erreicht werden kann.
export const holeFigur = (id, campaignId) =>
  db
    .prepare('SELECT t.* FROM tokens t JOIN scenes s ON s.id = t.scene_id WHERE t.id = ? AND s.campaign_id = ?')
    .get(id, campaignId);
export const aktiveSzeneId = (campaignId) => getState('szene', campaignId, null);

/**
 * Der Vorhang über dem Spieltisch.
 *
 * Ist er zu, bekommt die Runde *nichts* – kein Bild, keine Figuren, nicht
 * einmal den Namen der Szene. Das ist der Sinn der Sache: Die Spielleitung
 * baut dahinter auf, wechselt die Karte, stellt Gegner, malt Nebel, und die
 * Runde sieht davon keinen Schnipsel, bis der Vorhang aufgeht.
 *
 * Er hängt am Tisch, nicht an der Szene – sonst müsste man ihn für jede neue
 * Karte neu zuziehen, und genau in dem Moment sähe die Runde alles.
 */
export const vorhangZu = (campaignId) => getState('vorhang', campaignId, false) === true;

export function figuren(sceneId) {
  return db.prepare('SELECT * FROM tokens WHERE scene_id = ? ORDER BY created_at').all(sceneId).map(rowToToken);
}
