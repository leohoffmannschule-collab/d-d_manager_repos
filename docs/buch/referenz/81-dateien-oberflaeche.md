# Dateiverzeichnis: die Oberfläche

> Dieses Kapitel schreibt `npm run handbuch` aus dem Code (scripts/handbuch/referenz/).
> Änderungen gehören in den Code und seine Kommentare, nicht hierher.

Alle Dateien der Oberfläche (213 Dateien, 19.331 Zeilen): Seiten, Bauteile, die Datenschicht in lib/, die Stilblätter und der Bau. Zu jeder Datei ihr Kopfkommentar und ihre Ausfuhren.

Sammelstellen wie icons.jsx oder lib/api.js führen nichts Eigenes aus, sondern reichen weiter – bei ihnen steht, woher.

## frontend/src/

### frontend/src/App.jsx

*110 Zeilen*

Der Grundriss der Oberfläche: welche Adresse welche Seite zeigt – und
welche drei Tore jemand passieren muss, bevor er überhaupt eine sieht.

Die Tore stehen ineinander, und die Reihenfolge ist kein Zufall:

1. angemeldet?      – sonst die Anmeldung (Login)
2. Kampagne gewählt? – sonst die Kampagnenauswahl
3. Live-Draht offen  – erst jetzt lohnt er sich, denn er hängt an
                       genau einer Kampagne (siehe lib/live.jsx)

Erst hinter allen dreien stehen die eigentlichen Seiten.

**Ausfuhren**

- `App` (default function)

### frontend/src/index.css

*32 Zeilen*

Das Stilblatt des Almanachs – nur ein Inhaltsverzeichnis.

Jede Zeile hier holt eine Datei aus `stile/`. Wer etwas am Aussehen
ändern will, geht dorthin; diese Datei bleibt, wie sie ist.

Die Reihenfolge ist nicht beliebig:

1. tailwindcss   – muss zuerst kommen, alles Weitere baut darauf auf
2. schriften     – die @font-face-Regeln, bevor jemand sie benutzt
3. farben        – die Namen, auf die sich alles Folgende beruft
4. grundlage     – Seite, Pergament, Grundschrift
5. bauteile      – Velinblatt, Felder, Knöpfe
6. spieltisch/   – der Tisch: Farben, Fläche, Figuren, Nebel und Lineal
                   (in dieser Reihenfolge; eine Regel darf die einer
                   früheren Datei überschreiben)
7. eigenheiten   – Kleinkram des Browsers

(CSS verlangt außerdem, dass alle @import-Zeilen vor jeder anderen Regel
stehen – ein weiterer Grund, warum in dieser Datei sonst nichts steht.)

### frontend/src/main.jsx

*34 Zeilen*

Der Startpunkt der Oberfläche – die erste Datei, die der Browser ausführt.

Hier wird React an das leere `<div id="root">` aus der index.html gehängt.
Alles, was du später auf dem Schirm siehst, hängt an diesem einen Aufruf.

Die drei Umhüllungen von außen nach innen:

```
StrictMode     – nur beim Entwickeln: React ruft manches absichtlich
                 doppelt auf, um unsaubere Nebenwirkungen aufzudecken.
                 Im fertigen Bau (npm run build) tut er nichts.
BrowserRouter  – macht aus der Adresszeile den Zustand der Anwendung:
                 „/tisch“ zeigt den Spieltisch, ohne die Seite neu zu
                 laden. Welche Adresse was zeigt, steht in App.jsx.
AuthProvider   – weiß, wer angemeldet ist. Muss außen liegen, weil
                 fast alles darunter danach fragt (siehe lib/auth.jsx).
```

## frontend/src/components/

### frontend/src/components/Beute.jsx

*65 Zeilen*

Die Beutekiste – am Spieltisch im Reiter „Beute“.

Eintragen darf jede und jeder: Was die Runde findet, gehört erst einmal
allen. Auszahlen darf nur die Spielleitung, denn dabei wird in fremde
Charakterblätter geschrieben.

Das Teilen rechnet der **Server** aus (backend/src/beute.js) – und
zwar so, wie es am Tisch wirklich zugeht: von der größten Münze zur
kleinsten, Unteilbares wird gewechselt und weitergereicht, nie umgekehrt.
Aus 43 Gold für drei werden so 14 Gold je Kopf und nicht „1 Platin, 4
Gold“. Was übrig bleibt, bleibt liegen – wer den Rest bekommt, ist eine
Frage für den Tisch und nicht für den Almanach.

Die Teile liegen in beute/: Muenzen, Teilen (samt Auszahlen), Fundstueck,
NeuerFund; die Münzsorten in beute/muenzen.js.

**Ausfuhren**

- `Beute` (default function)

### frontend/src/components/BlattEinlesen.jsx

*149 Zeilen*

Ein mitgenommenes Blatt wieder einlesen – der Gegenknopf zu „Mitnehmen“.

Gedacht für den Weg hin und zurück: Blatt mitnehmen, die Datei bearbeiten
- von Hand oder von einer KI („mach ihn Stufe 5“) –, und hier wieder
hereinholen. Danach ist es ein ganz gewöhnliches Blatt im Almanach.

Steht an zwei Stellen:
- in der Übersicht („Blatt einlesen“): Trägt die Datei die Kennung eines
  Blattes, das man ändern darf, wird angeboten, dieses zu aktualisieren;
  sonst entsteht ein neues.
- im Kopf eines Blattes („Einlesen“, mit `ziel`): Die Datei aktualisiert
  dieses Blatt – über denselben Weg wie jede Änderung am Blatt
  (`onErsetzen`, gespeichert von pages/blatt/useBlatt.js).

Gespeichert wird nie sofort: Erst zeigt die Vorschau
(einlesen/Vorschau.jsx), was die Datei enthält und was sich ändern würde.
Gelesen wird im Browser (lib/blattEinfuhr.js) – die Datei geht nicht als
Ganzes an den Server, nur das fertige Blatt.

**Ausfuhren**

- `BlattEinlesen` (default function) – 

### frontend/src/components/Chat.jsx

*217 Zeilen*

Der Chat am Tisch.

Wie der Würfelbeutel: ein runder Knopf unten rechts, dahinter das Fenster.
Wer geflüstert hat, sieht das an der Zeile; wer nicht gemeint war, bekommt
sie gar nicht erst – das entscheidet der Server.

Geflüstertes erreicht ausdrücklich auch die Spielleitung nicht. Das ist
eine bewusste Entscheidung: Ein Flüstern, bei dem jemand mithört, ist
kein Flüstern, und am Tisch tuschelt man auch, ohne zu fragen.

Gezeichnet wird das Fenster von unten nach oben (`flex-col-reverse`), damit
die jüngste Zeile ohne Nachhelfen unten steht.

**Ausfuhren**

- `Chat` (default function)

### frontend/src/components/CompendiumDetail.jsx

*119 Zeilen*

Die Einzelheiten eines Kompendium-Eintrags.

Die Besonderheit: Wir wissen vorher *nicht*, welche Felder kommen. Ein
Zauber hat andere als ein Monster, und die 5e-API darf jederzeit neue
hinzufügen. Deshalb wird hier nichts fest verdrahtet, sondern durch das
Objekt gelaufen und jedes Feld nach bestem Wissen dargestellt:

- `SKIP_KEYS` wirft technischen Kram weg (Kennungen, Adressen).
- `humanizeKey` macht aus „casting_time“ eine deutsche Beschriftung.
- `renderValue` kommt mit Text, Zahlen, Listen und verschachtelten
  Objekten zurecht.

Der Preis dafür ist, dass es nie so schön aussieht wie eine von Hand
gebaute Ansicht. Der Gewinn: Es bricht nicht, wenn die API sich ändert.

**Ausfuhren**

- `CompendiumDetail` (default function)

### frontend/src/components/DiceRoller.jsx

*249 Zeilen*

Der Würfelbeutel: unten rechts der Knopf, dahinter die Wurfchronik der
ganzen Runde.

Gewürfelt wird auf dem *Server*. Das ist der Kern der Sache: Ein im
eigenen Browser erzeugtes Ergebnis wäre eine Behauptung, kein Wurf. So
steht jeder Wurf mit Namen und Uhrzeit bei allen am Tisch.

Die Spielleitung kann verdeckt würfeln (`secret`) – solche Würfe bekommt
ein Spielerfenster gar nicht erst geschickt.

**Ausfuhren**

- `DiceRoller` (default function)

### frontend/src/components/HttpsHinweis.jsx

*51 Zeilen*

Ein Hinweis auf der Anmeldeseite: „Hier geht dein Kennwort unverschlüsselt
durchs WLAN – nimm lieber den verschlüsselten Eingang.“

Erscheint nur, wenn alle drei Dinge zutreffen:

- die Seite kam über `http://`,
- nicht vom eigenen Rechner (localhost verlässt das Gerät nie),
- und der Almanach hat einen HTTPS-Eingang offen (npm run zertifikat;
  der Server nennt seinen Port unter /api/health).

Über den Tunnel kommt die Seite ohnehin als `https://` – dort schweigt
der Hinweis. Weitergeleitet wird bewusst nicht von selbst: Wer das
Stammzertifikat noch nicht installiert hat, stünde sonst vor einer
Warnseite, ohne zu wissen, warum.

**Ausfuhren**

- `HttpsHinweis` (default function)

### frontend/src/components/icons.jsx

*68 Zeilen*

Alle Symbole des Almanachs, als SVG von Hand gezeichnet.

Warum keine Emoji? Sie sehen auf jedem Gerät anders aus, lassen sich nicht
einfärben und passen selten zu einem Pergament. Warum keine Symbol-
Bibliothek? Weil der Almanach ohne Netz laufen soll und ein Paket für
dreißig Symbole schwerer wöge als diese Datei.

Alle bauen auf `Icon` auf und erben von dort `stroke="currentColor"`: Das
Symbol nimmt die Textfarbe seiner Umgebung an. Deshalb genügt ein
`className="text-gold"` am Symbol, und es ist golden – ohne eine einzige
Zeile über Farben hier drin.

Ein neues Symbol: `Icon` umhüllen, Pfade hinein, in Vierundzwanzigstel
denken (das `viewBox` ist 24×24), und `strokeWidth` dem Rest überlassen.
Es kommt in die Datei unter icons/, zu deren Sachgebiet es gehört:

```
icons/rahmen.jsx       – der gemeinsame Rahmen (Icon)
icons/wuerfel.jsx      – die Würfel
icons/grundformen.jsx  – Plus, Minus, Haken, Kreuz, Lupe, Winkel
icons/almanach.jsx     – Schriftrolle, Buch, Feder, Karte, Kerze …
icons/runde.jsx        – Runde, Spieltisch und Spielleitung
icons/klang.jsx        – der Klangteppich
icons/zierrat.jsx      – der Stern vor jeder Rubrik
```

Eingeführt wird trotzdem immer von hier (`from './icons.jsx'`): Wer ein
Symbol braucht, soll nicht wissen müssen, in welcher Schublade es liegt.

**Ausfuhren**

- `IconD20` (aus ./icons/wuerfel.jsx)
- `IconD20Detailed` (aus ./icons/wuerfel.jsx)
- `IconPlus` (aus ./icons/grundformen.jsx)
- `IconMinus` (aus ./icons/grundformen.jsx)
- `IconCheck` (aus ./icons/grundformen.jsx)
- `IconClose` (aus ./icons/grundformen.jsx)
- `IconSearch` (aus ./icons/grundformen.jsx)
- `IconChevronRight` (aus ./icons/grundformen.jsx)
- `IconScroll` (aus ./icons/almanach.jsx)
- `IconBook` (aus ./icons/almanach.jsx)
- `IconHelp` (aus ./icons/almanach.jsx)
- `IconShield` (aus ./icons/almanach.jsx)
- `IconQuill` (aus ./icons/almanach.jsx)
- `IconMap` (aus ./icons/almanach.jsx)
- `IconCandle` (aus ./icons/almanach.jsx)
- `IconSun` (aus ./icons/almanach.jsx)
- `IconClock` (aus ./icons/almanach.jsx)
- `IconKey` (aus ./icons/runde.jsx)
- `IconSwords` (aus ./icons/runde.jsx)
- `IconCrown` (aus ./icons/runde.jsx)
- `IconUsers` (aus ./icons/runde.jsx)
- `IconEye` (aus ./icons/runde.jsx)
- `IconEyeOff` (aus ./icons/runde.jsx)
- `IconFog` (aus ./icons/runde.jsx)
- `IconTarget` (aus ./icons/runde.jsx)
- `IconTrash` (aus ./icons/runde.jsx)
- `IconLogout` (aus ./icons/runde.jsx)
- `IconUpload` (aus ./icons/runde.jsx)
- `IconHeart` (aus ./icons/runde.jsx)
- `IconLink` (aus ./icons/runde.jsx)
- `IconDownload` (aus ./icons/runde.jsx)
- `IconChat` (aus ./icons/runde.jsx)
- `IconNote` (aus ./icons/klang.jsx)
- `IconPlay` (aus ./icons/klang.jsx)
- `IconPause` (aus ./icons/klang.jsx)
- `IconSync` (aus ./icons/klang.jsx)
- `IconSpeaker` (aus ./icons/klang.jsx)
- `Fleuron` (aus ./icons/zierrat.jsx)
- `Wappenschild` (aus ./icons/zierrat.jsx)

### frontend/src/components/Initiative.jsx

*117 Zeilen*

Die Kampfliste: wer wann dran ist, wie es ihm geht, was ihn plagt.

Zwei Gesichter, gesteuert über `variant`:
```
'voll'  – hinter dem Schirm (Spielleitung → Kampf): alle Werte, alle
          Knöpfe, auch die verborgenen Gegner.
sonst   – am Spieltisch für die Runde: Monster-Trefferpunkte bleiben
          ein Wort („verwundet“) statt einer Zahl, Verborgenes fehlt
          ganz. Gefiltert hat das schon der Server – diese Datei
          *zeigt* nur weniger an, sie versteckt nichts.
```

Die Initiative darf jeder für seine eigene Figur eintragen; das ist der
einzige Eingriff in den Kampf, der nicht der Spielleitung vorbehalten ist.

Die Teile liegen in initiative/:
```
Zeile.jsx          – eine Zeile der Liste, aufklappbar
Lebensbalken.jsx   – Trefferpunkte als Balken oder Wort
Wunden.jsx         – Schaden und Heilung eintragen
Zustandswahl.jsx   – Zustände an- und abwählen
NeuerKaempfer.jsx  – einen Kämpfer von Hand eintragen
arten.js           – Zustände, Farben und Namen der Arten
```

**Ausfuhren**

- `Initiative` (default function) – Die Initiativliste – am Spieltisch schmal („tafel“), auf dem Board der Spielleitung mit allen Griffen („voll“).

### frontend/src/components/Kopierziel.jsx

*105 Zeilen*

„In Kampagne …“ – ein einzelnes Stück in eine andere Kampagne kopieren.

Steht überall dort, wo etwas liegt, das zu einer Geschichte gehört: am
Charakterblatt, am Handzettel, an der Szene, am Fund in der Beutekiste.
Angeboten werden nur Kampagnen, in denen die Spielleitung selbst sitzt –
und nur, wenn es überhaupt eine zweite gibt.

Kopiert wird, nicht verschoben: Das Stück bleibt, wo es ist. Deshalb steht
danach kurz da, wohin es gegangen ist, statt dass etwas verschwindet.

- `@param` kopieren     async (zielId) => … – der eigentliche Aufruf
- `@param` nachOben     Liste nach oben aufklappen (wenn unten kein Platz ist)
- `@param` beschriftung Aufschrift des Knopfes
- `@param` klasse       Anstelle der voreingestellten Knopf-Klassen, damit sich der Knopf seiner Umgebung anpasst (Szenenlade etwa setzt alles in Kapitälchen)

**Ausfuhren**

- `Kopierziel` (default function)

### frontend/src/components/Laufwert.jsx

*20 Zeilen*

Ein Element mit Werten, die erst im Browser feststehen – ohne `style`.

Der Haken `useLaufstil` (lib/laufstil.js) darf nicht in einer Schleife
stehen. In Listen – die Farbpunkte der Konten, die Zeilen im Chat, die
Farben im Figurenfeld – trägt deshalb jedes Element sein eigenes kleines
Bauteil:

```
<Laufwert als="span" className="farbpunkt h-3 w-3" werte={{ '--farbe': konto.color }} />
```

Alles außer `als`, `werte` und `className` geht unverändert an das
Element (Rückrufe, aria-…, title, ref).

**Ausfuhren**

- `Laufwert` (default function)

### frontend/src/components/Layout.jsx

*122 Zeilen*

Der Rahmen um jede Seite: Kopfleiste oben, Seiteninhalt darunter, und die
drei schwebenden Dinge, die es überall gibt – Würfelbeutel, Chat und
Klangleiste.

`<Outlet />` weiter unten ist der Platzhalter, an dem React Router die
jeweilige Seite einsetzt. In App.jsx stehen die Seiten deshalb als
Kinder von `<Route element={<Layout />}>`: Alles darin bekommt diesen
Rahmen, die Anmeldung und die Kampagnenwahl nicht.

Dass Würfelbeutel und Chat *hier* hängen und nicht auf den einzelnen
Seiten, ist der Grund, warum ein Wurf nicht verlorengeht, wenn jemand
mitten im Kampf auf sein Charakterblatt wechselt.

Was in der Kopfleiste rechts steht, steht nebenan in rahmen/:

```
rahmen/navigation.js        welche Wege es gibt (und für wen)
rahmen/KampagneSchalter.jsx zwischen den eigenen Geschichten wechseln
rahmen/Konto.jsx            Aussehen, Kennwort, Abmelden
rahmen/PasswortWechsel.jsx  das Kennwort ändern
rahmen/Verbindung.jsx       der Punkt, der zeigt, ob der Draht steht
```

**Ausfuhren**

- `Layout` (default function)

### frontend/src/components/RepeatingRows.jsx

*116 Zeilen*

Eine Liste gleichartiger Zeilen, die sich erweitern und kürzen lässt:
Angriffe, Ausrüstung, Merkmale, Ressourcen – überall auf dem Blatt
dasselbe Muster.

Statt das fünfmal zu bauen, beschreibt der Aufrufer nur die Spalten:

```
<RepeatingRows
  items={data.attacks}
  onChange={(neu) => updateData('attacks', neu)}
  fields={[{ key: 'name', label: 'Waffe' }, { key: 'bonus', label: '+' }]}
/>
```

Jede Zeile bekommt beim Anlegen eine eigene Kennung (`newId`). Die ist
nicht Zierde: React braucht für Listen einen stabilen `key`, und der
Listenindex taugt dafür nicht – löscht man die erste Zeile, rutschen alle
anderen eine Stelle hoch, und React ordnet die Eingabefelder falsch zu.

**Ausfuhren**

- `RepeatingRows` (default function)

### frontend/src/components/Stoerung.jsx

*61 Zeilen*

Das Sicherheitsnetz für Knöpfe, die ihren Fehler nicht selbst anzeigen.

Viele Handgriffe am Tisch sind ein einzelner Aufruf ohne eigenes
Fehlerfeld: „Zug weiter“, „Figur entfernen“, „Runde holen“. Weist der
Server so einen Aufruf ab – 403, weil die Rolle inzwischen eine andere
ist, oder 409, weil die Kampagne weggeräumt wurde –, landete die Absage
bisher nur in der Konsole des Browsers. Am Tisch sah es aus, als hätte
der Knopf schlicht nicht funktioniert.

Statt vierzig Knöpfe einzeln mit try/catch zu umwickeln, fängt diese eine
Stelle jede Absage, die niemand behandelt hat, und zeigt den Satz des
Servers (oder, wo einer hinterlegt ist, den aus lib/beschriftung.js).

Nur Absagen *des Servers* – erkennbar am `status`, den lib/api.js
anheftet. Ein Programmierfehler in der Oberfläche bleibt ein
Programmierfehler und gehört in die Konsole, nicht in eine Meldung, mit
der am Tisch niemand etwas anfangen kann.

**Ausfuhren**

- `Stoerung` (default function)

### frontend/src/components/ui.jsx

*194 Zeilen*

Die kleinen, immer wiederkehrenden Bausteine der Oberfläche:
Überschriften, Karten, beschriftete Eingabefelder, Zähler, Schalter.

Warum eigene statt roher `<input>`? Damit ein Zahlenfeld im ganzen
Almanach gleich aussieht und gleich heißt – und damit eine Änderung am
Aussehen an einer Stelle passiert statt an sechzig.

Alle hier arbeiten „gesteuert“ (controlled): Sie merken sich nichts
selbst, sondern bekommen `value` und melden über `onChange` zurück. Den
Zustand hält immer der Aufrufer. Das ist in React die Regel, nicht die
Ausnahme, und der Grund, warum das Charakterblatt alles an einem Ort hat.

**Ausfuhren**

- `Rubric` (function) – Überschrift in Rubrikrot, mit goldenem Stern und durchlaufender Linie.
- `Card` (function) – Aufgelegtes Velinblatt.
- `FieldLabel` (function) – Die kleine Kapitälchen-Beschriftung über einem Feld.
- `TextField` (function) – Ein einzeiliges Textfeld mit Beschriftung darüber. `onChange` bekommt den Text, nicht das Ereignis.
- `TextAreaField` (function) – Ein mehrzeiliges Textfeld mit Beschriftung darüber. `onChange` bekommt den Text.
- `NumberField` (function) – Ein Zahlenfeld mit Beschriftung. `onChange` bekommt eine Zahl – ein geleertes Feld wird zu 0, nicht zu NaN oder ''.
- `SelectField` (function) – Eine Auswahlliste mit Beschriftung; `options` als [[wert, text], …].
- `WeiteField` (function) – Ein Feld für eine Weite. Auf dem Blatt steht sie in Fuß – daran hängt der Nebel am Spieltisch –, eingetippt und abgelesen wird sie aber in dem Maß, das der Charakter führt.
- `Stepper` (function) – Ein Zähler mit − und +, begrenzt auf [min, max] – für alles, was man am Tisch hoch- und runterzählt (verbrauchte Plätze, Ladungen, Trefferwürfel).
- `Toggle` (function) – Ein Kästchen zum An- und Abhaken, als Knopf gebaut – so ist die ganze Zeile mit dem Finger zu treffen, nicht nur das kleine Kästchen.

### frontend/src/components/Wurfmeldung.jsx

*66 Zeilen*

Kurze Anzeige des jüngsten Wurfs – damit ein Wurf vom Charakterblatt
nicht stumm im Würfelbeutel verschwindet, sondern am Tisch auffällt.

Nach 4,5 Sekunden verschwindet sie wieder. Die Prüfung auf die Kennung im
Zeitgeber ist wichtig: Kommt inzwischen ein *neuer* Wurf herein, darf der
alte Zeitgeber ihn nicht mit wegräumen.

Die natürliche 20 und die natürliche 1 werden eigens gesucht und gefeiert
- das ist der Moment, für den am Tisch alle aufschauen.

**Ausfuhren**

- `Wurfmeldung` (default function)

## frontend/src/components/beute/

### frontend/src/components/beute/Fundstueck.jsx

*56 Zeilen*

Ein Gegenstand in der Kiste: Name, Anzahl, Notiz – und wer ihn trägt.

„Trägt“ heißt nur: Er steht bei diesem Charakter vermerkt. In dessen
Inventar wandert er dadurch nicht; das bleibt eine Entscheidung am Tisch.

**Ausfuhren**

- `Fundstueck` (default function)

### frontend/src/components/beute/muenzen.js

*21 Zeilen*

Die fünf Münzsorten der Beutekiste, von der wertvollsten zur kleinsten –
und wie ein Münzhaufen in Worten klingt („14 Gold, 2 Silber“).

Die Reihenfolge ist die, in der auch der Server teilt (backend/src/beute.js):
von oben nach unten, Unteilbares wird eine Stufe tiefer gewechselt.

**Ausfuhren**

- `MUENZEN` (const) – Die Münzsorten als [Schlüssel, Name], von der wertvollsten zur kleinsten.
- `inWorten` (const) – Ein Münzhaufen in Worten: „14 Gold, 2 Silber“ – oder „nichts“.

### frontend/src/components/beute/Muenzen.jsx

*43 Zeilen*

Die Münzen in der Kiste – fünf Felder, eines je Sorte.

Jede Änderung wird sofort örtlich angezeigt und im Hintergrund
gespeichert. Scheitert das Speichern, holt der Live-Kanal den wahren
Stand ohnehin gleich wieder herein; eine eigene Fehlermeldung wäre hier
nur Lärm.

**Ausfuhren**

- `Muenzen` (default function)

### frontend/src/components/beute/NeuerFund.jsx

*42 Zeilen*

Einen Fund in die Kiste legen: Name und Anzahl. Eintragen darf jede und
jeder – was die Runde findet, gehört erst einmal allen.

