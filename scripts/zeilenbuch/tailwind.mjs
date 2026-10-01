/**
 * Klassen in Worten: was `flex items-center gap-2 text-rubric` bedeutet.
 *
 * Die Oberfläche beschreibt ihr Aussehen mit Tailwind: Jede Klasse ist ein
 * einzelner Baustein („flex“: Kinder nebeneinander, „gap-2“: 8 px Abstand).
 * Tailwind erzeugt beim Bau für jede Klasse, die im Code vorkommt, genau
 * eine CSS-Regel. Dazu kommen die eigenen Klassen des Almanachs (`btn`,
 * `panel`, `field-box` …), die in den Stilblättern unter frontend/src/stile/
 * stehen – die erklärt der Projekt-Index mit dem Kommentar ihres Stilblatts.
 *
 * Gelesen wird so, wie Tailwind liest: erst die Vorsätze (`hover:`, `sm:` …),
 * dann ein optionales Minus, dann der Baustein mit seinem Wert, zuletzt
 * eine Deckkraft (`/20`). Was das hier nicht kennt, nennt die Erklärung
 * ehrlich „Tailwind-Klasse“ ohne Deutung.
 */
import { code, px, zahl } from './text.mjs';

/** Die Farben aus stile/farben.css, wie sie im Buch heißen. */
const FARBEN = {
  ink: 'Tinte (die Schriftfarbe)',
  sepia: 'Sepia (gedämpfte Schrift)',
  faint: 'Blass (Nebenschrift)',
  rule: 'Linienfarbe',
  'rule-strong': 'kräftige Linienfarbe',
  rubric: 'Rubrikrot (Hervorhebung)',
  'rubric-deep': 'tiefes Rubrikrot',
  'rubric-ink': 'Schrift auf Rubrikrot',
  gold: 'Blattgold',
  'gold-soft': 'helles Gold',
  leather: 'Buchleder (Kopfleiste)',
  'leather-ink': 'Schrift auf Leder',
  'leather-dim': 'gedämpfte Schrift auf Leder',
  panel: 'Velin (Grund der Tafeln)',
  'panel-soft': 'helles Velin',
  ground: 'Pergament (Grund der Seite)',
  ok: 'Grün für „in Ordnung“',
  black: 'Schwarz',
  white: 'Weiß',
  transparent: 'durchsichtig',
  current: 'die Schriftfarbe',
  inherit: 'die Farbe des umgebenden Elements',
};

/** Die Schriften aus stile/farben.css. */
const SCHRIFTEN = {
  display: 'Schrift Cinzel (Überschriften, Zahlen, Beschriftungen)',
  body: 'Schrift EB Garamond (Fließtext)',
  initial: 'Schrift UnifrakturMaguntia (Zierbuchstaben)',
  sans: 'serifenlose Schrift',
  serif: 'Serifenschrift',
  mono: 'Schrift mit fester Zeichenbreite',
};

const VORSAETZE = {
  sm: 'ab 640 px Fensterbreite',
  md: 'ab 768 px Fensterbreite',
  lg: 'ab 1024 px Fensterbreite',
  xl: 'ab 1280 px Fensterbreite',
  '2xl': 'ab 1536 px Fensterbreite',
  hover: 'beim Darüberfahren mit der Maus',
  focus: 'wenn das Element den Fokus hat',
  'focus-visible': 'wenn das Element per Tastatur fokussiert ist',
  'focus-within': 'wenn etwas darin den Fokus hat',
  active: 'während es gedrückt wird',
  disabled: 'wenn es abgeschaltet ist',
  'group-hover': 'wenn die Maus über der umgebenden Gruppe (Klasse group) ist',
  placeholder: 'für den Platzhaltertext',
  marker: 'für die Aufzählungszeichen',
  first: 'beim ersten Element',
  last: 'beim letzten Element',
  odd: 'bei jedem ungeraden Element',
  even: 'bei jedem geraden Element',
  checked: 'wenn angehakt',
  print: 'beim Drucken',
};

