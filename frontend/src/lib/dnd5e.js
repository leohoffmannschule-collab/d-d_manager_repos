import { newId } from './id.js';

export const ABILITIES = [
  { key: 'str', label: 'Stärke' },
  { key: 'dex', label: 'Geschicklichkeit' },
  { key: 'con', label: 'Konstitution' },
  { key: 'int', label: 'Intelligenz' },
  { key: 'wis', label: 'Weisheit' },
  { key: 'cha', label: 'Charisma' },
];

export const SKILLS = [
  { key: 'acrobatics', label: 'Akrobatik', ability: 'dex' },
  { key: 'animalHandling', label: 'Tierhandhabung', ability: 'wis' },
  { key: 'arcana', label: 'Arkane Kunde', ability: 'int' },
  { key: 'athletics', label: 'Athletik', ability: 'str' },
  { key: 'deception', label: 'Täuschen', ability: 'cha' },
  { key: 'history', label: 'Geschichte', ability: 'int' },
  { key: 'insight', label: 'Motiv erkennen', ability: 'wis' },
  { key: 'intimidation', label: 'Einschüchtern', ability: 'cha' },
  { key: 'investigation', label: 'Nachforschung', ability: 'int' },
  { key: 'medicine', label: 'Heilkunde', ability: 'wis' },
  { key: 'nature', label: 'Naturkunde', ability: 'int' },
  { key: 'perception', label: 'Wahrnehmung', ability: 'wis' },
  { key: 'performance', label: 'Auftreten', ability: 'cha' },
  { key: 'persuasion', label: 'Überzeugen', ability: 'cha' },
  { key: 'religion', label: 'Religion', ability: 'int' },
  { key: 'sleightOfHand', label: 'Fingerfertigkeit', ability: 'dex' },
  { key: 'stealth', label: 'Heimlichkeit', ability: 'dex' },
  { key: 'survival', label: 'Überlebenskunst', ability: 'wis' },
];

export const SPELL_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Drei Fertigkeiten stehen auch passiv auf dem Blatt: Sie gelten, ohne dass
 * jemand würfelt. Die Spielleitung schlägt sie nach, wenn sie nicht verraten
 * will, dass überhaupt etwas zu bemerken war.
 */
export const PASSIVE_FERTIGKEITEN = [
  { key: 'perception', label: 'Passive Wahrnehmung' },
  { key: 'insight', label: 'Passive Motiverkennung' },
  { key: 'investigation', label: 'Passive Nachforschung' },
];

/** Die Zustände aus dem Regelwerk, in der Sprache des Almanachs. */
export const CONDITIONS = [
  'Bezaubert',
  'Betäubt',
  'Blind',
  'Bewusstlos',
  'Festgesetzt',
  'Gelähmt',
  'Gepackt',
  'Handlungsunfähig',
  'Liegend',
  'Taub',
  'Verängstigt',
  'Vergiftet',
  'Versteinert',
  'Unsichtbar',
];

/**
 * Erschöpfung wirkt in sechs Stufen, und jede baut auf der vorigen auf.
 * Die kurzen Texte stehen im Blatt, damit niemand nachschlagen muss.
 */
export const EXHAUSTION_STEPS = [
  'keine Erschöpfung',
  'Nachteil auf Attributswürfe',
  'Bewegungsrate halbiert',
  'Nachteil auf Angriffe und Rettungswürfe',
  'Trefferpunktemaximum halbiert',
  'Bewegungsrate auf 0',
  'Tod',
];

/* --- Maße ---------------------------------------------------------------- */

/**
 * Fuß oder Meter, Pfund oder Kilogramm.
 *
 * Gespeichert wird immer in Fuß und Pfund – daran hängt der Nebel am
 * Spieltisch, der ausrechnet, wie weit eine Figur im Dunkeln sieht. Was hier
 * steht, ist nur die Brille: Wer metrisch spielt, tippt Meter ein und liest
 * Meter ab, im Blatt steht trotzdem, was der Server versteht.
 */
