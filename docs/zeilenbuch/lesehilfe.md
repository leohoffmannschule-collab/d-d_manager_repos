# Lesehilfe

Der Almanach ist in mehreren Sprachen geschrieben, jede für ihren Zweck. Dieses Kapitel stellt sie kurz vor – gerade so weit, dass die Erklärungen im Buch verständlich werden. Die Beispiele stammen aus dem Almanach selbst.

## JavaScript

Fast der ganze Almanach ist JavaScript: der Server (er läuft in **Node**, dem Programm, das JavaScript außerhalb des Browsers ausführt), die Werkzeuge und die Oberfläche (sie läuft im Browser).

**Namen und Werte.** `const name = 'Elara';` legt einen Namen fest, der nicht neu belegt werden kann; `let zaehler = 0;` einen, der sich ändern darf. Werte sind Zahlen (`13`), Texte (`'Elara'` oder `"Elara"`), Wahrheitswerte (`true`, `false`), `null` (bewusst nichts) und `undefined` (noch nicht festgelegt).

**Objekte und Listen.** Ein Objekt fasst benannte Felder zusammen: `{ name: 'Elara', stufe: 5 }`; gelesen wird mit einem Punkt: `held.name`. Eine Liste (Array) reiht Werte auf: `[1, 2, 3]`; gelesen wird mit der Stelle ab 0: `liste[0]`.

**Funktionen.** Eine Funktion ist ein benannter Ablauf, dem man Werte mitgibt:

```
function bonus(wert) {
  return Math.floor((wert - 10) / 2);
}
```

Die Kurzform heißt *Pfeilfunktion*: `const bonus = (wert) => Math.floor((wert - 10) / 2);`. Links vom Pfeil stehen die Parameter, rechts das, was herauskommt.

**Bedingungen.** `if (liste.length === 0) { … } else { … }` führt den einen oder den anderen Block aus. Die Kurzform, die einen Wert liefert, heißt Bedingungsoperator: `istDm ? 'Spielleitung' : 'Spieler'`. `===` heißt „genau gleich“, `!==` „ungleich“, `&&` „und“, `||` „oder“, `!` „nicht“.

**Schleifen und Listenmethoden.** `for (const held of helden) { … }` geht eine Liste durch. Häufiger sind Methoden, die eine Funktion auf jeden Eintrag anwenden: `helden.map((h) => h.name)` macht aus Helden ihre Namen, `helden.filter((h) => h.hp > 0)` behält nur die Lebenden, `helden.find(…)` sucht den ersten passenden.

**Module.** Jede Datei ist ein Modul. Was andere Dateien benutzen dürfen, wird mit `export` ausgeführt; wer es braucht, holt es mit `import { bonus } from './regeln.js';`.

**Warten auf Ergebnisse.** Manches dauert: eine Anfrage an den Server, das Lesen einer Datei. Solche Funktionen liefern eine *Zusage* (Promise) auf ein Ergebnis. Mit `await` wartet man darauf, ohne dass der Rest stehen bleibt; eine Funktion, die das darf, ist `async`.

**Fehler.** `throw new Error('…')` bricht den Ablauf mit einer Meldung ab. `try { … } catch (fehler) { … }` fängt einen solchen Abbruch auf.

**Neuere Kurzschreibweisen**, die im Almanach oft vorkommen: `held?.name` (nur weitergehen, wenn `held` existiert), `wert ?? 0` (0, wenn `wert` fehlt), `{ ...alt, name }` (alle Felder von `alt` übernehmen und `name` ersetzen), `const { name, stufe } = held;` (mehrere Felder auf einmal herausholen – *Zerlegung*), `` `Stufe ${stufe}` `` (ein Text mit eingesetztem Wert – *Vorlagentext*).

## JSX und React

Die Oberfläche ist mit **React** gebaut. Ihr Baustein ist die **Komponente**: eine Funktion, die beschreibt, was auf dem Bildschirm stehen soll – in **JSX**, einer Schreibweise, die aussieht wie HTML, aber JavaScript ist:

```
export default function Wurfknopf({ label, modifier, name }) {
  return (
    <button type="button" onClick={() => blattWurf(name, modifier)}>
      {label}
    </button>
  );
}
```

- Kleingeschriebene Namen (`<button>`, `<div>`) sind HTML-Elemente; großgeschriebene (`<Wurfknopf>`) sind Komponenten.
- Die Werte, die eine Komponente von außen bekommt, heißen **Props** (`label`, `modifier`, `name`).
- In geschweiften Klammern `{…}` steht wieder JavaScript; sein Ergebnis erscheint an dieser Stelle.
- `onClick={…}` bekommt eine *Funktion*, die React beim Klick aufruft.

