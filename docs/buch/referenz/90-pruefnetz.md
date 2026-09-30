# Das Prüfnetz

> Dieses Kapitel schreibt `npm run handbuch` aus dem Code (scripts/handbuch/referenz/).
> Änderungen gehören in den Code und seine Kommentare, nicht hierher.

`npm test` lässt der Reihe nach laufen: die Prüfregeln (oxlint), drei Proben, die den Code lesen (Einfuhren, Stil, Kommentare), zwei, die rechnen (Blatt, Klang), und den Vertrag, der einen eigenen Almanach startet und eine ganze Runde gegen die Schnittstelle spielt. Keine davon braucht ein zusätzliches Paket.

Wie man mit dem Netz arbeitet – wann welche Probe anschlägt und was dann zu tun ist –, steht im Kapitel über die Entwicklung. Hier stehen die Proben selbst, mit dem, was ihr Kopf über sie sagt.

## einfuhrprobe

*scripts/einfuhrprobe.mjs · npm run einfuhrprobe*

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

## stilprobe

*scripts/stilprobe.mjs · npm run stilprobe*

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

## kommentarprobe

*scripts/kommentarprobe.mjs · npm run kommentarprobe*

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

## blattprobe

*scripts/blattprobe.mjs · npm run blattprobe*

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

## klangprobe

*scripts/klangprobe.mjs · npm run klangprobe*

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

## vertrag

*scripts/vertrag.mjs · npm run vertrag*

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

## Die Kapitel des Vertrags

Der Vertrag spielt einen Abend in 21 Kapiteln, jedes baut auf dem vorigen auf (scripts/vertrag/).

| Kapitel | Prüfstellen | worum es geht |
|---|---|---|
| 01-konten | 8 | Vertrag, Kapitel: Konten und Rollen. |
| 02-kampagne | 11 | Vertrag, Kapitel: Die Kampagne – die Bühne für alles Weitere. |
| 03-charaktere | 4 | Vertrag, Kapitel: Charaktere. |
| 04-volles-blatt | 13 | Vertrag, Kapitel: Ein volles Blatt übersteht den Weg zum Server und zurück. |
| 05-vorlagen | 21 | Vertrag, Kapitel: Die Vorlagen liegen hinter dem Schirm. |
| 06-kampf | 13 | Vertrag, Kapitel: Der Kampf. |
| 07-gespraech | 24 | Vertrag, Kapitel: Chronik, verdeckte Würfe und Chat. |
| 08-spieltisch | 18 | Vertrag, Kapitel: Spieltisch und Kartenbibliothek. |
| 09-klang | 27 | Vertrag, Kapitel: Der Klangteppich. |
| 10-sicht | 19 | Vertrag, Kapitel: Sicht: Nebel, Licht und Sinne. |
| 11-vorhang | 18 | Vertrag, Kapitel: Der Vorhang. |
| 12-sichtweite | 12 | Vertrag, Kapitel: Sichtweite: das Nebelfenster hängt an der Figur. |
| 13-massstab | 9 | Vertrag, Kapitel: Maßstab und große Karten. |
| 14-nsc | 11 | Vertrag, Kapitel: NSC-Blätter. |
| 15-live-kanal | 4 | Vertrag, Kapitel: Der Live-Kanal. |
| 16-umbenennen | 11 | Vertrag, Kapitel: Umbenennen. |
| 17-uebernehmen | 32 | Vertrag, Kapitel: Daten in eine andere Kampagne kopieren. |
| 18-review | 20 | Vertrag, Kapitel: Aus dem Code-Review: Grenzen, die leicht wieder verrutschen. |
| 19-fehlerschluessel | 2 | Vertrag, Kapitel: Jeder Fehler trägt einen Schlüssel. |
| 20-werkzeuge | 13 | Vertrag, Kapitel: Die Werkzeuge auf dem Rechner des Almanachs. |
| 21-luecken | 56 | Vertrag, Kapitel: Die geschlossenen Lücken. |

### 01-konten

Vertrag, Kapitel: Konten und Rollen.

Das erste Konto führt die Spielleitung, jedes weitere braucht eine
Einladung; ohne Anmeldung gibt es keinen Zugriff, ohne Rolle kein
Bestiarium. Legt die drei Klienten an, die durch den ganzen Durchgang
gehen: Spielleitung, Spielerin, Fremder.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

### 02-kampagne

Vertrag, Kapitel: Die Kampagne – die Bühne für alles Weitere.

