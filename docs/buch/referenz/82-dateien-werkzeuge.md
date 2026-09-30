# Dateiverzeichnis: die Werkzeuge

> Dieses Kapitel schreibt `npm run handbuch` aus dem Code (scripts/handbuch/referenz/).
> Änderungen gehören in den Code und seine Kommentare, nicht hierher.

Alles unter scripts/ (64 Dateien, 7.568 Zeilen): Start und Tunnel, die Proben und der Vertrag, Drucksatz und dieses Handbuch.

## scripts/

### scripts/adresse.mjs

*142 Zeilen*

Welche Adresse hat der Almanach gerade?

```
npm run adresse
```

Drei Antworten, je nachdem, wo man steht:

- auf demselben Gerät      http://localhost:3001
- im selben Netz (WLAN)    http://192.168.x.y:3001
- von überall              die geliehene Adresse des Schnelltunnels

Die dritte wechselt bei jedem Neustart des Tunnels. Sie steht in dessen
Protokoll – entweder in dem des Containers (Weg über Docker) oder in
`data/tunnel.log` (Weg über `npm run tunnel`). Dieses Skript sieht in
beiden nach, damit man sie nicht suchen muss.

Steht in der Umgebung eine DOMAENE, entfällt die Sucherei: Dann gilt die
eigene Adresse, und zwar nur sie. In den Protokollen läge sonst womöglich
noch eine geliehene Adresse von früher – und die führte die Runde ins Leere.

### scripts/adresse.sh

*12 Zeilen*

### scripts/blattprobe.mjs

*324 Zeilen*

Die Rechenprobe des Charakterblattes.

Das Blatt rechnet eine Menge aus, was niemand von Hand nachprüfen will:
passive Werte, Rettungswürfe, Traglast, und vor allem die Umrechnung
zwischen Fuß und Meter, Pfund und Kilogramm. Hier steht, was dabei
herauskommen muss – mit den Zahlen eines echten Blattes als Maßstab.

Der zweite Zweck ist der wichtigere: Ein Blatt aus einer früheren Fassung
des Almanachs darf durch neue Felder nichts verlieren. Wer das Datenmodell
anfasst, sieht hier sofort, ob die alten Blätter das überstehen.

```
npm run blattprobe
```

### scripts/copy-frontend.mjs

*33 Zeilen*

Die gebaute Oberfläche nach backend/public kopieren, damit der Server sie
mit ausliefert.

```
npm run build   (baut frontend/dist und ruft danach dieses Skript)
```

Bewusst in Node geschrieben statt als cp/xcopy – so läuft derselbe Befehl
unter Windows, macOS und auf dem Raspberry Pi.

Der alte Stand in backend/public wird vorher ganz entfernt: Vite versieht
jede gebaute Datei mit einem Prüfwert im Namen, und ohne das Aufräumen
sammelten sich dort mit jedem Bau die Dateien aller früheren Stände.

### scripts/drucksatz.css

*176 Zeilen*

Der Satzspiegel der Druckfassung.

Gehört zu scripts/drucksatz.mjs, das aus den Handbüchern in docs/ eine
druckfertige HTML-Datei macht. Das Skript liest diese Datei beim Lauf
ein und schreibt sie in den Kopf der erzeugten Seite – deshalb steht sie
hier als richtiges Stilblatt und nicht als Zeichenkette im JavaScript.

Eingebettet statt verlinkt, weil die Druckfassung eine einzelne Datei
sein soll, die man weitergeben und im Browser öffnen kann.

Maßgebend sind Millimeter und `@page`: Das hier ist kein Bildschirm,
sondern DIN A4. Wer daran schraubt, prüft das Ergebnis im Druckvorschau-
Fenster des Browsers, nicht am Schirm.

### scripts/drucksatz.mjs

*83 Zeilen*

Aus den Handbüchern druckfertige Seiten setzen.

```
npm run drucksatz
```

Markdown liest sich am Bildschirm gut, auf Papier nicht: keine Seitenzahlen,
keine Ränder, Tabellen laufen über den Bund. Dieses Skript setzt die
Dokumente aus docs/ als HTML, das für den Druck gedacht ist – mit
Titelblatt, Seitenzahlen und Tabellen, die nicht mitten in einer Zeile
umbrechen.

Das Ergebnis liegt in docs/druck/ und wird im Browser geöffnet:
Strg+P, dann „Als PDF sichern“. Mehr braucht es nicht – kein pandoc, kein
LaTeX, kein Zusatzwerkzeug.

Bewusst ein eigener, kleiner Markdown-Leser statt einer Bibliothek – er
steht in drucksatz/markdown.mjs, das Gerüst der Seite in
drucksatz/seite.mjs. Beide teilt sich dieses Skript mit dem großen
Handbuch (scripts/handbuch.mjs).

### scripts/einfuhrprobe.mjs

*97 Zeilen*

Die Einfuhrprobe: Wer benutzt etwas, das er nicht eingeführt hat?

```
npm run einfuhrprobe
```

Beim Zerlegen großer Dateien in kleine passiert immer wieder dasselbe:
Eine Funktion wandert in eine neue Datei – und die Zeile `import { … }`
bleibt zurück. Der Bau merkt davon **nichts**: Für ihn ist ein unbekannter
Name einfach eine globale Variable, die es zur Laufzeit schon geben wird.
Auffallen tut es erst, wenn jemand die Seite öffnet und ein weißes Fenster
bekommt.

Diese Probe schließt die Lücke, und zwar ohne ein zusätzliches Paket
(der Almanach soll mit dem auskommen, was er ohnehin braucht):

1. Sie sammelt aus allen Dateien, **was irgendwo ausgeführt wird** –
   jedes `export function`, `export const`, `export { … }`.
2. Für jede Datei sammelt sie, was darin **eingeführt oder erklärt**
   wird: Einfuhren, Funktionen, Konstanten, Parameter, Zerlegungen.
3. Gemeldet wird jeder Name, der **benutzt** wird, im Almanach
   ausgeführt wird – und in der Datei weder steht noch hereingeholt
   wurde.

Das ist bewusst eng gefasst: Nur Namen, die es anderswo im Almanach
wirklich gibt, werden überhaupt betrachtet. Ein Tippfehler in einer
Variablen fällt hier nicht auf – eine vergessene Einfuhr dagegen immer.

Die Teile:
```
einfuhrprobe/leser.mjs  – nurCode(): Kommentare und Texte entfernen
einfuhrprobe/namen.mjs  – ausgeführte, bekannte und benutzte Namen
gemeinsam/dateien.mjs   – Dateien finden (teilt sie mit den anderen Proben)
```

### scripts/handbuch.mjs

*116 Zeilen*

Das Handbuch bauen – als Markdown zum Lesen auf GitHub und als PDF.

```
npm run handbuch                 alles: Verzeichnisse, HTML, PDF
npm run handbuch -- --ohne-pdf   nur Verzeichnisse und HTML
```

Das Buch besteht aus den Kapiteln in docs/buch/ (von Hand geschrieben),
den Handbüchern in docs/ (SPIELER.md, EINRICHTUNG.md …) und den
Verzeichnissen in docs/buch/referenz/, die dieses Skript bei jedem Lauf
*aus dem Code* neu schreibt: Dateien, Wege der Schnittstelle, Tabellen,
Live-Ereignisse, Einstellungen, Befehle, Vorlagen. Was dort steht, kann
deshalb nicht veralten – es ist der Code, nur lesbar gesetzt.

