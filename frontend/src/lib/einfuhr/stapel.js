/**
 * Mehrere Blattdateien auf einmal einlesen – etwa die ganze Runde nach einem
 * Abend, an dem eine KI allen eine Stufe gegeben hat, oder ein Stapel NSC,
 * den die Spielleitung vorbereitet hat.
 *
 * Jede Datei wird für sich gelesen, genau wie eine einzelne
 * (lib/blattEinfuhr.js). Eine Datei, die sich nicht lesen lässt, hält die
 * anderen nicht auf: Sie steht mit ihrem Grund in der Liste und wird
 * ausgelassen. Für jede lesbare schlägt `stapelLesen` vor, was mit ihr
 * geschehen soll – die Sammelvorschau (components/einlesen/Sammelvorschau.jsx)
 * lässt das ändern, bevor etwas gespeichert wird:
 *
 *   aktualisieren  die Datei trägt die Kennung eines Blattes, das man ändern darf
 *   neu            sonst – ein neues Blatt
 *   auslassen      unlesbar, oder derselbe Stand wie das Blatt im Almanach
 *
 * Tragen zwei Dateien dieselbe Kennung, darf nur die erste, die etwas
 * ändert, das Blatt aktualisieren; die anderen werden ausgelassen (als neues
 * Blatt lassen sie sich trotzdem wählen). Sonst überschriebe die zweite
 * still, was die erste gerade geschrieben hat.
 *
 * Gespeichert wird über Rückrufe (`anlegen`, `aktualisieren`), nicht über
 * die API selbst – so läuft dieselbe Datei auch in der Blattprobe (Node).
 */
import { leseBlattdatei } from '../blattEinfuhr.js';
import { withDefaults } from '../dnd5e.js';
import { unterschiede } from './unterschiede.js';

/** Ein Blatt so, wie es zum Vergleichen gebraucht wird – ältere 5e-Blätter aufgefüllt. */
export const zumVergleich = (blatt) => ({
  name: blatt.name,
  data: blatt.system === 'dnd5e' ? withDefaults(blatt.data) : blatt.data,
});

/**
 * Eine Datei lesen und dem Blatt gegenüberstellen, das sie aktualisieren
 * könnte.
 *
 * Gelesen wird zweimal, wenn es ein solches Blatt gibt: Beim zweiten Mal
 * liegt es daneben, und neue Einträge, die es dort schon gibt, behalten ihre
 * Kennung (lib/einfuhr/angleichen.js).
 *
 * @param {string} text  der Inhalt der Datei
 * @param {object} wie
 * @param {(gelesen: object) => Promise<object|null>} wie.passendesBlatt
 *   das vorhandene Blatt (vollständig geladen), das die Datei aktualisieren darf – oder null
 * @param {string} [wie.ersatzName]  der Name, falls die Datei keinen nennt
 * @returns {Promise<{ gelesen: object, passend: object|null, aenderungen: string[]|null }>}
 * @throws {Error} wenn sich die Datei nicht lesen lässt
 */
export async function dateiLesen(text, { passendesBlatt, ersatzName }) {
  const ersterBlick = leseBlattdatei(text, { ersatzName });
  const passend = await passendesBlatt(ersterBlick);
  const gelesen = passend ? leseBlattdatei(text, { ersatzName, bekannt: passend.data }) : ersterBlick;
  return {
    gelesen,
    passend,
    aenderungen: passend ? unterschiede(gelesen.system, zumVergleich(passend), gelesen) : null,
  };
}

/**
 * @typedef {object} Posten  eine Datei im Stapel
 * @property {string} datei        der Dateiname
 * @property {object} [gelesen]    was leseBlattdatei geliefert hat
 * @property {object|null} [passend]  das Blatt, das sie aktualisieren darf
 * @property {string[]|null} [aenderungen]  was sich daran ändern würde
 * @property {string} [fehler]     warum sie sich nicht lesen ließ
 * @property {string} [hinweis]    warum der Vorschlag ist, wie er ist
 * @property {'aktualisieren'|'neu'|'auslassen'} wahl
 * @property {boolean} npc         als NSC-Blatt anlegen (nur die Spielleitung)
 */

