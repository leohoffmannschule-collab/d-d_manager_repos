/**
 * Wörterbuch: React, React Router und die Attribute im JSX.
 *
 * React ist die Bibliothek, mit der die Oberfläche gebaut ist: Eine
 * Komponente ist eine Funktion, die beschreibt, was auf dem Bildschirm
 * stehen soll (JSX); ändert sich ihr Zustand, ruft React sie erneut auf und
 * bringt den Bildschirm auf den neuen Stand. Die „Hooks“ (alles, was mit
 * `use` beginnt) sind die Werkzeuge, mit denen eine Komponente sich etwas
 * merkt oder auf etwas reagiert.
 *
 * Die Attribute stehen hier, weil React sie anders schreibt als HTML
 * (`className` statt `class`, `onClick` statt `onclick`).
 */

/** Was die Pakete react, react-dom und react-router-dom anbieten. */
export const REACT = {
  useState:
    'Hook für einen Zustand: Die Komponente merkt sich einen Wert über das Neuzeichnen hinweg. Liefert ein Paar [Wert, Setzer]; wer den Setzer aufruft, ändert den Wert, und React zeichnet die Komponente neu',
  useEffect:
    'Hook für eine Nebenwirkung: Die Funktion läuft, nachdem React gezeichnet hat – etwa um Daten zu laden oder einen Zuhörer anzumelden. Die Liste dahinter (Abhängigkeiten) sagt, wann sie erneut läuft; was die Funktion zurückgibt, räumt vorher wieder auf',
  useLayoutEffect:
    'wie useEffect, läuft aber noch bevor der Browser das Bild zeigt – für Messungen am Layout, die sonst kurz flackern würden',
  useMemo: 'Hook zum Merken eines berechneten Werts: Die Rechnung läuft nur neu, wenn sich eine der Abhängigkeiten ändert',
  useCallback:
    'Hook zum Merken einer Funktion: Sie bleibt dieselbe, solange sich die Abhängigkeiten nicht ändern – sonst entstünde bei jedem Zeichnen eine neue',
  useRef:
    'Hook für einen Merkzettel, der das Neuzeichnen übersteht, ohne es auszulösen (`.current`); auch der Weg zu einem echten HTML-Element',
  useContext: 'Hook, der einen Wert aus einem Kontext holt – einem Wert, den eine Komponente weiter oben für alle darunter bereitstellt',
  createContext: 'legt einen Kontext an: einen Kanal, über den Komponenten weiter oben allen darunter einen Wert geben können, ohne ihn durch jede Ebene zu reichen',
  useReducer: 'Hook für einen Zustand, der über eine Funktion (Reducer) geändert wird',
  useId: 'Hook, der eine eindeutige Kennung liefert – etwa um ein Beschriftungsfeld mit seinem Eingabefeld zu verbinden',
  useSyncExternalStore: 'Hook, der einen Wert von außerhalb von React abonniert und bei Änderung neu zeichnet',
  useTransition: 'Hook, mit dem sich eine Änderung als „nicht eilig“ markieren lässt',
  useDeferredValue: 'Hook, der einen Wert verzögert weitergibt, damit Eingaben flüssig bleiben',
  Fragment: 'eine Gruppe ohne eigenes HTML-Element (kurz <>…</>)',
  StrictMode: 'ein Prüfmodus für die Entwicklung: React ruft manches doppelt auf, um Fehler früh zu zeigen (im fertigen Almanach wirkungslos)',
  Suspense: 'zeigt einen Platzhalter, solange etwas darunter noch lädt',
  lazy: 'lädt eine Komponente erst, wenn sie gebraucht wird',
  memo: 'merkt sich eine Komponente: Sie wird nur neu gezeichnet, wenn sich ihre Props ändern',
  forwardRef: 'reicht einen ref von außen an ein Element im Inneren der Komponente durch',
  createElement: 'erzeugt ein React-Element (das, was JSX im Hintergrund aufruft)',
  createRoot: 'legt die Wurzel an, in die React die ganze Oberfläche zeichnet; `.render(…)` zeichnet hinein',
  // React Router
  BrowserRouter: 'der Rahmen, der die Adresse im Browser (den Pfad) mit der Oberfläche verbindet',
  Routes: 'die Liste der Seiten: zeigt die eine <Route>, deren Pfad zur Adresse passt',
  Route: 'eine Seite: Pfad (path) und was dann erscheint (element)',
  Link: 'ein Verweis auf eine andere Seite, ohne dass der Browser die Seite neu lädt',
  NavLink: 'ein Link, der weiß, ob er gerade die aktuelle Seite ist (für die Hervorhebung in der Navigation)',
  Navigate: 'leitet sofort auf einen anderen Pfad um, sobald es gezeichnet wird',
  Outlet: 'die Stelle, an der eine verschachtelte Unterseite erscheint',
  useNavigate: 'Hook, der eine Funktion zum Wechseln der Seite liefert (`navigate("/pfad")`)',
  useParams: 'Hook, der die Platzhalter aus dem Pfad liefert (aus /charaktere/:id wird { id })',
  useLocation: 'Hook, der die aktuelle Adresse liefert (Pfad, Parameter)',
  useSearchParams: 'Hook für die Parameter hinter dem ? in der Adresse',
};

