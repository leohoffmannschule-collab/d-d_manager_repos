/**
 * Wörterbuch: was die eingebauten Teile von JavaScript tun.
 *
 * Drei Listen: globale Namen (`Number`, `setTimeout` …), Methoden an festen
 * Objekten (`Math.max`, `JSON.parse` …) und Methoden an Werten – an Listen,
 * Texten, Maps und Zusagen (`.map`, `.trim`, `.get`, `.then` …). Jeder
 * Eintrag ist eine Wendung, die hinter dem Namen stehen kann:
 * „`map` – wendet eine Funktion auf jedes Element an …“.
 *
 * Erfasst ist, was im Almanach vorkommt; was fehlt, erklärt die Erklärung
 * dann allgemein („ruft die Methode `x` auf“). Wer ein neues Wort benutzt,
 * trägt es hier nach.
 */

/** Globale Funktionen und Klassen. */
export const GLOBALE = {
  Number: 'macht aus einem Wert eine Zahl (aus dem Text "12" wird 12; was keine Zahl ist, wird NaN)',
  String: 'macht aus einem Wert einen Text',
  Boolean: 'macht aus einem Wert wahr oder falsch',
  parseInt: 'liest eine ganze Zahl aus einem Text („12px“ → 12)',
  parseFloat: 'liest eine Kommazahl aus einem Text',
  isNaN: 'prüft, ob etwas „keine Zahl“ (NaN) ist',
  encodeURIComponent: 'macht einen Text adresstauglich (Leerzeichen und Sonderzeichen werden zu %-Folgen)',
  decodeURIComponent: 'macht %-Folgen in einer Adresse wieder zu normalen Zeichen',
  setTimeout: 'führt eine Funktion einmal aus, nachdem die angegebene Zeit (in Millisekunden) verstrichen ist',
  clearTimeout: 'bricht einen mit setTimeout geplanten Aufruf ab, bevor er stattfindet',
  setInterval: 'führt eine Funktion immer wieder aus, jeweils nach der angegebenen Zeit (in Millisekunden)',
  clearInterval: 'beendet eine mit setInterval gestartete Wiederholung',
  queueMicrotask: 'führt eine Funktion aus, sobald der gerade laufende Code fertig ist',
  structuredClone: 'legt eine vollständige, unabhängige Kopie eines Werts an (auch verschachtelt)',
  fetch: 'schickt eine Anfrage über das Netz (HTTP) und liefert eine Zusage (Promise) auf die Antwort',
  require: 'lädt ein Modul auf die ältere Node-Art (CommonJS)',
  Error: 'ein Fehlerobjekt mit einer Meldung; mit `throw` geworfen, unterbricht es den Ablauf bis zum nächsten `catch`',
  TypeError: 'ein Fehler für „falsche Art von Wert“',
  Map: 'eine Zuordnung Schlüssel → Wert (wie ein Wörterbuch; Schlüssel dürfen beliebige Werte sein)',
  Set: 'eine Menge: jeder Wert kommt darin höchstens einmal vor',
  WeakMap: 'eine Zuordnung, deren Schlüssel Objekte sind und vergessen werden dürfen',
  Date: 'ein Zeitpunkt (Datum und Uhrzeit); ohne Angabe: jetzt',
  Promise: 'eine Zusage auf ein Ergebnis, das erst später feststeht (asynchron)',
  RegExp: 'ein Suchmuster (regulärer Ausdruck), aus einem Text gebaut',
  URL: 'eine Webadresse in ihre Teile zerlegt (Protokoll, Rechner, Pfad, Parameter)',
  URLSearchParams: 'die Parameter einer Adresse (?a=1&b=2) als lesbare Liste',
  Uint8Array: 'eine Liste von Bytes (Zahlen von 0 bis 255)',
  TextDecoder: 'macht aus Bytes wieder Text (meist UTF-8)',
  TextEncoder: 'macht aus Text Bytes (UTF-8)',
  Symbol: 'ein einmaliger Kennwert, der mit nichts anderem verwechselt werden kann',
  Array: 'eine Liste',
  Object: 'das Grundobjekt von JavaScript',
  Infinity: 'unendlich (größer als jede Zahl)',
  NaN: '„keine Zahl“ – das Ergebnis einer Rechnung, die keinen Sinn ergibt',
  undefined: '„nicht festgelegt“ – der Wert von etwas, das es (noch) nicht gibt',
  globalThis: 'das globale Objekt – im Browser `window`, in Node `global`',
  AbortController: 'ein Schalter, mit dem man eine laufende Anfrage abbrechen kann',
};

