#!/usr/bin/env node
/**
 * Die Rechenprobe des Charakterblattes.
 *
 * Das Blatt rechnet eine Menge aus, was niemand von Hand nachprüfen will:
 * passive Werte, Rettungswürfe, Traglast, und vor allem die Umrechnung
 * zwischen Fuß und Meter, Pfund und Kilogramm. Hier steht, was dabei
 * herauskommen muss – mit den Zahlen eines echten Blattes als Maßstab.
 *
 * Der zweite Zweck ist der wichtigere: Ein Blatt aus einer früheren Fassung
 * des Almanachs darf durch neue Felder nichts verlieren. Wer das Datenmodell
 * anfasst, sieht hier sofort, ob die alten Blätter das überstehen.
 *
 *   npm run blattprobe
 */
import {
  AUSSEHEN_FELDER,
  defaultCharacterData,
  getragenesGewicht,
  gewichtAnzeigen,
  gewichtNachPfund,
  passiverWert,
  saveModifier,
  skillModifier,
  traglastStufen,
  weiteAnzeigen,
  weiteMitEinheit,
  weiteNachFuss,
  withDefaults,
  zauberwerte,
} from '../frontend/src/lib/dnd5e.js';
import { leseBlattdatei } from '../frontend/src/lib/blattEinfuhr.js';
import { esc } from '../frontend/src/lib/blatt/werkzeug.js';
import { dnd5eKoerper, freiKoerper } from '../frontend/src/lib/blatt/koerper.js';
import { datensatzBlock, kiAnleitung } from '../frontend/src/lib/blatt/datensatz.js';
import { unterschiede } from '../frontend/src/lib/einfuhr/unterschiede.js';
import { HELDEN } from '../backend/src/vorlagen/helden.js';
import { blattAus, ATTRIBUTE, FERTIGKEITEN } from '../backend/src/vorlagen/bauen.js';

let ok = 0;
const fehler = [];
/** Eine Prüfung zählen: bestanden oder mit Beschreibung in die Mängelliste. */
const pruefe = (bedingung, was) => (bedingung ? ok++ : fehler.push(was));

/**
 * Zum Vergleichen zweier Blätter: `withDefaults` setzt die Felder neu
 * zusammen und ordnet die Schlüssel dabei um. Das ist keine Änderung am
 * Inhalt – also wird sortiert, bevor verglichen wird.
 */
const kanonisch = (wert) =>
  JSON.stringify(wert, (_schluessel, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]]))
      : v
  );

/** Zwei Werte vergleichen – als JSON, in der Reihenfolge, in der sie gebaut wurden. */
const gleich = (ist, soll, was) =>
  pruefe(JSON.stringify(ist) === JSON.stringify(soll), `${was}: erwartet ${JSON.stringify(soll)}, war ${JSON.stringify(ist)}`);

/* --- Maße: die Zahlen des gedruckten Blattes --------------------------- */
gleich(weiteAnzeigen(30, 'metrisch'), 9, '30 Fuß sind 9 m');
gleich(weiteAnzeigen(60, 'metrisch'), 18, '60 Fuß Dunkelsicht sind 18 m');
gleich(weiteAnzeigen(30, 'imperial'), 30, 'Imperial bleibt Imperial');
gleich(weiteNachFuss(9, 'metrisch'), 30, '9 m zurück sind 30 Fuß');
gleich(weiteNachFuss(18, 'metrisch'), 60, '18 m zurück sind 60 Fuß');
gleich(weiteMitEinheit(30, 'metrisch'), '9 m', 'Weite mit Einheit metrisch');
gleich(weiteMitEinheit(30, 'imperial'), '30 Fuß', 'Weite mit Einheit imperial');

// Hin und zurück darf nichts verlieren.
for (const fuss of [0, 5, 10, 15, 30, 60, 90, 120]) {
  gleich(weiteNachFuss(weiteAnzeigen(fuss, 'metrisch'), 'metrisch'), fuss, `${fuss} Fuß überstehen den Umweg`);
}