Die Reihenfolge des Buches steht in docs/buch/README.md, dem
Inhaltsverzeichnis, das man auf GitHub anklickt (siehe
handbuch/gliederung.mjs).

Das PDF entsteht mit einem Browser, der ohnehin auf dem Rechner liegt
(handbuch/drucker.mjs) – zweimal: Der erste Druck legt die Seiten fest,
der zweite trägt die Seitenzahlen ins Verzeichnis ein
(handbuch/seitenzahlen.mjs). Ergebnis:

```
docs/druck/handbuch.html              die gesetzte Fassung (nicht im Git)
docs/Abenteuer-Almanach-Handbuch.pdf  das Buch
```

### scripts/klangprobe.mjs

*71 Zeilen*

Die Klangprobe: Rechnet der Almanach die Stelle im Stück richtig aus?

```
npm run klangprobe
```

Das Gleichschalten der Musik hängt an einer einzigen kleinen Rechnung.
Der Server sagt allen dasselbe – „bei Sekunde `position`, gemessen um
`stand`, und es läuft“ –, und jedes Fenster rechnet daraus selbst aus, wo
es stehen müsste. Stimmt diese Rechnung nicht, läuft die Runde
auseinander, und niemand sieht, woran es liegt.

Geprüft wird hier nur sie. Ob Spotify danach wirklich Ton macht, kann
kein Skript beantworten: Das hängt am Browser, am angemeldeten Konto und
daran, ob jemand auf „Mithören“ getippt hat.

### scripts/kommentarprobe.mjs

*158 Zeilen*

Die Kommentarprobe: Ist der Code so erklärt, wie es sich der Almanach
vorgenommen hat?

```
npm run kommentarprobe
```

Kommentare veralten leiser als Code. Eine Funktion, die umzieht, meldet
sich beim Bau sofort; ein Kommentar, der auf ihren alten Ort zeigt,
schweigt – bis jemand ihm folgt und ins Leere läuft. Diese Probe fängt
viererlei ab:

1. **Jede Datei hat einen Kopf.** Ganz oben (nach einer #!-Zeile) steht
   ein Blockkommentar, der sagt, wozu es die Datei gibt. Wer eine Datei
   öffnet, soll nicht erst den Code lesen müssen, um zu wissen, ob er
   hier richtig ist.
2. **Jede Ausfuhr ist erklärt.** Direkt über jedem `export function`,
   `export const`, `export class` steht ein Kommentar. Was eine andere
   Datei benutzen darf, ist ein Versprechen – und ein Versprechen ohne
   Wortlaut hält niemand ein. (Die Standardausfuhr einer Datei ist durch
   den Kopf erklärt.)
3. **Jeder genannte Pfad stimmt.** Nennt ein Kommentar eine Datei mit
   Ordner („siehe lib/rasten.js“), dann gibt es sie auch – vom Ort der
   Datei aus oder von einer der üblichen Wurzeln (frontend/src,
   backend/src, …).
4. **Kein Kommentar ohne Code dahinter.** Endet eine Datei mit einem
   Blockkommentar, hat ihn fast immer ein Umzug zurückgelassen: Die
   Funktion ist in eine andere Datei gewandert, ihre Erklärung nicht.
   Sie beschreibt dann etwas, das es hier nicht gibt.

Wie die anderen Proben ohne zusätzliches Paket.

### scripts/start.mjs

*250 Zeilen*

Der Almanach ohne Docker – ein Befehl, überall.

```
npm start
```

Auf dem Raspberry Pi ist Docker der bequemere Weg: einmal eingerichtet,
startet der Almanach danach von selbst mit. Auf einem Laptop – erst recht
auf einem, auf dem man nichts installieren darf – ist Docker keine Option.
Dieses Skript ist der zweite Weg und braucht nichts als Node.js:

1. Prüfen, ob dieses Node den Almanach tragen kann.
2. Fehlende Abhängigkeiten nachinstallieren (nur beim ersten Mal).
3. Die Oberfläche bauen – aber nur, wenn sich seither etwas geändert hat.
4. Den Server starten und die Adressen nennen, unter denen er erreichbar ist.

Schalter:
```
--pruefen     nur berichten, was zu tun wäre; nichts tun
--neu-bauen   die Oberfläche in jedem Fall neu bauen
--ohne-bau    den Bau überspringen (schnellster Start nach einer Änderung
              nur am Server)
```

### scripts/stilprobe.mjs

*185 Zeilen*

Die Stilprobe: Steht Aussehen oder Verhalten irgendwo, wo es nicht hingehört?

```
npm run stilprobe
```

Die Regel des Almanachs heißt: **Wie etwas aussieht, steht im Stilblatt;
was es tut, steht in einer Skriptdatei.** Das Markup beschreibt nur, *was*
da ist. Wo ein Wert erst im Browser feststeht (die Lage einer Figur, die
selbst gewählte Farbe eines Kontos), geht er als CSS-Variable in eine
Laufzeit-Regel (frontend/src/lib/laufstil.js) – im Markup steht dann nur
ein Klassenname.

Geprüft wird:

1. Im JSX steht kein `style=` – auch nicht für eine einzelne Variable.
2. Im JSX stehen keine Farben oder Strichstärken als SVG-Attribute mit
   CSS-Werten (`fill="var(--…)"`, `stroke="var(--…)"`) – auch das ist
   Aussehen und gehört ins Stilblatt.
3. SVG steht nur in den Symbol-Dateien (components/icons/) – und im
   Lineal, das Geometrie zeichnet, die erst beim Ziehen entsteht.
4. In HTML, das der Almanach selbst erzeugt (das mitgenommene Blatt,
   der Drucksatz, das Handbuch), steht kein `style="…"`, kein
   `on…="…"`, kein `<script>` und kein `<style>` – außer an der einen
   begründeten Stelle unten (AUSNAHMEN).
5. In der Oberfläche steht kein roher Farbwert (`#9a2b22`) außerhalb der
   Stilblätter. Farben haben Namen – siehe stile/farben.css.
6. Die index.html lädt ihre Skripte und Stilblätter, statt sie zu
   enthalten.
7. Dieselbe Regel gilt für design/: Die Artboards dort sind von Hand
   bearbeitetes HTML, kein Bau-Ergebnis – aber genauso wenig ein Ort
   für style="…" (siehe design/README.md).

Wie die Einfuhrprobe kommt sie ohne ein zusätzliches Paket aus.

### scripts/tunnel.mjs

*56 Zeilen*

Der Weg nach außen – ohne Docker, ohne Portfreigabe, ohne Konto.

```
npm run tunnel
```

Ein Programm ruft von innen nach außen an und hält die Leitung offen; die
Runde erreicht den Almanach über die Adresse, die es sich dafür leiht. Drei
Anbieter kommen dafür infrage, und dieses Skript probiert sie in dieser
Reihenfolge durch, bis einer da ist:

1. cloudflared        – am robustesten, aber ein eigenes Programm, das
                         erst geholt werden muss (unter Windows eine .exe)
2. ssh → localhost.run – kein Herunterladen nötig: SSH bringt praktisch
                         jedes Windows, macOS und Linux schon mit. Braucht
                         aber ausgehendes Port 22, das mancher
                         Firmenrechner sperrt.
3. npx localtunnel     – kommt über npm, lädt also nichts Kompiliertes
                         nach. Zeigt Mitspielern beim ersten Aufruf eine
                         Zwischenseite, und der freie Dienst ist bekannt
                         launisch.

Wer einen bestimmten Weg erzwingen will: TUNNEL_ANBIETER=cloudflared,
TUNNEL_ANBIETER=ssh oder TUNNEL_ANBIETER=localtunnel vor den Befehl stellen.

**Mit einem TUNNEL_TOKEN läuft es andersherum.** Dann wird nichts geliehen:
Cloudflare weiß aus dem Kennwort, welcher *benannte* Tunnel das ist und
welche Domain daran hängt, und der Almanach meldet sich dort an statt sich
eine Adresse zu leihen. Die Adresse wechselt nie wieder, gleichgültig in
welchem Netz der Rechner steht, und die Runde tippt vor jedem Spielabend
dieselbe. Gebraucht wird dafür `cloudflared` – dasselbe Programm wie oben
unter 1., nur mit eigenem Kennwort statt geliehener Adresse. Einrichtung
einmalig, kostenlos und ganz ohne Kreditkarte: docs/EINRICHTUNG.md,
Schritt 6.5.

Auf dem Pi macht den Schnelltunnel der Container aus docker-compose.yml.
Auf einem Laptop gibt es keinen Container – dieses Skript startet das
gewählte Programm direkt und schreibt sein Protokoll nach `data/tunnel.log`,
damit `npm run adresse` die Adresse dort wiederfindet.

Die Teile stehen in `tunnel/`: grundlagen.mjs (Port, Ordner, welche
Programme laufen), anbieter.mjs (die drei Anbieter), anleitung.mjs (was
tun, wenn keiner da ist), benannt.mjs und schnell.mjs (die beiden Wege).

Beenden mit Strg+C. Der Almanach selbst läuft davon unbeirrt weiter; nur
der Weg von außen ist dann wieder zu.

### scripts/vertrag.mjs

*81 Zeilen*

Der Vertrag zwischen Server und Oberfläche.

Dieses Skript startet einen eigenen Almanach auf einem freien Port mit einer
frischen, leeren Datenbank, spielt eine Runde durch und prüft, dass die
Schnittstelle sich so verhält, wie es die Oberfläche erwartet.

Der Sinn: Wer die Oberfläche umbaut, neu gestaltet oder gegen eine ganz
andere austauscht, kann hiermit nachweisen, dass der Unterbau unangetastet
geblieben ist. Und wer am Server schraubt, merkt sofort, wenn er etwas
bricht, worauf sich die Oberfläche verlässt.

```
npm run vertrag
```

Die Prüfungen stehen in Kapiteln in `vertrag/`, eines je Sachgebiet, in
der Reihenfolge eines Spielabends. Die Reihenfolge ist nicht beliebig:
Spätere Kapitel bauen auf dem auf, was frühere angelegt haben (Konten,
die Kampagne, den Helden) – das reichen sie über `lage` weiter.

## scripts/drucksatz/

### scripts/drucksatz/markdown.mjs

*245 Zeilen*

Ein kleiner Markdown-Leser für die Druckfassungen – Handbücher und Buch.

Bewusst ein eigener statt einer Bibliothek: Die Dokumente des Almanachs
benutzen eine Handvoll Formen – Überschriften, Absätze, Listen (auch
verschachtelt), Tabellen, Zitate, Codeblöcke, Bilder –, und dafür lohnt
keine Abhängigkeit, die bei jedem `npm install` mitkommen müsste.

Was er *nicht* kann, steht in keinem der Dokumente: eingebettetes HTML,
Fußnoten, Definitionslisten. Wer so etwas braucht, erweitert ihn hier –
und prüft danach das Ergebnis mit `npm run drucksatz` und
`npm run handbuch`.

Drei Stellen lassen sich von außen einstellen (`optionen`):

```
anker(text)    – welche Kennung eine Überschrift bekommt. Für einzelne
                 Handbücher die Regel von GitHub, im Buch eine, die
                 auch über Kapitelgrenzen hinweg eindeutig ist.
verweis(ziel)  – wohin ein Verweis im Druck zeigt. Ein Verweis auf ein
                 anderes Markdown-Dokument soll dort auf dessen gesetzte
                 Fassung zeigen, nicht auf die .md-Datei. `null` heißt:
                 kein Verweis, nur der Text (etwa für eine Quelldatei,
                 die es im Druck nicht gibt).
bild(pfad)     – wo ein Bild aus Sicht der gesetzten Datei liegt.
```

**Ausfuhren**

- `schuetzen` (const) – Text für HTML entschärfen.
- `githubAnker` (function) – Überschrift zu Anker – dieselbe Regel, die auch GitHub anwendet.
- `nachHtml` (function) – Markdown zu HTML.

### scripts/drucksatz/seite.mjs

*71 Zeilen*

Das Gerüst der gesetzten Handbücher: HTML-Kopf, Titelblatt, Inhalt.

Eigene Datei, weil zwei Werkzeuge es brauchen: der Drucksatz der
einzelnen Handbücher (scripts/drucksatz.mjs) und das Buch
(scripts/handbuch.mjs), das dasselbe Titelblatt trägt.

**Ausfuhren**

- `ZIERAT` (const) – Der Zierrat unter dem Titel – als Verweis auf das Bild, das neben die gesetzte Seite gelegt wird (siehe `beigaben`). Früher stand das SVG als Text in jeder Seite; jetzt ist es eine eigene Datei (zierat.svg).
- `beigaben` (function) – Was eine gesetzte Seite neben sich braucht: ihr Stilblatt und das Bild des Zierrats. Beides wird in den Ordner der Seite geschrieben, damit sie darauf verweisen kann, statt es in sich zu tragen – auch der Browser, der sie zum PDF druckt, lädt es von dort.
- `seite` (function) – Das Gerüst einer gesetzten Seite: Kopf mit Verweis aufs Stilblatt, Titelblatt mit Zierrat, dann der Inhalt.

## scripts/einfuhrprobe/

### scripts/einfuhrprobe/leser.mjs

*110 Zeilen*

Der Leser der Einfuhrprobe: aus einer Quelldatei nur den Code behalten.

Eigene Datei, weil er das einzige wirklich knifflige Stück der Probe ist
- ein kleiner Zustandsautomat über Code, Kommentare, Zeichenketten,
Vorlagen und Suchmuster. Wer an ihm schraubt, soll ihn für sich lesen
können, ohne die Namenssuche drumherum.

**Ausfuhren**

- `nurCode` (function) – Kommentare und Zeichenketten entfernen – aber nichts, was Code ist.

### scripts/einfuhrprobe/namen.mjs

*147 Zeilen*

Die Namenssuche der Einfuhrprobe: was ausgeführt, was bekannt, was benutzt
wird.

Alle drei arbeiten auf Text, der schon durch den Leser (leser.mjs)
gelaufen ist – Kommentare und Zeichenketten sind dann verschwunden, und
ein Wort im Fließtext gilt nicht mehr als Benutzung.

**Ausfuhren**

- `ausgefuehrteNamen` (function) – Der Katalog aller ausgeführten Namen: Name → Datei, die ihn als erste ausführt. Gezählt wird `export function|const|let|class` und `export { … }` (bei `as` der Name, unter dem er hinausgeht).
- `bekannteNamen` (function) – Alle Namen, die eine Datei selbst einführt oder erklärt: Einfuhren, Weiterreichungen, Funktionen, Klassen, Variablen, Zerlegungen und Parameter. Die Regeln sind grob, aber großzügig – lieber einen Namen zu viel als bekannt ansehen (dann fällt eine Einfuhr nicht auf) als einen zu wenig (dann meldet die Probe Unsinn, und niemand glaubt ihr mehr).
- `benutzteNamen` (function) – Alle benutzten Namen.
- `a` (aus ./x.js)
- `b` (aus ./x.js)

## scripts/gemeinsam/

### scripts/gemeinsam/dateien.mjs

*55 Zeilen*

Dateien des Almanachs finden – für die Proben in scripts/.

Einfuhr-, Stil- und Kommentarprobe gehen alle dieselben Ordner durch und
melden ihre Funde mit demselben kurzen Pfad und derselben Zeilennummer.
Das stand bisher in jeder Probe einzeln, leicht verschieden – und genau
solche Abweichungen führen dazu, dass eine Probe eine Datei übersieht,
die eine andere findet.

Bewusst ohne Paket (kein glob): Der Almanach soll mit dem auskommen, was
Node ohnehin mitbringt.

**Ausfuhren**

- `wurzel` (const) – Das Wurzelverzeichnis des Almanachs (eine Ebene über scripts/).
- `QUELLTEXT` (const) – Quelltexte, wie sie Bau und Server laden: JavaScript und JSX.
- `dateien` (function) – Alle Dateien unter `ordner` (relativ zur Wurzel), deren Name auf `muster` passt – rekursiv, in der Reihenfolge, in der das Dateisystem sie liefert. Ein Ordner, den es (noch) nicht gibt, ergibt eine leere Liste statt eines Absturzes; so darf eine Probe Ordner nennen, die erst später entstehen.
- `kurz` (const) – Der Pfad relativ zur Wurzel – so, wie ihn eine Meldung zeigen soll.
- `liegtIn` (const) – Liegt `datei` unterhalb von `ordner` (relativ zur Wurzel)?
- `zeileVon` (const) – Die Zeilennummer (ab 1) einer Stelle im Text.

## scripts/handbuch/

### scripts/handbuch/buch.css

*269 Zeilen*

Der Satzspiegel des Handbuchs – DIN A4, zum Drucken und als PDF.

Gehört zu scripts/handbuch.mjs. Das Skript liest diese Datei, schneidet
diesen Erklärkopf ab und bettet den Rest in die gesetzte Seite ein – die
Druckfassung ist eine einzige Datei ohne Nachbarn.

Maßgebend sind Millimeter, Punkt und `@page`: Das hier ist kein
Bildschirm. Wer daran schraubt, prüft das Ergebnis im PDF, nicht im
Browserfenster.

Die Seitenzahlen stehen in den Randfeldern von `@page` (`@bottom-center`)
und zählen von selbst mit. Titelblatt und Teilblätter tragen keine – dafür
sind die benannten Seiten `titel` und `teil` da.

### scripts/handbuch/drucker.mjs

*94 Zeilen*

Aus HTML ein PDF drucken – mit einem Browser, der ohnehin auf dem Rechner
liegt.

Kein Paket, kein Download: Gesucht wird ein Chromium-Abkömmling, den es
fast überall schon gibt – Chrome, Chromium, Edge (unter Windows immer
vorhanden), Brave. Er druckt ohne Fenster (`--headless`) direkt in eine
Datei. Ein anderer Weg lässt sich mit `CHROME_PFAD=/pfad/zum/browser`
vorgeben.

Findet sich keiner, ist das kein Fehler: Das Buch liegt dann als HTML
vor, und jeder Browser macht mit Strg+P → „Als PDF sichern“ dasselbe
daraus – Seitenzahlen inklusive, denn die stehen im Stilblatt.

**Ausfuhren**

- `findeBrowser` (function) – Der erste Browser, den es wirklich gibt – oder null.
- `drucken` (function) – Eine HTML-Datei als PDF drucken.

### scripts/handbuch/gliederung.mjs

*62 Zeilen*

Die Gliederung des Buches – gelesen aus docs/buch/README.md.

Das Inhaltsverzeichnis, das man auf GitHub anklickt, ist zugleich der
Bauplan für den Druck. So gibt es nur *eine* Reihenfolge, und sie kann
nicht auseinanderlaufen. Die Regeln:

```
# Titel                  – der Titel des Buches (erste Zeile)
Text bis „## Inhalt“     – das Vorwort
### Teil I · Name        – beginnt einen Teil; der Text darunter (bis
                           zur ersten Kapitelzeile) steht auf dem
                           Teilblatt
1. [Name](datei.md)      – ein Kapitel; der Pfad gilt von docs/buch/ aus
```

Alles nach einer Zeile „## Anhang zum Verzeichnis“ gehört nicht mehr zur
Gliederung (dort steht, wie man das PDF baut).

**Ausfuhren**

- `gliederung` (function) – }} ``` `datei` ist ein absoluter Pfad ```

