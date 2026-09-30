/**
 * Was mehrere Konto-Wege gemeinsam brauchen: Mindestlänge, Namensregel,
 * Farben neuer Konten, Einladungscodes, die erste Kampagne.
 */
import { randomInt, randomUUID } from 'node:crypto';
import { db } from '../../db.js';
import { saeVorlagen } from '../../vorlagen/index.js';
import { jetzt } from '../../werte.js';

/** So kurz darf ein Kennwort höchstens sein. */
export const MIN_PASSWORT = 8;

// Die Farben, die neue Konten der Reihe nach bekommen – dieselbe Palette,
// aus der auch Figuren gewählt werden. Sind alle vergeben, wird gewürfelt.
const FARBEN = ['#9a2b22', '#2f6b4f', '#2d4f7c', '#6b3f8c', '#a86a1f', '#1f6f74', '#8c3f5f', '#4a5d23'];

/** Ein Einladungscode wie `K7PM-3QXA-9FTE`. */
export function neuerEinladungscode() {
  // Ohne I, O, 0 und 1 – die verliest man beim Vorlesen am Spieltisch.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const gruppe = () => Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join('');
  return `${gruppe()}-${gruppe()}-${gruppe()}`;
}

/** Die erste Farbe, die noch kein Konto trägt. */
export function naechsteFarbe() {
  const benutzt = new Set(db.prepare('SELECT color FROM users').all().map((r) => r.color));
  return FARBEN.find((f) => !benutzt.has(f)) ?? FARBEN[randomInt(FARBEN.length)];
}

/** @returns {string|null} ein Satz, was am Namen nicht stimmt – oder null */
export function pruefeName(name) {
  if (typeof name !== 'string' || name.trim().length < 2) return 'Der Name braucht mindestens zwei Zeichen.';
  if (name.trim().length > 40) return 'Der Name ist zu lang.';
  return null;
}

/** Die Absage für ein zu kurzes Kennwort – an drei Stellen gleich. */
export const passwortZuKurz = (res) =>
  res.status(400).json({ code: 'passwort_zu_kurz', error: `Das Passwort braucht mindestens ${MIN_PASSWORT} Zeichen.` });

/** Ist das hier die einzige Spielleitung? Dann darf sie weder gehen noch absteigen. */
export const letzteSpielleitung = () => db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'sl'").get().n <= 1;

/** Die Kampagne, die das allererste Konto vorfindet – samt zwölf Vorlagen. */
export function ersteKampagne(userId) {
  const id = randomUUID();
  const stand = jetzt();
  db.prepare('INSERT INTO campaigns (id, name, created_by, created_at) VALUES (?, ?, ?, ?)').run(
    id,
    'Erste Kampagne',
    userId,
    stand
  );
  db.prepare('INSERT INTO campaign_members (campaign_id, user_id, joined_at) VALUES (?, ?, ?)').run(id, userId, stand);
  saeVorlagen(id);
  return id;
}