**Ausfuhren**

- `NeuerFund` (default function)

### frontend/src/components/beute/Teilen.jsx

*115 Zeilen*

Teilen und Auszahlen: Wie viel bekommt jeder, was bleibt übrig – und für
die Spielleitung: ab damit in die Beutel.

Gerechnet wird auf dem Server (`stashApi.teilung`), nicht hier: Dieselbe
Rechnung braucht das Auszahlen, und zwei Fassungen davon gingen früher
oder später auseinander.

Vorgewählt als Empfänger sind alle, die in der Runde stehen; abwählen
lässt sich, wer bei diesem Fund nicht dabei war.

**Ausfuhren**

- `Teilen` (default function)

## frontend/src/components/dm/begegnungen/

### frontend/src/components/dm/begegnungen/Bauplan.jsx

*114 Zeilen*

Der Bauplan einer Begegnung: welche Gegner in welcher Zahl, wer verborgen
beginnt. Posten kommen aus dem Bestiarium, tragen ihre Werte danach aber
selbst – deshalb übersteht eine Begegnung das Löschen des Statblocks.

**Ausfuhren**

- `Bauplan` (default function)

### frontend/src/components/dm/begegnungen/Posten.jsx

*54 Zeilen*

Eine Zeile im Bauplan einer Begegnung: wer, wie viele, verborgen oder
nicht.

Die Werte (TP, RK) stehen im Posten selbst und nicht nur im Bestiarium –
siehe den Kopf von Encounters.jsx, warum.

**Ausfuhren**

- `Posten` (default function)

## frontend/src/components/dm/bestiarium/

### frontend/src/components/dm/bestiarium/AusDemKompendium.jsx

*75 Zeilen*

Ein Monster aus dem Kompendium übernehmen.

Übernommen wird eine **Abschrift**: Werte, Fähigkeiten und Aktionen
werden in den eigenen Eintrag geschrieben, kein Verweis gespeichert. So
lässt sich der Goblin nach Belieben verbiegen, und er bleibt auch dann
da, wenn die 5e-API gerade nicht antwortet.

**Ausfuhren**

- `AusDemKompendium` (default function)

### frontend/src/components/dm/bestiarium/Eintrag.jsx

*106 Zeilen*

Ein Eintrag in der Liste: zugeklappt die Kopfzeile, aufgeklappt der
ganze Statblock.

Die drei Griffe rechts sind der eigentliche Zweck des Bestiariums:
„In den Kampf“ legt so viele Kämpfer an, wie in der Zahl davor stehen,
und würfelt gleich die Initiative. Der zweite tut dasselbe verborgen –
für den Hinterhalt, von dem die Runde noch nichts wissen soll.

**Ausfuhren**

- `Eintrag` (default function)

### frontend/src/components/dm/bestiarium/felder.js

*32 Zeilen*

Die Form eines Eintrags im Bestiarium – und die sechs Attribute in der
Reihenfolge, in der sie auf jedem Statblock stehen.

Die Zahlenfelder sind leere Zeichenketten, nicht 0: Ein Monster ohne
eingetragene Rüstungsklasse ist etwas anderes als eines mit RK 0, und das
soll man dem Formular ansehen.

**Ausfuhren**

- `LEER` (const) – Die Form eines Eintrags im Bestiarium – und die sechs Attribute in der Reihenfolge, in der sie auf jedem Statblock stehen.
- `ATTRIBUTE` (const) – Die sechs Attribute eines Statblocks als [Schlüssel, Kürzel] – in der Reihenfolge des Regelwerks.

### frontend/src/components/dm/bestiarium/Formular.jsx

*122 Zeilen*

Das Formular für einen Eintrag – dasselbe zum Anlegen und zum Ändern.

Gearbeitet wird an einer Kopie im Zustand dieses Bauteils; erst
„Speichern“ reicht sie nach oben. Abbrechen wirft sie weg, ohne dass
irgendwo etwas geschrieben wurde.

**Ausfuhren**

- `Formular` (default function)

## frontend/src/components/dm/

### frontend/src/components/dm/Bestiary.jsx

*146 Zeilen*

Das Bestiarium: die Sammlung von Statblöcken, aus denen im Kampf Kämpfer
werden.

Zwei Wege hinein: von Hand eintippen, oder aus dem Kompendium übernehmen.
Übernommen wird dabei eine **Abschrift** – der Eintrag gehört danach dem
Almanach und lässt sich beliebig verbiegen, ohne dass das Kompendium dazu
erreichbar sein muss.

Ein Weg hinaus: „in den Kampf“, wahlweise mehrfach und wahlweise
verborgen. Der Server würfelt dabei gleich die Initiative und legt für
jeden Gegner einen Kämpfer an.

Das Bestiarium gehört der **ganzen Runde**, nicht einer Kampagne: Ein
Goblin bleibt ein Goblin, gleich in welcher Geschichte er auftritt.

Diese Datei ist das Regal: suchen, filtern, auflisten. Was an einem
einzelnen Eintrag hängt, steht nebenan in bestiarium/:

```
bestiarium/Eintrag.jsx          eine Zeile, zugeklappt oder ganz offen
bestiarium/Formular.jsx         eintragen und ändern
bestiarium/AusDemKompendium.jsx die Abschrift aus der 5e-API
bestiarium/felder.js            das leere Blatt und die sechs Attribute
```

**Ausfuhren**

- `Bestiary` (default function) – Bestiarium: Statblöcke anlegen und mit einem Klick in den Kampf holen.

### frontend/src/components/dm/Encounters.jsx

*137 Zeilen*

Vorbereitete Begegnungen: „Wache am Stadttor“, „3 Goblins und ein Wolf“.

Der Unterschied zum Bestiarium: Dort steht *ein* Statblock, hier eine
ganze Aufstellung samt Anzahl. Einmal gebaut, steht sie mit einem Klick
auf dem Tisch – mit gewürfelter Initiative und wahlweise verborgen, bis
der Hinterhalt zuschnappt.

Ein Posten hält alle nötigen Werte **selbst** fest und verweist nur
nebenbei auf das Bestiarium. Deshalb lässt sich eine Begegnung auch dann
noch stellen, wenn der Statblock dahinter längst gelöscht wurde.

Umgekehrt geht es auch: „Kampf sichern“ macht aus der laufenden
Aufstellung eine Begegnung – gleichnamige Gegner werden dabei wieder zu
einer Gruppe zusammengefasst.

Diese Datei zeigt die Liste der Begegnungen und hält den Entwurf; gebaut
wird in begegnungen/Bauplan.jsx, Zeile für Zeile in begegnungen/Posten.jsx.

**Ausfuhren**

- `Encounters` (default function) – Vorbereitete Begegnungen: einmal zusammenstellen, an jedem Abend wieder stellen. Wer zwischendurch etwas Gutes improvisiert hat, sichert den laufenden Kampf mit einem Knopf.

### frontend/src/components/dm/Kartenbibliothek.jsx

*202 Zeilen*

Die Kartenbibliothek: Battlemaps, bevor sie jemand sieht.

Hier liegt der Unterschied zwischen **Karte** und **Szene**, und wer den
kennt, versteht den halben Spieltisch:

```
Karte  – Vorbereitung. Das Bild samt einmal ausgerichtetem Raster,
         Schlagworten und Notizen. Ändert sich im Spiel nie.
Szene  – eine Karte *im Spiel*. Mit Nebel, Figuren und allem, was
         der Abend daraus macht.
```

Aus einer Karte lassen sich beliebig viele Szenen legen, ohne das Bild
erneut hochzuladen oder das Raster neu auszurichten. „Auflegen“ holt die
zuletzt gelegte Szene samt Nebel zurück, „frisch“ beginnt eine neue.

Karten gehören der ganzen Runde, nicht einer Kampagne – dieselbe Taverne
steht in jeder Geschichte bereit.

Diese Datei ist das Regal: hochladen, suchen, auflegen, wegwerfen. Was an
einer einzelnen Karte hängt, steht nebenan in karten/:

```
karten/Kartenkachel.jsx   eine Karte in der Übersicht
karten/Kartenblatt.jsx    die aufgeschlagene Karte zum Einstellen
karten/Rastervorschau.jsx das Gitter über dem Vorschaubild
```

**Ausfuhren**

- `Kartenbibliothek` (default function) – Die Kartenbibliothek.

### frontend/src/components/dm/Klangbibliothek.jsx

*244 Zeilen*

Der Klangteppich hinter dem Schirm: hinterlegte Spotify-Links.

Der Almanach spielt **nichts** ab und kennt kein Spotify-Konto. Er
sammelt, was die Spielleitung vorbereitet hat, und sagt der Runde, was
gerade dran ist; abgespielt wird bei jedem im eigenen Spotify.

Das ist die kleine Lösung, und zwar mit Absicht: Im Browser abspielen und
über alle Fenster gleichschalten verlangte von Spotify eine verschlüsselte
Adresse unter eigenem Namen, ein Premium-Konto je Zuhörer und eine
Freischaltliste. Ein hinterlegter Link dagegen funktioniert für jeden,
sofort und ohne Anmeldung.

Eine Karte kann ihre Ambiente mitbringen: Wird sie aufgelegt, legt sich
die Musik von selbst mit auf (siehe Kartenbibliothek).

**Ausfuhren**

- `Klangbibliothek` (default function) – Die Klangbibliothek der Spielleitung.

### frontend/src/components/dm/Notes.jsx

*197 Zeilen*

Notizen und Handzettel – der Reiter „Notizen“ hinter dem Schirm.

Eine Notiz kennt zwei Zustände, und der Unterschied ist der ganze Sinn
dieser Ansicht:

```
*nur für die Spielleitung* – geheime Vorbereitung. Ein Spielerfenster
bekommt sie nicht einmal in der Liste geliefert.

*Handzettel für die Runde* – ausgeteilt. Steht sofort am Spieltisch im
Reiter „Handzettel“ und wird in der Chronik vermerkt.
```

Umgeschaltet wird mit dem Augenknopf in der Zeile; ausgeteilte Zettel
tragen das goldene Fähnchen. Eingezogen wird genauso – die Runde sieht
den Zettel dann augenblicklich nicht mehr.

Der Entwurf (`entwurf`) dient sowohl dem Anlegen als auch dem Bearbeiten:
Ist eine `id` darin, wird geändert, sonst neu angelegt.

**Ausfuhren**

- `Notes` (default function) – Notizen der Spielleitung – wahlweise geheim oder als Handzettel für alle.

### frontend/src/components/dm/Party.jsx

*62 Zeilen*

Der Reiter „Runde“ hinter dem Schirm – und nur noch die Reihenfolge.

Jeder Abschnitt steht in einer eigenen Datei unter `runde/` und holt
sich selbst, was er braucht. Diese Datei sagt lediglich, was in welcher
Reihenfolge untereinander steht; wer einen Abschnitt sucht, findet ihn
an seinem Namen.

Die Reihenfolge ist nicht beliebig – sie führt von der **Runde** zur
**Kampagne** und endet beim Endgültigen:

```
Einladungen         die Runde: wer überhaupt ein Konto bekommt
Mitglieder          die Kampagne: wer bei dieser Geschichte dabei ist
Umzugsgut           die Kampagne: was in eine andere kopiert wird
Konten              die Runde: Rollen, Farben, Kennwörter
Charakterzuweisung  die Kampagne: welches Blatt wem gehört
WerBestimmt …       die Kampagne selbst: umbenennen, löschen, Papierkorb
```

Merksatz, der beim Lesen hilft: **Konten gehören der Runde, alles
Gespielte einer Kampagne.** Wer neu im Almanach ist, braucht beides –
ein Konto *und* einen Platz in einer Kampagne.

**Ausfuhren**

- `Party` (default function)

## frontend/src/components/dm/karten/

### frontend/src/components/dm/karten/Kartenblatt.jsx

*190 Zeilen*

Das aufgeschlagene Blatt einer Karte.

Alles, was einmal eingestellt wird und dann für jede Szene aus dieser Karte
gilt: Name, Schlagworte, Notizen, das Raster und der Klangteppich, der beim
Auflegen anspringen soll.

Gearbeitet wird an einem *Entwurf* – einer Kopie der Karte im Zustand
dieses Bauteils. Erst „Sichern“ schickt ihn zum Server. Dadurch läuft die
Rastervorschau beim Schieben der Regler mit, ohne dass jede Zahl einzeln
über die Leitung geht.

**Ausfuhren**

- `Kartenblatt` (default function)

### frontend/src/components/dm/karten/Kartenkachel.jsx

*83 Zeilen*

Eine Karte in der Übersicht: Bild, Name, Schlagworte, drei Griffe.

„Auflegen“ holt die zuletzt gelegte Szene samt Nebel zurück – man macht da
weiter, wo die Runde aufgehört hat. „frisch“ steht nur da, wenn es schon
eine Szene gibt, und beginnt eine neue unter vollem Nebel. Das Bild selbst
ist der Knopf zum Aufschlagen.

**Ausfuhren**

- `Kartenkachel` (default function)

### frontend/src/components/dm/karten/Rastervorschau.jsx

*58 Zeilen*

Ein Rasternetz über der Vorschau. Damit lässt sich die Feldgröße
ausrichten, ohne die Karte erst auf den Tisch legen zu müssen – und die
Runde sieht dabei nichts von der Karte, die als Nächstes dran ist.

**Ausfuhren**

- `Rastervorschau` (default function)

## frontend/src/components/dm/runde/

### frontend/src/components/dm/runde/Charakterzuweisung.jsx

*74 Zeilen*

Welches Blatt gehört wem – und wer darf es lesen.

Gebraucht, wenn jemand neu dazukommt und ein vorbereitetes Blatt
übernimmt, oder wenn ein Blatt aus der Zeit vor den Konten noch niemandem
gehört.

**Ausfuhren**

- `Charakterzuweisung` (default function)

### frontend/src/components/dm/runde/Einladungen.jsx

*100 Zeilen*

Einladungscodes: erzeugen, kopieren, zurückziehen.

Jeder Code gilt für genau ein Konto und verfällt mit dem Einlösen. Das
ist die einzige Tür in den Almanach hinein – ohne Code kein Konto.

**Ausfuhren**

- `Einladungen` (default function)

### frontend/src/components/dm/runde/KampagneLoeschen.jsx

*67 Zeilen*

Die Kampagne wegräumen.

Nichts davon geht mit einem Klick: Der Name muss abgetippt werden, und
selbst dann liegt die Kampagne erst einmal nur im Papierkorb. Wer sich
vergreift, holt sie mit einem Klick zurück und hat nichts verloren.

Was hier gelöscht wird, sind Monate an Spielabenden – deshalb die rote
Umrandung, deshalb das Abtippen.

**Ausfuhren**

- `KampagneLoeschen` (default function)

### frontend/src/components/dm/runde/Kampagnenmitglieder.jsx

*93 Zeilen*

Wer aus der Runde ist in *dieser* Kampagne dabei? Andere Kampagnen sehen sie nicht.

**Ausfuhren**

- `Kampagnenmitglieder` (default function)

### frontend/src/components/dm/runde/KampagneUmbenennen.jsx

*76 Zeilen*

Die Kampagne umbenennen.

Der harmlose der beiden Eingriffe an dieser Stelle – deshalb ohne rote
Umrandung und ohne Abtippen zur Bestätigung. Der Name hängt an nichts:
Charaktere, Szenen und Beute zeigen auf die Kennung der Kampagne, nie
auf ihren Namen. Es gibt also nichts nachzuziehen.

**Ausfuhren**

- `KampagneUmbenennen` (default function)

### frontend/src/components/dm/runde/Konten.jsx

*93 Zeilen*

Die Konten der Runde: Rolle, Farbe, Kennwort zurücksetzen, entfernen.

Die Farbe ist mehr als Zierde – an ihr erkennt man am Tisch, wessen Wurf
und wessen Zeigefinger gerade aufleuchtet.

**Ausfuhren**

- `Konten` (default function)

### frontend/src/components/dm/runde/Papierkorb.jsx

*100 Zeilen*

Der Papierkorb: weggeräumte Kampagnen samt Restfrist.

Gezeigt werden nur eigene – der Server gibt niemandem den Papierkorb
einer fremden Spielleitung heraus. Liegt nichts darin, ist der ganze
Abschnitt fort; ein leerer Papierkorb muss nicht erwähnt werden.

Zwei Wege hinaus: „Zurückholen“ (ein Klick, die Kampagne ist wieder da)
und „endgültig …“, das erst ein Feld aufklappt, in das der Name
abgetippt werden muss. Danach ist alles fort, ohne Wiederkehr.

**Ausfuhren**

- `Papierkorb` (default function)

### frontend/src/components/dm/runde/umfangText.js

*50 Zeilen*

Aus Zahlen Sätze machen – für „Alles in eine andere Kampagne“.

Reine Rechnung, kein JSX: Diese vier Funktionen wissen nichts von React
und lassen sich deshalb auch einzeln prüfen. Sie stehen hier zusammen,
weil sie nur miteinander Sinn ergeben – aus `{ charaktere: 2 }` und den
Bezeichnungen des Servers wird „2 Charaktere“ und am Ende ein Satz, der
sich lesen lässt.

Die Ein- und Mehrzahl kommt vom Server mit (`eins`, `viele`). Das ist
Absicht: „1 Charaktere“ liest sich nicht, und wo die Wörter stehen,
stehen auch die Zahlen dazu.

**Ausfuhren**

- `inhalt` (function) – Liegt in dieser Art überhaupt etwas? Die Kiste zählt auch ohne Gegenstände, wenn Münzen darin sind.
- `stueck` (function) – „1 Charakter“, „3 Charaktere“ – die Mehrzahl kommt aus dem Umfang selbst.
- `satzteil` (function) – Ein Teil der Aufzählung, samt Münzen, wo welche in der Kiste liegen.
- `aufzaehlen` (function) – „a, b und c“ – nicht „a, b, c“: Es soll sich lesen wie ein Satz.
- `menge` (function) – „3“ – oder „3 + Münzen“, wenn in der Kiste auch etwas klimpert.

### frontend/src/components/dm/runde/Umzugsgut.jsx

*157 Zeilen*

Alles in eine andere Kampagne.

Für den Umzug einer laufenden Runde in eine neue Geschichte: die Helden
mitnehmen, die Hausregeln mitnehmen, die Szenen mitnehmen. Die Vorbereitung
- Karten, Bilder, Bestiarium, Begegnungen, Klang – steht drüben ohnehin
schon, die gehört der ganzen Runde und taucht hier deshalb gar nicht auf.

Kopiert wird, nicht verschoben, und es wird nicht abgeglichen: Zweimal
ausgeführt steht drüben alles zweimal. Deshalb der Zwischenschritt, der
vorher aufzählt, was gleich hinübergeht.

**Ausfuhren**

- `Umzugsgut` (default function)

### frontend/src/components/dm/runde/WerBestimmt.jsx

*28 Zeilen*

Der Hinweis für alle, die über diese Kampagne *nicht* bestimmen.

Ohne ihn stünde an dieser Stelle einfach nichts, und eine zweite
Spielleitung suchte den Umbenennen- und den Löschen-Kasten vergebens.
Ein leerer Fleck ist schlimmer als eine Absage, die sagt, woran es liegt.

**Ausfuhren**

- `WerBestimmt` (default function)

## frontend/src/components/einlesen/

### frontend/src/components/einlesen/Vorschau.jsx

*131 Zeilen*

Die Vorschau beim Einlesen einer Blattdatei – bevor irgendetwas
gespeichert wird.

Sie zeigt, was in der Datei steht und was das Einlesen daraus gemacht
hat: welche Werte nur auf der sichtbaren Seite geändert waren (und
übernommen wurden), was repariert oder angeglichen wurde – und, wenn es
das Blatt im Almanach schon gibt, was sich daran ändern würde. Wer einer
KI eine Aufgabe gegeben hat, sieht hier, ob sie getan hat, was sie sollte.

Zwei Wege hinaus:
- „… aktualisieren“: Das vorhandene Blatt bekommt den Stand der Datei.
  Angeboten nur, wenn es eines gibt, das man ändern darf, und das
  Regelwerk passt.
- „Als neues Blatt anlegen“: Das vorhandene bleibt, wie es ist. Das ist
  immer möglich, und wer unsicher ist, nimmt diesen Weg.

**Ausfuhren**

- `Vorschau` (default function) – 

## frontend/src/components/icons/

### frontend/src/components/icons/almanach.jsx

*105 Zeilen*

Die Symbole der Bücher und Seiten: Schriftrolle, Buch, Feder, Karte, Kerze.

Alles, was nach Schreibstube aussieht: Die Seiten des Almanachs
(Chronik, Kompendium, Hilfe, Karten) und die beiden Erscheinungsbilder
(Kerzenlicht und Pergament).

Gezeichnet wird auf dem Rahmen aus rahmen.jsx – siehe dort, wie ein
neues Symbol entsteht.

**Ausfuhren**

- `IconScroll` (function) – Schriftrolle: Kampagnen, Chronik, Handzettel.
- `IconBook` (function) – Aufgeschlagenes Buch: Bestiarium, Zauberverzeichnis, Chronik.
- `IconHelp` (function) – Fragezeichen im Kreis: zur Hilfe.
- `IconShield` (function) – Schild: vorbereitete Begegnungen.
- `IconQuill` (function) – Schreibfeder: bearbeiten, Notizen, Chronik.
- `IconMap` (function) – Gefaltete Karte: Karten und Szenen.
- `IconCandle` (function) – Kerze: das dunkle Erscheinungsbild (Kerzenlicht), die lange Rast.
- `IconSun` (function) – Sonne: das helle Erscheinungsbild (Pergament), die kurze Rast.
- `IconClock` (function) – Uhr: Zeitangaben im Kompendium (Zauberdauer, Wirkungsdauer).

### frontend/src/components/icons/grundformen.jsx

*67 Zeilen*

Grundformen: hinzufügen, entfernen, bestätigen, schließen, suchen, weiter.

Die Symbole, die in jedem Formular und jeder Liste vorkommen und
keinem Sachgebiet gehören. Sie sind absichtlich die schlichtesten: ein,
zwei Striche, damit sie neben Text nicht lauter sind als der Text.

Gezeichnet wird auf dem Rahmen aus rahmen.jsx – siehe dort, wie ein
neues Symbol entsteht.

**Ausfuhren**

- `IconPlus` (function) – Plus: hinzufügen, erhöhen, aufklappen.
- `IconMinus` (function) – Minus: verringern, einen Zug zurück.
- `IconCheck` (function) – Haken: erledigt, gesichert, bestätigt.
- `IconClose` (function) – Kreuz: schließen.
- `IconSearch` (function) – Lupe: suchen und filtern.
- `IconChevronRight` (function) – Winkel nach rechts: wer gerade dran ist, was weiterführt.

### frontend/src/components/icons/klang.jsx

*68 Zeilen*

Die Symbole des Klangteppichs.

Die Klangleiste am Tisch und die Klangbibliothek hinter dem Schirm:
abspielen, anhalten, alle auf dieselbe Stelle ziehen, mithören.

Gezeichnet wird auf dem Rahmen aus rahmen.jsx – siehe dort, wie ein
neues Symbol entsteht.

**Ausfuhren**

- `IconNote` (function) – Note: der Klangteppich.
- `IconPlay` (function) – Dreieck: abspielen.
- `IconPause` (function) – Zwei Balken: anhalten.
- `IconSync` (function) – Zwei Pfeile im Kreis: alle wieder auf dieselbe Stelle ziehen.
- `IconSpeaker` (function) – Lautsprecher mit Schallwellen: hier mithören.

### frontend/src/components/icons/rahmen.jsx

*33 Zeilen*

Der Rahmen, auf dem jedes Symbol gezeichnet wird.

Er legt fest, was alle gemeinsam haben: das Raster (24×24), die
Strichstärke, die runden Enden – und `stroke="currentColor"`. Das Symbol
nimmt damit die Textfarbe seiner Umgebung an; ein `className="text-gold"`
genügt, und es ist golden.

`aria-hidden`, weil ein Symbol neben einem Wort nichts Neues sagt. Steht
es allein auf einem Knopf, trägt der Knopf das `aria-label`.

- `@param` {{ size?: number, children: import('react').ReactNode }} props weitere Eigenschaften (title, className …) gehen ans <svg>

**Ausfuhren**

- `Icon` (default function) – Der Rahmen, auf dem jedes Symbol gezeichnet wird.

### frontend/src/components/icons/runde.jsx

*162 Zeilen*

Symbole für Runde, Spieltisch und Spielleitung.

Konten und Rollen (Schlüssel, Krone, Runde), der Kampf (Schwerter, Herz),
die Sicht am Tisch (Auge, Nebel, Zielscheibe) und die Handgriffe drumherum
(Hochladen, Mitnehmen, Löschen, Abmelden, Gespräch).

Gezeichnet wird auf dem Rahmen aus rahmen.jsx – siehe dort, wie ein
neues Symbol entsteht.

