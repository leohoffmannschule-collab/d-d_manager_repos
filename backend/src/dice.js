import { randomInt } from 'node:crypto';

/**
 * Würfelt einen Ausdruck wie `2d6+3`, `1w20-1` oder `4d8`.
 *
 * Deutsche und englische Schreibweise sind gleichwertig (W wie Würfel,
 * d wie die). Gewürfelt wird mit `randomInt` aus dem Krypto-Modul – nicht
 * weil es hier auf Sicherheit ankäme, sondern weil es gleichmäßig verteilt
 * ist, anders als das gern gesehene `Math.floor(Math.random() * n)`.
 */
export function rollDice(expression, mode = 'normal') {
  const cleaned = String(expression).replace(/\s+/g, '').toLowerCase().replaceAll('w', 'd');
  if (!cleaned) throw new Error('Ungültiger Würfelausdruck.');
  if (cleaned.length > 200) throw new Error('Würfelausdruck ist zu lang.');

  const tokenRegex = /([+-]?)(\d*d\d+|\d+)/g;
  if (cleaned.replace(tokenRegex, '').length > 0) throw new Error('Ungültiger Würfelausdruck.');

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

export const rollD20 = () => randomInt(1, 21);
