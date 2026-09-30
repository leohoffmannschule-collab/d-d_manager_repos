/**
 * Was mehrere Kampagnen-Wege gemeinsam fragen: Taugt der Name? Wer darf
 * über diese Kampagne bestimmen? Stimmt die abgetippte Bestätigung?
 */
import { db } from '../../db.js';

/** @returns {string|null} ein Satz, was am Namen nicht stimmt – oder null */
export function pruefeName(name) {
  if (typeof name !== 'string' || name.trim().length < 2) return 'Der Name braucht mindestens zwei Zeichen.';
  if (name.trim().length > 60) return 'Der Name ist zu lang.';
  return null;
}

/**
 * Wer über diese Kampagne bestimmt: umbenennen, wegräumen, endgültig
 * entfernen.
 *
 * Das darf nur, wer sie angelegt hat – und niemand sonst, auch keine andere
 * Spielleitung. Bei alten Kampagnen ohne vermerkten Urheber (aus der Zeit
 * vor den Kampagnen) tritt die Spielleitung an diese Stelle, sonst ließen
 * sie sich nie wieder loswerden.
 */
export function darfVerwalten(kampagne, user) {
  if (kampagne.created_by) return kampagne.created_by === user.id;
  return user.role === 'sl';
}

/** Der abgetippte Name muss stimmen – Wort für Wort. */
export function nameBestaetigt(kampagne, eingabe) {
  return typeof eingabe === 'string' && eingabe.trim() === kampagne.name;
}

/** Eine Kampagne nach Kennung – auch eine im Papierkorb. */
export const holen = (id) => db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
