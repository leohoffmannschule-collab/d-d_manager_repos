/**
 * Die **zwei Sichten** auf den laufenden Kampf – der Kern des Ganzen.
 *
 * Die Spielleitung bekommt alle Kämpfer mit allen Werten. Die Runde bekommt
 *
 *   – verborgene Gegner gar nicht,
 *   – bei NSC und Monstern weder Trefferpunkte noch Rüstungsklasse, sondern
 *     nur einen Zustand („verwundet“, „schwer_verwundet“),
 *   – bei Helden (`pc`) die Trefferpunkte genau – die eigenen wie die der
 *     Gefährten; wie es um die Gruppe steht, weiß man am Tisch ohnehin,
 *   – Notizen der Spielleitung zu keinem Kämpfer,
 *   – den Initiativebonus der Gegner nicht (er verrät die Geschicklichkeit
 *     aus dem Statblock).
 *
 * Gefiltert wird hier, auf dem Server, nicht in der Oberfläche. Was ein
 * Spielerfenster nicht wissen soll, bekommt es nicht geschickt – sonst
 * stünde es im Netzwerkfenster des Browsers, und der Tisch rechnete aus,
 * wie viel das Ungetüm noch aushält.
 */
import { isDm } from '../auth.js';
import { broadcast } from '../events.js';
import { alleKaempfer, meta, zustand } from './umwandlung.js';

/**
 * Der Kampf so, wie dieses Konto ihn sehen darf: die Spielleitung alles, die
 * Runde ohne Verborgenes, ohne fremde Notizen und mit Monster-TP als Wort.
 */
export function encounterView(user, campaignId) {
  const kaempfer = alleKaempfer(campaignId);
  const sichtbar = isDm(user)
    ? kaempfer
    : kaempfer
        .filter((c) => !c.hidden)
        .map((c) =>
          c.type === 'pc'
            ? { ...c, notes: '' }
            : {
                ...c,
                hp: null,
                maxHp: null,
                ac: null,
                initiativeBonus: null,
                notes: '',
                status: zustand(c.hp, c.maxHp),
              }
        );
  return { ...meta(campaignId), combatants: sichtbar };
}

/** Beide Fassungen an alle offenen Fenster schicken. */
export function sendeKampf(campaignId) {
  broadcast('kampf', encounterView({ role: 'sl' }, campaignId), { role: 'sl', campaignId });
  broadcast('kampf', encounterView({ role: 'spieler' }, campaignId), { role: 'spieler', campaignId });
}

/** Verschicken und dem Fragenden zugleich seine eigene Sicht zurückgeben. */
export function antwort(req, res) {
  sendeKampf(req.campaignId);
  res.json(encounterView(req.user, req.campaignId));
}
