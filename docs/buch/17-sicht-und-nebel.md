# Sicht und Nebel

Der Spieltisch zeigt jeder Person etwas anderes. Die Spielleitung sieht die ganze Karte; die Spielerin sieht, was ihre Figur kennt und was sie gerade sehen kann; hinter dem Vorhang sieht die Runde gar nichts. Dieses Kapitel erklärt, wie der Almanach das ausrechnet – auf dem Server, je Person, bei jeder Änderung – und wie der Browser es zeichnet.

Die Rechnung steht in `backend/src/sicht.js` und `backend/src/sicht/`, die Frage „wer sieht was?“ in `backend/src/spieltisch/sichtbarkeit.js`, das Zeichnen in `frontend/src/components/tabletop/brett/Nebelschicht.jsx` und `frontend/src/lib/rasterkarte.js`.

## Drei Begriffe

Drei Wörter gehen leicht durcheinander, und der ganze Rest des Kapitels hängt daran, sie auseinanderzuhalten:

**Nebel** – welche Felder einer Szene je **aufgedeckt** wurden. Der Nebel ist Erinnerung und Vorbereitung zugleich: Die Spielleitung malt ihn mit dem Pinsel weg (oder wieder hin), und was aufgedeckt ist, bleibt aufgedeckt, auch wenn niemand mehr dort steht. Er gehört zur Szene und ist für alle gleich.

**Sicht** – was die eigenen Figuren **gerade** wahrnehmen können, gerechnet aus ihren Sinnen, dem Licht und der Sichtweite der Szene. Sie ist je Person verschieden, entsteht bei jeder Änderung neu und wird nirgends gespeichert.

**Vorhang** – ist er zu, bekommt die Runde gar nichts vom Tisch. Er hängt am Tisch, nicht an der Szene: Sonst müsste man ihn für jede neue Karte neu zuziehen, und genau in dem Moment sähe die Runde alles.

Was eine Spielerin auf dem Schirm hat, ist die Schnittmenge: **aufgedeckt und in Sicht** ist klar, **aufgedeckt, aber nicht in Sicht** ist gedämpft (man weiß, wie es dort aussieht, sieht aber gerade nicht hin), **nicht aufgedeckt** ist schwarz.

## Das Raster in Zahlen

Alles wird in **Rasterfeldern** gerechnet. Eine Szene kennt dafür vier Zahlen: die Feldgröße in Bildpunkten der Karte (`gridSize`, Vorgabe 70), den Versatz des Gitters (`gridOffsetX`, `gridOffsetY`) und den Maßstab – wofür ein Feld steht (`unit` = `fuss` oder `meter`, `scale`, Vorgabe 5 Fuß).

**Welche Felder hat eine Karte?** (`rasterBereich`):

```
minX = ⌊(0 − versatzX) / g⌋            maxX = ⌊(breite − 1 − versatzX) / g⌋
minY = ⌊(0 − versatzY) / g⌋            maxY = ⌊(höhe − 1 − versatzY) / g⌋
```

Bei verschobenem Raster beginnt das erste Feld links oben also bei einem negativen Index – ein angeschnittenes Feld am Rand gehört dazu.

**Auf welchem Feld steht eine Figur?** (`figurenFeld`): auf dem Feld unter ihrer Mitte. Eine Figur steht mit ihrer linken oberen Ecke bei (`x`, `y`) in Kartenpunkten und ist `size` Felder breit:

```
mitteX = x + size·g/2        fx = ⌊(mitteX − versatzX) / g⌋
mitteY = y + size·g/2        fy = ⌊(mitteY − versatzY) / g⌋
```

Eine große Figur (zwei Felder) steht damit auf dem Feld rechts unten ihrer Mitte – eine Vereinfachung, die sich am Tisch nicht bemerkbar macht.

**Wie viele Felder sind eine Weite?** (`inFelder`): Die Sinne stehen auf dem Blatt in Fuß, weil das Regelwerk in Fuß geschrieben ist. Umgerechnet wird mit dem Maßstab der Karte:

