/**
 * Wie ein frisches Blatt aussieht – und wie ein altes auf den neuen Stand
 * kommt.
 *
 * Zwei Seiten derselben Sache, und die zweite ist die wichtigere:
 *
 *   `defaultCharacterData()` liefert ein vollständiges, leeres Blatt.
 *
 *   `withDefaults(data)` ergänzt an einem *vorhandenen* Blatt alles, was
 *   seither dazugekommen ist. Der Server speichert das Blatt als einen
 *   JSON-Klumpen und weiß nicht, was darin steht – also gibt es dort keine
 *   Wanderung wie in der Datenbank. Sie passiert hier, beim Laden.
 *
 * Daraus folgt die Regel für jedes neue Feld auf dem Blatt: Es gehört in
 * **beide** Funktionen. Steht es nur in der ersten, stürzt die Oberfläche
 * über jedem Blatt ab, das älter ist als das Feld.
 */
import { newId } from '../id.js';
import { ABILITIES, SKILLS, SPELL_LEVELS } from './listen.js';
import { AUSSEHEN_FELDER } from './blattfelder.js';

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
