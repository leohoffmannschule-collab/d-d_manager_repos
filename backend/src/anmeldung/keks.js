/**
 * Das Anmelde-Cookie: lesen, setzen, löschen.
 *
 * Bewusst ohne `cookie-parser`: Der Almanach braucht genau ein Cookie, und
 * dafür lohnt kein zusätzliches Paket, das auf dem Pi mit installiert und
 * aktuell gehalten werden müsste.
 */
import { SESSION_DAYS } from './sitzung.js';

/** Der Name des einen Cookies, das der Almanach setzt. */
export const COOKIE_NAME = 'almanach_sitzung';

/**
 * Ein Cookie aus der Anfrage lesen, ohne ein Paket dafür.
 *
 * @returns {string|null} der entschlüsselte Wert, oder null, wenn es fehlt
 *   oder kaputt kodiert ist
 */
export function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() !== name) continue;
    // attachUser läuft vor *jeder* Anfrage. Ein kaputt kodiertes Cookie
    // („%E0“) darf deshalb nicht werfen – sonst bekäme dieser Browser auf
    // jeden Weg ein 500 statt schlicht „nicht angemeldet“.
    try {
      return decodeURIComponent(part.slice(index + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Das Anmelde-Cookie setzen: nur für den Server lesbar (`HttpOnly`), nur
 * aus der eigenen Seite mitgeschickt (`SameSite=Lax`), so lange gültig wie
 * die Sitzung selbst.
 */
export function setSessionCookie(req, res, token) {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_DAYS * 24 * 60 * 60}`,
  ];
  // Über den Cloudflare-Tunnel kommt alles als HTTPS an; im Heimnetz per
  // http:// darf das Merkmal nicht gesetzt werden, sonst kommt das Cookie
  // gar nicht erst an.
  //
  // `req.secure` und nichts sonst: Express wertet `X-Forwarded-Proto` nur
  // aus, wenn der Absender ein vertrauenswürdiger Zwischenschritt ist
  // (`trust proxy` in server.js). Den Kopf hier selbst zu lesen, hieße
  // jedem zu glauben, der ihn mitschickt.
  if (req.secure) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}

/** Das Cookie beim Abmelden löschen – ein leerer Wert mit Ablauf sofort. */
export function clearSessionCookie(res) {
  res.append('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}
