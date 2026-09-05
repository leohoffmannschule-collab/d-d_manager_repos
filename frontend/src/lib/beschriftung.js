/**
 * Hier – und nur hier – werden die Schlüssel des Servers zu Worten.
 *
 * Der Server schickt unveränderliche Kennungen: `schwer_verwundet`,
 * `einladung_verbraucht`, `handzettel`. Wie das am Bildschirm heißt, ist
 * Sache der Oberfläche. Wer den Almanach neu gestaltet, übersetzt oder in
 * eine andere Anwendung überführt, tauscht diese Datei aus und muss dafür
 * keine einzige Zeile im Server anfassen.
 */

/** Zustand eines Kämpfers, wie ihn die Runde zu sehen bekommt. */
export const ZUSTAND = {
  unversehrt: 'unversehrt',
  leicht_verletzt: 'leicht verletzt',
  verwundet: 'verwundet',
  schwer_verwundet: 'schwer verwundet',
  kampfunfaehig: 'kampfunfähig',
};

/** Art eines Chronikeintrags. */
export const CHRONIK_ART = {
  wurf: 'Wurf',
  schaden: 'Schaden',
  heilung: 'Heilung',
  tod: 'Niedergestreckt',
  zustand: 'Zustand',
  runde: 'Kampfrunde',
  kampf: 'Kampf',
  auftritt: 'Auftritt',
  szene: 'Szene',
  klang: 'Klang',
  handzettel: 'Handzettel',
  rast: 'Rast',
  notiz: 'Anmerkung',
  stufe: 'Stufenaufstieg',
};

/** Rollen im Almanach. */
export const ROLLE = {
  sl: 'Spielleitung',
  spieler: 'Runde',
};

/**
 * Fehlerschlüssel des Servers.
 *
 * Der Server liefert zu jedem Fehler auch einen fertigen Satz mit. Hier stehen
 * nur die Fälle, in denen die Oberfläche etwas anderes sagen möchte – etwa
 * freundlicher, kürzer oder mit einem Hinweis, was nun zu tun ist.
 */
export const FEHLER = {
  nicht_angemeldet: 'Die Sitzung ist abgelaufen. Bitte melde dich noch einmal an.',
  nur_spielleitung: 'Das ist der Spielleitung vorbehalten.',
  zu_viele_versuche: 'Zu viele Versuche. Bitte in zehn Minuten noch einmal.',
  kompendium_nicht_erreichbar: 'Das Kompendium ist gerade nicht erreichbar.',
  ki_nicht_eingerichtet: 'Es ist kein Sprachmodell eingestellt – das Protokoll gibt es auch ohne.',
};

/**
 * Feldnamen des SRD-Kompendiums (dnd5eapi.co). Das sind reine
 * Strukturbezeichner der Schnittstelle – "casting_time", "armor_class" – kein
 * Fließtext aus dem Regelwerk selbst. Der eigentliche Zauber- oder
 * Monstertext bleibt unangetastet, wie er aus der Quelle kommt; nur die
 * Beschriftung der Felder drumherum ist hier auf Deutsch.
 */