**Ausfuhren**

- `IconKey` (function) – Schlüssel: Kennwort, Einladungen, Anmeldung.
- `IconSwords` (function) – Gekreuzte Schwerter: Kampf und Initiative.
- `IconCrown` (function) – Krone: die Spielleitung.
- `IconUsers` (function) – Zwei Köpfe: die Runde.
- `IconEye` (function) – Auge: sichtbar, für die Runde gezeigt.
- `IconEyeOff` (function) – Durchgestrichenes Auge: verborgen, nur für die Spielleitung.
- `IconFog` (function) – Nebelschwaden: Nebel des Krieges und der Vorhang.
- `IconTarget` (function) – Zielscheibe: auf eine Stelle der Karte zeigen.
- `IconTrash` (function) – Papierkorb: löschen und entfernen.
- `IconLogout` (function) – Tür mit Pfeil: abmelden.
- `IconUpload` (function) – Pfeil nach oben: Bild oder Datei hochladen.
- `IconHeart` (function) – Herz: Trefferpunkte, Heilung – und die Beutekiste am Tisch.
- `IconLink` (function) – Kettenglied: Verweise (Einladungslink, Spotify-Adresse).
- `IconDownload` (function) – Pfeil nach unten: das Blatt mitnehmen.
- `IconChat` (function) – Sprechblase: das Gespräch am Tisch.

### frontend/src/components/icons/wuerfel.jsx

*35 Zeilen*

Die Würfel des Almanachs.

Der Zwanzigseiter ist das Zeichen des Almanachs schlechthin: Er steht im
Kopf der Seite, auf jedem Wurfknopf und im Würfelbecher. Zwei Fassungen –
eine schlichte, die auch bei 16 Bildpunkten noch als W20 lesbar ist, und
eine mit allen Kanten für große Flächen.

Gezeichnet wird auf dem Rahmen aus rahmen.jsx – siehe dort, wie ein
neues Symbol entsteht.

**Ausfuhren**

- `IconD20` (function) – Zwanzigseiter: Sechseck-Umriss mit der oben stehenden Mittelfläche – so liest man ihn auch bei 18 Pixeln als W20 und nicht als Würfelkasten.
- `IconD20Detailed` (function) – Zwanzigseiter mit allen Kanten – groß gezeigt, wo gewürfelt wird (Würfelbecher, Anmeldung).

### frontend/src/components/icons/zierrat.jsx

*31 Zeilen*

Zierrat: der vierstrahlige Stern vor jeder Rubrik und der Wappenschild
hinter jedem Attribut.

Kein Symbol im engeren Sinn – er bedeutet nichts, er schmückt. Deshalb
gefüllt statt gezeichnet und ohne den Rahmen aus rahmen.jsx.

**Ausfuhren**

- `Fleuron` (function) – Vierstrahliger Stern – der goldene Zierrat vor jeder Rubrik.
- `Wappenschild` (function) – Der Wappenschild hinter einem Attribut auf der Übersicht des Blattes.

## frontend/src/components/initiative/

### frontend/src/components/initiative/arten.js

*40 Zeilen*

Die festen Listen der Kampfliste: Zustände, Farben und Namen der Arten.

Eigene Datei, weil drei Bauteile sie brauchen (Zeile, Zustandswahl, das
Formular für neue Kämpfer) und keines von ihnen der natürliche Besitzer ist.

**Ausfuhren**

- `ZUSTAENDE` (const) – Die Zustände aus dem Regelwerk. Sie stehen auch in lib/dnd5e.js – dort fürs Charakterblatt, hier für die Kampfliste. Doppelt, weil beide Listen unabhängig wachsen dürfen: Im Kampf kommt „Erschöpft“ dazu, das auf dem Blatt eine eigene Stufenleiste hat.
- `TYP_FARBE` (const) – Der farbige Rand links an jeder Zeile – dieselben Farben wie die Figuren, die aus dem Kampf auf den Tisch gelegt werden (siehe stile/farben.css).
- `TYP_NAME` (const) – Wie die Art eines Kämpfers unter seinem Namen heißt.

### frontend/src/components/initiative/Lebensbalken.jsx

*29 Zeilen*

Ein Balken für die Trefferpunkte, wo Zahlen zu viel verraten würden.

**Ausfuhren**

- `Lebensbalken` (default function)

### frontend/src/components/initiative/NeuerKaempfer.jsx

*64 Zeilen*

Einen Kämpfer von Hand eintragen – für den Wachhund, den niemand
vorbereitet hat. Der gewöhnliche Weg führt über das Bestiarium oder eine
vorbereitete Begegnung.

**Ausfuhren**

- `NeuerKaempfer` (default function)

### frontend/src/components/initiative/Wunden.jsx

*43 Zeilen*

Schaden und Heilung an einem Kämpfer – ein Feld, zwei Knöpfe.

Geschickt wird immer eine *Änderung*, nie der neue Stand: Der Server
rechnet und kümmert sich um temporäre Trefferpunkte und die Grenze bei
null. Zwei Leute, die gleichzeitig Schaden eintragen, überschreiben sich
so nicht gegenseitig.

**Ausfuhren**

- `Wunden` (default function)

### frontend/src/components/initiative/Zeile.jsx

*119 Zeilen*

Eine Zeile der Kampfliste. Aufgeklappt zeigt sie die Werkzeuge darunter –
Schaden, Zustände, Initiative.

**Ausfuhren**

- `Zeile` (default function)

### frontend/src/components/initiative/Zustandswahl.jsx

*31 Zeilen*

Zustände an- und abwählen. Ein Klick schaltet um, mehr ist es nicht.

**Ausfuhren**

- `Zustandswahl` (default function)

## frontend/src/components/klang/

### frontend/src/components/klang/Klangleiste.jsx

*183 Zeilen*

Die Klangleiste – für alle am Tisch.

Sie zeigt, was die Spielleitung aufgelegt hat, und spielt es ab: unten
links, klein, und aufklappbar zu Spotifys eigenem Fenster mit Titelbild,
Fortschritt und Lautstärke.

Drei Dinge sind hier bewusst entschieden:

1. *Mithören ist freiwillig, und zwar für jede und jeden einzeln.* Wer am
```
selben Tisch sitzt wie die Spielleitung, hört die Musik schon aus deren
Lautsprecher und will sie nicht doppelt. Wer zu Hause sitzt, tippt
einmal auf „Mithören“. Die Wahl merkt sich der Browser – nicht der
Server, denn sie geht niemanden sonst etwas an.
```

2. *Einmal tippen muss sein.* Kein Browser lässt eine Seite ungefragt Ton
```
machen. Das ist keine Lücke im Almanach, sondern eine Regel des
Browsers, und eine gute.
```

3. *Den Takt gibt die Spielleitung.* Anhalten, weiterlaufen, und
```
„gleichziehen“, wenn die Runde auseinandergelaufen ist. Alles andere –
Lautstärke, stumm, das eigene Ohr – bleibt bei jedem selbst.
```

Liegt nichts auf, ist die Leiste nicht da. Sie soll nicht daran erinnern,
dass es sie gibt.

**Ausfuhren**

- `Klangleiste` (default function)

### frontend/src/components/klang/Klangspieler.jsx

*150 Zeilen*

Der Spieler: Spotifys eigenes Fenster, in die Seite eingelassen.

Wie es funktioniert – und was es kostet:

Spotify erlaubt jedem, eine Wiedergabeliste als kleines Fenster in die
eigene Seite zu setzen. Dafür braucht der Almanach *nichts*: keinen
Entwicklerschlüssel, keine Freischaltliste, kein Konto, kein Geld. Das ist
der Grund, warum es diesen Weg gibt und nicht den großen
(„Web Playback SDK“), der all das verlangen würde – und obendrein von
jedem einzelnen Zuhörer ein Premium-Konto.

Der Preis dieses Weges ist ehrlich zu nennen, weil er am Spieltisch
auffällt:

- Wer im selben Browser bei Spotify **angemeldet** ist und **Premium**
  hat, hört die Stücke ganz.
- Alle anderen hören **30-Sekunden-Ausschnitte**. Für Tavernengemurmel
  reicht das nicht, für „hier kommt der Drache“ schon.
- Browser lassen Ton nicht ungefragt los. Deshalb muss jede und jeder am
  Tisch **einmal** auf „Mithören“ tippen. Danach folgt das Fenster von
  allein, den ganzen Abend.

Und das Gleichschalten:

Die Spielleitung gibt den Takt vor (`spielt`, `position`, `stand`), der
Server schickt ihn über den Live-Kanal an alle. Dieses Bauteil hält
daraus einen *Wunsch* fest und zieht den Spieler bei jeder Rückmeldung ein
Stück in dessen Richtung. Das ist mit Absicht kein einmaliges Kommando,
sondern eine Regelung: Wer zu spät dazukommt, wessen Leitung stockt oder
wer kurz stummschaltet, findet von selbst wieder zurück.

Eine Grenze bleibt, und sie steht auch in der Oberfläche: Bei einer
*Wiedergabeliste* lässt sich von außen nur die Stelle im laufenden Stück
setzen, nicht das wievielte Stück. Wer später dazukommt, beginnt deshalb
beim ersten. Für einen einzelnen Titel oder ein Album stimmt die Stelle
dagegen auf die Sekunde.

**Ausfuhren**

- `Klangspieler` (default function)

### frontend/src/components/klang/spotifyRahmen.js

*84 Zeilen*

Spotifys Einbettungsspieler herholen – einmal für das ganze Fenster.

Spotify liefert dafür ein kleines Skript aus, das sich auf eine sehr alte
Art meldet: Es ruft, wenn es fertig ist, eine Funktion namens
`window.onSpotifyIframeApiReady` auf. Das ist kein Versprechen (`Promise`)
und kein Ereignis, sondern genau *eine* Stelle im Fenster – wer sie
zweimal besetzt, überschreibt die erste.

Deshalb steht das Anfordern hier und nur hier: Diese Datei baut aus dem
Rückruf ein Versprechen, merkt es sich und gibt bei jedem weiteren Aufruf
dasselbe zurück. Zwei Klangleisten im selben Fenster – etwa die Leiste
unten und die aufgeklappte Tafel – teilen sich so ein Skript.

Das Skript kommt von `open.spotify.com`. Es ist das einzige Fremdskript im
ganzen Almanach, und es wird erst geholt, wenn wirklich jemand etwas
auflegt – wer ohne Musik spielt, lädt es nie.

**Ausfuhren**

- `spotifyRahmen` (function) – Spotifys Einbettungs-Schnittstelle laden – höchstens einmal je Seite.
- `zielstelle` (function) – Wo müsste dieses Fenster gerade stehen?

## frontend/src/components/rahmen/

### frontend/src/components/rahmen/KampagneSchalter.jsx

*121 Zeilen*

Der Wechsler zwischen den eigenen Kampagnen, dazu die Neuanlage für die
Spielleitung.

Die aktive Kampagne hängt an der *Sitzung*, nicht am Konto: Dieselbe
Person kann in zwei Fenstern in zwei Kampagnen sitzen. Deshalb lädt der
Wechsel die Seite neu – alles, was im Fenster steht, gehört zur alten
Geschichte und muss frisch geholt werden.

**Ausfuhren**

- `KampagneSchalter` (default function)

### frontend/src/components/rahmen/Konto.jsx

*107 Zeilen*

Das Menü hinter dem eigenen Namen: Aussehen, Kennwort, Abmelden.

Das Aussehen (hell oder Kerzenlicht) merkt sich der Browser, nicht der
Server – siehe lib/useTheme.js und public/aussehen.js. Deshalb steht es
hier und nicht bei den Kontodaten.

**Ausfuhren**

- `Konto` (default function)

### frontend/src/components/rahmen/navigation.js

*27 Zeilen*

Die Hauptnavigation, als Liste statt als JSX.

Der Schirm der Spielleitung kommt nur für sie dazu – und zwar hier, nicht
über ein `hidden` im Kopf: Was nicht in der Liste steht, gibt es für
dieses Fenster nicht. (Geschützt ist der Weg dahinter ohnehin im Server;
das hier ist nur die Höflichkeit, ihn gar nicht erst anzubieten.)

**Ausfuhren**

- `navItems` (function) – Die Einträge der Hauptnavigation – für die Spielleitung einer mehr („Spielleitung“, der Schirm).

### frontend/src/components/rahmen/PasswortWechsel.jsx

*66 Zeilen*

Das eigene Kennwort ändern. Verlangt das alte – auch von der
Spielleitung.

Wer am fremden Rechner das Fenster offen lässt, soll nicht mit einem
Klick ausgesperrt werden können. Geprüft wird ohnehin im Server; das
Feld hier ist die Erinnerung daran, dass es so gemeint ist.

**Ausfuhren**

- `PasswortWechsel` (default function)

### frontend/src/components/rahmen/Verbindung.jsx

*15 Zeilen*

Kleiner Punkt, der zeigt, ob der Draht zum Spieltisch steht.

Unscheinbar, aber wichtig: Wer im Funkloch sitzt, sieht sonst eine Karte,
auf der sich nichts mehr bewegt, und hält sie für richtig.

**Ausfuhren**

- `Verbindung` (default function) – Kleiner Punkt, der zeigt, ob der Draht zum Spieltisch steht.

## frontend/src/components/sheet/

### frontend/src/components/sheet/BackgroundTab.jsx

*144 Zeilen*

Reiter 5: alles, was die Figur zu einer Person macht – Aussehen,
Wesenszüge, Bindungen, Makel, Vorgeschichte, Verbündete und die Merkmale
aus Klasse, Spezies, Hintergrund und Talenten.

Der einzige Reiter, auf dem nichts gerechnet wird. Er ordnet nur: Die
Merkmale werden nach Herkunft gruppiert, weil man am Tisch genau so
sucht („was gibt mir noch mal mein Hintergrund?“).

**Ausfuhren**

- `BackgroundTab` (default function)

### frontend/src/components/sheet/CombatTab.jsx

*79 Zeilen*

Reiter 2 des Charakterblattes: alles, was im Kampf gebraucht wird.

Der am meisten benutzte Reiter des Almanachs – und der einzige, der auch
*schreibend* mit dem Rest des Tisches zu tun hat: Trefferpunkte, die hier
fallen, stehen sofort in der Kampfliste der Spielleitung, und Schaden von
dort steht sofort hier (siehe pages/blatt/useBlatt.js, useLive).

Diese Datei stellt nur noch die Karten untereinander. Jede steht für sich
in `kampf/` und bringt mit, was sie selbst braucht:

```
kampf/Kampfwerte.jsx        Rüstung, Initiative, Bewegung
kampf/Trefferpunkte.jsx     TP, Trefferwürfel, Rettungswürfe gegen den Tod
kampf/Rasten.jsx            kurze und lange Rast
kampf/Zustand.jsx           Zustände, Erschöpfung, Konzentration
kampf/Sinne.jsx             Widerstände, Sichtweite, Dunkelsicht
kampf/Ressourcen.jsx        selbstverwaltete Zähler
kampf/Standardaktionen.jsx  was jede Figur ohne Eintrag kann
kampf/Angriffe.jsx          Angriffe und Zaubertricks samt Würfelknöpfen

kampf/felder.js             die Spalten der wiederkehrenden Zeilen
kampf/Todeszeichen.jsx      die drei Kreise für Erfolg und Fehlschlag
kampf/Wurfknopf.jsx         ein Wert, der sich würfeln lässt
kampf/Trefferwuerfel.jsx    der Vorrat für die kurze Rast
```

Drei Handgriffe wandern durch alle Karten, und der Unterschied zwischen
ihnen ist wichtig:

```
`data`    das Blatt, wie es gerade dasteht.
`update`  ein einzelnes Feld ändern, über seinen Pfad
          (`update('combat.hp.current', 7)`).
`replace` das ganze Blatt auf einmal ersetzen. Braucht, wer mehrere
          Felder in einem Zug ändert – eine Rast oder eine gewürfelte
          20 beim Rettungswurf gegen den Tod.
```

**Ausfuhren**

- `CombatTab` (default function)

### frontend/src/components/sheet/FreeformSheet.jsx

*59 Zeilen*

Das freie Blatt – für alles, was nicht D&D 5e ist.

Ein Charakter mit `system !== 'dnd5e'` bekommt statt der fünf Reiter
diese Seite: eine Kurzbeschreibung und beliebig viele selbst benannte
Abschnitte mit freiem Text. Keine Attribute, keine Rechnung, keine Regel.

Damit taugt der Almanach auch für Call of Cthulhu, Vampire oder ein
selbstgebautes System – man verliert nur die Hilfen, die auf 5e-Regeln
beruhen (Würfelknöpfe am Wert, Traglast, Zauberplätze).

**Ausfuhren**

- `FreeformSheet` (default function)

### frontend/src/components/sheet/InventoryTab.jsx

*130 Zeilen*

Reiter 3: Ausrüstung, Münzen und Traglast.

Gewichte liegen im Blatt immer in **Pfund**, Weiten in **Fuß** – auch bei
jemandem, der metrisch spielt. Umgerechnet wird erst beim Anzeigen
(lib/dnd5e.js). Der Grund: Ein Blatt soll dasselbe bleiben, gleich wer es
aufschlägt, und Rundungsfehler sollen sich nicht bei jedem Speichern
aufsummieren.

Die Traglaststufen folgen dem Regelwerk (Stärke × 15 Pfund). Die meisten
Runden spielen ohne sie – deshalb steht sie als Hinweis da und nicht als
Verbot.

**Ausfuhren**

- `InventoryTab` (default function)

### frontend/src/components/sheet/OverviewTab.jsx

*242 Zeilen*

Reiter 1 des Charakterblattes: alles, was oben auf dem gedruckten Bogen
steht – Name, Volk, Klasse, die sechs Attribute, Rettungswürfe und die
achtzehn Fertigkeiten.

Das Muster, das alle fünf Reiter teilen: Sie bekommen `data` (das Blatt)
und `update(pfad, wert)` und halten *keinen* eigenen Zustand. Geändert
wird immer oben im Blatt, gespeichert in pages/blatt/useBlatt.js. So
kann kein Reiter einen Stand halten, der vom Blatt abweicht.

Gerechnet wird nichts von Hand: Modifikatoren, Übungsbonus und passive
Werte kommen aus lib/dnd5e.js. Steht eine Regel dort falsch, ist sie
überall falsch – und nur an einer Stelle zu richten.

**Ausfuhren**

- `OverviewTab` (default function)

### frontend/src/components/sheet/SpellsTab.jsx

*149 Zeilen*

Reiter 4: Zauberplätze, Zaubertricks und die Zauberliste.

Die Besonderheit gegenüber den anderen Reitern: Hier hängt das Kompendium
mit dran. Wer einen Zauber sucht, bekommt ihn aus der 5e-API und
übernimmt Reichweite, Wirkzeit und Komponenten mit einem Klick ins Blatt.
Übernommen wird dabei eine *Abschrift*, kein Verweis – das Blatt soll
auch dann vollständig sein, wenn das Kompendium gerade nicht erreichbar
ist oder der Zauber dort verschwindet.

Zauberplätze sind Verbrauch, kein Vorrat: Gezählt wird `used` gegen `max`.
Eine lange Rast setzt `used` auf null (lib/rasten.js).

Der Reiter hält den Zustand (was aufgeschlagen ist, was nachgeschlagen
wurde) und ordnet die Liste; gezeichnet wird in zauber/:
```
Zauberwirken.jsx   – Attribut, SG, Angriffsbonus (gerechnet oder von Hand)
Zauberplaetze.jsx  – verbraucht / höchstens je Grad
Zaubersuche.jsx    – Suche im Kompendium
Zaubereintrag.jsx  – ein Zauber, zugeklappt oder aufgeschlagen
Zauberspalten.jsx, Kurzzeile.jsx, spalten.js – die Spalten eines Zaubers
```

**Ausfuhren**

- `SpellsTab` (default function)

## frontend/src/components/sheet/kampf/

### frontend/src/components/sheet/kampf/Angriffe.jsx

*55 Zeilen*

Angriffe und Zaubertricks: die Liste zum Eintragen, und darunter für
jeden Eintrag zwei Knöpfe – Angriff und Schaden.

Die Knöpfe entstehen aus dem, was in der Liste steht. Beim Schaden wird
alles bis auf Ziffern, `d`/`w` und Vorzeichen weggeworfen: „2d6 + 3
Hieb“ ist ein guter Eintrag für die Spielerin, aber ein schlechter
Würfelausdruck.

**Ausfuhren**

- `Angriffe` (default function)

### frontend/src/components/sheet/kampf/felder.js

*31 Zeilen*

Die Spalten der wiederkehrenden Zeilen auf dem Kampfreiter.

Reine Beschreibung, kein Verhalten: Welche Felder hat ein Angriff, eine
Aktion, und wann frischt eine Ressource auf. RepeatingRows baut daraus
die Eingabezeilen (siehe components/RepeatingRows.jsx).

**Ausfuhren**

- `ATTACK_FIELDS` (const) – Die Spalten einer Angriffszeile: Name, Bonus, Schaden, Anmerkungen.
- `AKTION_FIELDS` (const) – Die Felder einer eigenen Aktion: was, was sie kostet (Aktion, Bonusaktion …), was sie bewirkt.
- `AUFFRISCHUNG` (const) – Wann eine Ressource zurückkommt – nach kurzer oder langer Rast oder nur von Hand (siehe lib/rasten.js).

### frontend/src/components/sheet/kampf/Kampfwerte.jsx

*52 Zeilen*

Rüstungsklasse, Initiative, Bewegung, Trefferwürfel – und der Knopf, der
die Initiative gleich würfelt.

Die *Initiative gesamt* unten ist gerechnet, nicht eingetragen:
Geschicklichkeitsmodifikator plus der Bonus darüber. Der Knopf daneben
würfelt sie für alle sichtbar (lib/wuerfeln.js) – in die Kampfliste
trägt sie sich aber erst über „Eigene Initiative würfeln“ in der
Kampfliste selbst ein (components/Initiative.jsx). Hier weiß das Blatt
nicht, ob gerade gekämpft wird.

**Ausfuhren**

- `Kampfwerte` (default function)

### frontend/src/components/sheet/kampf/Rasten.jsx

*49 Zeilen*

Kurze und lange Rast.

Beide ändern ein Dutzend Felder auf einmal – die Regeln dafür stehen
nicht hier, sondern in lib/rasten.js. Hier steht nur der Knopf, der sie
anwendet, und der Satz darunter, der sagt, was gerade geschehen ist.

**Ausfuhren**

- `Rasten` (default function)

### frontend/src/components/sheet/kampf/Ressourcen.jsx

*78 Zeilen*

Selbstverwaltete Zähler: Handauflegen, Kampfrausch, Inspiration des
Barden. `recharge` sagt, wann sie sich füllen – bei kurzer oder langer
Rast; das wendet lib/rasten.js an.

**Ausfuhren**

- `Ressourcen` (default function)

### frontend/src/components/sheet/kampf/Sinne.jsx

*87 Zeilen*

Widerstand und Sinne – und damit die Werte, an denen am Spieltisch der
Nebel hängt.

*Sichtweite* ist, wie weit der Blick bei Licht reicht; 0 heißt
unbegrenzt, denn bei Tageslicht sieht man bis zum Horizont. Die vier
darunter – Dunkelsicht, Blindsicht, Erschütterung, Wahrer Blick – zählen
erst, wenn die Szene dunkel ist.

Eingetragen wird in der Einheit des Blattes; `WeiteField` rechnet
zwischen Fuß und Metern um, gespeichert wird immer in Fuß.

**Ausfuhren**

- `Sinne` (default function)

### frontend/src/components/sheet/kampf/Standardaktionen.jsx

*43 Zeilen*

Die Handlungen aus dem Grundregelwerk – zum Nachschlagen, nicht zum
Ausfüllen. Zugeklappt, weil sie sich nie ändern; wer sie einmal kennt,
braucht sie nicht jeden Abend vor Augen.

**Ausfuhren**

- `Standardaktionen` (default function)

### frontend/src/components/sheet/kampf/Todeszeichen.jsx

*26 Zeilen*

Die drei Kreise für Erfolge bzw. Fehlschläge beim Rettungswurf gegen den
Tod. Ein Klick auf den bereits gefüllten Kreis nimmt ihn wieder zurück –
verklickt hat man sich hier schneller als irgendwo sonst.

**Ausfuhren**

- `Todeszeichen` (default function) – Die drei Kreise für Erfolge bzw. Fehlschläge beim Rettungswurf gegen den Tod. Ein Klick auf den bereits gefüllten Kreis nimmt ihn wieder zurück – verklickt hat man sich hier schneller als irgendwo sonst.

### frontend/src/components/sheet/kampf/Trefferpunkte.jsx

*98 Zeilen*

Trefferpunkte, Trefferwürfel und die Rettungswürfe gegen den Tod.

