/**
 * Vorlage: Vaskir Goldschuppe – Paladin, Drachenblütiger.
 *
 * Einer der zwölf fertigen Charaktere, die jede neue Kampagne hinter dem
 * Schirm vorfindet (siehe ../helden.js für die Auswahl und ../index.js fürs
 * Säen). Hier steht nur der Steckbrief – was diesen Charakter ausmacht.
 * Zum vollständigen Blatt mit allen achtzehn Fertigkeiten und leeren
 * Feldern macht ihn erst ../bauen.js.
 */
export default {
  schluessel: 'paladin-drachenbluetiger',
  name: 'Vaskir Goldschuppe',
  spezies: 'Drachenblütiger',
  unterart: 'Messingdrache',
  klasse: 'Paladin',
  hintergrund: 'Adliger',
  gesinnung: 'Rechtschaffen Gut',
  werte: { str: 16, dex: 10, con: 13, int: 8, wis: 12, cha: 16 },
  rettungswuerfe: ['wis', 'cha'],
  fertigkeiten: ['history', 'persuasion', 'athletics', 'religion'],
  ruestungsklasse: 18,
  initiativeBonus: 0,
  trefferpunkte: 11,
  trefferwuerfel: '1d10',
  bewegung: 30,
  sinne: { darkvision: 60 },
  verteidigung: { resistances: 'Feuer' },
  rettungswurfVermerk: '',
  uebungen: {
    armor: 'Leichte, mittlere und schwere Rüstung, Schilde',
    weapons: 'Einfache Waffen, Kriegswaffen',
    tools: 'Würfelset',
    languages: 'Gemeinsprache, Drakonisch',
  },
  angriffe: [
    { name: 'Langschwert', bonus: '+5', damage: '1W8+3 Hieb', notes: 'Vielseitig (1W10) · Meisterschaft: Zermürben' },
    { name: 'Wurfspeer', bonus: '+5', damage: '1W6+3 Stich', notes: 'Wurf 9/36 m · Meisterschaft: Verlangsamen' },
    { name: 'Odemwaffe (Feuer)', bonus: 'SG 13', damage: '1W10 Feuer', notes: 'Kegel 4,5 m, GES-RW für halben Schaden' },
  ],
  aktionen: [
    {
      name: 'Handauflegen',
      art: 'bonus',
      description:
        'Berührung: Trefferpunkte aus einem Vorrat von 5, frei aufteilbar. Für 5 Punkte stattdessen die Bedingung Vergiftet aufheben.',
    },
    {
      name: 'Odemwaffe',
      art: 'aktion',
      description: 'Kegel von 4,5 m, 1W10 Feuer, Geschicklichkeits-Rettungswurf gegen SG 13 für die Hälfte. Zweimal je Lange Rast.',
    },
  ],
  ressourcen: [
    { name: 'Handauflegen (TP-Vorrat)', current: 5, max: 5, recharge: 'lang' },
    { name: 'Odemwaffe', current: 2, max: 2, recharge: 'lang' },
  ],
  merkmale: [
    {
      name: 'Handauflegen',
      category: 'klasse',
      source: 'PHB-2024',
      page: '109',
      description:
        'Ein Vorrat an Heilkraft von 5 Punkten je Lange Rast. Als Bonusaktion durch Berührung verteilen; 5 Punkte heben stattdessen Vergiftet auf.',
    },
    {
      name: 'Zauberwirken',
      category: 'klasse',
      source: 'PHB-2024',
      page: '110',
      description: 'Charisma ist dein Zauberattribut. Zauber-SG 13, Zauberangriffsbonus +5. Du bereitest zwei Zauber vor.',
    },
    {
      name: 'Waffenmeisterschaft',
      category: 'klasse',
      source: 'PHB-2024',
      page: '110',
      description:
        'Zwei Waffen: Langschwert (Zermürben – das Ziel hat Nachteil auf seinen nächsten Angriff), Wurfspeer (Verlangsamen – 3 m weniger Bewegung).',
    },
    {
      name: 'Odemwaffe',
      category: 'spezies',
      source: 'PHB-2024',
      page: '188',
      description:
        'Statt eines Angriffs ein Kegel von 4,5 m: 1W10 Feuerschaden, Geschicklichkeits-Rettungswurf für die Hälfte. Übungsbonus-mal je Lange Rast.',
    },
    {
      name: 'Schadensresistenz',
      category: 'spezies',
      source: 'PHB-2024',
      page: '188',
      description: 'Resistenz gegen Feuerschaden – die Farbe deiner Schuppen entscheidet.',
    },
    { name: 'Dunkelsicht', category: 'spezies', source: 'PHB-2024', page: '188', description: '18 m weit.' },
    {
      name: 'Geübt',
      category: 'talent',
      source: 'PHB-2024',
      page: '207',
      description: 'Übung in drei weiteren Fertigkeiten oder Werkzeugen – hier Athletik, Religion und das Würfelset.',
    },
  ],
  zauber: {
    attribut: 'cha',
    plaetze: { 1: { max: 2, used: 0 } },
    liste: [
      {
        name: 'Segnen',
        level: 1,
        prepared: true,
        index: 'bless',
        source: 'Paladin',
        save: '--',
        time: '1 A',
        range: '9 m',
        components: 'V, S, M',
        duration: 'K, 1 Min.',
        page: 'PHB-2024 247',
        notes: 'Drei Ziele, +1W4 auf Angriffe und Rettungswürfe.',
      },
      {
        name: 'Wunden heilen',
        level: 1,
        prepared: true,
        index: 'cure-wounds',
        source: 'Paladin',
        save: '--',
        time: '1 A',
        range: 'Berührung',
        components: 'V, S',
        duration: 'Sofort',
        page: 'PHB-2024 255',
        notes: '2W8 + 3 – zusätzlich zum Handauflegen.',
      },
    ],
  },
  ausruestung: [
    { name: 'Kettenpanzer', qty: 1, weight: 55, notes: 'RK 16, Nachteil auf Heimlichkeit' },
    { name: 'Schild', qty: 1, weight: 6, notes: '+2 RK' },
    { name: 'Langschwert', qty: 1, weight: 3, notes: '' },
    { name: 'Wurfspeer', qty: 6, weight: 2, notes: '' },
    { name: 'Heiliges Symbol', qty: 1, weight: 1, notes: 'Zauberfokus, Messing' },
    { name: 'Würfelset', qty: 1, weight: 0.5, notes: 'aus dem Haus, mit Wappen' },
    { name: 'Feine Kleidung', qty: 1, weight: 6, notes: '' },
    { name: 'Parfüm', qty: 1, weight: 0, notes: '' },
    {
      name: 'Priesterpaket',
      qty: 1,
      weight: 25,
      notes: 'Rucksack, Decke, Kerzen ×10, Zunderkästchen, Almosenbüchse, Weihrauch ×2, Räuchergefäß, Gewand, Rationen ×2, Wasserschlauch',
    },
  ],
  muenzen: { gp: 38 },
  aussehen: {
    gender: 'männlich',
    age: '23',
    size: 'Mittelgroß',
    height: '196 cm',
    weight: '112 kg',
    faith: 'der Eid, nicht der Gott',
    skin: 'messingfarbene Schuppen, an den Unterarmen dunkler',
    eyes: 'kupferrot',
    hair: 'keines',
  },
  wesen: {
    personality: 'Ich sage, was ich tun werde, und tue es dann. Das verwirrt die Leute mehr, als es sollte.',
    ideals: 'Wort. Ein gegebenes Versprechen wiegt schwerer als das eigene Leben.',
    bonds: 'Mein Haus verkaufte den Pachtbauern das Land unter den Füßen weg. Ich zahle es zurück, Hof für Hof.',
    flaws: 'Ich halte auch dann an einem Versprechen fest, wenn es längst mehr schadet als nützt.',
    backstory:
      'Das Haus Goldschuppe war reich geworden, indem es in Notzeiten Land aufkaufte, und Vaskir hörte am Tisch zu, wie man das für Klugheit hielt. Mit zwanzig ritt er zum ersten Mal selbst hinaus, um einen Hof einzuziehen, und sah die Familie, die dort stand. Er ritt ohne den Hof zurück, legte den Eid ab und nahm nichts mit als Rüstung, Klinge und die Liste der Höfe, die sein Haus noch hält.',
    look: 'Hochgewachsen, Schuppen wie poliertes Messing, die Bewegungen eines Menschen, dem beigebracht wurde, wie man einen Saal betritt.',
    allies: 'Niemand aus dem Haus mehr. Dafür acht Pachtfamilien, die seinen Namen kennen.',
  },
};
