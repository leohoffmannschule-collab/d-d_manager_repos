# Handbuch

Die vollständige Beschreibung des Abenteuer-Almanachs: was er kann, wie er
denkt, und wo seine Grenzen liegen.

Wer ihn **aufsetzen** will, findet den Weg dorthin im
[Einrichtungs-Handbuch](EINRICHTUNG.md). Wer ihn **am Spieltisch bedienen**
will, ist mit einer der beiden kurzen Betriebsanleitungen schneller:

- [Betriebsanleitung für die Spielleitung](SPIELLEITUNG.md)
- [Betriebsanleitung für die Runde](SPIELER.md)

Dieses Handbuch ist das Nachschlagewerk dahinter. Es erklärt nicht nur, wo
man klickt, sondern warum der Almanach sich verhält, wie er sich verhält.

---

## Inhalt

1. [Was der Almanach ist](#1-was-der-almanach-ist)
2. [Konten, Rollen und was wer sieht](#2-konten-rollen-und-was-wer-sieht)
3. [Das Charakterblatt](#3-das-charakterblatt)
4. [Der Spieltisch](#4-der-spieltisch)
5. [Sicht, Licht und Nebel](#5-sicht-licht-und-nebel)
6. [Hinter dem Schirm der Spielleitung](#6-hinter-dem-schirm-der-spielleitung)
7. [Würfeln](#7-würfeln)
8. [Chat](#8-chat)
9. [Beute](#9-beute)
10. [Klang](#10-klang)
11. [Chronik](#11-chronik)
12. [Kompendium](#12-kompendium)
13. [Wie die Technik dahinter arbeitet](#13-wie-die-technik-dahinter-arbeitet)
14. [Daten, Sicherung und Umzug](#14-daten-sicherung-und-umzug)
15. [Grenzen, die eingebaut sind](#15-grenzen-die-eingebaut-sind)
16. [Was der Almanach bewusst nicht tut](#16-was-der-almanach-bewusst-nicht-tut)

---

## 1. Was der Almanach ist

Ein selbst gehosteter Spieltisch für D&D 5e und verwandte Systeme. Er läuft
auf **einem einzigen Gerät** – einem Raspberry Pi, der durchläuft, oder dem
Laptop, der am Spielabend ohnehin auf dem Tisch steht – und wird von überall
im Browser bedient.

Er besteht aus vier Teilen, die sich eine Anmeldung, eine Datenbank und einen
Live-Kanal teilen:

| Teil | Für wen | Was darin steckt |
| --- | --- | --- |
| **Charaktere** | alle | vollständige 5e-Blätter, freies Blatt für andere Systeme, Bildnis |
| **Spieltisch** | alle | Karten, Figuren, Nebel des Krieges, Lineal, Zeigefinger, Initiative, Beute, Handzettel |
| **Spielleitung** | nur die Leitung | Kampfliste, Bestiarium, Begegnungen, Karten- und Klangbibliothek, Notizen, Runde |
| **Chronik** | alle | Protokoll des Abends, aus dem entstanden, was wirklich geschah |

**Was einer ändert, sehen die anderen sofort** – ohne Neuladen. Das ist kein
Beiwerk, sondern der Kern: Ein Wurf, ein Schritt, ein Treffer steht im selben
Augenblick auf allen Schirmen.

---

## 2. Konten, Rollen und was wer sieht

### 2.1 Die beiden Rollen

Es gibt genau zwei: **Spielleitung** und **Runde**. Das erste angelegte Konto
führt automatisch die Spielleitung – ein zweites „erstes Konto“ gibt es nicht.

Alle weiteren treten mit einem **Einladungscode** bei, den die Spielleitung
unter *Spielleitung → Runde* erzeugt: einer je Person, jeder gilt nur einmal,
und ein noch nicht eingelöster Code lässt sich zurückziehen. Ohne Code kommt
niemand hinein. Das ist wichtig, weil der Almanach über den Tunnel am offenen
Netz hängt.

### 2.2 Die Trennlinie ist der Server, nicht der Bildschirm

Der entscheidende Grundsatz: **Was die Runde nicht sehen darf, wird ihr gar
nicht erst geschickt.** Es wird nicht ausgeblendet, nicht durchsichtig
gemacht, nicht per JavaScript verborgen – es steht schlicht nicht in der
Antwort, die im Browser der Spieler ankommt.

Das gilt für alles:

| Was | Die Runde bekommt … |
| --- | --- |
| Verborgene Kämpfer | gar nichts – sie fehlen in der Liste |
| Trefferpunkte von Monstern | nur einen Zustand („verwundet“), keine Zahlen |
| Figuren im ungelüfteten Nebel | nichts, auch keine leere Stelle |
| Verdeckte Würfe | nichts |
| NSC-Blätter | nichts |
| Geheime Notizen | nichts, bis sie ausgeteilt werden |
| Der geschlossene Vorhang | kein Bild, keine Figuren, nicht einmal den Szenennamen |

Wer neugierig ist und die Entwicklerwerkzeuge des Browsers öffnet, findet
also nichts. Das ist der Unterschied zwischen „versteckt“ und „nicht
vorhanden“.

### 2.3 Charakterblätter

Jeder Charakter hat einen Besitzer. Das eigene Blatt lässt sich bearbeiten,
die Blätter der Mitspieler nur lesen. Unter *Spielleitung → Runde* steht zu
jedem Blatt ein Schalter: **Sehen die anderen am Tisch dieses Blatt?** – wer
sein Blatt für sich behalten will, kann das.

**NSC-Blätter** sind vollständige Charakterblätter, die nur die Spielleitung
sieht: für den Wirt, den Räuberhauptmann, den Drachen. Sie stehen bei ihr
unter *Hinter dem Schirm*, tauchen bei der Runde nirgends auf und werden
übergangen, wenn die Spielleitung „die Runde in den Kampf holt“.

### 2.4 Anmeldung

Passwörter liegen ausschließlich als scrypt-Hash in der Datenbank. Die
Anmeldung hängt in einem HttpOnly-Cookie und hält **30 Tage** – am Spielabend
muss also niemand hantieren. Nach **acht Fehlversuchen** ist für **zehn
Minuten** Ruhe, je Name und Herkunft. Das ist kein Fehler, sondern die Bremse
gegen das Durchprobieren.

Ein vergessenes Spieler-Passwort setzt die Spielleitung unter *Runde* neu.

---

## 3. Das Charakterblatt

### 3.1 Die Reiter

| Reiter | Inhalt |
| --- | --- |
| **Überblick** | Attribute, Fertigkeiten, Rettungswürfe, Erfahrung, Bildnis |
| **Kampf** | Trefferpunkte, Rüstungsklasse, Zustände, Erschöpfung, Konzentration, Widerstände, Sinne, Klassenressourcen, Rasten |
| **Zauber** | Zauberplätze, vorbereitete Zauber, Zaubertext auf Tipp |
| **Ausrüstung** | Gegenstände, Münzen, Traglast |
| **Hintergrund** | Herkunft, Bindungen, Merkmale, freier Text |

Für andere Systeme als 5e gibt es das **freie Blatt**: ein leeres Blatt ohne
5e-Mechanik, das nur trägt, was man hineinschreibt.

### 3.2 Jeder Wert ist ein Würfelknopf

Ein Tipp auf den Bonus neben einer Fertigkeit, einem Rettungswurf oder einem
Attribut würfelt – und der Wurf steht sofort bei allen am Tisch. Kein
Abtippen, kein Vorlesen.

### 3.3 Was das Blatt selbst rechnet

- **Rasten.** Kurze und lange Rast füllen auf, was sich erneuert.
  Trefferwürfel gibt man einzeln aus; der Wurf wird gleich gutgeschrieben.
- **Rettungswürfe gegen den Tod.** Tragen sich selbst ein: Eine 20 richtet
  mit einem Trefferpunkt wieder auf, eine 1 zählt doppelt.
- **Konzentration.** Läuft eine und der Charakter wird getroffen, ergibt sich
  der Schwierigkeitsgrad aus dem eingetragenen Schaden; der Wurf sagt, ob der
  Zauber hält.
- **Stufe.** Die Erfahrung verrät, welche Stufe zusteht – ein Knopf setzt sie.
- **Zauber.** Ein Tipp auf den Namen holt den ganzen Zaubertext ans Blatt.
  Kein Blättern ins Kompendium mitten im Zug.

### 3.4 Bildnis und Figur

Oben auf dem Blatt lässt sich ein Bild hochladen; es steht danach auf dem
Blatt und in der Übersicht der Runde. Auf der Karte ist jede Figur ein
Plättchen in der Farbe ihrer Besitzerin, mit dem Namen daneben.

> Bis zu einer früheren Fassung gab es dafür eine **Figurenschmiede**, die
> aus Volk, Statur, Rüstung und Farben eine kleine 3D-Miniatur zusammensetzte
> und daraus Bildnis und Spielfigur goss. Sie ist entfernt – samt der
> 3D-Bibliothek, die sie mitbrachte. **Schon gegossene Figuren bleiben
> erhalten** und stehen weiter auf dem Tisch; neue entstehen nicht mehr.

### 3.5 Mitnehmen

Der Knopf **Mitnehmen** sichert das Blatt als **eine einzelne Datei** aufs
Gerät – mit Bildnis, Figur und allem, was darauf steht. Diese Datei braucht
weder Netz noch Server; ein Doppelklick genügt, auf jedem Gerät. Gedruckt
sieht sie aus wie ein Charakterbogen.

Gedacht ist sie für die Vorbereitung, wenn der Almanach nicht läuft, und für
den Zug zur Runde. **Änderungen darin wandern nicht zurück** – am Spieltisch
gilt das Blatt im Almanach. Ganz hinten in der Datei steckt der vollständige
Datensatz; sie ist damit zugleich eine Sicherung.

---

## 4. Der Spieltisch

### 4.1 Bewegen und Zeigen

- **Schieben** mit einem Finger oder gedrückter Maustaste, **zoomen** mit
  Mausrad oder zwei Fingern. Auch eine Karte über zweihundert Meter lässt
  sich ganz herauszoomen – dann verschwinden die Rasterlinien, weil sie bei
  der Größe nur noch ein Grauschleier wären.
- **Die eigene Figur ziehen**; beim Loslassen schnappt sie aufs Raster.
  Fremde Figuren bewegt nur die Spielleitung.
- **Alt+Klick** lässt eine Stelle für alle kurz aufleuchten – praktisch statt
  „da vorne links, nein, weiter unten“.
- **Lineal** und **Zeigefinger** stehen allen zur Verfügung.

### 4.2 Maßstab

Unter *Raster* stellt die Spielleitung ein, wofür ein Feld steht: **fünf Fuß**
nach Regelwerk oder **ein Meter**. Darunter steht, wie groß die Karte
insgesamt ist. Eine leere Szene lässt sich „ohne Karte“ in der gewünschten
Feldzahl anlegen, bis **250 × 250** – bei einem Meter je Feld also
zweihundertfünfzig Meter im Quadrat.

### 4.3 Initiative

Beginnt ein Kampf, würfelt jede Spielerin ihre Initiative **selbst** am
Spieltisch; sie steht sofort in der Liste der Spielleitung. Trefferpunkte
wandern zwischen Kampfliste und Charakterblatt **in beide Richtungen**.

---

## 5. Sicht, Licht und Nebel

Das ist das eigenwilligste Stück des Almanachs und verdient eine genaue
Beschreibung.

### 5.1 Drei Zustände statt zwei

Für die Runde hat jedes Feld einen von drei Zuständen:

| Zustand | Aussehen | Bedeutung |
| --- | --- | --- |
| **unerkundet** | ganz verdeckt | Hier war die Runde nie |
| **erkundet** | gedämpft | Hier war sie schon, sieht es aber gerade nicht |
| **im Blick** | offen | Hier schaut sie gerade hin |

Die Spielleitung sieht **alles**, nur unterschiedlich hell abgesetzt, damit
sie erkennt, was die Runde gerade sieht.

### 5.2 Der Nebel folgt den Sinnen

Trägt eine Spielerin unter *Kampf → Widerstand und Sinne* eine **Sichtweite**
ein, bekommt sie einen offenen Bereich um ihre Figur – so weit, wie ihr Blick
reicht. Er **hängt an der Figur** und bewegt sich nur, wenn sie sich bewegt.
Ohne Eintrag sieht sie wie zuvor alles Aufgedeckte.

Wichtig: **Jeder Spieler bekommt seine eigene Fassung der Szene.** Der Server
rechnet die Sicht je Person aus und schickt jedem nur, was er sehen darf.

### 5.3 Dunkle Szenen und Licht

Schaltet die Spielleitung unter *Raster* die **dunkle Szene** ein, zählt ab
dann, was ohne Licht wahrgenommen wird:

```
helle Szene:   Reichweite = min(Sichtweite, Wetter-Grenze)

dunkle Szene:  Reichweite = min( max(Sichtweite, eigenes Licht), Wetter-Grenze )
               sichtbar   = Dunkelsicht-Scheibe
                          ∪ beleuchtete Felder innerhalb der Reichweite
```

Im Klartext:

- Eine Figur mit **eigener Lichtquelle** – Fackel, Laterne, Zauber – sieht so
  weit, wie ihre Sichtweite **oder ihr Licht** trägt, je nachdem, was weiter
  ist. Eine Fackel erweitert das Sichtfeld also wirklich.
- **Fremdes Licht** hilft nur so weit, wie der eigene Blick ohnehin
  hinreicht: Man sieht die beleuchtete Halle, aber nicht bis ans andere Ende
  der Welt, nur weil dort jemand eine Laterne hält.
- **Dunkelsicht** deckt ihren Bereich unabhängig von Licht auf.
- **Sichtweite hier** ist eine obere Grenze für alle in dieser Szene – für
  Nebelbänke, Schneetreiben, dichten Wald. `0` hebt sie auf.

### 5.4 Zwei Grenzen, die man kennen sollte

- **Es gibt keine Wände.** Licht und Blick gehen hindurch. Wer will, dass
  hinter der Ecke nichts zu sehen ist, malt dort Nebel – der ist die einzige
  Sichtsperre.
- **Dämmriges Licht zählt wie helles.** Der Nachteil auf Wahrnehmung im
  Zwielicht ist eine Regel für den Wurf, nicht für den Nebel.

Beides ist Absicht, nicht Versäumnis: Wandberechnung würde die Karte an
Bedienung und Rechenzeit kosten, was sie an Genauigkeit gewinnt.

### 5.5 Wie der Nebel übers Netz kommt

Bei einer Karte von 200 × 200 Feldern gibt es 40 000 Felder. Als Liste von
Koordinaten wären das je Bewegung mehrere hundert Kilobyte, für jeden Spieler
einzeln – bei fünf Spielern und jedem Schritt.

Der Almanach schickt stattdessen eine **Bitkarte**: ein Bit je Feld,
base64-verpackt. Aus 348 KB werden 6,5 KB; aus 1,7 MB je Bewegung werden
33 KB. Deshalb bleibt auch eine große Karte auf dem iPad flüssig.

---

## 6. Hinter dem Schirm der Spielleitung

### 6.1 Kartenbibliothek

Unter *Spielleitung → Karten* liegen die Battlemaps. Ganze Stapel lassen sich
auf einmal hochladen, mit Schlagworten versehen („Wald“, „Nacht“, „Verlies“)
und über die Suche wiederfinden.

- **Auflegen** holt eine Karte samt **bereits aufgedecktem Nebel** zurück auf
  den Tisch – die Runde steht wieder da, wo sie aufgehört hat.
- **Frisch** beginnt sie neu unter geschlossenem Nebel.
- **Raster in der Bibliothek merken** speichert die eingestellte Feldgröße
  zur Karte: Jede spätere Szene aus dieser Karte kommt schon passend auf den
  Tisch.

### 6.2 Der Vorhang

**Vorhang zu** – und nur die Spielleitung sieht den Tisch. Die Runde bekommt
kein Bild, keine Figuren, nicht einmal den Namen der Szene. Dahinter lässt
sich in Ruhe die Karte wechseln, die Gegner stellen, der Nebel malen. Ein
Klick auf das rote Band öffnet wieder.

In der Szenenlade legt **verdeckt** eine Szene gleich hinter dem Vorhang auf.
Kampf, Beute und Handzettel laufen daneben weiter – der Vorhang verdeckt den
Tisch, nicht den Abend.

### 6.3 Nebel malen

**Aufdecken** und **Verhüllen** malen den Nebel des Krieges. Der übliche Weg:
vor dem Spiel einmal alles verhüllen, dann Raum für Raum öffnen. Was nie
aufgedeckt wurde, wird der Runde gar nicht erst geschickt – auch die Figuren
nicht, die dort stehen.

### 6.4 Durch die Augen eines NSC

Die Spielleitung sieht immer alles. Will sie wissen, was ihr Späher sieht,
bevor sie ihn losschickt, wählt sie ihn oben rechts unter **alles sehen**
aus – dann sieht sie **genau seine Sicht**, mit seinen Sinnen und seinem
Licht. Zurück geht es über denselben Weg.

Verknüpft man eine Figur mit einem NSC-Blatt, gelten dessen Sinne für ihre
Sicht.

### 6.5 Bestiarium und Begegnungen

- Im **Bestiarium** genügt ein Klick, um „3 Goblins“ samt gewürfelter
  Initiative in den Kampf zu stellen – wahlweise **verborgen**, bis der
  Hinterhalt zuschnappt. Monster lassen sich aus dem Kompendium übernehmen
  oder von Hand anlegen, mit Schlagworten und eigener Figur.
- Unter **Begegnungen** werden Gruppen einmal zusammengestellt und an jedem
  Abend mit einem Klick gestellt – samt gewürfelter Initiative. Was
  improvisiert wurde, sichert **Laufenden Kampf sichern** für das nächste Mal.
- **Figuren aus dem Kampf** legt für jeden Kämpfer eine Figur auf die Karte.

### 6.6 Notizen und Handzettel

Notizen mit Titel und Schlagworten, durchsuchbar. Jede lässt sich als
**Handzettel** an die Runde austeilen – die sieht sie dann am Spieltisch.
Alles andere bleibt hinter dem Schirm.

---

## 7. Würfeln

Der **Würfelbeutel** unten rechts ist von jeder Seite aus erreichbar: Anzahl
und Modifikator eintragen, Würfel antippen, fertig.

- **Vorteil und Nachteil** gelten für den ersten W20 im Wurf.
- **Eigene Ausdrücke** wie `2W6+3` gehen auch.
- **Verdeckt** würfelt nur für die Spielleitung – die Runde sieht nichts.
- Gewürfelt wird **auf dem Server**. Jeder Wurf steht damit sofort bei allen
  in der Wurfchronik, und niemand kann seinem Browser einen besseren Wurf
  einreden.

---

## 8. Chat

Unten rechts, neben dem Würfelbeutel, liegt der Chat am Tisch. Er kennt zwei
Arten von Zeilen, und der Unterschied ist eine Spalte in der Datenbank:

| | Wer liest mit |
| --- | --- |
| **an alle** | jede und jeder in der Runde |
| **geflüstert** | ausschließlich die beiden Beteiligten |

**Geflüstertes erreicht auch die Spielleitung nicht.** Das ist Absicht:
„flüstern“ soll heißen, was es sagt. Wie überall im Almanach entscheidet das
der Server – die Zeile wird den übrigen Fenstern gar nicht erst geschickt,
sie ist dort nicht bloß ausgeblendet.

Wer als Spielleitung etwas Geheimes an die Runde geben will, hat dafür die
**Handzettel**: Die sind zum Austeilen gedacht und stehen hinterher in der
Chronik.

**Der Chat ist ein Gespräch, kein Archiv.** Die letzten 300 Zeilen bleiben,
ältere fallen hinten heraus, und **in der Chronik steht davon nichts** – die
soll nach dem Abend lesbar bleiben, und das wäre sie nicht, wenn jede
Nachfrage nach dem Pizzadienst darin stünde. Die Spielleitung kann den Chat
vor der nächsten Runde leeren.

---

## 9. Beute

Am Spieltisch liegt unter **Beute** die gemeinsame Kiste: Münzen und
Gefundenes, für alle sichtbar, und jede und jeder darf eintragen.

**Auf … teilen** rechnet aus, was auf jeden Kopf entfällt. Münzen werden
dabei **nur nach unten gewechselt** – damit niemand ein Platinstück
ausgezahlt bekommt, das die Runde nie besessen hat. Die Spielleitung kann die
Anteile mit einem Knopf in die Beutel schreiben lassen.

---

## 10. Klang

Unter *Spielleitung → Klang* werden **Spotify-Links** als Ambiente
hinterlegt: Link einfügen, benennen, verschlagworten. **Auflegen** zeigt der
ganzen Runde, was jetzt dran ist. Hängt eine Ambiente an einer Karte, legt
sie sich mit der Karte auf.

Am Tisch erscheint unten die **Klangleiste** mit dem Namen und einem Knopf
*In Spotify öffnen*.

**Der Almanach spielt nichts ab** – er sagt nur, was dran ist. Jeder hört es
in seinem eigenen Spotify, auf seinem eigenen Gerät, so laut er mag. Das geht
mit jedem Spotify-Konto, auch ohne Premium, und wer nicht mithören will,
klickt einfach nicht.

---

## 11. Chronik

Der Almanach schreibt mit, was am Tisch geschieht: Würfe, Wunden, wer zu
Boden geht, welche Gegner auftreten, wohin die Runde zieht, was ausgeteilt
wird.

Unter **Chronik** steht der Abend hinterher als Protokoll, nach Stationen und
Kämpfen geordnet, und lässt sich als Datei sichern. Die Spielleitung trägt
nach, was der Almanach nicht sehen konnte, und schließt am Ende die Sitzung.

**Es wird nichts mitgehört und nichts aufgenommen.** Grundlage ist allein,
was ohnehin durch den Almanach läuft.

Freiwillig lässt sich ein Sprachmodell anschließen (`CHRONIK_KI_URL`), das
daraus einen erzählenden Rückblick macht. Ohne diese Einstellung bleibt der
Knopf verborgen.

---

## 12. Kompendium

Völker, Klassen, Hintergründe, Talente, Zauber, Ausrüstung, magische
Gegenstände, Monster und Zustände – aus der offenen D&D-5e-API
([dnd5eapi.co](https://www.dnd5eapi.co/), auf Grundlage des SRD).

Der Almanach ist dabei ein **Zwischenspeicher**: Was einmal abgerufen wurde,
liegt **30 Tage** örtlich und wird auch bei wackligem Internet sofort
ausgeliefert. Ist die Quelle nicht erreichbar, gilt der alte Stand, statt daß
gar nichts kommt.

Die **Feldbezeichnungen** sind auf Deutsch („Wirkzeit“, „Rüstungsklasse“,
„Herausforderungsgrad“). Die Regeltexte selbst bleiben in der Sprache der
Quelle – sie stammen nicht aus diesem Projekt.

Mit `DND5E_API_BASE` lässt sich auf eine andere Fassung umstellen, etwa
`…/api/2024` für die neueren Regeln.

---

## 13. Wie die Technik dahinter arbeitet

Für alle, die darunter schauen wollen. Die genaue Beschreibung der
Schnittstelle steht in [API.md](API.md).

### 13.1 Der Aufbau

```
frontend/   React 19, Vite, Tailwind CSS v4, PWA
backend/    Node.js, Express, SQLite über das eingebaute node:sqlite
```

**Keine neuen Abhängigkeiten für den Kern:** express und cors, mehr nicht.
SQLite steckt seit Node 22.5 in Node selbst – nichts muss kompiliert werden,
kein node-gyp, keine Bauwerkzeuge.

### 13.2 Der Live-Kanal

**Server-Sent Events**, keine WebSockets. Gründe:

- gewöhnliches HTTP, das ohne Sonderbehandlung durch den Cloudflare-Tunnel geht
- keine zusätzliche Bibliothek
- wird nach einem Funkloch von allein wieder aufgebaut

Der Kanal ist **rollengefiltert**: Jede Nachricht geht nur an die, die sie
sehen dürfen. Bei der Szene bekommt sogar jeder Spieler seine **eigene**
Fassung, weil jeder eine andere Sicht hat.

Blinkt der Punkt neben dem Namen rot, ist die Verbindung gerade unterbrochen;
leuchtet er golden, laufen die Änderungen wieder ein.

### 13.3 Darstellung und Daten sind getrennt

Der Server schickt **unveränderliche Kennungen** – `schwer_verwundet`,
`einladung_verbraucht`, `handzettel`. Wie das am Bildschirm heißt, entscheidet
allein die Oberfläche, und zwar an einer einzigen Stelle:
`frontend/src/lib/beschriftung.js`.

Wer den Almanach neu gestaltet, übersetzt oder in eine ganz andere Anwendung
überführt, tauscht diese Datei aus und muss keine Zeile im Server anfassen.

### 13.4 Der Vertrag

`npm run vertrag` startet einen eigenen Almanach auf einem freien Port mit
frischer Datenbank, spielt eine Runde durch und prüft in **144 Prüfungen**,
dass die Schnittstelle sich verhält, wie die Oberfläche es erwartet – samt
der Frage, ob wirklich verborgen bleibt, was verborgen bleiben soll.

Wer die Oberfläche umbaut, weist damit nach, dass der Unterbau unangetastet
blieb. Wer am Server schraubt, merkt sofort, wenn er etwas bricht.

---

## 14. Daten, Sicherung und Umzug

### 14.1 Wo alles liegt

Der **ganze Almanach** steckt in einem Ordner:

```
backend/data/                (oder das Docker-Volume dnd-manager-data)
  ├── manager.sqlite3        alles: Konten, Charaktere, Karten, Chronik
  ├── medien/                hochgeladene Karten und Bildnisse
  └── sicherungen/           was npm run sicherung anlegt
```

Umziehen heißt: diesen Ordner kopieren. Mehr nicht.

### 14.2 Sichern

```bash
npm run sicherung                 # nur die Datenbank
npm run sicherung -- --medien     # samt Karten und Bildnissen
```

Die Datenbank darf im Betrieb **nicht einfach kopiert** werden – der Almanach
schreibt im WAL-Verfahren, und eine Kopie mitten im Spiel erwischt womöglich
einen halben Schreibvorgang. Das Skript zieht mit `VACUUM INTO` einen in sich
stimmigen Stand, während weitergespielt wird.

### 14.3 Die eine Falle beim Zurückspielen

Neben `manager.sqlite3` liegen im Betrieb `manager.sqlite3-wal` und
`manager.sqlite3-shm`. Darin steht, was zuletzt geschrieben wurde. Legt man
nur die Datenbank zurück und lässt die beiden liegen, **legt sich der alte
Stand beim Start wieder darüber – ohne jede Fehlermeldung.**

Alle drei müssen weg. Ausführlich steht das in
[EINRICHTUNG.md, Schritt 8.3](EINRICHTUNG.md#83-zurückspielen).

---

## 15. Grenzen, die eingebaut sind

| | Wert |
| --- | --- |
| Bild-Upload | 12 MB je Datei; der Browser verkleinert vorher auf 8192 Bildpunkte Kantenlänge |
| Karte | bis 250 × 250 Felder |
| Nebel | bis 65 536 Felder je Szene |
| Anmeldung | gilt 30 Tage |
| Fehlversuche | 8, dann 10 Minuten Sperre je Name und Herkunft |
| JSON je Anfrage | 2 MB (Karten gehen einen eigenen Weg) |
| Chat | die letzten 300 Zeilen, 2000 Zeichen je Nachricht |
| Kompendium-Cache | 30 Tage, danach neu geholt – alter Stand als Rückfallebene |
| Protokolle (Docker) | 3 × 10 MB je Dienst |

---

## 16. Was der Almanach bewusst nicht tut

Damit niemand danach sucht:

- **Keine Wände und keine Sichtlinien.** Der Nebel ist die einzige Sperre.
- **Kein Unterschied zwischen hellem und dämmrigem Licht** für den Nebel.
- **Er spielt keine Musik ab.** Er sagt, was dran ist; abgespielt wird in
  Spotify.
- **Er würfelt nicht heimlich für die Runde.** Verdeckte Würfe kann nur die
  Spielleitung auslösen.
- **Er hört nichts mit.** Die Chronik kennt nur, was ohnehin durch ihn läuft –
  der Chat gehört ausdrücklich nicht dazu.
- **Er liest Geflüstertes nicht mit.** Auch die Spielleitung nicht.
- **Er schickt nichts nach außen.** Ausnahme sind die zwei Dinge, die man
  ausdrücklich einrichtet: das Kompendium holt Regeldaten, und ein
  freiwilliges Sprachmodell bekommt den Chronik-Text.
- **Er rechnet keine Regeln durch,** die am Tisch besser besprochen werden.
  Er nimmt Arbeit ab, er entscheidet nicht.

---

Weiter zu den beiden kurzen Anleitungen für den Abend selbst:
[Spielleitung](SPIELLEITUNG.md) · [Runde](SPIELER.md)
