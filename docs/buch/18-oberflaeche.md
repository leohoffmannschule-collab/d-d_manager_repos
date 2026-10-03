# Die Oberfläche

Die Oberfläche ist eine React-Anwendung in `frontend/src/`, rund siebzehntausend Zeilen in knapp zweihundert Dateien. Gebaut wird sie mit Vite zu einer Handvoll statischer Dateien, die der Server ausliefert. Dieses Kapitel beschreibt, wie sie aufgebaut ist: vom Start über die Tore, die Datenschicht und die Seiten bis zum Spieltisch, zum Aussehen und zum Verhalten als App auf dem Telefon.

## Werkzeuge

| Werkzeug | Wofür |
|---|---|
| **React 19** | Bauteile, Zustand, Haken |
| **React Router 7** | welche Adresse welche Seite zeigt, ohne die Seite neu zu laden |
| **Vite 8** | Entwicklungsserver mit sofortigem Nachladen; der Bau |
| **Tailwind CSS 4** | Hilfsklassen für Abstand, Anordnung, Größe; die Farbnamen aus `@theme` |
| **vite-plugin-pwa** | Manifest und Service Worker: installierbar, mit Zwischenspeicher |
| **@fontsource/…** | die drei Schriften, als Pakete mitgebaut – ohne Internet |
| **oxlint** | Prüfung auf Fehler, samt unbekannter Namen (`no-undef`) |

Zur Laufzeit sind es React, React Router und die Schriften. Alles andere verschwindet beim Bau.

**Gebaut** wird mit `npm run build` im Wurzelverzeichnis: Vite baut nach `frontend/dist`, und `scripts/copy-frontend.mjs` räumt `backend/public` leer und kopiert den Bau hinein. (Das Leerräumen ist nötig, weil Vite jede Datei mit einem Prüfwert im Namen versieht – ohne es sammelten sich dort die Dateien aller früheren Stände.) Im Docker-Abbild übernimmt der Bau in der ersten Stufe dasselbe.

**Entwickelt** wird mit `npm run dev`: Der Server läuft mit `node --watch` auf Port 3001, Vite auf Port 5173, und Vite reicht alles unter `/api` an den Server durch. So laufen beide getrennt und trotzdem unter einer Adresse, und das Anmelde-Cookie funktioniert wie im Betrieb.

## Der Start

```
index.html
 ├─ <script src="/aussehen.js">      setzt data-theme, bevor irgendetwas gezeichnet wird
 └─ <script type="module" src="/src/main.jsx">
       StrictMode                     beim Entwickeln: manches absichtlich doppelt
       └─ BrowserRouter               die Adresszeile als Zustand
          └─ AuthProvider             wer ist angemeldet? (lib/auth.jsx)
             └─ App                   die Tore und die Seiten (App.jsx)
```

**`public/aussehen.js`** läuft vor React, als gewöhnliches Skript im Kopf der Seite. Es liest das gemerkte Erscheinungsbild und setzt es als `data-theme` an `<html>`. Ohne das begänne jeder Start im Kerzenlicht mit einem hellen Aufblitzen: Die Seite erschiene in der Grundfarbe, React lüde, und erst dann würde es dunkel. Auf einem Pi dauert das lange genug, um zu stören.

### Die drei Tore

`App.jsx` lässt niemanden an eine Seite, bevor drei Dinge feststehen:

1. **Angemeldet?** Solange der Server noch nicht geantwortet hat, steht „Der Almanach wird aufgeschlagen …“; ohne Anmeldung die Anmeldeseite (`pages/Login.jsx`), die bei einem frischen Almanach zur Einrichtung wird. Kam sie über `http://` im Heimnetz, obwohl der Almanach einen verschlüsselten Eingang hat, weist `components/HttpsHinweis.jsx` darauf hin (den Port nennt das Lebenszeichen `/api/health`).
2. **Kampagne gewählt?** Sonst die Kampagnenauswahl (`pages/Kampagnenwahl.jsx`). Wer nur in einer Kampagne steht, kommt hier nie vorbei – die Sitzung wählt sie bei der Anmeldung selbst.
3. **Live-Draht.** Erst jetzt öffnet der `LiveProvider` den Kanal – er hängt an genau einer Kampagne.