```
fußJeFeld = scale                   (Maßstab in Fuß)
fußJeFeld = scale · 3,2808…         (Maßstab in Metern)
felder    = ⌊fuß / fußJeFeld⌋
```

| Weite auf dem Blatt | 5 Fuß je Feld | 1 Meter je Feld |
|---|---|---|
| 30 Fuß (Dunkelsicht eines Zwergs) | 6 Felder | 9 Felder |
| 60 Fuß (Dunkelsicht einer Elfe) | 12 Felder | 18 Felder |
| 40 Fuß (Fackel: 20 hell + 20 dämmrig) | 8 Felder | 12 Felder |

**Wie weit ist es zwischen zwei Feldern?** Für die Sicht: **euklidisch**, gemessen von Feldmitte zu Feldmitte – so, wie die Regeln einen Radius auf dem Raster auslegen: „alle Felder, deren Mitte innerhalb liegt“. Eine Weite von *r* Feldern ist also eine Scheibe (`scheibe()`): alle Felder mit dx² + dy² ≤ r².

Das **Lineal** am Brett misst dagegen anders: Es zählt Diagonalen einfach (die längere der beiden Seiten), wie die Bewegungsregel in D&D 5e. Das sind zwei verschiedene Fragen – „wie weit reicht ein Radius?“ und „wie weit komme ich zu Fuß?“ –, und beide werden so beantwortet, wie es im Regelwerk steht.

Dieselben Rechnungen stehen für den Browser noch einmal in `frontend/src/lib/rasterkarte.js`. Beide Seiten **müssen** übereinstimmen: Die Bitkarte, die der Server schickt, legt der Browser Stelle für Stelle auf seine Felder. Wer an einer Seite etwas ändert, ändert die andere mit.

## Die Sichtrechnung

`sichtFelder(szene, alleFiguren, eigeneFiguren, sinneJeFigur)` in `sicht/felder.js` beantwortet: **Was sehen diese Figuren zusammen?** Die Antwort ist eine Menge von Feldern – oder `null`, und `null` heißt „keine Grenze“: alles, was aufgedeckt ist.

Der Aufbau in einem Satz: **Sichtbar ist, was innerhalb der eigenen Reichweite liegt und dort auch wahrzunehmen ist.**

### Wann es keine Grenze gibt

`null` kommt zurück,

- wenn der Nebel der Szene ausgeschaltet ist (`fogEnabled = false`) – dann gibt es nichts zu begrenzen;
- wenn die Person keine eigene Figur auf der Karte hat – wer nicht mitspielt oder dessen Figur noch nicht steht, soll nicht vor einem schwarzen Blatt sitzen;
- in einer **hellen** Szene, sobald eine der eigenen Figuren unbegrenzt sieht (keine Sichtweite auf dem Blatt und keine Sichtweite der Szene). Die Vereinigung ihrer Sicht wäre ohnehin alles.

### Eine helle Szene

Für jede eigene Figur:

```
reichweite = min(eigeneSichtweite, sichtweiteDerSzene)      (beides in Feldern; 0 heißt unbegrenzt)
sichtbar  ∪= Scheibe(Feld der Figur, reichweite)
```

Die **eigene Sichtweite** kommt vom Blatt (`combat.senses.sight`); 0 heißt unbegrenzt – bei Tageslicht sieht man bis zum Horizont. Die **Sichtweite der Szene** (`scenes.sight`) gilt für alle: Nebelbank, Schneetreiben, dichter Wald.

Das eigene Feld sieht man immer, und sei es durch Tasten.

### Eine dunkle Szene

In einer dunklen Szene (`dark = 1`) kommt das Licht dazu. Zuerst, einmal für die ganze Karte: **Was ist beleuchtet?** (`beleuchteteFelder`): Jede Figur mit Licht erhellt eine Scheibe mit dem Radius *hell + dämmrig* – für alle, nicht nur für sich. Hell und dämmrig fallen dabei zusammen: In beidem sieht man. (Dämmriges Licht gibt Nachteil auf Wahrnehmung – eine Regel für den Wurf, nicht für den Nebel.)