Konten gehören der ganzen Runde, alles Gespielte gehört einer Kampagne.
Die Spielleitung bekommt ihre erste beim Einrichten mitgeliefert; wer
später dazukommt, steht zunächst vor gar keiner, und der Server antwortet
auf jeden Spielweg mit 409. Das ist das Tor, durch das die Oberfläche in
die Kampagnenauswahl schickt. Die Spielerinnen treten der Kampagne hier bei.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

### 03-charaktere

Vertrag, Kapitel: Charaktere.

Die Spielerin legt ihren Helden an; er begleitet den ganzen weiteren
Durchgang (Kampf, Spieltisch, Sicht, Umzug).

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

### 04-volles-blatt

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

### 05-vorlagen

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

### 06-kampf

Vertrag, Kapitel: Der Kampf.

Zwei Sichten auf denselben Kampf, die Initiative durch die Spielerin,
Schaden, der aufs Blatt wandert, und das Teilen der Beute.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

### 07-gespraech

Vertrag, Kapitel: Chronik, verdeckte Würfe und Chat.

Was am Tisch gesagt und gewürfelt wird – und wer davon was erfährt:
Chronik als Struktur statt Prosa, verdeckte Würfe, Chat an alle und
geflüstert.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

### 08-spieltisch

Vertrag, Kapitel: Spieltisch und Kartenbibliothek.

Szenen, Figuren, Nebel und Zeigefinger; dazu die Kartenbibliothek, aus der
Szenen samt ausgerichtetem Raster aufgelegt werden.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

### 09-klang

Vertrag, Kapitel: Der Klangteppich.

Spotify-Adressen werden gesäubert oder abgewiesen, die Sammlung bleibt bei
der Spielleitung, was aufliegt, hört die ganze Runde – und der Taktstock
hält alle auf derselben Stelle.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

### 10-sicht

Vertrag, Kapitel: Sicht: Nebel, Licht und Sinne.

In einer dunklen Szene sieht jede Figur nur, was Licht und eigene Sinne
hergeben. Geprüft wird die Sicht, die der Server je Person rechnet und
verschickt.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

### 11-vorhang

Vertrag, Kapitel: Der Vorhang.

Hinter geschlossenem Vorhang bekommt die Runde gar nichts vom Tisch –
nicht ausgeblendet, sondern nicht geschickt, auch nicht als einzelner
Pinselstrich im Nebel. Und die Chronik vermerkt den Ort erst, wenn er sich
hebt.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

### 12-sichtweite

Vertrag, Kapitel: Sichtweite: das Nebelfenster hängt an der Figur.

Eine eingetragene Sichtweite wird zum Nebelfenster, das an der eigenen
Figur hängt; die Szene kann sie für alle deckeln (Nebelbank,
Schneetreiben).

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

### 13-massstab

Vertrag, Kapitel: Maßstab und große Karten.

Ein Feld muss nicht fünf Fuß sein: Metrische Karten, große Außenkarten und
die Umrechnung der Sinne in Felder.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

### 14-nsc

Vertrag, Kapitel: NSC-Blätter.

NSC-Blätter sind der Zettel hinter dem Schirm: Die Runde sieht sie nicht,
auch nicht als „geteilt“ markiert, und das Holen der Runde in den Kampf
lässt sie liegen. Auch der Live-Kanal verrät nichts von ihnen – und wer
ein Blatt nicht mehr sehen darf, bekommt es aus seiner Übersicht genommen.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

### 15-live-kanal

Vertrag, Kapitel: Der Live-Kanal.

Der Live-Kanal öffnet sich, spricht Server-Sent Events, begrüßt mit der
Fensterkennung und trägt Änderungen am Kampf.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

### 16-umbenennen

Vertrag, Kapitel: Umbenennen.

Umbenennen darf nur, wer die Kampagne angelegt hat; der Name hängt an
nichts, also zieht nichts nach.

Der Name hängt an nichts: Alles darin zeigt auf die Kennung. Genau das
wird hier nachgewiesen – nach dem Umbenennen steht dieselbe Habe da.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

### 17-uebernehmen

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

### 18-review

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

### 19-fehlerschluessel

Vertrag, Kapitel: Jeder Fehler trägt einen Schlüssel.

Jede Absage des Servers trägt einen unveränderlichen Schlüssel (`code`) –
die Oberfläche prüft nur ihn, nie den Satz daneben.

Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
Kapitel angelegt haben – und trägt ein, was spätere brauchen.

### 20-werkzeuge

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

### 21-luecken

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