Das Kampagnentor trägt einen Trick: `<div key={activeId}>`. Ändert sich der `key` eines Elements, wirft React alles darunter weg und baut es neu, statt es weiterzuverwenden. Genau das soll beim Wechsel der Kampagne geschehen – sonst bliebe der Live-Draht an der alten Kampagne hängen und der neue Tisch bekäme die Ereignisse des alten.

### Die Seiten

| Adresse | Seite | für |
|---|---|---|
| `/` | `Dashboard.jsx` – die Übersicht der Blätter; dort auch „Blätter einlesen“, eine oder mehrere Dateien (`components/BlattEinlesen.jsx`, mit Vorschau und Sammelvorschau in `components/einlesen/`), und für die Spielleitung „Zum NSC“ / „In die Runde“ an jeder Karte | alle |
| `/neu` | `NewCharacter.jsx` – ein Blatt anlegen | alle |
| `/charaktere/:id` | `CharacterSheet.jsx` – das Blatt; im Kopf „Mitnehmen“ und „Einlesen“ | alle |
| `/tisch` | `Tabletop.jsx` – der Spieltisch | alle |
| `/kompendium` | `Compendium.jsx` – Nachschlagen | alle |
| `/chronik` | `Chronicle.jsx` – die Chronik | alle |
| `/spielleitung` | `DmBoard.jsx` – hinter dem Schirm | Spielleitung |
| `/hilfe` | `Help.jsx` – die Hilfe | alle |
| alles andere | `NotFound.jsx` | alle |

`/spielleitung` steht hinter `NurSpielleitung`, das Spielende zur Übersicht umleitet. Das ist Höflichkeit, kein Schutz: Die Daten dahinter schützt der Server.

Große Seiten haben ihre Teile in einem Ordner gleichen Sinns neben sich: `pages/blatt/` (Kopf, Speicherstand, Reiter, der Haken `useBlatt`), `pages/tisch/` (Seitenleiste, Handzettel, leerer Tisch, `useNebelpinsel`), `pages/chronik/` (Sitzungsliste, Kapitel, Einträge), `pages/hilfe/` (die Abschnitte der Hilfe).

## Der Rahmen

`components/Layout.jsx` ist der Rahmen um jede Seite hinter den Toren: die Kopfleiste oben, die Seite darunter (`<Outlet />`), und drei Dinge, die überall schweben:

- **Würfelbeutel** (`DiceRoller.jsx`) und **Chat** (`Chat.jsx`), unten rechts;
- die **Klangleiste** (`klang/Klangleiste.jsx`), unten links;
- die **Wurfmeldung** (`Wurfmeldung.jsx`), die den jüngsten Wurf viereinhalb Sekunden lang zeigt und eine natürliche 20 oder 1 eigens feiert;
- die **Störungsanzeige** (`Stoerung.jsx`), das Sicherheitsnetz für Knöpfe, die ihren Fehler nicht selbst anzeigen.

Dass Würfelbeutel und Chat im Rahmen hängen und nicht auf einer Seite, ist der Grund, warum ein Wurf nicht verlorengeht, wenn jemand mitten im Kampf auf sein Blatt wechselt.

Die Kopfleiste nimmt ihre Einträge aus `rahmen/navigation.js` – als Liste, in der der Schirm nur für die Spielleitung steht. Rechts: das Umschalten des Erscheinungsbildes, der Kampagnenschalter (`rahmen/KampagneSchalter.jsx`), der Punkt des Live-Drahts (`rahmen/Verbindung.jsx`) und das Konto-Menü (`rahmen/Konto.jsx`: Farbe, Kennwort, Hilfe, Abmelden). Auf schmalen Schirmen wandert die Navigation in eine Leiste am unteren Rand.

### Die Störungsanzeige

Viele Handgriffe am Tisch sind ein einzelner Aufruf ohne eigenes Fehlerfeld: „Weiter“, „Figur entfernen“, „Runde holen“. Weist der Server so einen Aufruf ab, landete die Absage früher nur in der Konsole; am Tisch sah es aus, als hätte der Knopf nicht funktioniert. `Stoerung.jsx` fängt jede Absage des Servers, die niemand behandelt hat (erkennbar am `status`, den die Datenschicht anheftet), und zeigt ihren Satz. Ein Programmierfehler in der Oberfläche bleibt dagegen in der Konsole – mit ihm kann am Tisch niemand etwas anfangen.