**Zustand.** `const [offen, setOffen] = useState(false);` gibt einer Komponente ein Gedächtnis: `offen` ist der Wert, `setOffen(true)` ändert ihn – und React ruft die Komponente daraufhin neu auf und bringt den Bildschirm auf den neuen Stand. Alles, was mit `use` beginnt, ist ein **Hook**: `useEffect` (etwas tun, nachdem gezeichnet wurde, etwa Daten laden), `useRef` (ein Merkzettel, der das Neuzeichnen übersteht), `useMemo` und `useCallback` (Gerechnetes bzw. Funktionen merken), `useContext` (einen Wert holen, den eine Komponente weiter oben bereitstellt).

**Listen und Bedingungen im Markup.** `{helden.map((h) => <li key={h.id}>{h.name}</li>)}` macht aus einer Liste Elemente; jedes braucht einen eindeutigen `key`. `{fehler && <p>{fehler}</p>}` zeigt etwas nur, wenn `fehler` etwas enthält; `{laedt ? <Lade /> : <Liste />}` zeigt das eine oder das andere.

**Aussehen.** `className="flex items-center gap-2 text-rubric"` gibt einem Element CSS-Klassen. Die meisten stammen von **Tailwind**: Jede Klasse ist ein kleiner Baustein (`flex`: Kinder nebeneinander, `gap-2`: 8 Pixel Abstand, `text-rubric`: rote Schrift). Die Farbnamen (`ink`, `rubric`, `gold` …) legt `frontend/src/stile/farben.css` fest, einmal für Pergament und einmal für Kerzenlicht. Daneben gibt es eigene Klassen des Almanachs (`btn`, `panel`, `field-box`) in den Stilblättern unter `frontend/src/stile/`. Das Buch erklärt jede einzelne Klasse.

## Node und Express

Der Server ist ein Node-Programm mit **Express**. Er nimmt Anfragen entgegen und beantwortet sie. Ein **Weg** (Route) verbindet eine Methode und einen Pfad mit dem Code, der die Antwort schreibt:

```
router.post('/', (req, res) => {
  …
  res.status(201).json(rowToCharacter(row));
});
```

- Die Methoden: `GET` liest, `POST` legt an oder löst aus, `PUT` ersetzt, `PATCH` ändert einzelne Felder, `DELETE` löscht.
- `req` ist die Anfrage (mit `req.params`, `req.body`, `req.user`), `res` die Antwort.
- Der **Statuscode** sagt, wie es ausging: 200 in Ordnung, 201 angelegt, 400 fehlerhafte Anfrage, 401 nicht angemeldet, 403 nicht berechtigt, 404 gibt es nicht.
- **Zwischenschritte** (Middleware) laufen vor den Wegen; manche sind **Wächter**, die prüfen, ob jemand angemeldet ist (`requireAuth`), eine Kampagne gewählt hat (`requireCampaign`) oder die Spielleitung führt (`requireDm`).
- Der **Live-Kanal** (Server-Sent Events, SSE) ist eine Verbindung, über die der Server von sich aus Nachrichten an alle offenen Fenster schickt – so sieht die Runde sofort, wenn jemand würfelt.

## SQL

Der Server speichert alles in einer **SQLite**-Datenbank. Mit ihr spricht er in **SQL**:

```
SELECT id, name FROM characters WHERE campaign_id = ? ORDER BY name
```

liest die Spalten `id` und `name` aus der Tabelle `characters`, nur die Zeilen der Kampagne, sortiert nach Namen. `INSERT INTO` fügt eine Zeile ein, `UPDATE … SET` ändert, `DELETE FROM` löscht. Die **Fragezeichen sind Platzhalter**: Der Code füllt sie beim Ausführen mit Werten (`.get(…)`, `.all(…)`, `.run(…)`), und so kann kein eingegebener Text die Anweisung selbst verändern. Eine **Transaktion** fasst mehrere Änderungen zusammen, die nur gemeinsam gelten – ganz oder gar nicht.

Die Tabellen selbst legt `CREATE TABLE` an, Spalte für Spalte mit ihrer Art: `TEXT`, `INTEGER` (ganze Zahl), `REAL` (Kommazahl). `NOT NULL` heißt: muss gefüllt sein; `DEFAULT` gibt eine Vorgabe; `REFERENCES` verweist auf eine andere Tabelle.

## CSS

Ein **Stilblatt** sagt, wie etwas aussieht. Eine Regel besteht aus einem Selektor (wen sie betrifft) und Deklarationen (Eigenschaft: Wert):