/** Methoden an festen Objekten: `Objekt.methode`. */
export const STATISCH = {
  'Math.max': 'liefert die größte der angegebenen Zahlen',
  'Math.min': 'liefert die kleinste der angegebenen Zahlen',
  'Math.floor': 'rundet ab (3,7 → 3)',
  'Math.ceil': 'rundet auf (3,2 → 4)',
  'Math.round': 'rundet kaufmännisch (3,5 → 4; 3,4 → 3)',
  'Math.trunc': 'schneidet die Nachkommastellen ab (−3,7 → −3)',
  'Math.abs': 'liefert den Betrag (die Zahl ohne Vorzeichen)',
  'Math.random': 'liefert eine Zufallszahl zwischen 0 (einschließlich) und 1 (ausschließlich)',
  'Math.sqrt': 'zieht die Quadratwurzel',
  'Math.hypot': 'berechnet die Länge der Diagonale (Satz des Pythagoras: √(a² + b²))',
  'Math.sign': 'liefert das Vorzeichen: −1, 0 oder 1',
  'Math.pow': 'potenziert (a hoch b)',
  'Math.PI': 'die Kreiszahl π (3,14159…)',
  'JSON.stringify': 'verwandelt einen Wert in JSON-Text (zum Speichern oder Verschicken)',
  'JSON.parse': 'liest JSON-Text und macht daraus wieder Objekte, Listen, Zahlen …',
  'Object.keys': 'liefert die Namen (Schlüssel) aller Felder eines Objekts als Liste',
  'Object.values': 'liefert die Werte aller Felder eines Objekts als Liste',
  'Object.entries': 'liefert alle Felder eines Objekts als Liste von Paaren [Name, Wert]',
  'Object.fromEntries': 'baut aus einer Liste von Paaren [Name, Wert] ein Objekt',
  'Object.assign': 'kopiert die Felder eines oder mehrerer Objekte in ein Zielobjekt',
  'Object.freeze': 'friert ein Objekt ein: Seine Felder lassen sich danach nicht mehr ändern',
  'Object.hasOwn': 'prüft, ob ein Objekt ein Feld mit diesem Namen selbst besitzt',
  'Array.isArray': 'prüft, ob ein Wert eine Liste ist',
  'Array.from': 'baut eine Liste – aus etwas Aufzählbarem (Set, Map, Text) oder einer Länge plus Füllfunktion',
  'Number.isFinite': 'prüft, ob ein Wert eine echte, endliche Zahl ist (nicht NaN, nicht unendlich)',
  'Number.isInteger': 'prüft, ob ein Wert eine ganze Zahl ist',
  'Number.parseInt': 'liest eine ganze Zahl aus einem Text',
  'Date.now': 'liefert den jetzigen Zeitpunkt als Millisekunden seit dem 1. Januar 1970',
  'Promise.all': 'wartet, bis alle Zusagen erfüllt sind, und liefert ihre Ergebnisse als Liste (schlägt eine fehl, schlägt alles fehl)',
  'Promise.resolve': 'liefert eine sofort erfüllte Zusage',
  'Promise.reject': 'liefert eine sofort gescheiterte Zusage',
  'Promise.allSettled': 'wartet, bis alle Zusagen erledigt sind – ob erfüllt oder gescheitert',
  'String.fromCharCode': 'macht aus Zeichennummern Text',
  'console.log': 'schreibt eine Zeile in die Konsole (das Terminal bzw. die Entwicklerwerkzeuge des Browsers)',
  'console.error': 'schreibt eine Fehlermeldung in die Konsole',
  'console.warn': 'schreibt eine Warnung in die Konsole',
  'console.info': 'schreibt eine Mitteilung in die Konsole',
  'AbortSignal.timeout': 'liefert ein Abbruchsignal, das nach der angegebenen Zeit (Millisekunden) auslöst – eine Anfrage wartet dann nicht ewig',
  'Buffer.from': 'macht aus Text, Bytes oder einer Liste einen Puffer (Bytes im Speicher, Node)',
  'Buffer.concat': 'hängt mehrere Puffer (Bytes) zu einem zusammen',
  'Buffer.alloc': 'legt einen Puffer der angegebenen Länge an, mit Nullen gefüllt',
  'Buffer.byteLength': 'zählt, wie viele Bytes ein Text braucht',
  'Symbol.for': 'liefert einen benannten, überall gleichen Kennwert',
};