export const MASSSYSTEME = [
  ['metrisch', 'Meter und Kilogramm'],
  ['imperial', 'Fuß und Pfund'],
];

/**
 * Am Tisch misst ein Feld fünf Fuß *oder* anderthalb Meter – das Regelwerk
 * rechnet nicht um, es setzt gleich. Deshalb wird auch hier gesetzt und nicht
 * umgerechnet: drei Zehntel Meter je Fuß. So werden aus 30 Fuß glatte 9 m und
 * aus 60 Fuß Dunkelsicht glatte 18 m, wie es im Regelwerk steht.
 */
export const METER_JE_FUSS = 0.3;

/** Gewichte dagegen sind echte Maße und werden ehrlich umgerechnet. */
export const KILO_JE_PFUND = 0.45359237;

const gerundet = (zahl) => Math.round(zahl * 10) / 10;

/**
 * Gespeichert wird eine Stelle genauer, als angezeigt wird. Sonst wandert
 * ein Gewicht bei jedem Umrechnen ein Stück: Wer 11,3 kg einträgt, soll beim
 * nächsten Öffnen wieder 11,3 kg lesen und nicht 11,2.
 */
const genauer = (zahl) => Math.round(zahl * 100) / 100;

export const istMetrisch = (units) => units !== 'imperial';

export const weiteEinheit = (units) => (istMetrisch(units) ? 'm' : 'Fuß');
export const gewichtEinheit = (units) => (istMetrisch(units) ? 'kg' : 'Pfund');

/** Eine Weite aus dem Blatt (immer in Fuß) so, wie sie angezeigt wird. */
export function weiteAnzeigen(fuss, units) {
  const wert = Number(fuss) || 0;
  return istMetrisch(units) ? gerundet(wert * METER_JE_FUSS) : wert;
}

/** Und zurück: Was jemand eingetippt hat, wieder in Fuß. */
export function weiteNachFuss(wert, units) {
  const zahl = Number(wert) || 0;
  return istMetrisch(units) ? Math.round(zahl / METER_JE_FUSS) : zahl;
}

export function gewichtAnzeigen(pfund, units) {
  const wert = Number(pfund) || 0;
  return istMetrisch(units) ? gerundet(wert * KILO_JE_PFUND) : gerundet(wert);
}

export function gewichtNachPfund(wert, units) {
  const zahl = Number(wert) || 0;
  return istMetrisch(units) ? genauer(zahl / KILO_JE_PFUND) : zahl;
}

/** Weite samt Einheit, fertig zum Hinschreiben: „9 m“, „60 Fuß“. */
export const weiteMitEinheit = (fuss, units) => `${weiteAnzeigen(fuss, units)} ${weiteEinheit(units)}`;
export const gewichtMitEinheit = (pfund, units) => `${gewichtAnzeigen(pfund, units)} ${gewichtEinheit(units)}`;

/* --- Aktionen ------------------------------------------------------------ */

export const AKTION_ARTEN = [
  ['aktion', 'Aktion'],
  ['bonus', 'Bonusaktion'],
  ['reaktion', 'Reaktion'],
  ['frei', 'Freie Handlung'],
];

export const aktionArtLabel = (art) => AKTION_ARTEN.find(([wert]) => wert === art)?.[1] ?? 'Aktion';

/**
 * Was am Tisch immer geht – die Handlungen aus dem Grundregelwerk.
 *
 * Das steht hier nicht, weil es jemand eintragen müsste, sondern damit es
 * niemand nachschlagen muss: Der Reiter zeigt die Liste an, und daneben
 * stehen die eigenen Fähigkeiten, die eine Aktion kosten.
 */
