/**
 * Die Listen aus dem Regelwerk: Attribute, Fertigkeiten, Zustände,
 * Erschöpfung, Zaubergrade.
 *
 * Reine Aufzählungen, keine Rechnung. Sie liegen an einem Ort, damit
 * „Wahrnehmung“ im ganzen Almanach gleich heißt und überall in derselben
 * Reihenfolge steht – auf dem Blatt, in der Kampfliste, im ausgeführten
 * HTML und im Ausdruck.
 *
 * Wer eine Fertigkeit ergänzt, ergänzt sie hier, und sie erscheint überall.
 */

/** Die sechs Attribute mit ihrem Schlüssel im Blatt und ihrem Namen. */
export const ABILITIES = [
  { key: 'str', label: 'Stärke' },
  { key: 'dex', label: 'Geschicklichkeit' },
  { key: 'con', label: 'Konstitution' },
  { key: 'int', label: 'Intelligenz' },
  { key: 'wis', label: 'Weisheit' },
  { key: 'cha', label: 'Charisma' },
];

/**
 * Die achtzehn Fertigkeiten. `ability` sagt, welches Attribut sie speist –
 * daraus rechnet `skillModifier` weiter unten den Wurfbonus.
 */
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

// Zaubergrade 1 bis 9. Zaubertricks (Grad 0) stehen bewusst nicht drin:
// Sie brauchen keinen Zauberplatz und tauchen deshalb in Slot-Listen nie auf.
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
