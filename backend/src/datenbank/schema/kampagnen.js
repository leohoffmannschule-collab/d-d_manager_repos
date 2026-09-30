/**
 * Kampagnen und wer darin mitspielt.
 *
 * Eine Kampagne im Papierkorb erkennt man an `deleted_at` (nachgerüstet in
 * kampagnenwanderung.js); bis die Frist abläuft, bleibt alles stehen.
 *
 * Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
 * steht in ../nachruesten.js und ../kampagnenwanderung.js.
 */
export const KAMPAGNEN = `
  /* --- Kampagnen: dieselbe Runde, mehrere Geschichten --------------------
     Konten, Rollen und Einladungen bleiben rundenweit gemeinsam; alles, was
     am Tisch entsteht (Figuren, Chronik, Spielszenen, Beute …), gehört zu
     genau einer Kampagne. Wer an mehreren teilnimmt, wählt nach der
     Anmeldung, an welcher gerade gespielt wird – festgehalten in der
     eigenen Sitzung (auth_sessions.campaign_id), nicht im Konto selbst. */

  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS campaign_members (
    campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TEXT NOT NULL,
    PRIMARY KEY (campaign_id, user_id)
  );
`;