export const STANDARD_AKTIONEN = [
  { name: 'Angreifen', art: 'aktion', text: 'Ein Angriff mit einer Waffe oder ein unbewaffneter Schlag.' },
  { name: 'Zaubern', art: 'aktion', text: 'Einen Zauber wirken, dessen Wirkzeit eine Aktion beträgt.' },
  { name: 'Spurt', art: 'aktion', text: 'Zusätzliche Bewegung in Höhe deiner Bewegungsrate.' },
  { name: 'Rückzug', art: 'aktion', text: 'Deine Bewegung löst in diesem Zug keine Gelegenheitsangriffe aus.' },
  {
    name: 'Ausweichen',
    art: 'aktion',
    text: 'Angriffe gegen dich haben Nachteil, deine Geschicklichkeits-Rettungswürfe Vorteil.',
  },
  { name: 'Helfen', art: 'aktion', text: 'Einem Verbündeten Vorteil verschaffen – oder ihn stabilisieren.' },
  { name: 'Verstecken', art: 'aktion', text: 'Heimlichkeitsprobe gegen SG 15; bei Erfolg giltst du als unsichtbar.' },
  { name: 'Bereit machen', art: 'aktion', text: 'Eine Aktion an eine Bedingung knüpfen und als Reaktion auslösen.' },
  {
    name: 'Suchen',
    art: 'aktion',
    text: 'Wahrnehmung, Nachforschung, Motiv erkennen oder Überlebenskunst einsetzen.',
  },
  { name: 'Nutzen', art: 'aktion', text: 'Einen Gegenstand oder eine besondere Fähigkeit benutzen.' },
  { name: 'Ringen', art: 'aktion', text: 'Athletik gegen Athletik oder Akrobatik – das Ziel wird Gepackt.' },
  {
    name: 'Stoßen',
    art: 'aktion',
    text: 'Athletik gegen Athletik oder Akrobatik – das Ziel wird 1,5 m geschoben oder Liegend.',
  },
  { name: 'Studieren', art: 'aktion', text: 'Arkane Kunde, Geschichte, Naturkunde, Religion oder Nachforschung.' },
  {
    name: 'Beeinflussen',
    art: 'aktion',
    text: 'Täuschen, Einschüchtern, Auftreten, Überzeugen oder Tierhandhabung.',
  },
  { name: 'Improvisieren', art: 'aktion', text: 'Etwas versuchen, wofür keine Regel vorgesehen ist.' },
  {
    name: 'Kampf mit zwei Waffen',
    art: 'bonus',
    text: 'Angriff mit der leichten Waffe in der anderen Hand, nachdem du angegriffen hast.',
  },
  { name: 'Gelegenheitsangriff', art: 'reaktion', text: 'Wenn ein Feind deine Reichweite zu Fuß verlässt.' },
  {
    name: 'Mit einem Objekt interagieren',
    art: 'frei',
    text: 'Einmal je Zug nebenbei: ziehen, öffnen, aufheben, ablegen.',
  },
];

/* --- Merkmale ------------------------------------------------------------ */

/**
 * Woher ein Merkmal stammt. Auf dem gedruckten Blatt stehen die Merkmale
 * nach Herkunft sortiert – erst was die Klasse gibt, dann die Spezies, dann
 * Talente. Wer nachschlägt, sucht genau so.
 */
export const MERKMAL_ARTEN = [
  ['klasse', 'Klasse'],
  ['spezies', 'Spezies'],
  ['talent', 'Talent'],
  ['hintergrund', 'Hintergrund'],
  ['sonstiges', 'Sonstiges'],
];

export const merkmalArtLabel = (art) => MERKMAL_ARTEN.find(([wert]) => wert === art)?.[1] ?? 'Sonstiges';

/* --- Aussehen und Person ------------------------------------------------- */

/**
 * Die Felder der Seite „Aussehen & Persönlichkeit“. Sie entscheiden nichts
 * über Regeln, aber ohne sie ist ein Charakter nur eine Wertetabelle.
 */
