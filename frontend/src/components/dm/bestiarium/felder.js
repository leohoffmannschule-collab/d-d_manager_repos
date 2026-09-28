/**
 * Die Form eines Eintrags im Bestiarium – und die sechs Attribute in der
 * Reihenfolge, in der sie auf jedem Statblock stehen.
 *
 * Die Zahlenfelder sind leere Zeichenketten, nicht 0: Ein Monster ohne
 * eingetragene Rüstungsklasse ist etwas anderes als eines mit RK 0, und das
 * soll man dem Formular ansehen.
 */
export const LEER = {
  name: '',
  category: 'monster',
  ac: '',
  hp: '',
  speed: '',
  stats: { str: '', dex: '', con: '', int: '', wis: '', cha: '' },
  abilities: '',
  actions: '',
  notes: '',
  tags: [],
  mediaId: null,
};

export const ATTRIBUTE = [
  ['str', 'ST'],
  ['dex', 'GE'],
  ['con', 'KO'],
  ['int', 'IN'],
  ['wis', 'WE'],
  ['cha', 'CH'],
];
