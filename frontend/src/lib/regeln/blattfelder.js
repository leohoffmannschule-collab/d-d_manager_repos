/**
 * Was auf dem Blatt in Listen steht: Aktionsarten, die Standardaktionen
 * jeder Figur, die Herkunft eines Merkmals, die Felder des Aussehens und
 * die Erfahrungsschwellen.
 *
 * Alles Aufzählungen, die eine Auswahlliste oder eine Vorlage füllen. Sie
 * stehen zusammen, weil sie dasselbe tun: Sie geben dem Blatt seine Form,
 * ohne etwas auszurechnen.
 */

export const AKTION_ARTEN = [
  ['aktion', 'Aktion'],
  ['bonus', 'Bonusaktion'],
  ['reaktion', 'Reaktion'],
  ['frei', 'Freie Handlung'],
];

export const aktionArtLabel = (art) => AKTION_ARTEN.find(([wert]) => wert === art)?.[1] ?? 'Aktion';

/**
 * Was am Tisch immer geht – die Handlungen aus dem Grundregelwerk.
 *
 * Das steht hier nicht, weil es jemand eintragen müsste, sondern damit es
 * niemand nachschlagen muss: Der Reiter zeigt die Liste an, und daneben
 * stehen die eigenen Fähigkeiten, die eine Aktion kosten.
 */
export const STANDARD_AKTIONEN = [
  { name: 'Angreifen', art: 'aktion', text: 'Ein Angriff mit einer Waffe oder ein unbewaffneter Schlag.' },
  { name: 'Zaubern', art: 'aktion', text: 'Einen Zauber wirken, dessen Wirkzeit eine Aktion beträgt.' },
  { name: 'Spurt', art: 'aktion', text: 'Zusätzliche Bewegung in Höhe deiner Bewegungsrate.' },
  { name: 'Rückzug', art: 'aktion', text: 'Deine Bewegung löst in diesem Zug keine Gelegenheitsangriffe aus.' },
  {
    name: 'Ausweichen',
    art: 'aktion',
    text: 'Angriffe gegen dich haben Nachteil, deine Geschicklichkeits-Rettungswürfe Vorteil.',
  },
  { name: 'Helfen', art: 'aktion', text: 'Einem Verbündeten Vorteil verschaffen – oder ihn stabilisieren.' },
  { name: 'Verstecken', art: 'aktion', text: 'Heimlichkeitsprobe gegen SG 15; bei Erfolg giltst du als unsichtbar.' },
  { name: 'Bereit machen', art: 'aktion', text: 'Eine Aktion an eine Bedingung knüpfen und als Reaktion auslösen.' },
  {
    name: 'Suchen',
    art: 'aktion',
    text: 'Wahrnehmung, Nachforschung, Motiv erkennen oder Überlebenskunst einsetzen.',
  },
  { name: 'Nutzen', art: 'aktion', text: 'Einen Gegenstand oder eine besondere Fähigkeit benutzen.' },
  { name: 'Ringen', art: 'aktion', text: 'Athletik gegen Athletik oder Akrobatik – das Ziel wird Gepackt.' },
  {
    name: 'Stoßen',
    art: 'aktion',
    text: 'Athletik gegen Athletik oder Akrobatik – das Ziel wird 1,5 m geschoben oder Liegend.',
  },
  { name: 'Studieren', art: 'aktion', text: 'Arkane Kunde, Geschichte, Naturkunde, Religion oder Nachforschung.' },
  {
    name: 'Beeinflussen',
    art: 'aktion',
    text: 'Täuschen, Einschüchtern, Auftreten, Überzeugen oder Tierhandhabung.',
  },
  { name: 'Improvisieren', art: 'aktion', text: 'Etwas versuchen, wofür keine Regel vorgesehen ist.' },
  {
    name: 'Kampf mit zwei Waffen',
    art: 'bonus',
    text: 'Angriff mit der leichten Waffe in der anderen Hand, nachdem du angegriffen hast.',
  },
  { name: 'Gelegenheitsangriff', art: 'reaktion', text: 'Wenn ein Feind deine Reichweite zu Fuß verlässt.' },
  {
    name: 'Mit einem Objekt interagieren',
    art: 'frei',
    text: 'Einmal je Zug nebenbei: ziehen, öffnen, aufheben, ablegen.',
  },
];

/* --- Merkmale ------------------------------------------------------------ */

/**
 * Woher ein Merkmal stammt. Auf dem gedruckten Blatt stehen die Merkmale
 * nach Herkunft sortiert – erst was die Klasse gibt, dann die Spezies, dann
 * Talente. Wer nachschlägt, sucht genau so.
 */
export const MERKMAL_ARTEN = [
  ['klasse', 'Klasse'],
  ['spezies', 'Spezies'],
  ['talent', 'Talent'],
  ['hintergrund', 'Hintergrund'],
  ['sonstiges', 'Sonstiges'],
];

export const merkmalArtLabel = (art) => MERKMAL_ARTEN.find(([wert]) => wert === art)?.[1] ?? 'Sonstiges';

/* --- Aussehen und Person ------------------------------------------------- */

/**
 * Die Felder der Seite „Aussehen & Persönlichkeit“. Sie entscheiden nichts
 * über Regeln, aber ohne sie ist ein Charakter nur eine Wertetabelle.
 */
export const AUSSEHEN_FELDER = [
  { key: 'gender', label: 'Geschlecht' },
  { key: 'age', label: 'Alter' },
  { key: 'size', label: 'Statur' },
  { key: 'height', label: 'Körpergröße' },
  { key: 'weight', label: 'Gewicht' },
  { key: 'faith', label: 'Glaube' },
  { key: 'skin', label: 'Haut' },
  { key: 'eyes', label: 'Augen' },
  { key: 'hair', label: 'Haare' },
];

/* --- Erfahrung ----------------------------------------------------------- */

/** Erfahrungsschwellen der Stufen 1 bis 20. */
export const XP_THRESHOLDS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000,
  225000, 265000, 305000, 355000,
];

export function levelFromExperience(xp) {
  const wert = Number(xp) || 0;
  let stufe = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (wert >= XP_THRESHOLDS[i]) stufe = i + 1;
  }
  return stufe;
}

/** Was bis zur nächsten Stufe noch fehlt – oder null auf Stufe 20. */
export function experienceToNextLevel(xp) {
  const stufe = levelFromExperience(xp);
  if (stufe >= 20) return null;
  return XP_THRESHOLDS[stufe] - (Number(xp) || 0);
}
