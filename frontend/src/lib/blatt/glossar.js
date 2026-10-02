/**
 * Das Feldverzeichnis des Blattes: welcher Wert wo im Datensatz steht, wie
 * er auf Deutsch heißt und von welcher Art er ist.
 *
 * Gebraucht an drei Stellen – und deshalb an einer einzigen gepflegt:
 *
 *   – Die Ausfuhr markiert die sichtbaren Werte damit (`data-feld`) und
 *     schreibt daraus die Anleitung für eine KI in die Datei
 *     (blatt/datensatz.js).
 *   – Das Einlesen weiß damit, wie es einen sichtbar geänderten Wert wieder
 *     in den Datensatz zurückliest (einfuhr/sichtbar.js) und welche Form
 *     jeder Wert haben muss (einfuhr/angleichen.js).
 *   – Die Vorschau beim Einlesen benennt Unterschiede damit
 *     (einfuhr/unterschiede.js).
 *
 * Die Arten:
 *   text     beliebiger Text, Zeilenumbrüche erlaubt
 *   zahl     eine Zahl
 *   weite    eine Entfernung – gespeichert in Fuß, angezeigt nach dem
 *            Maßsystem des Blattes („9 m“ oder „30 Fuß“)
 *   gewicht  ein Gewicht – gespeichert in Pfund, angezeigt nach Maßsystem
 *   ja       wahr oder falsch
 *   wahl     einer von wenigen festen Schlüsseln (`optionen`)
 *
 * Ein Listeneintrag wird über seine Kennung angesprochen, nicht über seine
 * Stelle: `attacks.#<id>.name`. So trifft eine Änderung den richtigen
 * Eintrag, auch wenn eine KI die Reihenfolge umgestellt hat.
 */
import { ABILITIES, SPELL_LEVELS } from '../regeln/listen.js';
import { AKTION_ARTEN, AUSSEHEN_FELDER, MERKMAL_ARTEN } from '../regeln/blattfelder.js';
import { gewichtAnzeigen, weiteMitEinheit } from '../regeln/masse.js';

/** Ein Eintrag des Verzeichnisses. */
const f = (pfad, label, art = 'text', mehr = {}) => ({ pfad, label, art, ...mehr });