Die Rettungswürfe sind bewusst dicke Knöpfe: Wer bei 0 Trefferpunkten
liegt, soll sie im Halbdunkel treffen.

Der Wurf trägt sich selbst ein: Eine 20 richtet wieder auf, eine 1 zählt
doppelt, alles ab 10 ist ein Erfolg. Weil dabei mehrere Felder auf einmal
wechseln, geht das über `replace` statt über `update`.

**Ausfuhren**

- `Trefferpunkte` (default function)

### frontend/src/components/sheet/kampf/Trefferwuerfel.jsx

*59 Zeilen*

Der Vorrat an Trefferwürfeln: die Währung der kurzen Rast. Gezählt wird
`used` gegen `total`; eine lange Rast gibt die Hälfte zurück.

**Ausfuhren**

- `Trefferwuerfel` (default function)

### frontend/src/components/sheet/kampf/Wurfknopf.jsx

*18 Zeilen*

Ein Knopf, der einen Wurf für alle sichtbar auf den Tisch legt.

**Ausfuhren**

- `Wurfknopf` (default function)

### frontend/src/components/sheet/kampf/Zustand.jsx

*142 Zeilen*

Zustände, Erschöpfung und die Konzentration.

Die Konzentrationsprobe ist der Grund, warum diese Karte mehr tut als
Kästchen umschalten: Der Schwierigkeitsgrad ist 10 oder die Hälfte des
erlittenen Schadens – was höher liegt. Das rechnet niemand gern im Kopf,
während der Rest des Tisches wartet. Also trägt man den Schaden ein und
drückt einen Knopf; bricht die Konzentration, räumt der Almanach den
Zauber gleich selbst ab.

**Ausfuhren**

- `Zustand` (default function)

## frontend/src/components/sheet/zauber/

### frontend/src/components/sheet/zauber/Kurzzeile.jsx

*10 Zeilen*

Was von einem Zauber in der Zeile steht, ohne ihn aufzuschlagen:
Zeit · Reichweite · Dauer · Rettungswurf – nur, was ausgefüllt ist.

**Ausfuhren**

- `Kurzzeile` (default function) – Was von einem Zauber in der Zeile steht, ohne ihn aufzuschlagen: Zeit · Reichweite · Dauer · Rettungswurf – nur, was ausgefüllt ist.

### frontend/src/components/sheet/zauber/spalten.js

*45 Zeilen*

Die Spalten eines Zaubers – und wie ein Kompendiumseintrag sie füllt.

Eigene Datei ohne JSX, weil zwei Stellen sie brauchen: die Suche, die
einen gefundenen Zauber gleich mit seinen Spalten ins Blatt legt, und die
aufgeschlagene Zeile, die dieselben Spalten als Felder zeigt.

**Ausfuhren**

- `ZAUBER_SPALTEN` (const) – Die Spalten, die auf dem gedruckten Blatt neben jedem Zauber stehen. Wer sie gefüllt hat, muss am Abend nichts mehr nachschlagen: Reichweite, Wirkzeit und Dauer stehen da, wo der Zauber steht.
- `spaltenAus` (function) – Was der Kompendiumseintrag über einen Zauber verrät, in die Spalten des Blattes übersetzt. „Quelle“ bleibt leer – die weiß nur, wer den Zauber bekommen hat: aus der Klasse, aus der Abstammung, aus einem Talent.

### frontend/src/components/sheet/zauber/Zaubereintrag.jsx

*108 Zeilen*

Ein Zauber in der Liste – zugeklappt eine Zeile, aufgeschlagen alle
Spalten und der Text aus dem Kompendium.

Der Eintrag hält keinen eigenen Zustand: Welcher Zauber offen ist, was
gerade nachgeschlagen wird und was schon nachgeschlagen wurde, merkt sich
der Reiter (SpellsTab). So bleibt ein nachgeschlagener Text erhalten,
wenn man einen anderen Zauber aufschlägt und wieder zurückkommt.

- `@param` {object} props
- `@param` {object} props.spell        der Zauber aus 'spellcasting.spells'
- `@param` {number} props.grad         0 für Zaubertricks
- `@param` {boolean} props.offen       aufgeschlagen?
- `@param` {boolean} props.laedt       wird gerade nachgeschlagen?
- `@param` {object|null} [props.detail] der Kompendiumseintrag, falls geladen
- `@param` {() => void} props.onAufschlagen
- `@param` {(feld: string, wert: unknown) => void} props.onAendern
- `@param` {() => void} props.onEntfernen

**Ausfuhren**

- `Zaubereintrag` (default function)

### frontend/src/components/sheet/zauber/Zauberplaetze.jsx

*49 Zeilen*

Die Karte „Zauberplätze“: je Grad verbraucht / höchstens.

Zauberplätze sind Verbrauch, kein Vorrat – gezählt wird `used` gegen
`max`. Wird `max` gesenkt, rückt `used` mit, damit nie mehr verbraucht
als vorhanden ist. Eine lange Rast setzt `used` auf null (lib/rasten.js).

**Ausfuhren**

- `Zauberplaetze` (default function)

### frontend/src/components/sheet/zauber/Zauberspalten.jsx

*27 Zeilen*

Die Spalten eines Zaubers, wenn er aufgeschlagen ist.

**Ausfuhren**

- `Zauberspalten` (default function)

### frontend/src/components/sheet/zauber/Zaubersuche.jsx

*74 Zeilen*

Zaubersuche im Kompendium. Gesucht wird örtlich in der einmal geladenen
Liste aller Zauber – deshalb ohne Verzögerung und ohne Anfrage je
Tastendruck.

**Ausfuhren**

- `Zaubersuche` (default function)

### frontend/src/components/sheet/zauber/Zauberwirken.jsx

*85 Zeilen*

Die Karte „Zauberwirken“: Zauberattribut, Zauber-SG und Angriffsbonus.

SG und Bonus rechnet `zauberwerte()` (lib/regeln/rechnen.js) – dieselbe
Funktion, die auch die Blattausfuhr benutzt. Beide lassen sich hier von
Hand überschreiben: für den Stab des Zauberers, einen Pakt, eine
Hausregel. Das Feld zeigt dann den eigenen Wert und darunter, was die
Regeln ergäben; „gerechnet“ nimmt den eigenen Wert wieder zurück.

Ein leeres Feld heißt „rechnen“ (gespeichert als null) – nicht 0. Ein SG
von 0 wäre eine Zahl, die jemand absichtlich eingetragen hätte.

**Ausfuhren**

- `Zauberwirken` (default function)

## frontend/src/components/tabletop/

### frontend/src/components/tabletop/Board.jsx

*202 Zeilen*

Der Spieltisch: Karte, Raster, Figuren, Nebel, Lineal, Zeigefinger.

Diese Datei tut nur noch eines: Sie setzt die Teile übereinander, die
zeigen, was auf dem Tisch liegt. Was ein Aufsetzen, Ziehen und Loslassen
gerade bedeutet, entscheidet useZeiger.js.

Alles andere liegt daneben und lässt sich einzeln lesen:

```
useZeiger.js         was Aufsetzen, Ziehen und Loslassen bedeuten
useAnsicht.js        Maßstab und Verschiebung, Rad und Kneifen
usePinselabdruck.js  welche Felder ein Nebelstrich trifft
brett/Nebelschicht   der Nebel als Bildpunkte
brett/Figur          eine Figur samt Lebensbalken, und der Auswahlring
brett/Rasternetz     das Netz über der Karte
brett/Nebelvorschau  was der nächste Strich träfe
brett/Lineal         die Entfernung in Feldern
brett/Zeigefinger    „Da!“
```

Wer hier etwas ändert, sollte die **drei Koordinatensysteme**
auseinanderhalten:

1. Bildschirmpunkte – was ein Zeigerereignis liefert (`e.clientX`).
2. Kartenpunkte     – Bildpunkte auf der Karte selbst, unabhängig von
                      Zoom und Verschiebung. `zuSzene()` rechnet um.
3. Rasterfelder     – „3,7“, die Sprache des Nebels. `feldKoord()`
                      rechnet Kartenpunkte in Felder um.

Gezoomt und geschoben wird nicht durch Umrechnen jedes einzelnen Dings,
sondern durch *eine* CSS-Transformation auf dem Behälter: alles darin
wandert mit. Deshalb dürfen Figuren in Kartenpunkten positioniert werden
und niemand muss beim Zoomen rechnen.

Bedient wird mit *Pointer Events* statt Maus- und Berührungsereignissen:
ein Satz Rückrufe für Maus, Finger und Stift.

**Ausfuhren**

- `Board` (default function)

### frontend/src/components/tabletop/SceneBar.jsx

*111 Zeilen*

Die Werkzeugleiste über dem Spieltisch – nur für die Spielleitung.

Diese Datei stellt vier Teile untereinander und hält das wenige, was sie
sich teilen. Gebaut wird nebenan, im Ordner `leiste/`:

1. leiste/Vorhangriegel.jsx – *Der Vorhang.* Steht ganz vorn und wird
   rot, wenn er zu ist. Wer ihn vergisst, spielt vor einer Runde, die
   nichts sieht – deshalb die auffälligste Anzeige der Oberfläche.
2. leiste/Werkzeuge.jsx – *Die Werkzeuge* (Bewegen, Aufdecken,
   Verhüllen, Messen, Zeigen) samt Pinselbreite. Welches gewählt ist,
   hält pages/Tabletop.jsx; hier wird nur gezeigt und gemeldet.
3. leiste/Rasterfeld.jsx – *Das Raster* zum Ausklappen: Feldgröße,
   Versatz, Maßstab, dunkle Szene, Sichtweite. Alles davon gehört zur
   Szene und wird gespeichert.
4. leiste/Szenenlade.jsx – *Die Szenen*: neu aus einer Karte, aus einer
   Datei oder ganz ohne, und die Liste der vorhandenen.

Hier bleiben nur drei Dinge, weil sie mehr als einen Teil angehen: ob das
Rasterfeld und die Lade offen stehen, die Fehlermeldung (das Rasterfeld
schreibt hinein, die Lade zeigt sie), und die beiden Listen aus der
Datenschicht, die Werkzeuge und Lade gemeinsam brauchen.

Diese Datei zeigt viel und entscheidet wenig – der Zustand liegt eine
Ebene höher, die Regeln liegen im Server.

**Ausfuhren**

- `SceneBar` (default function) – Werkzeugleiste und Szenenverwaltung – nur für die Spielleitung.

### frontend/src/components/tabletop/TokenPanel.jsx

*226 Zeilen*

Die gewählte Figur bearbeiten – Name, Farbe, Größe, Bildnis, Lichtquelle.

Steht am Spieltisch im Reiter „Figur“ und nur für die Spielleitung.

Drei Dinge, die mehr tun, als sie aussehen:

```
*Blatt* – an welchem Charakterblatt die Figur hängt. Das entscheidet,
wer sie ziehen darf (die Besitzerin des Blattes) und wessen Sinne die
Sicht bestimmen. Ein NSC-Blatt macht sie zur Figur, durch deren Augen
die Spielleitung schauen kann.

*verbergen* – eine verborgene Figur wird einem Spielerfenster gar nicht
erst geschickt. Der Hinterhalt steht also wirklich nicht da, statt nur
durchsichtig zu sein. Hängt die Figur an einem Kämpfer, verbirgt oder
zeigt sich seine Zeile in der Kampfliste mit (der Server tut das).

*Lichtquelle* – hell und dämmrig in Fuß. In einer dunklen Szene
erhellt sie die Karte für alle; sie ist damit das Gegenstück zur
Dunkelsicht, die am Charakterblatt hängt. Gerechnet wird beides auf dem
Server (backend/src/sicht.js).
```

**Ausfuhren**

- `TokenPanel` (default function) – Die ausgewählte Figur bearbeiten – nur die Spielleitung sieht das.

### frontend/src/components/tabletop/useAnsicht.js

*114 Zeilen*

Die Ansicht auf die Karte: Maßstab und Verschiebung.

Hier steckt alles, was mit *Schauen* zu tun hat, und nichts, was mit
Spielen zu tun hat – deshalb eine eigene Datei. Der Spieltisch bekommt
daraus vier Dinge:

```
ansicht   – { scale, tx, ty }, der Zustand der Ansicht
setAnsicht– zum Schieben mit der Maus (macht der Tisch selbst)
zuSzene   – ein Bildschirmpunkt als Punkt auf der Karte
zoomen    – um einen Punkt herum vergrößern oder verkleinern
```

Gezoomt und geschoben wird nicht, indem jedes Ding einzeln umgerechnet
wird, sondern über *eine* CSS-Transformation auf dem Behälter. Diese
Datei verwaltet nur die drei Zahlen dafür.

**Ausfuhren**

- `useAnsicht` (function) – 

### frontend/src/components/tabletop/usePinselabdruck.js

*91 Zeilen*

Der Nebelpinsel: welche Felder ein Strich trifft.

Reine Rechnung, kein Aussehen – deshalb eine eigene Datei neben dem
Spieltisch. Sie beantwortet zwei Fragen:

```
*Was träfe der nächste Strich?* → `vorschau`, damit man es sieht,
bevor man klickt. Ohne das wäre ein 5×5-Pinsel ein Ratespiel.

*Was hat der Strich getroffen?* → `abdruecken`, samt der Strecke seit
dem letzten Abdruck.
```

Die Strecke ist der Kniff: Zwischen zwei Bildern springt der Zeiger bei
einem schnellen Strich über mehrere Felder. Ohne die Zwischenschritte
bliebe eine Perlenkette stehen statt eines Strichs.

**Ausfuhren**

- `usePinselabdruck` (function) – 

### frontend/src/components/tabletop/useZeiger.js

*196 Zeilen*

Die Zeiger auf dem Spieltisch: was ein Aufsetzen, Ziehen und Loslassen
gerade bedeutet.

Eigene Datei, weil hier die eigentliche Bedienung des Tisches steckt – und
sie ist dicht: Maus, Finger und Stift kommen über dieselben *Pointer
Events* herein, zwei Finger heißen Kneifen, und je nach Werkzeug wird
dasselbe Ziehen zur Figurbewegung, zum Nebelstrich, zum Rechteck oder zum
Verschieben der Karte. Board.jsx setzt nur noch zusammen, was dabei
herauskommt.

Der Haken bekommt alles, was er zum Entscheiden braucht, und gibt
dreierlei zurück:

```
ziehen, lineal  – was gerade gezogen oder gemessen wird (zum Zeichnen)
beiZeigerAb, beiZeigerBewegung, beiZeigerAuf – die drei Rückrufe
```

Das Feld unter dem Zeiger (`setZeigerFeld`) gehört dagegen dem Tisch:
Der Pinselabdruck braucht es, bevor dieser Haken überhaupt läuft.

**Ausfuhren**

- `useZeiger` (function) – 

## frontend/src/components/tabletop/brett/

### frontend/src/components/tabletop/brett/Figur.jsx

*110 Zeilen*

Eine Figur auf dem Tisch: runde Scheibe mit Bild oder Anfangsbuchstabe,
darunter Lebensbalken und Namensschild – und der Auswahlring, der zeigt,
welche Figur die Spielleitung gerade bearbeitet.

Alles hier steht in *Kartenpunkten*: `token.x`/`token.y` ist die obere
linke Ecke auf der Karte, die Größe ein Vielfaches der Feldgröße
(`token.size` = 1 für mittelgroß, 2 für groß …). Gezoomt wird nicht hier,
sondern über die Bühne, in der die Figur steht (Board.jsx).

Der Lebensbalken erscheint nur, wenn Trefferpunkte bekannt sind: Bei
Monstern bekommt die Runde sie nicht, und dann soll dort auch nichts
stehen.

Die Werte gehen als CSS-Variablen hinaus, die Regeln stehen in
stile/spieltisch/figuren.css.

**Ausfuhren**

- `Figur` (default function) – 
- `Auswahlring` (function) – Der gestrichelte Ring um die gewählte Figur – nur für die Spielleitung.

### frontend/src/components/tabletop/brett/Lineal.jsx

*58 Zeilen*

Das Lineal: eine gestrichelte Linie mit der Entfernung daran.

Gezählt wird in **Feldern**, nicht in Bildpunkten – und zwar nach der
Regel des Spiels: die längere der beiden Seiten. Schräg zu laufen kostet
in D&D 5e nicht mehr als geradeaus, und genau so soll es dastehen.

Alle Strichstärken und die Schriftgröße werden durch den Maßstab geteilt.
Sonst wäre die Linie bei 400 % vier Mal so dick wie bei 100 % – sie soll
aber immer gleich aussehen.

**Ausfuhren**

- `Lineal` (default function)

### frontend/src/components/tabletop/brett/Nebelschicht.jsx

*68 Zeilen*

Der Nebel als Bildpunkte: ein Punkt je Rasterfeld, hochskaliert vom
Browser. Das ist um Größenordnungen billiger, als tausend Rechtecke zu
malen, und läuft auch auf einem iPad flüssig.

Drei Zustände, wie man es von einer Karte erwartet, auf der man schon war:

```
unerkundet   – schwarz. Da war noch niemand.
erkundet     – gedämpft. Man weiß, wie es dort aussieht, sieht aber
               gerade nicht hin: das Gelände bleibt, wer dort steht nicht.
im Blick     – klar. Hier reicht Licht oder Dunkelsicht hin.
```

Die mittlere Stufe entsteht nur, wenn der Server eine Sicht mitgeschickt
hat; sonst bleibt es beim alten Zweiklang aus auf und zu.

**Ausfuhren**

- `Nebelschicht` (default function)

### frontend/src/components/tabletop/brett/Nebelvorschau.jsx

*48 Zeilen*

Was der nächste Nebelstrich träfe.

Golden beim Aufdecken, rot beim Verhüllen – dieselbe Sprache wie in der
Werkzeugleiste. Beim aufgezogenen Rechteck steht zusätzlich darüber, wie
viele Felder es werden; beim Pinsel wäre das nur Gezappel.

`grenzen` kommt aus usePinselabdruck und ist bereits auf die Karte
beschnitten – hier wird nichts mehr gerechnet außer der Umrechnung von
Feldern in Bildpunkte.

**Ausfuhren**

- `Nebelvorschau` (default function)

### frontend/src/components/tabletop/brett/Rasternetz.jsx

*31 Zeilen*

Das Rasternetz über der Karte.

Gezeichnet wird es in stile/spieltisch/flaeche.css aus zwei gekreuzten
Linienmustern – hier stehen nur Feldgröße und Versatz.

Unterhalb einer gewissen Kantenlänge auf dem Schirm wird es gar nicht
erst gezeigt: Ein Raster, dessen Felder fünf Bildpunkte groß sind, ist
kein Raster mehr, sondern ein Grauschleier.

**Ausfuhren**

- `Rasternetz` (default function)

### frontend/src/components/tabletop/brett/Zeigefinger.jsx

*29 Zeilen*

Die Zeigefinger: kurz aufleuchtende Ringe mit dem Namen dessen, der
gezeigt hat.

„Da!“ – am echten Tisch tippt man auf die Karte. Über drei Städte hinweg
geht das nicht, also gibt es das hier. Gespeichert wird nichts; nach
wenigen Sekunden ist der Ring fort (siehe lib/daten.js, usePings).

Der Ring ist genau ein Feld groß – so zeigt er nicht auf einen Punkt,
sondern auf die Stelle, um die es geht.

**Ausfuhren**

- `Zeigefinger` (default function)

## frontend/src/components/tabletop/leiste/

### frontend/src/components/tabletop/leiste/Knopf.jsx

*20 Zeilen*

Ein Leistenknopf.

Alle vier Teile der Werkzeugleiste benutzen ihn, damit „gewählt“ überall
gleich aussieht: golden umrandet, heller Grund. Alles übrige – `onClick`,
`title`, `disabled` – reicht er unverändert an den Knopf durch.

**Ausfuhren**

- `Knopf` (default function) – Ein Leistenknopf.

### frontend/src/components/tabletop/leiste/Rasterfeld.jsx

*150 Zeilen*

Das ausklappbare Rasterfeld: Wie liegt das Gitter auf dieser Karte?

Alles hier gehört der Szene und wird sofort gespeichert – jede Eingabe ist
ein kleiner Serveraufruf, es gibt keinen „Speichern“-Knopf. Beim Ausrichten
des Rasters ist das genau richtig: Man dreht an der Feldgröße und sieht die
Linien mitwandern.

Zwei Zahlen wollen dabei auseinandergehalten sein:

```
*Feldgröße* ist ein Bildmaß – wie viele Bildpunkte ein Feld breit ist.
  Daran stellt man das Gitter auf die Karte.
*Weite je Feld* ist ein Spielmaß – wofür ein Feld im Spiel steht, in Fuß
  oder Metern. Daran rechnet das Lineal.
```

**Ausfuhren**

- `Rasterfeld` (default function)

### frontend/src/components/tabletop/leiste/Szenenlade.jsx

*249 Zeilen*

Die Szenenlade: neue Szene anlegen, vorhandene auflegen, kopieren, löschen.

Drei Wege zu einer neuen Szene, und sie unterscheiden sich mehr, als es
aussieht:

```
*Karte hochladen* geht den Umweg über die Bibliothek. Das Bild bleibt
  dort liegen, wenn der Abend vorbei ist – beim nächsten Mal ist es ein
  Griff statt eines neuen Uploads.
*Aus der Bibliothek* legt eine schon vorhandene Karte auf.
*ohne Karte* baut ein reines Raster, dessen Größe in Feldern steht.
```

Aufgelegt wird offen oder „verdeckt“ – verdeckt heißt: hinter dem Vorhang.
Die Runde sieht erst etwas, wenn die Spielleitung ihn öffnet.

Die Fehlermeldung steht nicht hier, sondern eine Ebene höher in SceneBar:
Auch das Rasterfeld schreibt hinein, und beide zeigen sie an derselben
Stelle an.

**Ausfuhren**

- `Szenenlade` (default function)

### frontend/src/components/tabletop/leiste/Vorhangriegel.jsx

*26 Zeilen*

Der rote Riegel über der ganzen Leiste: Der Vorhang ist zu.

Das ist die auffälligste Anzeige der ganzen Oberfläche, und das mit Absicht.
Wer den Vorhang vergisst, baut in Ruhe auf – und spielt dann vor einer
Runde, die nichts sieht. Also nimmt der Hinweis die volle Breite ein und
ist zugleich der Knopf, der ihn wieder öffnet.

**Ausfuhren**

- `Vorhangriegel` (default function)

### frontend/src/components/tabletop/leiste/Werkzeuge.jsx

*153 Zeilen*

Die eigentliche Werkzeugleiste: Was tut ein Klick auf die Karte?

Gewählt ist immer genau eines – Bewegen, Aufdecken, Verhüllen, Messen oder
Zeigen. Welches, weiß diese Datei nicht: Das hält pages/Tabletop.jsx und
gibt es als `mode` herein. Hier wird nur gezeigt und gemeldet.

Dazu kommen die Griffe, die ganze Karten betreffen (alles verhüllen, alles
aufdecken, Figuren aus dem Kampf), die NSC-Sicht und die beiden Schalter,
die das Rasterfeld und die Szenenlade auf- und zuklappen.

**Ausfuhren**

- `Werkzeuge` (default function)

## frontend/src/lib/

### frontend/src/lib/api.js

*30 Zeilen*

Der einzige Ort, an dem diese Oberfläche den Server anspricht.

Jede Funktion hier ist ein Weg des Servers, eins zu eins. Kein Bauteil
ruft `fetch` selbst auf – das hat zwei handfeste Gründe: Ändert sich ein
Weg, ist diese Datei die einzige Baustelle; und die Fehlerbehandlung
unten gilt damit für alle Aufrufe gleichermaßen.

Wer wissen will, was der Server zu einem Weg sagt, findet die Beschreibung
in docs/API.md und den Code in backend/src/routes/.

Die Wege liegen nach Sachgebieten in api/:

```
api/anfrage.js  – der Unterbau: request, post, put, patch, del
api/konten.js   – Anmeldung, Konten, Einladungen, Kampagnen
api/blatt.js    – Charakterblätter, Kompendium, Würfel
api/kampf.js    – laufender Kampf, Bestiarium, Begegnungen, Beute
api/chronik.js  – Chronik, Notizen und Handzettel, Chat
api/tisch.js    – Szenen, Bilder, Karten, Klang
```

Eingeführt wird trotzdem immer von hier (`from '../lib/api.js'`): Ein
Bauteil soll nicht wissen müssen, in welcher Datei ein Weg steht.

**Ausfuhren**