/**
 * Methoden an Werten. Der Schlüssel ist der Methodenname allein – an welcher
 * Art von Wert sie hängt, entscheidet der Erklärer, wo es darauf ankommt
 * (`.get` an einer Map ist etwas anderes als an einer SQL-Anweisung).
 */
export const METHODEN = {
  // Listen
  map: 'wendet eine Funktion auf jedes Element an und liefert die Ergebnisse als neue Liste (gleich lang wie die alte)',
  filter: 'liefert eine neue Liste mit nur den Elementen, für die die Funktion wahr ergibt',
  find: 'liefert das erste Element, für das die Funktion wahr ergibt (oder undefined)',
  findIndex: 'liefert die Stelle (ab 0) des ersten Elements, für das die Funktion wahr ergibt (oder −1)',
  findLast: 'liefert das letzte Element, für das die Funktion wahr ergibt',
  some: 'prüft, ob mindestens ein Element die Bedingung erfüllt',
  every: 'prüft, ob alle Elemente die Bedingung erfüllen',
  includes: 'prüft, ob der Wert darin vorkommt (Liste oder Text)',
  indexOf: 'liefert die Stelle (ab 0), an der der Wert zuerst vorkommt – oder −1, wenn gar nicht',
  lastIndexOf: 'liefert die Stelle, an der der Wert zuletzt vorkommt – oder −1',
  join: 'fügt alle Elemente einer Liste zu einem Text zusammen, mit dem angegebenen Trennzeichen dazwischen',
  push: 'hängt ein Element hinten an die Liste an (verändert die Liste selbst)',
  pop: 'nimmt das letzte Element aus der Liste heraus und liefert es',
  shift: 'nimmt das erste Element aus der Liste heraus und liefert es',
  unshift: 'fügt ein Element vorne in die Liste ein',
  slice: 'schneidet ein Stück heraus (von – bis ausschließlich) und liefert es als Kopie; das Original bleibt',
  splice: 'entfernt oder ersetzt Elemente mitten in der Liste (verändert sie selbst)',
  sort: 'sortiert die Liste (verändert sie selbst); die Funktion sagt, was vor was kommt',
  toSorted: 'liefert eine sortierte Kopie der Liste',
  reverse: 'kehrt die Reihenfolge um (verändert die Liste selbst)',
  concat: 'hängt Listen aneinander und liefert das Ergebnis als neue Liste',
  flat: 'macht aus einer Liste von Listen eine einzige Liste',
  flatMap: 'wie map, nur dass jedes Ergebnis eine Liste sein darf – alle werden zu einer Liste zusammengefügt',
  forEach: 'führt eine Funktion für jedes Element aus (ohne Ergebnis)',
  reduce: 'fasst alle Elemente nacheinander zu einem einzigen Wert zusammen (etwa einer Summe)',
  at: 'liefert das Element an der Stelle; negative Zahlen zählen von hinten (−1 ist das letzte)',
  fill: 'füllt die Liste mit einem Wert',
  entries: 'liefert alle Einträge als Paare [Schlüssel, Wert]',
  keys: 'liefert alle Schlüssel',
  values: 'liefert alle Werte',
  // Texte
  trim: 'entfernt Leerzeichen und Zeilenumbrüche am Anfang und Ende',
  trimStart: 'entfernt Leerraum am Anfang',
  trimEnd: 'entfernt Leerraum am Ende',
  split: 'zerlegt einen Text an jedem Vorkommen des Trennzeichens in eine Liste von Stücken',
  replace: 'ersetzt das Gesuchte (Text oder Suchmuster) im Text durch etwas anderes und liefert den neuen Text',
  replaceAll: 'ersetzt jedes Vorkommen des Gesuchten im Text',
  startsWith: 'prüft, ob der Text mit dem angegebenen Stück beginnt',
  endsWith: 'prüft, ob der Text mit dem angegebenen Stück endet',
  toLowerCase: 'liefert den Text in Kleinbuchstaben',
  toUpperCase: 'liefert den Text in Großbuchstaben',
  toLocaleLowerCase: 'liefert den Text in Kleinbuchstaben (nach den Regeln der Sprache)',
  padStart: 'füllt den Text vorne auf die gewünschte Länge auf (etwa mit Nullen: 7 → 07)',
  padEnd: 'füllt den Text hinten auf die gewünschte Länge auf',
  repeat: 'wiederholt den Text so oft wie angegeben',
  charAt: 'liefert das Zeichen an der angegebenen Stelle',
  charCodeAt: 'liefert die Nummer des Zeichens an der angegebenen Stelle',
  codePointAt: 'liefert die Unicode-Nummer des Zeichens an der Stelle',
  match: 'sucht das Muster im Text und liefert die Treffer (oder null)',
  matchAll: 'findet alle Stellen, an denen das Muster passt – jede mit ihren Gruppen',
  search: 'liefert die Stelle, an der das Muster zuerst passt (oder −1)',
  localeCompare: 'vergleicht zwei Texte nach den Regeln der Sprache (für alphabetisches Sortieren: ä bei a)',
  normalize: 'bringt Sonderzeichen in eine einheitliche Form (wichtig zum Vergleichen)',
  substring: 'liefert ein Stück des Texts (von – bis ausschließlich)',
  // Suchmuster
  test: 'prüft, ob das Suchmuster irgendwo im Text passt (wahr/falsch)',
  exec: 'wendet das Suchmuster einmal an und liefert den Treffer samt Gruppen (oder null)',
  // Zahlen und Zeitpunkte
  toFixed: 'schreibt die Zahl mit genau so vielen Nachkommastellen (als Text)',
  toString: 'macht aus dem Wert einen Text',
  toISOString: 'schreibt den Zeitpunkt im internationalen Format (2026-10-01T12:00:00.000Z)',
  toLocaleDateString: 'schreibt das Datum so, wie man es in der angegebenen Sprache liest (1. Oktober 2026)',
  toLocaleTimeString: 'schreibt die Uhrzeit so, wie man sie in der Sprache liest (12:30)',
  toLocaleString: 'schreibt den Wert landesüblich (Zahlen mit Tausenderpunkt, Datum mit Uhrzeit)',
  getTime: 'liefert den Zeitpunkt als Millisekunden seit 1970 – gut zum Rechnen und Vergleichen',
  getFullYear: 'liefert die Jahreszahl',
  getUTCFullYear: 'liefert die Jahreszahl in Weltzeit (UTC)',
  // Maps und Mengen
  get: 'holt den Wert zum angegebenen Schlüssel (oder undefined, wenn es keinen gibt)',
  set: 'legt zum Schlüssel einen Wert ab (ein vorhandener wird ersetzt)',
  has: 'prüft, ob es diesen Schlüssel bzw. diesen Wert gibt',
  delete: 'entfernt den Eintrag mit diesem Schlüssel bzw. Wert',
  add: 'fügt der Menge einen Wert hinzu (doppelt kommt er nie vor)',
  clear: 'leert die Sammlung vollständig',
  // Zusagen (Promises)
  // Ein Wörterbucheintrag, kein Versprechen – die Regel gegen `then` in Objekten meint anderes.
  // eslint-disable-next-line unicorn/no-thenable
  then: 'legt fest, was geschieht, sobald die Zusage erfüllt ist (das Ergebnis kommt als Argument)',
  catch: 'legt fest, was geschieht, wenn die Zusage scheitert (fängt den Fehler auf)',
  finally: 'läuft am Ende in jedem Fall – ob erfüllt oder gescheitert',
  // Funktionen
  call: 'ruft die Funktion mit einem bestimmten `this` und einzelnen Argumenten auf',
  apply: 'ruft die Funktion mit einem bestimmten `this` und einer Liste von Argumenten auf',
  bind: 'liefert eine Kopie der Funktion mit fest eingebautem `this`',
};