/** Die Felder eines 5e-Blattes, die einzeln dastehen (Listen stehen in LISTEN_5E). */
export const FELDER_5E = [
  f('race', 'Spezies'),
  f('subrace', 'Unterart'),
  f('className', 'Klasse'),
  f('subclass', 'Unterklasse'),
  f('level', 'Stufe', 'zahl', { von: 1, bis: 20 }),
  f('background', 'Hintergrund'),
  f('alignment', 'Gesinnung'),
  f('playerName', 'Gespielt von'),
  f('experience', 'Erfahrungspunkte', 'zahl', { von: 0 }),
  ...ABILITIES.map((a) => f(`abilities.${a.key}`, a.label, 'zahl', { von: 1, bis: 30 })),
  f('combat.armorClass', 'Rüstungsklasse', 'zahl', { von: 0 }),
  f('combat.initiativeBonus', 'Zusätzlicher Initiativebonus (zur Geschicklichkeit hinzu)', 'zahl'),
  f('combat.speed', 'Bewegung', 'weite'),
  f('combat.hp.max', 'Trefferpunkte (Höchstwert)', 'zahl', { von: 0 }),
  f('combat.hp.current', 'Trefferpunkte (aktuell)', 'zahl', { von: 0 }),
  f('combat.hp.temp', 'Temporäre Trefferpunkte', 'zahl', { von: 0 }),
  f('combat.hitDicePool.size', 'Trefferwürfel (Seitenzahl: 8 heißt W8)', 'zahl', { von: 4, bis: 12 }),
  f('combat.hitDicePool.total', 'Trefferwürfel (gesamt)', 'zahl', { von: 0 }),
  f('combat.hitDicePool.used', 'Trefferwürfel (verbraucht)', 'zahl', { von: 0 }),
  f('combat.exhaustion', 'Erschöpfungsstufe', 'zahl', { von: 0, bis: 6 }),
  f('combat.concentration.spell', 'Konzentration auf'),
  f('combat.defenses.resistances', 'Resistenzen'),
  f('combat.defenses.immunities', 'Immunitäten'),
  f('combat.defenses.vulnerabilities', 'Verwundbarkeiten'),
  f('combat.senses.sight', 'Sichtweite (0 = unbegrenzt)', 'weite'),
  f('combat.senses.darkvision', 'Dunkelsicht', 'weite'),
  f('combat.senses.blindsight', 'Blindsicht', 'weite'),
  f('combat.senses.tremorsense', 'Erschütterungssinn', 'weite'),
  f('combat.senses.truesight', 'Wahrer Blick', 'weite'),
  f('combat.senses.notes', 'Weitere Sinne'),
  f('savingThrowNote', 'Vermerk zu Rettungswürfen'),
  f('currency.pp', 'Platinmünzen', 'zahl', { von: 0 }),
  f('currency.gp', 'Goldmünzen', 'zahl', { von: 0 }),
  f('currency.ep', 'Elektrummünzen', 'zahl', { von: 0 }),
  f('currency.sp', 'Silbermünzen', 'zahl', { von: 0 }),
  f('currency.cp', 'Kupfermünzen', 'zahl', { von: 0 }),
  ...SPELL_LEVELS.map((grad) => f(`spellcasting.slots.${grad}.max`, `Zauberplätze ${grad}. Grad`, 'zahl', { von: 0 })),
  ...[0, 1, 2].map((i) => f(`attunement.${i}`, `Angelegter magischer Gegenstand ${i + 1}`)),
  f('proficiencies.armor', 'Geübt mit Rüstungen'),
  f('proficiencies.weapons', 'Geübt mit Waffen'),
  f('proficiencies.tools', 'Geübt mit Werkzeugen'),
  f('proficiencies.languages', 'Sprachen'),
  ...AUSSEHEN_FELDER.map((a) => f(`appearance.${a.key}`, a.label)),
  f('traits.look', 'Erscheinungsbild'),
  f('traits.allies', 'Verbündete & Organisationen'),
  f('traits.personality', 'Persönlichkeit'),
  f('traits.ideals', 'Ideale'),
  f('traits.bonds', 'Bindungen'),
  f('traits.flaws', 'Makel'),
  f('traits.backstory', 'Hintergrundgeschichte (Chronik)'),
  f('traits.notes', 'Lose Notizen'),
];

/** Die Listen eines 5e-Blattes: wo sie stehen, wie ein Eintrag heißt, welche Felder er hat. */
export const LISTEN_5E = {
  attacks: {
    label: 'Angriffe',
    einzahl: 'Angriff',
    felder: {
      name: f('name', 'Name'),
      bonus: f('bonus', 'Bonus (als Text, etwa „+5“)'),
      damage: f('damage', 'Schaden (etwa „1W8+3 Hieb“)'),
      notes: f('notes', 'Anmerkungen'),
    },
  },
  actions: {
    label: 'Eigene Aktionen',
    einzahl: 'Aktion',
    felder: {
      name: f('name', 'Name'),
      art: f('art', 'Kostet', 'wahl', { optionen: AKTION_ARTEN }),
      description: f('description', 'Wirkung'),
    },
  },
  resources: {
    label: 'Ressourcen',
    einzahl: 'Ressource',
    felder: {
      name: f('name', 'Name'),
      current: f('current', 'Übrig', 'zahl', { von: 0 }),
      max: f('max', 'Höchstens', 'zahl', { von: 0 }),
      recharge: f('recharge', 'Erneuert sich', 'wahl', {
        optionen: [
          ['lang', 'lange Rast'],
          ['kurz', 'kurze Rast'],
          ['keine', 'von Hand'],
        ],
      }),
    },
  },
  inventory: {
    label: 'Ausrüstung',
    einzahl: 'Gegenstand',
    felder: {
      name: f('name', 'Name'),
      qty: f('qty', 'Anzahl', 'zahl', { von: 0, vorgabe: 1 }),
      weight: f('weight', 'Gewicht je Stück', 'gewicht'),
      notes: f('notes', 'Anmerkungen'),
    },
  },
  'spellcasting.spells': {
    label: 'Zauber',
    einzahl: 'Zauber',
    felder: {
      name: f('name', 'Name'),
      level: f('level', 'Grad (0 = Zaubertrick)', 'zahl', { von: 0, bis: 9 }),
      prepared: f('prepared', 'Vorbereitet', 'ja'),
      source: f('source', 'Quelle'),
      save: f('save', 'Rettungswurf / Angriff'),
      time: f('time', 'Zeitaufwand'),
      range: f('range', 'Reichweite'),
      components: f('components', 'Komponenten'),
      duration: f('duration', 'Wirkungsdauer'),
      page: f('page', 'Seite'),
      notes: f('notes', 'Notizen'),
    },
  },
  features: {
    label: 'Merkmale',
    einzahl: 'Merkmal',
    felder: {
      name: f('name', 'Name'),
      category: f('category', 'Herkunft', 'wahl', { optionen: MERKMAL_ARTEN, vorgabe: 'sonstiges' }),
      source: f('source', 'Quelle'),
      page: f('page', 'Seite'),
      description: f('description', 'Beschreibung'),
    },
  },
};