/**
 * Ereignis-Attribute: wann die angegebene Funktion aufgerufen wird.
 * React übergibt ihr dabei ein Ereignisobjekt (oft `e` genannt).
 */
export const EREIGNISSE = {
  onClick: 'beim Klick (oder Tippen)',
  onDoubleClick: 'beim Doppelklick',
  onContextMenu: 'beim Rechtsklick bzw. langen Drücken',
  onChange: 'bei jeder Änderung des Werts (bei Textfeldern: bei jedem Tastendruck)',
  onInput: 'bei jeder Eingabe',
  onSubmit: 'beim Abschicken des Formulars (Eingabetaste oder Knopf vom Typ submit)',
  onKeyDown: 'beim Drücken einer Taste',
  onKeyUp: 'beim Loslassen einer Taste',
  onBlur: 'wenn das Feld den Fokus verliert (man woanders hinklickt)',
  onFocus: 'wenn das Feld den Fokus bekommt',
  onPointerDown: 'beim Aufsetzen von Maus, Finger oder Stift',
  onPointerMove: 'bei jeder Bewegung des Zeigers',
  onPointerUp: 'beim Loslassen',
  onPointerCancel: 'wenn das Berühren abgebrochen wird (etwa weil das Gerät scrollt)',
  onPointerLeave: 'wenn der Zeiger das Element verlässt',
  onPointerEnter: 'wenn der Zeiger das Element betritt',
  onMouseEnter: 'wenn die Maus über das Element fährt',
  onMouseLeave: 'wenn die Maus das Element verlässt',
  onMouseDown: 'beim Drücken der Maustaste',
  onDragStart: 'wenn das Ziehen beginnt',
  onDragOver: 'während etwas über das Element gezogen wird',
  onDrop: 'wenn etwas auf dem Element abgelegt wird',
  onLoad: 'wenn das Bild bzw. die Datei fertig geladen ist',
  onError: 'wenn das Laden fehlschlägt',
  onScroll: 'beim Rollen des Inhalts',
  onWheel: 'beim Drehen des Mausrads',
  onToggle: 'beim Auf- oder Zuklappen',
};

