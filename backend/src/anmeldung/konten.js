/**
 * Konten anlegen und zählen.
 *
 * Konten gehören der ganzen Runde, nicht einer Kampagne. Was man mit ihnen
 * tun darf – einladen, Rollen vergeben, löschen –, steht in
 * routes/auth.js; hier liegt nur, was mehr als ein Weg braucht.
 */
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';

/**
 * Der Vergleichsschlüssel eines Namens: „Leo“, „leo“ und „ Leo “ sind
 * derselbe. Gespeichert in `users.name_key`, dort eindeutig.
 */
export const nameKey = (name) => name.trim().toLowerCase();

/** Wie viele Konten es gibt – null heißt: Der Almanach ist frisch eingerichtet. */
export function countUsers() {
  return db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
}

/**
 * Ein Konto anlegen. Erwartet den schon gerechneten Hash, nicht das
 * Kennwort: Das Rechnen ist asynchron, das Anlegen soll es nicht sein –
 * sonst könnte zwischen „Name frei?“ und „Name belegt“ eine zweite Anfrage
 * denselben Namen einschieben (siehe routes/auth.js, /register).
 */
export function createUser({ name, passwordHash, role, color }) {
  const id = randomUUID();
  db.prepare(
    'INSERT INTO users (id, name, name_key, password_hash, role, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name.trim(), nameKey(name), passwordHash, role, color, new Date().toISOString());
  return db.prepare('SELECT id, name, role, color, created_at FROM users WHERE id = ?').get(id);
}