## Die Datenschicht

Drei Stockwerke, jedes mit einer Aufgabe:

```
  lib/daten/  (lib/daten.js)    Haken: laden, horchen, vorgreifen – fertige Daten für die Seiten
      │               │
  lib/api/        lib/live.jsx
  (lib/api.js)    der Live-Draht
  die Wege
```

**Kein Bauteil ruft `fetch` selbst auf, und keines öffnet einen Kanal.** Wer die Oberfläche neu gestaltet, wirft Seiten und Bauteile weg und behält diese Schicht.

### `lib/api/`

Jede Funktion ist ein Weg des Servers, eins zu eins, nach Sachgebieten:

| Datei | Wege |
|---|---|
| `api/anfrage.js` | der Unterbau: `request`, `post`, `put`, `patch`, `del` |
| `api/konten.js` | `authApi`, `campaignsApi` |
| `api/blatt.js` | `charactersApi`, `compendiumApi`, `diceApi` |
| `api/kampf.js` | `encounterApi`, `encountersApi`, `libraryApi`, `stashApi` |
| `api/chronik.js` | `chronicleApi`, `notesApi`, `chatApi` |
| `api/tisch.js` | `scenesApi`, `mediaApi`, `mapsApi`, `ambienceApi` |

Eingeführt wird immer aus `lib/api.js`, dem Inhaltsverzeichnis – ein Bauteil soll nicht wissen müssen, in welcher Datei ein Weg steht.

`request()` in `api/anfrage.js` tut vier Dinge, und jedes ist wichtig:

1. **`credentials: 'same-origin'`** – nur damit schickt der Browser das Anmelde-Cookie mit. Ohne käme von jedem Weg ein 401, obwohl man angemeldet ist.
2. **`X-Fenster`** – die Fensterkennung aus dem Live-Kanal, damit der Server das eigene Echo auslässt.
3. **Status prüfen.** `fetch` wirft nur, wenn gar keine Antwort kommt; ein 404 gilt ihm als zugestellt. `request()` verwandelt jede Absage in einen Fehler mit `status`, `code` und dem Satz des Servers als `message`.
4. **204 heißt leer.** „Hat geklappt, nichts zurückzugeben“ – `res.json()` würde am leeren Rumpf scheitern.

### `lib/daten/`

Die Haken, nach derselben Regel geordnet wie der ganze Almanach – was der Runde gehört, getrennt von dem, was einer Kampagne gehört:

| Datei | Haken |
|---|---|
| `grundlage.js` | `useDaten` – das Fundament aller anderen |
| `kampagne.js` | `useCharaktere`, `useBeute`, `useNotizen`, `useSitzungen`, `useSitzung` |
| `kampf.js` | `useKampf`, `useBestiarium`, `useBegegnungen` |
| `spieltisch.js` | `useSzene`, `useSzenenListe`, `usePings`, `useKarten` |
| `gespraech.js` | `useWuerfe`, `useChat` |
| `runde.js` | `useKonten`, `useEinladungen`, `useKlangbibliothek`, `useKlang` |

Drei Muster kehren in allen wieder:

1. **Laden** über `useDaten(holen, anfang)`: einmal, sobald der Live-Draht steht, und nach jedem neuen Verbinden (die *Generation*, Kapitel „Der Live-Kanal“). `holen` muss mit `useCallback` festgehalten sein – eine bei jedem Rendern neue Funktion löste eine Endlosschleife aus Laden und Neuzeichnen aus. Überholen sich zwei Ladevorgänge, gewinnt der zuletzt *gestellte*, nicht der zuletzt *angekommene*.
2. **Horchen** über `useLive`: Das Ereignis bringt entweder den neuen Stand mit (`kampf`, `beute`, `szene`) und wird direkt gesetzt, oder es ist ein Wink (`notizen:aktualisiert`) und löst `laden()` aus.
3. **Vorgreifen** bei Figuren, Nebel, Würfen und Chat: Die Änderung erscheint sofort örtlich, und das Echo über den Kanal wird erkannt (an der Kennung) oder gar nicht erst geschickt. Ohne das ruckelte jede gezogene Figur um die Laufzeit der Anfrage hinterher.