/* --- Traglast: die drei Marken von Seite 4 ------------------------------ */
{
  const { ueberladen, schieben } = traglastStufen(18);
  gleich(ueberladen, 270, 'Stärke 18 trägt 270 Pfund');
  gleich(schieben, 540, 'Stärke 18 schiebt 540 Pfund');
  gleich(gewichtAnzeigen(270, 'metrisch'), 122.5, '270 Pfund sind rund 122 kg');
  gleich(gewichtAnzeigen(540, 'metrisch'), 244.9, '540 Pfund sind rund 245 kg');
}
gleich(getragenesGewicht([{ weight: 10, qty: 2 }, { weight: 5, qty: 1 }]), 25, 'Getragenes Gewicht zählt die Anzahl mit');
// Gespeichert wird in Pfund, eingetippt in Kilogramm: Was jemand eintippt,
// muss beim nächsten Öffnen unverändert dastehen.
for (const kilo of [0.5, 2.7, 5.4, 11.3, 25, 84]) {
  gleich(
    gewichtAnzeigen(gewichtNachPfund(kilo, 'metrisch'), 'metrisch'),
    kilo,
    `${kilo} kg stehen nach dem Speichern wieder da`
  );
}

/* --- Gerechnetes -------------------------------------------------------- */
{
  // Ophelia: WEI 8, Übung in Motiv erkennen, INT 15, Stufe 1 (Übungsbonus +2).
  const blatt = withDefaults({
    level: 1,
    abilities: { str: 18, dex: 13, con: 19, int: 15, wis: 8, cha: 19 },
    skills: { insight: { proficient: true, expertise: false } },
    savingThrows: { cha: true },
  });
  gleich(passiverWert(blatt, 'perception'), 9, 'Passive Wahrnehmung 9');
  gleich(passiverWert(blatt, 'insight'), 11, 'Passive Motiverkennung 11');
  gleich(passiverWert(blatt, 'investigation'), 12, 'Passive Nachforschung 12');
  gleich(skillModifier(blatt, 'athletics'), 4, 'Athletik +4');
  gleich(saveModifier(blatt, 'cha'), 6, 'Rettungswurf Charisma +6');
  gleich(saveModifier(blatt, 'wis'), -1, 'Rettungswurf Weisheit -1');
}

/* --- Neue Felder sind da ------------------------------------------------ */
{
  const frisch = defaultCharacterData();
  gleich(frisch.units, 'metrisch', 'Neue Blätter sind metrisch');
  gleich(frisch.experienceMode, 'punkte', 'Neue Blätter zählen Punkte');
  pruefe(Array.isArray(frisch.actions), 'actions ist eine Liste');
  pruefe(typeof frisch.savingThrowNote === 'string', 'savingThrowNote ist da');
  for (const f of AUSSEHEN_FELDER) pruefe(f.key in frisch.appearance, `appearance.${f.key} ist da`);
  pruefe('look' in frisch.traits && 'allies' in frisch.traits, 'Erscheinungsbild und Verbündete sind da');
}