- `setClientId` (aus ./api/anfrage.js)
- `authApi` (aus ./api/konten.js)
- `campaignsApi` (aus ./api/konten.js)
- `charactersApi` (aus ./api/blatt.js)
- `compendiumApi` (aus ./api/blatt.js)
- `diceApi` (aus ./api/blatt.js)
- `encounterApi` (aus ./api/kampf.js)
- `encountersApi` (aus ./api/kampf.js)
- `libraryApi` (aus ./api/kampf.js)
- `stashApi` (aus ./api/kampf.js)
- `chatApi` (aus ./api/chronik.js)
- `chronicleApi` (aus ./api/chronik.js)
- `notesApi` (aus ./api/chronik.js)
- `ambienceApi` (aus ./api/tisch.js)
- `mapsApi` (aus ./api/tisch.js)
- `mediaApi` (aus ./api/tisch.js)
- `scenesApi` (aus ./api/tisch.js)

### frontend/src/lib/auth.jsx

*107 Zeilen*

Wer ist angemeldet? – die Antwort darauf, für die ganze Oberfläche.

Das ist ein React-*Context*: ein Wert, den ein Anbieter (`AuthProvider`)
weit oben im Baum bereitstellt und den jede Komponente darunter mit
`useAuth()` abholen kann, ohne dass er durch jede Ebene durchgereicht
werden muss. Der Anbieter steht in main.jsx ganz außen.

Gemerkt wird hier nur eine *Abschrift* dessen, was der Server weiß. Das
Anmeldekennzeichen selbst liegt in einem HttpOnly-Cookie: Der Browser
schickt es bei jeder Anfrage automatisch mit, und JavaScript kommt nicht
daran – das ist Absicht und der Grund, warum hier nirgends ein Token
herumliegt. Wer diesen Zustand also fälscht, gewinnt nichts: Der Server
fragt das Cookie, nicht uns.

**Ausfuhren**

- `AuthProvider` (function) – Der Anbieter der Anmeldung: fragt beim Start den Server, wer man ist, und reicht `user`, `isDm` und die Handgriffe (anmelden, abmelden, einrichten) an alles darunter weiter.
- `useAuth` (function) – Der Zugriff für alle anderen: `const { user, isDm } = useAuth();`

### frontend/src/lib/beschriftung.js

*209 Zeilen*

Hier – und nur hier – werden die Schlüssel des Servers zu Worten.

Der Server schickt unveränderliche Kennungen: `schwer_verwundet`,
`einladung_verbraucht`, `handzettel`. Wie das am Bildschirm heißt, ist
Sache der Oberfläche. Wer den Almanach neu gestaltet, übersetzt oder in
eine andere Anwendung überführt, tauscht diese Datei aus und muss dafür
keine einzige Zeile im Server anfassen.

**Ausfuhren**

- `ZUSTAND` (const) – Zustand eines Kämpfers, wie ihn die Runde zu sehen bekommt.
- `CHRONIK_ART` (const) – Art eines Chronikeintrags.
- `ROLLE` (const) – Rollen im Almanach.
- `FEHLER` (const) – Fehlerschlüssel des Servers.
- `SRD_FELD` (const) – Feldnamen des SRD-Kompendiums (dnd5eapi.co). Das sind reine Strukturbezeichner der Schnittstelle – "casting_time", "armor_class" – kein Fließtext aus dem Regelwerk selbst. Der eigentliche Zauber- oder Monstertext bleibt unangetastet, wie er aus der Quelle kommt; nur die Beschriftung der Felder drumherum ist hier auf Deutsch.
- `benenne` (function) – Beschriftung zu einem Schlüssel, mit dem Schlüssel als Rückfallebene.
- `fehlertext` (function) – Fehlertext: bevorzugt die eigene Fassung, sonst die des Servers.

### frontend/src/lib/bilder.js

*75 Zeilen*

Ein Bild aus dem Dateiwähler in eine data:-URL verwandeln – so wandert es
durch die gewöhnliche JSON-API und es braucht kein Datei-Upload-Paket.

Sehr große Karten werden vorher verkleinert. Die Grenze liegt bei 8192
Bildpunkten Kantenlänge – genug, dass auch eine Karte über zweihundert
Meter noch vierzig Bildpunkte je Meter behält. Darüber bringt es am
Spieltisch nichts mehr, kostet aber Speicher auf dem Pi und Ladezeit auf
dem iPad. Wird die Datei dabei größer als 12 MB, weist der Server sie ab;
dann hilft ein kleineres Bild oder eine geteilte Karte.

**Ausfuhren**

- `bildLesen` (async function) – Ein Bild aus dem Dateiwähler in eine data:-URL verwandeln – so wandert es durch die gewöhnliche JSON-API und es braucht kein Datei-Upload-Paket.
- `bildUndVorschau` (async function) – Wie `bildLesen`, liefert zusätzlich aber ein kleines Vorschaubild.

### frontend/src/lib/blattAusfuhr.js

*150 Zeilen*

Das Blatt zum Mitnehmen.

Erzeugt eine einzelne HTML-Datei, die alles enthält, was auf dem Blatt
steht – samt Bildnis als eingebettetem Bild. Sie braucht keinen Server,
kein Netz und keine App: doppelklicken genügt, auf jedem Rechner, Tablet
oder Telefon. Gedruckt sieht sie aus wie ein Charakterbogen.

Am Ende der Datei steckt außerdem der vollständige Datensatz, in einem
`<template>` – Daten, kein Skript. Die Datei ist damit zugleich eine
Sicherung: „Blatt einlesen“ in der Übersicht legt daraus wieder ein Blatt
an oder bringt das vorhandene auf ihren Stand (blattEinfuhr.js).

**Die Datei darf bearbeitet zurückkommen** – von Hand oder von einer KI.
Dafür steht ganz oben eine Anleitung für KI-Assistenten (als Kommentar,
im Browser unsichtbar), und jeder sichtbare Wert trägt den Pfad, unter
dem er im Datensatz steht. Ändert jemand nur die sichtbare Seite, findet
das Einlesen die Änderung daran wieder. Beides steht in blatt/datensatz.js
und blatt/werkzeug.js (`marke`).

Diese Datei setzt nur noch zusammen; gebaut wird nebenan:

```
blatt/werkzeug.js    entschärfen, einrahmen, markieren, Bilder einbetten
blatt/abschnitte.js  je eine Funktion für je eine Karte des Bogens
blatt/koerper.js     welche Karte in welcher Reihenfolge
blatt/datensatz.js   der Datensatz und die Anleitung für eine KI
blatt/glossar.js     welcher Wert wo steht und wie er heißt
blatt/stil/*.css     das Aussehen, als richtige Stilblätter
```

**Skript enthält die Datei keines.** Früher trug sie einen Druckknopf mit
einer Zeile JavaScript; jetzt steht dort, wie man druckt (Strg+P, am iPad
Teilen → Drucken) – das kann jeder Browser ohnehin, und die Datei führt
nichts aus.

**Das Stilblatt ist die eine Stelle im ganzen Almanach, an der CSS in
einer Seite eingebettet steht** – und zwar nur in dieser erzeugten
Datei, nicht im Quelltext: Geschrieben wird es als richtige .css-Dateien
(blatt/stil/), eingesetzt erst beim Bauen. Anders geht es nicht, ohne
die Datei unbrauchbar zu machen: Sie muss mit einem Doppelklick auf
jedem Gerät funktionieren, ohne Netz und ohne Almanach dahinter – ein
Verweis auf eine zweite Datei ginge beim Verschicken per Mail oder beim
Öffnen aus der Dateien-App verloren. Die Stilprobe lässt diese eine
Stelle zu und keine andere.

**Ausfuhren**

- `blattAlsHtml` (async function) – Das fertige HTML-Dokument als Zeichenkette.
- `ladeBlattHerunter` (async function) – Dasselbe als Datei, die der Browser zum Sichern anbietet.

### frontend/src/lib/blattEinfuhr.js

*158 Zeilen*

Das mitgenommene Blatt wieder hereinholen – auch nachdem eine KI es
bearbeitet hat.

Die Datei, die „Mitnehmen“ erzeugt (blattAusfuhr.js), trägt am Ende den
vollständigen Datensatz des Blattes als JSON, oben eine Anleitung für
KI-Assistenten und an jedem sichtbaren Wert den Pfad, unter dem er im
Datensatz steht. Das Einlesen geht in fünf Schritten:

1. aufbereiten    – aus einer Chat-Antwort den Codeblock holen,
                    Zeilenenden vereinheitlichen (einfuhr/datei.js)
2. Datensatz      – finden und lesen, notfalls repariert: Kommentare,
                    überzählige Kommas, Zeilenumbrüche in Texten
                    (einfuhr/json.js)
3. Sichtbares     – Werte, die nur auf der Seite geändert wurden, in
                    den Datensatz übernehmen (einfuhr/sichtbar.js)
4. angleichen     – jeden Wert in die Form bringen, die das Blatt
                    erwartet; neue Listeneinträge bekommen Kennungen
                    (einfuhr/angleichen.js)
5. prüfen         – Name und Regelwerk

Fehlt der Datensatz ganz (eine KI hat ihn weggelassen), wird das Blatt
aus den sichtbaren, markierten Werten gebaut – mit einem Hinweis, dass
Häkchen und leere Felder dann auf dem Ausgangswert stehen.

Angenommen werden auch Dateien aus älteren Fassungen (Datensatz
entschärft im `<template>` oder roh im `<script>`) und der nackte
JSON-Text. Alles läuft ohne Browser-Schnittstellen – die Blattprobe
prüft es in Node (scripts/blattprobe.mjs).

**Ausfuhren**

- `leseBlattdatei` (function) – Eine Blattdatei lesen.

### frontend/src/lib/campaign.jsx

*119 Zeilen*

Die aktive Kampagne der eigenen Sitzung.

Konten sind rundenweit gemeinsam, aber was am Tisch entsteht, gehört zu
genau einer Kampagne – festgehalten server-seitig in der Sitzung, hier nur
gespiegelt. Ohne Anmeldung gibt es nichts zu holen.

Dass die aktive Kampagne an der *Sitzung* hängt und nicht am Konto, hat
eine angenehme Folge: Dieselbe Spielleitung kann in zwei Browserfenstern
in zwei Kampagnen sitzen. Und es hat eine Pflicht: Jeder Wechsel muss zum
Server (`switchTo`), sonst wüsste der bei der nächsten Anfrage nichts
davon und lieferte weiter die alte Kampagne.

Aufgebaut wie lib/auth.jsx – ein Anbieter oben, `useCampaign()` unten.

**Ausfuhren**

- `CampaignProvider` (function) – Der Anbieter: hält Liste und aktive Kampagne und reicht beides samt Handgriffen weiter.
- `useCampaign` (function) – Die aktive Kampagne, die Liste aller Kampagnen und die Handgriffe dazu (wechseln, anlegen, umbenennen, wegräumen).

### frontend/src/lib/daten.js

*40 Zeilen*

Die Datenschicht.

Hier steckt alles, was mit dem Server zu tun hat: laden, auf Änderungen
horchen, nachladen. Die Bauteile darüber bekommen fertige Daten und einen
Handgriff zum Nachladen – mehr wissen sie nicht.

Der Sinn davon zeigt sich beim Umbau: Wer die Oberfläche neu gestaltet oder
ganz austauscht, wirft Seiten und Bauteile weg und behält diese Schicht.
Das mühsame Stück – wann geladen wird, welche Ereignisse welchen Zustand
betreffen, was beim erneuten Verbinden nachzuholen ist – bleibt erhalten.

Alles darin sind *Haken* (React Hooks): Funktionen, deren Name mit `use`
beginnt und die nur aus einer Komponente heraus aufgerufen werden dürfen.
Sie geben Daten samt Nachlade-Handgriff zurück, etwa:

```
const { charaktere, laden } = useCharaktere();
```

Drei Muster kehren immer wieder, und wer sie kennt, versteht die ganze
Schicht:

1. *Laden* über useDaten – einmal beim Verbinden, danach auf Zuruf.
2. *Horchen* über useLive – der Server schiebt Änderungen nach.
3. *Vorgreifen* – bei Figuren und Nebel wird die Änderung sofort
   örtlich angezeigt und erst danach zum Server geschickt. Ohne das
   ruckelte jede gezogene Figur um die Laufzeit der Anfrage hinterher.

Diese Datei selbst ist nur noch das Inhaltsverzeichnis. Sie führt alles
zusammen, damit ein Bauteil weiterhin `from '../lib/daten.js'` schreiben
kann, ganz gleich, in welchem der Teile sein Haken steht. Geordnet ist
nach derselben Regel wie der ganze Almanach: Was der Runde gehört, steht
getrennt von dem, was einer Kampagne gehört.

### frontend/src/lib/dnd5e.js

*29 Zeilen*

Die Regeln von D&D 5e, soweit der Almanach sie kennt – das
Inhaltsverzeichnis.

Diese Datei enthält selbst nichts mehr. Sie führt zusammen, was in
`regeln/` in fünf Teilen liegt, damit der Rest der Oberfläche weiterhin
eine Anlaufstelle hat:

```
regeln/listen.js       Attribute, Fertigkeiten, Zustände, Erschöpfung
regeln/masse.js        Fuß und Meter, Pfund und Kilogramm
regeln/blattfelder.js  Aktionsarten, Merkmale, Aussehen, Erfahrung
regeln/rechnen.js      was das Regelwerk ausrechnen lässt
regeln/leeresBlatt.js  ein frisches Blatt – und alte auf neuen Stand
```

Wer eine Regel *ändert*, geht dorthin. Wer eine *benutzt*, kann hier
bleiben: `import { abilityModifier } from '../lib/dnd5e.js'` funktioniert
unverändert.

Die eine Sache, die man über das ganze Bündel wissen muss: Gespeichert
wird immer in **Fuß und Pfund**, angezeigt wahlweise metrisch. Umgerechnet
wird erst beim Anzeigen (regeln/masse.js). So bleibt ein Blatt dasselbe,
gleich wer es aufschlägt.

### frontend/src/lib/id.js

*26 Zeilen*

Erzeugt eine eindeutige Kennung für Würfe, Gegenstände, Zauber usw.

