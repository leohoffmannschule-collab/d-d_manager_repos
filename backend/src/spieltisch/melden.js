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
 * `letzteFiguren` merkt sich je Kampagne und Person, welche Figuren sie zuletzt sah.
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

/**
 * Wer sieht zuletzt welche Figuren – je Kampagne und Person.
 *
 * Die Kampagne gehört mit in den Schlüssel: Dieselbe Spielleitung kann in
 * zwei Fenstern an zwei Tischen sitzen, und ein gemeinsamer Eintrag ließe
 * den einen Tisch glauben, der andere habe schon Bescheid bekommen.
 */
const letzteFiguren = new Map();
const schluessel = (campaignId, userId) => `${campaignId}:${userId}`;

function figurenKennung(sicht) {
  return (sicht?.tokens ?? []).map((t) => t.id).join('|');
}

function merke(campaignId, userId, sicht) {
  letzteFiguren.set(schluessel(campaignId, userId), figurenKennung(sicht));
}

/**
 * Jede verbundene Person mit ihrer eigenen Sicht auf den Tisch.
 *
 * Die Sicht der Spielleitung ist für alle Spielleitungen dieselbe und wird
 * deshalb nur einmal gerechnet; jede andere Person bekommt ihre eigene.
 * Wer nicht verbunden ist, bekommt nichts – er holt sich beim Verbinden
 * ohnehin den ganzen Stand.
 */
function sichtenJePerson(campaignId) {
  let slSicht;
  let slGerechnet = false;
  return presence(campaignId).map((person) => {
    if (person.role !== 'sl') return { person, sicht: szenenSicht(person, campaignId) };
    if (!slGerechnet) {
      slSicht = szenenSicht({ role: 'sl' }, campaignId);
      slGerechnet = true;
    }
    return { person, sicht: slSicht };
  });
}

/** Die ganze Szene an alle – jede Person in ihrer eigenen Fassung. */
export function sendeSzene(campaignId) {
  for (const { person, sicht } of sichtenJePerson(campaignId)) {
    broadcast('szene', sicht, { userIds: [person.id], campaignId });
    merke(campaignId, person.id, sicht);
  }
}

/**
 * Nach einem Nebelstrich wandert nur die Änderung übers Netz – aber wenn
 * dabei eine Figur auftaucht oder verschwindet, muss auch das ankommen.
 * Gesendet wird nur, wenn sich wirklich etwas geändert hat; ein Pinselstrich
 * über schon aufgedecktes Land soll nicht fünf Figurenlisten auslösen.
 */
export function sendeFigurenWennGeaendert(campaignId) {
  for (const { person, sicht } of sichtenJePerson(campaignId)) {
    const kennung = figurenKennung(sicht);
    if (letzteFiguren.get(schluessel(campaignId, person.id)) === kennung) continue;
    letzteFiguren.set(schluessel(campaignId, person.id), kennung);
    broadcast('figuren', sicht?.tokens ?? [], { userIds: [person.id], campaignId });
  }
}

/**
 * Darf diese Person die Figur bewegen? Die Runde nur die eigene – und die
 * nicht, solange ihr Blatt hinter dem Schirm liegt (siehe `fuehrtSelbst` in
 * routes/charaktere/blatt.js).
 */
export function darfBewegen(user, tokenRow) {
  if (isDm(user)) return true;
  if (tokenRow.hidden) return false;
  if (!tokenRow.character_id) return false;
  const character = db.prepare('SELECT owner_id, npc FROM characters WHERE id = ?').get(tokenRow.character_id);
  return Boolean(character) && !character.npc && character.owner_id === user.id;
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
  const { campaignId } = req;
  // Schaut die Spielleitung durch fremde Augen, gilt für sie dieselbe
  // Rechnung wie für die Runde – dann genügt die einzelne Figur nicht.
  const durchFremdeAugen = !!getState('nsc_sicht', campaignId, null);

  for (const { person, sicht } of sichtenJePerson(campaignId)) {
    merke(campaignId, person.id, sicht);
    if (person.role === 'sl' && !durchFremdeAugen) continue;
    broadcast('szene', sicht, { userIds: [person.id], campaignId });
  }

  if (!durchFremdeAugen) {
    broadcast('figur', rowToToken(row), { role: 'sl', exceptClient: originClient(req), campaignId });
  }
}

/**
 * Eine Szene auf den Tisch legen – aus der Szenenliste wie aus der
 * Kartenbibliothek. Mit `verdeckt` geht vorher der Vorhang zu: Dann baut die
 * Spielleitung dahinter auf, und die Runde merkt nichts davon.
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

