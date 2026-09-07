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
} from '../frontend/src/lib/dnd5e.js';
import { HELDEN } from '../backend/src/vorlagen/helden.js';
import { blattAus, ATTRIBUTE, FERTIGKEITEN } from '../backend/src/vorlagen/bauen.js';

let ok = 0;
const fehler = [];
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


console.log('');
if (fehler.length === 0) {
  console.log(`  Das Blatt rechnet richtig: ${ok} Prüfungen bestanden.`);
  process.exit(0);
}
console.log(`  ${ok} bestanden, ${fehler.length} nicht:`);
for (const f of fehler) console.log(`   – ${f}`);
process.exit(1);
