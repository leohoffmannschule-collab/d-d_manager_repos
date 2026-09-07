/**
 * Aus einem knappen Steckbrief wird ein vollständiges Charakterblatt.
 *
 * Die Vorlagen in `helden.js` sollen lesbar bleiben – dort steht, was einen
 * Charakter ausmacht, und nicht, dass achtzehn Fertigkeiten allesamt auf
 * „nicht geübt“ stehen. Das Auffüllen erledigt diese Datei.
 *
 * Die Kennungen der Zeilen (Gegenstände, Merkmale, Zauber) werden aus dem
 * Schlüssel der Vorlage abgeleitet und nicht gewürfelt. So bekommt dieselbe
 * Vorlage bei jedem Säen dieselben Kennungen – das hält die Oberfläche ruhig
 * und macht die Prüfung wiederholbar.
 */

/** Die achtzehn Fertigkeiten, in derselben Reihenfolge wie auf dem Blatt. */
export const FERTIGKEITEN = [
  'acrobatics',
  'animalHandling',
  'arcana',
  'athletics',
  'deception',
  'history',
  'insight',
  'intimidation',
  'investigation',
  'medicine',
  'nature',
  'perception',
  'performance',
  'persuasion',
  'religion',
  'sleightOfHand',
  'stealth',
  'survival',
];

export const ATTRIBUTE = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

const leer = (schluessel, wert) => Object.fromEntries(schluessel.map((k) => [k, wert]));

/** Zeilen bekommen eine Kennung, die sich aus Vorlage und Platz ergibt. */
const mitKennung = (schluessel, art, zeilen) =>
  (zeilen ?? []).map((zeile, i) => ({ id: `${schluessel}-${art}-${i + 1}`, ...zeile }));

/**
 * Ein Charakterblatt aus dem Steckbrief.
 *
 * Was hier nicht gesetzt wird, ergänzt die Oberfläche beim Öffnen von selbst –
 * sie tut das ohnehin für jedes Blatt aus einer früheren Fassung. Zwei Dinge
 * müssen aber ausdrücklich dastehen: das Maßsystem und die Art des Aufstiegs.
 * Ohne Maßangabe hielte die Oberfläche eine Vorlage für ein altes Blatt und
 * rechnete in Fuß, obwohl hier alles metrisch gemeint ist.
 */
export function blattAus(vorlage) {
  const {
    schluessel,
    spezies,
    unterart = '',
    klasse,
    hintergrund,
    gesinnung,
    werte,
    rettungswuerfe = [],
    fertigkeiten = [],
    expertise = [],
    ruestungsklasse,
    initiativeBonus = 0,
    trefferpunkte,
    trefferwuerfel,
    bewegung = 30,
    sinne = {},
    verteidigung = {},
    rettungswurfVermerk = '',
    uebungen = {},
    angriffe = [],
    aktionen = [],
    ressourcen = [],
    merkmale = [],
    zauber = null,
    ausruestung = [],
    muenzen = {},
    aussehen = {},
    wesen = {},
  } = vorlage;

  const fertigkeitenStand = Object.fromEntries(
    FERTIGKEITEN.map((k) => [
      k,
      { proficient: fertigkeiten.includes(k) || expertise.includes(k), expertise: expertise.includes(k) },
    ])
  );

  return {
    portrait: '',
    race: spezies,
    subrace: unterart,
    className: klasse,
    subclass: '',
    level: 1,
    background: hintergrund,
    alignment: gesinnung,
    // Die Vorlagen gehören noch niemandem – wer sie übernimmt, trägt sich ein.
    playerName: '',
    experience: 0,
    experienceMode: 'punkte',
    units: 'metrisch',
    abilities: { ...leer(ATTRIBUTE, 10), ...werte },
    savingThrows: Object.fromEntries(ATTRIBUTE.map((k) => [k, rettungswuerfe.includes(k)])),
    savingThrowNote: rettungswurfVermerk,
    skills: fertigkeitenStand,
    combat: {
      armorClass: ruestungsklasse,
      initiativeBonus,
      speed: bewegung,
      hp: { max: trefferpunkte, current: trefferpunkte, temp: 0 },
      hitDice: trefferwuerfel,
      hitDicePool: { size: Number(trefferwuerfel.split('d')[1]) || 8, total: 1, used: 0 },
      deathSaves: { successes: 0, failures: 0 },
      conditions: [],
      exhaustion: 0,
      concentration: { active: false, spell: '' },
      defenses: { resistances: '', immunities: '', vulnerabilities: '', ...verteidigung },
      senses: { sight: 0, darkvision: 0, blindsight: 0, tremorsense: 0, truesight: 0, notes: '', ...sinne },
    },
    inspiration: false,
    resources: mitKennung(schluessel, 'res', ressourcen),
    attunement: ['', '', ''],
    attacks: mitKennung(schluessel, 'ang', angriffe),
    actions: mitKennung(schluessel, 'akt', aktionen),
    inventory: mitKennung(schluessel, 'inv', ausruestung),
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0, ...muenzen },
    features: mitKennung(schluessel, 'mrk', merkmale),
    spellcasting: {
      ability: zauber?.attribut ?? 'int',
      manualSaveDC: null,
      manualAttackBonus: null,
      slots: {
        ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((grad) => [grad, { max: 0, used: 0 }])),
        ...(zauber?.plaetze ?? {}),
      },
      spells: mitKennung(schluessel, 'zbr', zauber?.liste),
    },
    proficiencies: { armor: '', weapons: '', tools: '', languages: '', ...uebungen },
    appearance: {
      gender: '',
      age: '',
      size: '',
      height: '',
      weight: '',
      faith: '',
      skin: '',
      eyes: '',
      hair: '',
      ...aussehen,
    },
    traits: {
      personality: '',
      ideals: '',
      bonds: '',
      flaws: '',
      backstory: '',
      notes: '',
      look: '',
      allies: '',
      ...wesen,
    },
  };
}