/* --- Alte Blätter überleben die Umstellung ------------------------------ */
{
  // So sah ein Blatt vor dieser Änderung aus.
  const alt = {
    level: 3,
    className: 'Waldläufer',
    abilities: { str: 12, dex: 16, con: 14, int: 10, wis: 15, cha: 8 },
    combat: { speed: 30, senses: { darkvision: 60 }, hp: { max: 24, current: 24, temp: 0 } },
    features: [{ id: 'a', name: 'Erzfeind', source: 'PHB 91', description: 'Vorteil auf Spurensuche.' }],
    spellcasting: { ability: 'wis', spells: [{ id: 's', name: 'Jagdzeichen', level: 1, prepared: true }] },
    inventory: [{ id: 'i', name: 'Langbogen', qty: 1, weight: 2 }],
  };
  const neu = withDefaults(alt);

  gleich(neu.units, 'imperial', 'Alte Blätter behalten Fuß und Pfund');
  gleich(weiteMitEinheit(neu.combat.speed, neu.units), '30 Fuß', 'Bewegung steht unverändert da');
  gleich(weiteMitEinheit(neu.combat.senses.darkvision, neu.units), '60 Fuß', 'Dunkelsicht steht unverändert da');
  gleich(neu.features[0].category, 'sonstiges', 'Merkmale ohne Herkunft stehen unter Sonstiges');
  gleich(neu.features[0].name, 'Erzfeind', 'Das Merkmal selbst bleibt');
  gleich(neu.features[0].source, 'PHB 91', 'Die Quelle bleibt');
  gleich(neu.spellcasting.spells[0].name, 'Jagdzeichen', 'Der Zauber bleibt');
  gleich(neu.spellcasting.spells[0].prepared, true, 'Vorbereitet bleibt vorbereitet');
  gleich(neu.spellcasting.spells[0].range, '', 'Neue Zauberspalten kommen leer dazu');
  gleich(neu.inventory[0].weight, 2, 'Gewichte bleiben in Pfund stehen');
  gleich(neu.combat.hp.max, 24, 'Trefferpunkte bleiben');
  gleich(neu.experienceMode, 'punkte', 'Alte Blätter zählen weiter Punkte');
  pruefe(Array.isArray(neu.actions) && neu.actions.length === 0, 'Aktionen kommen leer dazu');
}

/* --- withDefaults ist gutmütig ------------------------------------------ */
gleich(withDefaults(null).level, 1, 'Aus dem Nichts wird ein leeres Blatt');
gleich(withDefaults({}).units, 'metrisch', 'Ein leeres Blatt bekommt die heutige Vorgabe');
gleich(
  withDefaults({ combat: { speed: 30 } }).units,
  'imperial',
  'Ein Blatt mit Kampfwerten, aber ohne Maßangabe, stammt aus der Fuß-Zeit'
);
gleich(
  withDefaults({ abilities: { str: 12 } }).units,
  'imperial',
  'Auch Attribute allein verraten ein altes Blatt'
);
gleich(withDefaults({ playerName: 'Leo' }).units, 'metrisch', 'Ein bloßer Name macht noch kein altes Blatt');