export const AUSSEHEN_FELDER = [
  { key: 'gender', label: 'Geschlecht' },
  { key: 'age', label: 'Alter' },
  { key: 'size', label: 'Statur' },
  { key: 'height', label: 'Körpergröße' },
  { key: 'weight', label: 'Gewicht' },
  { key: 'faith', label: 'Glaube' },
  { key: 'skin', label: 'Haut' },
  { key: 'eyes', label: 'Augen' },
  { key: 'hair', label: 'Haare' },
];

/* --- Erfahrung ----------------------------------------------------------- */

/** Erfahrungsschwellen der Stufen 1 bis 20. */
export const XP_THRESHOLDS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000,
  225000, 265000, 305000, 355000,
];

export function levelFromExperience(xp) {
  const wert = Number(xp) || 0;
  let stufe = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (wert >= XP_THRESHOLDS[i]) stufe = i + 1;
  }
  return stufe;
}

/** Was bis zur nächsten Stufe noch fehlt – oder null auf Stufe 20. */
export function experienceToNextLevel(xp) {
  const stufe = levelFromExperience(xp);
  if (stufe >= 20) return null;
  return XP_THRESHOLDS[stufe] - (Number(xp) || 0);
}

/* --- Gerechnetes --------------------------------------------------------- */

/** Tragkraft nach den Grundregeln: Stärke mal 15 Pfund. */
export function carryingCapacity(strength) {
  return (Number(strength) || 0) * 15;
}

/**
 * Die drei Marken, die auf dem gedruckten Blatt stehen – alles in Pfund.
 * `ueberladen` ist zugleich die Tragkraft: Wer mehr schleppt, kommt nicht
 * mehr voran. Heben, schieben und ziehen geht doppelt so schwer.
 */
export function traglastStufen(strength) {
  const tragkraft = carryingCapacity(strength);
  return { ueberladen: tragkraft, schieben: tragkraft * 2 };
}

/** Was ein Rucksack voller Gegenstände wiegt, in Pfund. */
export function getragenesGewicht(inventory) {
  return (inventory ?? []).reduce((summe, g) => summe + (Number(g.weight) || 0) * (Number(g.qty) || 1), 0);
}

export function abilityModifier(score) {
  const value = Number(score);
  if (Number.isNaN(value)) return 0;
  return Math.floor((value - 10) / 2);
}