`crypto.randomUUID()` gibt es im Browser nur in einem „sicheren Kontext“
(HTTPS oder localhost). Vom iPad aus wird der Almanach aber über eine
gewöhnliche Netzwerkadresse aufgerufen (http://192.168.…), und dort fehlt
die Funktion – deshalb hier ein Ersatz, der überall funktioniert.

**Ausfuhren**

- `newId` (function) – Erzeugt eine eindeutige Kennung für Würfe, Gegenstände, Zauber usw.

### frontend/src/lib/laufstil.js

*128 Zeilen*

Werte, die erst im Browser feststehen – ohne ein einziges `style`-Attribut.

Die Regel des Almanachs heißt: Wie etwas aussieht, steht im Stilblatt
(`stile/`); im Markup steht nur, *was* da ist. Einige Werte kennt aber
kein Stilblatt im Voraus: wo eine Figur steht, wie weit die Karte gerade
verschoben ist, welche Farbe sich jemand gewählt hat, wie voll ein
Lebensbalken ist. Früher kamen sie als CSS-Variable im `style`-Attribut
(`style={{ '--x': '140px' }}`) – eingebettetes CSS, wenn auch nur ein
Wert.

Jetzt bekommt jedes Bauteil, das solche Werte hat, eine eigene Klasse
(`lauf-1f`) und dazu eine Regel in einem Stilblatt, das es nur zur
Laufzeit gibt:

```
.lauf-1f { --x: 140px; --y: 210px; }
```

Die Stilblätter in `stile/` lesen die Variablen wie bisher
(`left: var(--x)`). Ändert sich ein Wert – beim Ziehen sechzigmal in der
Sekunde –, wird die eine Regel geändert, keine neue angelegt; verschwindet
das Bauteil, verschwindet seine Regel mit.

Das Stilblatt entsteht über das CSSOM (`new CSSStyleSheet()` bzw.
`insertRule`), nicht als `<style>` mit Text. Das ist auch der Grund, warum
die Content-Security-Policy ohne `'unsafe-inline'` auskommt: Sie verbietet
eingebettetes CSS im Markup, nicht Regeln, die ein erlaubtes Skript über
das CSSOM setzt. Die Werte gehen dabei über `setProperty` hinein, nie als
zusammengesetzter Text – ein Wert kann die Regel also nicht verlassen,
auch wenn er von außen käme (eine Farbe, die jemand gespeichert hat).

Zwei Wege, dasselbe zu benutzen:

```
useLaufstil(werte)    ein Haken, gibt den Klassennamen zurück – für
                      Bauteile mit Verweisen und Rückrufen (die Bühne)
<Laufwert als="span" werte={…} className="…" />
                      ein Element mit Werten – auch in Listen, wo kein
                      Haken stehen darf (components/Laufwert.jsx)
```

**Ausfuhren**

- `useLaufstil` (function) – Eine eigene Klasse für dieses Bauteil, mit einer Regel, die `werte` trägt.

### frontend/src/lib/live.jsx

*238 Zeilen*

Der Draht zum Server. Solange jemand angemeldet ist, hängt hier eine
offene Verbindung (Server-Sent Events), über die Änderungen an Kampf,
Spieltisch, Würfen und Charakteren hereinkommen.

Warum überhaupt? Ohne diesen Draht müsste jedes Fenster den Server
regelmäßig fragen „gibt es was Neues?“ – bei sechs Leuten am Tisch wären
das hunderte Anfragen je Minute, und eine gezogene Figur käme trotzdem
verspätet an. Mit ihm schickt der Server von sich aus.

*Server-Sent Events* (SSE) ist dafür die kleine Lösung: eine gewöhnliche
HTTP-Verbindung, die offen bleibt und über die der Server Zeilen
nachschiebt. Einbahnstraße – wir schicken nichts darüber zurück, dafür
gibt es die normalen Aufrufe aus api.js. Das genügt hier vollauf und
spart eine zweite Technik (WebSockets) samt eigener Verwaltung.

Der Browser baut die Verbindung nach einem Abbruch von selbst wieder auf.
Damit die Seiten danach nichts verpassen – während der Unterbrechung
gesendete Ereignisse sind weg –, zählt `generation` bei jeder neuen
Verbindung hoch. Wer das beobachtet, lädt seinen Stand einfach neu.

Nur wenn der Server den Kanal *verweigert* (abgemeldet, aus der Kampagne
genommen), gibt der Browser auf. Dann wird nachgefragt, woran es liegt –
die Tore in App.jsx schicken einen zur Anmeldung oder Kampagnenauswahl –,
und liegt es an nichts davon, nach einer Pause neu angesetzt.

**Ausfuhren**

- `LiveProvider` (function) – Der Anbieter: öffnet den Kanal, solange jemand angemeldet ist und eine Kampagne gewählt hat.
- `useLive` (function) – Auf ein Ereignis hören: `useLive('wurf', (wurf) => …)`.
- `useLiveAlle` (function) – Auf mehrere Ereignisse zugleich hören – für Datenhaken, die auf einiges achten.
- `useLiveStatus` (function) – Für die Anzeige: Steht der Draht, und wer ist sonst noch am Tisch?

### frontend/src/lib/rasten.js

*59 Zeilen*

Kurze und lange Rast – die beiden Erholungsregeln aus D&D 5e.

Beide Funktionen bekommen das Charakterblatt (`data`) und geben ein
*neues* zurück; das übergebene bleibt unangetastet (siehe setPath.js,
warum das wichtig ist). Gespeichert wird nichts – das erledigt der
Aufrufer, der danach das Blatt speichert.

Wer hier etwas nachschlagen will: Spielerhandbuch, Kapitel „Abenteuer“.

**Ausfuhren**

- `kurzeRast` (function) – Kurze Rast: Eine Stunde Verschnaufen. Trefferwürfel werden einzeln ausgegeben (das erledigt das Blatt), und alles, was sich bei kurzer Rast erneuert, füllt sich wieder auf.
- `langeRast` (function) – Lange Rast: acht Stunden. Trefferpunkte voll, die Hälfte der verbrauchten Trefferwürfel zurück, alle Zauberplätze frei, eine Stufe Erschöpfung weniger, und die Rettungswürfe gegen den Tod sind vergessen.

### frontend/src/lib/rasterkarte.js

*150 Zeilen*

Bitkarten über dem Raster: eine für den Nebel, eine für die Sicht.

Der Server schickt beides als base64 verpackte Bitfolge, ein Bit je
Rasterfeld. Der Grund ist Arithmetik: Eine Karte über zweihundert Meter hat
bei einem Meter je Feld 40 000 Felder, und die wären als Liste von `"x,y"`
348 KB – bei jedem Zug, an jede Person. Als Bitkarte sind es 6,5 KB.

Hier wird sie ausgepackt und abgefragt. Das Lesen eines Bits ist billiger
als ein Nachschlagen in einer Menge, was beim Malen des Nebels zählt: Dort
wird für jedes einzelne Feld gefragt.

**Ausfuhren**

- `rasterBereich` (function) – Rasterfelder, die eine Karte umfasst – auch bei verschobenem Raster.
- `ausBase64` (function) – Aus base64 eine Karte machen. `null` bleibt `null` – das heißt beim Nebel „nichts aufgedeckt“ und bei der Sicht „keine Grenze“.
- `hatFeld` (function) – Steht das Bit für dieses Feld? Feldkoordinaten, nicht Bildpunkte.
- `hatStelle` (function) – Dasselbe, aber schon als Stelle gerechnet – für die Schleife beim Malen.
- `mitFeldern` (function) – Einen Pinselstrich anwenden und eine *neue* Karte zurückgeben.
- `bereichGrenzen` (function) – Ein Rechteck aus Feldkoordinaten, beschnitten auf das, was die Karte überhaupt hat. Gibt `null` zurück, wenn davon nichts übrig bleibt.
- `felderImBereich` (function) – Alle Felder eines solchen Rechtecks, als `"x,y"` für den Server.
- `pinselGrenzen` (function) – Der Abdruck eines Pinsels: ein Block um die Mitte.
- `felderImPinsel` (function) – Die Felder unter einem quadratischen Pinsel mit `groesse` Feldern Kantenlänge, mittig um (feldX, feldY).
- `EINHEIT` (const) – Die beiden Maßeinheiten einer Karte und wie sie heißen.
- `weite` (function) – Wie viel Spielweite steckt in `felder` Feldern dieser Karte?
- `weiteText` (function) – „12 Meter“ oder „60 Fuß“ – fertig zum Hinschreiben.
- `inFelder` (function) – Fuß vom Charakterblatt in Felder dieser Karte. Spiegelt backend/src/sicht.js.

### frontend/src/lib/setPath.js

*82 Zeilen*

Kleinkram für das Charakterblatt: verschachtelte Werte setzen und lesen,
und ein Bild aus einer Datei in handliche Größe bringen.

Warum „unveränderlich“ (immutable)? React erkennt Änderungen daran, dass
ein Objekt ein *anderes* ist als vorher – nicht daran, was darin steht.
Wer `data.combat.hp.current = 5` schreibt, ändert zwar den Wert, aber das
Objekt bleibt dasselbe, und die Oberfläche zeichnet nichts neu. Deshalb
gibt `setPath` immer eine frische Kopie zurück.

**Ausfuhren**

- `setPath` (function) – Einen verschachtelten Wert setzen, ohne das Original anzufassen:
- `getPath` (function) – Das Gegenstück zum Lesen. `?.` bricht sauber ab, wenn unterwegs etwas fehlt – hier ist das erwünscht: Ein leeres Feld ist kein Fehler.
- `fileToResizedDataUrl` (async function) – Eine ausgewählte Bilddatei zu einer kleinen `data:`-URL machen.

### frontend/src/lib/stilwerte.js

*26 Zeilen*

Werte für CSS-Variablen – Einheiten, die das Stilblatt erwartet.

Die Regel des Almanachs: Wie etwas aussieht, steht im Stilblatt
(`stile/`). Was sich erst im Browser ergibt – wo eine Figur steht, welche
Farbe sich jemand gewählt hat, wie voll ein Balken ist –, geht als
CSS-Variable in eine Laufzeit-Regel (lib/laufstil.js), und das Stilblatt
setzt sie ein:

```
<Laufwert className="farbpunkt" werte={{ '--farbe': farbe }} />
.farbpunkt { background-color: var(--farbe); }
```

Ein `style`-Attribut gibt es im Almanach nicht mehr, auch nicht für eine
einzelne Variable; die Stilprobe (scripts/stilprobe.mjs) passt darauf auf.

Diese beiden Helfer gibt es, weil eine nackte Zahl in einer CSS-Variable
keine Einheit hat: `'--x': 5` käme als `5` an, und `left: var(--x)` wäre
dann ungültig.

**Ausfuhren**

- `px` (const) – Bildpunkte: `px(12)` → `'12px'`.
- `prozent` (const) – Ein Anteil zwischen 0 und 1 als Prozentwert: `prozent(0.5)` → `'50%'`.

### frontend/src/lib/useTheme.js

*68 Zeilen*

Pergament oder Kerzenlicht – hell oder dunkel.

Die Farben selbst stehen nicht hier, sondern in stile/farben.css: Dort
hängen zwei Sätze von CSS-Variablen an `html[data-theme="…"]`. Diese Datei
setzt nur das Attribut; das Umfärben erledigt der Browser.

Gemerkt wird die Wahl im localStorage, also je Browser und Gerät. Das ist
Absicht: Wer am Tisch auf dem iPad spielt und daheim am Schirm, will dort
vielleicht Kerzenlicht und hier Pergament.

**Ausfuhren**

- `THEMES` (const) – Die beiden Erscheinungsbilder – hell (Pergament) und dunkel (Kerzenlicht).
- `useTheme` (function) – Das Erscheinungsbild samt Umschalter.

### frontend/src/lib/wuerfeln.js

*29 Zeilen*

Würfe, die vom Charakterblatt ausgehen.

Der Witz daran steht im Kommentar unten: Sie laufen über den Server,
nicht im Browser. Ein heimlich im eigenen Fenster gewürfeltes 20 wäre
kein Wurf, sondern eine Behauptung – so aber steht er bei allen am Tisch
in der Wurfchronik, mit Namen und Uhrzeit.

**Ausfuhren**

- `blattWurf` (function) – Ein Wurf direkt vom Charakterblatt. Er läuft über den Server und steht damit sofort bei allen am Tisch – genau wie ein Wurf aus dem Würfelbeutel.
- `ausdruckWurf` (function) – Freier Ausdruck, z. B. Schadenswürfel einer Waffe.

## frontend/src/lib/api/

### frontend/src/lib/api/anfrage.js

*80 Zeilen*

Der gemeinsame Unterbau aller Aufrufe an den Server: `request` und die
vier Kurzformen `post`, `put`, `patch`, `del`.

Hier und nur hier wird `fetch` aufgerufen. Hier wird das Anmelde-Cookie
mitgeschickt, die Kennung des eigenen Fensters angeheftet und aus einer
Absage des Servers ein Fehler mit `status` und `code` gemacht – für alle
Wege gleich.

**Ausfuhren**

- `API_BASE` (const) – Wo die Schnittstelle liegt – relativ, damit sie hinter jedem Tunnel stimmt.
- `setClientId` (function) – Die eigene Kennung setzen – einmal, sobald der Live-Kanal sie mitteilt (lib/live.jsx).
- `request` (async function) – Der gemeinsame Unterbau aller Aufrufe.
- `post` (const) – Schicken mit POST – anlegen und auslösen.
- `put` (const) – Schicken mit PUT – einen Eintrag als Ganzes ersetzen.
- `patch` (const) – Schicken mit PATCH – einzelne Felder ändern.
- `del` (const) – Löschen trägt in der Regel nichts bei sich – außer dort, wo der Server eine ausdrückliche Bestätigung verlangt (etwa den abgetippten Kampagnennamen).

### frontend/src/lib/api/blatt.js

*32 Zeilen*

Wege rund ums Charakterblatt: die Blätter selbst, das Kompendium zum
Nachschlagen und der Würfelbeutel.

**Ausfuhren**

- `charactersApi` (const) – Charakterblätter. `all` ist die Verwaltungsansicht der Spielleitung.
- `compendiumApi` (const) – Das Nachschlagewerk – ein zwischengespeicherter Spiegel der offenen 5e-API.
- `diceApi` (const) – Der Würfelbeutel. Gewürfelt wird auf dem Server – siehe lib/wuerfeln.js.

### frontend/src/lib/api/chronik.js

*42 Zeilen*

Wege für das, was am Tisch gesagt und festgehalten wird: Chronik, Notizen
und Handzettel, der Chat.

**Ausfuhren**

- `chronicleApi` (const) – Die Chronik: Sitzungen, Einträge, Protokoll und KI-Rückblick.
- `notesApi` (const) – Notizen und Handzettel.
- `chatApi` (const) – Der Chat am Tisch, samt Flüstern an einzelne.

### frontend/src/lib/api/kampf.js

*53 Zeilen*

Wege rund um den Kampf: der laufende Kampf, das Bestiarium, vorbereitete
Begegnungen und die Beutekiste, in der landet, was danach übrig bleibt.

**Ausfuhren**

- `encounterApi` (const) – Der *laufende* Kampf. Nicht zu verwechseln mit encountersApi unten.
- `stashApi` (const) – Die Beutekiste: Gefundenes, Münzen, Teilen und Auszahlen.
- `libraryApi` (const) – Das Bestiarium – Statblöcke, aus denen Kämpfer werden.
- `encountersApi` (const) – Vorbereitete* Begegnungen, die sich mit einem Klick stellen lassen.

### frontend/src/lib/api/konten.js

*43 Zeilen*

Wege zu Konten und Kampagnen: anmelden, Konten verwalten, Einladungen,
Kampagnen anlegen, wechseln, umbenennen, wegräumen und übernehmen.

**Ausfuhren**

- `authApi` (const) – Anmelden, Konten, Einladungscodes.
- `campaignsApi` (const) – Kampagnen: anlegen, wechseln, umbenennen, wegräumen, übernehmen.

### frontend/src/lib/api/tisch.js

*57 Zeilen*

Wege zum Spieltisch und seiner Ausstattung: Szenen, Figuren und Nebel,
Bilder, die Kartenbibliothek und der Klangteppich.

**Ausfuhren**

- `scenesApi` (const) – Der Spieltisch: Szenen, Figuren, Nebel, Vorhang, Zeigefinger.
- `mediaApi` (const) – Bilder. `url` baut nur die Adresse zusammen – sie landet in einem `<img src=…>`, der Browser holt das Bild dann selbst.
- `mapsApi` (const) – Die Kartenbibliothek: vorbereitete Karten samt eingestelltem Raster.
- `ambienceApi` (const) – Der Klangteppich – hinterlegte Spotify-Links, mehr nicht.

## frontend/src/lib/blatt/

### frontend/src/lib/blatt/abschnitte.js

*28 Zeilen*

Die Abschnitte des ausgeführten Charakterblattes – je eine Funktion, je
eine Karte auf dem Bogen.

Jede gibt HTML als Zeichenkette zurück und rechnet dabei dasselbe aus wie
die Oberfläche: Modifikatoren, Übungsbonus, passive Werte. Gerechnet wird
aber nicht hier, sondern in lib/regeln/ – hier steht nur, wie das
Ergebnis auf dem Papier aussieht.

Alles ist schlichtes Zeichenketten-Basteln statt React, und das mit
Absicht: Die erzeugte Datei muss ohne React laufen, allein im Browser
dessen, der sie doppelklickt.

Die Abschnitte liegen nach Sachgebiet in abschnitte/:
```
werte.js     – Attribute, Rettungswürfe, Sinne, Fertigkeiten
kampf.js     – Aktionen, Kampfwerte, Zustand, Ressourcen
zauber.js    – Zauberwerte, Plätze, Zauberliste und Zaubertexte
inventar.js  – Münzen, Gegenstände, Traglast
person.js    – Erscheinung, Merkmale, Hintergrund
```

Welcher Abschnitt wo auf dem Bogen steht, entscheidet koerper.js.

**Ausfuhren**

- `attribute` (aus ./abschnitte/werte.js)
- `fertigkeiten` (aus ./abschnitte/werte.js)
- `rettungswuerfe` (aus ./abschnitte/werte.js)
- `sinne` (aus ./abschnitte/werte.js)
- `aktionen` (aus ./abschnitte/kampf.js)
- `kampf` (aus ./abschnitte/kampf.js)
- `ressourcen` (aus ./abschnitte/kampf.js)
- `zustand` (aus ./abschnitte/kampf.js)
- `zauber` (aus ./abschnitte/zauber.js)
- `zauberblock` (aus ./abschnitte/zauber.js)
- `inventar` (aus ./abschnitte/inventar.js)
- `erscheinung` (aus ./abschnitte/person.js)
- `hintergrund` (aus ./abschnitte/person.js)
- `merkmale` (aus ./abschnitte/person.js)

### frontend/src/lib/blatt/datensatz.js

*149 Zeilen*

Der Datensatz am Ende des mitgenommenen Blattes – und die Anleitung für
eine KI, die das Blatt bearbeiten soll.

Wer sein Blatt einer KI gibt („mach ihn Stufe 5“, „trag die Beute von
gestern ein“), bekommt eine geänderte Datei zurück und liest sie mit
„Blatt einlesen“ wieder in den Almanach. Damit das gelingt, muss die KI
wissen, wo die Werte stehen und was sie dort darf. Das sagt ihr ein
Kommentar im Kopf der Datei – unsichtbar im Browser, aber das Erste, was
eine KI im Quelltext liest. Das Feldverzeichnis darin wird aus
glossar.js geschrieben, steht also nie neben dem echten Datenmodell.

Der Datensatz selbst ist schlichtes, eingerücktes JSON in einem
`<template>`. Die drei Zeichen, die HTML etwas bedeuten (`<`, `>`, `&`),
stehen als JSON-Escapes (`<` …) darin: So ist der Block gültiges
JSON, das eine KI ohne Umweg lesen und ändern kann, und ein Text wie
„</template>“ in einer Hintergrundgeschichte kann ihn trotzdem nicht
beenden.

Keine Abhängigkeit vom Browser: Die Blattprobe baut damit in Node echte
Dateien nach (scripts/blattprobe.mjs).

**Ausfuhren**

- `FASSUNG` (const) – Die Fassung des Dateiformats. 2: lesbares JSON, Kennung, Feldmarken, Anleitung.
- `jsonFuerHtml` (function) – JSON, das in HTML stehen darf, ohne etwas zu bedeuten – und gültiges JSON bleibt.
- `kiAnleitung` (function) – Die Anleitung für eine KI, als HTML-Kommentar. Nur „–“ statt doppelter Bindestriche: Zwei Bindestriche hintereinander beenden in manchen Werkzeugen einen Kommentar.
- `datensatzBlock` (function) – Der Datensatz als `<template>`-Block.

### frontend/src/lib/blatt/glossar.js

*222 Zeilen*

Das Feldverzeichnis des Blattes: welcher Wert wo im Datensatz steht, wie
er auf Deutsch heißt und von welcher Art er ist.

Gebraucht an drei Stellen – und deshalb an einer einzigen gepflegt:

- Die Ausfuhr markiert die sichtbaren Werte damit (`data-feld`) und
  schreibt daraus die Anleitung für eine KI in die Datei
  (blatt/datensatz.js).
- Das Einlesen weiß damit, wie es einen sichtbar geänderten Wert wieder
  in den Datensatz zurückliest (einfuhr/sichtbar.js) und welche Form
  jeder Wert haben muss (einfuhr/angleichen.js).
- Die Vorschau beim Einlesen benennt Unterschiede damit
  (einfuhr/unterschiede.js).

Die Arten:
```
text     beliebiger Text, Zeilenumbrüche erlaubt
zahl     eine Zahl
weite    eine Entfernung – gespeichert in Fuß, angezeigt nach dem
         Maßsystem des Blattes („9 m“ oder „30 Fuß“)
gewicht  ein Gewicht – gespeichert in Pfund, angezeigt nach Maßsystem
ja       wahr oder falsch
wahl     einer von wenigen festen Schlüsseln (`optionen`)
```

Ein Listeneintrag wird über seine Kennung angesprochen, nicht über seine
Stelle: `attacks.#<id>.name`. So trifft eine Änderung den richtigen
Eintrag, auch wenn eine KI die Reihenfolge umgestellt hat.

**Ausfuhren**

- `FELDER_5E` (const) – Die Felder eines 5e-Blattes, die einzeln dastehen (Listen stehen in LISTEN_5E).
- `LISTEN_5E` (const) – Die Listen eines 5e-Blattes: wo sie stehen, wie ein Eintrag heißt, welche Felder er hat.
- `FELDER_FREI` (const) – Die Felder eines freien Blattes.
- `LISTEN_FREI` (const) – Die eine Liste eines freien Blattes: seine Abschnitte.
- `verzeichnis` (const) – Verzeichnis und Listen zu einem Regelwerk.
- `leererEintrag` (function) – Ein leerer Listeneintrag mit den Vorgaben seiner Felder (ohne Kennung).
- `feldZu` (function) – Was zu einem Pfad gehört: der Eintrag des Verzeichnisses, und bei einem Listenfeld auch die Liste und die Kennung des Eintrags. `name` – der Name des Blattes selbst – steht außerhalb von `data` und wird eigens genannt.
- `anzeige` (function) – Ein Wert so, wie er auf dem ausgeführten Blatt steht – als Text. Dieselbe Form schreibt die Ausfuhr in `data-war`, und das Einlesen vergleicht damit; beide müssen also exakt gleich rechnen.

### frontend/src/lib/blatt/koerper.js

*135 Zeilen*

Der Satzspiegel: Welche Abschnitte stehen in welcher Reihenfolge auf dem
Bogen?

Zwei Fassungen, je nach System des Blattes:

```
dnd5eKoerper – der vollständige Charakterbogen
freiKoerper  – das freie Blatt für alles, was nicht D&D ist
```

Die Reihenfolge folgt dem gedruckten Bogen: oben, was man im Kampf
braucht, unten, was man zwischen den Abenden liest.

**Ausfuhren**

- `dnd5eKoerper` (function) – Der ganze Bogen eines 5e-Blattes als HTML: Kopf, dann die Tafeln in der Reihenfolge des gedruckten Charakterbogens.
- `freiKoerper` (function) – Der Bogen eines freien Blattes: Kopf, Zusammenfassung und die selbst angelegten Abschnitte.

### frontend/src/lib/blatt/werkzeug.js

*134 Zeilen*

Das Handwerkszeug für die Blattausfuhr: entschärfen, einrahmen, Bilder
einbetten.

Die eine Regel, die in dieser ganzen Ecke des Almanachs gilt: **Jeder
Wert aus dem Blatt geht durch `esc`.** Ohne das würde aus einem
Charakternamen wie `<b>Grim` eine Formatierung, und aus etwas
Bösartigerem ausführbarer Code.

`tafel`, `feld` und `zeilen` sind die drei Bausteine, aus denen jeder
Abschnitt des Blattes gebaut ist – eine Karte mit Überschrift, ein
beschriftetes Feld, eine Tabelle.

Dazu `marke`: Sie umgibt einen sichtbaren Wert mit dem Pfad, unter dem er
im Datensatz steht. Ändert jemand – oder eine KI – nur die sichtbare
Seite, findet „Blatt einlesen“ die Änderung daran wieder
(lib/einfuhr/sichtbar.js).

**Ausfuhren**

- `esc` (const) – Text für HTML entschärfen – alles, was vom Blatt kommt, läuft hier hindurch.
- `escAbsatz` (const) – Zeilenumbrüche aus Textfeldern erhalten.
- `KURZ` (const) – Die dreibuchstabigen Kürzel der Attribute, wie sie auf dem gedruckten Bogen stehen.
- `MUENZEN` (const) – Die Münzsorten als [Schlüssel, Name], von der wertvollsten zur kleinsten.
- `alsDatenUrl` (async function) – Bilder müssen mit in die Datei – ein Verweis auf den Server nützt nichts, wenn der Server gerade aus ist.
- `zaubertexte` (async function) – Die Zaubertexte aus dem Kompendium holen. Genau dafür nimmt man das Blatt ja mit: Wer den ganzen Abend nachschlagen muss, hat vom Ausdruck nichts. Schlägt der Abruf fehl, bleibt es beim Namen.
- `marke` (function) – Ein sichtbarer Wert, den „Blatt einlesen“ wiedererkennt.
- `zelle` (const) – Eine Tabellenzelle aus einem Listeneintrag – markiert, wenn der Eintrag eine Kennung hat.
- `tafel` (const) – Eine Karte mit Überschrift. Leerer Inhalt heißt: gar keine Karte.
- `feld` (const) – Ein beschriftetes Feld: kleine Beschriftung, Wert darunter; ein leerer Wert wird zu „–“. Mit `pfad` ist der Wert markiert (siehe `marke`).
- `feldHtml` (const) – Ein beschriftetes Feld, dessen Wert schon fertiges HTML ist (mit Marken darin).
- `zeilen` (const) – Eine Tabelle aus Kopf und Reihen – oder nichts, wenn es keine Reihen gibt. Die Zellen der Reihen sind schon HTML (bereits entschärft).

## frontend/src/lib/blatt/abschnitte/

### frontend/src/lib/blatt/abschnitte/inventar.js

*51 Zeilen*

Abschnitt des ausgeführten Blattes: die Habe – Münzen, Gegenstände,
Gewicht und Traglast.

**Ausfuhren**

- `inventar` (function) – Die Tafel „Habe“: Münzen, Gegenstände mit Gewicht, getragene Last gegen die Traglast.

### frontend/src/lib/blatt/abschnitte/kampf.js

*96 Zeilen*

Abschnitte des ausgeführten Blattes für den Kampf: Aktionen, Kampfwerte,
Zustand (Erschöpfung, Todesrettungswürfe) und begrenzte Ressourcen.

**Ausfuhren**

- `aktionen` (function) – Was eine Aktion, Bonusaktion oder Reaktion kostet.
- `kampf` (function) – Die Tafel „Kampf“: RK, Initiative, Tempo, Trefferpunkte, Trefferwürfel und Todesrettungswürfe.
- `zustand` (function) – Die Tafel „Zustand“ – nur, wenn etwas vorliegt: Zustände, Erschöpfung, Konzentration.
- `ressourcen` (function) – Die Tafel „Ressourcen“: begrenzte Fähigkeiten mit Ladungen und wann sie zurückkommen.

### frontend/src/lib/blatt/abschnitte/person.js

*83 Zeilen*

Abschnitte des ausgeführten Blattes über die Person hinter den Zahlen:
Erscheinung, Merkmale nach Herkunft und die Hintergrundgeschichte.

**Ausfuhren**

- `erscheinung` (function) – Geschlecht, Alter, Statur … – und was sonst noch das Bild vollmacht.
- `merkmale` (function) – Die Merkmale nach Herkunft geordnet, so wie sie gedruckt gehören.
- `hintergrund` (function) – Die Tafel „Hintergrund“: Persönlichkeit, Ideale, Bindungen, Makel, Übungen und die Geschichte.

### frontend/src/lib/blatt/abschnitte/werte.js

*75 Zeilen*

Abschnitte des ausgeführten Blattes: die Zahlen, auf die man am Tisch
schaut – Attribute, Rettungswürfe, Sinne und Fertigkeiten.

Gerechnet wird in lib/regeln/ (über lib/dnd5e.js); hier steht nur, wie
das Ergebnis auf dem Papier aussieht.

**Ausfuhren**

- `attribute` (function) – Die sechs Attributkästen: Wert groß, Modifikator darunter.
- `rettungswuerfe` (function) – Die Liste der Rettungswürfe; geübte sind hervorgehoben und tragen den Übungsbonus `pb`.
- `sinne` (function) – Die drei passiven Werte und alles, was auch ohne Licht wahrgenommen wird.
- `fertigkeiten` (function) – Die Liste der Fertigkeiten mit ihrem Bonus: ● geübt, ●● Expertise (doppelter Übungsbonus).

### frontend/src/lib/blatt/abschnitte/zauber.js

*115 Zeilen*

Abschnitte des ausgeführten Blattes für Zauberwirkende: Zauberwerte,
Plätze und die Zauberliste – auf Wunsch mit dem vollen Text jedes
Zaubers aus dem Kompendium (zauberblock), damit die Datei auch ohne Netz
vollständig ist.

**Ausfuhren**

- `zauberblock` (function) – Der volle Text eines Zaubers aus dem Kompendium – Kopfzeile, Werte, Beschreibung, höhere Grade. Leer, wenn es keinen Eintrag gibt.
- `zauber` (function) – Die Tafel „Zauberwirken“: Attribut, SG, Angriffsbonus, Plätze je Grad und die Zauberliste nach Grad.

## frontend/src/lib/blatt/stil/

### frontend/src/lib/blatt/stil/bogen.css

*170 Zeilen*

Ausgeführtes Blatt, Teil 2: der Bogen – Kopf mit Bildnis, Tafeln,
Beschriftungen und Werte, Raster, die sechs Attribute, Wertelisten
(Rettungswürfe, Fertigkeiten) und Tabellen.

### frontend/src/lib/blatt/stil/grund.css

*62 Zeilen*

Ausgeführtes Blatt, Teil 1: die Grundlagen – eigene Farben und Schriften,
der Seitenrand und die beiden Überschriftenstufen.

Die Farben stehen hier eigens und greifen nicht auf stile/farben.css zu:
Das Blatt gehört nach dem Mitnehmen niemandem mehr und soll aussehen wie
ein Ausdruck, nicht wie ein Fenster des Almanachs.

### frontend/src/lib/blatt/stil/leiste.css

*50 Zeilen*

Ausgeführtes Blatt, Teil 5: die Leiste oben (Stand und wie man druckt) und
die Fassung für Papier.

Beim Drucken verschwindet die Leiste, der Hintergrund wird weiß und die
Schrift auf Punkt umgestellt – ein sauberer Bogen statt eines
Bildschirmfotos.

### frontend/src/lib/blatt/stil/listen.css

*81 Zeilen*

Ausgeführtes Blatt, Teil 3: Zauberliste, Merkmale und Fließtext – und die
Hinweise am Rand.

### frontend/src/lib/blatt/stil/zauberblock.css

*48 Zeilen*

Ausgeführtes Blatt, Teil 4: der volle Text eines Zaubers, wie ihn das
Kompendium liefert – damit die Datei auch ohne Netz alles enthält.

## frontend/src/lib/daten/

### frontend/src/lib/daten/gespraech.js

*78 Zeilen*

Was am Tisch gesagt und gewürfelt wird: Würfelchronik und Chat.

Beide folgen demselben Muster: Die eigene Zeile landet sofort in der
Liste, weil das Echo über den Live-Kanal erst einen Wimpernschlag später
käme. Die Prüfung auf die Kennung verhindert, dass sie dann doppelt
dasteht.

**Ausfuhren**

- `useWuerfe` (function) – Die Wurfchronik. `ungelesen` treibt den Punkt am Würfelbeutel an, wenn die Leiste gerade zugeklappt ist.
- `useChat` (function) – Der Chat am Tisch. Wie beim Würfelbeutel: Eigene Zeilen landen sofort in der Liste, das Echo über den Live-Kanal erkennt sie an der Kennung wieder. Geflüstertes kommt gar nicht erst an, wenn es einen nichts angeht – das entscheidet der Server, nicht diese Datei.

### frontend/src/lib/daten/grundlage.js

*66 Zeilen*

Das Fundament der Datenschicht: einmal laden, bei jeder neuen
Live-Verbindung nachladen, Fehler festhalten.

Jeder Haken im Ordner `daten/` baut darauf auf. Wer einen neuen schreibt,
fängt hier an: `useDaten` nimmt eine Funktion, die etwas vom Server holt,
und gibt die Daten samt Nachlade-Handgriff zurück.

**Ausfuhren**

- `useDaten` (function) – Gemeinsames Fundament aller Haken: einmal laden, bei jeder neuen Live-Verbindung nachladen, Fehler festhalten.

### frontend/src/lib/daten/kampagne.js

*106 Zeilen*

Was einer Kampagne gehört: Charaktere, Beute, Notizen, Chronik.

Alles hier wandert mit der Geschichte. Wer die Kampagne wechselt, sieht
andere Helden, eine andere Kiste, andere Notizen – der Server filtert das,
nicht diese Datei.

**Ausfuhren**

- `useCharaktere` (function) – Die Charaktere der Kampagne, geteilt in `meine` (die eigenen) und `geteilte` (alle, die in der Runde stehen). Trefferpunkte und Namen laufen über den Live-Kanal ein, statt die Liste neu zu laden.
- `useBeute` (function) – Die gemeinsame Kiste: Gefundenes und Münzen.
- `useNotizen` (function) – Notizen der Spielleitung. `handzettel` sind die ausgeteilten davon – die einzigen, die ein Spielerfenster überhaupt geliefert bekommt.
- `useSitzungen` (function) – Die Sitzungen der Chronik. `offene` ist die gerade laufende, falls eine läuft.
- `useSitzung` (function) – Eine einzelne Sitzung samt ihren Einträgen.

### frontend/src/lib/daten/kampf.js

*55 Zeilen*

Der Kampf und was ihn füttert: die laufende Reihenfolge, das Bestiarium
und die vorbereiteten Begegnungen.

Der laufende Kampf horcht auf Live-Ereignisse – daran hängen mehrere
Fenster gleichzeitig. Bestiarium und Begegnungen tun das nicht: An ihnen
arbeitet die Spielleitung allein, und meist an genau einem Schirm.

**Ausfuhren**

- `useKampf` (function) – Der laufende Kampf: Reihenfolge, wer dran ist, alle Kämpfer.
- `useBestiarium` (function) – Das Bestiarium – Statblöcke für Monster und NSC.
- `useBegegnungen` (function) – Vorbereitete Begegnungen („Wache am Stadttor“, „3 Goblins“).

### frontend/src/lib/daten/runde.js

*53 Zeilen*

Was der ganzen Runde gehört, nicht einer einzelnen Kampagne: die Konten,
die Einladungen und der Klangteppich.

Die Klangbibliothek ist Vorbereitung und lädt deshalb nur hinter dem
Schirm der Spielleitung – ein Spielerfenster würde sonst bei jedem Start
ein 403 einsammeln. Was gerade *läuft*, hören dagegen alle.

**Ausfuhren**

- `useKonten` (function) – Alle Konten des Almanachs – nur die Spielleitung darf sie sehen.
- `useEinladungen` (function) – Einladungscodes. `offene` sind die noch nicht eingelösten.
- `useKlangbibliothek` (function) – Die hinterlegten Ambienten des DM. Wie die Kartenbibliothek gehört sie zur Vorbereitung und lädt deshalb nur hinter dem Schirm.
- `useKlang` (function) – Was gerade über dem Tisch liegt – das sieht die ganze Runde.

### frontend/src/lib/daten/spieltisch.js

*151 Zeilen*

Der Spieltisch: die aufgelegte Szene, die Szenenliste, Zeigefinger und
die Kartenbibliothek.

Hier steckt das Heikelste der ganzen Datenschicht, und zwar aus einem
Grund: Eine gezogene Figur muss sofort dort liegen, wo der Finger sie
hinzieht. Deshalb wird örtlich *vorgegriffen* – die Änderung wird erst
angezeigt und dann zum Server geschickt. Käme jede Figur erst nach der
Antwort an, ruckelte das Ziehen um die Laufzeit der Anfrage hinterher.

**Ausfuhren**

- `useSzene` (function) – Die aufgelegte Szene samt Figuren und Nebel. Figuren und Nebel kommen als einzelne Änderungen herein, damit eine gezogene Figur nicht die ganze Karte neu lädt.
- `useSzenenListe` (function) – Alle Szenen der Spielleitung, samt Vermerk, welche aufliegt.
- `usePings` (function) – Kurz aufleuchtende Zeigefinger – nichts davon wird gespeichert.
- `useKarten` (function) – Die Vorbereitungs-Bibliothek des DM. Karten liegen hier, bevor sie jemand sieht – deshalb lädt der Haken nichts, solange die Rolle nicht stimmt: ein Spielerfenster würde sonst bei jedem Start ein 403 einsammeln.

## frontend/src/lib/einfuhr/

### frontend/src/lib/einfuhr/angleichen.js

*238 Zeilen*

Einen eingelesenen Datensatz so herrichten, dass das Blatt im Almanach
danach ganz normal funktioniert.

Eine KI schreibt Werte gern in einer Form, die für sie gleichbedeutend
ist, für die Oberfläche aber nicht: „16“ statt 16, „ja“ statt true,
„Vergiftet“ als „vergiftet“, einen neuen Angriff ohne Kennung. Ohne
Kennung kann die Liste ihre Zeilen nicht auseinanderhalten (siehe
components/RepeatingRows.jsx), aus „16“ + 2 würde „162“. Deshalb wird
hier jeder Wert in die Form gebracht, die das leere Blatt vorgibt
(lib/regeln/leeresBlatt.js) – und alles, was dabei geändert oder
weggelassen wurde, als Hinweis gemeldet. Erraten wird nichts: Was sich
nicht eindeutig lesen lässt, fällt auf den Ausgangswert zurück, und der
Hinweis sagt es.

**Ausfuhren**

- `angleichen` (function) – Einen eingelesenen Datensatz herrichten.

### frontend/src/lib/einfuhr/datei.js

*78 Zeilen*

Eine Blattdatei aufbereiten und ihren Datensatz finden.

Was zurückkommt, wenn man eine Datei durch eine KI geschickt hat, sieht
nicht immer aus wie das, was hineinging: Mal steht die Datei in einem
Codeblock mit ```html davor und einem Satz dahinter (aus dem Chatfenster
kopiert), mal fehlt die Hülle und es kommt nur das JSON, mal sind die
Anführungszeichen des Datensatzes wieder als `&quot;` geschrieben wie in
Dateien vor Fassung 2. Das alles wird hier auf eine Form gebracht.

**Ausfuhren**

- `entitaeten` (const) – Was HTML entschärft, zurückverwandelt – benannt (`&amp;`) und als Zahl (`&#39;`, `&#x27;`).
- `aufbereiten` (function) – Den Dateitext auf eine Form bringen: ohne Byte-Order-Mark, mit `\n` als Zeilenende – und aus einer Chat-Antwort der Codeblock, in dem die Datei (oder der Datensatz) steht.
- `datensatzFinden` (function) – Den Datensatz in der Datei finden.

### frontend/src/lib/einfuhr/json.js

*127 Zeilen*

JSON lesen, das eine KI (oder eine Hand) geschrieben hat.

Gültiges JSON geht wie immer durch `JSON.parse`. Scheitert das, versucht
`reparieren` die Fehler, die beim Bearbeiten durch eine KI am häufigsten
entstehen – und nur diese, damit nichts erraten wird:

- Kommentare (`// …`, `/* … *\/`), die eine KI gern dazuschreibt,
- ein Komma nach dem letzten Eintrag eines Objekts oder einer Liste,
- echte Zeilenumbrüche und Tabulatoren mitten in einem Text, wo JSON
  `\n` und `\t` verlangt.

Bleibt es danach kaputt, nennt die Fehlermeldung Zeile und Spalte in der
Datei und zeigt die Stelle – damit man der KI sagen kann, was sie
reparieren soll.

**Ausfuhren**

- `reparieren` (function) – Die drei Reparaturen in einem Durchgang. Gibt den reparierten Text zurück und für jedes seiner Zeichen die Stelle im Original – für Fehlermeldungen, die auf die richtige Zeile zeigen.
- `jsonLesen` (function) – JSON lesen, notfalls repariert.

### frontend/src/lib/einfuhr/pfad.js

*61 Zeilen*

Pfade in einen Datensatz – mit Listeneinträgen über ihre Kennung.

```
combat.hp.max              ein Feld in verschachtelten Objekten
attacks.#<id>.damage       ein Feld im Listeneintrag mit dieser Kennung
attunement.1               die zweite Stelle einer einfachen Liste
```

Anders als lib/setPath.js ändern `pfadSetzen` und `pfadHolen` hier in einem
Datensatz, der dem Einlesen allein gehört (eine Abschrift), und legen
fehlende Ebenen an: Eine Datei, deren Datensatz eine KI verloren hat,
wird aus den sichtbaren Feldern neu aufgebaut – samt Listeneinträgen,
die es vorher nur als Pfad gab.

**Ausfuhren**

- `pfadHolen` (function) – Ein Wert unter einem Pfad, oder undefined, wenn unterwegs etwas fehlt.
- `pfadSetzen` (function) – Einen Wert unter einem Pfad setzen; fehlende Objekte, Listen und Listeneinträge werden angelegt. Ändert `obj` selbst.

### frontend/src/lib/einfuhr/sichtbar.js

*131 Zeilen*

Was auf der sichtbaren Seite geändert wurde, in den Datensatz übernehmen.

Eine KI – oder jemand mit einem Texteditor – ändert manchmal nur, was man
sieht: Aus „Stufe 3“ wird „Stufe 4“, der Datensatz am Ende der Datei
bleibt, wie er war. Damit das nicht verloren geht, trägt jeder sichtbare
Wert zwei Angaben (siehe lib/blatt/werkzeug.js, `marke`):

```
data-feld  wo er im Datensatz steht
data-war   wie er bei der Ausfuhr dastand
```

Daraus folgt für jeden Wert eine einfache Regel:

- Steht im Datensatz etwas anderes als `data-war`, wurde der Datensatz
  bearbeitet. Er gilt – auch wenn die Seite etwas anderes zeigt.
- Sonst: Steht sichtbar etwas anderes als `data-war`, wurde nur die
  Seite bearbeitet. Dann gilt das Sichtbare.
- Sonst hat sich nichts geändert.

Gelesen wird ohne DOMParser, mit regulären Ausdrücken über die Form, die
die Ausfuhr selbst schreibt – so läuft es auch in der Blattprobe (Node).

**Ausfuhren**

- `glatt` (function) – Ein Wert auf seine Form zum Vergleichen gebracht: Leerraum je Zeile gefaltet, „–“ als leer.
- `markenLesen` (function) – Alle markierten Werte einer Datei.
- `zurueck` (function) – Sichtbaren Text in einen Wert zurückverwandeln, nach der Art des Feldes. Eine Einheit im Text („12 m“, „40 Fuß“, „3 kg“) gilt vor dem Maßsystem des Blattes. Gibt `undefined` zurück, wenn sich nichts herauslesen lässt.
- `sichtbaresUebernehmen` (function) – Die sichtbaren Änderungen in den Datensatz übernehmen.

### frontend/src/lib/einfuhr/unterschiede.js

*128 Zeilen*

Was sich zwischen zwei Ständen eines Blattes unterscheidet – in Worten.

Bevor eine eingelesene Datei ein vorhandenes Blatt ersetzt, zeigt die
Vorschau (components/einlesen/Vorschau.jsx), was sich dadurch ändert:
„Stufe: 3 → 4“, „Neu: Angriff „Kurzbogen““, „Entfernt: Zauber
„Magisches Geschoss““. Wer einer KI eine Aufgabe gegeben hat, sieht so,
ob sie getan hat, was sie sollte – und nichts darüber hinaus.

**Ausfuhren**

- `unterschiede` (function) – Die Unterschiede zwischen dem Blatt im Almanach und dem eingelesenen.

## frontend/src/lib/regeln/

### frontend/src/lib/regeln/blattfelder.js

*134 Zeilen*

Was auf dem Blatt in Listen steht: Aktionsarten, die Standardaktionen
jeder Figur, die Herkunft eines Merkmals, die Felder des Aussehens und
die Erfahrungsschwellen.

Alles Aufzählungen, die eine Auswahlliste oder eine Vorlage füllen. Sie
stehen zusammen, weil sie dasselbe tun: Sie geben dem Blatt seine Form,
ohne etwas auszurechnen.

**Ausfuhren**

- `AKTION_ARTEN` (const) – Was eine Handlung kostet: Aktion, Bonusaktion, Reaktion oder nichts.
- `aktionArtLabel` (const) – Der Name einer Aktionsart („bonus“ → „Bonusaktion“); Unbekanntes gilt als Aktion.
- `STANDARD_AKTIONEN` (const) – Was am Tisch immer geht – die Handlungen aus dem Grundregelwerk.
- `MERKMAL_ARTEN` (const) – Woher ein Merkmal stammt. Auf dem gedruckten Blatt stehen die Merkmale nach Herkunft sortiert – erst was die Klasse gibt, dann die Spezies, dann Talente. Wer nachschlägt, sucht genau so.
- `merkmalArtLabel` (const) – Der Name einer Merkmalsherkunft („klasse“ → „Klasse“); Unbekanntes gilt als Sonstiges.
- `AUSSEHEN_FELDER` (const) – Die Felder der Seite „Aussehen & Persönlichkeit“. Sie entscheiden nichts über Regeln, aber ohne sie ist ein Charakter nur eine Wertetabelle.
- `XP_THRESHOLDS` (const) – Erfahrungsschwellen der Stufen 1 bis 20.
- `levelFromExperience` (function) – Die Stufe zu einer Zahl Erfahrungspunkte, nach der Tabelle des Grundregelwerks.
- `experienceToNextLevel` (function) – Was bis zur nächsten Stufe noch fehlt – oder null auf Stufe 20.

### frontend/src/lib/regeln/leeresBlatt.js

*198 Zeilen*

Wie ein frisches Blatt aussieht – und wie ein altes auf den neuen Stand
kommt.

Zwei Seiten derselben Sache, und die zweite ist die wichtigere:

```
`defaultCharacterData()` liefert ein vollständiges, leeres Blatt.

`withDefaults(data)` ergänzt an einem *vorhandenen* Blatt alles, was
seither dazugekommen ist. Der Server speichert das Blatt als einen
JSON-Klumpen und weiß nicht, was darin steht – also gibt es dort keine
Wanderung wie in der Datenbank. Sie passiert hier, beim Laden.
```

Daraus folgt die Regel für jedes neue Feld auf dem Blatt: Es gehört in
**beide** Funktionen. Steht es nur in der ersten, stürzt die Oberfläche
über jedem Blatt ab, das älter ist als das Feld.

**Ausfuhren**

- `defaultCharacterData` (function) – Ein leeres 5e-Blatt mit allen Feldern, die die Oberfläche erwartet – alle Attribute auf 10, nichts geübt, keine Plätze. Grundlage für neue Blätter und für withDefaults(), das ältere Blätter auffüllt.
- `leeresMerkmal` (function) – Ein Merkmal, wie es aus der Liste kommt. Quelle und Seite stehen dabei, damit man am Tisch nachschlagen kann, ohne zu suchen.
- `leereAktion` (function) – Eine neue, leere eigene Aktion mit frischer Kennung.
- `withDefaults` (function) – Ältere Blätter kennen die neu hinzugekommenen Felder noch nicht. Statt eine Wanderung über die Datenbank zu schreiben, werden sie beim Öffnen ergänzt – gespeichert wird das erst, wenn ohnehin etwas geändert wird.
- `defaultFreeformData` (function) – Ein leeres freies Blatt: drei Abschnitte zum Beschriften, sonst nichts.

### frontend/src/lib/regeln/listen.js

*94 Zeilen*

Die Listen aus dem Regelwerk: Attribute, Fertigkeiten, Zustände,
Erschöpfung, Zaubergrade.

Reine Aufzählungen, keine Rechnung. Sie liegen an einem Ort, damit
„Wahrnehmung“ im ganzen Almanach gleich heißt und überall in derselben
Reihenfolge steht – auf dem Blatt, in der Kampfliste, im ausgeführten
HTML und im Ausdruck.

Wer eine Fertigkeit ergänzt, ergänzt sie hier, und sie erscheint überall.

**Ausfuhren**

- `ABILITIES` (const) – Die sechs Attribute mit ihrem Schlüssel im Blatt und ihrem Namen.
- `SKILLS` (const) – Die achtzehn Fertigkeiten. `ability` sagt, welches Attribut sie speist – daraus rechnet `skillModifier` weiter unten den Wurfbonus.
- `SPELL_LEVELS` (const) – Zaubergrade 1 bis 9. Zaubertricks (Grad 0) stehen bewusst nicht drin: Sie brauchen keinen Zauberplatz und tauchen deshalb in Slot-Listen nie auf.
- `PASSIVE_FERTIGKEITEN` (const) – Drei Fertigkeiten stehen auch passiv auf dem Blatt: Sie gelten, ohne dass jemand würfelt. Die Spielleitung schlägt sie nach, wenn sie nicht verraten will, dass überhaupt etwas zu bemerken war.
- `CONDITIONS` (const) – Die Zustände aus dem Regelwerk, in der Sprache des Almanachs.
- `EXHAUSTION_STEPS` (const) – Erschöpfung wirkt in sechs Stufen, und jede baut auf der vorigen auf. Die kurzen Texte stehen im Blatt, damit niemand nachschlagen muss.

### frontend/src/lib/regeln/masse.js

*89 Zeilen*

Fuß und Meter, Pfund und Kilogramm.

Die Regel, die das ganze Charakterblatt trägt: **Gespeichert wird immer
in Fuß und Pfund**, angezeigt wahlweise metrisch. Umgerechnet wird erst
beim Anzeigen.

Der Grund ist nicht Bequemlichkeit, sondern Genauigkeit: Würde beim
Speichern umgerechnet, sammelten sich Rundungsfehler bei jedem Öffnen
und Schließen. Und ein Blatt bliebe nicht dasselbe, gleich wer es
aufschlägt.

Beim *Maßstab* wird bewusst grob gerundet: Ein Feld sind 5 Fuß oder
1,5 Meter – am Tisch sagt jeder „anderthalb Meter“, niemand
„1,524 Meter“. Beim *Gewicht* dagegen wird ehrlich umgerechnet, denn
Traglast ist eine Regel, die man ausrechnet.

**Ausfuhren**

- `MASSSYSTEME` (const) – Fuß oder Meter, Pfund oder Kilogramm.
- `METER_JE_FUSS` (const) – Am Tisch misst ein Feld fünf Fuß *oder* anderthalb Meter – das Regelwerk rechnet nicht um, es setzt gleich. Deshalb wird auch hier gesetzt und nicht umgerechnet: drei Zehntel Meter je Fuß. So werden aus 30 Fuß glatte 9 m und aus 60 Fuß Dunkelsicht glatte 18 m, wie es im Regelwerk steht.
- `KILO_JE_PFUND` (const) – Gewichte dagegen sind echte Maße und werden ehrlich umgerechnet.
- `istMetrisch` (const) – Spielt dieses Blatt metrisch? Alles außer ausdrücklich „imperial“ gilt als metrisch.
- `weiteEinheit` (const) – Die Einheit, in der Weiten angezeigt werden: „m“ oder „Fuß“.
- `gewichtEinheit` (const) – Die Einheit, in der Gewichte angezeigt werden: „kg“ oder „Pfund“.
- `weiteAnzeigen` (function) – Eine Weite aus dem Blatt (immer in Fuß) so, wie sie angezeigt wird.
- `weiteNachFuss` (function) – Und zurück: Was jemand eingetippt hat, wieder in Fuß.
- `gewichtAnzeigen` (function) – Ein Gewicht aus dem Blatt (immer in Pfund) so, wie es angezeigt wird – auf eine Stelle gerundet.
- `gewichtNachPfund` (function) – Und zurück: Was jemand eingetippt hat, wieder in Pfund – eine Stelle genauer als angezeigt.
- `weiteMitEinheit` (const) – Weite samt Einheit, fertig zum Hinschreiben: „9 m“, „60 Fuß“.
- `gewichtMitEinheit` (const) – Gewicht samt Einheit, fertig zum Hinschreiben: „11,3 kg“, „25 Pfund“.

### frontend/src/lib/regeln/rechnen.js

*123 Zeilen*

Was das Regelwerk ausrechnen lässt.

Jede dieser Funktionen steht für genau eine Regel aus dem
Spielerhandbuch – und jede steht **nur hier**. Das ist der Grund für die
eigene Datei: Der Übungsbonus taucht am Rettungswurf auf, an jeder
Fertigkeit, am Zauber-Schwierigkeitsgrad und am Zauberangriff. Stünde er
viermal da, wäre er beim nächsten Regelupdate dreimal richtig.

Die Zahlen dahinter, kurz:
```
Modifikator     = (Wert − 10) / 2, abgerundet
Übungsbonus     = +2 ab Stufe 1, je vier Stufen einer mehr
Passiver Wert   = 10 + Modifikator (ohne Würfel)
Zauber-SG       = 8 + Übungsbonus + Modifikator
Traglast        = Stärke × 15 Pfund
```

**Ausfuhren**

- `carryingCapacity` (function) – Tragkraft nach den Grundregeln: Stärke mal 15 Pfund.
- `traglastStufen` (function) – Die drei Marken, die auf dem gedruckten Blatt stehen – alles in Pfund. `ueberladen` ist zugleich die Tragkraft: Wer mehr schleppt, kommt nicht mehr voran. Heben, schieben und ziehen geht doppelt so schwer.
- `getragenesGewicht` (function) – Was ein Rucksack voller Gegenstände wiegt, in Pfund.
- `abilityModifier` (function) – Der Modifikator eines Attributwerts: (Wert − 10) / 2, abgerundet. Unlesbares zählt als 0.
- `formatModifier` (function) – Ein Modifikator mit Vorzeichen, wie er auf dem Blatt steht: „+3“, „−1“, „+0“.
- `proficiencyBonus` (function) – Der Übungsbonus einer Stufe: +2 auf Stufe 1–4, +3 auf 5–8 … bis +6 auf 17–20.
- `skillModifier` (function) – Der Wurfbonus einer Fertigkeit, Übung und Expertise eingerechnet.
- `passiverWert` (function) – Der passive Wert einer Fertigkeit: zehn plus ihr Bonus.
- `saveModifier` (function) – Der Rettungswurfbonus eines Attributs.
- `spellSaveDC` (function) – Zaubererschwerungsgrad und Zauberangriffsbonus.
- `spellAttackBonus` (function) – Der Zauberangriffsbonus: Übungsbonus plus Modifikator des Zauberattributs.
- `zauberwerte` (function) – Zauber-SG und Angriffsbonus eines Blattes, wie sie gelten.

## frontend/src/pages/blatt/

### frontend/src/pages/blatt/Blattkopf.jsx

*111 Zeilen*

Der Kopf des Charakterblattes: Bildnis, Name, Volk · Klasse · Stufe, der
Speicherstand – und rechts Trefferpunkte, Mitnehmen, Einlesen und Löschen.

„Mitnehmen“ und „Einlesen“ sind ein Paar: Die mitgenommene Datei lässt
sich bearbeiten – auch von einer KI – und mit „Einlesen“ wieder in dieses
Blatt übernehmen, nach einer Vorschau (components/BlattEinlesen.jsx).

Fremde Blätter (`schreibbar === false`) zeigen statt des Speicherstands,
wem sie gehören; Bildnis und Name lassen sich dann nicht ändern.

**Ausfuhren**

- `Blattkopf` (default function)

### frontend/src/pages/blatt/reiter.js

*25 Zeilen*

Die Reiter des 5e-Blattes, in der Reihenfolge, in der sie oben stehen.

Ein Blatt mit `system !== 'dnd5e'` bekommt stattdessen das freie Blatt
(FreeformSheet) – ein leeres Textfeld für alles, was nicht D&D ist.

Jeder Reiter bekommt dasselbe: `data` (das ganze Blatt), `update(pfad,
wert)` für ein einzelnes Feld und `replace(data)` für Vorgänge, die viele
Felder auf einmal ändern (etwa eine Rast).

**Ausfuhren**

- `DND_TABS` (const) – Die fünf Reiter als { key, label, Component } – `Component` bekommt `data`, `update` und `replace`.

### frontend/src/pages/blatt/Speicherstand.jsx

*35 Zeilen*

Die kleine Anzeige neben dem Namen: „Tinte trocknet …“, „Wird
eingetragen …“, „In der Chronik verzeichnet“ – oder dass es nicht
geklappt hat.

Sie ersetzt den Speichern-Knopf, den es absichtlich nicht gibt (siehe
useBlatt.js): Wer tippt, soll sehen, dass es ankommt.

**Ausfuhren**

- `Speicherstand` (default function)

### frontend/src/pages/blatt/useBlatt.js

*147 Zeilen*

Das Blatt laden, halten und von selbst speichern – der Zustand hinter der
Seite des Charakterblattes (CharacterSheet.jsx).

Zwei Dinge lohnen besondere Aufmerksamkeit, weil sie leicht zu übersehen
und schwer zu finden sind, wenn sie fehlen:

1. *Gespeichert wird von selbst*, 600 ms nach dem letzten Tastendruck
   (siehe `persist`). Es gibt keinen Speichern-Knopf und soll keinen
   geben – niemand soll mitten im Kampf ans Sichern denken müssen.
2. *Von außen kommt auch etwas herein*: Teilt die Spielleitung Schaden
   aus, wandern die Trefferpunkte über den Live-Draht aufs Blatt. Damit
   beides sich nicht in die Quere kommt, gibt es `offeneAenderung`.

Eigene Datei, weil genau diese Abstimmung – Zeitgeber, Zähler, die
Sperre für den Live-Draht – das Heikelste an der ganzen Seite ist. Hier
steht sie allein und lässt sich lesen, ohne dass einem das Aussehen des
Blattes dazwischenkommt.

**Ausfuhren**

- `useBlatt` (function) – }}