/* --- Die Vorlagen-Charaktere -------------------------------------------- */
//
// Zwölf von Hand geschriebene Blätter – da verrechnet man sich. Geprüft wird
// deshalb, was sich prüfen lässt: die Abdeckung, die Trefferpunkte, der
// Wertesatz und dass die Oberfläche jedes Blatt ohne Wanderung annimmt.
{
  const KLASSEN = [
    'Barbar', 'Barde', 'Druide', 'Hexenmeister', 'Kämpfer', 'Kleriker',
    'Magier', 'Mönch', 'Paladin', 'Schurke', 'Waldläufer', 'Zauberer',
  ];
  const SPEZIES = [
    'Aasimar', 'Drachenblütiger', 'Elf', 'Gnom', 'Goliath', 'Halbelf',
    'Halbling', 'Halbork', 'Mensch', 'Ork', 'Tiefling', 'Zwerg',
  ];
  const STANDARDSATZ = [8, 10, 12, 13, 14, 15];
  const mod = (wert) => Math.floor((wert - 10) / 2);

  gleich(HELDEN.length, 12, 'Es sind zwölf Vorlagen');
  const deutsch = (liste) => [...liste].sort((a, b) => a.localeCompare(b, 'de'));
  gleich(deutsch(HELDEN.map((h) => h.klasse)), KLASSEN, 'Jede Klasse kommt genau einmal vor');
  gleich(deutsch(HELDEN.map((h) => h.spezies)), SPEZIES, 'Jede Spezies kommt genau einmal vor');
  gleich(new Set(HELDEN.map((h) => h.schluessel)).size, 12, 'Jede Vorlage hat einen eigenen Schlüssel');
  gleich(new Set(HELDEN.map((h) => h.name)).size, 12, 'Jede Vorlage hat einen eigenen Namen');

  for (const held of HELDEN) {
    const wer = `${held.name} (${held.spezies} ${held.klasse})`;
    const blatt = blattAus(held);

    // Der Standardwertesatz, auf den der Hintergrund +2 und +1 legt: Zieht man
    // die beiden Boni wieder ab, muss 15/14/13/12/10/8 herauskommen.
    const werte = ATTRIBUTE.map((a) => held.werte[a]);
    let satzGeht = false;
    for (let i = 0; i < 6 && !satzGeht; i++) {
      for (let j = 0; j < 6; j++) {
        if (i === j) continue;
        const ohne = [...werte];
        ohne[i] -= 2;
        ohne[j] -= 1;
        if (JSON.stringify([...ohne].sort((a, b) => a - b)) === JSON.stringify(STANDARDSATZ)) satzGeht = true;
      }
    }
    pruefe(satzGeht, `${wer}: Wertesatz ist Standard plus Hintergrund (+2/+1)`);

    // Trefferpunkte: voller Trefferwürfel plus Konstitution, beim Zwerg +1.
    const wuerfel = Number(held.trefferwuerfel.split('d')[1]);
    const sollTp = wuerfel + mod(held.werte.con) + (held.spezies === 'Zwerg' ? 1 : 0);
    gleich(held.trefferpunkte, sollTp, `${wer}: Trefferpunkte`);

    gleich(held.rettungswuerfe.length, 2, `${wer}: genau zwei Rettungswurf-Übungen`);
    for (const rw of held.rettungswuerfe) pruefe(ATTRIBUTE.includes(rw), `${wer}: Rettungswurf „${rw}“ gibt es`);
    for (const f of [...held.fertigkeiten, ...(held.expertise ?? [])]) {
      pruefe(FERTIGKEITEN.includes(f), `${wer}: Fertigkeit „${f}“ gibt es`);
    }

    pruefe(held.ruestungsklasse >= 10 && held.ruestungsklasse <= 20, `${wer}: Rüstungsklasse ist plausibel`);
    pruefe(held.ausruestung.length >= 5, `${wer}: hat eine Startausrüstung`);
    pruefe(held.ausruestung.every((g) => typeof g.weight === 'number'), `${wer}: jedes Gewicht ist eine Zahl`);
    pruefe(held.angriffe.length >= 1, `${wer}: hat mindestens einen Angriff`);
    pruefe(held.merkmale.length >= 4, `${wer}: hat Merkmale`);
    pruefe(held.wesen.backstory.length > 200, `${wer}: hat eine eigene Vorgeschichte`);
    pruefe(Object.values(held.aussehen).every(Boolean), `${wer}: Aussehen ist vollständig`);
    pruefe((held.muenzen.gp ?? 0) > 0, `${wer}: hat Startgold`);

    // Wer zaubert, hat Zauber; wer nicht zaubert, hat keine.
    const zaubert = ['Barde', 'Druide', 'Hexenmeister', 'Kleriker', 'Magier', 'Paladin', 'Waldläufer', 'Zauberer'];
    if (zaubert.includes(held.klasse)) {
      pruefe(blatt.spellcasting.spells.length > 0, `${wer}: hat Zauber`);
      pruefe(blatt.spellcasting.slots[1].max > 0, `${wer}: hat einen Zauberplatz`);
      pruefe(
        blatt.spellcasting.spells.every((z) => z.time && z.range && z.duration),
        `${wer}: jeder Zauber trägt Zeit, Reichweite und Dauer`
      );
    }

    // Das Wichtigste: Die Oberfläche nimmt das Blatt, wie es ist. Ergänzt wird
    // nur `mini` – das Feld einer längst entfernten Figurenschmiede.
    const durch = withDefaults(blatt);
    delete durch.mini;
    gleich(kanonisch(durch), kanonisch(blatt), `${wer}: braucht keine Wanderung`);
    gleich(durch.units, 'metrisch', `${wer}: rechnet metrisch`);
    gleich(durch.level, 1, `${wer}: steht auf Stufe 1`);
  }
}