const TEXTGROESSEN = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48, '6xl': 60 };
const BREITEN = { '3xs': 256, '2xs': 288, xs: 320, sm: 384, md: 448, lg: 512, xl: 576, '2xl': 672, '3xl': 768, '4xl': 896, '5xl': 1024, '6xl': 1152, '7xl': 1280, prose: '65 Zeichen' };
const GEWICHTE = { thin: 100, extralight: 200, light: 300, normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 };
const ZEILENHOEHE = { none: '1', tight: '1,25', snug: '1,375', normal: '1,5', relaxed: '1,625', loose: '2' };
const SPERRUNG = { tighter: '−0,05 em', tight: '−0,025 em', normal: '0', wide: '0,025 em', wider: '0,05 em', widest: '0,1 em' };
const RUNDUNG = { none: 'keine', xs: '2 px', sm: '4 px', '': '4 px', md: '6 px', lg: '8 px', xl: '12 px', '2xl': '16 px', full: 'ganz rund (Kreis bzw. Pille)' };
const SCHATTEN = { '': 'ein leichter Schatten', sm: 'ein kleiner Schatten', md: 'ein mittlerer Schatten', lg: 'ein großer Schatten', xl: 'ein sehr großer Schatten', '2xl': 'ein mächtiger Schatten', none: 'kein Schatten' };

/** Ein Wert in eckigen Klammern: `[10px]`, `[0.16em]`, `[minmax(0,1fr)_20rem]`. */
const frei = (wert) => wert.slice(1, -1).replace(/_/g, ' ');

/** Ein Abstandswert der Tailwind-Skala: 1 Einheit = 4 px. */
function mass(wert) {
  if (wert === undefined || wert === '') return null;
  if (wert.startsWith('[')) return frei(wert);
  if (wert === 'px') return '1 px';
  if (wert === 'full') return 'die volle Größe (100 %)';
  if (wert === 'screen') return 'die ganze Fensterhöhe bzw. -breite';
  if (wert === 'auto') return 'automatisch';
  if (wert === 'fit') return 'so groß wie der Inhalt';
  if (wert === 'min') return 'so klein wie der Inhalt erlaubt';
  if (wert === 'max') return 'so groß wie der Inhalt will';
  if (/^\d+\/\d+$/.test(wert)) {
    const [a, b] = wert.split('/').map(Number);
    return `${zahl(Math.round((a / b) * 1000) / 10)} %`;
  }
  if (/^\d+(\.\d+)?$/.test(wert)) return px(Number(wert) * 4);
  return null;
}

/** Eine Farbe aus dem Namen hinter `text-`, `bg-` …, samt Deckkraft. */
function farbe(name, deckkraft) {
  let raus = null;
  if (name.startsWith('[')) {
    const innen = frei(name);
    const variable = /^var\((--[\w-]+)\)$/.exec(innen);
    raus = variable ? `die Farbe aus der CSS-Variablen ${variable[1]}` : innen;
  } else if (FARBEN[name]) raus = FARBEN[name];
  if (!raus) return null;
  return deckkraft ? `${raus}, zu ${deckkraft} % deckend` : raus;
}

/** Die Seiten eines Abstands: `px` → links und rechts … */
const SEITEN = {
  '': 'rundum',
  x: 'links und rechts',
  y: 'oben und unten',
  t: 'oben',
  r: 'rechts',
  b: 'unten',
  l: 'links',
  s: 'am Anfang',
  e: 'am Ende',
};

