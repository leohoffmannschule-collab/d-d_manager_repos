/**
 * Ganz oder gar nicht: mehrere Schreibvorgänge als ein Block.
 *
 * Wo ein Weg mehr als eine Zeile schreibt – ein Konto samt erster Kampagne,
 * eine Kampagne samt zwölf Vorlagen, eine Auszahlung an fünf Blätter –, darf
 * ein Fehler auf halber Strecke keinen halben Stand hinterlassen. Der wäre
 * schwerer zu beheben als ein klarer Fehlschlag: ein Konto ohne Kampagne,
 * Gold, das aus der Kiste verschwunden, aber nie angekommen ist.
 *
 * Warum `SAVEPOINT` und nicht `BEGIN`: Ein SAVEPOINT außerhalb einer
 * Transaktion verhält sich wie `BEGIN`, *innerhalb* einer aber wie ein
 * Zwischenstand. Damit darf ein Block einen anderen aufrufen – etwa das
 * Anlegen einer Kampagne das Säen der Vorlagen –, ohne dass SQLite mit
 * „cannot start a transaction within a transaction“ abbricht. Eine
 * Transaktions-API, die beide Treiber (node:sqlite und better-sqlite3)
 * gemeinsam hätten, gibt es nicht; SQL verstehen beide.
 *
 * **Die Arbeit muss synchron sein.** Ein `await` darin gäbe den Faden an
 * andere Anfragen ab, und deren Schreibvorgänge landeten mitten in diesem
 * Block – und würden mit ihm zurückgerollt. Deshalb wird eine zurückgegebene
 * Promise nicht hingenommen, sondern als Fehler behandelt: lieber laut beim
 * Entwickeln als still in der Datenbank.
 */
import { db } from './verbindung.js';

let tiefe = 0;

/**
 * `arbeit` ganz oder gar nicht ausführen – verschachtelbar über SAVEPOINTs.
 *
 * @template T
 * @param {() => T} arbeit  muss synchron sein (better-sqlite3 und node:sqlite sind es)
 * @returns {T} was `arbeit` zurückgibt
 * @throws was `arbeit` wirft – nach dem Zurückrollen
 */
export function transaktion(arbeit) {
  // Der Name muss nur innerhalb der Verschachtelung eindeutig sein.
  const name = `block_${tiefe}`;
  tiefe += 1;
  db.exec(`SAVEPOINT ${name}`);
  try {
    const ergebnis = arbeit();
    if (typeof ergebnis?.then === 'function') {
      throw new Error('transaktion(): Die Arbeit darf nicht asynchron sein.');
    }
    db.exec(`RELEASE ${name}`);
    return ergebnis;
  } catch (fehler) {
    // ROLLBACK TO allein hebt den Sicherungspunkt nicht auf – ohne das
    // RELEASE danach bliebe die äußere Transaktion offen hängen.
    db.exec(`ROLLBACK TO ${name}`);
    db.exec(`RELEASE ${name}`);
    throw fehler;
  } finally {
    tiefe -= 1;
  }
}
