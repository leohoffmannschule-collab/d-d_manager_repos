/**
 * Die ältesten Tabellen: Charakterblätter und der Spiegel des Kompendiums.
 *
 * Die Charaktere waren zuerst da – noch vor Konten und Kampagnen. Deshalb
 * stehen `owner_id`, `shared`, `npc` und `campaign_id` nicht hier, sondern
 * kommen über datenbank/nachruesten.js und kampagnenwanderung.js dazu.
 * `api_cache` gehört niemandem: Er hält Antworten der offenen 5e-API vor.
 *
 * Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
 * steht in ../nachruesten.js und ../kampagnenwanderung.js.
 */
export const GRUNDSTOCK = `
  CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    system TEXT NOT NULL DEFAULT 'dnd5e',
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS api_cache (
    cache_key TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    fetched_at TEXT NOT NULL
  );
`;