/**
 * Eigenschaften (ohne Klammern), die so oft vorkommen, dass ein Hinweis
 * lohnt.
 */
export const EIGENSCHAFTEN = {
  length: 'die Länge: Anzahl der Einträge einer Liste bzw. der Zeichen eines Texts',
  size: 'die Anzahl der Einträge einer Map oder Menge',
  current: 'der aktuelle Inhalt eines Ref (siehe useRef) – ändert man ihn, wird nicht neu gezeichnet',
  target: 'das Element, an dem das Ereignis ausgelöst wurde (etwa das Eingabefeld)',
  message: 'die Meldung eines Fehlers',
};

/** Die Operatoren, wie sie in einer Erklärung heißen. */
export const OPERATOREN = {
  '===': 'genau gleich',
  '!==': 'ungleich',
  '==': 'gleich (locker verglichen)',
  '!=': 'ungleich (locker verglichen)',
  '<': 'kleiner als',
  '<=': 'höchstens',
  '>': 'größer als',
  '>=': 'mindestens',
  '+': 'plus (bei Texten: aneinandergehängt)',
  '-': 'minus',
  '*': 'mal',
  '/': 'geteilt durch',
  '%': 'Rest beim Teilen durch (Modulo)',
  '**': 'hoch',
  '&&': 'und',
  '||': 'oder',
  '??': 'ersatzweise, wenn links nichts steht',
  in: 'ist enthalten in',
  instanceof: 'ist eine Instanz von',
  '&': 'bitweise und',
  '|': 'bitweise oder',
  '<<': 'Bits nach links verschoben um',
  '>>': 'Bits nach rechts verschoben um',
  '>>>': 'Bits nach rechts verschoben (ohne Vorzeichen) um',
  '^': 'bitweise exklusiv-oder',
};