Haken, deren Daten nur die Spielleitung bekommt (`useKarten`, `useKlangbibliothek`, `useKonten`), laden in einem Spielerfenster gar nicht erst – sonst sammelte jedes Spielerfenster beim Start ein 403 ein.

### Anmeldung und Kampagne

`lib/auth.jsx` und `lib/campaign.jsx` sind zwei *Contexts*: ein Anbieter weit oben, `useAuth()` und `useCampaign()` überall darunter. Gemerkt wird dort nur eine **Abschrift** dessen, was der Server weiß. Das Anmeldekennzeichen liegt in einem `HttpOnly`-Cookie, an das JavaScript nicht herankommt; wer diesen Zustand fälscht, gewinnt nichts. Jeder Wechsel der Kampagne geht zum Server (`switchTo`), denn die aktive Kampagne hängt an der Sitzung dort, nicht hier.

## Die Bauteile

`components/` ist nach Bereichen geordnet:

| Ordner | Inhalt |
|---|---|
| `components/` | der Rahmen, Würfelbeutel, Chat, Kampfliste (`Initiative.jsx`), Beutekiste (`Beute.jsx`), wiederkehrende Zeilen (`RepeatingRows.jsx`), „Kopieren nach …“ (`Kopierziel.jsx`), Kompendiumseintrag, Symbole |
| `components/ui.jsx` | die kleinen Bausteine: `Rubric`, `Card`, `TextField`, `TextAreaField`, `NumberField`, `SelectField`, `WeiteField`, `Stepper`, `Toggle`, `FieldLabel` |
| `components/sheet/` | die Reiter des Blattes; `kampf/` und `zauber/` für die Karten der großen Reiter |
| `components/tabletop/` | der Spieltisch: `Board.jsx`, die Haken `useZeiger`, `useAnsicht`, `usePinselabdruck`; `brett/` (was auf der Karte liegt), `leiste/` (die Werkzeugleiste) |
| `components/dm/` | hinter dem Schirm: Bestiarium, Begegnungen, Karten, Klang, Notizen, Runde – mit ihren Teilen in `bestiarium/`, `begegnungen/`, `karten/`, `runde/` |
| `components/initiative/` | eine Zeile der Kampfliste, Lebensbalken, Wunden, Zustandswahl, Kämpfer von Hand |
| `components/beute/` | Münzen, Fundstücke, Teilen |
| `components/klang/` | Klangleiste, der eingebettete Spieler, die Rechnung der Stelle im Stück |
| `components/rahmen/` | Navigation, Kampagnenschalter, Konto, Kennwortwechsel, der Verbindungspunkt |
| `components/icons/` | die Symbole als kleine SVG-Bauteile, nach Themen |

Die Bausteine in `ui.jsx` arbeiten alle **gesteuert**: Sie merken sich nichts selbst, sondern bekommen `value` und melden über `onChange` zurück. Den Zustand hält immer der Aufrufer – der Grund, warum das Blatt alles an einem Ort hat. `WeiteField` rechnet dabei zwischen Fuß und Metern um: Es zeigt in der Einheit des Blattes und meldet in Fuß zurück.

`RepeatingRows` baut aus einer Beschreibung der Spalten eine Liste gleichartiger Zeilen – Angriffe, Ausrüstung, Merkmale. Jede Zeile bekommt beim Anlegen eine eigene Kennung (`newId()`); der Listenindex taugt nicht als `key`, weil beim Löschen der ersten Zeile alle anderen eine Stelle hochrutschten und React die Eingabefelder falsch zuordnete.

## Das Blatt im Browser

`pages/blatt/useBlatt.js` hält das Blatt, speichert es und nimmt Änderungen von außen an. Es ist die heikelste Stelle der Oberfläche, deshalb im Einzelnen:

- **Ändern** geht immer über einen Pfad: `updateData('combat.hp.current', 7)`. `setPath` (`lib/setPath.js`) baut daraus ein *neues* Blatt und lässt das alte unberührt – React erkennt eine Änderung nur an einem neuen Objekt.
- **Speichern** geschieht 600 Millisekunden nach der letzten Änderung. Jede Änderung verwirft den laufenden Zeitgeber und setzt einen neuen; erst wenn 600 ms nichts geschieht, geht *eine* Anfrage hinaus.
- **Gespeichert wird nicht im Rückruf von `setCharacter`.** Der soll rein sein, und React ruft ihn beim Entwickeln absichtlich doppelt auf. Stattdessen merkt sich ein Schalter (`zuSpeichern`), dass die nächste Änderung von hier kam, und ein Effekt speichert, sobald sie gezeichnet ist.
- **Von außen** kommen Trefferpunkte aus dem Kampf (`charakter:aktualisiert`). Solange eigene Änderungen ungesichert sind (`offeneAenderung`), wird nichts von außen übernommen – sonst überholte die Spielleitung den eigenen Federstrich.
- **Die Sperre freigeben** darf nur die jüngste Speicheranfrage, und nur, wenn nicht schon die nächste wartet (`speicherStand`). Sonst gäbe eine langsame ältere Anfrage bei ihrer Rückkehr den Live-Draht frei, während die nächste Änderung noch ungesichert daliegt.

Beim Laden läuft jedes 5e-Blatt durch `withDefaults()`, das fehlende Felder aus späteren Fassungen ergänzt (Kapitel „Das Blatt: Datenmodell und Ausfuhr“).

## Der Spieltisch im Browser

`components/tabletop/Board.jsx` setzt die Teile übereinander, die zeigen, was auf dem Tisch liegt: Kartenbild, Raster, Nebel, Figuren, Auswahlring, Lineal, Zeigefinger, Pinselvorschau. Was ein Aufsetzen, Ziehen und Loslassen bedeutet, entscheidet `useZeiger.js`; Maßstab und Verschiebung verwaltet `useAnsicht.js`.

**Drei Koordinatensysteme** muss auseinanderhalten, wer hier arbeitet:

1. **Bildschirmpunkte** – was ein Zeigerereignis liefert (`e.clientX`).
2. **Kartenpunkte** – Bildpunkte auf der Karte selbst, unabhängig von Zoom und Verschiebung. `zuSzene()` rechnet um.
3. **Rasterfelder** – „3,7“, die Sprache des Nebels. `feldKoord()` rechnet Kartenpunkte in Felder.

**Gezoomt und geschoben** wird über *eine* CSS-Transformation auf dem Behälter (`scale`, `tx`, `ty`). Alles darin wandert mit; Figuren stehen in Kartenpunkten, und niemand muss beim Zoomen rechnen. Der Zoom reicht bis 400 %; nach unten richtet sich die Grenze nach der Karte – man darf immer so weit heraus, bis das Ganze zu sehen ist. Strichstärken und Schrift des Lineals werden durch den Maßstab geteilt, damit sie bei jedem Zoom gleich aussehen.

**Bedient** wird mit *Pointer Events*: ein Satz Rückrufe für Maus, Finger und Stift. Zwei Finger heißen Kneifen (zoomen). Je nach Werkzeug wird dasselbe Ziehen zur Figurbewegung, zum Nebelstrich, zum Rechteck, zum Messen oder zum Verschieben der Karte. **Alt+Klick** (oder das Werkzeug „Zeigen“) lässt eine Stelle für alle aufleuchten. Lineal und Zeigefinger liegen über dem Nebel (`z-30`): Bei der Runde deckt der Nebel die Figuren (z-index 25), und ein Lineal darunter verschwände genau dort, wo es ins Unerkundete misst.

**Eine Figur ziehen:** `useZeiger` erkennt beim Aufsetzen eine Figur, die dieses Fenster bewegen darf (`canMoveToken` – die Spielleitung jede, die Runde nur Figuren an eigenen Blättern); die Figur folgt dem Finger, liegt dabei oben und leicht durchscheinend; beim Loslassen rastet sie aufs Raster ein, wird örtlich gesetzt und geschickt. Das Ergebnis des Servers wird erst nach dem Loslassen gerechnet – deshalb kostet das Ziehen quer über die Karte nichts.

