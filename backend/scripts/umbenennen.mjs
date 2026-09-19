#!/usr/bin/env node
/**
 * Eine Kampagne umbenennen.
 *
 *   node backend/scripts/umbenennen.mjs "Alter Name" "Neuer Name"
 *   node backend/scripts/umbenennen.mjs                 (zeigt alle Namen)
 *
 * Der Almanach kann Kampagnen anlegen, wechseln und wegräumen – nur
 * umbenennen kann er sie nicht. Bis das in der Oberfläche steht, führt der
 * Weg über dieses Skript; es fasst genau ein Feld an (`campaigns.name`) und
 * sonst nichts.
 *
 * Der Name ist nirgends sonst gespeichert: Figuren, Szenen und Beute hängen
 * an der Kennung der Kampagne, nicht an ihrem Namen. Umbenennen ist deshalb
 * gefahrlos und ändert nichts weiter. Der Server darf dabei ruhig
 * weiterlaufen – im Browser genügt danach ein Neuladen der Seite.
 */
import db from '../src/db.js';

const [alt, neu] = process.argv.slice(2);

const alleKampagnen = () =>
  db.prepare('SELECT id, name, created_at, deleted_at FROM campaigns ORDER BY created_at').all();

function auflisten(ueberschrift) {
  const alle = alleKampagnen();
  console.log('');
  console.log(`  ${ueberschrift}`);
  if (alle.length === 0) {
    console.log('  (keine Kampagne in dieser Datenbank)');
    return;
  }
  for (const k of alle) {
    console.log(`   – "${k.name}"${k.deleted_at ? '   [im Papierkorb]' : ''}`);
  }
  console.log('');
}

if (!alt || !neu) {
  console.log('');
  console.log('  So wird umbenannt:');
  console.log('    node backend/scripts/umbenennen.mjs "Alter Name" "Neuer Name"');
  auflisten('Vorhanden sind:');
  process.exit(alt || neu ? 1 : 0);
}

const name = neu.trim();
if (name.length < 2 || name.length > 60) {
  console.log('');
  console.log('  Der neue Name braucht zwischen 2 und 60 Zeichen – wie in der Oberfläche auch.');
  console.log('');
  process.exit(1);
}

// Gesucht wird nach dem Namen, ersatzweise nach der Kennung: Wer sie zur
// Hand hat, soll nicht am genauen Wortlaut scheitern.
const gesucht = alt.trim();
let treffer = alleKampagnen().filter((k) => k.name === gesucht);
if (treffer.length === 0) treffer = alleKampagnen().filter((k) => k.id === gesucht);
if (treffer.length === 0) {
  treffer = alleKampagnen().filter((k) => k.name.toLowerCase() === gesucht.toLowerCase());
  if (treffer.length === 1) console.log(`\n  (Groß- und Kleinschreibung wich ab – gemeint ist wohl "${treffer[0].name}".)`);
}

if (treffer.length === 0) {
  console.log('');
  console.log(`  Keine Kampagne heißt "${gesucht}".`);
  auflisten('Vorhanden sind:');
  process.exit(1);
}
if (treffer.length > 1) {
  console.log('');
  console.log(`  ${treffer.length} Kampagnen heißen "${gesucht}" – hier hilft nur die Kennung:`);
  for (const k of treffer) console.log(`   – ${k.id}`);
  console.log('');
  process.exit(1);
}

const kampagne = treffer[0];
const gleichnamig = alleKampagnen().filter((k) => k.id !== kampagne.id && k.name === name);

db.prepare('UPDATE campaigns SET name = ? WHERE id = ?').run(name, kampagne.id);

console.log('');
console.log('  Umbenannt');
console.log(`  vorher : "${kampagne.name}"`);
console.log(`  jetzt  : "${db.prepare('SELECT name FROM campaigns WHERE id = ?').get(kampagne.id).name}"`);
console.log(`  Kennung: ${kampagne.id}`);
if (kampagne.deleted_at) console.log('  Hinweis: Diese Kampagne liegt im Papierkorb.');
if (gleichnamig.length > 0) {
  console.log(`  Hinweis: ${gleichnamig.length} weitere Kampagne trägt jetzt denselben Namen.`);
}
console.log('');
console.log('  Im Browser einmal neu laden, dann steht der neue Name überall.');
console.log('');
