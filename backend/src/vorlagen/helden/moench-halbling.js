/**
 * Vorlage: Pip Sommerfeld – Mönch, Halbling.
 *
 * Einer der zwölf fertigen Charaktere, die jede neue Kampagne hinter dem
 * Schirm vorfindet (siehe ../helden.js für die Auswahl und ../index.js fürs
 * Säen). Hier steht nur der Steckbrief – was diesen Charakter ausmacht.
 * Zum vollständigen Blatt mit allen achtzehn Fertigkeiten und leeren
 * Feldern macht ihn erst ../bauen.js.
 */
export default {
  schluessel: 'moench-halbling',
  name: 'Pip Sommerfeld',
  spezies: 'Halbling',
  unterart: '',
  klasse: 'Mönch',
  hintergrund: 'Weltenbummler',
  gesinnung: 'Chaotisch Gut',
  werte: { str: 12, dex: 17, con: 14, int: 8, wis: 14, cha: 10 },
  rettungswuerfe: ['str', 'dex'],
  fertigkeiten: ['insight', 'stealth', 'acrobatics', 'athletics'],
  // Ohne Rüstung: 10 + Geschicklichkeit + Weisheit.
  ruestungsklasse: 15,
  initiativeBonus: 0,
  trefferpunkte: 10,
  trefferwuerfel: '1d8',
  bewegung: 30,
  sinne: {},
  verteidigung: {},
  rettungswurfVermerk: 'Vorteil auf Rettungswürfe gegen Verängstigt (Mutig).',
  uebungen: {
    armor: 'keine',
    weapons: 'Einfache Waffen, Kurzschwerter',
    tools: 'Diebeswerkzeug, Würfelset',
    languages: 'Gemeinsprache, Halblingisch',
  },
  angriffe: [
    { name: 'Kampfstab (zweihändig)', bonus: '+5', damage: '1W8+3 Wucht', notes: 'Vielseitig – oder 1W6 als Kampfkunstwaffe' },
    { name: 'Unbewaffneter Schlag', bonus: '+5', damage: '1W6+3 Wucht', notes: 'Kampfkunst' },
    { name: 'Dolch', bonus: '+5', damage: '1W4+3 Stich', notes: 'Finesse, Wurf 6/18 m' },
  ],
  aktionen: [
    {
      name: 'Kampfkunst: Zusatzangriff',
      art: 'bonus',
      description: 'Nach einem unbewaffneten Angriff oder einem Angriff mit einer Mönchswaffe ein weiterer unbewaffneter Schlag.',
    },
    {
      name: 'Glück',
      art: 'frei',
      description:
        'Dreimal je Lange Rast: Vorteil auf einen Angriff, eine Probe oder einen Rettungswurf – oder Nachteil auf einen Angriff gegen dich.',
    },
  ],
  ressourcen: [{ name: 'Glück (Talent)', current: 3, max: 3, recharge: 'lang' }],
  merkmale: [
    {
      name: 'Kampfkunst',
      category: 'klasse',
      source: 'PHB-2024',
      page: '110',
      description:
        'Ohne Rüstung und ohne Schild: Geschicklichkeit für unbewaffnete Angriffe und Mönchswaffen, W6 Schadenswürfel, und als Bonusaktion ein zusätzlicher unbewaffneter Schlag.',
    },
    {
      name: 'Ungepanzerte Verteidigung',
      category: 'klasse',
      source: 'PHB-2024',
      page: '110',
      description: 'Ohne Rüstung ist deine Rüstungsklasse 10 + Geschicklichkeit + Weisheit. (Ist oben eingerechnet.)',
    },
    {
      name: 'Mutig',
      category: 'spezies',
      source: 'PHB-2024',
      page: '192',
      description: 'Vorteil auf Rettungswürfe gegen die Bedingung Verängstigt.',
    },
    {
      name: 'Halblingsglück',
      category: 'spezies',
      source: 'PHB-2024',
      page: '192',
      description: 'Würfelst du bei einem W20 eine 1, würfelst du ihn neu und musst das neue Ergebnis nehmen.',
    },
    {
      name: 'Flinkheit',
      category: 'spezies',
      source: 'PHB-2024',
      page: '192',
      description: 'Du kannst dich durch den Raum jedes Geschöpfes bewegen, das größer ist als du.',
    },
    {
      name: 'Von Natur aus unauffällig',
      category: 'spezies',
      source: 'PHB-2024',
      page: '192',
      description: 'Du kannst dich verstecken, wenn ein größeres Geschöpf dich verdeckt.',
    },
    {
      name: 'Glück',
      category: 'talent',
      source: 'PHB-2024',
      page: '202',
      description: 'Dreimal je Lange Rast Vorteil auf einen eigenen W20 – oder Nachteil auf einen Angriff gegen dich.',
    },
  ],
  zauber: null,
  ausruestung: [
    { name: 'Kampfstab', qty: 1, weight: 4, notes: 'Mönchswaffe, vielseitig' },
    { name: 'Speer', qty: 1, weight: 3, notes: '' },
    { name: 'Dolch', qty: 7, weight: 1, notes: 'fünf aus der Klasse, zwei von der Straße' },
    { name: 'Diebeswerkzeug', qty: 1, weight: 1, notes: '' },
    { name: 'Würfelset', qty: 1, weight: 0.5, notes: '' },
    { name: 'Schlafrolle', qty: 1, weight: 7, notes: '' },
    { name: 'Beutel', qty: 2, weight: 1, notes: '' },
    { name: 'Reisekleidung', qty: 1, weight: 4, notes: '' },
    {
      name: 'Entdeckerpaket',
      qty: 1,
      weight: 59,
      notes: 'Rucksack, Schlafrolle, Zunderkästchen, Fackeln ×10, Rationen ×10, Wasserschlauch, Seil 15 m',
    },
  ],
  muenzen: { gp: 27 },
  aussehen: {
    gender: 'männlich',
    age: '29',
    size: 'Klein',
    height: '94 cm',
    weight: '18 kg',
    faith: 'die Straße kennt keinen Gott',
    skin: 'sonnengebräunt',
    eyes: 'dunkelbraun',
    hair: 'schwarz, lockig, meist zu kurz geschnitten',
  },
  wesen: {
    personality: 'Ich stehe nie da, wo man mich zuletzt gesehen hat. Gewohnheit, keine Absicht.',
    ideals: 'Beweglichkeit. Wer an einem Ort bleibt, wird von ihm eingeholt.',
    bonds: 'Der alte Mann am Flussweg brachte mir bei, wie man fällt, ohne zu brechen. Ich weiß bis heute nicht, wer er war.',
    flaws: 'Ich nehme mir, was herumliegt, auch wenn ich es nicht brauche – aus reiner Übung.',
    backstory:
      'Pip wuchs in den Gassen einer Hafenstadt auf, wo Kleinsein ein Vorteil war und Schnellsein die einzige Rente. Mit zweiundzwanzig griff er in die falsche Tasche, wurde nicht erwischt, sondern aufgehalten – von einem alten Mann, der ihm die Hand umdrehte, ohne sie zu brechen, und ihn dann zum Essen einlud. Sieben Jahre lernte er bei ihm, dann war der Alte eines Morgens fort, und Pip nahm seinen Stab und die Gewohnheit, weiterzugehen.',
    look: 'Klein, drahtig, immer in Bewegung – wippt auf den Fußballen, auch im Sitzen. Barfuß, wo es geht.',
    allies: 'Niemand mit Namen. Aber in vier Städten gibt es Küchen, in denen er essen darf.',
  },
};