**Die Werkzeugleisten.** Welche Werkzeuge es gibt, steht in einer Liste (`leiste/werkzeugliste.js`); `fuerAlle` markiert, was auch die Runde bekommt. Die Spielleitung hat die große Leiste (`SceneBar.jsx`, `leiste/Werkzeuge.jsx`): Vorhang, Bewegen, Aufdecken, Verhüllen, Pinselgröße, Messen, Zeigen, alles auf- oder zudecken, Figuren aus dem Kampf, die NSC-Sicht, und die Felder für Raster (`leiste/Rasterfeld.jsx`) und Szenen (`leiste/Szenenlade.jsx`). Die Runde hat, sobald eine Karte aufliegt, die kleine (`Spielerleiste.jsx`): Bewegen, Messen, Zeigen – Werkzeuge, die niemandem etwas wegnehmen –, und darunter, was das gewählte tut (am Telefon gibt es kein Überfahren, das einen Tooltip zeigte). Welches Werkzeug gewählt ist, hält in beiden Fällen `pages/Tabletop.jsx`. Die Seitenleiste (`pages/tisch/Seitenleiste.jsx`) trägt Kampf, Beute und – für die Spielleitung – das Figurenfeld (`TokenPanel.jsx`): Name, Blatt, Größe, Farbe, Bildnis, Lichtquelle, verborgen. Die Auswahl „Blatt“ bindet eine Figur an ein Charakterblatt – danach zieht die Besitzerin sie, und ihre Sinne bestimmen die Sicht. „Verborgen“ gilt bei einer Figur, die an einem Kämpfer hängt, auch für dessen Zeile in der Kampfliste; der Server legt beides gemeinsam um.

## Das Aussehen

### Die Regel

**Wie etwas aussieht, steht im Stilblatt; was es tut, steht in einer Skriptdatei; ein Symbol steht in einer Symbol-Datei.** Das JSX beschreibt, *was* da ist – mit Tailwind-Klassen für Abstand, Anordnung und Größe und mit eigenen Klassen für die wiederkehrenden Bauteile (`panel`, `field-box`, `btn btn-seal`). Eingebettet ist nichts: kein `style`-Attribut, kein `<style>`, kein Skript im Markup.

### Werte, die erst im Browser feststehen

Wo eine Figur steht, wie weit die Karte verschoben ist, welche Farbe sich jemand gewählt hat, wie voll ein Balken ist – das kennt kein Stilblatt im Voraus. Solche Werte gehen als **CSS-Variable** in eine **Laufzeit-Regel**: Jedes Bauteil, das welche hat, bekommt eine eigene Klasse (`lauf-1f`) und dazu eine Regel in einem Stilblatt, das es nur im Browser gibt. Im Markup steht nur der Klassenname:

```jsx
<Laufwert className="farbpunkt h-2 w-2 rounded-full" werte={{ '--farbe': konto.color }} />
```

```css
/* stile/bauteile.css */
.farbpunkt { background-color: var(--farbe, var(--color-faint)); }
```

Im Browser entsteht daraus `<span class="farbpunkt h-2 w-2 rounded-full lauf-1f">` und, im Laufzeit-Stilblatt, `.lauf-1f { --farbe: #2d4f7c; }`.

Zwei Wege, dasselbe zu benutzen:

| Weg | Wofür |
|---|---|
| `<Laufwert als="div" werte={…} className="…">` (`components/Laufwert.jsx`) | jedes Element – auch in Listen, wo kein Haken stehen darf; alle anderen Eigenschaften (Rückrufe, `ref`, `data-…`) gehen unverändert durch |
| `useLaufstil(werte)` (`lib/laufstil.js`) | gibt den Klassennamen zurück – für ein Bauteil, das ihn selbst an ein Element hängt |