/* --- Zauberwirken: gerechnet oder von Hand ----------------------------- */
{
  // Stufe 5 (Übung +3), Intelligenz 18 (+4): SG 15, Angriff +7.
  const magier = withDefaults({ level: 5, abilities: { int: 18 }, spellcasting: { ability: 'int' } });
  const gerechnet = zauberwerte(magier);
  gleich([gerechnet.sg, gerechnet.bonus], [15, 7], 'Zauber-SG und Angriff werden gerechnet');
  gleich([gerechnet.sgVonHand, gerechnet.bonusVonHand], [null, null], 'Ohne eigenen Wert steht nichts von Hand');

  // Ein Stab des Zauberers: +2 auf beides, von Hand eingetragen.
  const mitStab = withDefaults({
    level: 5,
    abilities: { int: 18 },
    spellcasting: { ability: 'int', manualSaveDC: 17, manualAttackBonus: 9 },
  });
  const vonHand = zauberwerte(mitStab);
  gleich([vonHand.sg, vonHand.bonus], [17, 9], 'Ein eigener Wert gilt vor der Rechnung');
  gleich([vonHand.berechneterSg, vonHand.berechneterBonus], [15, 7], 'Die Rechnung bleibt als Vorschlag daneben');

  // Ein geleertes Feld heißt „rechnen“, auch wenn es als Text ankommt.
  const geleert = withDefaults({ level: 5, abilities: { int: 18 }, spellcasting: { ability: 'int', manualSaveDC: '' } });
  gleich(zauberwerte(geleert).sg, 15, 'Ein leeres Feld rechnet wieder');
  // Eine 0 ist ein Wert, kein „nichts“ – wer sie einträgt, meint sie.
  const null_ = withDefaults({ level: 5, abilities: { int: 18 }, spellcasting: { ability: 'int', manualAttackBonus: 0 } });
  gleich(zauberwerte(null_).bonus, 0, 'Ein Bonus von 0 von Hand bleibt 0');
}

/* --- Mitgenommene Blätter wieder einlesen ------------------------------- */
{
  // So, wie blattAusfuhr.js den Datensatz vor Fassung 2 ans Ende der Datei
  // schrieb: als entschärfter Text in einem <template> (esc aus lib/blatt/werkzeug.js).
  const datensatz = {
    name: 'Elara Nachtwind',
    system: 'dnd5e',
    data: { level: 3, backstory: 'Kam über die </template>-Brücke & sagte „<nein>“.' },
    stand: '2026-09-30T12:00:00.000Z',
  };
  const html = `<!doctype html><html><body><div class="blatt">…</div>
<template id="almanach-daten">${esc(JSON.stringify(datensatz, null, 2))}</template></body></html>`;
  const gelesen = leseBlattdatei(html);
  gleich(gelesen.name, 'Elara Nachtwind', 'Einlesen: der Name kommt an');
  gleich(gelesen.system, 'dnd5e', 'Einlesen: das Regelwerk kommt an');
  // Was im Datensatz stand, kommt an – aufgefüllt zu einem vollständigen Blatt.
  const kern = (d) => [d.level, d.backstory];
  gleich(kern(gelesen.data), kern(datensatz.data), 'Einlesen: der Datensatz kommt an, auch mit „</template>“ und „&“ im Text');
  pruefe(gelesen.data.combat?.hp && Array.isArray(gelesen.data.attacks), 'Einlesen: und ist danach ein vollständiges Blatt');

  // Noch ältere Dateien trugen den Datensatz roh in einem <script>, mit \u003c.
  const alt = `<script type="application/json" id="almanach-daten">${JSON.stringify(datensatz).replace(/</g, '\\u003c')}</script>`;
  gleich(kern(leseBlattdatei(alt).data), kern(datensatz.data), 'Einlesen: auch eine Datei aus einer älteren Fassung');

  // Der nackte Datensatz geht auch – für alle, die ihn schon herauskopiert haben.
  gleich(leseBlattdatei(JSON.stringify(datensatz)).name, 'Elara Nachtwind', 'Einlesen: nackter JSON-Text geht auch');

  const wirft = (text) => {
    try {
      leseBlattdatei(text);
      return false;
    } catch (fehler_) {
      return typeof fehler_.message === 'string' && fehler_.message.length > 0;
    }
  };
  pruefe(wirft('<html><body>Ein Einkaufszettel</body></html>'), 'Einlesen: eine fremde Datei wird abgelehnt');
  pruefe(wirft(JSON.stringify({ ...datensatz, system: 'pathfinder' })), 'Einlesen: ein unbekanntes Regelwerk wird abgelehnt');
  pruefe(wirft(JSON.stringify({ ...datensatz, name: '  ' })), 'Einlesen: ein Blatt ohne Namen wird abgelehnt');
  pruefe(wirft(JSON.stringify({ ...datensatz, data: [] })), 'Einlesen: ein Datensatz, der kein Objekt ist, wird abgelehnt');
  pruefe(
    wirft('<script type="application/json" id="almanach-daten">{ kaputt</script>'),
    'Einlesen: ein beschädigter Datensatz wird abgelehnt'
  );
}

