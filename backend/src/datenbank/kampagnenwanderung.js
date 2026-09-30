/**
 * Der eine Wanderungsschritt, der mehr tut als eine Spalte anzufügen.
 *
 * Mit den Kampagnen bekam der Almanach eine Ebene, die es vorher nicht gab.
 * Ein bestehender Almanach hatte Charaktere, Szenen und eine Beutekiste –
 * nur keine Kampagne, zu der sie gehören könnten. Dieser Schritt legt sie
 * an und schreibt alles Vorhandene hinein.
 *
 * Er läuft **nur einmal**: Sobald eine Kampagne existiert, kehrt er sofort
 * um. Das ist wichtig, denn aufgerufen wird er bei jedem Start.
 *
 * Das Heikelste daran steht ganz unten: `app_state` trug seine Werte bisher
 * unter nacktem Schlüssel („beute“, „szene“). Jetzt gehört die Kampagne
 * davor. Ohne diesen Umzug stünde die Kiste der Runde nach dem Update
 * plötzlich leer da – das Gold wäre nicht fort, aber niemand fände es
 * wieder.
 */
import { randomUUID } from 'node:crypto';
import { db } from './verbindung.js';
import { addColumnIfMissing } from './nachruesten.js';
import { transaktion } from './transaktion.js';

/**
 * Jede Tabelle, die am Tisch entsteht, bekommt eine `campaign_id`.
 *
 * Nicht dabei und mit Absicht: `users`, `invites` und `auth_sessions` –
 * Konten gehören der ganzen Runde, nicht einer Geschichte. Und `api_cache`,
 * der Spiegel des Kompendiums, der niemandem gehört.
 *
 * Achtung, die Spalte bedeutet nicht überall dasselbe. Bei allem, was am
 * Tisch *gespielt* wird (Charaktere, Szenen, Würfe …), grenzt sie ab: Jede
 * Abfrage filtert danach. Bei der *Vorbereitung* – `maps`, `media`,
 * `library`, `encounters`, `ambience` – hält sie nur fest, in welcher
 * Kampagne etwas angelegt wurde. Gefiltert wird dort nicht, denn
 * Vorbereitung gehört der ganzen Runde (siehe ../kampagnen.js, wo genau
 * diese Tabellen beim endgültigen Entfernen stehen bleiben).
 */
export const KAMPAGNEN_TABELLEN = [
  'characters', 'combatants', 'library', 'notes', 'rolls', 'messages',
  'scenes', 'maps', 'media', 'encounters', 'stash_items', 'ambience', 'game_sessions',
];

/** Die Spalten anfügen – und, falls nötig, die erste Kampagne bauen. */
export function ruesteKampagnenNach() {
  for (const tabelle of KAMPAGNEN_TABELLEN) addColumnIfMissing(tabelle, 'campaign_id', 'TEXT');

  // Die *aktive* Kampagne hängt an der Sitzung, nicht am Konto: Dieselbe
  // Person kann in zwei Fenstern in zwei Kampagnen sitzen.
  addColumnIfMissing('auth_sessions', 'campaign_id', 'TEXT');

  // Eine gelöschte Kampagne ist erst einmal nur weggeräumt: Sie verschwindet
  // aus allen Listen, ihre Daten bleiben aber liegen, bis die Frist abläuft
  // oder jemand sie ausdrücklich endgültig entfernt.
  addColumnIfMissing('campaigns', 'deleted_at', 'TEXT');

  ersteKampagneSichern();
}

/**
 * Alles Bestehende in eine erste Kampagne überführen.
 *
 * Zwei Ausstiege gleich zu Beginn, und beide sind wichtig:
 *   – Gibt es schon eine Kampagne, ist der Umzug längst geschehen.
 *   – Gibt es noch keine Konten, ist der Almanach frisch eingerichtet und
 *     legt seine erste Kampagne beim ersten Konto selbst an
 *     (siehe routes/auth.js).
 *
 * Der erste Ausstieg ist zugleich der Grund für die Transaktion: Bräche der
 * Umzug nach dem Anlegen der Kampagne ab (Strom weg, volle Karte), hielte
 * jeder weitere Start ihn für erledigt – und die übrigen Zeilen blieben ohne
 * Kampagne liegen, für niemanden mehr sichtbar. Also ganz oder gar nicht.
 */
function ersteKampagneSichern() {
  if (db.prepare('SELECT COUNT(*) AS n FROM campaigns').get().n > 0) return;
  transaktion(umziehen);
}

/**
 * Der eigentliche Umzug, in einer Transaktion: eine erste Kampagne anlegen,
 * alle Konten hineinsetzen und jede Zeile ohne Kampagne ihr zuschlagen.
 */
function umziehen() {
  const nutzer = db.prepare('SELECT id FROM users ORDER BY created_at').all();
  if (nutzer.length === 0) return;

  const id = randomUUID();
  const jetzt = new Date().toISOString();
  const ersteSl = db.prepare("SELECT id FROM users WHERE role = 'sl' ORDER BY created_at LIMIT 1").get();
  db.prepare('INSERT INTO campaigns (id, name, created_by, created_at) VALUES (?, ?, ?, ?)').run(
    id,
    'Erste Kampagne',
    ersteSl?.id ?? null,
    jetzt
  );

  // Alle bisherigen Konten sind dabei – vorher gab es ja keine Auswahl.
  const mitglied = db.prepare('INSERT INTO campaign_members (campaign_id, user_id, joined_at) VALUES (?, ?, ?)');
  for (const { id: userId } of nutzer) mitglied.run(id, userId, jetzt);

  for (const tabelle of KAMPAGNEN_TABELLEN) {
    db.prepare(`UPDATE ${tabelle} SET campaign_id = ? WHERE campaign_id IS NULL`).run(id);
  }
  db.prepare('UPDATE auth_sessions SET campaign_id = ? WHERE campaign_id IS NULL').run(id);

  // app_state trug seine Werte bisher unter nacktem Schlüssel (z. B. „beute“) –
  // jetzt gehört die Kampagne mit davor. Ohne diesen Umzug stünde die Kiste
  // der Runde nach dem Update plötzlich wieder leer da.
  const alteSchluessel = ['kampf', 'szene', 'vorhang', 'nsc_sicht', 'klang', 'beute', 'vorlagen:gesaet'];
  for (const schluessel of alteSchluessel) {
    const alt = db.prepare('SELECT value FROM app_state WHERE key = ?').get(schluessel);
    if (!alt) continue;
    db.prepare('INSERT OR IGNORE INTO app_state (key, value) VALUES (?, ?)').run(`${id}:${schluessel}`, alt.value);
    db.prepare('DELETE FROM app_state WHERE key = ?').run(schluessel);
  }
}