Wie es gebaut ist (`lib/laufstil.js`): Das Laufzeit-Stilblatt ist ein eigenes, über das CSSOM gebautes Stilblatt (`new CSSStyleSheet()`, eingehängt in `document.adoptedStyleSheets`); ältere iPads ohne diese Möglichkeit nehmen die leere Datei `public/laufstil.css`, auf die die `index.html` verweist. Beim ersten Zeichnen legt das Bauteil seine Regel an (vor dem Malen, in `useLayoutEffect` – die Figur steht nie einen Augenblick bei 0,0), bei jeder Änderung schreibt es die Werte über `setProperty` hinein, und beim Verschwinden nimmt es die Regel wieder heraus. Beim Ziehen einer Figur – sechzigmal in der Sekunde – wird also *eine* Regel geändert, keine neue angelegt; nach einem ganzen Zug über den Tisch stehen im Stilblatt so viele Regeln wie Bauteile mit Werten, im Probeaufbau achtzehn. Werte gehen nie als zusammengesetzter Text hinein: Eine gespeicherte Farbe, die jemand manipuliert hätte, kann die Regel nicht verlassen.

Das ist auch, was die **Content-Security-Policy** ohne `'unsafe-inline'` möglich macht (Kapitel „Anmeldung, Rollen und Sicherheit“): Sie verbietet eingebettetes CSS im Markup, nicht Regeln, die ein erlaubtes Skript über das CSSOM setzt.

Die Helfer `px()` und `prozent()` aus `lib/stilwerte.js` hängen die Einheit an – eine nackte Zahl in einer CSS-Variable hätte keine. Die Stilprobe (`npm run stilprobe`) passt auf alles auf: kein `style=` im JSX, keine CSS-Werte in SVG-Attributen, kein SVG außerhalb von `components/icons/` (außer im Lineal, das Geometrie zeichnet), nichts Eingebettetes in erzeugtem HTML und in der `index.html`, keine rohen Farbwerte außerhalb der Stilblätter.

### Die Stilblätter

`index.css` ist nur ein Inhaltsverzeichnis. Die Reihenfolge ist die der Kaskade – eine spätere Datei darf eine frühere überschreiben:

| Datei | Inhalt |
|---|---|
| `tailwindcss` | zuerst; alles baut darauf auf |
| `stile/schriften.css` | Cinzel (Überschriften, Knöpfe), EB Garamond (Lesetext), UnifrakturMaguntia (Initialen) – nur lateinische Zeichen und die gebrauchten Schnitte |
| `stile/farben.css` | die Farbnamen, zweimal: Pergament und Kerzenlicht |
| `stile/grundlage.css` | Seite, Pergament aus drei Farbverläufen, Grundschrift |
| `stile/bauteile.css` | Velinblatt, Felder, Knöpfe – in `@layer components`, damit Hilfsklassen sie überschreiben können |
| `stile/spieltisch/farben.css` | die Farben des Tisches – fest, nicht nach Erscheinungsbild |
| `stile/spieltisch/flaeche.css` | die Fläche, die Karte, die Bühne |
| `stile/spieltisch/figuren.css` | Figuren, Namensschild, Lebensbalken, Auswahlring |
| `stile/spieltisch/schichten.css` | Nebel, Vorschau, Lineal, Zeigefinger – ihre Stapelung |
| `stile/eigenheiten.css` | Kleinkram des Browsers: keine Pfeile an Zahlenfeldern, Bildlaufleisten |

### Zwei Erscheinungsbilder

`stile/farben.css` definiert jede Farbe zweimal unter demselben Namen – einmal unter `html[data-theme="pergament"]`, einmal unter `html[data-theme="kerzenlicht"]`. Tailwind 4 macht aus `--color-ink` von selbst `text-ink`, `bg-ink`, `border-ink`. Überall im Almanach steht deshalb ein Name, nie ein Farbwert, und zum Umschalten genügt *ein* Attribut: `useTheme()` setzt `data-theme` an `<html>`, und jede Farbe wechselt mit, ohne dass irgendwo eine Bedingung stünde. Gemerkt wird die Wahl je Gerät im `localStorage` – wer auf dem Tablet Kerzenlicht will und am Rechner Pergament, bekommt beides.

Wer eine Farbe hinzufügt, fügt sie in **beide** Sätze ein, sonst fehlt sie im Kerzenlicht.

Der Spieltisch folgt dem Erscheinungsbild nicht. Wie eine echte Tischplatte unter beliebigem Deckenlicht bleibt die Fläche gleich dunkel; ihre Farben stehen einmal fest in `stile/spieltisch/farben.css`.

### Für den Finger gebaut

