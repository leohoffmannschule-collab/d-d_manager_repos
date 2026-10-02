/**
 * Der Datensatz am Ende des mitgenommenen Blattes – und die Anleitung für
 * eine KI, die das Blatt bearbeiten soll.
 *
 * Wer sein Blatt einer KI gibt („mach ihn Stufe 5“, „trag die Beute von
 * gestern ein“), bekommt eine geänderte Datei zurück und liest sie mit
 * „Blatt einlesen“ wieder in den Almanach. Damit das gelingt, muss die KI
 * wissen, wo die Werte stehen und was sie dort darf. Das sagt ihr ein
 * Kommentar im Kopf der Datei – unsichtbar im Browser, aber das Erste, was
 * eine KI im Quelltext liest. Das Feldverzeichnis darin wird aus
 * glossar.js geschrieben, steht also nie neben dem echten Datenmodell.
 *
 * Der Datensatz selbst ist schlichtes, eingerücktes JSON in einem
 * `<template>`. Die drei Zeichen, die HTML etwas bedeuten (`<`, `>`, `&`),
 * stehen als JSON-Escapes (`<` …) darin: So ist der Block gültiges
 * JSON, das eine KI ohne Umweg lesen und ändern kann, und ein Text wie
 * „</template>“ in einer Hintergrundgeschichte kann ihn trotzdem nicht
 * beenden.
 *
 * Keine Abhängigkeit vom Browser: Die Blattprobe baut damit in Node echte
 * Dateien nach (scripts/blattprobe.mjs).
 */
import { ABILITIES, CONDITIONS, SKILLS } from '../regeln/listen.js';
import { verzeichnis } from './glossar.js';

/** Die Fassung des Dateiformats. 2: lesbares JSON, Kennung, Feldmarken, Anleitung. */
export const FASSUNG = 2;

/** JSON, das in HTML stehen darf, ohne etwas zu bedeuten – und gültiges JSON bleibt. */
export function jsonFuerHtml(wert) {
  return JSON.stringify(wert, null, 2).replace(/[<>&]/g, (z) => `\\u00${z.charCodeAt(0).toString(16)}`);
}

/** Wie eine Art in der Anleitung beschrieben wird. */
const ART = {
  text: 'Text',
  zahl: 'Zahl',
  weite: 'Zahl in FUSS',
  gewicht: 'Zahl in PFUND',
  ja: 'true/false',
};

/** Eine Zeile des Feldverzeichnisses: Pfad, Punkte, Bedeutung. */
const zeile = (pfad, text) => `    ${pfad} ${'.'.repeat(Math.max(2, 38 - pfad.length))} ${text}`;

/** Ein Feld mit seiner Art (und bei einer Wahl mit den erlaubten Schlüsseln). */
function beschreibung(feld) {
  if (feld.art === 'wahl') return `${feld.label}: ${feld.optionen.map(([k, label]) => `"${k}" (${label})`).join(', ')}`;
  const grenzen = feld.von !== undefined && feld.bis !== undefined ? `, ${feld.von}–${feld.bis}` : '';
  return `${feld.label} (${ART[feld.art]}${grenzen})`;
}

/** Das Feldverzeichnis für die Anleitung, nach Regelwerk. */
function feldverzeichnis(system) {
  const { felder, listen } = verzeichnis(system);
  const teile = ['  Die Felder unter "data":', ...felder.map((f) => zeile(f.pfad, beschreibung(f)))];
  if (system !== 'freeform') {
    teile.push(
      zeile('savingThrows.<kürzel>', 'Rettungswurf geübt (true/false)'),
      zeile('skills.<fertigkeit>.proficient', 'Fertigkeit geübt (true/false); .expertise: Expertise'),
      `      Fertigkeiten: ${SKILLS.map((s) => `${s.key} (${s.label})`).join(', ')}`,
      zeile('combat.conditions', `Liste der Zustände, nur diese Namen: ${CONDITIONS.join(', ')}`),
      zeile('combat.deathSaves.successes', 'Erfolge gegen den Tod (0–3); .failures: Fehlschläge'),
      zeile('combat.concentration.active', 'Konzentriert sich gerade (true/false)'),
      zeile('inspiration', 'Inspiration vorhanden (true/false)'),
      zeile('spellcasting.ability', `Zauberattribut: ${ABILITIES.map((a) => `"${a.key}"`).join(', ')}`),
      zeile('spellcasting.slots.<grad>.used', 'Verbrauchte Zauberplätze je Grad (1–9)'),
      zeile('spellcasting.manualSaveDC', 'Zauber-SG von Hand (Zahl) – null heißt: der Almanach rechnet'),
      zeile('spellcasting.manualAttackBonus', 'Zauberangriffsbonus von Hand (Zahl) – null heißt: rechnen'),
      zeile('units', 'Anzeige: "metrisch" (Meter, Kilogramm) oder "imperial" (Fuß, Pfund)'),
      zeile('experienceMode', '"punkte" (Erfahrungspunkte) oder "meilenstein"'),
      zeile('portrait', 'Bildnis als data:-URL – nicht ändern'),
    );
  }
  for (const [pfad, liste] of Object.entries(listen)) {
    teile.push(
      '',
      `  ${pfad} – ${liste.label}, eine Liste. Ein Eintrag (${liste.einzahl}) hat "id" und:`,
      ...Object.entries(liste.felder).map(([key, feld]) => zeile(`  ${key}`, beschreibung(feld)))
    );
  }
  return teile.join('\n');
}