### scripts/handbuch/referenz.mjs

*58 Zeilen*

Die Verzeichnisse des Handbuchs – aus dem Code geschrieben.

Jedes Verzeichnis ist ein kleines Modul in referenz/, das den Code liest
und ein Markdown-Kapitel zurückgibt. Dieses Modul ruft sie der Reihe nach
und schreibt die Ergebnisse nach docs/buch/referenz/. Die Dateien dort
werden mit eingecheckt, damit man sie auch auf GitHub lesen kann – von
Hand ändern lohnt aber nicht: Der nächste Lauf von `npm run handbuch`
schreibt sie neu.

**Ausfuhren**

- `schreibeVerzeichnisse` (async function) – Alle Verzeichnisse neu schreiben. Manche Verzeichnisse laden Module des Almanachs (Regeln, Vorlagen) – deshalb asynchron.

### scripts/handbuch/satz.mjs

*249 Zeilen*

Das Buch setzen: aus der Gliederung und den Kapiteln eine einzige
HTML-Seite – Titelblatt, Inhaltsverzeichnis, Vorwort, Teile, Kapitel.

Die eigentliche Arbeit steckt in drei Dingen:

1. **Eindeutige Anker.** Jedes Kapitel ist für sich ein Markdown-
   Dokument, und „Überblick“ kommt in einem Dutzend davon vor. Im Buch
   bekommt deshalb jede Überschrift eine Kennung mit Kapitelnummer
   davor (`k7-ueberblick`) – und zwar in reinem ASCII, weil das PDF
   die Kennungen als Sprungziele übernimmt (siehe seitenzahlen.mjs).
2. **Verweise umbiegen.** Ein Verweis auf docs/SPIELER.md#wuerfeln
   zeigt im Buch auf das Kapitel, in dem SPIELER.md steht, und dort auf
   den Abschnitt. Ein Verweis auf eine Quelldatei (`../../backend/…`)
   bleibt als Text stehen – im Druck gibt es sie nicht.
3. **Das Verzeichnis.** Es sammelt Teile, Kapitel und deren Abschnitte
   und trägt, sobald bekannt, die Seitenzahlen ein.

**Ausfuhren**

- `kennung` (function) – Eine Überschrift als ASCII-Kennung: „Übersicht & Kampf“ → „uebersicht-kampf“.
- `setzeBuch` (function) – 

### scripts/handbuch/seitenzahlen.mjs

*85 Zeilen*