/**
 * Sprachmittel, die ein Hinweis beim ersten Vorkommen in einer Datei
 * erklärt. Der Schlüssel ist das, was im Code steht.
 */
export const SPRACHMITTEL = {
  '?.': '`?.` (optionale Verkettung): geht nur weiter, wenn links etwas steht; sonst ist das Ergebnis undefined statt eines Fehlers',
  '??': '`??` (Ersatzwert): nimmt den rechten Wert, wenn der linke null oder undefined ist (0 und leerer Text bleiben stehen)',
  '...': '`...` (Spread): schüttet die Einträge einer Liste bzw. die Felder eines Objekts an dieser Stelle aus',
  '=>': '`=>` (Pfeilfunktion): eine kurze Schreibweise für eine Funktion – links die Parameter, rechts der Körper',
  '`': '`` `…${x}…` `` (Vorlagentext): ein Text, in den Werte mit ${…} eingesetzt werden; darf mehrere Zeilen umfassen',
  zerlegung: 'Zerlegung (Destrukturierung): holt mehrere Felder auf einmal aus einem Objekt bzw. einer Liste und legt sie als eigene Namen an',
  async: '`async` (asynchron): Die Funktion darf mit `await` auf Ergebnisse warten, die erst später kommen; sie selbst liefert eine Zusage (Promise)',
  await: '`await`: wartet, bis die Zusage (Promise) erfüllt ist, und liefert ihr Ergebnis – der übrige Almanach läuft derweil weiter',
  ternaer: '`a ? b : c` (Bedingungsoperator): wenn a zutrifft, b – sonst c; die Kurzform eines if/else, die einen Wert liefert',
  const: '`const`: ein Name, der nicht neu belegt werden kann (der Inhalt eines Objekts darf sich trotzdem ändern)',
  let: '`let`: ein Name, dessen Wert später neu gesetzt werden darf',
  export: '`export` (Ausfuhr): macht den Namen für andere Dateien sichtbar; sie holen ihn mit `import`',
  import: '`import` (Einfuhr): holt Namen aus einer anderen Datei oder einem Paket',
  default: '`export default` (Standardausfuhr): das, was eine Datei hauptsächlich anbietet; beim Einführen darf man es beliebig nennen',
  regex: 'Suchmuster (regulärer Ausdruck) zwischen zwei Schrägstrichen: eine kleine Sprache zum Finden von Textstellen (`\\d` Ziffer, `\\s` Leerraum, `+` einmal oder öfter, `*` beliebig oft, `?` vielleicht, `^` Anfang, `$` Ende, `(…)` Gruppe)',
  try: '`try … catch`: Geht im try-Teil etwas schief (ein Fehler wird geworfen), läuft statt eines Absturzes der catch-Teil',
  throw: '`throw`: wirft einen Fehler – der Ablauf springt zum nächsten umgebenden catch (oder bricht ab)',
  forof: '`for (… of …)`: geht die Einträge einer Liste (oder Map, Menge, eines Texts) der Reihe nach durch',
  'import.meta.url': '`import.meta.url`: die Adresse dieser Datei selbst (file:///…) – daraus lässt sich der eigene Ordner bestimmen',
};
