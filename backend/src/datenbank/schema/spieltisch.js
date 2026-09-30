/**
 * Der Spieltisch: Szenen, Karten, Figuren, Bilder, der kleine Schlüssel-Wert-Speicher.
 *
 * Eine *Karte* (`maps`) ist Vorbereitung und gehört der Runde, eine *Szene*
 * (`scenes`) ist eine Karte im Spiel und gehört einer Kampagne. Bilder
 * (`media`) liegen als Dateien neben der Datenbank; hier steht nur der
 * Verweis darauf. `app_state` hält Einzelwerte je Kampagne – welche Szene
 * aufliegt, ob der Vorhang zu ist (siehe db.js, getState/setState).
 *
 * Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
 * steht in ../nachruesten.js und ../kampagnenwanderung.js.
 */
export const SPIELTISCH = `
  /* --- Spieltisch: Szenen, Figuren, Nebel -------------------------------- */

  CREATE TABLE IF NOT EXISTS scenes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    media_id TEXT,
    width INTEGER NOT NULL DEFAULT 0,
    height INTEGER NOT NULL DEFAULT 0,
    grid_size INTEGER NOT NULL DEFAULT 70,
    grid_offset_x INTEGER NOT NULL DEFAULT 0,
    grid_offset_y INTEGER NOT NULL DEFAULT 0,
    grid_visible INTEGER NOT NULL DEFAULT 1,
    fog_enabled INTEGER NOT NULL DEFAULT 1,
    fog TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );

  /* --- Kartenbibliothek der Spielleitung ---------------------------------
     Eine Karte ist Vorbereitung: das Bild samt einmal eingestelltem Raster.
     Eine Szene ist eine Karte im Spiel, mit Nebel und Figuren darauf. Aus
     einer Karte lassen sich beliebig viele Szenen legen, ohne sie erneut
     hochzuladen oder das Raster neu auszurichten. */

  CREATE TABLE IF NOT EXISTS maps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    media_id TEXT,
    thumb_media_id TEXT,
    width INTEGER NOT NULL DEFAULT 0,
    height INTEGER NOT NULL DEFAULT 0,
    grid_size INTEGER NOT NULL DEFAULT 70,
    grid_offset_x INTEGER NOT NULL DEFAULT 0,
    grid_offset_y INTEGER NOT NULL DEFAULT 0,
    tags TEXT NOT NULL DEFAULT '[]',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tokens (
    id TEXT PRIMARY KEY,
    scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '',
    x REAL NOT NULL DEFAULT 0,
    y REAL NOT NULL DEFAULT 0,
    size INTEGER NOT NULL DEFAULT 1,
    color TEXT NOT NULL DEFAULT '#9a2b22',
    media_id TEXT,
    character_id TEXT REFERENCES characters(id) ON DELETE SET NULL,
    combatant_id TEXT REFERENCES combatants(id) ON DELETE SET NULL,
    hidden INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    mime TEXT NOT NULL,
    bytes INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;