## frontend/src/pages/

### frontend/src/pages/CharacterSheet.jsx

*137 Zeilen*

Das Charakterblatt – die Seite, an der die Runde am meisten sitzt.

Sie hält das Blatt als *einen* Zustand (`character`) und reicht ihn an
fünf Reiter weiter, die jeweils einen Ausschnitt anzeigen. Geändert wird
nie direkt: Die Reiter rufen `updateData('combat.hp.current', 5)` auf,
und daraus entsteht ein neues Blatt (siehe lib/setPath.js).

Laden, Speichern und der Live-Draht stecken in blatt/useBlatt.js – dort
steht auch, warum es keinen Speichern-Knopf gibt. Diese Seite kümmert
sich um die Handgriffe drumherum (Bildnis, Mitnehmen, Einlesen, Löschen) und
darum, welcher Reiter offen ist.

```
blatt/Blattkopf.jsx      – Bildnis, Name, Speicherstand, Knöpfe
blatt/Speicherstand.jsx  – „Tinte trocknet …“
blatt/reiter.js          – die fünf Reiter des 5e-Blattes
```

**Ausfuhren**

- `CharacterSheet` (default function)

### frontend/src/pages/Chronicle.jsx

*179 Zeilen*

Die Chronik: was an den Spielabenden geschah.