Der Almanach wird am Tisch auf Tablets und Telefonen bedient. Felder und Knöpfe sind deshalb mindestens 44 bis 48 Bildpunkte hoch – das Maß, das sich mit dem Finger sicher treffen lässt. Auf schmalen Schirmen rückt alles untereinander (Tailwinds Stufen `sm`, `md`, `lg`), die Navigation wandert nach unten, und am Spieltisch liegen Kampf und Runde hinter einem Knopf, damit die Karte den Platz bekommt.

## Worte

`lib/beschriftung.js` ist der eine Ort, an dem Schlüssel des Servers zu Worten werden: Wundenstufen (`schwer_verwundet` → „schwer verwundet“), Arten von Chronikeinträgen, Rollen, eigene Sätze für einige Fehlerschlüssel (`FEHLER`) und die Feldnamen des Kompendiums (`casting_time` → „Wirkzeit“). Wer den Almanach übersetzt oder in eine andere Oberfläche überführt, tauscht diese Datei aus und muss im Server keine Zeile anfassen.

Die Texte aus dem Kompendium selbst bleiben, wie sie kommen – englisch aus der offenen Schnittstelle. Übersetzt werden nur die Beschriftungen drumherum.

## Als App auf dem Gerät

Der Almanach ist eine **Progressive Web App**: Auf Telefon und Tablet lässt er sich über „Zum Home-Bildschirm“ wie eine App ablegen – mit eigenem Symbol, ohne Adresszeile. Das Manifest und den Service Worker erzeugt `vite-plugin-pwa` beim Bau (`frontend/vite.config.js`).

Der Service Worker hält die gebaute Oberfläche (Skripte, Stilblätter, Schriften, Symbole) auf dem Gerät vor und aktualisiert sie selbst, sobald eine neue Fassung ausgeliefert wird (`registerType: 'autoUpdate'`) – beim nächsten Laden ist sie da. Für Anfragen an den Server gilt je Art eine eigene Regel:

| Anfragen | Regel | Warum |
|---|---|---|
| `/api/compendium/…` | *CacheFirst*, 30 Tage, höchstens 500 | Regeltexte ändern sich nicht; einmal geholt, kommen sie vom Gerät, auch ohne Netz |
| `/api/characters…` | *NetworkFirst*, 3 Sekunden | immer der frische Stand – aber nach drei Sekunden ohne Antwort lieber der letzte bekannte als gar keiner |
| `/api/media/…` | *CacheFirst*, 60 Tage, höchstens 200 | eine Kennung, ein Bild, für immer |
| alles andere unter `/api/` | nie zwischengespeichert | Kampf, Nebel und Würfe veraltet anzuzeigen wäre schlimmer, als sie gar nicht zu zeigen |

Ohne Verbindung zum Server öffnet die App also, zeigt Blätter im letzten bekannten Stand und schlägt Regeltexte nach, die schon einmal geladen waren. Spielen lässt sich ohne Server nicht – das ist auch nicht gemeint. Für den Fall ohne Server gibt es das mitgenommene Blatt.

## Worauf man beim Arbeiten achtet

- **Neue Daten vom Server** gehören in einen Haken unter `lib/daten/` und einen Weg unter `lib/api/` – nie `fetch` in einem Bauteil.
- **Neue Felder am Blatt** gehören in `defaultCharacterData()` *und* `withDefaults()` (Kapitel „Das Charakterblatt Feld für Feld“).
- **Neues Aussehen** gehört ins Stilblatt; Werte aus dem Browser gehen als CSS-Variable über `<Laufwert>` oder `useLaufstil`, nie über ein `style`-Attribut. Symbole gehören nach `components/icons/`.
- **Neue Worte für Schlüssel des Servers** gehören nach `lib/beschriftung.js`.
- **Die Hilfe** (`pages/Help.jsx`, `pages/hilfe/`) ändert mit, wer ein Werkzeug ändert. Eine Hilfe, die etwas anderes behauptet als die Oberfläche, ist schlimmer als gar keine.
- **Prüfen**: `npm run lint` (oxlint, auch unbekannte Namen), `npm run einfuhrprobe` (benutzt jemand einen Namen, den er nicht eingeführt hat?), `npm run stilprobe`, `npm run kommentarprobe` und `npm run build` – der Bau ist die letzte Prüfung, ob alles zusammenpasst.