export function formatModifier(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function proficiencyBonus(level) {
  const lvl = Number(level) || 1;
  return Math.floor((lvl - 1) / 4) + 2;
}

/** Der Wurfbonus einer Fertigkeit, Übung und Expertise eingerechnet. */
export function skillModifier(data, skillKey) {
  const fertigkeit = SKILLS.find((s) => s.key === skillKey);
  if (!fertigkeit) return 0;
  const stand = data.skills?.[skillKey] ?? { proficient: false, expertise: false };
  const pb = proficiencyBonus(data.level);
  const bonus = (stand.expertise ? 2 : stand.proficient ? 1 : 0) * pb;
  return abilityModifier(data.abilities?.[fertigkeit.ability]) + bonus;
}

/** Der passive Wert einer Fertigkeit: zehn plus ihr Bonus. */
export function passiverWert(data, skillKey) {
  return 10 + skillModifier(data, skillKey);
}

/** Der Rettungswurfbonus eines Attributs. */
export function saveModifier(data, abilityKey) {
  return (
    abilityModifier(data.abilities?.[abilityKey]) +
    (data.savingThrows?.[abilityKey] ? proficiencyBonus(data.level) : 0)
  );
}

/** Zaubererschwerungsgrad und Zauberangriffsbonus. */
export function spellSaveDC(abilityScore, level) {
  return 8 + proficiencyBonus(level) + abilityModifier(abilityScore);
}

export function spellAttackBonus(abilityScore, level) {
  return proficiencyBonus(level) + abilityModifier(abilityScore);
}

/* --- Das leere Blatt ----------------------------------------------------- */

export function defaultCharacterData() {
  const abilities = Object.fromEntries(ABILITIES.map((a) => [a.key, 10]));
  const savingThrows = Object.fromEntries(ABILITIES.map((a) => [a.key, false]));
  const skills = Object.fromEntries(SKILLS.map((s) => [s.key, { proficient: false, expertise: false }]));
  const slots = Object.fromEntries(SPELL_LEVELS.map((lvl) => [lvl, { max: 0, used: 0 }]));
  const appearance = Object.fromEntries(AUSSEHEN_FELDER.map((f) => [f.key, '']));

  return {
    portrait: '',
    race: '',
    subrace: '',
    className: '',
    subclass: '',
    level: 1,
    background: '',
    alignment: '',
    playerName: '',
    experience: 0,
    // Wer nach Meilensteinen spielt, zählt keine Punkte – dann steht auf dem
    // Blatt „Meilenstein“ statt einer Zahl, die niemand pflegt.
    experienceMode: 'punkte',
    // Neue Blätter sind metrisch: Der Almanach ist deutsch, und die Karten
    // am Spieltisch rechnen ohnehin in Metern.
    units: 'metrisch',
    abilities,
    savingThrows,
    // „Vorteil auf Rettungswürfe gegen Bezaubert“ und ähnliches – es gilt für
    // alle Würfe und passt in kein Kästchen.
    savingThrowNote: '',
    skills,
    combat: {
      armorClass: 10,
      initiativeBonus: 0,
      speed: 30,
      hp: { max: 10, current: 10, temp: 0 },
      hitDice: '1d8',
      hitDicePool: { size: 8, total: 1, used: 0 },
      deathSaves: { successes: 0, failures: 0 },
      conditions: [],
      exhaustion: 0,
      concentration: { active: false, spell: '' },
      defenses: { resistances: '', immunities: '', vulnerabilities: '' },
      senses: { sight: 0, darkvision: 0, blindsight: 0, tremorsense: 0, truesight: 0, notes: '' },
    },
    inspiration: false,
    // Wut, Ki, Zauberkraft, Bardische Inspiration … – statt für jede Klasse
    // ein eigenes Feld zu bauen, trägt man sich hier ein, was man zählen muss.
    resources: [],
    attunement: ['', '', ''],
    attacks: [],
    // Was eine Aktion, Bonusaktion oder Reaktion kostet: Handauflegen,
    // Zweiter Wind, Wildgestalt. Die Standardhandlungen stehen im Reiter
    // ohnehin und müssen hier nicht wiederholt werden.
    actions: [],
    inventory: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    features: [],
    spellcasting: {
      ability: 'int',
      manualSaveDC: null,
      manualAttackBonus: null,
      slots,
      spells: [],
    },
    proficiencies: { armor: '', weapons: '', tools: '', languages: '' },
    appearance,
    traits: { personality: '', ideals: '', bonds: '', flaws: '', backstory: '', notes: '', look: '', allies: '' },
  };
}

/**
 * Ein Merkmal, wie es aus der Liste kommt. Quelle und Seite stehen dabei,
 * damit man am Tisch nachschlagen kann, ohne zu suchen.
 */
export function leeresMerkmal() {
  return { id: newId(), name: '', category: 'klasse', source: '', page: '', description: '' };
}

export function leereAktion() {
  return { id: newId(), name: '', art: 'aktion', description: '' };
}

/**
 * Steht auf einem Blatt kein Maßsystem, kann das zweierlei heißen: Es wurde
 * vor der Umstellung geführt – dann stehen seine Weiten in Fuß und müssen
 * dort bleiben –, oder es ist frisch und noch leer. Unterscheiden lässt sich
 * das nur am Inhalt: Wer schon Attribute, Kampfwerte oder Ausrüstung hat,
 * wurde vorher geführt. Ein leeres Blatt bekommt dagegen die heutige Vorgabe.
 */
function stammtAusFussZeiten(data) {
  return ['abilities', 'combat', 'inventory', 'attacks', 'features', 'spellcasting', 'skills'].some(
    (feld) => data[feld] !== undefined
  );
}

/**
 * Ältere Blätter kennen die neu hinzugekommenen Felder noch nicht. Statt eine
 * Wanderung über die Datenbank zu schreiben, werden sie beim Öffnen ergänzt –
 * gespeichert wird das erst, wenn ohnehin etwas geändert wird.
 */
export function withDefaults(data) {
  if (!data || typeof data !== 'object') return defaultCharacterData();
  const vorgabe = defaultCharacterData();

  const combat = { ...vorgabe.combat, ...(data.combat ?? {}) };
  combat.hp = { ...vorgabe.combat.hp, ...(data.combat?.hp ?? {}) };
  combat.hitDicePool = { ...vorgabe.combat.hitDicePool, ...(data.combat?.hitDicePool ?? {}) };
  combat.deathSaves = { ...vorgabe.combat.deathSaves, ...(data.combat?.deathSaves ?? {}) };
  combat.concentration = { ...vorgabe.combat.concentration, ...(data.combat?.concentration ?? {}) };
  combat.defenses = { ...vorgabe.combat.defenses, ...(data.combat?.defenses ?? {}) };
  combat.senses = { ...vorgabe.combat.senses, ...(data.combat?.senses ?? {}) };
  combat.conditions = Array.isArray(data.combat?.conditions) ? data.combat.conditions : [];

  return {
    ...vorgabe,
    ...data,
    abilities: { ...vorgabe.abilities, ...(data.abilities ?? {}) },
    savingThrows: { ...vorgabe.savingThrows, ...(data.savingThrows ?? {}) },
    skills: { ...vorgabe.skills, ...(data.skills ?? {}) },
    currency: { ...vorgabe.currency, ...(data.currency ?? {}) },
    proficiencies: { ...vorgabe.proficiencies, ...(data.proficiencies ?? {}) },
    appearance: { ...vorgabe.appearance, ...(data.appearance ?? {}) },
    traits: { ...vorgabe.traits, ...(data.traits ?? {}) },
    spellcasting: {
      ...vorgabe.spellcasting,
      ...(data.spellcasting ?? {}),
      slots: { ...vorgabe.spellcasting.slots, ...(data.spellcasting?.slots ?? {}) },
      // Zauber aus früheren Fassungen kannten nur Name, Grad und Häkchen.
      spells: (data.spellcasting?.spells ?? []).map((s) => ({
        source: '',
        save: '',
        time: '',
        range: '',
        components: '',
        duration: '',
        page: '',
        notes: '',
        ...s,
      })),
    },
    combat,
    resources: Array.isArray(data.resources) ? data.resources : [],
    // Merkmale hatten früher keine Herkunft. Ohne Angabe stehen sie unter
    // „Sonstiges“ – das ist ehrlicher, als eine Klasse zu erfinden.
    features: (data.features ?? []).map((m) => ({ category: 'sonstiges', page: '', ...m })),
    actions: (data.actions ?? []).map((a) => ({ art: 'aktion', ...a })),
    attunement: Array.isArray(data.attunement) ? data.attunement : ['', '', ''],
    inspiration: !!data.inspiration,
    // Blätter aus der Zeit vor der Umstellung wurden in Fuß und Pfund
    // geführt. Sie behalten das, sonst ständen über Nacht andere Zahlen da.
    units: data.units ?? (stammtAusFussZeiten(data) ? 'imperial' : 'metrisch'),
    experienceMode: data.experienceMode ?? 'punkte',
    savingThrowNote: data.savingThrowNote ?? '',
    mini: data.mini ?? null,
  };
}

export function defaultFreeformData() {
  return {
    portrait: '',
    summary: '',
    sections: [
      { id: newId(), title: 'Werte', content: '' },
      { id: newId(), title: 'Ausrüstung', content: '' },
      { id: newId(), title: 'Hintergrund', content: '' },
      { id: newId(), title: 'Notizen', content: '' },
    ],
  };
}
