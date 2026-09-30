/**
 * Vorlage: Kaskar Steinatem – Barbar, Goliath.
 *
 * Einer der zwölf fertigen Charaktere, die jede neue Kampagne hinter dem
 * Schirm vorfindet (siehe ../helden.js für die Auswahl und ../index.js fürs
 * Säen). Hier steht nur der Steckbrief – was diesen Charakter ausmacht.
 * Zum vollständigen Blatt mit allen achtzehn Fertigkeiten und leeren
 * Feldern macht ihn erst ../bauen.js.
 */
export default {
  schluessel: 'barbar-goliath',
  name: 'Kaskar Steinatem',
  spezies: 'Goliath',
  unterart: 'Steingigant-Abstammung',
  klasse: 'Barbar',
  hintergrund: 'Soldat',
  gesinnung: 'Chaotisch Gut',
  werte: { str: 17, dex: 14, con: 14, int: 8, wis: 12, cha: 10 },
  rettungswuerfe: ['str', 'con'],
  fertigkeiten: ['athletics', 'intimidation', 'perception', 'survival'],
  // Ohne Rüstung: 10 + Geschicklichkeit + Konstitution.
  ruestungsklasse: 14,
  initiativeBonus: 0,
  trefferpunkte: 14,
  trefferwuerfel: '1d12',
  bewegung: 35,
  sinne: {},
  verteidigung: { resistances: 'Im Zorn: Wucht, Stich, Hieb' },
  rettungswurfVermerk: 'Im Zorn Vorteil auf Stärke-Rettungswürfe und Stärkeproben.',
  uebungen: {
    armor: 'Leichte und mittlere Rüstung, Schilde',
    weapons: 'Einfache Waffen, Kriegswaffen',
    tools: 'Würfelset',
    languages: 'Gemeinsprache, Riesisch',
  },
  angriffe: [
    { name: 'Doppelaxt', bonus: '+5', damage: '1W12+3 Hieb', notes: 'Schwer, Zweihändig · Meisterschaft: Spalten' },
    { name: 'Handaxt', bonus: '+5', damage: '1W6+3 Hieb', notes: 'Leicht, Wurf 6/18 m · Meisterschaft: Ärgern' },
    { name: 'Unbewaffneter Schlag', bonus: '+5', damage: '4 Wucht', notes: '' },
  ],
  aktionen: [
    {
      name: 'Zorn',
      art: 'bonus',
      description:
        '+2 Schaden im Nahkampf mit Stärke, Resistenz gegen Wucht-, Stich- und Hiebschaden, Vorteil auf Stärkeproben und -rettungswürfe. Hält 10 Minuten. Zweimal je Lange Rast.',
    },
    {
      name: 'Steingigant: Standfest',
      art: 'bonus',
      description: 'Ein Geschöpf in 3 m legt einen Stärke-Rettungswurf gegen SG 13 ab oder wird liegend.',
    },
    {
      name: 'Unbändiger Ansturm',
      art: 'frei',
      description: 'Bei einem Zorn-Ausbruch bewegst du dich zusätzlich, ohne dass es deine Bewegung kostet.',
    },
  ],
  ressourcen: [
    { name: 'Zorn', current: 2, max: 2, recharge: 'lang' },
    { name: 'Riesenkraft (Standfest)', current: 2, max: 2, recharge: 'lang' },
  ],
  merkmale: [
    {
      name: 'Zorn',
      category: 'klasse',
      source: 'PHB-2024',
      page: '50',
      description:
        'Als Bonusaktion. Solange er hält: Vorteil auf Stärkeproben und -rettungswürfe, +2 Schaden im Nahkampf mit Stärke, Resistenz gegen Wucht-, Stich- und Hiebschaden. Keine Rüstung, kein Zaubern.',
    },
    {
      name: 'Ungepanzerte Verteidigung',
      category: 'klasse',
      source: 'PHB-2024',
      page: '50',
      description: 'Ohne Rüstung ist deine Rüstungsklasse 10 + Geschicklichkeit + Konstitution. (Ist oben eingerechnet.)',
    },
    {
      name: 'Waffenmeisterschaft',
      category: 'klasse',
      source: 'PHB-2024',
      page: '50',
      description:
        'Zwei Waffen: Doppelaxt (Spalten – bei einem Treffer ein zweiter Angriff gegen ein zweites Ziel in Reichweite), Handaxt (Ärgern – dein nächster Angriff gegen dasselbe Ziel hat Vorteil).',
    },
    {
      name: 'Riesenabstammung: Steingigant',
      category: 'spezies',
      source: 'PHB-2024',
      page: '193',
      description:
        'Als Bonusaktion zwingst du ein Geschöpf in 3 m zu einem Stärke-Rettungswurf (SG 8 + Übungsbonus + Konstitution) oder es wird liegend.',
    },
    {
      name: 'Kraftvoller Körperbau',
      category: 'spezies',
      source: 'PHB-2024',
      page: '193',
      description: 'Du zählst beim Tragen, Schieben, Ziehen und Heben als eine Größenkategorie größer.',
    },
    {
      name: 'Bewegungsrate',
      category: 'spezies',
      source: 'PHB-2024',
      page: '193',
      description: 'Deine Bewegungsrate beträgt 10,5 m statt 9 m.',
    },
    {
      name: 'Wilder Angreifer',
      category: 'talent',
      source: 'PHB-2024',
      page: '209',
      description: 'Einmal je Zug darfst du die Schadenswürfel eines Waffenangriffs neu würfeln und das bessere Ergebnis nehmen.',
    },
  ],
  zauber: null,
  ausruestung: [
    { name: 'Doppelaxt', qty: 1, weight: 7, notes: '' },
    { name: 'Handaxt', qty: 4, weight: 2, notes: 'zwei am Gürtel, zwei am Rücken' },
    { name: 'Speer', qty: 1, weight: 3, notes: 'aus der Dienstzeit' },
    { name: 'Kurzbogen', qty: 1, weight: 2, notes: '' },
    { name: 'Pfeile', qty: 20, weight: 0.05, notes: '' },
    { name: 'Köcher', qty: 1, weight: 1, notes: '' },
    { name: 'Heilerausrüstung', qty: 1, weight: 3, notes: '10 Anwendungen: Sterbende ohne Wurf stabilisieren' },
    { name: 'Würfelset', qty: 1, weight: 0.5, notes: '' },
    { name: 'Reisekleidung', qty: 1, weight: 4, notes: '' },
    {
      name: 'Entdeckerpaket',
      qty: 1,
      weight: 59,
      notes: 'Rucksack, Schlafrolle, Zunderkästchen, Fackeln ×10, Rationen ×10, Wasserschlauch, Seil 15 m',
    },
  ],
  muenzen: { gp: 29 },
  aussehen: {
    gender: 'männlich',
    age: '31',
    size: 'Mittelgroß',
    height: '221 cm',
    weight: '156 kg',
    faith: 'die Ahnen im Fels',
    skin: 'grausteinfarben, mit dunklen Flecken',
    eyes: 'blassblau',
    hair: 'kahl, mit eingeritzten Linien',
  },
  wesen: {
    personality: 'Ich rede wenig und stelle mich vorn hin. Beides spart Zeit.',
    ideals: 'Die Schwachen zuerst. Wer nicht selbst stehen kann, für den steht man.',
    bonds: 'Meine Truppe schickte mich zurück, damit einer die Namen heimbringt. Ich trage sie noch.',
    flaws: 'Ein Rückzug fühlt sich für mich an wie Verrat, auch wenn er der einzige Ausweg wäre.',
    backstory:
      'Kaskar kam von der Hochebene ins Tal, weil man dort Söldner suchte und Riesen fürchtete – ihn hielt man für beides. Drei Jahre trug er die Fahne einer Grenztruppe, bis ein Pass einstürzte und von zwanzig Leuten er allein zurückkam, weil sie ihn losgeschickt hatten. Er hat den Sold nie abgeholt. Stattdessen geht er jetzt dorthin, wo Leute vorne jemanden brauchen.',
    look: 'Ein Kopf größer als jeder im Raum, mit Linien im Schädel, die von seiner Sippe erzählen. Er lehnt an Wänden, weil Stühle unter ihm ächzen.',
    allies: 'Die Grenztruppe „Zwanzig Steine“ – aufgelöst, und ihre Namen stehen auf seinem Unterarm.',
  },
};