Dann für jede eigene Figur:

```
ausAugen    = eigene Sichtweite                         (unbegrenzt, wenn 0)
ausLicht    = eigenes Licht (hell + dämmrig)
reichweite  = min( max(ausAugen, ausLicht), sichtweiteDerSzene )

dunkelSinne = min( weitester von Dunkelsicht, Blindsicht, Erschütterung, Wahrer Blick , reichweite )

sichtbar ∪= eigenes Feld
sichtbar ∪= Scheibe(Feld der Figur, dunkelSinne)
sichtbar ∪= { beleuchtete Felder, deren Abstand zur Figur ≤ reichweite }
```

Drei Regeln stecken darin, und jede ist eine bewusste Entscheidung:

1. **Die eigene Fackel verlängert den eigenen Blick.** Wer im Finstern ein Licht anzündet, sieht damit weiter als seine eingetragene Sichtweite – das ist der ganze Zweck einer Fackel.
2. **Fremdes Licht verlängert ihn nicht.** Innerhalb der eigenen Reichweite ist sichtbar, was beleuchtet ist, auch von fremdem Licht. Aber die Fackel am anderen Kartenrand geht einen nichts an – sonst wanderte das eigene Nebelfenster, ohne dass man einen Schritt getan hätte.
3. **Die Szene deckelt alles.** Nebel bleibt Nebel, auch mit Laterne. Auch die Dunkelsinne reichen nie über die Reichweite hinaus.

### Zwei Beispiele

*Der Keller aus dem Kapitel „Ein Spielabend“*: dunkle Szene, 5 Fuß je Feld, keine Sichtweite der Szene.

- **Naelith** (Elfe, Dunkelsicht 60 Fuß, keine Sichtweite, kein Licht): `ausAugen` unbegrenzt, `reichweite` unbegrenzt, `dunkelSinne` = 12 Felder. Sie sieht eine Scheibe von zwölf Feldern um sich – und dazu jedes beleuchtete Feld auf der ganzen Karte, denn ihre Reichweite ist unbegrenzt.
- **Ein Mensch ohne Dunkelsicht, mit Sichtweite 0, ohne Licht**: `reichweite` unbegrenzt, `dunkelSinne` 0. Er sieht sein eigenes Feld und jedes beleuchtete Feld auf der Karte – also Seraphines Fackelschein, wo immer sie steht.
- **Derselbe Mensch mit Sichtweite 30 Fuß** (sechs Felder, etwa weil er kurzsichtig ist): `reichweite` = 6. Er sieht sein Feld und beleuchtete Felder im Umkreis von sechs Feldern – Seraphines Fackel am anderen Ende des Kellers nicht.
- **Derselbe mit eigener Fackel**: `ausLicht` = 8, `reichweite` = max(6, 8) = 8. Seine Fackel erhellt acht Felder um ihn, und er sieht sie alle.

*Eine Waldlichtung im Nebel*: helle Szene, Sichtweite der Szene 60 Fuß, Maßstab 1 Meter je Feld. Jede Figur ohne eigene Sichtweite sieht ⌊60 / 3,28⌋ = 18 Felder weit, unabhängig von Dunkelsicht – die zählt nur im Dunkeln.

### Was bewusst fehlt

**Keine Wände.** Licht und Blick gehen durch Mauern hindurch. Eine Sichtlinie mit Wänden bräuchte Wände: gezeichnet, gespeichert, gepflegt, für jede Karte. Der Almanach überlässt das der Spielleitung und ihrem Pinsel: Der von Hand gemalte Nebel begrenzt jede Sicht, und was hinter der Ecke nicht zu sehen sein soll, wird nicht aufgedeckt.

