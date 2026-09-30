#!/usr/bin/env node
/**
 * Die Vorlagen-Charaktere nachlegen.
 *
 * Jede Kampagne bekommt beim Anlegen ihre zwölf Vorlagen von selbst. Wer sie
 * danach gelöscht hat und zurückhaben will, ruft dieses Skript auf:
 *
 *   npm run vorlagen                          in allen Kampagnen
 *   npm run vorlagen -- "Name der Kampagne"   nur in dieser einen
 *
 * Es fügt nur hinzu, was fehlt. Eine Vorlage, die noch liegt – und sei sie
 * längst umgeschrieben –, bleibt unangetastet. Kampagnen im Papierkorb
 * werden übergangen; wer dort etwas nachlegen will, stellt sie erst wieder
 * her.
 *
 * Der Server darf dabei weiterlaufen. Die neuen Blätter erscheinen nach
 * einem Neuladen der Seite – das Skript hat keinen Draht zu den offenen
 * Fenstern.
 *
 * (Bis zur Fassung mit Kampagnen säte das Skript in *den* Almanach. Seitdem
 * gehören Vorlagen je einer Kampagne, und ohne Kampagne fehlte ihm die
 * Angabe, wohin – es brach mit einem Fehler von SQLite ab. Der Vertrag
 * prüft es deshalb jetzt mit, siehe scripts/vertrag/05-vorlagen.mjs.)
 */
import db from '../src/db.js';
import { saeVorlagen, VORLAGEN } from '../src/vorlagen/index.js';

const gesucht = process.argv.slice(2).join(' ').trim();
const offene = db.prepare('SELECT id, name FROM campaigns WHERE deleted_at IS NULL ORDER BY created_at').all();
// Nach dem Namen, ersatzweise nach der Kennung – wie beim Umbenennen.
const ziele = gesucht ? offene.filter((k) => k.name === gesucht || k.id === gesucht) : offene;

console.log('');
if (ziele.length === 0) {
  console.log(gesucht ? `  Keine Kampagne heißt "${gesucht}".` : '  In dieser Datenbank gibt es noch keine Kampagne.');
  if (offene.length) {
    console.log('  Vorhanden sind:');
    for (const k of offene) console.log(`   – "${k.name}"`);
  }
  console.log('');
  process.exit(gesucht ? 1 : 0);
}

for (const kampagne of ziele) {
  const { gesaet } = saeVorlagen(kampagne.id, { erzwingen: true });
  console.log(
    gesaet === 0
      ? `  „${kampagne.name}“: Alle ${VORLAGEN.length} Vorlagen liegen bereits dort.`
      : `  „${kampagne.name}“: ${gesaet} von ${VORLAGEN.length} Vorlagen nachgelegt – als NSC hinter dem Schirm.`
  );
}
console.log('');
