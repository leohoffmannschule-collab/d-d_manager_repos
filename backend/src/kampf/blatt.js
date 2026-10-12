/**
 * Kampf und Charakterblatt führen dieselben Werte – in beide Richtungen.
 *
 * Schaden und Heilung, die die Spielleitung im Kampf einträgt, stehen sofort
 * auf dem Charakterblatt, Zustände ebenso; und was jemand auf dem Blatt
 * ändert, steht sofort in der Kampfliste. Ohne das führte jede Runde zwei
 * Zahlen für dasselbe, und am Ende des Abends stimmte keine davon.
 *
 * Geteilt werden:
 *
 *   Trefferpunkte  aktuell und Maximum
 *   Zustände       die Liste aus dem Regelwerk; „Erschöpft“ in der
 *                  Kampfliste ist auf dem Blatt die Erschöpfungsstufe
 *                  (an = mindestens Stufe 1, aus = Stufe 0)
 *   temporäre TP   nur in eine Richtung: Schaden im Kampf zehrt zuerst sie
 *                  auf, wie es die Regeln wollen (siehe `schadenAufBlatt`)
 *
 * Verknüpft ist ein Kämpfer mit einem Blatt über `combatants.character_id`.
 * Das setzt „Runde holen“, und das setzt auch, wer eine Figur, die an einem
 * Kämpfer hängt, im Figurenfeld an ein Blatt bindet
 * (`kaempferVerknuepfen`). Ein Monster ohne Blatt bleibt unberührt.
 */
import { db } from '../db.js';
import { meldeBlatt } from '../blattmeldung.js';

/** Der Zustand der Kampfliste, der auf dem Blatt als Stufe geführt wird. */
const ERSCHOEPFT = 'Erschöpft';

/** Die Zustände eines Blattes so, wie die Kampfliste sie führt. */
export function zustaendeFuerKampf(data) {
  const liste = Array.isArray(data?.combat?.conditions) ? data.combat.conditions.filter((z) => z !== ERSCHOEPFT) : [];
  return (Number(data?.combat?.exhaustion) || 0) > 0 ? [...liste, ERSCHOEPFT] : liste;
}

/** Gleich, ohne auf die Reihenfolge zu achten. */
const gleicheMenge = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

/**
 * Trefferpunkte und Zustände eines Kämpfers aufs verknüpfte Blatt
 * schreiben und den Fenstern melden, die das Blatt sehen dürfen.
 *
 * @param {object} combatant  die Zeile aus `combatants`
 * @param {string} campaignId
 * @param {{ temp?: number }} [extra]  neue temporäre TP, wenn Schaden sie aufgezehrt hat
 */
export function syncCharakter(combatant, campaignId, extra = {}) {
  if (!combatant?.character_id) return;
  const row = db.prepare('SELECT * FROM characters WHERE id = ? AND campaign_id = ?').get(combatant.character_id, campaignId);
  if (!row) return;
  const data = JSON.parse(row.data);
  data.combat = data.combat ?? {};
  data.combat.hp = { ...data.combat.hp, current: combatant.hp, max: combatant.max_hp };
  if (extra.temp !== undefined) data.combat.hp.temp = extra.temp;

  const zustaende = JSON.parse(combatant.conditions || '[]');
  data.combat.conditions = zustaende.filter((z) => z !== ERSCHOEPFT);
  const stufe = Number(data.combat.exhaustion) || 0;
  // Eine schon höhere Stufe bleibt stehen; die Kampfliste kennt nur an und aus.
  data.combat.exhaustion = zustaende.includes(ERSCHOEPFT) ? Math.max(1, stufe) : 0;

  db.prepare('UPDATE characters SET data = ?, updated_at = ? WHERE id = ?').run(
    JSON.stringify(data),
    new Date().toISOString(),
    row.id
  );
  meldeBlatt(
    row,
    {
      id: row.id,
      name: row.name,
      hp: data.combat.hp,
      conditions: data.combat.conditions,
      exhaustion: data.combat.exhaustion,
      ownerId: row.owner_id,
      shared: !!row.shared,
    },
    { campaignId }
  );
}