**Kein Unterschied zwischen hell und dämmrig** (siehe oben).

## Wer sieht was

`szenenSicht(konto, kampagne)` in `spieltisch/sichtbarkeit.js` beantwortet die Kernfrage des Spieltisches – und zwar **an genau einer Stelle**. Jeder Weg, der eine Szene verschickt, bedient sich hier. Gäbe es zwei Stellen, an denen Sicht entsteht, wäre irgendwann eine falsch, und „falsch“ hieße hier: Die Runde sieht den Hinterhalt.

Der Ablauf:

1. **Vorhang zu, und es fragt nicht die Spielleitung?** Dann `{ vorhang: true }` und sonst nichts – kein Name, kein Bild, keine Figur, kein Nebel. Die Spielleitung bekommt auch bei geschlossenem Vorhang ihren Tisch, samt der Angabe, dass er zu ist.
2. **Keine Szene aufgelegt?** Dann nichts.
3. **Die Grundlage** für alle: die Szene mit ihren Einstellungen, der Nebel als Bitkarte, `vorhang`.
4. **Die Spielleitung ohne NSC-Sicht** bekommt alle Figuren, auch verborgene, und keine Sicht (`sichtBits: null`).
5. **Alle anderen** – und die Spielleitung, wenn sie durch die Augen einer Figur schaut:
   - *Eigene Figuren* sind die, die an einem Blatt hängen, das dieser Person gehört (bei der NSC-Sicht: die eine gewählte Figur).
   - Die *Sicht* rechnet `sichtFelder()` aus allen Figuren (für das Licht), den eigenen (für die Augen) und den Sinnen hinter jeder Figur (vom verknüpften Blatt).
   - *Sichtbar* ist eine Figur, wenn sie eine eigene ist – oder wenn sie nicht verborgen ist, auf einem aufgedeckten Feld steht (bei eingeschaltetem Nebel) und, falls es eine Sicht gibt, auf einem Feld in Sicht.
   - Zurück gehen nur die sichtbaren Figuren, dazu die Sicht als Bitkarte.

**Was nicht sichtbar ist, steht nicht in der Antwort.** Nicht ausgeblendet, nicht durchsichtig gemacht – es fehlt. Wer im Browser ins Netzwerkfenster schaut, findet es dort nicht. Früher lag der Nebel nur *über* den Figuren – das war Kulisse, keine Deckung.

### Die Sinne hinter den Figuren

Eine Figur sieht, was ihr Charakterblatt hergibt. `sinneJeFigur()` holt für alle Figuren mit Blatt in *einer* Abfrage die Sinne (`combat.senses`) aus den Blättern. Eine Figur ohne Blatt hat keine Sinne: In einer hellen Szene sieht sie unbegrenzt, in einer dunklen nur ihr Feld und was beleuchtet ist.

Ändern sich die Sinne auf einem Blatt, schickt der Server die Szene neu (`PUT /api/characters/:id` vergleicht die Sinne vorher und nachher, damit nicht jeder Tastendruck am Namen eine Szene auslöst). Wer sich Dunkelsicht einträgt, sieht es sofort am Tisch.

### Die NSC-Sicht

Die Spielleitung kann durch die Augen einer Figur schauen (`POST /api/scenes/nsc-sicht { tokenId }`). Dann gilt für sie dieselbe Rechnung wie für die Runde – buchstäblich dieselbe Funktion –, mit der gewählten Figur als einziger eigener. Verborgene Figuren sieht sie dabei, wenn sie in Sicht stehen: Der Wachposten weiß, wo seine Kameraden lauern. Eine Vorschau, die anders rechnete als das Original, wäre keine Hilfe, sondern eine Falle.

## Die Bitkarte

Nebel und Sicht wandern als **Bitkarte** zum Browser: ein Bit je Rasterfeld, zeilenweise, base64 verpackt (`sicht/bitkarte.js`).

