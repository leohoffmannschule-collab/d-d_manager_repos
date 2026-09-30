/**
 * Die einzelnen Stücke, die in eine andere Kampagne wandern können – je
 * eine Funktion für je eine Art.
 *
 * Jede bekommt die Zeile aus der Quellkampagne und die Kennung des Ziels,
 * legt drüben eine neue Zeile an und gibt zurück, was sie angelegt hat.
 * Keine davon öffnet selbst eine Transaktion; das tut, wer mehrere
 * zusammen kopiert (alles.js).
 */
import { randomUUID } from 'node:crypto';
import { db, getState, setState } from '../db.js';
import { KEINE_MUENZEN, MUENZEN, muenzen } from '../beute.js';
import { jetzt } from '../werte.js';

/**
 * Ein Verweis auf einen Charakter, übersetzt in die Zielkampagne.
 *
 * Eine Figur auf der Karte und ein getragener Gegenstand zeigen auf ein
 * Charakterblatt – und Blätter gehören zu genau einer Kampagne. Drüben wird
 * deshalb der gleichnamige Charakter gesucht: Wer die Runde zuerst hinüber
 * kopiert und danach die Szene, findet seine Figuren wieder an den Helden
 * hängen. Steht dort niemand dieses Namens, hängt der Verweis eben frei –
 * die Figur bleibt eine Figur, der Gegenstand bleibt ein Gegenstand.
 */
export function gleicherCharakter(characterId, ziel) {
  if (!characterId) return null;
  const quelle = db.prepare('SELECT name FROM characters WHERE id = ?').get(characterId);
  if (!quelle) return null;
  const dort = db
    .prepare('SELECT id FROM characters WHERE campaign_id = ? AND name = ? COLLATE NOCASE ORDER BY created_at')
    .get(ziel, quelle.name);
  return dort?.id ?? null;
}

/**
 * Ein Charakterblatt.
 *
 * Bildnisse stecken als Daten-URL im Blatt selbst, hochgeladene Bilder
 * gehören der ganzen Runde – beides wandert von allein mit. Der Besitzer
 * zieht nur mit, wenn er in der Zielkampagne überhaupt mitspielt; sonst
 * gehört das Blatt dort der Spielleitung.
 */
export function kopiereCharakter(row, ziel) {
  const besitzerBleibt =
    row.owner_id &&
    db.prepare('SELECT 1 FROM campaign_members WHERE campaign_id = ? AND user_id = ?').get(ziel, row.owner_id);

  const id = randomUUID();
  const now = jetzt();
  db.prepare(
    `INSERT INTO characters (id, name, system, data, owner_id, shared, npc, campaign_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, row.name, row.system, row.data, besitzerBleibt ? row.owner_id : null, row.shared, row.npc, ziel, now, now);

  return { id, name: row.name, besitzerMitgenommen: !!besitzerBleibt };
}

/** Ein Handzettel. Ob er ausgeteilt war, zieht mit – drüben ist es ein neuer Abend. */
export function kopiereNotiz(row, ziel) {
  const id = randomUUID();
  const now = jetzt();
  db.prepare(
    `INSERT INTO notes (id, title, content, tags, visibility, campaign_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, row.title, row.content, row.tags, row.visibility, ziel, now, now);
  return { id, name: row.title };
}

/**
 * Eine Szene samt Figuren und aufgedecktem Nebel.
 *
 * Die Karte dahinter gehört der Runde und bleibt dieselbe – kopiert wird das
 * Spiel darauf. Der Nebel kommt so mit, wie er steht; wer der neuen Runde
 * alles wieder verhüllen will, schließt ihn drüben mit einem Klick.
 */
export function kopiereSzene(row, ziel) {
  const id = randomUUID();
  const now = jetzt();
  db.prepare(
    `INSERT INTO scenes (id, name, media_id, width, height, grid_size, grid_offset_x, grid_offset_y,
                         grid_visible, fog_enabled, fog, dark, sight, unit, scale, map_id, campaign_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    row.name,
    row.media_id,
    row.width,
    row.height,
    row.grid_size,
    row.grid_offset_x,
    row.grid_offset_y,
    row.grid_visible,
    row.fog_enabled,
    row.fog,
    row.dark,
    row.sight,
    row.unit,
    row.scale,
    row.map_id,
    ziel,
    now
  );

  const einfuegen = db.prepare(
    `INSERT INTO tokens (id, scene_id, name, x, y, size, color, media_id, character_id, combatant_id,
                         hidden, light_bright, light_dim, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`
  );
  const figuren = db.prepare('SELECT * FROM tokens WHERE scene_id = ? ORDER BY created_at').all(row.id);
  for (const figur of figuren) {
    // Der Verweis auf den Kämpfer bleibt hier: Ein laufender Kampf reist nicht mit.
    einfuegen.run(
      randomUUID(),
      id,
      figur.name,
      figur.x,
      figur.y,
      figur.size,
      figur.color,
      figur.media_id,
      gleicherCharakter(figur.character_id, ziel),
      figur.hidden,
      figur.light_bright,
      figur.light_dim,
      now
    );
  }

  // Liegt drüben noch nichts auf dem Tisch, kommt die erste Kopie gleich
  // darauf – wie bei einer neu angelegten Szene. Ohne Szene bleibt der
  // Spieltisch dort sonst leer und die halbe Werkzeugleiste stumm.
  if (!getState('szene', ziel, null)) setState('szene', ziel, id);

  return { id, name: row.name, figuren: figuren.length };
}

/** Ein Stück aus der Beutekiste. Getragen wird es drüben nur von jemandem gleichen Namens. */
export function kopiereGegenstand(row, ziel) {
  const id = randomUUID();
  db.prepare(
    'INSERT INTO stash_items (id, name, qty, weight, notes, holder_id, campaign_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, row.name, row.qty, row.weight, row.notes, gleicherCharakter(row.holder_id, ziel), ziel, jetzt());
  return { id, name: row.name };
}

/**
 * Die Münzen der Kiste – dazugelegt, nicht ersetzt.
 *
 * Drüben liegt vielleicht schon etwas, und das darf ein Kopiervorgang nicht
 * verschlucken. Also wird addiert. Wer zweimal kopiert, hat drüben auch
 * zweimal das Gold: Kopieren ist Kopieren, kein Abgleich.
 */
export function kopiereMuenzen(von, ziel) {
  const hier = getState('beute', von, null);
  if (!hier) return null;
  const dort = muenzen(ziel);
  const summe = { ...KEINE_MUENZEN };
  for (const m of MUENZEN) summe[m] = (Number(dort[m]) || 0) + (Number(hier[m]) || 0);
  setState('beute', ziel, summe);
  return summe;
}
