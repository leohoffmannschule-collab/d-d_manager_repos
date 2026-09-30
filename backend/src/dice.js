/**
 * Würfelausdrücke auswerten – `2d6+3`, `1w20-1`, `4d8`.
 *
 * Deutsche und englische Schreibweise sind gleichwertig (W wie Würfel,
 * d wie die). Gewürfelt wird mit `randomInt` aus dem Krypto-Modul – nicht
 * weil es hier auf Sicherheit ankäme, sondern weil es gleichmäßig verteilt
 * ist, anders als das gern gesehene `Math.floor(Math.random() * n)`.
 */
import { randomInt } from 'node:crypto';

// Ein Glied: `2d6`, `d20` oder eine nackte Zahl. Ein ganzer Ausdruck: Glieder,
// zwischen denen *immer* ein Plus oder Minus steht.
const GLIED = '(?:\\d*d\\d+|\\d+)';
const AUSDRUCK = new RegExp(`^[+-]?${GLIED}(?:[+-]${GLIED})*$`);

/**
 * Einen Ausdruck würfeln.
 *
 * Vorteil und Nachteil gelten für den ersten einzelnen W20 im Ausdruck
 * (`1W20+5`); ein Ausdruck ohne W20 wird davon nicht berührt.
 *
 * @param {string} expression z. B. `2W6+3`
 * @param {'normal'|'advantage'|'disadvantage'} [mode] alles andere gilt als 'normal'
 * @returns {{ total: number, details: object[] }} Summe und je Glied, was fiel
 * @throws {Error} mit einem Satz für die Runde, wenn der Ausdruck nicht taugt
 */
export function rollDice(expression, mode = 'normal') {
  const roh = String(expression);
  // Leerzeichen *zwischen* Gliedern sind erlaubt („2W6 + 3“), mitten in einer
  // Zahl nicht: Aus „1W20 5“ würde nach dem Entfernen sonst stillschweigend
  // ein zweihundertfünfseitiger Würfel.
  if (/\d\s+\d/.test(roh)) throw new Error('Ungültiger Würfelausdruck.');
  const cleaned = roh.replace(/\s+/g, '').toLowerCase().replaceAll('w', 'd');
  if (!cleaned) throw new Error('Ungültiger Würfelausdruck.');
  if (cleaned.length > 200) throw new Error('Würfelausdruck ist zu lang.');
  // Der Ausdruck muss als Ganzes passen. Dass jedes Stück für sich ein Glied
  // ist, genügt nicht – sonst ginge „d6d8“ als stillschweigende Summe durch.
  if (!AUSDRUCK.test(cleaned)) throw new Error('Ungültiger Würfelausdruck.');
  // Ein unbekannter Modus darf nicht heimlich zu Nachteil werden (unten
  // wird nur zwischen „advantage“ und allem anderen unterschieden).
  if (mode !== 'advantage' && mode !== 'disadvantage') mode = 'normal';

  const tokenRegex = /([+-]?)(\d*d\d+|\d+)/g;

  let match;
  let total = 0;
  const details = [];
  let found = false;
  let advDisApplied = false;

  while ((match = tokenRegex.exec(cleaned)) !== null) {
    found = true;
    const sign = match[1] === '-' ? -1 : 1;
    const token = match[2];

    if (!token.includes('d')) {
      const value = parseInt(token, 10);
      total += sign * value;
      details.push({ token: `${sign < 0 ? '-' : ''}${value}`, value: sign * value });
      continue;
    }

    const [countStr, sidesStr] = token.split('d');
    const count = countStr === '' ? 1 : parseInt(countStr, 10);
    const sides = parseInt(sidesStr, 10);
    if (!count || !sides || count < 1 || count > 100 || sides < 2 || sides > 1000) {
      throw new Error('Ungültiger Würfelausdruck (höchstens 100 Würfel, 2–1000 Seiten).');
    }

    // Vorteil/Nachteil gilt für den ersten W20 im Ausdruck.
    if (!advDisApplied && mode !== 'normal' && count === 1 && sides === 20) {
      const rollA = randomInt(1, 21);
      const rollB = randomInt(1, 21);
      const chosen = mode === 'advantage' ? Math.max(rollA, rollB) : Math.min(rollA, rollB);
      total += sign * chosen;
      details.push({
        token: `${sign < 0 ? '-' : ''}1W20 (${mode === 'advantage' ? 'Vorteil' : 'Nachteil'})`,
        rolls: [rollA, rollB],
        chosen,
        subtotal: sign * chosen,
      });
      advDisApplied = true;
      continue;
    }

    const rolls = Array.from({ length: count }, () => randomInt(1, sides + 1));
    const subtotal = rolls.reduce((a, b) => a + b, 0);
    total += sign * subtotal;
    details.push({ token: `${sign < 0 ? '-' : ''}${count}W${sides}`, rolls, subtotal: sign * subtotal });
  }

  if (!found) throw new Error('Ungültiger Würfelausdruck.');
  return { total, details };
}

/** Ein einzelner W20 – kryptographisch zufällig, wie jeder Wurf im Almanach. */
export const rollD20 = () => randomInt(1, 21);