```
stelle = (y − minY) · spalten + (x − minX)
byte   = stelle >> 3          (stelle / 8)
bit    = stelle & 7           (stelle mod 8), niederwertigstes zuerst
```

Der Grund ist Arithmetik. Eine Außenkarte über zweihundert Meter hat bei einem Meter je Feld 200 × 200 = 40 000 Felder. Als Liste von `"x,y"` wären das rund 348 KB – und die Szene geht bei jedem Zug an jede Person neu hinaus; bei fünf Spielenden 1,7 MB für einen Schritt zur Seite. Als Bitkarte sind es 5 000 Byte, base64 rund 6,5 KB: das Fünfzigfache weniger. Und der Browser liest ein Bit beim Malen schneller, als er in einer Menge nachschlägt.

Gespeichert wird der Nebel trotzdem als Liste der aufgedeckten Felder (`scenes.fog`, JSON). Die Liste ist leicht zu ändern (ein Strich fügt Felder hinzu oder nimmt sie heraus) und unabhängig vom Raster: Verschiebt die Spielleitung das Gitter, bleiben die Felder, was sie waren. Höchstens 65 536 aufgedeckte Felder je Szene – genug für 200 × 200 mit Kopfraum.

**Einzelne Pinselstriche** wandern weiterhin als `"x,y"`: Ein Strich ist klein, dafür lohnt kein Umpacken.

## Der Nebelpinsel

Die Spielleitung malt mit einem quadratischen Pinsel (ungerade Kantenlänge – bei einer geraden gäbe es keine Mitte, und der Abdruck läge versetzt) oder zieht ein Rechteck auf. Die Oberfläche zeigt vorher als Umriss, was der nächste Strich treffen würde.

Drei Kniffe halten das Malen flüssig:

1. **Die Strecke zwischen zwei Abdrücken** (`usePinselabdruck.js`). Bei einem schnellen Strich springt der Zeiger zwischen zwei Bildern über mehrere Felder. Ohne Zwischenschritte bliebe eine Perlenkette stehen statt eines Strichs; deshalb wird die Strecke seit dem letzten Abdruck mit aufgefüllt.
2. **Sofort örtlich** (`nebelSetzen` in `lib/daten/spieltisch.js`): Der Nebel weicht auf dem eigenen Schirm im selben Augenblick, als neue Bitkarte (`mitFeldern` kopiert nur die paar Kilobyte der Bitfolge).
3. **Gebündelt zum Server** (`pages/tisch/useNebelpinsel.js`): Die Felder sammeln sich 120 Millisekunden lang in zwei Töpfen – aufdecken und verhüllen, jeweils als Menge, damit ein doppelt überstrichenes Feld nur einmal hinausgeht –, dann geht je Topf *eine* Anfrage. Aus einem Strich über dreißig Felder wird eine Anfrage statt dreißig. Schlägt sie fehl, lädt die Oberfläche die Szene neu: Sonst sähe die Spielleitung aufgedecktes Land, das die Runde nie zu sehen bekommt.

Auf dem Server fügt `POST /api/scenes/:id/nebel` die Felder hinzu (höchstens 4 000 je Anfrage), schickt den Strich an die Fenster der Spielleitung und – nur wenn die Szene offen aufliegt – an die Runde, und prüft, ob sich dadurch für jemanden ändert, welche Figuren er sieht. Nur dann geht an diese Person eine neue Figurenliste. Ohne dieses Gedächtnis löste jeder Strich über schon aufgedecktes Land eine Runde Figurenlisten aus, bei einem gezogenen Strich hundert Mal in der Sekunde.

„Alles aufdecken“ und „alles verhüllen“ (`POST /api/scenes/:id/nebel/alles`) schreiben den Nebel auf einmal und schicken die ganze Szene neu.

## Zeichnen im Browser