Auf welcher Seite des PDFs steht welcher Anker?

Das Inhaltsverzeichnis des Buches soll Seitenzahlen tragen. Der Browser
kann sie beim Drucken nicht selbst einsetzen (`target-counter()` kennt
Chromium nicht), also wird zweimal gedruckt: Der erste Durchgang legt die
Seiten fest, dieses Modul liest daraus ab, wo jede Überschrift gelandet
ist, und der zweite Durchgang druckt dieselben Seiten mit den Zahlen im
Verzeichnis. Weil die Zahlen im ersten Durchgang schon als Platzhalter
gleicher Breite dastehen, verschiebt sich dabei nichts.

Gelesen wird ohne PDF-Bibliothek. Das geht, weil Chromium für jedes
Element mit `id`, auf das ein Verweis zeigt, ein *benanntes Sprungziel*
anlegt – im Wörterbuch `/Dests` des Katalogs, unkomprimiert:

```
/Dests 20 0 R            im Katalog
20 0 obj << /k3 [7 0 R /XYZ 0 842 0] … >> endobj
```

Die Seite `7 0 R` wird dann im Seitenbaum (`/Pages` → `/Kids`) gesucht;
ihre Stelle dort ist die Seitenzahl. Komprimierte Objektströme benutzt
Chromium dafür nicht. Sollte sich das eines Tages ändern, bleibt das
Verzeichnis ohne Zahlen – das Buch entsteht trotzdem.

**Ausfuhren**

- `seitenzahlen` (function) – 

## scripts/handbuch/referenz/

### scripts/handbuch/referenz/befehle.mjs

*75 Zeilen*

Verzeichnis: jeder `npm run …`-Befehl des Almanachs – was er aufruft und
was er tut.

Die Befehle stehen in den drei package.json (Wurzel, backend, frontend).
Was ein Befehl *tut*, steht im Kopf des Skripts, das er startet – von dort
wird der erste Absatz übernommen. Für die Befehle, die nur andere Befehle
verketten, steht die Erklärung hier.

**Ausfuhren**

- `BEFEHLE` (const) – Das Kapitel.

### scripts/handbuch/referenz/dateien.mjs

*127 Zeilen*

Verzeichnis: jede Datei des Almanachs mit ihrem Kopfkommentar und ihren
Ausfuhren.

Drei Kapitel – Server, Oberfläche, Werkzeuge –, innerhalb nach Ordnern.
Zu jeder Datei steht, was ihr Kopf sagt (vollständig, denn dort steht das
*Warum*), wie lang sie ist und was sie ausführt, jeweils mit dem Kommentar
darüber. Wer eine Stelle im Code sucht, schlägt hier nach, bevor er in den
Ordnern wühlt.

**Ausfuhren**

- `DATEIVERZEICHNISSE` (const) – Die drei Kapitel des Dateiverzeichnisses.
- `a` (aus ./x.js)
- `b` (aus ./x.js)

### scripts/handbuch/referenz/datenbank.mjs

*136 Zeilen*

Verzeichnis: jede Tabelle der Datenbank mit ihren Spalten, Schlüsseln und
Indizes – so, wie sie ein frisch gestarteter Almanach wirklich hat.

Gelesen wird nicht das SQL, sondern die Datenbank selbst: Ein eigener
Node-Prozess startet die Datenschicht des Servers (backend/src/db.js)
gegen einen leeren, vorübergehenden Datenordner – mit Schema, Nachrüsten
und Kampagnen-Umzug, genau wie beim echten Start – und fragt SQLite dann
über `PRAGMA` nach dem Ergebnis. So stehen hier auch die Spalten, die erst
nachgerüstet werden, und keine, die es nur auf dem Papier gibt.

Die Erklärungen kommen aus den Kommentaren in datenbank/schema/: der Kopf
jeder Datei für den Bereich, der Kommentar über jedem CREATE TABLE für die
Tabelle.

**Ausfuhren**

- `DATENBANK` (const) – Das Kapitel.

### scripts/handbuch/referenz/einstellungen.mjs

*110 Zeilen*

Verzeichnis: jede Einstellung, die der Almanach aus der Umgebung liest –
mit Vorgabe, Fundort und dem Kommentar dazu.

Zwei Quellen: die .env.example im Wurzelverzeichnis (das, was man
einstellen *soll*, mit Erklärung für Nicht-Programmierer) und jede Stelle
`process.env.NAME` im Code (das, was tatsächlich gelesen wird). Eine
Einstellung, die nur im Code steht, ist für Fortgeschrittene; eine, die
nur in der Beispieldatei steht, wäre ein Fehler.

**Ausfuhren**

- `EINSTELLUNGEN` (const) – Das Kapitel.

### scripts/handbuch/referenz/ereignisse.mjs

*115 Zeilen*

Verzeichnis: die Ereignisse des Live-Kanals – wer sie schickt, wer sie
bekommt und wer in der Oberfläche darauf hört.

Gesucht wird nach den beiden Enden des Drahtes:

```
Server      `broadcast('name', daten, { … })` in backend/src – die
            Angaben in den geschweiften Klammern bestimmen, welche
            Fenster es bekommen (siehe backend/src/events.js)
Oberfläche  `useLive('name', …)` und `useLiveAlle([…], …)` in
            frontend/src (siehe lib/live.jsx)
```

Ein Ereignis, das nur auf einer Seite vorkommt, ist ein Hinweis auf einen
Fehler – es steht deshalb am Ende eigens aufgeführt.

**Ausfuhren**

- `EREIGNISSE` (const) – Das Kapitel.

### scripts/handbuch/referenz/fehler.mjs

*154 Zeilen*

Verzeichnis: die Fehlerschlüssel des Servers – jeder mit Status, Satz und
Fundstelle.

Jede Absage des Servers trägt zwei Felder: `code`, einen Schlüssel, der
sich nie ändert, und `error`, einen deutschen Satz für Menschen. Gesucht
wird deshalb nach `code: '…'` in backend/src. Zu jeder Fundstelle holt das
Verzeichnis

- den HTTP-Status aus dem nächsten `status(NNN)` oder `status: NNN`
  davor (innerhalb derselben Anweisung),
- den Satz aus dem ersten `error: '…'` danach; Einschübe wie `${x}`
  werden zu „…“, und steht dort ein Wert statt eines Satzes
  (`error: err.message`), wird dieser genannt,
- und, falls die Oberfläche einen eigenen Satz dafür hat, diesen aus
  frontend/src/lib/beschriftung.js (`FEHLER`).

Grob, aber für den Zweck genau: Die Wege des Almanachs schreiben ihre
Absagen alle in derselben Form, und der Vertrag
(scripts/vertrag/19-fehlerschluessel.mjs) prüft, dass sie es tun.

**Ausfuhren**

- `FEHLERSCHLUESSEL` (const) – Das Kapitel.

### scripts/handbuch/referenz/geschichte.mjs

*114 Zeilen*

Verzeichnis: wie der Almanach entstand – aus dem Verlauf von git.

Jeder Commit ist ein kleiner Bericht: eine Überschrift und, bei den
meisten, ein paar Absätze, warum etwas so gebaut wurde. Zusammen erzählen
sie die Geschichte des Almanachs genauer, als ein nachträglich
geschriebenes Kapitel es könnte. Dieses Verzeichnis setzt sie in
zeitlicher Reihenfolge, nach Tagen geordnet.

