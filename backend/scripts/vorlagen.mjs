#!/usr/bin/env node
/**
 * Die Vorlagen-Charaktere nachlegen.
 *
 * Beim ersten Start legt der Almanach sie von selbst an. Wer sie danach
 * gelöscht hat und zurückhaben will, ruft dieses Skript auf:
 *
 *   npm run vorlagen
 *
 * Es fügt nur hinzu, was fehlt. Eine Vorlage, die noch liegt – und sei sie
 * längst umgeschrieben –, bleibt unangetastet.
 */
import { saeVorlagen, VORLAGEN } from '../src/vorlagen/index.js';

const { gesaet } = saeVorlagen({ erzwingen: true });

console.log('');
if (gesaet === 0) {
  console.log(`  Alle ${VORLAGEN.length} Vorlagen liegen bereits im Almanach.`);
} else {
  console.log(`  ${gesaet} von ${VORLAGEN.length} Vorlagen nachgelegt – als NSC hinter dem Schirm.`);
}
console.log('');
