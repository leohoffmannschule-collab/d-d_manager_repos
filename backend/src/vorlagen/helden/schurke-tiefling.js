/**
 * Vorlage: Zaira Kesselflick – Schurke, Tiefling.
 *
 * Einer der zwölf fertigen Charaktere, die jede neue Kampagne hinter dem
 * Schirm vorfindet (siehe ../helden.js für die Auswahl und ../index.js fürs
 * Säen). Hier steht nur der Steckbrief – was diesen Charakter ausmacht.
 * Zum vollständigen Blatt mit allen achtzehn Fertigkeiten und leeren
 * Feldern macht ihn erst ../bauen.js.
 */
export default {
  schluessel: 'schurke-tiefling',
  name: 'Zaira Kesselflick',
  spezies: 'Tiefling',
  unterart: 'Höllische Abstammung',
  klasse: 'Schurke',
  hintergrund: 'Verbrecher',
  gesinnung: 'Chaotisch Neutral',
  werte: { str: 8, dex: 17, con: 14, int: 14, wis: 12, cha: 10 },
  rettungswuerfe: ['dex', 'int'],
  fertigkeiten: ['sleightOfHand', 'deception', 'investigation', 'acrobatics'],
  expertise: ['stealth', 'perception'],
  ruestungsklasse: 14,
  // Wachsam legt den Übungsbonus auf die Initiative.
  initiativeBonus: 2,
  trefferpunkte: 10,
  trefferwuerfel: '1d8',
  bewegung: 30,
  sinne: { darkvision: 60 },
  verteidigung: { resistances: 'Feuer' },
  rettungswurfVermerk: '',
  uebungen: {
    armor: 'Leichte Rüstung',
    weapons: 'Einfache Waffen, Finessewaffen, Leichte Waffen',
    tools: 'Diebeswerkzeug',
    languages: 'Gemeinsprache, Infernalisch',
  },
  angriffe: [
    { name: 'Kurzschwert', bonus: '+5', damage: '1W6+3 Stich', notes: 'Finesse, Leicht · Meisterschaft: Ärgern' },
    { name: 'Kurzbogen', bonus: '+5', damage: '1W6+3 Stich', notes: '24/96 m · Meisterschaft: Ärgern' },
    { name: 'Dolch', bonus: '+5', damage: '1W4+3 Stich', notes: 'Finesse, Leicht, Wurf 6/18 m' },
    { name: 'Hinterhältiger Angriff', bonus: '—', damage: '+1W6', notes: 'Bei Vorteil oder wenn ein Verbündeter neben dem Ziel steht' },
  ],
  aktionen: [
    {
      name: 'Verstecken',
      art: 'aktion',
      description: 'Heimlichkeit +7 gegen SG 15. Gelingt es, hast du Vorteil – und damit den Hinterhältigen Angriff.',
    },
    {
      name: 'Diebeskunst',
      art: 'frei',
      description: 'Diebeswerkzeug mit doppeltem Übungsbonus: Schlösser +7, Fallen entschärfen +7.',
    },
  ],
  ressourcen: [],
  merkmale: [
    {
      name: 'Hinterhältiger Angriff',
      category: 'klasse',
      source: 'PHB-2024',
      page: '134',
      description:
        'Einmal je Zug +1W6 Schaden mit einer Finesse- oder Fernkampfwaffe, wenn du Vorteil hast oder ein Verbündeter neben dem Ziel steht.',
    },
    {
      name: 'Sachkenntnis',
      category: 'klasse',
      source: 'PHB-2024',
      page: '134',
      description: 'Doppelter Übungsbonus in Heimlichkeit und Wahrnehmung.',
    },
    {
      name: 'Diebesjargon',
      category: 'klasse',
      source: 'PHB-2024',
      page: '134',
      description: 'Eine Geheimsprache aus Andeutungen und Zeichen, die nur andere Schurken verstehen.',
    },
    {
      name: 'Waffenmeisterschaft',
      category: 'klasse',
      source: 'PHB-2024',
      page: '134',
      description: 'Zwei Waffen: Kurzschwert und Kurzbogen, beide mit Ärgern – dein nächster Angriff gegen dasselbe Ziel hat Vorteil.',
    },
    { name: 'Dunkelsicht', category: 'spezies', source: 'PHB-2024', page: '197', description: '18 m weit.' },
    {
      name: 'Höllisches Erbe',
      category: 'spezies',
      source: 'PHB-2024',
      page: '197',
      description: 'Resistenz gegen Feuerschaden und der Zaubertrick Thaumaturgie.',
    },
    {
      name: 'Überirdische Gegenwart',
      category: 'spezies',
      source: 'PHB-2024',
      page: '197',
      description: 'Du kennst den Zaubertrick Thaumaturgie und wirkst ihn mit Charisma.',
    },
    {
      name: 'Wachsam',
      category: 'talent',
      source: 'PHB-2024',
      page: '200',
      description: 'Du addierst deinen Übungsbonus auf die Initiative und darfst sie mit einem einverstandenen Verbündeten tauschen.',
    },
  ],
  zauber: {
    attribut: 'cha',
    plaetze: {},
    liste: [
      {
        name: 'Thaumaturgie',
        level: 0,
        prepared: true,
        index: 'thaumaturgy',
        source: 'Höllische Abstammung',
        save: '--',
        time: '1 A',
        range: '9 m',
        components: 'V',
        duration: 'bis 1 Min.',
        page: 'PHB-2024 302',
        notes: 'Türen aufspringen lassen, die Stimme dreimal so laut – meist reicht das.',
      },
    ],
  },
  ausruestung: [
    { name: 'Lederrüstung', qty: 1, weight: 10, notes: 'RK 11 + Geschicklichkeit' },
    { name: 'Kurzschwert', qty: 1, weight: 2, notes: '' },
    { name: 'Kurzbogen', qty: 1, weight: 2, notes: '' },
    { name: 'Pfeile', qty: 20, weight: 0.05, notes: '' },
    { name: 'Köcher', qty: 1, weight: 1, notes: '' },
    { name: 'Dolch', qty: 4, weight: 1, notes: 'zwei aus der Klasse, zwei aus alten Zeiten' },
    { name: 'Diebeswerkzeug', qty: 1, weight: 1, notes: 'Sachkenntnis: +7' },
    { name: 'Brecheisen', qty: 1, weight: 5, notes: '' },
    { name: 'Beutel', qty: 1, weight: 1, notes: '' },
    { name: 'Reisekleidung', qty: 1, weight: 4, notes: '' },
    {
      name: 'Einbrecherpaket',
      qty: 1,
      weight: 42,
      notes: 'Rucksack, Kugellager ×1000, Seil 3 m, Glocke, Kerzen ×5, Brecheisen, Hammer, Pitons ×10, Blendlaterne, Öl ×2, Rationen ×5, Zunderkästchen, Wasserschlauch, Seil 15 m',
    },
  ],
  muenzen: { gp: 24 },
  aussehen: {
    gender: 'weiblich',
    age: '26',
    size: 'Mittelgroß',
    height: '171 cm',
    weight: '59 kg',
    faith: 'abergläubisch, aber gläubig nicht',
    skin: 'aschrot',
    eyes: 'einfarbig schwarz',
    hair: 'schwarz, kurz, mit abgesägten Hörnern darüber',
  },
  wesen: {
    personality: 'Ich frage nie, wem etwas gehört. Ich frage, wer es vermissen wird.',
    ideals: 'Wiedergutmachung. Wer sich am Elend anderer bereichert hat, bezahlt bei mir Zinsen.',
    bonds: 'Meine Schwester sitzt für etwas ein, das ich getan habe. Ich hole sie da raus.',
    flaws: 'Ich kann eine offene Tür nicht sehen, ohne durchzugehen – auch wenn sie eine Falle ist.',
    backstory:
      'Zaira wuchs im Kesselviertel auf, wo Hörner an einem Kind bedeuteten, dass man ihm ohnehin alles zutraute – also lernte sie früh, ihrem Ruf zu entsprechen. Ihre Schwester Mira hielt sie da heraus, bis Zaira eines Nachts das falsche Kontor aufbrach und Mira am Morgen dafür abgeführt wurde, weil ein Zeuge zwei rote Gestalten nicht auseinanderhalten konnte. Zaira hat sich die Hörner abgesägt, den Namen behalten und arbeitet seither auf die Summe hin, die eine Berufung kostet.',
    look: 'Dunkel gekleidet, ohne dass es auffällt. Trägt Handschuhe, auch im Sommer, und sitzt nie mit dem Rücken zur Tür.',
    allies: 'Niemand offen. Zwei Hehler und ein Schreiber, der Akten verschwinden lässt.',
  },
};