/**
 * Die Anleitung für eine KI, als HTML-Kommentar. Nur „–“ statt doppelter
 * Bindestriche: Zwei Bindestriche hintereinander beenden in manchen
 * Werkzeugen einen Kommentar.
 */
export function kiAnleitung(system) {
  return `<!--
  ANLEITUNG FÜR KI-ASSISTENTEN · Abenteuer-Almanach, Blattdatei Fassung ${FASSUNG}

  For AI assistants: This file is a character sheet exported from "Abenteuer-Almanach".
  Apply the requested changes to the JSON data record in the <template> element with the
  id "almanach-daten" at the end of the file, keep it valid JSON, and return the COMPLETE
  file as .html.

  Diese Datei ist ein Charakterblatt aus dem Abenteuer-Almanach. Wer sie dir gibt, will
  sie geändert zurück und liest sie danach mit „Blatt einlesen“ wieder in den Almanach.
  Damit das gelingt:

  1. Maßgeblich ist der DATENSATZ am Ende der Datei: das JSON im <template>-Element
     mit der id "almanach-daten". Trag jede Änderung dort ein.
  2. Gib die GANZE Datei zurück, als .html. Nichts weglassen, nichts abkürzen
     (kein „…“, kein „Rest unverändert“).
  3. Das JSON bleibt gültig: doppelte Anführungszeichen, keine Kommentare, kein Komma
     nach dem letzten Eintrag, Zahlen ohne Anführungszeichen, true/false für Ja/Nein.
     Zeilenumbrüche in Texten als \\n.
  4. Felder nicht umbenennen und nicht löschen. "id" ganz oben (die Kennung des Blattes)
     und "id" in Listeneinträgen unverändert lassen. Neue Listeneinträge brauchen
     keine "id" – der Almanach vergibt sie.
  5. Weiten (Bewegung, Sinne) stehen in FUSS, Gewichte in PFUND – auch wenn die Seite
     Meter und Kilogramm zeigt. 1 Fuß = 0,3 m; 1 Pfund = 0,4536 kg.
  6. Was der Almanach selbst rechnet, steht nicht im Datensatz: Modifikatoren,
     Übungsbonus, Rettungswurf- und Fertigkeitsboni, passive Werte, Zauber-SG,
     Traglast. Ändere die Grundwerte, nicht das Ergebnis.
  7. Die sichtbare Seite darfst du mit anpassen. Werte darin tragen die Attribute
     data-feld und data-war: Die bitte unverändert lassen. Ändert sich nur die
     sichtbare Seite, übernimmt der Almanach die markierten Werte trotzdem – alles
     andere (neue Einträge, leere Felder, Häkchen) nur aus dem Datensatz.
  8. Regeln: D&D 5e, Regelwerk 2024. Eine höhere Stufe heißt meist auch mehr
     Trefferpunkte, Trefferwürfel und Zauberplätze – trag sie mit ein, wenn du sie kennst.

  Oben im Datensatz: "name" (Name des Charakters), "system" ("dnd5e" oder "freeform" –
  nicht ändern), "id", "stand" (wann ausgeführt), "fassung" und "data".

${feldverzeichnis(system)}
-->`;
}

/**
 * Der Datensatz als `<template>`-Block.
 *
 * @param {object} character  das Blatt: id, name, system
 * @param {object} data       seine Daten (bei 5e schon mit Standardwerten aufgefüllt)
 */
export function datensatzBlock(character, data) {
  const datensatz = {
    fassung: FASSUNG,
    id: character.id ?? null,
    name: character.name,
    system: character.system,
    stand: new Date().toISOString(),
    data,
  };
  return `<template id="almanach-daten">\n${jsonFuerHtml(datensatz)}\n</template>`;
}