Weggelassen werden die Zusammenführungen (`Merge pull request …`) – sie
sagen nur, *dass* etwas zusammenkam, nicht was – und in den Nachrichten
die Zeilen über Mitautoren und Sitzungen, die nur für git selbst da sind.

Gibt es kein git (der Almanach kam als ZIP), steht an Stelle der
Geschichte ein Satz, der das sagt. Das Buch entsteht trotzdem.

**Ausfuhren**

- `GESCHICHTE` (const) – Das Kapitel.

### scripts/handbuch/referenz/pruefnetz.mjs

*65 Zeilen*

Verzeichnis: das Prüfnetz – jede Probe, jedes Kapitel des Vertrags, und
wie viele Prüfungen darin stehen.

Die Erklärungen sind die Köpfe der Skripte selbst; gezählt wird, wie oft
darin `pruefe(`, `gleich(` oder `mangel(` gerufen wird – eine grobe, aber
ehrliche Zahl dafür, wie dicht das Netz an welcher Stelle ist. (Die Zahl,
die eine Probe beim Laufen meldet, kann höher sein: Eine Prüfung in einer
Schleife zählt dort einmal je Durchgang.)

**Ausfuhren**

- `PRUEFNETZ` (const) – Das Kapitel.

### scripts/handbuch/referenz/quelle.mjs

*141 Zeilen*

Werkzeug für die Verzeichnisse: Quelltext lesen, Kommentare herauslösen
und als Markdown setzen.

Die Kommentare des Almanachs sind für Menschen geschrieben, nicht für
einen Dokumentationsgenerator: Absätze, Aufzählungen mit „–“, und gern
ausgerichtete Spalten („useAnsicht.js   Maßstab und Verschiebung“). Damit
diese Spalten im Buch nicht zu einem Brei zusammenlaufen, wird jeder
eingerückte Block, der keine Aufzählung ist, als Codeblock gesetzt – dort
bleibt die Ausrichtung stehen.

**Ausfuhren**

- `lesen` (const) – Eine Datei als Text.
- `dateienUnter` (function) – Alle Dateien unter `ordner` mit passender Endung, sortiert.
- `kommentarText` (function) – Den Inhalt eines Blockkommentars ohne Sternchen: `/**`, ` * ` und ` *\/` fallen weg, Einrückungen innerhalb bleiben.
- `alsMarkdown` (function) – Kommentartext als Markdown: Absätze bleiben Absätze, eingerückte Blöcke werden Codeblöcke (damit Spalten stehen bleiben), Aufzählungen mit „–“ oder Ziffern werden Listen. `@param` und Freunde werden eine eigene Liste.
- `kopfkommentar` (function) – Der Kopfkommentar einer Datei als Text – oder ''.
- `kommentarVor` (function) – Der Kommentar, der direkt vor Zeile `zeile` (0-basiert) steht – ein Blockkommentar oder eine Folge von `//`-Zeilen. Leer, wenn keiner da ist.
- `ersterSatz` (function) – Der erste Satz eines Textes – für Tabellen, in denen kein Platz für mehr ist.
- `relativ` (const) – Pfad relativ zur Wurzel, mit Schrägstrichen.
- `kapitelKopf` (function) – Der Kopf eines erzeugten Kapitels: Titel und der Hinweis, dass man es nicht von Hand ändert.

### scripts/handbuch/referenz/regeln.mjs

*161 Zeilen*

Verzeichnis: die Regeltabellen, mit denen das Blatt rechnet – gelesen aus
frontend/src/lib/regeln/ und dort *ausgerechnet*.

Die Tabellen hier sind keine Abschrift aus dem Regelwerk, sondern das,
was der Almanach tatsächlich tut: Die Modifikator-Tabelle entsteht, indem
`abilityModifier` für jeden Wert von 1 bis 30 gerufen wird, die
Übungsbonus-Tabelle aus `proficiencyBonus` und so fort. Stimmt hier etwas
nicht, stimmt es auch am Tisch nicht – und umgekehrt.

**Ausfuhren**

- `REGELN` (const) – Das Kapitel.

### scripts/handbuch/referenz/vorlagen.mjs

*144 Zeilen*

Verzeichnis: die zwölf Vorlagen-Charaktere, die jede neue Kampagne hinter
dem Schirm vorfindet – mit Werten, Merkmalen, Zaubern und Geschichte.

Gelesen werden die Steckbriefe selbst (backend/src/vorlagen/helden/), so
wie der Server sie beim Säen in Blätter verwandelt. Wer eine Vorlage
ändert, ändert sie dort; dieses Kapitel folgt beim nächsten Bau.

**Ausfuhren**

- `VORLAGEN` (const) – Das Kapitel.

### scripts/handbuch/referenz/wege.mjs

*171 Zeilen*

Verzeichnis: jeder Weg der Schnittstelle – Methode, Pfad, wer darf, wo
er steht und was der Kommentar über ihm sagt.

Gelesen wird, wie Express es auch tut: Welcher Router hängt in
backend/src/server.js unter welchem Pfad (`app.use('/api/…', …)`), welche
Wächter stehen davor, welche Teilrouter hängt ein Router ohne eigenen
Pfad ein (`router.use(teil)`), und welche Wege legt jeder an
(`router.get('/pfad', wächter…, handler)`). Ein Wächter, den ein Router
mit `router.use(requireDm)` für sich setzt, gilt für alle Wege danach.

docs/API.md beschreibt die Schnittstelle mit Beispielen; dieses
Verzeichnis ist die vollständige Liste, die mit jedem Bau stimmt.

**Ausfuhren**

- `alleWege` (function) – Alle Wege des Servers, in der Reihenfolge, in der Express sie prüft.
- `WEGE` (const) – Das Kapitel.

## scripts/tunnel/

### scripts/tunnel/anbieter.mjs

*109 Zeilen*

Die drei Anbieter eines geliehenen Weges nach außen – und welcher genommen
wird.

Probiert wird in fester Reihenfolge (cloudflared, ssh → localhost.run,
npx localtunnel), bis einer da ist. `TUNNEL_ANBIETER` erzwingt einen.
Jeder Anbieter weiß, wie man ihn startet und woran man in seiner Ausgabe
die geliehene Adresse erkennt.

**Ausfuhren**

- `ANBIETER` (const) – Die Anbieter in der Reihenfolge, in der sie probiert werden.
- `waehleAnbieter` (function) – Der erste verfügbare Anbieter – oder der erzwungene.

### scripts/tunnel/anleitung.mjs

*63 Zeilen*

Wenn kein Weg nach außen da ist: sagen, wie man weiterkommt.

Der Almanach lädt selbst nichts herunter. Er sagt, welche Datei von
cloudflared zu diesem Gerät passt und wohin sie gehört – und was ohne
jeden Tunnel möglich bleibt (im selben WLAN spielen).

**Ausfuhren**

- `cloudflaredHolen` (function) – Die passende Adresse zum Herunterladen, samt Befehlen, wo es sie gibt.
- `anleitung` (function) – Was zu tun ist, wenn keiner der drei Anbieter bereitsteht.

### scripts/tunnel/benannt.mjs

*114 Zeilen*

Der benannte Tunnel: die eigene Domain über `TUNNEL_TOKEN`.

**Ausfuhren**

