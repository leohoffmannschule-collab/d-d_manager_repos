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
      deathSaves: { successes: 0, failures: 0 },
    },
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