```
.panel {
  background-color: var(--color-panel);
  border: 1px solid var(--color-rule);
}
```

`.panel` meint alle Elemente mit der Klasse `panel`. `var(--color-panel)` liest eine **CSS-Variable** – ein benannter Wert, der an einer Stelle festgelegt wird. `@media` macht Regeln von Bedingungen abhängig (Fensterbreite, Druck), `@page` legt das Papierformat für den Druck fest.

## HTML und SVG

HTML beschreibt, was auf einer Seite steht: Elemente in spitzen Klammern (`<p>…</p>`), mit Attributen (`<img src="…" alt="…">`). Im Almanach gibt es nur wenige HTML-Dateien – `frontend/index.html`, in die React die Oberfläche zeichnet, und die Entwürfe in `design/`; dazu HTML, das der Code als Text erzeugt (das mitgenommene Blatt, die Handbücher). **SVG** ist dieselbe Schreibweise für Zeichnungen: `<path d="…">` ist ein Linienzug, der ohne Unschärfe auf jede Größe skaliert.

## Kommandozeile, Docker, Einstellungen

- **Shell-Skripte** (`.sh`) und **Stapeldateien** (`.cmd`) sind Listen von Befehlen für die Kommandozeile von macOS/Linux bzw. Windows. Im Almanach prüfen sie nur, ob Node da ist, und starten dann ein Skript in `scripts/`.
- Das **Dockerfile** ist das Rezept für ein Docker-Abbild: ein fertiges kleines Linux mit allem, was der Almanach braucht. **docker-compose.yml** (in **YAML**, wo die Einrückung die Gliederung trägt) sagt, welche Behälter daraus gestartet werden.
- **JSON** ist ein Datenformat aus Objekten und Listen; `package.json` ist die Paketliste mit den Befehlen für `npm run …`.
- **Umgebungsvariablen** sind Einstellungen, die einem Programm von außen mitgegeben werden (`PORT=3001`); der Code liest sie mit `process.env.PORT`.

## Begriffe

| Begriff | Bedeutung |
|---|---|
| Ausfuhr / Einfuhr | `export` macht etwas für andere Dateien sichtbar, `import` holt es herein. |
| Effekt | Ein Ablauf, den React nach dem Zeichnen startet (`useEffect`), etwa um Daten zu laden. |
| Hook | Eine Funktion mit `use…` am Anfang, die einer Komponente Zustand oder Effekte gibt. |
| Komponente | Eine Funktion der Oberfläche, die JSX liefert – ein Baustein des Bildschirms. |
| Kontext | Ein Wert, den eine Komponente allen darunter bereitstellt (`createContext`, `useContext`). |
| Live-Kanal | Die dauernde Verbindung, über die der Server Änderungen an alle Fenster schickt (SSE). |
| Middleware / Zwischenschritt | Code, der vor den Wegen des Servers läuft – prüfen, lesen, umleiten. |
| Pergament / Kerzenlicht | Die helle und die dunkle Farbfassung des Almanachs. |
| Platzhalter | Ein `?` in SQL, das beim Ausführen mit einem Wert gefüllt wird. |
| Prop | Ein Wert, den eine Komponente von ihrer Elternkomponente bekommt. |
| Ref | Ein Merkzettel (`useRef`), der das Neuzeichnen übersteht, ohne es auszulösen. |
| Rückruf | Eine Funktion, die man mitgibt, damit sie später aufgerufen wird (`onClick`, `onSpeichern`). |
| Spread | `...x` schüttet die Einträge einer Liste oder die Felder eines Objekts aus. |
| Tailwind-Klasse | Ein Baustein des Aussehens im Attribut `className`, etwa `flex` oder `text-rubric`. |
| Transaktion | Mehrere Änderungen an der Datenbank, die nur gemeinsam gelten. |
| Vorlagentext | Ein Text in Backticks, in den Werte eingesetzt werden; er darf mehrere Zeilen umfassen. |
| Wächter | Ein Zwischenschritt, der eine Anfrage nur durchlässt, wenn sie darf. |
| Weg (Route) | Methode und Pfad der Schnittstelle samt dem Code, der antwortet. |
| Zerlegung | Mehrere Felder auf einmal herausholen: `const { a, b } = objekt;`. |
| Zusage (Promise) | Ein Ergebnis, das erst später feststeht; mit `await` wartet man darauf. |
| Zustand | Ein Wert, den sich eine Komponente merkt (`useState`); ändert er sich, wird neu gezeichnet. |