- `benannterTunnel` (function) – Hier wird nichts geliehen. Das Kennwort sagt Cloudflare, welcher Tunnel das ist und welche Domain daran hängt – es gibt also keine Adresse mitzulesen und keine weiterzusagen. Was bleibt, ist die Leitung offenzuhalten.

### scripts/tunnel/grundlagen.mjs

*50 Zeilen*

Was jeder Weg nach außen braucht: Port, Datenordner, Protokolldatei, und
die Frage, welche Programme auf diesem Gerät überhaupt laufen.

**Ausfuhren**

- `wurzel` (const) – Der Ordner des Almanachs – dort sucht der Tunnel auch nach einem danebengelegten cloudflared.
- `PORT` (const) – Der Port, auf dem der Almanach lauscht und zu dem der Tunnel die Runde bringt.
- `datenordner` (const) – Derselbe Datenordner wie der des Servers.
- `protokoll` (const) – Hier schreibt der Tunnel mit – `npm run adresse` liest die Adresse von dort.
- `NPX` (const) – Unter Windows heißt npx `npx.cmd`.
- `sagen` (const) – Eine Zeile für die Person vor dem Fenster.
- `laeuft` (function) – Läuft dieser Befehl hier – und endet er sauber?
- `findeCloudflared` (function) – Drei Stellen, in dieser Reihenfolge: eine ausdrücklich genannte, der Suchpfad des Systems, und – für den Fall, dass man das Programm nur heruntergeladen und nicht installiert hat – neben dem Almanach selbst.
- `hatDocker` (const) – Ist Docker da? Dann gäbe es noch den Weg über den Container.

### scripts/tunnel/schnell.mjs

*96 Zeilen*

Der Schnelltunnel: eine geliehene Adresse, die bei jedem Start wechselt.

Das gewählte Programm (anbieter.mjs) wird gestartet, seine Ausgabe nach
`data/tunnel.log` mitgeschrieben, und sobald die geliehene Adresse darin
auftaucht, steht sie groß im Fenster – zum Weitersagen an die Runde.

**Ausfuhren**

- `schnellTunnel` (function) – Einen Anbieter wählen, starten, die Adresse ansagen, bis Strg+C.

## scripts/vertrag/

### scripts/vertrag/01-konten.mjs

*62 Zeilen*

Vertrag, Kapitel: Konten und Rollen.

Das erste Konto führt die Spielleitung, jedes weitere braucht eine
Einladung; ohne Anmeldung gibt es keinen Zugriff, ohne Rolle kein
Bestiarium. Legt die drei Klienten an, die durch den ganzen Durchgang
gehen: Spielleitung, Spielerin, Fremder.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `konten` (default async function)

### scripts/vertrag/02-kampagne.mjs

*51 Zeilen*

Vertrag, Kapitel: Die Kampagne – die Bühne für alles Weitere.

Konten gehören der ganzen Runde, alles Gespielte gehört einer Kampagne.
Die Spielleitung bekommt ihre erste beim Einrichten mitgeliefert; wer
später dazukommt, steht zunächst vor gar keiner, und der Server antwortet
auf jeden Spielweg mit 409. Das ist das Tor, durch das die Oberfläche in
die Kampagnenauswahl schickt. Die Spielerinnen treten der Kampagne hier bei.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `kampagne` (default async function)

### scripts/vertrag/03-charaktere.mjs

*35 Zeilen*

Vertrag, Kapitel: Charaktere.

Die Spielerin legt ihren Helden an; er begleitet den ganzen weiteren
Durchgang (Kampf, Spieltisch, Sicht, Umzug).

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `charaktere` (default async function)

### scripts/vertrag/04-volles-blatt.mjs

*149 Zeilen*

Vertrag, Kapitel: Ein volles Blatt übersteht den Weg zum Server und zurück.

Ein Blatt mit allem, was die Oberfläche kennt – Zauber, Merkmale,
Ausrüstung, Münzen, Aussehen –, wandert unverändert zum Server und zurück.
Der Server kennt den Inhalt nicht und darf nichts daran verlieren.

Das Blatt ist der einzige Teil des Almanachs, dessen Inhalt der Server
nicht kennt: Er nimmt entgegen, was die Oberfläche schickt, und gibt es
unverändert zurück. Genau das wird hier nachgewiesen – mit einem Blatt,
auf dem jedes Feld gefüllt ist, das ein gedruckter Charakterbogen kennt.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `vollesBlatt` (default async function)

### scripts/vertrag/05-vorlagen.mjs

*73 Zeilen*

Vertrag, Kapitel: Die Vorlagen liegen hinter dem Schirm.

Jede Kampagne bringt zwölf fertige Charaktere als NSC-Blätter mit. Die
Runde sieht keines davon; eine Abschrift holt eines hinter dem Schirm
hervor. Und wer eine gelöscht hat, bekommt sie mit `npm run vorlagen`
zurück.

Zwölf fertige Charaktere werden beim ersten Start angelegt. Sie sind
NSC-Blätter: Die Spielleitung sieht sie, die Runde nicht. Wer eine davon
spielen will, macht eine Abschrift – und die gehört dann ihr.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `vorlagen` (default async function)

### scripts/vertrag/06-kampf.mjs

*79 Zeilen*

Vertrag, Kapitel: Der Kampf.

Zwei Sichten auf denselben Kampf, die Initiative durch die Spielerin,
Schaden, der aufs Blatt wandert, und das Teilen der Beute.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `kampf` (default async function)

### scripts/vertrag/07-gespraech.mjs

*96 Zeilen*

Vertrag, Kapitel: Chronik, verdeckte Würfe und Chat.

Was am Tisch gesagt und gewürfelt wird – und wer davon was erfährt:
Chronik als Struktur statt Prosa, verdeckte Würfe, Chat an alle und
geflüstert.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `gespraech` (default async function)

### scripts/vertrag/08-spieltisch.mjs

*96 Zeilen*

Vertrag, Kapitel: Spieltisch und Kartenbibliothek.

Szenen, Figuren, Nebel und Zeigefinger; dazu die Kartenbibliothek, aus der
Szenen samt ausgerichtetem Raster aufgelegt werden.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `spieltisch` (default async function)

### scripts/vertrag/09-klang.mjs

*121 Zeilen*

Vertrag, Kapitel: Der Klangteppich.

Spotify-Adressen werden gesäubert oder abgewiesen, die Sammlung bleibt bei
der Spielleitung, was aufliegt, hört die ganze Runde – und der Taktstock
hält alle auf derselben Stelle.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `klang` (default async function)

### scripts/vertrag/10-sicht.mjs

*136 Zeilen*

Vertrag, Kapitel: Sicht: Nebel, Licht und Sinne.

In einer dunklen Szene sieht jede Figur nur, was Licht und eigene Sinne
hergeben. Geprüft wird die Sicht, die der Server je Person rechnet und
verschickt.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `sicht` (default async function)

### scripts/vertrag/11-vorhang.mjs

*119 Zeilen*

Vertrag, Kapitel: Der Vorhang.

Hinter geschlossenem Vorhang bekommt die Runde gar nichts vom Tisch –
nicht ausgeblendet, sondern nicht geschickt, auch nicht als einzelner
Pinselstrich im Nebel. Und die Chronik vermerkt den Ort erst, wenn er sich
hebt.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `vorhang` (default async function)

### scripts/vertrag/12-sichtweite.mjs

*136 Zeilen*

Vertrag, Kapitel: Sichtweite: das Nebelfenster hängt an der Figur.