/* --- Mit einer KI bearbeitet und wieder eingelesen ------------------------- */
{
  // Eine Datei, wie „Mitnehmen“ sie schreibt (Fassung 2): Anleitung oben,
  // markierte Werte auf der Seite, Datensatz als JSON am Ende.
  const daten = withDefaults({
    units: 'metrisch',
    level: 3,
    race: 'Zwerg',
    className: 'Kämpfer',
    abilities: { str: 16, dex: 12 },
    combat: { speed: 30, hp: { max: 28, current: 20, temp: 0 }, conditions: ['Vergiftet'] },
    attacks: [{ id: 'a1', name: 'Langschwert', bonus: '+5', damage: '1W8+3 Hieb', notes: '' }],
    inventory: [{ id: 'g1', name: 'Seil', qty: 1, weight: 10, notes: '' }],
    traits: { backstory: 'Kam über die </template>-Brücke\n& sagte „<nein>“.' },
  });
  const blatt = { id: 'blatt-thorin-1', name: 'Thorin', system: 'dnd5e' };
  const datei = `<!doctype html>\n${kiAnleitung('dnd5e')}\n<html><body>${dnd5eKoerper(blatt, daten, {}, {})}\n${datensatzBlock(blatt, daten)}\n</body></html>`;
  const vergleich = (g) => unterschiede('dnd5e', { name: 'Thorin', data: daten }, g);

  const unveraendert = leseBlattdatei(datei);
  gleich([unveraendert.name, unveraendert.id], ['Thorin', 'blatt-thorin-1'], 'KI: Name und Kennung des Blattes reisen mit');
  gleich(vergleich(unveraendert), [], 'KI: eine unveränderte Datei ändert nichts am Blatt');
  gleich([unveraendert.hinweise, unveraendert.sichtbar], [[], []], 'KI: und meldet nichts');
  gleich(unveraendert.data.traits.backstory, daten.traits.backstory, 'KI: „</template>“, „&“ und „<“ im Text überstehen die Reise');
  pruefe(!/<template[^>]*>[^]*&quot;/.test(datei.split('<template id="almanach-daten">')[1] ?? ''), 'KI: der Datensatz ist lesbares JSON, ohne &quot;');
  pruefe(/ANLEITUNG FÜR KI-ASSISTENTEN/.test(datei) && /combat\.hp\.max/.test(kiAnleitung('dnd5e')), 'KI: die Anleitung mit Feldverzeichnis steht in der Datei');

  // Die KI ändert den Datensatz – mit den typischen Ungenauigkeiten.
  const imJson = datei
    .replace('"level": 3,', '"level": "5", // Stufe erhöht')
    .replace('"attacks": [', '"attacks": [\n    { "name": "Kurzbogen", "bonus": "+4", "damage": "1W6+2 Stich", },')
    .replace('"Vergiftet"', '"vergiftet", "Wütend"')
    .replace('"portrait": ""', '"portrait": "https://example.com/bild.png"');
  const ausChat = leseBlattdatei(`Hier ist dein Blatt:\n\n\`\`\`html\n${imJson}\n\`\`\`\n\nViel Spaß am Tisch!`);
  gleich(ausChat.data.level, 5, 'KI: Stufe aus dem Datensatz, als Zahl – auch aus einer Chat-Antwort mit Codeblock');
  pruefe(ausChat.hinweise.some((h) => /repariert/.test(h)), 'KI: Kommentar und überzähliges Komma werden repariert und gemeldet');
  const kurzbogen = ausChat.data.attacks.find((a) => a.name === 'Kurzbogen');
  pruefe(typeof kurzbogen?.id === 'string' && kurzbogen.id.length > 8 && kurzbogen.notes === '', 'KI: ein neuer Angriff bekommt Kennung und leere Felder');
  gleich(ausChat.data.combat.conditions, ['Vergiftet'], 'KI: Zustände in der Schreibweise des Almanachs, Unbekanntes fällt weg');
  pruefe(ausChat.hinweise.some((h) => /Wütend/.test(h)), 'KI: und der Hinweis nennt, was wegfiel');
  gleich(ausChat.data.portrait, '', 'KI: ein Bildnis von außerhalb wird nicht übernommen');
  gleich(vergleich(ausChat), ['Neu: Angriff „Kurzbogen“', 'Stufe: 3 → 5'], 'KI: die Vorschau nennt genau die Änderungen');

  // Dieselbe Datei ein zweites Mal ins schon aktualisierte Blatt: Der Kurzbogen ist derselbe.
  const zweitesMal = leseBlattdatei(imJson, { bekannt: ausChat.data });
  gleich(
    zweitesMal.data.attacks.find((a) => a.name === 'Kurzbogen')?.id,
    kurzbogen?.id,
    'KI: wer die Datei zweimal einliest, bekommt den neuen Angriff nicht zweimal'
  );
  gleich(
    unterschiede('dnd5e', { name: 'Thorin', data: ausChat.data }, zweitesMal),
    [],
    'KI: und die Vorschau meldet dann keine Änderung'
  );

  // Die KI ändert nur die sichtbare Seite.
  const nurSichtbar = datei
    .replace('data-feld="level" data-war="3">3<', 'data-feld="level" data-war="3">4<')
    .replace(/(data-feld="combat\.speed" data-war="9 m">)9 m</, '$112 m<')
    .replace(/(data-feld="combat\.hp\.max" data-war="28">)28</, '$135<')
    .replace(/(data-feld="attacks\.#a1\.damage" data-war="1W8\+3 Hieb">)1W8\+3 Hieb</, '$11W8+4 Hieb<');
  const sichtbar = leseBlattdatei(nurSichtbar);
  gleich(
    [sichtbar.data.level, sichtbar.data.combat.speed, sichtbar.data.combat.hp.max, sichtbar.data.attacks[0].damage],
    [4, 40, 35, '1W8+4 Hieb'],
    'KI: nur sichtbar geänderte Werte werden übernommen – 12 m werden 40 Fuß'
  );
  gleich(sichtbar.sichtbar.length, 4, 'KI: und einzeln gemeldet');
  pruefe(vergleich(sichtbar).includes('Bewegung: 9 m → 12 m'), 'KI: die Vorschau zeigt Weiten so, wie das Blatt sie zeigt');

  // Beides geändert, verschieden: Der Datensatz gilt.
  const beides = nurSichtbar.replace('"level": 3,', '"level": 6,');
  gleich(leseBlattdatei(beides).data.level, 6, 'KI: widersprechen sich Seite und Datensatz, gilt der Datensatz');

  // Der Datensatz ist weg – das Blatt entsteht aus der Seite.
  const ohneDatensatz = datei.replace(/<template id="almanach-daten">[\s\S]*?<\/template>/, '');
  const ausSeite = leseBlattdatei(ohneDatensatz);
  gleich(
    [ausSeite.name, ausSeite.data.level, ausSeite.data.abilities.str, ausSeite.data.attacks[0]?.name, ausSeite.data.traits.backstory],
    ['Thorin', 3, 16, 'Langschwert', daten.traits.backstory],
    'KI: ohne Datensatz wird das Blatt aus den sichtbaren Werten gebaut'
  );
  pruefe(ausSeite.hinweise.some((h) => /fehlte/.test(h)), 'KI: und der Hinweis sagt, dass der Datensatz fehlte');

  // Gekürzt oder kaputt: eine Meldung mit Zeile und Grund.
  const meldung = (text) => {
    try {
      leseBlattdatei(text);
      return '';
    } catch (fehler_) {
      return fehler_.message;
    }
  };
  pruefe(/Zeile \d+, Spalte \d+/.test(meldung(datei.replace('"level": 3,', '"level": 3'))), 'KI: ein fehlendes Komma wird mit Zeile und Spalte gemeldet');
  pruefe(/gekürzt/.test(meldung(datei.replace(/"traits": \{[\s\S]*$/, '"traits": {\n    ...\n'))), 'KI: eine gekürzte Datei wird als gekürzt erkannt');
  pruefe(
    /gekürzt/.test(meldung(datei.replace(/"attacks": \[\n[\s\S]*?\n {4}\},/, '"attacks": [\n    // … wie bisher\n'))),
    'KI: auch „// … wie bisher“ mitten im Datensatz'
  );

  // Typen, wie eine KI sie schreibt, werden zu dem, was das Blatt erwartet.
  const typen = leseBlattdatei(
    JSON.stringify({ name: 'Mira', system: 'dnd5e', data: { level: '7', inspiration: 'ja', skills: { stealth: true }, abilities: { dex: '+18' }, spellcasting: { ability: 'Weisheit', manualSaveDC: '' } } })
  );
  gleich(
    [typen.data.level, typen.data.inspiration, typen.data.skills.stealth, typen.data.abilities.dex, typen.data.spellcasting.ability, typen.data.spellcasting.manualSaveDC],
    [7, true, { proficient: true, expertise: false }, 18, 'wis', null],
    'KI: Zahlen, Häkchen, Fertigkeiten und Zauberattribut in der Form des Blattes'
  );
  gleich(leseBlattdatei(JSON.stringify({ level: 2, abilities: { str: 10 } }), { ersatzName: 'Ohne Hülle' }).name, 'Ohne Hülle', 'KI: nur die Daten ohne Hülle gehen auch – mit dem Namen des Blattes');

  // Ein freies Blatt geht denselben Weg.
  const frei = { id: 'frei-1', name: 'Kapitänin Vey', system: 'freeform' };
  const freiDaten = { portrait: '', summary: 'Piratin', sections: [{ id: 's1', title: 'Schiff', content: 'Die Möwe' }] };
  const freiDatei = `<html><body>${freiKoerper(frei, freiDaten, {})}${datensatzBlock(frei, freiDaten)}</body></html>`
    .replace(/(data-feld="sections\.#s1\.content" data-war="Die Möwe">)Die Möwe</, '$1Die Sturmmöwe<');
  gleich(leseBlattdatei(freiDatei).data.sections[0].content, 'Die Sturmmöwe', 'KI: ein freies Blatt übernimmt eine sichtbare Änderung ebenso');
}

console.log('');
if (fehler.length === 0) {
  console.log(`  Das Blatt rechnet richtig: ${ok} Prüfungen bestanden.`);
  process.exit(0);
}
console.log(`  ${ok} bestanden, ${fehler.length} nicht:`);
for (const f of fehler) console.log(`   – ${f}`);
process.exit(1);