Der Almanach schreibt sie im Vorbeigehen mit – jeder Wurf, jeder Schaden,
jede aufgelegte Szene hinterlässt einen Eintrag (siehe
backend/src/chronicle.js). Diese Seite macht daraus etwas Lesbares.

Drei Dinge, die man wissen sollte:

- Einträge tragen `kind` und `meta`, also *Struktur*, nicht nur einen
  fertigen Satz. Das Symbol links kommt aus `SYMBOL`, der Text bei
  Bedarf aus lib/beschriftung.js. Eine andere Oberfläche könnte daraus
  ganz andere Sätze bauen.
- Verdeckte Einträge (`secret`) bekommt ein Spielerfenster gar nicht
  erst geschickt – das entscheidet der Server.
- Der Rückblick ist die einzige Stelle im Almanach, an der ein
  Sprachmodell mitarbeitet, und er ist freiwillig: ohne Schlüssel in
  der .env bleibt der Knopf fort.

Die Seite hält den Zustand und die Handgriffe; gezeichnet wird in
chronik/ (Seitenkopf, Sitzungsliste, Sitzungskopf, Kapitel, Eintrag,
Nachtrag), geordnet in chronik/kapitel.js.

**Ausfuhren**

- `Chronicle` (default function)

### frontend/src/pages/Compendium.jsx

*148 Zeilen*

Das Nachschlagewerk: Völker, Klassen, Zauber, Monster und was sonst im
Regelwerk steht.

Die Daten stammen von der offenen D&D-5e-API. Der Almanach fragt sie
nicht direkt vom Browser aus ab, sondern über den eigenen Server, der
jede Antwort zwischenspeichert (backend/src/routes/compendium.js). Das
hat zwei Gründe: Es geht beim zweiten Mal sofort, und am Spieltisch mit
wackligem Netz funktioniert es weiter.

Links die Liste, rechts die Einzelheiten – auf dem Telefon untereinander.
Gesucht wird örtlich in der schon geladenen Liste, ohne neue Anfrage.

**Ausfuhren**

- `Compendium` (default function)

### frontend/src/pages/Dashboard.jsx

*212 Zeilen*

Die Startseite: alle Charaktere der Kampagne auf einen Blick.

Zwei Abteilungen, und der Unterschied ist wichtig: „Die Runde“ sind die
Blätter der Spielenden, „Hinter dem Schirm“ die NSC-Blätter (`npc`) –
der Wirt, der Räuberhauptmann, der Drache. Letztere sieht nur die
Spielleitung, und zwar nicht, weil diese Seite sie versteckt, sondern
weil der Server sie einem Spielerfenster gar nicht erst schickt.

Was hier mit einem Blatt geschehen kann:
- Abschrift  – eine Kopie *in dieser* Kampagne (etwa aus einer Vorlage)
- In Kampagne … – eine Kopie in einer *anderen* Kampagne, nur für die
                  Spielleitung (siehe components/Kopierziel.jsx)
- Löschen    – das eigene Blatt, oder jedes, wenn man die Runde führt

Und oben: ein neues Blatt anlegen oder ein mitgenommenes einlesen – auch
eines, das jemand oder eine KI inzwischen bearbeitet hat; trägt es die
Kennung eines Blattes hier, lässt es sich auch darauf übernehmen
(components/BlattEinlesen.jsx).

**Ausfuhren**

- `Dashboard` (default function)

### frontend/src/pages/DmBoard.jsx

*76 Zeilen*

Der Schirm der Spielleitung: sieben Reiter, hinter denen die Runde nichts
zu suchen hat.

Die Seite selbst tut fast nichts – sie merkt sich nur, welcher Reiter
offen ist, und zeigt das passende Bauteil. Die Arbeit steckt in den
Bauteilen unter components/dm/.

Geschützt wird sie an zwei Stellen: `NurSpielleitung` in App.jsx hält
Spieler von der Adresse fern, und jeder Weg des Servers dahinter prüft
die Rolle noch einmal selbst. Das zweite ist das, worauf es ankommt.

**Ausfuhren**

- `DmBoard` (default function) – Das Board der Spielleitung – alles, was die Runde nicht sehen soll.

### frontend/src/pages/Help.jsx

*46 Zeilen*

Die Hilfeseite – das Handbuch im Almanach selbst.

Reiner Text, keine Logik: Sie holt nichts vom Server und rechnet nichts
aus. Die einzige Verzweigung ist `isDm` – die Spielleitung bekommt
zusätzliche Abschnitte, die für die Runde nur verwirrend wären.

Für Mitarbeitende am Code: Wer ein Werkzeug ändert oder hinzufügt, ändert
es bitte auch hier. Eine Hilfe, die etwas anderes behauptet als die
Oberfläche, ist schlimmer als gar keine. Dasselbe gilt für docs/ –
SPIELLEITUNG.md und SPIELER.md sind die ausführlichen Fassungen davon.

Die Abschnitte liegen in hilfe/, einer je Thema, in der Reihenfolge, in
der sie auf der Seite stehen.

**Ausfuhren**

- `Help` (default function)

### frontend/src/pages/Kampagnenwahl.jsx

*133 Zeilen*

Die Weiche zwischen Anmeldung und Tisch: Wer an mehreren Kampagnen
teilnimmt (oder noch an keiner sitzt), landet hier statt direkt im
Almanach. Erst wenn eine Kampagne aktiv ist, öffnen sich die Türen dahinter.

Aufgerufen wird die Seite nicht über eine Adresse, sondern vom
`KampagnenTor` in App.jsx – sie *ersetzt* dort alles andere, solange keine
Kampagne gewählt ist. Deshalb bringt sie ihr eigenes Gerüst mit
(ganzseitig, mittig) statt im gewohnten Layout zu stecken.

Die Seite richtet sich an zwei sehr verschiedene Leute: Die Spielleitung
darf hier eine Kampagne eröffnen; ein Spieler ohne Kampagne kann gar
nichts tun außer warten, bis ihn jemand einträgt – und bekommt deshalb
einen Satz zu lesen, der genau das sagt.

**Ausfuhren**

- `Kampagnenwahl` (default function)

### frontend/src/pages/Login.jsx

*160 Zeilen*

Die Pforte: anmelden, einrichten oder der Runde beitreten.

Eine Seite, drei Gesichter – welches sie zeigt, steht in `aktuellerModus`:

```
einrichten – der Almanach ist noch leer. Das erste Konto führt die
             Spielleitung; das entscheidet der Server, nicht diese
             Seite. Solange `needsSetup` gilt, gibt es keinen anderen
             Weg, deshalb überstimmt es die Wahl des Nutzers.
anmelden   – der gewöhnliche Fall.
beitreten  – mit einem Einladungscode. Ohne Code kein Konto: Sonst
             stünde ein Almanach, der im Netz erreichbar ist, jedem
             offen, der die Adresse kennt.
```

Gezeigt wird sie von App.jsx, wenn niemand angemeldet ist – sie hat
bewusst keine eigene Adresse.

**Ausfuhren**

- `Login` (default function)

### frontend/src/pages/NewCharacter.jsx

*184 Zeilen*

Ein neues Charakterblatt anlegen.

Bewusst karg: Name, System, dazu Volk und Klasse als Vorschlagsliste.
Alles Weitere trägt man auf dem Blatt selbst ein. Ein Assistent über
sechs Schritte wäre beim ersten Mal hübsch und ab dem zweiten lästig.

Volk und Klasse kommen aus dem Kompendium (der offenen 5e-API, gespiegelt
auf unserem Server). Ist es nicht erreichbar, erscheint ein Hinweis und
es geht trotzdem weiter – eine Nachschlageliste darf das Anlegen eines
Charakters nicht verhindern.

**Ausfuhren**

- `NewCharacter` (default function)

### frontend/src/pages/NotFound.jsx

*22 Zeilen*

Die Seite für Adressen, die es nicht gibt.

Eingehängt in App.jsx als `path="*"` – der Stern greift, wenn keine der
davor genannten Adressen passt. Sie steht *innerhalb* des Layouts, damit
die Kopfleiste stehen bleibt und man mit einem Klick zurückfindet.

**Ausfuhren**

- `NotFound` (default function)

### frontend/src/pages/Tabletop.jsx

*190 Zeilen*

Der Spieltisch: Karte, Figuren, Nebel – und rechts die Leiste mit Kampf,
Beute und Handzetteln.

Diese Seite ist der *Dirigent*, nicht der Zeichner. Gezeichnet wird in
components/tabletop/Board.jsx; die Werkzeugleiste der Spielleitung steckt
in SceneBar.jsx. Hier liegen nur der Zustand, der beide angeht (welches
Werkzeug, welche Figur gewählt, wie breit der Pinsel), und die Handgriffe,
die zum Server führen.

Die wichtigste Eigenheit ist das *Vorgreifen*: Eine gezogene Figur und ein
Pinselstrich werden sofort örtlich angezeigt und erst danach geschickt.
Würde man auf die Antwort warten, ruckelte jeder Strich um die Laufzeit
der Anfrage hinterher.

```
tisch/useNebelpinsel.js  Nebelstriche sammeln und gebündelt schicken
tisch/Seitenleiste.jsx   Kampf, Beute, Handzettel, Figur
tisch/LeererTisch.jsx    was ohne Karte zu sehen ist
tisch/Handzettel.jsx     die ausgeteilten Handzettel
```

**Ausfuhren**

- `Tabletop` (default function)

## frontend/src/pages/chronik/

### frontend/src/pages/chronik/Eintrag.jsx

*34 Zeilen*

Eine Zeile der Chronik: Uhrzeit, Symbol, Satz.

Der Satz kommt fertig vom Server (`text`), das Symbol aus `kind`. Eine
andere Oberfläche könnte aus `kind` und `meta` einen ganz eigenen Satz
bauen – deshalb trägt jeder Eintrag beides.

**Ausfuhren**

- `Eintrag` (default function)

### frontend/src/pages/chronik/kapitel.js

*62 Zeilen*

Die Chronik ordnen: Symbole je Art, Uhrzeiten und die Einteilung eines
Abends in Kapitel.

Ohne JSX, damit sich die Einteilung auch ohne Oberfläche prüfen ließe –
sie ist reine Rechnung über eine Liste.

**Ausfuhren**

- `SYMBOL` (const) – Ein Symbol je Art von Eintrag. Fehlt eine Art hier, bleibt die Zeile schlicht – das ist gewollt, damit eine neue Art nichts kaputt macht.
- `uhrzeit` (const) – Uhrzeit eines Eintrags, wie sie am Rand steht: „20:15“.
- `inKapitel` (function) – Aus der Folge von Einträgen Kapitel machen – wie im Protokoll.

### frontend/src/pages/chronik/Kapitel.jsx

*31 Zeilen*

Ein Kapitel des Abends: Überschrift mit Uhrzeit, darunter die Einträge.

Kapitel beginnen an Szenenwechseln (siehe kapitel.js); was davor
geschah, steht unter „Zu Beginn“.

**Ausfuhren**

- `Kapitel` (default function)

### frontend/src/pages/chronik/Nachtrag.jsx

*33 Zeilen*

Nachtragen, was der Almanach nicht sehen konnte – nur für die
Spielleitung.

Der Text gehört der Seite (Chronicle.jsx), nicht diesem Formular: So
bleibt ein halb getippter Nachtrag stehen, wenn zwischendurch eine andere
Sitzung aufgeschlagen wird.

**Ausfuhren**

- `Nachtrag` (default function)

### frontend/src/pages/chronik/Seitenkopf.jsx

*45 Zeilen*

Der Kopf der Chronik: Überschrift – und für die Spielleitung der Knopf,
der eine Sitzung beginnt oder die laufende schließt.

Es gibt immer höchstens eine offene Sitzung (`offene`); solange sie
läuft, landet alles, was am Tisch geschieht, in ihr.

**Ausfuhren**

- `Seitenkopf` (default function)

### frontend/src/pages/chronik/Sitzungskopf.jsx

*63 Zeilen*

Der Kopf einer aufgeschlagenen Sitzung: der Titel (für die Spielleitung
gleich zum Umbenennen), das Protokoll zum Sichern, der Rückblick und das
Löschen.

Der Titel wird beim Tippen nur örtlich geändert (`onTitel`) und erst beim
Verlassen des Feldes gespeichert (`onTitelFertig`) – eine Anfrage je
Umbenennung statt je Tastendruck.

Den Rückblick gibt es nur, wenn der Server einen Sprachmodell-Schlüssel
hat (`ki.verfuegbar`); ohne ihn fehlt der Knopf ganz.

**Ausfuhren**

- `Sitzungskopf` (default function)

### frontend/src/pages/chronik/Sitzungsliste.jsx

*27 Zeilen*

Die Liste der Sitzungen am linken Rand: Titel, Datum, Zahl der Einträge –
und ein „läuft“ an der offenen.

**Ausfuhren**

- `Sitzungsliste` (default function) – Die Liste der Sitzungen am linken Rand: Titel, Datum, Zahl der Einträge – und ein „läuft“ an der offenen.

## frontend/src/pages/hilfe/

### frontend/src/pages/hilfe/Blatt.jsx

*102 Zeilen*

Hilfe: rund ums eigene Blatt – das Charakterblatt, Zauber und Rasten,
die Beutekiste und das Mitnehmen als eigenständige Datei – samt dem Rückweg,
auch nach einer Bearbeitung durch eine KI.

**Ausfuhren**

- `Blatt` (default function)

### frontend/src/pages/hilfe/Geraet.jsx

*45 Zeilen*

Hilfe: rund ums Gerät – der Almanach auf dem Home-Bildschirm, die beiden
Erscheinungsbilder, das Würfeln und der rote Punkt neben dem Namen.

**Ausfuhren**

- `Geraet` (default function)

### frontend/src/pages/hilfe/Gespraech.jsx

*38 Zeilen*

Hilfe: was am Abend gesprochen und festgehalten wird – der Chat am Tisch
und die Chronik.

**Ausfuhren**

- `Gespraech` (default function)

### frontend/src/pages/hilfe/Grundlagen.jsx

*73 Zeilen*

Hilfe, erster Teil: was der Almanach ist, wer welche Rolle hat und wie
mehrere Kampagnen nebeneinander leben.

Die Spielleitung liest beim Thema Kampagnen mehr: wie man umbenennt,
löscht und etwas in eine andere Kampagne kopiert.

- `@param` {{ isDm: boolean }} props

**Ausfuhren**

- `Grundlagen` (default function)

### frontend/src/pages/hilfe/Musik.jsx

*20 Zeilen*

Hilfe: Musik am Tisch – was der Klangteppich tut und was nicht.

**Ausfuhren**

- `Musik` (default function)

### frontend/src/pages/hilfe/Quellen.jsx

*32 Zeilen*

Hilfe: woher die Regeltexte stammen, mit Verweisen auf die Quellen.

**Ausfuhren**

- `Quellen` (default function)

### frontend/src/pages/hilfe/Spielleitung.jsx

*114 Zeilen*

Hilfe: der Abschnitt „Für die Spielleitung“ – was hinter dem Schirm
liegt und wie man es benutzt.

Nur die Spielleitung bekommt ihn zu sehen; die Seite (Help.jsx)
entscheidet das, nicht dieser Abschnitt.

**Ausfuhren**

- `Spielleitung` (default function)

### frontend/src/pages/hilfe/Spieltisch.jsx

*37 Zeilen*

Hilfe: der Spieltisch – Karte, Figuren, Nebel, Messen und Zeigen aus der
Sicht der Runde.

**Ausfuhren**

- `Spieltisch` (default function)

## frontend/src/pages/tisch/

### frontend/src/pages/tisch/Handzettel.jsx

*36 Zeilen*

Die ausgeteilten Handzettel in der Seitenleiste – für alle am Tisch.

Nur die ausgeteilten: Was die Spielleitung noch hinter dem Schirm hält,
schickt der Server einem Spielerfenster gar nicht erst (siehe
lib/daten.js, useNotizen).

**Ausfuhren**

- `Handzettel` (default function)

### frontend/src/pages/tisch/LeererTisch.jsx

*39 Zeilen*

Was der Tisch zeigt, wenn keine Karte darauf liegt: entweder den
geschlossenen Vorhang oder die Bitte, eine Karte aufzulegen – jeweils in
zwei Fassungen, für die Spielleitung und für die Runde.

Der Satz für die Runde verrät beim Vorhang absichtlich nichts über das,
was dahinter aufgebaut wird.

**Ausfuhren**

- `LeererTisch` (default function)

### frontend/src/pages/tisch/Seitenleiste.jsx

*79 Zeilen*

Die Leiste rechts am Tisch: Kampf, Beute, Handzettel – und für die
Spielleitung die gewählte Figur.

Auf schmalen Schirmen liegt sie nicht neben, sondern *statt* der Karte;
`offen` schaltet zwischen beiden um (der Knopf dafür sitzt auf der
Karte, siehe Tabletop.jsx).

Welcher Reiter offen ist, hält die Seite: Wählt die Spielleitung auf der
Karte eine Figur, springt die Leiste von selbst auf „Figur“.

**Ausfuhren**

- `Seitenleiste` (default function)

### frontend/src/pages/tisch/useNebelpinsel.js

*59 Zeilen*

Den Nebel malen, ohne dass es ruckelt: sofort örtlich, gebündelt zum
Server.

Jeder Pinselstrich trifft Dutzende Felder, und jedes davon sofort zu
schicken hieße Dutzende Anfragen je Strich. Stattdessen weicht der Nebel
hier sofort (`nebelSetzen`), die Felder sammeln sich in einem Puffer, und
alle PINSEL_MS geht gebündelt hinaus, was sich angesammelt hat.

**Ausfuhren**

- `useNebelpinsel` (function) – 

## frontend/src/stile/

### frontend/src/stile/bauteile.css

*182 Zeilen*

Die wiederkehrenden Bauteile: Velinblatt, Eingabefelder, Knöpfe.

Hier steht, was mit Tailwind-Klassen im JSX mühsam wäre, weil es an zu
vielen Stellen gebraucht wird: `panel`, `field-box`, `btn btn-seal`.
Alles Weitere – Abstände, Anordnung, Größen – steht als Tailwind-Klasse
dort, wo es gilt.

`@layer components` sagt Tailwind, dass diese Regeln *vor* den
Hilfsklassen greifen sollen: Ein `className="panel p-6"` überschreibt
damit die Polsterung des Velinblatts, und nicht umgekehrt.

Die Mindesthöhe von 44 bis 48 Bildpunkten an Feldern und Knöpfen ist kein
Zufall, sondern das Maß, das sich mit dem Finger sicher treffen lässt –
der Almanach wird am Spieltisch auf einem iPad bedient.

### frontend/src/stile/eigenheiten.css

*31 Zeilen*

Was der Browser von sich aus tut und hier abgestellt wird.

Die Pfeilchen an Zahlenfeldern treffen auf dem iPad ohnehin nur
Ungeübte, und die Bildlaufleiste in Grau passt nicht auf ein Pergament.

### frontend/src/stile/farben.css

*82 Zeilen*

Die Farben – zweimal dieselben Namen, einmal hell, einmal dunkel.

Alles in der Oberfläche greift auf diese Namen zu, nie auf einen
Farbwert: `text-ink`, `bg-panel`, `border-rule`. Deshalb genügt zum
Umschalten zwischen Pergament und Kerzenlicht *ein* Attribut am
<html>-Element (siehe lib/useTheme.js) – jede Farbe im ganzen Almanach
wechselt mit, ohne dass irgendwo eine Bedingung stünde.

Wer eine Farbe ändern will, ändert sie hier. Wer eine hinzufügt, fügt sie
in *beide* Sätze ein, sonst fehlt sie im Kerzenlicht.

`@theme` ist Tailwind v4: Aus `--color-ink` werden dabei von selbst die
Klassen `text-ink`, `bg-ink`, `border-ink` und so fort.

### frontend/src/stile/grundlage.css

*35 Zeilen*

Der Untergrund: das Pergament selbst, und was der Browser sonst noch
mitbringt und hier zurechtgerückt wird.

Das Pergament entsteht aus drei weichen Farbverläufen übereinander statt
aus einem Bild – so kostet es keine Ladezeit, wird bei jeder Fenstergröße
richtig und bleibt beim Blättern stehen (`background-attachment: fixed`).

### frontend/src/stile/schriften.css

*24 Zeilen*

Die Schriften des Almanachs.

Sie liegen als npm-Paket bei und werden mitgebaut – die Oberfläche braucht
also kein Internet, um richtig auszusehen. Das ist auf einem Raspberry Pi
im Wohnzimmer keine Kleinigkeit, sondern der Unterschied zwischen
„sieht aus wie eine Handschrift“ und „sieht aus wie ein Formular“.

```
Cinzel              – Kapitälchen für Überschriften und Knöpfe
EB Garamond         – der Lesetext
UnifrakturMaguntia  – die Initialen auf der Anmeldeseite
```

Geladen wird nur, was wirklich gebraucht wird: lateinische Zeichen, vier
Schnitte. Jeder weitere Schnitt kostet Ladezeit auf dem iPad.

## frontend/src/stile/spieltisch/

### frontend/src/stile/spieltisch/farben.css

*28 Zeilen*

Spieltisch, Teil 1: die Farben des Tisches.

Sie stehen fest und folgen nicht `[data-theme]` wie die in
stile/farben.css – siehe den Kommentar über :root.

### frontend/src/stile/spieltisch/figuren.css

*113 Zeilen*

Spieltisch, Teil 3: alles, was auf der Karte steht und mit ihr wandert –
die Bühne selbst, Figuren mit Lebensbalken und Namensschild, der
Auswahlring und der Zeigefinger.

Eine Figur steht in *Kartenpunkten*: Ihre Lage kommt als CSS-Variable
(`--x`, `--y`) aus dem JSX, gezoomt wird darüber mit einer einzigen
Transformation auf der Bühne (`.tisch-buehne`).

### frontend/src/stile/spieltisch/flaeche.css

*75 Zeilen*

Spieltisch, Teil 2: die Fläche, das Rasternetz, die Vorschau des
nächsten Nebelstrichs und die Beschriftungen auf der Karte.

### frontend/src/stile/spieltisch/schichten.css

*62 Zeilen*

Spieltisch, Teil 4: die Schichten über den Figuren – Nebel und Lineal –
und der leere Tisch, solange keine Karte aufliegt.

## frontend/public/

### frontend/public/aussehen.js

*26 Zeilen*

Das gewählte Aussehen setzen, bevor der erste Strich gezeichnet wird.

Diese Datei läuft absichtlich *vor* der Oberfläche und außerhalb von
React: Sie hängt als gewöhnliches <script> im Kopf der index.html und
blockiert damit das Zeichnen für den Bruchteil, den sie braucht.

Warum dieser Aufwand für eine Zeile? Weil sonst jeder Start im
Kerzenlicht mit einem hellen Aufblitzen beginnt: Die Seite erscheint in
der Standardfarbe, React lädt, useTheme() greift – und erst dann wird es
dunkel. Auf einem Raspberry Pi dauert das lange genug, um zu stören.

Gelesen wird derselbe Schlüssel, den lib/useTheme.js schreibt. Ändert
sich dort der Name, muss er hier mit geändert werden – deshalb steht er
an beiden Stellen im Kommentar.

localStorage kann werfen (privater Modus, gesperrte Website-Daten).
Dann eben Pergament: Ein Absturz vor dem ersten Bild wäre das Schlimmste,
was eine Farbeinstellung anrichten könnte.

## frontend/

### frontend/vite.config.js

*96 Zeilen*

Wie die Oberfläche gebaut wird.

Drei Bausteine:

```
react()        – JSX und schnelles Nachladen beim Entwickeln
tailwindcss()  – die Hilfsklassen; die eigenen Regeln stehen in src/stile/
VitePWA()      – macht den Almanach installierbar (Home-Bildschirm auf
                 iPad und Telefon) und hält ihn im Zwischenspeicher
```

Beim Zwischenspeicher gilt je Art von Anfrage eine andere Regel, und das
mit Absicht:

```
Kompendium   CacheFirst   – Regeltexte ändern sich nicht; einmal geholt,
                            kommen sie vom Gerät, auch ohne Netz
Blätter      NetworkFirst – immer den frischen Stand, aber nach drei
                            Sekunden ohne Antwort lieber den letzten
                            bekannten als gar keinen
Bilder       CacheFirst   – eine Kennung, ein Bild, für immer
```

Alles andere unter /api/ geht nie über den Zwischenspeicher: Kampf, Nebel
und Würfe veraltet anzuzeigen wäre schlimmer, als sie gar nicht zu zeigen.

Beim Entwickeln (`npm run dev`) leitet Vite /api an den Server auf Port
3001 weiter – so laufen Oberfläche und Server getrennt und trotzdem unter
einer Adresse, und das Anmelde-Cookie funktioniert wie im Betrieb.
