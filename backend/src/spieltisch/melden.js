/**
 * Den Tisch verkünden: wer erfährt wann, dass sich etwas geändert hat.
 *
 * Der Unterschied zu allem anderen im Almanach: Hier bekommt **jede Person
 * eine eigene Fassung**. Eine gezogene Figur kann für die eine sichtbar
 * werden und für die andere nicht, je nachdem, wo ihre eigenen Figuren
 * stehen und wie weit sie sehen. Also wird die Sicht je Person gerechnet
 * und je Person verschickt.
 *
 * Drei Wege hinaus, vom groben zum feinen:
 *
 *   sendeSzene              die ganze Szene an alle – beim Auflegen, beim
 *                           Vorhang, nach dem Ziehen einer Figur
 *   sendeFigurenWennGeaendert  nur die Figurenliste, und nur wenn sich
 *                           wirklich etwas geändert hat – nach einem
 *                           Nebelstrich
 *   meldeFigur              die eine Figur an die Spielleitung, die ganze
 *                           Szene an die Runde
 *
 * `letzteFiguren` merkt sich je Person, welche Figuren sie zuletzt sah.
 * Ohne dieses Gedächtnis löste jeder Pinselstrich über schon aufgedecktes
 * Land eine Runde Figurenlisten aus – bei einem gezogenen Strich hundert
 * Mal in der Sekunde.
 */
import { db, getState, setState } from '../db.js';
import { isDm } from '../auth.js';
import { broadcast, originClient, presence } from '../events.js';
import * as chronik from '../chronicle.js';
import { rowToToken, vorhangZu } from './umwandlung.js';
import { szenenSicht } from './sichtbarkeit.js';

export function sendeSzene(campaignId) {
  broadcast('szene', szenenSicht({ role: 'sl' }, campaignId), { role: 'sl', campaignId });
  // Jede Person am Tisch sieht etwas anderes – also bekommt auch jede ihre
  // eigene Fassung. Nur wer verbunden ist, bekommt überhaupt eine.
  for (const person of presence(campaignId)) {
    if (person.role === 'sl') continue;
    broadcast('szene', szenenSicht(person, campaignId), { userIds: [person.id], campaignId });
  }
  merkeFiguren(campaignId);
}

/**
 * Nach einem Nebelstrich wandert nur die Änderung übers Netz – aber wenn
 * dabei eine Figur auftaucht oder verschwindet, muss auch das ankommen.
 * Gesendet wird nur, wenn sich wirklich etwas geändert hat; ein Pinselstrich
 * über schon aufgedecktes Land soll nicht fünf Figurenlisten auslösen.
 */
const letzteFiguren = new Map();

function figurenKennung(sicht) {
  return (sicht?.tokens ?? []).map((t) => t.id).join('|');
}

function merkeFiguren(campaignId) {
  for (const person of presence(campaignId)) {
    letzteFiguren.set(person.id, figurenKennung(szenenSicht(person, campaignId)));
  }
}

export function sendeFigurenWennGeaendert(campaignId) {
  for (const person of presence(campaignId)) {
    const sicht = szenenSicht(person, campaignId);
    const kennung = figurenKennung(sicht);
    if (letzteFiguren.get(person.id) === kennung) continue;
    letzteFiguren.set(person.id, kennung);
    broadcast('figuren', sicht?.tokens ?? [], { userIds: [person.id], campaignId });
  }
}

/** Darf diese Person die Figur bewegen? */
export function darfBewegen(user, tokenRow) {
  if (isDm(user)) return true;
  if (tokenRow.hidden) return false;
  if (!tokenRow.character_id) return false;
  const character = db.prepare('SELECT owner_id FROM characters WHERE id = ?').get(tokenRow.character_id);
  return character?.owner_id === user.id;
}

/**
 * Eine Figur hat sich geändert.
 *
 * Früher genügte es, die eine Figur zu schicken. Seit die Sicht an Positionen
 * und Lichtquellen hängt, ändert ein Schritt zur Seite womöglich, was die
 * halbe Runde sieht – also geht die ganze Szene neu hinaus. Das passiert beim
 * Loslassen, nicht während des Ziehens, und kostet deshalb nichts.
 *
 * Nur das auslösende Fenster bekommt seine eigene Figur zurückgemeldet,
 * damit die gezogene Figur nicht kurz zurückspringt.
 */
export function meldeFigur(row, req) {
  // Schaut die Spielleitung durch fremde Augen, gilt für sie dieselbe
  // Rechnung wie für die Runde – dann genügt die einzelne Figur nicht.
  if (getState('nsc_sicht', req.campaignId, null)) {
    broadcast('szene', szenenSicht({ role: 'sl' }, req.campaignId), { role: 'sl', campaignId: req.campaignId });
  } else {
    broadcast('figur', rowToToken(row), { role: 'sl', exceptClient: originClient(req), campaignId: req.campaignId });
  }

  for (const person of presence(req.campaignId)) {
    if (person.role === 'sl') continue;
    broadcast('szene', szenenSicht(person, req.campaignId), { userIds: [person.id], campaignId: req.campaignId });
  }
  merkeFiguren(req.campaignId);
}

/** Eine Szene auf den Tisch legen – auch aus der Kartenbibliothek heraus. */
/**
 * Eine Szene auf den Tisch legen. Mit `verdeckt` geht vorher der Vorhang zu –
 * dann baut die Spielleitung dahinter auf, und die Runde merkt nichts davon.
 */
export function aktiviereSzene(row, campaignId, optionen = {}) {
  if (optionen.verdeckt) setState('vorhang', campaignId, true);
  setState('szene', campaignId, row.id);
  // Hinter dem Vorhang ist die Runde noch nirgends angekommen. Der Eintrag in
  // der Chronik wartet, bis er aufgeht – sonst stünde im Protokoll ein Ort,
  // den am Tisch niemand gesehen hat.
  if (!vorhangZu(campaignId)) {
    chronik.log(
      { kind: 'szene', text: `Die Runde erreicht: ${row.name}.`, meta: { sceneId: row.id, name: row.name } },
      campaignId
    );
  }
  sendeSzene(campaignId);
}