export const SRD_FELD = {
  // Zauber
  level: 'Grad',
  school: 'Schule',
  casting_time: 'Wirkzeit',
  range: 'Reichweite',
  components: 'Komponenten',
  material: 'Material',
  ritual: 'Ritual',
  duration: 'Wirkungsdauer',
  concentration: 'Konzentration',
  attack_type: 'Angriffsart',
  damage: 'Schaden',
  damage_type: 'Schadensart',
  damage_dice: 'Schadenswürfel',
  damage_at_slot_level: 'Schaden je Zaubergrad',
  damage_at_character_level: 'Schaden je Stufe',
  classes: 'Klassen',
  subclasses: 'Unterklassen',
  area_of_effect: 'Wirkungsbereich',
  dc: 'Rettungswurf',
  dc_type: 'Rettungswurf-Attribut',
  dc_success: 'Bei Erfolg',
  heal_at_slot_level: 'Heilung je Zaubergrad',

  // Monster
  size: 'Größe',
  type: 'Art',
  subtype: 'Unterart',
  alignment: 'Gesinnung',
  armor_class: 'Rüstungsklasse',
  hit_points: 'Trefferpunkte',
  hit_dice: 'Trefferwürfel',
  hit_points_roll: 'Trefferpunkte-Wurf',
  speed: 'Geschwindigkeit',
  walk: 'Gehen',
  fly: 'Fliegen',
  swim: 'Schwimmen',
  climb: 'Klettern',
  burrow: 'Graben',
  hover: 'Schwebend',
  strength: 'Stärke',
  dexterity: 'Geschicklichkeit',
  constitution: 'Konstitution',
  intelligence: 'Intelligenz',
  wisdom: 'Weisheit',
  charisma: 'Charisma',
  proficiencies: 'Fertigkeiten',
  proficiency: 'Fertigkeit',
  value: 'Wert',
  damage_vulnerabilities: 'Schadensanfälligkeiten',
  damage_resistances: 'Schadensresistenzen',
  damage_immunities: 'Schadensimmunitäten',
  condition_immunities: 'Zustandsimmunitäten',
  senses: 'Sinne',
  darkvision: 'Dunkelsicht',
  passive_perception: 'Passive Wahrnehmung',
  blindsight: 'Blindsicht',
  tremorsense: 'Erschütterungssinn',
  truesight: 'Wahre Sicht',
  languages: 'Sprachen',
  challenge_rating: 'Herausforderungsgrad',
  proficiency_bonus: 'Übungsbonus',
  xp: 'Erfahrungspunkte',
  special_abilities: 'Besondere Fähigkeiten',
  actions: 'Aktionen',
  legendary_actions: 'Legendäre Aktionen',
  reactions: 'Reaktionen',

  // Ausrüstung & magische Gegenstände
  equipment_category: 'Art',
  weapon_category: 'Waffenkategorie',
  weapon_range: 'Waffenreichweite',
  category_range: 'Kategoriebereich',
  cost: 'Kosten',
  quantity: 'Menge',
  unit: 'Einheit',
  weight: 'Gewicht',
  properties: 'Eigenschaften',
  throw_range: 'Wurfweite',
  normal: 'Normal',
  long: 'Weit',
  two_handed_damage: 'Zweihändiger Schaden',
  armor_category: 'Rüstungskategorie',
  base: 'Basis',
  dex_bonus: 'Geschicklichkeitsbonus',
  max_bonus: 'Maximalbonus',
  str_minimum: 'Mindeststärke',
  stealth_disadvantage: 'Nachteil bei Heimlichkeit',
  gear_category: 'Ausrüstungskategorie',
  special: 'Besonderheiten',
  capacity: 'Fassungsvermögen',
  vehicle_category: 'Fahrzeugkategorie',
  rarity: 'Seltenheit',
  variants: 'Varianten',
  variant: 'Variante',

  // Klassen & Unterklassen
  hit_die: 'Trefferwürfel',
  proficiency_choices: 'Fertigkeitsauswahl',
  saving_throws: 'Rettungswürfe',
  starting_equipment: 'Startausrüstung',
  starting_equipment_options: 'Startausrüstungsoptionen',
  multi_classing: 'Mehrklassen',
  spellcasting: 'Zauberwirken',

  // Völker
  ability_bonuses: 'Attributsboni',
  ability_score: 'Attribut',
  bonus: 'Bonus',
  age: 'Alter',
  size_description: 'Größenbeschreibung',
  starting_proficiencies: 'Start-Fertigkeiten',
  starting_proficiency_options: 'Fertigkeitsoptionen zum Start',
  language_desc: 'Sprachbeschreibung',
  language_options: 'Sprachoptionen',
  traits: 'Eigenschaften',
  subraces: 'Untervölker',

  // Hintergründe
  feature: 'Besonderheit',
  personality_traits: 'Persönlichkeitsmerkmale',
  ideals: 'Ideale',
  bonds: 'Bindungen',
  flaws: 'Makel',
  choose: 'Anzahl',
  from: 'Auswahl',
  options: 'Optionen',

  // Talente
  prerequisites: 'Voraussetzungen',
};

/** Beschriftung zu einem Schlüssel, mit dem Schlüssel als Rückfallebene. */
export function benenne(karte, schluessel, ersatz = null) {
  if (!schluessel) return ersatz;
  return karte[schluessel] ?? ersatz ?? schluessel;
}

/** Fehlertext: bevorzugt die eigene Fassung, sonst die des Servers. */
export function fehlertext(fehler) {
  return FEHLER[fehler?.code] ?? fehler?.message ?? 'Unbekannter Fehler.';
}