/**
 * Schaden, der zuerst die temporären Trefferpunkte des verknüpften Blattes
 * aufzehrt. Gibt zurück, was davon an den echten Trefferpunkten ankommt,
 * und die neuen temporären TP (oder `undefined`, wenn keine berührt wurden).
 *
 * @param {object} combatant  die Zeile aus `combatants`
 * @param {number} amount     Schaden (positiv) oder Heilung (negativ)
 * @param {string} campaignId
 * @returns {{ rest: number, temp?: number }}
 */
export function schadenAufBlatt(combatant, amount, campaignId) {
  if (amount <= 0 || !combatant.character_id) return { rest: amount };
  const row = db.prepare('SELECT data FROM characters WHERE id = ? AND campaign_id = ?').get(combatant.character_id, campaignId);
  const temp = Number(row ? JSON.parse(row.data)?.combat?.hp?.temp : 0) || 0;
  if (temp <= 0) return { rest: amount };
  const aufgezehrt = Math.min(temp, amount);
  return { rest: amount - aufgezehrt, temp: temp - aufgezehrt };
}

/**
 * Den Stand eines Blattes in alle Kämpfer übernehmen, die daran hängen.
 * Geschrieben wird nur, was sich wirklich unterscheidet – das Blatt
 * speichert bei jedem Tastendruck.
 *
 * @param {object} row  die Zeile aus `characters`
 * @param {string} campaignId
 * @returns {number} wie viele Kämpfer sich geändert haben
 */
export function blattInKampf(row, campaignId) {
  const data = JSON.parse(row.data);
  const hp = data?.combat?.hp;
  const zustaende = zustaendeFuerKampf(data);
  const setzen = db.prepare('UPDATE combatants SET hp = ?, max_hp = ?, conditions = ? WHERE id = ?');
  let geaendert = 0;
  for (const k of db.prepare('SELECT * FROM combatants WHERE character_id = ? AND campaign_id = ?').all(row.id, campaignId)) {
    const aktuell = hp && Number.isFinite(Number(hp.current)) ? Number(hp.current) || 0 : k.hp;
    const hoechst = hp && Number.isFinite(Number(hp.current)) ? Number(hp.max) || 0 : k.max_hp;
    const bisher = JSON.parse(k.conditions || '[]');
    if (aktuell === k.hp && hoechst === k.max_hp && gleicheMenge(bisher, zustaende)) continue;
    setzen.run(aktuell, hoechst, JSON.stringify(zustaende), k.id);
    geaendert += 1;
  }
  return geaendert;
}

/**
 * Eine Figur, die an einem Kämpfer hängt, wurde an ein Blatt gebunden (oder
 * davon gelöst): Der Kämpfer folgt. Beim Binden gilt danach der Stand des
 * Blattes – es ist das Dauerhafte, die Kampfzeile nur für diesen Kampf.
 *
 * @param {string|null} combatantId  der Kämpfer hinter der Figur
 * @param {string|null} vorher       das Blatt, an dem die Figur bisher hing
 * @param {string|null} nachher      das Blatt, an dem sie jetzt hängt
 * @param {string} campaignId
 * @returns {boolean} ob sich am Kampf etwas geändert hat
 */
export function kaempferVerknuepfen(combatantId, vorher, nachher, campaignId) {
  if (!combatantId || vorher === nachher) return false;
  const k = db.prepare('SELECT * FROM combatants WHERE id = ? AND campaign_id = ?').get(combatantId, campaignId);
  if (!k) return false;
  if (nachher) {
    db.prepare('UPDATE combatants SET character_id = ? WHERE id = ?').run(nachher, k.id);
    const blatt = db.prepare('SELECT * FROM characters WHERE id = ? AND campaign_id = ?').get(nachher, campaignId);
    if (blatt) blattInKampf(blatt, campaignId);
    return true;
  }
  // Gelöst: Nur eine Verknüpfung, die von dieser Figur kam, fällt mit weg.
  if (k.character_id === vorher) {
    db.prepare('UPDATE combatants SET character_id = NULL WHERE id = ?').run(k.id);
    return true;
  }
  return false;
}
