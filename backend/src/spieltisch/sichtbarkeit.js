/**
 * Wer sieht was? – die Kernfrage des Spieltisches.
 *
 * Hier entsteht die Antwort *einmal*, und alle Wege des Servers bedienen
 * sich daraus. Das ist wichtiger, als es klingt: Gäbe es zwei Stellen, an
 * denen Sicht gerechnet wird, wäre irgendwann eine davon falsch – und in
 * diesem Fall hieße „falsch“, dass die Runde den Hinterhalt sieht.
 *
 * Die Regel dahinter: **Was die Runde nicht sehen darf, wird nicht
 * geschickt.** Nicht ausgeblendet, nicht durchsichtig gemacht – es steht
 * nicht in der Antwort. Wer im Browser ins Netzwerkfenster schaut, findet
 * es dort also auch nicht.
 *
 * Drei Begriffe, die leicht durcheinandergehen:
 *
 *   *Nebel* – welche Felder je aufgedeckt wurden. Gehört zur Szene und
 *   bleibt, bis jemand ihn ändert.
 *
 *   *Sicht* – was gerade wirklich zu sehen ist, gerechnet aus Lichtquellen
 *   und den Sinnen der eigenen Figuren. Je Person verschieden, entsteht
 *   neu bei jeder Anfrage, wird nirgends gespeichert (siehe ../sicht.js
 *   für die Geometrie dahinter).
 *
 *   *Vorhang* – ist er zu, bekommt die Runde gar nichts.
 *
 * Nebel und Sicht wandern als **Bitkarte** zum Browser – ein Bit je Feld,
 * base64 verpackt. Als Liste von `"x,y"` wären es bei einer großen Karte
 * 348 KB je Zug und Person, als Bitkarte 6,5 KB.
 */
import { db, getState } from '../db.js';
import { isDm } from '../auth.js';
import { alsBitkarte, figurenFeld, rasterBereich, sichtFelder } from '../sicht.js';
import { aktiveSzeneId, figuren, holeSzene, offeneFelder, rowToScene, vorhangZu } from './umwandlung.js';

/**
 * Die Sinne hinter den Figuren. Eine Figur sieht, was ihr Charakterblatt
 * hergibt – Dunkelsicht, Blindsicht und was sonst noch eingetragen ist.
 */
export function sinneJeFigur(tokens, campaignId) {
  const kennungen = [...new Set(tokens.map((t) => t.characterId).filter(Boolean))];
  const sinne = new Map();
  if (kennungen.length === 0) return sinne;

  const platzhalter = kennungen.map(() => '?').join(',');
  const blaetter = db
    .prepare(`SELECT id, data FROM characters WHERE campaign_id = ? AND id IN (${platzhalter})`)
    .all(campaignId, ...kennungen);
  const jeCharakter = new Map();
  for (const blatt of blaetter) {
    try {
      jeCharakter.set(blatt.id, JSON.parse(blatt.data)?.combat?.senses ?? null);
    } catch {
      jeCharakter.set(blatt.id, null);
    }
  }
  for (const token of tokens) {
    if (token.characterId) sinne.set(token.id, jeCharakter.get(token.characterId) ?? null);
  }
  return sinne;
}

/** Steht diese Figur auf einem Feld, das der Betrachter sehen kann? */
export function figurSichtbar(token, szene, offen, sicht) {
  const { fx, fy } = figurenFeld(token, szene);
  const feld = `${fx},${fy}`;
  // Was die Spielleitung nie aufgedeckt hat, steht auch nicht im Datenstrom.
  // Bisher lag der Nebel nur *über* der Figur – das war Kulisse, keine Deckung.
  if (szene.fogEnabled && !offen.has(feld)) return false;
  if (sicht && !sicht.has(feld)) return false;
  return true;
}

/**
 * Was von dieser Szene geht an diese Person?
 *
 * Die Spielleitung sieht alles – es sei denn, sie schaut gerade durch die
 * Augen einer ihrer Figuren (NSC-Steuerung). Dann gilt für sie dieselbe
 * Rechnung wie für die Runde, und zwar buchstäblich dieselbe: Es gibt nur
 * diese eine Stelle, an der Sicht entsteht.
 */
export function szenenSicht(user, campaignId) {
  // Für die Runde endet es hier, wenn der Vorhang zu ist. Nicht gefiltert,
  // nicht ausgeblendet – es wird schlicht nichts geschickt.
  if (!isDm(user) && vorhangZu(campaignId)) return { vorhang: true };

  // Auch ohne aufgelegte Szene muss die Spielleitung sehen, dass der Vorhang
  // zu ist – sonst zöge sie ihn zu und hätte kein Zeichen mehr davon.
  const id = aktiveSzeneId(campaignId);
  const row = id ? holeSzene(id, campaignId) : null;
  if (!row) return vorhangZu(campaignId) ? { vorhang: true } : null;

  const szene = rowToScene(row);
  const alle = figuren(szene.id);
  const offen = offeneFelder(row);
  const bereich = rasterBereich(szene);
  const durchAugen = durchAugenVon(user, alle, campaignId);

  // Nebel und Sicht wandern als Bitkarte, ein Bit je Feld. Bei einer Karte
  // über zweihundert Meter wären es als Liste von "x,y" 348 KB je Person
  // und Zug – siehe sicht.js.
  const grundlage = { ...szene, fogBits: alsBitkarte(offen, bereich), vorhang: vorhangZu(campaignId), aktiv: true };

  if (isDm(user) && !durchAugen) {
    return { ...grundlage, tokens: alle, sichtBits: null, nscSicht: null };
  }

  const eigene = durchAugen ? [durchAugen] : meineFiguren(user, alle, campaignId);
  const sicht = sichtFelder(szene, alle, eigene, sinneJeFigur(alle, campaignId));
  const eigeneKennungen = new Set(eigene.map((t) => t.id));

  const sichtbar = alle.filter((token) => {
    if (eigeneKennungen.has(token.id)) return true;
    if (!durchAugen && token.hidden) return false;
    return figurSichtbar(token, szene, offen, sicht);
  });

  return {
    ...grundlage,
    tokens: sichtbar,
    sichtBits: sicht ? alsBitkarte(sicht, bereich) : null,
    nscSicht: durchAugen?.id ?? null,
  };
}

/** Die Figuren, die dieser Person gehören. */
export function meineFiguren(user, alle, campaignId) {
  const meine = db
    .prepare('SELECT id FROM characters WHERE owner_id = ? AND campaign_id = ?')
    .all(user.id, campaignId)
    .map((c) => c.id);
  if (meine.length === 0) return [];
  const gehoert = new Set(meine);
  return alle.filter((t) => t.characterId && gehoert.has(t.characterId));
}

/** Schaut die Spielleitung gerade durch die Augen einer Figur? */
export function durchAugenVon(user, alle, campaignId) {
  if (!isDm(user)) return null;
  const kennung = getState('nsc_sicht', campaignId, null);
  return kennung ? (alle.find((t) => t.id === kennung) ?? null) : null;
}