/**
 * Alle Dateien lesen, der Reihe nach, und für jede einen Vorschlag machen.
 *
 * @param {Array<{ name: string, text: string }>} dateien
 * @param {object} wie
 * @param {(gelesen: object) => Promise<object|null>} wie.passendesBlatt  wie bei `dateiLesen`
 * @returns {Promise<Posten[]>} in der Reihenfolge der Dateien
 */
export async function stapelLesen(dateien, { passendesBlatt }) {
  const posten = [];
  // Welches Blatt schon eine Datei aktualisiert: Kennung → Dateiname.
  const vergeben = new Map();
  for (const { name, text } of dateien) {
    try {
      const { gelesen, passend, aenderungen } = await dateiLesen(text, { passendesBlatt });
      const gleich = Boolean(passend) && aenderungen.length === 0;
      if (passend && vergeben.has(passend.id)) {
        // Zwei Fassungen desselben Blattes: Welche gilt, weiß nur, wer sie
        // geschrieben hat. Also nichts verdoppeln – auslassen, und sagen,
        // dass „als neues Blatt“ geht.
        posten.push({
          datei: name,
          gelesen,
          passend: null,
          aenderungen: null,
          hinweis:
            `Trägt dieselbe Kennung wie „${vergeben.get(passend.id)}“ – nur eine Datei darf „${passend.name}“ ` +
            'aktualisieren. Als neues Blatt anlegen geht.',
          wahl: 'auslassen',
          npc: false,
        });
        continue;
      }
      // Nur eine Datei, die wirklich etwas ändert, hält das Blatt für sich
      // fest – eine unveränderte Kopie davor soll die bearbeitete nicht aussperren.
      if (passend && !gleich) vergeben.set(passend.id, name);
      posten.push({
        datei: name,
        gelesen,
        passend,
        aenderungen,
        hinweis: gleich ? `Derselbe Stand wie „${passend.name}“ im Almanach.` : '',
        wahl: gleich ? 'auslassen' : passend ? 'aktualisieren' : 'neu',
        npc: false,
      });
    } catch (err) {
      posten.push({ datei: name, fehler: err.message, wahl: 'auslassen', npc: false });
    }
  }
  return posten;
}

/**
 * Den Stapel speichern, eine Datei nach der anderen. Ein Fehler bei einer
 * hält die übrigen nicht auf; er steht im Ergebnis dieser Datei.
 *
 * @param {Posten[]} posten
 * @param {object} wie
 * @param {(blatt: { name: string, system: string, data: object, npc: boolean }) => Promise<object>} wie.anlegen
 * @param {(id: string, blatt: { name: string, data: object }) => Promise<object>} wie.aktualisieren
 * @param {(index: number, ergebnis: object) => void} [wie.fortschritt]  nach jeder Datei
 * @returns {Promise<Array<{ status: 'angelegt'|'aktualisiert'|'ausgelassen'|'fehler', meldung?: string, id?: string }>>}
 */
export async function stapelUebernehmen(posten, { anlegen, aktualisieren, fortschritt }) {
  const ergebnisse = [];
  for (const [index, p] of posten.entries()) {
    let ergebnis;
    try {
      if (p.wahl === 'aktualisieren' && p.passend) {
        await aktualisieren(p.passend.id, { name: p.gelesen.name, data: p.gelesen.data });
        ergebnis = { status: 'aktualisiert', id: p.passend.id };
      } else if (p.wahl === 'neu' && p.gelesen) {
        const { name, system, data } = p.gelesen;
        const blatt = await anlegen({ name, system, data, npc: Boolean(p.npc) });
        ergebnis = { status: 'angelegt', id: blatt?.id };
      } else ergebnis = { status: 'ausgelassen' };
    } catch (err) {
      ergebnis = { status: 'fehler', meldung: err.message };
    }
    ergebnisse.push(ergebnis);
    fortschritt?.(index, ergebnis);
  }
  return ergebnisse;
}