/** Der Kern: eine Klasse ohne Vorsätze. `null`, wenn unbekannt. */
function kern(roh, minus) {
  // Deckkraft hinter einem Schrägstrich, aber nicht in Brüchen wie 1/2.
  let name = roh;
  let deckkraft = null;
  const d = /^(.*[a-z\]])\/(\d+)$/.exec(roh);
  if (d && !/^(w|h|inset|top|left|right|bottom|translate-[xy]|basis|max-w|min-w)-/.test(roh)) {
    name = d[1];
    deckkraft = d[2];
  }
  const vz = minus ? '−' : '';

  const fest = {
    flex: 'Flexbox: die Kinder stehen nebeneinander in einer Reihe',
    'inline-flex': 'Flexbox im Textfluss: Kinder nebeneinander, das Element selbst so breit wie nötig',
    grid: 'Raster (Grid): die Kinder werden in Spalten und Zeilen gesetzt',
    block: 'als Block: eine eigene Zeile, volle Breite',
    inline: 'im Textfluss, wie ein Wort',
    'inline-block': 'im Textfluss, aber mit eigener Breite und Höhe',
    hidden: 'unsichtbar (nimmt keinen Platz ein)',
    contents: 'das Element selbst verschwindet, seine Kinder bleiben',
    'flex-1': 'nimmt den übrigen Platz in der Reihe ein',
    'flex-col': 'die Kinder untereinander statt nebeneinander',
    'flex-row': 'die Kinder nebeneinander',
    'flex-wrap': 'zu viele Kinder brechen in die nächste Zeile um',
    'flex-nowrap': 'die Kinder brechen nie um',
    'flex-none': 'weder wachsen noch schrumpfen',
    'flex-auto': 'wächst und schrumpft nach Bedarf',
    grow: 'darf wachsen und den übrigen Platz füllen',
    'shrink-0': 'schrumpft nie – auch wenn es eng wird',
    shrink: 'darf schrumpfen',
    'items-center': 'die Kinder senkrecht mittig',
    'items-start': 'die Kinder oben bündig',
    'items-end': 'die Kinder unten bündig',
    'items-baseline': 'die Kinder an der Grundlinie der Schrift ausgerichtet',
    'items-stretch': 'die Kinder auf volle Höhe gestreckt',
    'justify-center': 'die Kinder waagrecht mittig',
    'justify-between': 'die Kinder an den Rändern verteilt, Platz dazwischen',
    'justify-end': 'die Kinder rechtsbündig',
    'justify-start': 'die Kinder linksbündig',
    'justify-around': 'die Kinder mit gleichem Platz drumherum',
    'self-end': 'dieses Kind unten bzw. am Ende ausgerichtet',
    'self-start': 'dieses Kind oben ausgerichtet',
    'self-center': 'dieses Kind mittig ausgerichtet',
    absolute: 'frei gesetzt (absolute Lage), bezogen auf das nächste umgebende Element mit fester Lage',
    relative: 'Bezugspunkt für frei gesetzte Kinder (relative Lage)',
    fixed: 'am Fenster festgemacht – bleibt beim Rollen stehen',
    sticky: 'klebt beim Rollen am Rand fest',
    static: 'normale Lage im Fluss',
    truncate: 'zu langer Text wird mit „…“ abgeschnitten (eine Zeile)',
    italic: 'kursiv',
    'not-italic': 'nicht kursiv',
    uppercase: 'in Großbuchstaben',
    lowercase: 'in Kleinbuchstaben',
    capitalize: 'jedes Wort mit großem Anfangsbuchstaben',
    'normal-case': 'Groß- und Kleinschreibung wie geschrieben',
    underline: 'unterstrichen',
    'no-underline': 'nicht unterstrichen',
    'line-through': 'durchgestrichen',
    'text-left': 'linksbündig',
    'text-center': 'zentriert',
    'text-right': 'rechtsbündig',
    'text-inherit': 'Schrift wie das umgebende Element',
    'list-disc': 'Aufzählung mit Punkten',
    'list-decimal': 'Aufzählung mit Zahlen',
    'list-none': 'Aufzählung ohne Zeichen',
    'whitespace-nowrap': 'kein Zeilenumbruch',
    'whitespace-pre-wrap': 'Zeilenumbrüche und Leerzeichen wie eingegeben, lange Zeilen brechen trotzdem um',
    'whitespace-pre-line': 'Zeilenumbrüche wie eingegeben',
    'break-words': 'lange Wörter dürfen umbrechen',
    'break-all': 'darf an jeder Stelle umbrechen',
    'overflow-hidden': 'was übersteht, wird abgeschnitten',
    'overflow-auto': 'Rollbalken, wenn der Inhalt zu groß ist',
    'overflow-visible': 'was übersteht, bleibt sichtbar',
    'overflow-y-auto': 'senkrechter Rollbalken, wenn nötig',
    'overflow-x-auto': 'waagrechter Rollbalken, wenn nötig',
    'overflow-x-hidden': 'waagrecht Überstehendes abschneiden',
    'pointer-events-none': 'lässt Klicks durch (reagiert nicht auf die Maus)',
    'pointer-events-auto': 'reagiert wieder auf die Maus',
    'select-none': 'Text lässt sich nicht markieren',
    'select-all': 'ein Klick markiert alles',
    'cursor-pointer': 'Mauszeiger als Hand (anklickbar)',
    'cursor-move': 'Mauszeiger als Kreuz (verschiebbar)',
    'cursor-grab': 'Mauszeiger als greifende Hand (ziehbar)',
    'cursor-grabbing': 'Mauszeiger als zugreifende Hand (wird gezogen)',
    'cursor-default': 'gewöhnlicher Mauszeiger (Pfeil)',
    'cursor-not-allowed': 'Mauszeiger als Verbotsschild',
    'resize-y': 'nur in der Höhe vergrößerbar',
    'resize-none': 'Größe nicht veränderbar',
    'outline-none': 'kein Fokusrahmen des Browsers',
    'appearance-none': 'ohne das eingebaute Aussehen des Browsers',
    'touch-none': 'keine Gesten des Browsers (Rollen, Zoomen) auf diesem Element',
    transition: 'Änderungen (Farbe, Größe …) gleiten weich statt zu springen',
    'transition-colors': 'Farbänderungen gleiten weich',
    'transition-opacity': 'Änderungen der Deckkraft gleiten weich',
    'transition-transform': 'Bewegungen gleiten weich',
    'animate-ping': 'pulsiert nach außen (wie ein Signal)',
    'animate-spin': 'dreht sich ständig',
    'animate-pulse': 'pulsiert sanft',
    'object-cover': 'das Bild füllt den Rahmen und wird dafür beschnitten',
    'object-contain': 'das Bild passt ganz hinein (ohne Beschnitt)',
    'aspect-square': 'quadratisch',
    'aspect-video': 'im Seitenverhältnis 16:9',
    group: 'Markierung als Gruppe (für group-hover: bei Kindern)',
    peer: 'Markierung für Geschwister-Regeln (peer-…)',
    'sr-only': 'unsichtbar, aber für Vorleseprogramme lesbar',
    border: 'ein Rahmen von 1 px rundum',
    'border-0': 'kein Rahmen',
    'border-2': 'ein Rahmen von 2 px rundum',
    'border-dashed': 'Rahmen gestrichelt',
    'border-dotted': 'Rahmen gepunktet',
    'border-solid': 'Rahmen durchgezogen',
    'border-none': 'kein Rahmen',
    'divide-dotted': 'die Trennlinien gepunktet',
    'divide-dashed': 'die Trennlinien gestrichelt',
    ring: 'ein Ring von 1 px um das Element (ein Rahmen, der keinen Platz braucht)',
    'mx-auto': 'waagrecht mittig (gleicher Rand links und rechts)',
    'ml-auto': 'schiebt sich ganz nach rechts',
    'mr-auto': 'schiebt sich ganz nach links',
    'mt-auto': 'schiebt sich ganz nach unten',
    'w-full': 'volle Breite',
    'h-full': 'volle Höhe',
    'w-auto': 'Breite nach Inhalt',
    'h-auto': 'Höhe nach Inhalt',
    'min-h-screen': 'mindestens so hoch wie das Fenster',
    'h-screen': 'so hoch wie das Fenster',
    'w-screen': 'so breit wie das Fenster',
    'min-w-0': 'darf schmaler werden als sein Inhalt (sonst drückt langer Text die Reihe auseinander)',
    'max-w-full': 'nie breiter als das umgebende Element',
    'inset-0': 'füllt das umgebende Element ganz aus (oben, rechts, unten, links: 0)',
    'inset-x-0': 'reicht von links bis rechts',
    'inset-y-0': 'reicht von oben bis unten',
    'leading-none': 'Zeilenhöhe genau Schriftgröße',
  };
  if (!minus && fest[name]) return deckkraft ? `${fest[name]}, zu ${deckkraft} % deckend` : fest[name];

  let m;
  // Schrift
  if ((m = /^font-(.+)$/.exec(name))) {
    if (SCHRIFTEN[m[1]]) return SCHRIFTEN[m[1]];
    if (GEWICHTE[m[1]]) return `Schriftstärke ${GEWICHTE[m[1]]}${m[1] === 'semibold' ? ' (halbfett)' : m[1] === 'bold' ? ' (fett)' : ''}`;
  }
  if ((m = /^text-(.+)$/.exec(name))) {
    const w = m[1];
    if (TEXTGROESSEN[w]) return `Schriftgröße ${TEXTGROESSEN[w]} px`;
    if (w.startsWith('[') && /^\[\d/.test(w)) return `Schriftgröße ${frei(w).replace('px', ' px')}`;
    const f = farbe(w, deckkraft);
    if (f) return `Schriftfarbe: ${f}`;
  }
  if ((m = /^tracking-(.+)$/.exec(name))) {
    return `Buchstabenabstand ${SPERRUNG[m[1]] ?? frei(m[1]).replace('em', ' em').replace('.', ',')}${m[1].startsWith('[') ? ' (gesperrt)' : ''}`;
  }
  if ((m = /^leading-(.+)$/.exec(name))) {
    if (ZEILENHOEHE[m[1]]) return `Zeilenhöhe ${ZEILENHOEHE[m[1]]}-fach`;
    const mm = mass(m[1]);
    if (mm) return `Zeilenhöhe ${mm}`;
  }
  // Farben von Grund, Rahmen, Ring …
  const farbteile = {
    bg: 'Hintergrund',
    border: 'Rahmenfarbe',
    'border-t': 'Rahmenfarbe oben',
    'border-b': 'Rahmenfarbe unten',
    ring: 'Ringfarbe',
    'ring-offset': 'Farbe des Abstands zwischen Element und Ring',
    divide: 'Farbe der Trennlinien',
    placeholder: 'Farbe des Platzhaltertexts',
    accent: 'Farbe von Häkchen und Reglern',
    fill: 'Füllfarbe',
    stroke: 'Linienfarbe',
    shadow: 'Farbe des Schattens',
    outline: 'Farbe des Umrisses',
    decoration: 'Farbe der Unterstreichung',
  };
  for (const [vor, wort] of Object.entries(farbteile).sort((a, b) => b[0].length - a[0].length)) {
    if (name.startsWith(vor + '-')) {
      const f = farbe(name.slice(vor.length + 1), deckkraft);
      if (f) return `${wort}: ${f}`;
    }
  }
  // Rahmen
  if ((m = /^border(?:-([trblxy]))?-(\d+|\[[^\]]+\])$/.exec(name))) {
    return `Rahmen ${SEITEN[m[1] ?? '']}: ${m[2].startsWith('[') ? frei(m[2]).replace('px', ' px') : m[2] + ' px'} stark`;
  }
  if ((m = /^border-([trblxy])$/.exec(name))) return `ein Rahmen von 1 px ${SEITEN[m[1]]}`;
  if ((m = /^rounded(?:-(.+))?$/.exec(name))) {
    const w = m[1] ?? '';
    return `abgerundete Ecken: ${RUNDUNG[w] ?? (w.startsWith('[') ? frei(w).replace('px', ' px') : w)}`;
  }
  if ((m = /^shadow(?:-(.+))?$/.exec(name)) && SCHATTEN[m[1] ?? ''] !== undefined) return SCHATTEN[m[1] ?? ''];
  if ((m = /^ring-(\d+)$/.exec(name))) return `ein Ring von ${m[1]} px um das Element`;
  if ((m = /^ring-offset-(\d+)$/.exec(name))) return `${m[1]} px Abstand zwischen Element und Ring`;
  if ((m = /^divide-([xy])$/.exec(name))) return `Trennlinien zwischen den Kindern (${m[1] === 'y' ? 'waagrecht, zwischen untereinanderstehenden' : 'senkrecht, zwischen nebeneinanderstehenden'})`;
  if ((m = /^opacity-(\d+)$/.exec(name))) return `zu ${m[1]} % deckend (${100 - Number(m[1])} % durchsichtig)`;
  if ((m = /^z-(.+)$/.exec(name))) return `Stapelhöhe ${m[1].startsWith('[') ? frei(m[1]) : m[1]} (je höher, desto weiter vorn)`;
  // Abstände
  if ((m = /^(gap)(?:-([xy]))?-(.+)$/.exec(name))) {
    const w = mass(m[3]);
    if (w) return `Abstand ${m[2] === 'x' ? 'waagrecht ' : m[2] === 'y' ? 'senkrecht ' : ''}zwischen den Kindern: ${w}`;
  }
  if ((m = /^space-([xy])-(.+)$/.exec(name))) {
    const w = mass(m[2]);
    if (w) return `Abstand zwischen ${m[1] === 'y' ? 'untereinanderstehenden' : 'nebeneinanderstehenden'} Kindern: ${w}`;
  }
  if ((m = /^([pm])([xytrblse]?)-(.+)$/.exec(name))) {
    const w = mass(m[3]);
    if (w) return `${m[1] === 'p' ? 'Innenabstand' : 'Außenabstand'} ${SEITEN[m[2]]}: ${vz}${w}`;
  }
  // Größen
  const groessen = { w: 'Breite', h: 'Höhe', 'min-w': 'Mindestbreite', 'min-h': 'Mindesthöhe', 'max-w': 'Höchstbreite', 'max-h': 'Höchsthöhe', size: 'Breite und Höhe', basis: 'Grundbreite' };
  if ((m = /^(min-w|min-h|max-w|max-h|w|h|size|basis)-(.+)$/.exec(name))) {
    let w = m[1] === 'max-w' && BREITEN[m[2]] ? (typeof BREITEN[m[2]] === 'number' ? `${BREITEN[m[2]]} px` : BREITEN[m[2]]) : mass(m[2]);
    if (w) return `${groessen[m[1]]}: ${w}`;
  }
  // Lage
  if ((m = /^(top|right|bottom|left|inset|inset-x|inset-y)-(.+)$/.exec(name))) {
    const w = mass(m[2]);
    const wo = { top: 'vom oberen Rand', right: 'vom rechten Rand', bottom: 'vom unteren Rand', left: 'vom linken Rand', inset: 'von allen Rändern', 'inset-x': 'von links und rechts', 'inset-y': 'von oben und unten' }[m[1]];
    if (w) return `Lage ${wo}: ${vz}${w}`;
  }
  if ((m = /^translate-([xy])-(.+)$/.exec(name))) {
    const w = mass(m[2]);
    if (w) return `verschoben um ${vz}${w} ${m[1] === 'x' ? 'waagrecht' : 'senkrecht'}${m[2] === '1/2' ? ' (die Hälfte der eigenen Größe – zusammen mit left-1/2 genau mittig)' : ''}`;
  }
  if ((m = /^scale-(\d+)$/.exec(name))) return `auf ${m[1]} % verkleinert bzw. vergrößert`;
  if ((m = /^rotate-(\d+)$/.exec(name))) return `um ${vz}${m[1]}° gedreht`;
  // Raster
  if ((m = /^grid-cols-(.+)$/.exec(name))) {
    return m[1].startsWith('[') ? `Spalten des Rasters: ${frei(m[1])}` : `ein Raster mit ${m[1]} gleich breiten Spalten`;
  }
  if ((m = /^grid-rows-(.+)$/.exec(name))) return `ein Raster mit ${m[1]} Zeilen`;
  if ((m = /^col-span-(.+)$/.exec(name))) return m[1] === 'full' ? 'über alle Spalten' : `über ${m[1]} Spalten`;
  if ((m = /^aspect-\[(.+)\]$/.exec(name))) return `Seitenverhältnis ${m[1].replace('/', ':')}`;
  if ((m = /^duration-(\d+)$/.exec(name))) return `Übergang dauert ${m[1]} ms`;
  return null;
}

