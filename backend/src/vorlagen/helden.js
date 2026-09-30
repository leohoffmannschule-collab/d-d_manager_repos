/**
 * Zwölf fertige Charaktere, wie sie ein Spieler am Abend vor der ersten
 * Runde angelegt hätte.
 *
 * Jede Klasse kommt genau einmal vor, jede Spezies genau einmal – die zehn
 * aus dem Regelwerk von 2024, dazu Halbelf und Halbork aus dem älteren Buch,
 * damit auch die beiden nicht fehlen. Alle stehen auf Stufe 1 und tragen die
 * Startausrüstung ihrer Klasse und ihres Hintergrunds.
 *
 * Gebaut sind sie nach dem Standardwertesatz (15, 14, 13, 12, 10, 8), auf den
 * der Hintergrund nach den Regeln von 2024 noch +2 und +1 legt. Halbelf und
 * Halbork bekommen deshalb keine eigenen Attributsboni, sondern nur ihre
 * Eigenschaften – sonst stünden zwei Blätter besser da als die übrigen zehn.
 *
 * Wer eine Vorlage übernehmen will, macht eine Abschrift davon und trägt sich
 * als Spieler ein. Die Vorlage selbst bleibt liegen.
 */

import kaempferZwerg from './helden/kaempfer-zwerg.js';
import barbarGoliath from './helden/barbar-goliath.js';
import bardeHalbelf from './helden/barde-halbelf.js';
import klerikerAasimar from './helden/kleriker-aasimar.js';
import druideGnom from './helden/druide-gnom.js';
import moenchHalbling from './helden/moench-halbling.js';
import paladinDrachenbluetiger from './helden/paladin-drachenbluetiger.js';
import waldlaeuferElf from './helden/waldlaeufer-elf.js';
import schurkeTiefling from './helden/schurke-tiefling.js';
import zaubererOrk from './helden/zauberer-ork.js';
import hexenmeisterHalbork from './helden/hexenmeister-halbork.js';
import magierMensch from './helden/magier-mensch.js';

/**
 * Die zwölf, in der Reihenfolge, in der sie hinter dem Schirm liegen.
 *
 * Die Reihenfolge ist fest: `bauen.js` leitet aus dem Schlüssel jeder
 * Vorlage die Kennungen ihrer Zeilen ab, und die Blattprobe
 * (scripts/blattprobe.mjs) zählt nach, dass jede Klasse und jede Spezies
 * genau einmal vorkommt.
 */
export const HELDEN = [
  kaempferZwerg, // Zwerg · Kämpfer
  barbarGoliath, // Goliath · Barbar
  bardeHalbelf, // Halbelf · Barde
  klerikerAasimar, // Aasimar · Kleriker
  druideGnom, // Gnom · Druide
  moenchHalbling, // Halbling · Mönch
  paladinDrachenbluetiger, // Drachenblütiger · Paladin
  waldlaeuferElf, // Elf · Waldläufer
  schurkeTiefling, // Tiefling · Schurke
  zaubererOrk, // Ork · Zauberer
  hexenmeisterHalbork, // Halbork · Hexenmeister
  magierMensch, // Mensch · Magier
];
