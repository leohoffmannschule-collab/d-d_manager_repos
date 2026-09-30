/**
 * Die Sammlungen: gespeicherte Begegnungen, Beutekiste, Klangteppich.
 *
 * Begegnungen und Klänge sind Vorbereitung der ganzen Runde; die Beute
 * gehört einer Kampagne – ihre Münzen stehen nicht hier, sondern als
 * Einzelwert `beute` in `app_state`.
 *
 * Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
 * steht in ../nachruesten.js und ../kampagnenwanderung.js.
 */
export const SAMMLUNGEN = `
  /* --- Gespeicherte Begegnungen ------------------------------------------ */

  CREATE TABLE IF NOT EXISTS encounters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    entries TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );

  /* --- Beutekiste der Runde ---------------------------------------------- */

  CREATE TABLE IF NOT EXISTS stash_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    weight REAL NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    holder_id TEXT REFERENCES characters(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL
  );

  /* --- Klangteppich: hinterlegte Spotify-Links ---------------------------- */

  CREATE TABLE IF NOT EXISTS ambience (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    uri TEXT NOT NULL,
    kind TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
`;