/** Die übrigen Attribute im JSX – was sie bewirken. */
export const ATTRIBUTE = {
  key: 'Schlüssel für React: In einer Liste von Elementen braucht jedes einen eindeutigen key, damit React beim Neuzeichnen weiß, welches welches ist',
  ref: 'verbindet das echte HTML-Element mit einem Ref (siehe useRef), damit der Code es direkt ansprechen kann',
  className: 'die CSS-Klassen des Elements (in HTML heißt das Attribut class)',
  htmlFor: 'verbindet eine Beschriftung mit dem Eingabefeld dieser id (in HTML: for)',
  value: 'der angezeigte Wert; zusammen mit onChange ein „kontrolliertes“ Feld: React bestimmt, was darin steht',
  defaultValue: 'der Anfangswert eines Feldes, das danach sich selbst überlassen bleibt',
  checked: 'ob das Kästchen angehakt ist',
  defaultChecked: 'ob das Kästchen anfangs angehakt ist',
  disabled: 'schaltet das Element ab: nicht anklickbar, nicht änderbar',
  readOnly: 'das Feld zeigt seinen Wert, lässt sich aber nicht ändern',
  autoFocus: 'setzt den Cursor beim Erscheinen gleich in dieses Feld',
  autoComplete: 'sagt dem Browser, ob und womit er das Feld vorausfüllen darf',
  inputMode: 'welche Bildschirmtastatur das Tablet zeigt (numeric: nur Ziffern)',
  placeholder: 'grauer Hinweistext, solange das Feld leer ist',
  type: 'die Art des Elements (bei Knöpfen: button – ein gewöhnlicher Knopf, submit – schickt das Formular ab; bei Feldern: text, number, password, checkbox, file …)',
  name: 'der Name des Feldes',
  id: 'eine eindeutige Kennung des Elements auf der Seite',
  title: 'Hinweistext, der erscheint, wenn man mit der Maus darauf verweilt',
  alt: 'Ersatztext für ein Bild (für Vorleseprogramme und falls das Bild fehlt)',
  src: 'die Adresse des Bildes bzw. der Datei',
  href: 'das Ziel des Verweises',
  target: 'wo der Verweis sich öffnet (_blank: in einem neuen Fenster/Tab)',
  rel: 'die Art der Beziehung zum Ziel (noopener noreferrer: das neue Fenster erfährt nichts über diese Seite)',
  role: 'die Rolle des Elements für Vorleseprogramme',
  tabIndex: 'ob und in welcher Reihenfolge das Element mit der Tab-Taste erreichbar ist',
  draggable: 'ob man das Element ziehen kann',
  multiple: 'erlaubt die Auswahl mehrerer Einträge bzw. Dateien',
  accept: 'welche Dateiarten die Dateiauswahl anbietet',
  min: 'der kleinste erlaubte Wert',
  max: 'der größte erlaubte Wert',
  step: 'die Schrittweite der Zahl (Pfeiltasten, Drehfeld)',
  rows: 'wie viele Zeilen das Textfeld anfangs hoch ist',
  maxLength: 'wie viele Zeichen höchstens eingegeben werden dürfen',
  list: 'verbindet das Feld mit einer <datalist> von Vorschlägen',
  width: 'die Breite',
  height: 'die Höhe',
  loading: 'lazy: das Bild erst laden, wenn es in Sichtweite kommt',
  children: 'der Inhalt zwischen öffnendem und schließendem Tag',
  to: 'das Ziel des Links (ein Pfad innerhalb des Almanachs)',
  element: 'was auf dieser Seite erscheint',
  path: 'der Pfad, zu dem diese Seite gehört',
  end: 'der Link gilt nur bei genau diesem Pfad als aktiv, nicht bei Unterseiten',
  replace: 'die Umleitung ersetzt den Eintrag im Verlauf (der Zurück-Knopf führt nicht wieder hierher)',
  'aria-label': 'Beschriftung für Vorleseprogramme, wenn sichtbar kein Text dasteht (etwa bei Knöpfen mit nur einem Symbol)',
  'aria-hidden': 'blendet das Element für Vorleseprogramme aus (es ist nur Schmuck)',
  'aria-live': 'Vorleseprogramme sagen Änderungen in diesem Bereich von selbst an',
  'aria-expanded': 'sagt Vorleseprogrammen, ob der zugehörige Bereich aufgeklappt ist',
  'aria-pressed': 'sagt Vorleseprogrammen, ob der Schalter gedrückt ist',
  'aria-current': 'markiert für Vorleseprogramme das aktuelle Element (etwa die aktuelle Seite)',
  // SVG
  viewBox: 'das Koordinatensystem der Zeichnung (x y Breite Höhe) – die Zeichnung skaliert auf jede Größe',
  d: 'der Zeichenpfad: Befehle wie M (gehe zu), L (Linie), C (Kurve), A (Bogen), Z (schließen)',
  fill: 'die Füllfarbe',
  stroke: 'die Linienfarbe',
  strokeWidth: 'die Linienstärke',
  strokeLinecap: 'wie Linienenden aussehen (round: abgerundet)',
  strokeLinejoin: 'wie Ecken aussehen (round: abgerundet)',
  strokeDasharray: 'gestrichelte Linie: Länge von Strich und Lücke',
  cx: 'die x-Koordinate des Kreismittelpunkts',
  cy: 'die y-Koordinate des Kreismittelpunkts',
  r: 'der Radius des Kreises',
  x: 'die x-Koordinate',
  y: 'die y-Koordinate',
  x1: 'x-Koordinate des Anfangspunkts',
  y1: 'y-Koordinate des Anfangspunkts',
  x2: 'x-Koordinate des Endpunkts',
  y2: 'y-Koordinate des Endpunkts',
  points: 'die Eckpunkte (x,y x,y …)',
  xmlns: 'der Namensraum von SVG – sagt dem Browser, dass es sich um eine Zeichnung handelt',
};
