/**
 * Kennwörter: hashen und prüfen.
 *
 * *Kennwörter* werden mit `scrypt` und einem zufälligen Salz gehasht und
 * nie im Klartext gespeichert. Verglichen wird mit `timingSafeEqual`, das
 * immer gleich lange braucht – ein gewöhnlicher Vergleich verriete über die
 * Antwortzeit, wie viele Zeichen schon stimmen.
 */
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

// scrypt steckt in Node selbst – kein bcrypt, das auf dem Pi kompiliert werden
// müsste. Die Parameter sind so gewählt, dass ein Anmeldeversuch auf einem
// Raspberry Pi 5 rund eine Zehntelsekunde kostet: für uns unmerklich, für
// jemanden, der Passwörter durchprobiert, teuer.
//
// Gerechnet wird *asynchron*, im Hintergrund-Faden von Node. Die
// synchrone Fassung hielte für diese Zehntelsekunde den ganzen Server an –
// jeder Live-Kanal, jeder Wurf am Tisch stünde still, solange sich jemand
// anmeldet. Und wer es darauf anlegt, könnte ihn mit Anmeldeversuchen
// lahmlegen, ohne je ein Kennwort zu treffen.
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
const scryptAsync = promisify(scrypt);

/** @returns {Promise<string>} `scrypt$N$r$p$salz$hash`, alles zum Prüfen Nötige in einer Zeile */
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, SCRYPT.keylen, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

/**
 * Stimmt das Kennwort? Die Parameter stehen im gespeicherten Hash selbst –
 * so bleiben alte Hashes prüfbar, auch wenn `SCRYPT` oben einmal steigt.
 *
 * @returns {Promise<boolean>} nie eine Ausnahme: ein kaputter Hash heißt „nein“
 */
export async function verifyPassword(password, stored) {
  try {
    const [scheme, N, r, p, salt, hash] = String(stored).split('$');
    if (scheme !== 'scrypt') return false;
    const expected = Buffer.from(hash, 'base64');
    const actual = await scryptAsync(password, Buffer.from(salt, 'base64'), expected.length, {
      N: Number(N),
      r: Number(r),
      p: Number(p),
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// Der Scheinhash für vergleichsHash() – erst beim ersten Bedarf gerechnet.
let scheinHash = null;

/**
 * Ein Hash, gegen den geprüft wird, wenn es den Namen gar nicht gibt.
 *
 * Ohne ihn verriete die Antwortzeit, welche Namen der Almanach kennt: Ein
 * unbekannter Name käme sofort zurück, ein bekannter erst nach der
 * Zehntelsekunde scrypt. So kostet beides gleich viel. Einmal gerechnet und
 * dann behalten – er muss nur *irgendein* gültiger Hash sein.
 */
export function vergleichsHash() {
  scheinHash ??= hashPassword(randomBytes(16).toString('hex'));
  return scheinHash;
}