/** Die Felder eines freien Blattes. */
export const FELDER_FREI = [f('summary', 'Zusammenfassung')];

/** Die eine Liste eines freien Blattes: seine Abschnitte. */
export const LISTEN_FREI = {
  sections: {
    label: 'Abschnitte',
    einzahl: 'Abschnitt',
    felder: { title: f('title', 'Überschrift'), content: f('content', 'Inhalt') },
  },
};

/** Verzeichnis und Listen zu einem Regelwerk. */
export const verzeichnis = (system) =>
  system === 'freeform' ? { felder: FELDER_FREI, listen: LISTEN_FREI } : { felder: FELDER_5E, listen: LISTEN_5E };

/** Ein leerer Listeneintrag mit den Vorgaben seiner Felder (ohne Kennung). */
export function leererEintrag(liste) {
  return Object.fromEntries(
    Object.entries(liste.felder).map(([key, feld]) => [
      key,
      feld.vorgabe ?? (feld.art === 'zahl' || feld.art === 'gewicht' ? 0 : feld.art === 'ja' ? false : feld.art === 'wahl' ? feld.optionen[0][0] : ''),
    ])
  );
}

/**
 * Was zu einem Pfad gehört: der Eintrag des Verzeichnisses, und bei einem
 * Listenfeld auch die Liste und die Kennung des Eintrags. `name` – der Name
 * des Blattes selbst – steht außerhalb von `data` und wird eigens genannt.
 *
 * @returns {{ feld: object, liste?: object, listenPfad?: string, id?: string }|null}
 */
export function feldZu(system, pfad) {
  if (pfad === 'name') return { feld: f('name', 'Name') };
  const { felder, listen } = verzeichnis(system);
  const einzeln = felder.find((x) => x.pfad === pfad);
  if (einzeln) return { feld: einzeln };
  const m = /^(.+)\.#([^.]+)\.([^.]+)$/.exec(pfad);
  if (m && listen[m[1]]?.felder[m[3]]) return { feld: listen[m[1]].felder[m[3]], liste: listen[m[1]], listenPfad: m[1], id: m[2] };
  return null;
}

/**
 * Ein Wert so, wie er auf dem ausgeführten Blatt steht – als Text. Dieselbe
 * Form schreibt die Ausfuhr in `data-war`, und das Einlesen vergleicht
 * damit; beide müssen also exakt gleich rechnen.
 */
export function anzeige(art, wert, units) {
  if (art === 'weite') return weiteMitEinheit(wert, units);
  if (art === 'gewicht') return wert ? String(gewichtAnzeigen(wert, units)) : '';
  if (wert === null || wert === undefined) return '';
  return String(wert);
}