Eine eingetragene Sichtweite wird zum Nebelfenster, das an der eigenen
Figur hängt; die Szene kann sie für alle deckeln (Nebelbank,
Schneetreiben).

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `sichtweite` (default async function)

### scripts/vertrag/13-massstab.mjs

*73 Zeilen*

Vertrag, Kapitel: Maßstab und große Karten.

Ein Feld muss nicht fünf Fuß sein: Metrische Karten, große Außenkarten und
die Umrechnung der Sinne in Felder.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `massstab` (default async function)

### scripts/vertrag/14-nsc.mjs

*91 Zeilen*

Vertrag, Kapitel: NSC-Blätter.

NSC-Blätter sind der Zettel hinter dem Schirm: Die Runde sieht sie nicht,
auch nicht als „geteilt“ markiert, und das Holen der Runde in den Kampf
lässt sie liegen. Auch der Live-Kanal verrät nichts von ihnen – und wer
ein Blatt nicht mehr sehen darf, bekommt es aus seiner Übersicht genommen.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `nsc` (default async function)

### scripts/vertrag/15-live-kanal.mjs

*52 Zeilen*

Vertrag, Kapitel: Der Live-Kanal.

Der Live-Kanal öffnet sich, spricht Server-Sent Events, begrüßt mit der
Fensterkennung und trägt Änderungen am Kampf.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `liveKanal` (default async function)

### scripts/vertrag/16-umbenennen.mjs

*58 Zeilen*

Vertrag, Kapitel: Umbenennen.

Umbenennen darf nur, wer die Kampagne angelegt hat; der Name hängt an
nichts, also zieht nichts nach.

Der Name hängt an nichts: Alles darin zeigt auf die Kennung. Genau das
wird hier nachgewiesen – nach dem Umbenennen steht dieselbe Habe da.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `umbenennen` (default async function)

### scripts/vertrag/17-uebernehmen.mjs

*170 Zeilen*

Vertrag, Kapitel: Daten in eine andere Kampagne kopieren.

Charaktere, Handzettel, Szenen und Beute ziehen in eine andere Kampagne –
kopiert, nicht verschoben, ganz oder gar nicht, und mit Verweisen, die
drüben ihre Gegenstücke wiederfinden.

Vorbereitung – Karten, Bestiarium, Begegnungen, Klang – gehört der ganzen
Runde und steht überall bereit. Alles, was zu *einer* Geschichte gehört,
lässt sich hinüberkopieren: Stück für Stück oder auf einmal.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `uebernehmen` (default async function)

### scripts/vertrag/18-review.mjs

*177 Zeilen*

Vertrag, Kapitel: Aus dem Code-Review: Grenzen, die leicht wieder verrutschen.

Jede Prüfung hier steht für einen Fehler, den ein Code-Review gefunden
hat: CORS, offene Kanäle nach dem Abmelden, erfundene Verweise, doppelte
Auszahlung, Ausbrüche aus dem Kompendium. Sie halten fest, dass er nicht
zurückkommt.

Jede dieser Prüfungen steht für einen Fehler, den es gab. Sie sind hier
festgehalten, damit er nicht beim nächsten Umbau zurückkommt.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `review` (default async function)

### scripts/vertrag/19-fehlerschluessel.mjs

*31 Zeilen*

Vertrag, Kapitel: Jeder Fehler trägt einen Schlüssel.

Jede Absage des Servers trägt einen unveränderlichen Schlüssel (`code`) –
die Oberfläche prüft nur ihn, nie den Satz daneben.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `fehlerschluessel` (default async function)

### scripts/vertrag/20-werkzeuge.mjs

*86 Zeilen*

Vertrag, Kapitel: Die Werkzeuge auf dem Rechner des Almanachs.

Neben der Schnittstelle gibt es drei Skripte, die man nur in der Not
braucht – und genau dann müssen sie gehen: ein Kennwort neu setzen, eine
Kampagne umbenennen, die Datenbank sichern. Sie laufen hier gegen den
Datenordner des Prüfservers, während der Server weiterläuft, so wie am
Spielabend auch.

Anlass war `npm run vorlagen`: Es brach seit den Kampagnen stumm ab,
und niemand merkte es, weil kein Durchgang es je aufrief (siehe
05-vorlagen.mjs, wo es inzwischen mitläuft).

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `werkzeuge` (default async function)

### scripts/vertrag/21-luecken.mjs

*328 Zeilen*

Vertrag, Kapitel: Die geschlossenen Lücken.

Das Handbuch führte unter „Bekannte Grenzen“ auf, was der Almanach noch
nicht konnte, und unter „Was nicht geschützt ist“, wovor er sich nicht
schützte. Jede dieser Lücken ist geschlossen, und hier steht, woran man
das sieht:

- eine Figur lässt sich von Hand an ein Blatt binden;
- Kämpfer und Figur verbergen und zeigen sich gemeinsam;
- Gegner würfeln ihre Initiative mit Geschicklichkeitsbonus;
- ein mitgenommenes Blatt lässt sich wieder anlegen, und ein kaputtes
  wird abgewiesen;
- jede Antwort trägt eine Content-Security-Policy;
- im Heimnetz gibt es HTTPS mit einem selbst ausgestellten, beschränkten
  Zertifikat.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

**Ausfuhren**

- `luecken` (default async function)

### scripts/vertrag/werkzeug.mjs

*175 Zeilen*

Das Werkzeug des Vertrags: ein eigener Server, ein Klient mit Keksdose,
und die Buchführung über bestandene und verfehlte Prüfungen.

Jedes Kapitel in diesem Ordner holt sich von hier `pruefe`, `gleich` und
`klient`; der Durchgang selbst (../vertrag.mjs) startet den Server,
lässt die Kapitel der Reihe nach laufen und fällt am Ende das Urteil.

**Ausfuhren**

- `PORT` (const) – Ein zufälliger freier Port, damit ein laufender Almanach nicht stört.
- `BASIS` (const) – Die Adresse der API dieses Prüfservers.
- `datenordner` (const) – Der Datenordner des Prüfservers – frisch und leer. Ausgeführt, damit ein Kapitel auch die Werkzeuge aus backend/scripts/ gegen denselben Almanach laufen lassen kann (siehe 05-vorlagen.mjs).
- `pruefe` (function) – Eine Zusage prüfen. Gibt zurück, ob sie hielt – so lassen sich Folgeprüfungen überspringen, die ohne sie keinen Sinn ergäben.
- `gleich` (const) – Zwei Werte müssen gleich sein; im Mangel stehen beide.
- `klient` (function) – Ein Klient, der sich Cookies merkt wie ein Browser – eine Person am Tisch. `ruf(pfad, { methode, koerper })` gibt `{ status, daten }` zurück.
- `mitschreiben` (async function) – Den Live-Kanal eines Klienten mitschreiben – so, wie ihn sein Browser bekäme.
- `serverFehler` (let) – Was der Server auf stderr sagte – falls er nicht hochkommt.
- `warteAufServer` (async function) – Warten, bis der Server antwortet – höchstens fünfzehn Sekunden.
- `beenden` (function) – Server anhalten, Datenordner wegräumen, mit diesem Code enden.
- `mangel` (function) – Einen Mangel eintragen, der keine einzelne Prüfung ist – etwa einen Abbruch.
- `urteil` (function) – Das Urteil: alles bestanden, oder die Liste dessen, was nicht hielt.
