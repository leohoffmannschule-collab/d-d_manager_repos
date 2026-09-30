/**
 * Eine Änderung an einem Charakterblatt verkünden – aber nur denen, die das
 * Blatt sehen dürfen.
 *
 * `charakter:aktualisiert` geht von vier Stellen aus: dem Speichern eines
 * Blattes, dem Zuteilen und Teilen, dem Kampf (Trefferpunkte laufen zurück
 * aufs Blatt) und dem Auszahlen der Beute. Früher ging die Nachricht an jedes
 * Fenster der Kampagne. Die Oberfläche zeigte ein fremdes NSC-Blatt zwar
 * nicht an – sie ändert nur Einträge, die sie schon kennt –, aber Name,
 * Bildnis, Trefferpunkte und Rüstungsklasse des Räuberhauptmanns standen im
 * Netzwerkfenster jedes Spielerbrowsers, sobald die Spielleitung sein Blatt
 * anfasste. Das widerspricht der ersten Regel des Almanachs: Was die Runde
 * nicht sehen darf, wird nicht geschickt.
 *
 * Deshalb steht die Regel, wer ein Blatt sehen darf, hier ein zweites Mal –
 * diesmal in der Sprache des Live-Kanals (Rollen und Konten statt einer
 * einzelnen Anfrage). Sie muss mit `darfSehen` in routes/charaktere/blatt.js
 * übereinstimmen:
 *
 *   Spielleitung  jedes Blatt
 *   Runde         kein NSC-Blatt; sonst geteilte Blätter und das eigene
 */
import { db } from './db.js';
import { broadcast } from './events.js';

/** Darf dieses Konto (Rolle `spieler`) das Blatt sehen? Dieselbe Regel wie `darfSehen`, ohne die Spielleitung. */
export function spielerSiehtBlatt(row, userId) {
  if (row.npc) return false;
  return !!row.shared || row.owner_id === userId;
}

/**
 * `charakter:aktualisiert` an die Spielleitung und an die Mitspielenden, die
 * das Blatt sehen dürfen.
 *
 * @param {{ npc: number|boolean, shared: number|boolean, owner_id: string|null }} row  die Zeile aus `characters`
 * @param {object} nachricht  was hinausgeht – die Kurzfassung oder nur die Trefferpunkte
 * @param {{ campaignId: string, exceptClient?: number|null }} wohin
 */
export function meldeBlatt(row, nachricht, { campaignId, exceptClient = null }) {
  broadcast('charakter:aktualisiert', nachricht, { role: 'sl', campaignId, exceptClient });
  if (row.npc) return;
  broadcast('charakter:aktualisiert', nachricht, {
    role: 'spieler',
    campaignId,
    exceptClient,
    // Ein ungeteiltes Blatt sieht außer der Spielleitung nur, wem es gehört.
    // Ohne Besitzer (eine Vorlage, ein Blatt aus der Zeit vor den Konten)
    // bleibt diese Liste leer – dann erfährt es niemand aus der Runde.
    ...(row.shared ? {} : { userIds: row.owner_id ? [row.owner_id] : [] }),
  });
}

/**
 * Wer das Blatt eben noch sehen durfte und jetzt nicht mehr, bekommt
 * `charakter:entfernt` – sonst stünde es bis zum nächsten Neuladen weiter in
 * seiner Übersicht und führte beim Anklicken ins 403.
 *
 * Gebraucht beim Zuteilen, Teilen und Hinter-den-Schirm-Legen (PATCH), also
 * überall, wo sich die Sichtbarkeit eines Blattes ändert, ohne dass es
 * gelöscht wird.
 *
 * @param {object} vorher  die Zeile vor der Änderung
 * @param {object} nachher die Zeile danach
 * @param {string} campaignId
 */
export function meldeEntzug(vorher, nachher, campaignId) {
  const mitspielende = db
    .prepare(
      `SELECT u.id FROM campaign_members m JOIN users u ON u.id = m.user_id
        WHERE m.campaign_id = ? AND u.role = 'spieler'`
    )
    .all(campaignId)
    .map((r) => r.id);
  const verloren = mitspielende.filter((id) => spielerSiehtBlatt(vorher, id) && !spielerSiehtBlatt(nachher, id));
  if (verloren.length === 0) return;
  broadcast('charakter:entfernt', { id: nachher.id }, { role: 'spieler', campaignId, userIds: verloren });
}
