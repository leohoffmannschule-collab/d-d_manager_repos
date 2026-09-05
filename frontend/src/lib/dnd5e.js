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
  { key: 'animalHandling', label: 'Tierumgang', ability: 'wis' },
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

/** Tragkraft nach den Grundregeln: Stärke mal 15 Pfund. */
export function carryingCapacity(strength) {
  return (Number(strength) || 0) * 15;
}

/** Zaubererschwerungsgrad und Zauberangriffsbonus. */
export function spellSaveDC(abilityScore, level) {
  return 8 + proficiencyBonus(level) + abilityModifier(abilityScore);
}

export function spellAttackBonus(abilityScore, level) {
  return proficiencyBonus(level) + abilityModifier(abilityScore);
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

export function defaultCharacterData() {
  const abilities = Object.fromEntries(ABILITIES.map((a) => [a.key, 10]));
  const savingThrows = Object.fromEntries(ABILITIES.map((a) => [a.key, false]));
  const skills = Object.fromEntries(SKILLS.map((s) => [s.key, { proficient: false, expertise: false }]));
  const slots = Object.fromEntries(SPELL_LEVELS.map((lvl) => [lvl, { max: 0, used: 0 }]));

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
    abilities,
    savingThrows,
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
      senses: { darkvision: 0, blindsight: 0, tremorsense: 0, truesight: 0, notes: '' },
    },
    inspiration: false,
    // Wut, Ki, Zauberkraft, Bardische Inspiration … – statt für jede Klasse
    // ein eigenes Feld zu bauen, trägt man sich hier ein, was man zählen muss.
    resources: [],
    attunement: ['', '', ''],
    attacks: [],
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
    traits: { personality: '', ideals: '', bonds: '', flaws: '', backstory: '', notes: '' },
  };
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
    traits: { ...vorgabe.traits, ...(data.traits ?? {}) },
    spellcasting: {
      ...vorgabe.spellcasting,
      ...(data.spellcasting ?? {}),
      slots: { ...vorgabe.spellcasting.slots, ...(data.spellcasting?.slots ?? {}) },
      spells: data.spellcasting?.spells ?? [],
    },
    combat,
    resources: Array.isArray(data.resources) ? data.resources : [],
    attunement: Array.isArray(data.attunement) ? data.attunement : ['', '', ''],
    inspiration: !!data.inspiration,
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
