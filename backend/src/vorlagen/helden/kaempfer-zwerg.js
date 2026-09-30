/**
 * Vorlage: Brunhild Erzhammer – Kämpfer, Zwerg.
 *
 * Einer der zwölf fertigen Charaktere, die jede neue Kampagne hinter dem
 * Schirm vorfindet (siehe ../helden.js für die Auswahl und ../index.js fürs
 * Säen). Hier steht nur der Steckbrief – was diesen Charakter ausmacht.
 * Zum vollständigen Blatt mit allen achtzehn Fertigkeiten und leeren
 * Feldern macht ihn erst ../bauen.js.
 */
export default {
  schluessel: 'kaempfer-zwerg',
  name: 'Brunhild Erzhammer',
  spezies: 'Zwerg',
  unterart: '',
  klasse: 'Kämpfer',
  hintergrund: 'Wache',
  gesinnung: 'Rechtschaffen Neutral',
  werte: { str: 17, dex: 13, con: 14, int: 10, wis: 13, cha: 8 },
  rettungswuerfe: ['str', 'con'],
  fertigkeiten: ['athletics', 'perception', 'insight', 'intimidation'],
  ruestungsklasse: 17,
  // Wachsam legt den Übungsbonus auf die Initiative.
  initiativeBonus: 2,
  trefferpunkte: 13,
  trefferwuerfel: '1d10',
  bewegung: 30,
  sinne: { darkvision: 120, notes: 'Steinkunde: Erschütterungssinn 18 m auf Stein, als Bonusaktion' },
  verteidigung: { resistances: 'Gift' },
  rettungswurfVermerk: 'Vorteil auf Rettungswürfe gegen Gift (Zwergenwiderstand).',
  uebungen: {
    armor: 'Leichte, mittlere und schwere Rüstung, Schilde',
    weapons: 'Einfache Waffen, Kriegswaffen',
    tools: 'Schmiedewerkzeug, Würfelset',
    languages: 'Gemeinsprache, Zwergisch',
  },
  angriffe: [
    { name: 'Zweihänder', bonus: '+5', damage: '2W6+3 Hieb', notes: 'Schwer, Zweihändig · Meisterschaft: Streifen' },
    { name: 'Dreschflegel', bonus: '+5', damage: '1W8+3 Wucht', notes: 'Meisterschaft: Zermürben' },
    { name: 'Wurfspeer', bonus: '+5', damage: '1W6+3 Stich', notes: 'Wurf 9/36 m · Meisterschaft: Verlangsamen' },
  ],
  aktionen: [
    {
      name: 'Zweiter Wind',
      art: 'bonus',
      description: 'Du erhältst 1W10+1 Trefferpunkte zurück. Zweimal, dann brauchst du eine Rast.',
    },
    {
      name: 'Steinkunde',
      art: 'bonus',
      description: 'Bis zum Ende deines nächsten Zuges nimmst du 18 m weit alles auf Stein wahr.',
    },
  ],
  ressourcen: [{ name: 'Zweiter Wind', current: 2, max: 2, recharge: 'kurz' }],
  merkmale: [
    {
      name: 'Kampfstil: Verteidigung',
      category: 'klasse',
      source: 'PHB-2024',
      page: '106',
      description: 'Solange du eine Rüstung trägst, steigt deine Rüstungsklasse um 1. (Ist oben eingerechnet.)',
    },
    {
      name: 'Zweiter Wind',
      category: 'klasse',
      source: 'PHB-2024',
      page: '106',
      description:
        'Als Bonusaktion 1W10 + Kämpferstufe Trefferpunkte zurück. Zwei Anwendungen, die sich nach einer Kurzen oder Langen Rast erneuern.',
    },
    {
      name: 'Waffenmeisterschaft',
      category: 'klasse',
      source: 'PHB-2024',
      page: '106',
      description:
        'Drei Waffen: Zweihänder (Streifen – auch bei einem Fehlschlag Schaden in Höhe des Attributsmodifikators), Dreschflegel (Zermürben – das Ziel hat Nachteil auf seinen nächsten Angriff), Wurfspeer (Verlangsamen – 3 m weniger Bewegung).',
    },
    { name: 'Dunkelsicht', category: 'spezies', source: 'PHB-2024', page: '189', description: '36 m weit.' },
    {
      name: 'Zwergenwiderstand',
      category: 'spezies',
      source: 'PHB-2024',
      page: '189',
      description: 'Vorteil auf Rettungswürfe gegen Gift, Resistenz gegen Giftschaden.',
    },
    {
      name: 'Zwergenzähigkeit',
      category: 'spezies',
      source: 'PHB-2024',
      page: '189',
      description: 'Dein Trefferpunktemaximum steigt je Stufe um 1. (Ist oben eingerechnet.)',
    },
    {
      name: 'Steinkunde',
      category: 'spezies',
      source: 'PHB-2024',
      page: '189',
      description: 'Als Bonusaktion Erschütterungssinn 18 m, solange du Stein berührst. Übungsbonus-mal je Lange Rast.',
    },
    {
      name: 'Wachsam',
      category: 'talent',
      source: 'PHB-2024',
      page: '200',
      description:
        'Du addierst deinen Übungsbonus auf die Initiative und darfst deine Initiative mit einem einverstandenen Verbündeten tauschen.',
    },
  ],
  zauber: null,
  ausruestung: [
    { name: 'Kettenpanzer', qty: 1, weight: 55, notes: 'RK 16, Nachteil auf Heimlichkeit' },
    { name: 'Zweihänder', qty: 1, weight: 6, notes: '' },
    { name: 'Dreschflegel', qty: 1, weight: 2, notes: '' },
    { name: 'Wurfspeer', qty: 8, weight: 2, notes: '' },
    { name: 'Speer', qty: 1, weight: 3, notes: 'aus der Torwache' },
    { name: 'Leichte Armbrust', qty: 1, weight: 5, notes: '' },
    { name: 'Bolzen', qty: 20, weight: 0.075, notes: '' },
    { name: 'Köcher', qty: 1, weight: 1, notes: '' },
    { name: 'Jagdfalle', qty: 1, weight: 25, notes: '' },
    { name: 'Handschellen', qty: 1, weight: 6, notes: '' },
    { name: 'Würfelset', qty: 1, weight: 0.5, notes: '' },
    { name: 'Reisekleidung', qty: 1, weight: 4, notes: '' },
    {
      name: 'Höhlenforscherpaket',
      qty: 1,
      weight: 55,
      notes: 'Rucksack, Brecheisen, Hammer, 10 Pitons, Fackeln ×10, Zunderkästchen, Rationen ×10, Wasserschlauch, Seil 15 m',
    },
  ],
  muenzen: { gp: 16 },
  aussehen: {
    gender: 'weiblich',
    age: '74',
    size: 'Mittelgroß',
    height: '137 cm',
    weight: '68 kg',
    faith: 'Moradin',
    skin: 'wettergegerbt',
    eyes: 'grau',
    hair: 'rotbraun, in vier Zöpfen',
  },
  wesen: {
    personality: 'Ich zähle die Ausgänge, sobald ich einen Raum betrete. Das ist keine Angst, das ist Ordnung.',
    ideals: 'Pflicht. Ein Tor, das man mir anvertraut, bleibt zu, bis ich es öffne.',
    bonds: 'Die Bergpforte von Kal Durin fiel in meiner Wache. Ich schulde den Toten dort ein zweites Tor.',
    flaws: 'Wer einmal zu spät zum Dienst kam, bleibt für mich ein Drückeberger.',
    backstory:
      'Vierzig Jahre stand Brunhild an der Bergpforte von Kal Durin, und vierzig Jahre geschah nichts. Dann kam eine Nacht, in der etwas geschah, und am Morgen war das Tor offen, die halbe Wache tot und niemand da, der erklären konnte, wer den Riegel gezogen hatte. Man sprach sie frei; sie selbst tat das nicht. Seither wandert sie und stellt sich vor Türen, hinter denen andere schlafen.',
    look: 'Breit, langsam im Gang und schnell im Blick. Der Kettenpanzer ist an der linken Schulter geflickt – dort, wo in jener Nacht etwas durchkam.',
    allies: 'Was von der Torwache von Kal Durin übrig ist: sieben Namen auf einem Zettel in ihrem Gürtel.',
  },
};