`Nebelschicht.jsx` zeichnet den Nebel als **ein Bild mit einem Bildpunkt je Rasterfeld** auf eine Leinwand (`<canvas>`) – `cols × rows` Punkte, vom Browser auf die Größe der Karte gestreckt. Das ist um Größenordnungen billiger, als tausend Rechtecke zu zeichnen, und läuft auch auf einem iPad flüssig. Weil Nebel und Sicht im selben Raster liegen wie das Bild, genügt beim Malen ein laufender Zähler statt einer Rechnung je Feld – bei 40 000 Feldern der Unterschied zwischen flüssig und ruckelig.

Jeder Bildpunkt ist dunkel (fast schwarz), und seine Deckkraft sagt den Zustand:

| Zustand | Runde | Spielleitung |
|---|---|---|
| nicht aufgedeckt | 255 (deckend) | 130 (durchscheinend) |
| aufgedeckt, nicht in Sicht | 168 (gedämpft) | 70 |
| aufgedeckt und in Sicht | 0 (klar) | 0 |

Die Spielleitung schaut durch den Nebel hindurch; für sie ist er ein Schatten über dem, was die Runde nicht kennt. Die mittlere Stufe entsteht nur, wenn der Server eine Sicht mitgeschickt hat – für die Spielleitung also nur bei der NSC-Sicht.

Für die Runde liegt die Nebelschicht **über** den Figuren, für die Spielleitung **darunter** (`.nebelschicht-sl` in `stile/spieltisch/schichten.css`) – sonst verschwänden die verborgenen Gegner unter dem Schatten, den die Spielleitung gerade selbst gemalt hat. Für die Runde ist das doppelt gemoppelt, denn Figuren im Nebel bekommt sie gar nicht erst; es schadet aber auch nicht.

## Wann neu gerechnet wird

Die Sicht hängt an vielem. Neu gerechnet und verschickt – je Person – wird, wenn sich etwas davon ändert:

| Anlass | Weg | was hinausgeht |
|---|---|---|
| Szene auflegen, Vorhang auf oder zu | `aktivieren`, `auflegen`, `vorhang` | die ganze Szene |
| Figur ziehen, anlegen, ändern (Licht!), verbergen | `figuren` | die Szene an die Runde, die eine Figur an die Spielleitung |
| Figur entfernen | `DELETE figuren/:id` | die Szene |
| Nebelstrich | `nebel` | der Strich, und neue Figurenlisten, wo sich etwas ändert |
| alles auf-/zudecken | `nebel/alles` | die Szene |
| Einstellungen der Szene (dunkel, Sichtweite, Maßstab, Raster) | `PUT /api/scenes/:id` | die Szene |
| Sinne auf einem Blatt | `PUT /api/characters/:id` | die Szene |
| NSC-Sicht wählen | `nsc-sicht` | die Szene an die Spielleitung |

Gerechnet wird beim Loslassen einer Figur, nicht während des Ziehens – deshalb kostet es nichts, eine Figur quer über die Karte zu schleifen.

## Was geprüft wird

Die Sicht ist der Teil des Almanachs, in dem ein Fehler am meisten verrät. Der Vertrag prüft sie in drei eigenen Kapiteln:

- **10 Sicht** – helle und dunkle Szene, Dunkelsicht, dass eine Figur im Dunkeln nicht nur unsichtbar gezeichnet wird, sondern in der Antwort fehlt, fremdes Licht (es verrät, wer es trägt, verlängert aber nicht den eigenen Blick), die eigene Fackel (sie verlängert ihn), geschlossener Nebel, die Spielleitung ohne Grenze, die NSC-Sicht;
- **12 Sichtweite** – was weiter weg steht, als der Blick reicht, fehlt in der Antwort; die Sichtweite der Szene;
- **13 Maßstab** – ein Meter je Feld, 200 × 200 Felder im Nebel, die Bitkarte statt der Feldliste, die ganze Szene unter 20 KB;

dazu **11 Vorhang** (nichts hinter dem Vorhang, auch kein Pinselstrich) und **08 Spieltisch** (wer was ziehen darf, wer Nebel malen darf, Karten und Szenen).
