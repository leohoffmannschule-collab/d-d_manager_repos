/**
 * Indizes für die häufigsten Abfragen.
 *
 * Figuren einer Szene, die jüngsten Würfe, die Einträge einer Sitzung – das
 * sind die Abfragen, die bei jedem Zug am Tisch laufen.
 *
 * Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
 * steht in ../nachruesten.js und ../kampagnenwanderung.js.
 */
export const INDIZES = `
  CREATE INDEX IF NOT EXISTS idx_tokens_scene ON tokens(scene_id);
  CREATE INDEX IF NOT EXISTS idx_rolls_created ON rolls(created_at);
  CREATE INDEX IF NOT EXISTS idx_chronicle_session ON chronicle(session_id, created_at);
`;
