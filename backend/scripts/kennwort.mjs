#!/usr/bin/env node
/**
 * Ein Kennwort neu setzen – für den Fall, dass niemand mehr hineinkommt.
 *
 *   npm run kennwort -- "Name"   ein neues, ausgewürfeltes Kennwort
 *   npm run kennwort             zeigt alle Konten
 *
 * Im Almanach setzt die Spielleitung vergessene Kennwörter der Runde unter
 * Spielleitung → Runde neu. Vergisst die einzige Spielleitung ihr eigenes,
 * gibt es niemanden mehr, der das könnte – dafür ist dieses Skript da. Es
 * läuft auf dem Rechner des Almanachs, also nur für den, der ohnehin an die
 * Datenbank herankommt; einen Weg über das Netz öffnet es nicht.
 *
 * Das neue Kennwort wird ausgewürfelt und einmal angezeigt, statt es auf der
 * Befehlszeile entgegenzunehmen: Was man dort tippt, steht danach in der
 * Befehlsgeschichte der Shell, und dort sucht es niemand, der aufräumt. Man
 * meldet sich damit an und wählt im Konto-Menü gleich ein eigenes.
 *
 * Alle Anmeldungen des Kontos werden dabei beendet – wie beim Kennwortwechsel
 * in der Oberfläche. Ein Fenster, das gerade offen ist, merkt es bei seiner
 * nächsten Anfrage. Der Server darf dabei weiterlaufen.
 */
import { randomInt } from 'node:crypto';
import db, { transaktion } from '../src/db.js';
import { hashPassword } from '../src/anmeldung/kennwort.js';
import { nameKey } from '../src/anmeldung/konten.js';

const gesucht = process.argv.slice(2).join(' ').trim();

// Ohne die Zeichen, die man beim Abschreiben verwechselt (l, 1, o, 0, i).
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const gruppe = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

/** Alle Konten, Spielleitung zuerst – für die Liste, aus der man wählt. */
function auflisten() {
  const konten = db.prepare("SELECT name, role FROM users ORDER BY role = 'sl' DESC, name COLLATE NOCASE").all();
  if (konten.length === 0) {
    console.log('  (noch kein Konto in dieser Datenbank)');
    return;
  }
  for (const k of konten) console.log(`   – "${k.name}"${k.role === 'sl' ? '   (Spielleitung)' : ''}`);
}

console.log('');
if (!gesucht) {
  console.log('  So wird ein Kennwort neu gesetzt:');
  console.log('    npm run kennwort -- "Name"');
  console.log('');
  console.log('  Vorhanden sind:');
  auflisten();
  console.log('');
  process.exit(0);
}

// Gesucht wird wie bei der Anmeldung: ohne Rücksicht auf Groß- und
// Kleinschreibung und auf Leerzeichen am Rand.
const konto = db.prepare('SELECT id, name FROM users WHERE name_key = ?').get(nameKey(gesucht));
if (!konto) {
  console.log(`  Kein Konto heißt "${gesucht}". Vorhanden sind:`);
  auflisten();
  console.log('');
  process.exit(1);
}

const kennwort = `${gruppe()}-${gruppe()}-${gruppe()}`;
// Erst hashen (mit Pause), dann in einem Zug schreiben – wie in den Wegen
// des Servers (siehe routes/konten/verwaltung.js).
const hash = await hashPassword(kennwort);
const beendet = transaktion(() => {
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, konto.id);
  return db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(konto.id).changes;
});

console.log(`  Neues Kennwort für "${konto.name}":`);
console.log('');
console.log(`      ${kennwort}`);
console.log('');
console.log(`  ${beendet === 1 ? 'Eine Anmeldung wurde' : `${beendet} Anmeldungen wurden`} beendet.`);
console.log('  Damit anmelden und im Konto-Menü gleich ein eigenes wählen.');
console.log('');
