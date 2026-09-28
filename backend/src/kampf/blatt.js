/**
 * Trefferpunkte laufen in beide Richtungen.
 *
 * Schaden, den die Spielleitung im Kampf einträgt, steht sofort auf dem
 * Charakterblatt – und umgekehrt. Ohne das führte jede Runde zwei Zahlen
 * für dasselbe, und am Ende des Abends stimmte keine davon.
 *
 * Es geht nur, wenn der Kämpfer mit einem Blatt verknüpft ist; ein Monster
 * hat keines, und dann tut diese Funktion nichts.
 */
import { db } from '../db.js';
import { broadcast } from '../events.js';

/** Trefferpunkte auf das verknüpfte Charakterblatt zurückschreiben. */
export function syncCharakter(combatant, campaignId) {
  if (!combatant.character_id) return;
  const row = db.prepare('SELECT * FROM characters WHERE id = ? AND campaign_id = ?').get(combatant.character_id, campaignId);
  if (!row) return;
  const data = JSON.parse(row.data);
  data.combat = data.combat ?? {};
  data.combat.hp = { ...(data.combat.hp ?? {}), current: combatant.hp, max: combatant.max_hp };
  db.prepare('UPDATE characters SET data = ?, updated_at = ? WHERE id = ?').run(
    JSON.stringify(data),
    new Date().toISOString(),
    row.id
  );
  broadcast(
    'charakter:aktualisiert',
    { id: row.id, name: row.name, hp: data.combat.hp, ownerId: row.owner_id, shared: !!row.shared },
    { campaignId }
  );
}