/**
 * Eine einzelne Klasse erklären.
 *
 * @param {string} klasse   wie im Code, etwa `sm:grid-cols-2` oder `btn-seal`
 * @param {object} [projekt] der Projekt-Index – für die eigenen Klassen
 * @returns {string|null}   die Erklärung, oder null, wenn unbekannt
 */
export function klasse(klasse, projekt) {
  const eigene = projekt?.klasse(klasse);
  if (eigene) {
    const wo = eigene.datei.replace(/^frontend\/src\//, '');
    return eigene.satz ? `eigene Klasse aus ${wo}: „${eigene.satz.replace(/[.:]$/, '')}“` : `eigene Klasse aus ${wo}`;
  }
  // Vorsätze abtrennen – Doppelpunkte in eckigen Klammern zählen nicht.
  const teile = [];
  let tiefe = 0;
  let stueck = '';
  for (const z of klasse) {
    if (z === '[') tiefe += 1;
    if (z === ']') tiefe -= 1;
    if (z === ':' && tiefe === 0) {
      teile.push(stueck);
      stueck = '';
    } else stueck += z;
  }
  const vorsaetze = teile.map((v) => VORSAETZE[v] ?? `bei ${v}`);
  const minus = stueck.startsWith('-');
  const bedeutung = kern(minus ? stueck.slice(1) : stueck, minus);
  if (!bedeutung) return null;
  return vorsaetze.length ? `${vorsaetze.join(', ')}: ${bedeutung}` : bedeutung;
}

/**
 * Eine ganze Klassenliste erklären: `flex gap-2` → „`flex` Flexbox …;
 * `gap-2` Abstand …“.
 *
 * @returns {{ text: string, bekannt: number, unbekannt: number }}
 */
export function klassenErklaeren(text, projekt) {
  const liste = String(text).split(/\s+/).filter(Boolean);
  let bekannt = 0;
  const teile = liste.map((k) => {
    const e = klasse(k, projekt);
    if (e) bekannt += 1;
    return `${code(k, 80)} ${e ?? 'Tailwind-Klasse'}`;
  });
  return { text: teile.join(' · '), bekannt, unbekannt: liste.length - bekannt };
}

/** Sieht ein Text aus wie eine Liste von Klassen (jedes Wort eine bekannte Klasse)? */
export function sindKlassen(text, projekt) {
  const liste = String(text).split(/\s+/).filter(Boolean);
  return liste.length >= 2 && liste.every((k) => klasse(k, projekt));
}
