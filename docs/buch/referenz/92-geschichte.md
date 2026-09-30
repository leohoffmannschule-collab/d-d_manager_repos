# Wie der Almanach entstand

> Dieses Kapitel schreibt `npm run handbuch` aus dem Code (scripts/handbuch/referenz/).
> Änderungen gehören in den Code und seine Kommentare, nicht hierher.

Der Almanach ist in kleinen Schritten gewachsen, und jeder Schritt hat eine Nachricht hinterlassen. Hier stehen sie alle bis zum Bau dieses Buches, ältester zuerst, nach Tagen geordnet – mit der Kurzkennung des Commits, unter der man die Änderung selbst nachsehen kann (`git show <kennung>`).

Die Nachrichten sind so abgedruckt, wie sie geschrieben wurden. Die ersten, vom 1. September, sind englisch; ab dem 3. September wurde der Almanach deutsch, im Code wie in seiner Geschichte.

Insgesamt 94 Schritte an 13 Tagen.

## 1. September 2026

### Initial commit

`b3953ea`

### Add self-hosted D&D/Pen & Paper character manager

`8756175`

React + Vite PWA frontend and Node/Express + SQLite backend, built to run as a single Docker container on a Raspberry Pi and be used from iPad/iPhone over the local network.

- Full D&D 5e character sheet (abilities, saves, skills, combat, HP, death saves, attacks, inventory, currency, spellcasting, features, background)
- Generic freeform sheet for other Pen & Paper systems
- Compendium browser backed by the dnd5eapi.co SRD API, proxied and cached in SQLite so it stays fast and degrades gracefully when offline
- Dice roller, autosave, installable PWA with app icons and manifest
- Dockerfile + docker-compose for arm64, plus a manual/non-Docker setup path

### Run on Windows via VS Code, restyle as an illuminated manuscript

`1eb1493`

Local development on Windows no longer needs a C++ toolchain, and the app gets a medieval design drafted on a Claude Design canvas.

- Windows / VS Code:
- Replace better-sqlite3 with Node's built-in node:sqlite (no native build); better-sqlite3 stays as an optional fallback for Node < 22.5
- Add root package.json with cross-platform scripts (setup, dev, build, start) using concurrently, plus a Node copy script instead of cp
- Add .vscode launch/tasks/extensions config: F5 starts server and UI
- Server prints its LAN address on startup so iPads know where to connect
- Drop the compiler layer from the Dockerfile; skip optional deps
- .gitattributes pins LF endings across platforms

- Design (canvas in design/):
- Parchment ground with vellum panels, iron-gall ink, rubric-red headings, gold fleurons; abilities as heraldic shields, ruled-line inputs
- Cinzel / EB Garamond / UnifrakturMaguntia bundled via @fontsource so the app looks right without internet
- Second "Kerzenlicht" theme for dark rooms, toggled in the header and remembered per device; all colors are CSS variables in index.css
- Replace every emoji with drawn SVG icons
- New app icons and PWA manifest colors

- Fixes:
- Character list showed no class/level: the summary read a field that does not exist in the sheet data; build it from className and level
- Sheet header collapsed the name on narrow screens; the HP badge and delete action now wrap to their own row

### Fix two bugs that only appear away from localhost

`0e8ff30`

Both were invisible in earlier testing: one needs a non-secure origin, the other needs the upstream API to be reachable.

crypto.randomUUID is only available in a secure context (HTTPS or localhost). Opened from an iPad over http://<lan-ip>, it is undefined, so every id-generating action threw "crypto.randomUUID is not a function": rolling dice, adding equipment, attacks, spells, features, and creating a freeform character. Add newId(), which prefers randomUUID, falls back to building a v4 UUID from crypto.getRandomValues (available on insecure origins), and finally to a timestamp-based id.

The compendium proxy read its sub-path from req.params[0], which a RegExp route without a capture group never fills. Every request therefore fetched the API root and, worse, cached it under one shared key, so all categories and detail pages would have shown the same index. Read the path from req.url instead (keeping query strings) and reject ".." segments.

Also fall back to a JSON deep clone where structuredClone is missing (iPadOS older than 15.4).

Verified over the LAN address with a browser: dice, equipment, attacks, freeform sections and autosave all work, no page errors; and against a mock upstream that the proxy now forwards /classes, /spells/fireball, /classes/wizard/levels and query strings, each cached under its own key.

## 3. September 2026

### Aus dem Charaktermanager eine ganze Spielrunde machen

`cf81108`

Der Almanach war bisher ein Charaktermanager für ein Gerät ohne Konten. Daraus wird jetzt eine gemeinsame Runde, die alle drei Teile unter einer Anmeldung, einer Datenbank und einem Live-Kanal zusammenbringt: Charakterblätter, virtueller Spieltisch und das Board der Spielleitung (bisher ein eigenes Projekt, dnd-dm-board-digi).

- Konten und Rollen
- Passwörter über scrypt aus node:crypto, Anmeldung in einem HttpOnly-Cookie, in der Datenbank liegt davon nur der Hash.
- Das erste Konto führt die Spielleitung, alle weiteren treten mit einem Einladungscode bei. Ohne Code kommt niemand hinein – der Almanach hängt über den Tunnel am offenen Netz.
- Bremse gegen das Durchprobieren von Passwörtern.
- Charaktere haben einen Besitzer: eigene Blätter bearbeiten, fremde lesen.

- Live-Übertragung
- Server-Sent Events statt WebSockets: gewöhnliches HTTP, das ohne Sonderbehandlung durch den Cloudflare-Tunnel geht, keine zusätzliche Bibliothek braucht und nach einem Funkloch von allein wieder aufgebaut wird.
- Rollengefiltert: Verborgene Kämpfer und Figuren fehlen in der Fassung für die Runde vollständig, von Monstern gibt es statt der Trefferpunkte nur einen Zustand. Verdeckte Würfe erreichen nur die Spielleitung.

- Spieltisch
- Szenen mit hochgeladener Karte, einstellbarem Raster, Figuren zum Ziehen (die aufs Raster einschnappen), Lineal und Zeigefinger für alle.
- Nebel des Krieges als Rasterfeld je Bildpunkt auf einer kleinen Leinwand, die der Browser hochskaliert; übers Netz wandern nur geänderte Felder. Für die Runde deckt er auch die Figuren zu, die darin lauern.
- Spieler bewegen die Figur ihres eigenen Charakters, sonst niemand.

- Spielleitung
- Initiative-Tracker, Bestiarium und Notizen aus dnd-dm-board-digi übernommen, von einer JSON-Datei nach SQLite und live-synchron.
- Trefferpunkte wandern zwischen Kampfliste und Charakterblatt in beide Richtungen; Notizen lassen sich als Handzettel an die Runde austeilen.

- Auf dem Pi
- docker-compose bringt cloudflared unter einem Profil mit, sodass die Runde ohne Portfreigabe im Router von zu Hause aus mitspielen kann.

Alles ohne eine einzige neue Abhängigkeit: express und cors wie zuvor.

### Figurenschmiede, Begegnungen, Chronik – und die Regeln vervollständigt

`d5ac2d7`

- Behobene Fehler
- Die Rüstungsklasse wurde als combat.ac gelesen, das Blatt führt sie aber als combat.armorClass: Alle Helden standen mit RK 10 im Kampf und in der Übersicht.
- Der eigene Wurf stand doppelt im Würfelbeutel – einmal über den Live-Kanal, einmal durch das Nachladen.
- Beim Wechsel von einem Bestiarium-Eintrag zum nächsten blieb das Formular auf den Werten des vorigen stehen.
- „Alles aufdecken“ ließ bei verschobenem Raster am linken und oberen Rand einen Streifen im Nebel stehen.
- Die Fehlerbehandlung stand vor der Auslieferung der Oberfläche und hätte deren Fehler nie zu sehen bekommen.

- Vollständige Spielführung
- Zustände, Erschöpfung in sechs Stufen, Konzentration, Inspiration, Resistenzen und Sinne, eingestimmte Gegenstände und frei benannte Klassenressourcen (Wut, Ki, bardische Inspiration …).
- Trefferwürfel als Vorrat, kurze und lange Rast, die auffüllen, was sich erneuert; Erfahrung verrät die zustehende Stufe.
- Jeder Wert auf dem Blatt ist ein Würfelknopf: Fertigkeiten, Rettungswürfe, Attribute, Angriffe und Schaden gehen über den Server und stehen damit sofort bei allen. Eine kurze Meldung zeigt den jüngsten Wurf.
- Blätter aus früheren Fassungen werden beim Öffnen um die neuen Felder ergänzt, ohne dass etwas gewandert werden muss.

- Figurenschmiede
- Miniaturen entstehen aus Kugeln, Kästen und Kegeln statt aus geladenen Modellen: nichts muss auf den Pi, jede Figur steht sofort da. Volk, Statur, Rüstung, Waffe, Haar, Bart, Helm, Umhang, Schild und Farben lassen sich einstellen, die Figur dreht sich am Finger.
- Beim Gießen entstehen Bildnis und Spielfigur als PNG mit durchsichtigem Grund. Die Figur wandert über Kampf und Kämpferliste bis auf den Spieltisch; auch Gegner im Bestiarium bekommen eine.
- three.js lädt erst beim Aufschlagen der Schmiede und liegt in einem eigenen Brocken.

- Begegnungen
- Gruppen einmal zusammenstellen und an jedem Abend mit einem Klick stellen, samt gewürfelter Initiative und wahlweise verborgen. Ein improvisierter Kampf lässt sich für das nächste Mal sichern; gleichnamige Gegner werden dabei wieder zu einer Gruppe gefasst.

- Chronik
- Der Server schreibt mit, was ohnehin durch ihn läuft: Würfe, Schaden und Heilung, wer zu Boden geht, Zustände, Kampfrunden, Auftritte, Szenenwechsel und ausgeteilte Handzettel. Daraus entsteht ein nach Stationen und Kämpfen gegliedertes Protokoll, das sich als Markdown sichern lässt.
- Verdecktes bleibt verdeckt: Verborgene Gegner und verdeckte Würfe fehlen in der Fassung für die Runde vollständig.
- Es wird nichts mitgehört und nichts aufgenommen – kein Mikrofon, keine Spracherkennung. Wer zusätzlich einen erzählenden Rückblick möchte, kann über CHRONIK_KI_URL ein Sprachmodell anschließen; ohne diese Einstellung fehlt nichts.

### Das Charakterblatt zum Mitnehmen

`02133f9`

Wer sich auf eine Runde vorbereiten will, während der Pi aus ist, sichert sein Blatt jetzt mit einem Knopf als einzelne HTML-Datei: mit Bildnis und gegossener Figur, ohne einen einzigen Verweis nach draußen. Ein Doppelklick genügt – auf jedem Rechner, Tablet oder Telefon, ohne Server, ohne Netz, ohne App. Gedruckt sieht die Datei aus wie ein Charakterbogen.

Enthalten ist alles, was auf dem Blatt steht: Attribute, Rettungswürfe, Fertigkeiten samt Übung und Expertise, Kampfwerte, Zustände, Erschöpfung, Konzentration, Widerstände und Sinne, Ressourcen, eingestimmte Gegenstände, Angriffe, Zauberplätze und Zauberliste, Beutel und Tragkraft, Merkmale und Hintergrund. Blätter für andere Systeme werden mit ihren freien Abschnitten genauso abgeschrieben.

Am Ende der Datei reist der vollständige Datensatz mit – sie ist damit zugleich eine Sicherung, aus der sich ein verlorenes Blatt wiederherstellen lässt.

- Nebenbei zwei Fallstricke entschärft, die erst beim Prüfen auffielen:
- Die Adresse des erzeugten Blobs wurde sofort nach dem Klick wieder eingezogen. Der Browser liest den Inhalt aber erst danach, und auf einem langsamen Gerät kann die Sicherung dabei mittendrin abbrechen.
- Umlaute im Namen kosteten den Dateinamen: Aus „Kapitän Sturmhand“ wurde eine Datei namens „download“. Umlaute werden jetzt umschrieben.

## 4. September 2026

### Die untere Leiste auf dem Telefon entlasten

`9e67e44`

Mit der Chronik standen unten fünf Menüpunkte nebeneinander. Auf einem Telefon blieben davon 72 bis 84 Pixel je Punkt – die Beschriftungen stießen von Rand zu Rand aneinander und lasen sich als eine einzige Zeile.

Die Chronik liest man hinterher und nicht während des Spiels. Sie steht deshalb weiterhin oben in der Leiste und zusätzlich im Kontomenü, aber nicht mehr im Daumenbereich. Unten bleiben vier Punkte für die Spielleitung und drei für die Runde, mit je 98 Pixeln und Luft dazwischen. Zu lange Beschriftungen werden zur Sicherheit gekürzt statt überzulaufen.

Geprüft bei 390 Pixeln Breite: kein waagerechtes Scrollen auf Spieltisch, Chronik, Board, Charakterblatt und Figurenschmiede; Fingerziele 61 Pixel hoch.

### Vier Handgriffe, die am Spieltisch bisher gefehlt haben

`cee8f0e`

Zauber im Blatt nachschlagen Ein Tipp auf den Namen klappt den vollen Text aus dem Kompendium auf: Reichweite, Komponenten, Wirkungsdauer, Beschreibung und höhere Grade. Bisher musste man mitten im eigenen Zug ins Kompendium wechseln und dort suchen. Die Texte reisen außerdem im mitgenommenen Blatt mit – erst damit taugt der Ausdruck wirklich zur Vorbereitung.

Initiative würfelt jede und jeder selbst Zu Beginn eines Kampfes stand die Spielleitung da und tippte fünf Zahlen ab. Jetzt liegt am Spieltisch ein Knopf, der den eigenen Wurf einträgt – mit dem eigenen Bonus, für alle sichtbar. Fremde Zeilen bleiben unantastbar.

Todesrettung und Konzentration Der Rettungswurf gegen den Tod trägt sich selbst ein: Eine 20 richtet mit einem Trefferpunkt wieder auf, eine 1 zählt doppelt. Bei laufender Konzentration genügt der erlittene Schaden – der Schwierigkeitsgrad ergibt sich daraus, und bei einem Fehlschlag erlischt die Konzentration von selbst.

Beutekiste der Runde Münzen und Gefundenes liegen in einer gemeinsamen Kiste, die alle sehen und füllen dürfen; wer was trägt, steht dabei. Das Teilen rechnet der Almanach aus und wechselt Münzen dabei nur nach unten: Aus 43 Gold werden 14 Gold je Kopf und nicht „1 Platin, 4 Gold“ – niemand bekommt eine Münze ausgezahlt, welche die Runde nie besessen hat. Elektrum wird angenommen, aber nie ausgegeben. Die Spielleitung kann die Anteile in die Beutel schreiben lassen.

- Dabei drei Fehler gefunden und behoben
- Die Seitenleiste des Spieltischs hing an der Karte: Ohne aufgelegte Szene gab es weder Kampfliste noch Beute noch Handzettel. Mancher Kampf beginnt aber ganz ohne Karte. Jetzt bleibt die Leiste immer stehen.
- Bei misslungener Konzentrationsprobe verschwand mit dem Feld auch die Meldung – also genau die Nachricht, dass der Zauber gerissen ist.
- Der Reiter „Am Tisch“ war doppelt: Dieselbe Anwesenheitsliste steht schon im Kontomenü. Mit ihm passten fünf Reiter nicht mehr in die Leiste.

### Die Oberfläche austauschbar machen

`6e34bf6`

Damit sich an der Oberfläche Grundlegendes ändern lässt, ohne den Unterbau mitzureißen, sind drei Nähte gezogen worden.

- Der Server legt sich auf keine Darstellung mehr fest
- Alle 96 Fehlerantworten tragen jetzt neben dem deutschen Satz einen unveränderlichen Schlüssel: `{ code: 'einladung_verbraucht', error: '…' }`. Bisher hätte eine neue Oberfläche deutsche Prosa vergleichen müssen, um einen verbrauchten Einladungscode von einem falschen zu unterscheiden.
- Zustände sind Schlüssel statt Sätze: `schwer_verwundet` statt „schwer verwundet“.
- Chronikeinträge tragen vollständige Strukturdaten in `meta`; der fertige Satz in `text` ist nur noch eine Rückfallebene und für das Protokoll.
- Übersetzt wird an einer einzigen Stelle: lib/beschriftung.js. Wer neu gestaltet oder übersetzt, tauscht diese Datei und lässt den Server in Ruhe.

Die Datenschicht liegt jetzt für sich Laden, Horchen auf Live-Ereignisse und Nachladen nach einem Funkloch steckten verstreut in jeder Seite und jedem Bauteil. Das ist der mühsame Teil, und man möchte ihn beim Umgestalten nicht neu schreiben. Er liegt jetzt in lib/daten.jsx als Haken: useKampf, useSzene, useCharaktere, useBeute, useNotizen, useBestiarium, useBegegnungen, useKonten, useEinladungen, useSitzungen, useWuerfe, usePings, useSzenenListe.

Kein Bauteil holt sich noch selbst Daten. Die Initiativliste kam so von fünfundzwanzig Zeilen Verwaltung auf fünf, der Spieltisch von achtzig auf fünfzehn. Wer die Oberfläche umbaut, wirft pages/ und components/ weg und behält alles darunter.

Der Vertrag ist nachgewiesen, nicht nur beschrieben docs/API.md beschreibt die Schnittstelle vollständig genug, um eine neue Oberfläche zu bauen, ohne den Quelltext des Servers zu lesen. Und `npm run vertrag` startet einen eigenen Almanach mit leerer Datenbank, spielt eine Runde durch und prüft fünfzig Zusagen: Rollen, getrennte Sichten für Spielleitung und Runde, Fehlerschlüssel, die Beuteteilung, den Live-Kanal.

- Beim Umbau selbst gefunden
- Der Auswahlrahmen einer Figur verschwand sofort nach dem Auslegen: Der neu eingeführte Abgleich schlug zu, während die Figurenliste noch die alte war. Es zählt wieder das Ereignis und nicht der Vergleich mit einem Stand, der hinterherhinkt.
- `laden` gibt das Geladene jetzt auch zurück; die Chronik brauchte den frischen Stand sofort und bekam nach dem Umbau nichts mehr.

### Die Blattoberfläche des Charaktermanagers entfernen

`2a17017`

Entfernt ist die Oberfläche, nicht das Merkmal:

frontend/src/pages/CharacterSheet.jsx frontend/src/pages/NewCharacter.jsx frontend/src/pages/Dashboard.jsx frontend/src/components/sheet/   (sieben Reiter, samt Figurenschmiede-Reiter) frontend/src/components/RepeatingRows.jsx

Der Almanach beginnt jetzt am Spieltisch. „/“ verweist dorthin, der Menüpunkt „Charaktere“ ist fort, alte Adressen laufen ins Nirgendwo statt in einen Absturz.

Bewusst stehen geblieben ist alles, worauf eine neue Blattoberfläche aufsetzt: die Tabelle und der Zweig /api/characters, die Datenschicht (useCharaktere), das Regelwerk (dnd5e.js), die Rasten (rasten.js), das Würfeln vom Blatt (wuerfeln.js), die Ausfuhr als eigenständige Datei (blattAusfuhr.js) und der Pfadsetzer (setPath.js). Diese Bausteine sind der Vorrat für den Neubau; sie zu löschen hieße, ihn zweimal zu schreiben.

Deshalb arbeitet auch alles Übrige unverändert weiter: Kampfliste, Trefferpunkt-Abgleich, „Runde holen“, eigene Initiative, Figuren auf der Karte, Träger und Auszahlung in der Beutekiste, die Chronik. Der Vertrag hält unangetastet mit fünfzig Prüfungen (npm run vertrag).

Nachgezogen: Hilfe, README und docs/API.md sagen jetzt, dass die Blattoberfläche neu gebaut wird und die Daten dahinter unberührt sind. Die Figurenschmiede erreicht vorerst nur die Spielleitung über das Bestiarium – der Weg für die Runde lag auf dem Charakterblatt.

Sollte die Absicht gewesen sein, das Merkmal ganz zu entfernen (Tabelle, Schnittstelle und alle Verknüpfungen), ist das ein zweiter, größerer Schritt.

### Die Blattoberfläche wiederherstellen

`ecf0680`

Nimmt 2a17017 vollständig zurück. Der Stand entspricht wieder Zeichen für Zeichen dem von 6e34bf6:

frontend/src/pages/CharacterSheet.jsx frontend/src/pages/NewCharacter.jsx frontend/src/pages/Dashboard.jsx frontend/src/components/sheet/   (sieben Reiter samt Figurenschmiede) frontend/src/components/RepeatingRows.jsx

Dazu die Wege dorthin: „/“ führt wieder auf die Übersicht, der Menüpunkt „Charaktere“ steht wieder in der Leiste, und Hilfe, README und docs/API.md sprechen wieder von einem Blatt, das es gibt.

Geprüft: Bau und Lint ohne Beanstandung, der Vertrag hält mit fünfzig Prüfungen, und im Browser stehen Übersicht, Blatt, Zauber mit vollem Text, Rettungswurf gegen den Tod, Konzentrationsprobe, Figurenschmiede und das Blatt zum Mitnehmen wieder bereit.

### Kartenbibliothek: Battlemaps sammeln, ausrichten, wieder auflegen

`16664c9`

Szenen tragen Nebel und Figuren – sie gehören zum Abend. Karten sind Vorbereitung, und dafür gab es bisher keinen Ort: Wer eine Map zum zweiten Mal brauchte, lud sie zum zweiten Mal hoch.

Neu ist deshalb ein Zweig /api/maps, ganz hinter dem Schirm der Spielleitung. Eine Karte trägt ihre Rasterausrichtung selbst; jede Szene, die aus ihr entsteht, erbt sie. Zweimal Auflegen legt keine Zwillinge an: Gibt es aus der Karte schon eine Szene, kommt diese samt erspieltem Nebel zurück, und nur `frisch: true` beginnt neu. Ein Bild überlebt das Löschen seiner Karte, solange eine Szene, Figur oder ein Bestiarium-Eintrag es noch braucht.

- In der Oberfläche:
- Reiter "Karten" unter Spielleitung: Stapel auf einmal hochladen, Schlagworte, Suche, Rasterausrichtung an der Vorschau.
- Vorschaubilder entstehen beim Hochladen mit; die Kachelwand lädt nicht dreißig Vollbilder, wenn der Pi sie ausliefern soll.
- Die Szenenlade am Spieltisch bietet die Bibliothek als Schnellzugriff und merkt eine am Tisch nachjustierte Ausrichtung auf Wunsch dauerhaft.
- Was am Tisch hochgeladen wird, landet zugleich in der Bibliothek.

Nebenbei: Die Szenenlade sprang bisher bei jedem Laden auf, weil die Szene während des Holens noch leer ist. Sie entscheidet das jetzt erst, wenn der Stand feststeht.

Vertrag: 66 Prüfungen (vorher 50).

### Klangteppich: Ambiente über Spotify auflegen

`618744c`

Die Spielleitung sammelt Wiedergabelisten wie sie Karten sammelt und legt eine mit einem Klick auf. Wer zuhört, hört sie im selben Moment.

Der Ton entsteht im Browser jedes Zuhörers. Anders geht es nicht, wenn die Runde aus fünf Wohnzimmern spielt – ein Server kann niemandem etwas vorspielen. Daraus folgt der Rest des Entwurfs:

- Der Almanach kennt kein Spotify-Konto und sieht nie ein Token. Die Anmeldung läuft mit PKCE direkt zwischen Browser und Spotify; die Schlüssel liegen im localStorage des jeweiligen Browsers. Auf dem Pi steht nur, welche Adresse gerade laufen soll.
- Jeder regelt seine eigene Lautstärke und darf stumm schalten, ohne dass es jemand merkt. Der Pegel der Spielleitung stimmt nur die Stücke gegeneinander ab und wirkt als Faktor.
- Wer kein Premium hat oder den Ton lieber aus der Anlage hätte, leitet ihn auf ein anderes Spotify-Gerät um.
- Die Spielleitung steuert den Tisch auch ohne eigenes verbundenes Spotify.

- Dazu:
- /api/ambience mit Bibliothek (nur hinter dem Schirm), aktivem Klang für alle und Live-Übertragung über den bestehenden SSE-Kanal.
- Teilen-Links werden normalisiert und streng geprüft: nur playlist, album, track oder artist mit 22-stelliger Kennung. Diese Zeichenkette geben wir jedem Browser der Runde zum Abspielen.
- Eine neue Auflage erkennt der Zuhörer an `startedAt` – nur dann startet er neu, sonst setzt er fort. Eine Wiedergabeliste beginnt an zufälliger Stelle und läuft in Dauerschleife.
- Eine Karte darf ihre Ambiente mitbringen: Wer sie auflegt, legt die Musik mit auf.
- Ohne SPOTIFY_CLIENT_ID bleibt die Klangleiste verborgen; im Reiter Klang steht dann die Einrichtung samt der Redirect-URI zum Kopieren.

Vertrag: 84 Prüfungen (vorher 66).

### Für den Dauerbetrieb härten und ein Einrichtungs-Handbuch schreiben

`21ea89d`

Der Almanach funktionierte, war aber noch nicht für einen Kasten gebaut, der ein Jahr lang unbeaufsichtigt im Regal steht.

- Betrieb:
- `npm ci` statt `npm install` im Abbild – derselbe Befehl ergibt in einem halben Jahr dieselben Fassungen.
- Der Server läuft nicht mehr als Administrator im Container, sondern als `node`. Das Datenverzeichnis wird schon beim Bauen übereignet.
- HEALTHCHECK: Der Container fragt sich minütlich selbst. `/api/health` fasst dafür die Datenbank wirklich an und antwortet mit 503, wenn sie unerreichbar ist – ein Server, der noch antwortet, aber nicht mehr an seine Daten kommt, soll neu gestartet und nicht als gesund geführt werden.
- Der Tunnel wartet auf `service_healthy`, statt der Runde beim Neustart ein paar Sekunden lang einen Cloudflare-Fehler zu zeigen.
- Protokolle sind auf 3 × 10 MB je Dienst begrenzt. Ohne Grenze wächst das Protokoll auf einem Pi so lange, bis die Karte voll ist – und dann steht alles.

Sicherung (backend/scripts/sicherung.mjs): Die Datenbank darf im Betrieb nicht kopiert werden; im WAL-Verfahren erwischt eine Kopie womöglich einen halben Schreibvorgang. `VACUUM INTO` schreibt einen in sich stimmigen Stand heraus, während weitergespielt wird. Bilder wandern nur auf Wunsch mit, damit die Datenbank jede Nacht gesichert werden kann, ohne jedes Mal alle Karten mitzuschleppen. Alte Sicherungen räumt das Skript weg.

docs/EINRICHTUNG.md: vom nackten Pi bis zur laufenden Runde – Betriebssystem, Docker, erster Start, Cloudflare-Tunnel, Spotify, Sicherung, Einladungen, Aktualisieren, Störungssuche, alle Stellschrauben.

Beim Prüfen des Handbuchs fiel eine Falle auf, die es selbst gestellt hätte: Wer nur `manager.sqlite3` zurücklegt und die WAL-Begleitdateien liegen lässt, bekommt beim Start den alten Stand darübergelegt – das Zurückspielen bleibt wirkungslos, ohne jede Fehlermeldung. Nachgewiesen, korrigiert und als Warnung aufgenommen.

Geprüft: Abbildinhalt von Hand nachgestellt und als unprivilegierter Benutzer gestartet, HEALTHCHECK-Befehl wörtlich ausgeführt, Sicherung angelegt und zurückgespielt, Vertrag 84 Prüfungen.

### Ohne Domain betreibbar, Spotify auf hinterlegte Links zurückgebaut

`e8ab533`

Beides hängt zusammen: Ohne eigene Domain gibt es kein HTTPS unter eigenem Namen, und ohne das kann Spotifys Web Playback SDK gar nicht laufen.

Zugang ohne Domain: Statt eines benannten Tunnels nun der Schnelltunnel von Cloudflare – kein Konto, kein Token, keine Domain, trotzdem gültiges HTTPS. Die `.env` ist damit für den Normalbetrieb überflüssig; compose läuft ohne sie durch. Der Preis steht ehrlich in der Doku: Die geliehene Adresse wechselt bei jedem Neustart des Tunnels. `scripts/adresse.sh` fischt die aktuelle aus dem Protokoll, damit man sie nicht suchen muss. Wer später eine feste Adresse will, findet beide Wege (eigene Domain, Tailscale) samt Haken beschrieben.

Klangteppich: Es fällt weg, was ohne Domain ohnehin nicht ginge – PKCE-Anmeldung, Web Playback SDK, Geräteumleitung, Pegelregler, Premium-Zwang und die 25er-Freischaltliste im Spotify-Dashboard. Es bleibt, was für jeden funktioniert: Die Spielleitung hinterlegt Spotify-Links, legt einen auf, und am Tisch steht bei allen, was dran ist – mit Knopf zum Öffnen im eigenen Spotify. Jedes Konto, auch ohne Premium, ohne Anmeldung im Almanach, ohne Einrichtung. Die Karte-bringt-ihre-Musik-mit-Verknüpfung bleibt.

Die Leiste am Tisch sitzt jetzt unten links statt mittig: Der Würfelbeutel steht rechts, die Seitenleiste des Spieltisches auch, und über der Karte hat eine Randnotiz nichts verloren.

Entfernt: lib/spotify.js, lib/klang.jsx, pages/SpotifyRueckkehr.jsx, die Route /spotify, vier Symbole der Wiedergabesteuerung. `useKlang` sitzt jetzt dort, wo die anderen Datenhaken sitzen.

Vertrag: 83 Prüfungen. Browser-Durchgang mit zwei Konten: Anlegen, Auflegen und Stille kommen live an, der Verweis zeigt auf open.spotify.com.

## 5. September 2026

### Sicht: Der Nebel folgt den Sinnen, NSC-Blätter und NSC-Steuerung

`15c7217`

Bisher war der Nebel eine Decke, die die Spielleitung von Hand wegwischt. Jetzt kommt die zweite Frage dazu: Was kann diese Figur von dort, wo sie steht, überhaupt wahrnehmen?

Sicht (backend/src/sicht.js): Eine Szene lässt sich auf *dunkel* stellen. Dann reicht der Blick so weit, wie es auf dem Blatt steht – Dunkelsicht, Blindsicht, Erschütterungssinn, Wahrer Blick, das Weiteste gewinnt – oder so weit, wie Licht trägt. Figuren führen ihr eigenes Licht mit (Fackel 20/20, Laterne 30/30 …) und erhellen die Karte für alle, nicht nur für sich. Radien liegen euklidisch auf Feldmittelpunkten, so wie die Regeln einen Radius auf dem Raster meinen; das Lineal misst weiter Chebyshev, weil das eine andere Frage ist.

Entscheidend ist, wo gerechnet wird: **auf dem Server, je Person.** Figuren außerhalb der Sicht stehen nicht mehr in der Nutzlast. Das gilt auch für den Nebel – bisher lag der nur *über* der Figur, war also Kulisse und keine Deckung. Die Szene geht deshalb je Person hinaus, nicht mehr je Rolle.

Am Brett hat der Nebel jetzt drei Stufen statt zwei: unerkundet (schwarz), erkundet (gedämpft – man weiß, wie es aussieht, sieht aber nicht hin) und im Blick (klar).

NSC-Blätter: Vollständige Charakterblätter, die nur die Spielleitung sieht. Sie liefern der Runde 403, fehlen in ihrer Übersicht und werden beim Holen der Runde in den Kampf übergangen. Geprüft wird das vor allen anderen Regeln – auch ein versehentlich als „geteilt“ markiertes NSC-Blatt bleibt hinter dem Schirm. In der Übersicht stehen sie getrennt unter „Hinter dem Schirm“.

NSC-Steuerung: Die Spielleitung sieht das Brett standardmäßig ganz und kann auf die Sicht einer ihrer Figuren umschalten. Gerechnet wird das nicht im Browser, sondern mit derselben Funktion, die auch für die Runde rechnet – ein Vorschaubild, das anders rechnet als das Original, wäre keine Hilfe, sondern eine Falle.

Zwei bewusste Grenzen, beide dokumentiert: keine Wände (Licht und Blick gehen hindurch, dagegen hilft nur der Nebel) und kein Unterschied zwischen hell und dämmrig (der Nachteil auf Wahrnehmung ist eine Regel für den Wurf).

Beim Prüfen im Browser gefunden und behoben: Dunkelsicht am Blatt zu ändern schickte die Szene nicht neu – der Vertrag hatte es nicht bemerkt, weil er frisch abfragt. Das Blatt löst jetzt eine Neuberechnung aus, aber nur wenn sich die Sinne wirklich geändert haben; es speichert bei jedem Tastendruck.

Vertrag: 107 Prüfungen (vorher 83). Browser-Durchgang mit zwei Konten über hell/dunkel/Dunkelsicht/Fackel/Nebel, NSC-Sicht und NSC-Blätter; die Sichtweiten nachgerechnet (15 Fuß = 3 Felder, 30 Fuß = 6, Form ein Kreis).

### Große Karten: Maßstab in Metern und Nebel als Bitkarte

`d4b8369`

Zwei Dinge steckten in „bis zu 200 x 200 Meter": Die Karte muss größer dürfen, und der Almanach muss „Meter" überhaupt verstehen können – bisher rechnete er fest in 5-Fuß-Feldern.

Maßstab: Szenen und Karten der Bibliothek tragen jetzt `unit` (Fuß oder Meter) und `scale` (Spielweite je Feld). Damit sind 200 x 200 Felder zu einem Meter genau die gewünschten zweihundert Meter. Lineal, Größenangaben und die Sichtweiten rechnen damit; die Sinne stehen auf dem Blatt weiter in Fuß, weil das Regelwerk in Fuß geschrieben ist, und werden umgerechnet – 30 Fuß Dunkelsicht reichen auf einer Meterkarte neun Felder weit statt sechs. Eine Szene erbt den Maßstab von ihrer Karte.

Nebel als Bitkarte – der eigentliche Grund, warum das vorher nicht ging: Eine Karte über zweihundert Meter hat 40 000 Felder. Als Liste von "x,y" sind das 348 KB, und die Szene geht seit der Sichtrechnung bei jedem Zug an jede Person neu hinaus – 1,7 MB für einen Schritt zur Seite bei fünf Spielern. Nebel und Sicht wandern deshalb als base64 verpackte Bitfolge, ein Bit je Feld: 6,5 KB statt 348 KB, und das Malen des Nebels wird nebenbei schneller, weil ein Bit zu lesen billiger ist als in einer Menge zu suchen. Gemessen: eine volle 200-Meter-Szene ist 6,9 KB und ein Zug kostet 3 ms. Einzelne Pinselstriche wandern weiterhin als "x,y" – dafür lohnt kein Umpacken. Die Szenenliste trägt gar keinen Nebel mehr; sie brauchte ihn nie.

- Beim Fahren im Browser gefunden:
- Der Zoom-Boden lag fest bei 0,12. Eine zwölftausend Bildpunkte breite Karte passte damit nicht auf den Schirm. Der Boden richtet sich jetzt nach der Karte: so weit heraus, bis das Ganze zu sehen ist, aber nicht weiter.
- Die Einpassung rechnete die Verschiebung mit dem *ungeklemmten* Maßstab – sobald geklemmt wurde, saß die Karte versetzt.
- Rasterlinien unter fünf Bildpunkten sind kein Raster mehr, sondern ein Grauschleier. Sie blenden sich jetzt aus.
- Das Mausrad hing an einem passiven Zuhörer und konnte das Blättern der Seite nicht unterdrücken. Auf einer großen Karte ist das Rad der Hauptweg durch die Gegend, also von Hand und nicht passiv angemeldet.

Dazu: „ohne Karte" legt Szenen bis 250 x 250 Felder an, Bilder werden erst ab 8192 statt 4096 Bildpunkten verkleinert, MAX_FELDER auf 65536.

Vertrag: 116 Prüfungen (vorher 107). Browser-Durchgang über eine echte 200-x-200-Meter-Karte: Einpassung auf 7 %, Lineal in Metern, 25 Nebelstriche, ganz herauszoomen – ohne Konsolenfehler.

### Sichtweite als Nebelfenster, das an der Figur hängt

`93ff3fa`

Zwei Dinge steckten in dem Wunsch, und das zweite deckte eine Schwäche auf.

Die Sichtweite gilt jetzt immer, nicht nur im Dunkeln: Das Charakterblatt bekommt neben den Dunkelsinnen eine eigene Sichtweite – wie weit der Blick überhaupt reicht. 0 heißt unbegrenzt, denn bei Tageslicht sieht man bis zum Horizont; eine Szene ohne Eintrag bleibt deshalb genau, wie sie war. Wer etwas einträgt, bekommt einen offenen Bereich um seine Figur, in jeder Szene und nicht erst bei ausgeknipstem Licht. Die Szene darf zusätzlich für alle deckeln – Nebelbank, Schneetreiben, dichter Wald.

Und es bewegt sich nur mit der Figur: Bisher öffnete jede Lichtquelle auf der Karte Sicht, für jeden. Eine Fackel am anderen Kartenrand konnte einem Spieler also etwas aufdecken, ohne dass seine Figur einen Schritt getan hatte – ohne Wände war das sogar quer durch Mauern. Fremdes Licht wirkt jetzt nur noch *innerhalb der eigenen Reichweite*: Es kann darin etwas sichtbar machen, aber das Fenster nicht aufziehen. Damit ist der offene Bereich immer eine Scheibe um die eigene Figur und wandert ausschließlich mit ihr.

Die Rechnung in einem Satz: Sichtbar ist, was innerhalb der eigenen Reichweite liegt und dort auch wahrzunehmen ist.

Beim Bauen selbst verursacht und gefunden: Ein Suchmuster für das UPDATE der Szene passte nicht, der zugehörige *Wert* wurde aber eingefügt – dreizehn Werte auf zwölf Platzhalter. Damit rutschte die Szenen-ID ins scale-Feld, das WHERE traf nichts, und „dunkle Szene" ließ sich stillschweigend nicht mehr schalten. Der Vertrag hat es sofort gezeigt. An dieser Stelle hatte ich kein assert gesetzt; jetzt schon.

Vertrag: 125 Prüfungen (vorher 116), darunter „eine Fackel außerhalb der eigenen Reichweite bleibt unsichtbar", „geht die Figur hin, wandert das Fenster mit ihr" und „ohne eingetragene Sichtweite bleibt eine helle Szene, wie sie war". Browser-Durchgang mit zwei Konten: Die Scheibe steht um die Figur, wandert beim Zug mit und lässt verlassenes Gelände ins Gedämpfte zurückfallen.

### Im Dunkeln erweitert die eigene Lichtquelle das Sichtfeld

`476bbac`

Die letzte Änderung hatte die Sichtweite zur harten Obergrenze gemacht – auch für die eigene Fackel. Wer 30 Fuß Sichtweite einträgt und eine Fackel mit 40 Fuß trägt, sah trotzdem nur 30. Das ist offensichtlich falsch: Dafür zündet man eine Fackel ja an.

Die Reichweite hängt jetzt vom Licht ab:

hell   : min(sichtweite, wetter) dunkel : min(max(sichtweite, eigenesLicht), wetter)

Im Dunkeln gewinnt also, was von beidem weiter trägt – der eigene Blick oder die eigene Laterne. Nachgemessen: Fackel 40 Fuß bei 30 Fuß Sichtweite ergibt 40 Fuß, eine Laterne 60, und Dunkelsicht 60 schlägt eine kleine Fackel.

Zwei Dinge bleiben absichtlich, wie sie waren:

- Das `wetter` der Szene deckelt weiterhin alles. Nebel bleibt Nebel, auch mit Laterne – dafür ist die Sichtgrenze der Szene da.
- Fremdes Licht wirkt nur *innerhalb* der eigenen Reichweite. Es kann darin etwas sichtbar machen, aber das Fenster nicht aufziehen; sonst wanderte der offene Bereich wieder, ohne dass die eigene Figur einen Schritt getan hätte.

Dazu ein Hinweis an der Stelle, wo man stolpert: Schaltet die Spielleitung auf dunkel und trägt niemand ein Licht, sieht die Runde nur ihr eigenes Feld. Das ist richtig, aber überraschend – die Werkzeugleiste sagt es jetzt und nennt den Weg zur Fackel.

Vertrag: 128 Prüfungen (vorher 125), darunter „mit eigener Laterne sehr wohl – Licht erweitert das Sichtfeld" und „Nebel bleibt Nebel, auch mit Laterne". Im Browser nachgesehen: Bei 20 Fuß Sichtweite öffnet eine Fackel sichtbar den doppelten Radius.

### Vorhang: hinter verschlossenem Tisch aufbauen

`d49aa4c`

Die Spielleitung kann den Tisch jetzt zuziehen. Ist der Vorhang zu, bekommt die Runde von der Szene *nichts* mehr – kein Bild, keine Figuren, keinen Nebel, nicht einmal den Namen. Die Nutzlast ist buchstäblich `{vorhang:true}` und sonst leer; es wird nichts im Browser verdeckt, sondern nichts geschickt.

Dahinter lässt sich in Ruhe arbeiten: Karte wechseln, Gegner stellen, Nebel malen. Die Spielleitung sieht ihren Tisch weiter, mit einem roten Band über der Werkzeugleiste, das den Zustand nennt und mit einem Klick öffnet – wer den Vorhang vergisst, spielt sonst vor einer Runde, die nichts sieht.

Der Vorhang hängt am Tisch, nicht an der Szene. Sonst müsste man ihn für jede neue Karte neu zuziehen, und genau in dem Moment sähe die Runde alles.

- Dazu:
- `verdeckt` an `aktivieren` und `maps/:id/auflegen` zieht ihn in einem Zug mit zu; in der Szenenlade steht das als zweite Handlung neben „auflegen".
- Die Kartenbibliothek hat den Schalter ebenfalls – dort wechselt man Karten.
- Der Chronikeintrag zur Szene entsteht nicht mehr beim Auflegen, sondern erst beim Aufgehen: Im Protokoll soll kein Ort stehen, den am Tisch niemand gesehen hat.
- Kampfliste, Beute und Handzettel laufen daneben weiter. Verdeckt wird der Tisch, nicht der ganze Abend.

Vertrag: 144 Prüfungen (vorher 128), darunter „es ist wirklich nichts sonst in der Nutzlast", „ein Kartenwechsel hinter dem Vorhang bleibt verborgen" und „der Ort steht erst im Protokoll, wenn der Vorhang aufgeht". Browser-Durchgang mit zwei Konten über den ganzen Ablauf: offen, zuziehen, Karte wechseln, öffnen – die Runde sieht die neue Karte erst am Schluss.

### Zweiter Weg: den Almanach ohne Docker betreiben

`7f2dc30`

Bisher führte nur ein Weg zum laufenden Almanach: ein Raspberry Pi mit Docker. Wer keinen hat – oder auf einem Rechner sitzt, auf dem nichts installiert werden darf –, stand vor der Tür. Jetzt gibt es einen zweiten, gleichwertigen Weg, und beide führen zum selben Almanach.

`npm start` ist dieser Weg. Ein Befehl, der nachsieht, ob dieses Node den Almanach tragen kann, fehlende Bausteine holt, die Oberfläche baut – aber nur, wenn sich seither wirklich etwas geändert hat – und dann den Server startet. Auf einem frischen Rechner mit nichts als Node ist das alles, was zu tun ist. Wer kein Terminal mag, klickt `starten.cmd` oder `starten.sh` doppelt.

Zwei Dinge dabei sind Absicht und keine Kleinigkeit:

Der Almanach lädt auf diesem Weg **nichts Kompiliertes** nach. Seit Node 22.5 steckt SQLite in Node selbst; die Rückfallebene better-sqlite3 wäre das einzige Stück, das ein fertiges Programm aus dem Netz zöge – genau das, was ein verwalteter Rechner sperrt. Liegt das eingebaute SQLite vor, wird sie weggelassen (106 Pakete werden zu 70).

Und der Weg nach außen kommt mit: `npm run tunnel` startet den Cloudflare- Schnelltunnel ohne Container und schreibt sein Protokoll dorthin, wo `npm run adresse` es findet. Dieses Skript löst `adresse.sh` ab und läuft jetzt überall gleich – es nennt localhost, die Adresse im WLAN und die des Tunnels, und fragt beide Quellen, damit niemand eine tote Adresse aus einem alten Protokoll weitergibt.

Nebenbei zwei Ungereimtheiten beseitigt, die dabei aufgefallen sind: Die Sicherung schrieb ihre Kopien in einen Ordner, den sie aus dem Arbeitsverzeichnis erriet – vom Projektstamm aus also am Datenordner vorbei; sie nimmt jetzt denselben, den auch der Server benutzt. Und im Handbuch stand an einer Stelle noch eine Adresse mit eigener Domain, obwohl die längst abgeschafft ist.

Handbuch und README beschreiben beide Wege nebeneinander: Weg A der Pi, Weg B der Laptop, mit einer Tabelle vorneweg, welcher wem gehört.

Geprüft: In einem frisch ausgepackten Ordner mit nichts als Node führt `npm start` bis zur laufenden Anmeldeseite. Strg+C beendet Skript und Server gemeinsam. Der Vertrag hält weiter mit 144 Prüfungen.

### Den Almanach ganz aus dem VS-Code-Terminal betreiben

`fb33577`

Spielen wie entwickeln geht aus dem eingebauten Terminal, ohne das Fenster zu wechseln. Zwei Aufgaben kommen dazu — Adresse anzeigen und Tunnel aufmachen —, damit auch der Weg ohne Docker über die Aufgabenliste erreichbar ist und nicht nur über abgetippte Befehle.

Der eigentliche Grund für diesen Griff ist aber eine Stolperstelle, die genau die Rechner trifft, um die es hier geht: Auf verwalteten Windows-Maschinen sperrt die Ausführungsrichtlinie das Laden von npm.ps1. Dann bricht `npm` in der PowerShell mit einer Meldung ab, die nach einem kaputten Projekt aussieht, obwohl nichts kaputt ist — und wer das nicht kennt, sucht den Fehler stundenlang am falschen Ende. Die Eingabeaufforderung kennt diese Regel nicht, also stellt das Projekt sein VS-Code-Terminal unter Windows darauf um. Wer lieber PowerShell benutzt, schreibt npm.cmd; das steht jetzt in der README und in der Störungssuche des Handbuchs.

### Tunnel ohne Docker: cloudflared, SSH oder localtunnel – automatisch

`437cfd4`

Fehlt cloudflared auf dem Laptop und darf auch nichts nachinstalliert werden, stand man bisher ohne Weg nach außen da. Jetzt probiert `npm run tunnel` drei Anbieter der Reihe nach durch und nimmt den ersten, der auf dem Gerät einsatzbereit ist:

1. cloudflared         – wie bisher, am robustesten 2. ssh → localhost.run – lädt nichts herunter; SSH bringt praktisch jedes Windows, macOS und Linux schon mit. Braucht aber ausgehendes Port 22, das mancher Firmenrechner sperrt. 3. npx localtunnel      – kommt über npm, also nichts Kompiliertes. Zeigt Mitspielern beim ersten Aufruf eine Zwischenseite und der freie Dienst ist bekannt launisch, aber als letzter Ausweg unter allen Umständen einen Versuch wert.

Ein bestimmter Weg lässt sich mit TUNNEL_ANBIETER=ssh|cloudflared| localtunnel erzwingen. `npm run adresse` erkennt jetzt alle drei Domains (trycloudflare.com, lhr.life/localhost.run, loca.lt), nicht nur Cloudflares.

Geprüft mit stellvertretenden ssh- und npx-Programmen für alle drei Wege: die Vorrangfolge, das Erzwingen über die Umgebungsvariable, ein fehlschlagender Anbieter mit Hinweis auf die verbliebene Alternative, und der Fall, dass wirklich keiner der drei da ist. Handbuch, README und das veröffentlichte Handbuch-Artefakt beschreiben jetzt alle drei Wege.

### Windows: npm-Unterprozesse brauchen eine Shell dazwischen

`4966c7c`

`npm start` schlug unter Windows beim Nachinstallieren und beim Bauen lautlos fehl – ohne jede echte npm- oder vite-Fehlermeldung, nur mit der eigenen generischen Meldung des Skripts. Grund: `npm` selbst ist unter Windows ein `.cmd`, und das lässt sich aus einem Node-Skript heraus nicht zuverlässig ohne eine Shell dazwischen starten – besonders wenn der Pfad, wie hier, ein Leerzeichen enthält (`C:\Webentwicklung TB13\...`). Ohne `shell: true` schlägt schon das Starten des Unterprozesses fehl, bevor npm auch nur zu Wort kommt.

Betroffen waren zwei Stellen in start.mjs (Nachinstallieren, Bauen) und eine in tunnel.mjs (npx für localtunnel) – dieselbe Lücke, die in tunnel.mjs an den anderen Stellen (cloudflared-Suche, ssh, npx-Version) schon richtig gemacht war. Jetzt überall `shell: process.platform === 'win32'`, wie im Rest des Projekts.

Auf Linux ändert sich nichts (die Bedingung greift nur unter Windows); Vertrag hält weiter bei 144 Prüfungen.

### Kompendium: Feldnamen der SRD-API auf Deutsch beschriften

`3d03bd2`

Die Kompendium-Seite selbst war schon durchgehend Deutsch – Kategorien, Überschriften, Suchfeld. Nur die Feldbezeichnungen in der Detailansicht blieben englisch, weil CompendiumDetail die rohen Schlüssel der SRD-API („casting_time", „armor_class", „challenge_rating" …) nur grob großschrieb statt sie zu übersetzen.

Neue Tabelle SRD_FELD in beschriftung.js, nach demselben Muster wie ZUSTAND und CHRONIK_ART: reine Strukturbezeichner der Schnittstelle, keine Sätze aus dem Regelwerk selbst – die Zauber- und Monstertexte kommen unverändert aus der Quelle. Unbekannte, seltene Schlüssel fallen weiter auf die alte Notlösung zurück.

Der Wortlaut des SRD bleibt also, wie er ist; nur was drumherum steht, ist jetzt Deutsch.

## 6. September 2026

### Eine volle Dokumentation und zwei Betriebsanleitungen

`806ffc2`

Bisher gab es die README für den Überblick, das Einrichtungs-Handbuch für den Aufbau und die Hilfe-Seite im Almanach für den Griff zwischendurch. Was fehlte, war das Nachschlagewerk dazwischen – und vor allem etwas, das man seiner Runde einfach schicken kann.

docs/HANDBUCH.md beschreibt den Almanach vollständig: Rollen und wer was sieht, das Charakterblatt, den Spieltisch, die Sicht- und Nebelrechnung mit ihren Formeln, was hinter dem Schirm der Spielleitung liegt, Würfel, Beute, Klang, Chronik, Kompendium, die Technik dahinter, Sicherung und Umzug – und ein eigenes Kapitel darüber, was der Almanach bewusst nicht tut, damit niemand danach sucht.

docs/SPIELLEITUNG.md führt chronologisch durch einen Abend: einmalig die Runde einrichten, vorher Karten, Gegner, NSC und Klang vorbereiten, am Abend den Tisch mit dem Vorhang führen, Kampf, Licht und Sicht steuern, hinterher die Chronik schließen. Mit Kniffen und einer Störungstabelle, die von den Bildern ausgeht, die man wirklich sieht.

- docs/SPIELER.md ist die Fassung zum Weitergeben: beitreten, aufs Telefon legen, Blatt bedienen, Spieltisch, Würfeln, Beute, das Blatt mitnehmen. Und ein Abschnitt, der erklärt, was man nicht sieht und warum das so gewollt ist
- das erspart die Frage am Tisch.

Nebenbei zwei Ungereimtheiten beseitigt, die beim Nachprüfen auffielen: Die Bildgrenze steht seit einer Weile bei 12 MB und verkleinert auf 8192 Bildpunkte, in der Doku standen noch 20 MB und 4096. Und die README zählte drei Teile auf, listete aber vier.

### Die Handbücher druckfertig setzen

`d4f1482`

Die Handbücher lesen sich am Bildschirm gut, auf Papier nicht: keine Seitenzahlen, keine Ränder, Tabellen laufen über den Bund. `npm run drucksatz` setzt sie deshalb als HTML, das für den Druck gedacht ist – mit Titelblatt, Satzspiegel, Seitenzahlen und Tabellen, die nicht mitten in einer Zeile umbrechen. Im Browser dann Strg+P, „Als PDF sichern“, fertig; kein pandoc, kein LaTeX, nichts nachzuinstallieren, und damit auch auf einem Rechner möglich, auf dem man nichts installieren darf.

Bewusst ein eigener, kleiner Markdown-Leser statt einer Bibliothek: Die Handbücher benutzen eine Handvoll Formen – Überschriften, Listen, Tabellen, Zitate, Codeblöcke –, und dafür lohnt keine Abhängigkeit, die bei jedem `npm install` mitkommen müsste.

Zwei Dinge, die beim Prüfen auffielen und gleich richtig gemacht sind:

Code-Stellen werden vor der Fett- und Kursivauszeichnung herausgenommen und danach wieder eingesetzt, sonst läse ein Sternchen in einem Befehl sich als Kursivschrift. Als Merkzeichen dafür dient ein Zeichen aus dem privaten Unicode-Bereich – eine Ziffer in Leerzeichen, wie zuerst versucht, griffe in „200 × 200 Felder“ prompt daneben und hinterließe dort „undefined“.

Und die Querverweise zwischen den Bänden zeigen im Druck auf die HTML-Fassung nebenan statt auf das Markdown, das dort gar nicht liegt.

Das Ergebnis liegt in docs/druck/ und bleibt ungetrackt – es entsteht in einer Sekunde neu aus den .md-Dateien, die die Quelle bleiben.

### Ein Chat am Tisch, und die Figurenschmiede geht von Bord

`be94f9a`

Zwei Änderungen, die nichts miteinander zu tun haben, außer dass beide am selben Abend gewünscht waren.

--- Der Chat ---

Unten rechts, neben dem Würfelbeutel. Was man dort sagt, lesen alle; über „An“ wählt man eine einzelne Person und flüstert ihr zu.

Geflüstertes erreicht ausschließlich die beiden Beteiligten – auch die Spielleitung nicht. Das ist Absicht: „flüstern“ soll heißen, was es sagt. Wie überall im Almanach entscheidet das der Server, nicht der Browser: Die Zeile wird den übrigen Fenstern gar nicht erst geschickt, weder über den Live-Kanal noch beim Nachladen. Wer als Spielleitung etwas Geheimes an die Runde geben will, hat dafür weiterhin die Handzettel – die sind zum Austeilen gedacht und stehen hinterher in der Chronik.

In der Chronik steht vom Chat nichts. Gerede ist kein Ereignis, und das Protokoll soll nach dem Abend lesbar bleiben – das wäre es nicht, wenn jede Nachfrage nach dem Pizzadienst darin stünde. Aus demselben Grund ist der Chat ein Gespräch und kein Archiv: die letzten dreihundert Zeilen bleiben.

Beim Prüfen im Browser kam heraus, dass der Vertragstest allein hier nicht genügt: Er lädt neu und war zufrieden, während im Browser nichts ankam. Der Live-Kanal meldet sich nämlich nur für eine feste Liste von Ereignisnamen an, und „chat“ stand nicht darin – der Server sendete, niemand hörte zu. Jetzt steht es darin, und zwei Fenster nebeneinander zeigen, dass Gesagtes sofort ankommt und Geflüstertes eben nicht.

--- Die Figurenschmiede ---

Entfernt, samt three.js. Das Bündel schrumpft dadurch von 1281 KB auf 763 KB – die 3D-Bibliothek war der größte einzelne Brocken darin.

Schon gegossene Figuren bleiben erhalten: Die Spalten bleiben stehen, und wo eine Figur hinterlegt ist, steht sie weiter auf dem Spieltisch und im mitgenommenen Blatt. Nur neue entstehen nicht mehr. Ein Bildnis lädt man weiterhin oben auf dem Blatt hoch; auf der Karte ist eine Figur sonst ein Plättchen in der Farbe ihrer Besitzerin.

Geprüft: 161 Vertragsprüfungen (17 neue für den Chat, darunter die, dass Geflüstertes zwischen zwei Spielern die Spielleitung nicht erreicht), dazu ein Durchgang mit drei Fenstern im Browser.

## 7. September 2026

### Das Charakterblatt trägt, was auf einem gedruckten Bogen steht

`414403b`

Vorlage war ein vollständiges Blatt aus dem Regelwerk von 2024. Was dort steht und hier fehlte, ist jetzt da:

Übersicht    die drei passiven Werte statt nur der Wahrnehmung, ein Vermerk für Rettungswürfe („Vorteil gegen Bezaubert“), Aufstieg nach Punkten oder Meilensteinen Kampf        Aktionen, Bonusaktionen und Reaktionen des Charakters, dazu die Standardhandlungen zum Nachschlagen Inventar     Traglast in drei Marken – getragen, überladen, schieben – und die angelegten magischen Gegenstände, die vorher unter Kampf standen Zauber       Quelle, Rettungswurf, Zeit, Reichweite, Komponenten, Dauer, Seite und Notizen je Zauber; aus dem Kompendium übernommene füllen das selbst aus Hintergrund  Aussehen und Person, Erscheinungsbild, Verbündete, und Merkmale nach Herkunft geordnet, mit Quelle und Seite

Dazu ein Maßsystem je Blatt: Neue Blätter rechnen in Metern und Kilogramm, wie es der deutsche Bogen tut. Im Blatt selbst liegen Weiten weiterhin in Fuß – daran hängt der Nebel am Spieltisch, der ausrechnet, wie weit eine Figur im Dunkeln sieht. Umgeschaltet wird nur die Brille.

Blätter aus früheren Fassungen behalten Fuß und Pfund, sonst ständen über Nacht andere Zahlen da. Sie erkennt man daran, dass sie Inhalt haben, aber keine Maßangabe; ein leeres Blatt bekommt die heutige Vorgabe.

Geprüft wird das doppelt: `npm run blattprobe` rechnet nach, was das Blatt ausrechnet, und weist nach, dass ein altes Blatt nichts verliert. `npm run vertrag` schickt ein Blatt mit jedem gefüllten Feld zum Server und vergleicht, was zurückkommt.

### Die Tafel „Figur“ fällt aus dem Blatt

`a74afb1`

Sie war der letzte Rest der Figurenschmiede: Wer früher eine Figur gegossen hatte, bekam sie im mitgenommenen Blatt noch einmal als Bild untergestellt. Die Schmiede ist fort, also geht auch die Tafel.

Damit entfällt ein Abruf je Ausfuhr – das Bild wurde bisher eigens vom Server geholt, um es einzubetten.

Der Datensatz am Ende der Datei bleibt vollständig: Was an Figur gespeichert ist, reist weiter mit und geht niemandem verloren. Auch am Bestiarium ändert sich nichts; dessen Figuren stehen weiterhin auf dem Spieltisch.

### Zwölf fertige Charaktere liegen von Anfang an hinter dem Schirm

`f75dcca`

Ein frischer Almanach war leer, und ein leerer Almanach ist schwer zu beurteilen: Man sieht nicht, was ein Blatt trägt, bevor man selbst eines ausgefüllt hat. Jetzt liegen zwölf fertige Charaktere bereit – je einer für jede Klasse und jede Spezies:

Kämpfer Zwerg          Barbar Goliath        Barde Halbelf Kleriker Aasimar       Druide Gnom           Mönch Halbling Paladin Drachenblütiger Waldläufer Elf       Schurke Tiefling Zauberer Ork           Hexenmeister Halbork  Magier Mensch

Alle auf Stufe 1, nach dem Standardwertesatz gebaut, auf den der Hintergrund +2 und +1 legt – so, wie es das Regelwerk von 2024 vorsieht. Halbelf und Halbork kommen aus dem älteren Buch und bekommen deshalb nur ihre Eigenschaften, keine eigenen Attributsboni; sonst stünden zwei Blätter besser da als die übrigen zehn.

Jedes Blatt trägt, was ein gedruckter Bogen trägt: Startausrüstung nach Klasse und Hintergrund samt Gewicht und Startgold, Angriffe mit Bonus und Schaden, eigene Aktionen und Bonusaktionen, Merkmale nach Herkunft geordnet mit Quelle und Seite, Zauber mit Zeit, Reichweite, Komponenten und Dauer, Aussehen, Wesenszüge – und eine eigene Vorgeschichte.

Sie liegen als NSC-Blätter: Die Spielleitung sieht sie, die Runde nicht. Wer eine spielen will, bekommt eine Abschrift, und die gehört dann ihr. Die Vorlage bleibt für die nächste liegen.

Gesät wird genau einmal. Wer eine löscht, hat sie gelöscht – sie wächst beim nächsten Start nicht nach. Zurückholen: npm run vorlagen, das legt nur an, was fehlt.

Geprüft wird das Ganze dreifach: `npm run blattprobe` rechnet für jedes der zwölf Blätter den Wertesatz, die Trefferpunkte und die Zauber nach und weist nach, dass die Oberfläche sie ohne Wanderung annimmt. `npm run vertrag` belegt, dass sie hinter dem Schirm liegen, dass die Runde sie nicht sieht und dass eine Abschrift beim Abschreibenden landet.

## 11. September 2026

### Eine feste Adresse für die Runde statt einer geliehenen

`0f29338`

Die Adresse des Schnelltunnels ist geliehen und wechselt bei jedem Neustart. Wer einmal pro Woche spielt, schickt seiner Runde also vor jedem Abend eine neue – und wer den Almanach aufs Telefon gelegt hat, legt ihn danach neu ab.

Mit einer eigenen Domain entfällt das. Zwei Zeilen in der `.env`:

DOMAENE=www.deinemudda.fun TUNNEL_TOKEN=…

Dann baut `npm run tunnel` den *benannten* statt des Schnelltunnels auf: Nicht der Tunnel leiht sich eine Adresse, sondern die Adresse gehört der Runde und der Tunnel meldet sich bei ihr an. Sie bleibt über Neustarts hinweg dieselbe und trägt auch dann noch, wenn der Rechner in einem fremden WLAN steht.

Der benannte Tunnel und nicht Portfreigabe mit DynDNS, weil das auf einem Laptop der falsche Weg wäre: Es verlangt Zugriff auf den Router, bricht beim Ortswechsel, und bei vielen Anschlüssen gibt der Anbieter gar keine eigene öffentliche Adresse mehr heraus.

Damit das ohne Docker überhaupt ankommt, liest der Almanach jetzt selbst eine `.env` neben sich ein – bisher schöpfte nur `docker compose` daraus. Gelesen wird sie als Erstes, noch vor der Datenbank, und was schon in der Umgebung steht, schlägt die Datei.

Zwei Stellen, an denen der Almanach lieber schweigt als falsch zu raten:

- Ein unbrauchbarer DOMAENE-Wert hält den Start nicht auf, wird der Runde aber auch nicht genannt – stattdessen ein Hinweis in der Startmeldung. Eine tote Adresse weiterzugeben wäre schlimmer als gar keine.
- Mit gesetzter DOMAENE sucht `npm run adresse` nicht mehr in den Tunnel-Protokollen. Dort läge sonst womöglich noch eine geliehene Adresse von vorgestern, und die führte die Runde ins Leere.

Das Kennwort geht auf beiden Wegen über die Umgebung und nicht über die Befehlszeile: Was im Befehl steht, zeigt `ps` oder `docker ps` jedem, der auf dem Gerät nachsieht.

### Die eigene Domain über einen Vorposten statt über fremde Dienste

`abfe23f`

Die Adresse des Schnelltunnels ist geliehen und wechselt bei jedem Neustart. Wer einmal die Woche spielt, schickt seiner Runde also vor jedem Abend eine neue – und wer den Almanach aufs Telefon gelegt hat, legt ihn danach neu ab.

Das Hindernis für eine eigene Adresse ist, dass ein Laptop keine hat: Er steht mal hier, mal dort, meist hinter einem Router, der ihm gar keine öffentliche Adresse gibt. Eine Domain kann also nicht auf ihn zeigen.

Sie zeigt jetzt auf einen Vorposten – einen kleinen Server, der immer am selben Fleck steht (bei Oracle dauerhaft kostenlos). Dort liegen nginx und das Zertifikat, und weil der Laptop hinausrufen darf, auch wenn niemand hineinrufen kann, dreht die Leitung die Richtung um:

Browser → www.deinemudda.fun → nginx (Vorposten) → SSH-Leitung → Laptop

Zwei Zeilen in der `.env`, und `npm run tunnel` baut die Leitung statt eines Schnelltunnels auf:

DOMAENE=www.deinemudda.fun TUNNEL_ZIEL=tunnel@www.deinemudda.fun

Dieser Weg und nicht Portfreigabe mit DynDNS, weil der auf einem Laptop scheitert: Er verlangt Zugriff auf den Router, bricht beim Ortswechsel, und bei vielen Anschlüssen gibt der Anbieter längst keine eigene öffentliche Adresse mehr heraus. Und nicht cloudflared oder Tailscale, weil beide auf dem Rechner installiert werden wollen – gebraucht wird hier nur `ssh`, das Windows 10, macOS und Linux ohnehin mitbringen.

`scripts/vorposten.sh` richtet den Vorposten in einem Zug ein: nginx, ein Zugang, der ausschließlich diese eine Rückleitung aufmachen darf (`PermitListen`, keine Anmeldeschale), und das Zertifikat von Let's Encrypt. Zwei Dinge daran sind leicht zu übersehen und stehen deshalb im Skript:

- `proxy_buffering off`. Der Almanach hält eine offene Leitung, über die er Würfe und Züge sofort an alle schickt. Mit Pufferung käme am Tisch alles verspätet an – und zwar ohne jede Fehlermeldung.
- Die örtlichen Paketregeln. Oracle-Abbilder verwerfen alles außer SSH; in der Weboberfläche steht Port 443 dann längst offen, und trotzdem kommt niemand herein.

Damit das ohne Docker überhaupt ankommt, liest der Almanach jetzt selbst eine `.env` neben sich ein – bisher schöpfte nur `docker compose` daraus. Gelesen wird sie als Erstes, noch vor der Datenbank, und was schon in der Umgebung steht, schlägt die Datei.

Zwei Stellen, an denen der Almanach lieber schweigt als falsch zu raten:

- Ein unbrauchbarer DOMAENE-Wert hält den Start nicht auf, wird der Runde aber auch nicht genannt – stattdessen ein Hinweis in der Startmeldung. Eine tote Adresse weiterzugeben wäre schlimmer als gar keine.
- Mit gesetzter DOMAENE sucht `npm run adresse` nicht mehr in den Tunnel-Protokollen. Dort läge sonst womöglich noch eine geliehene Adresse von vorgestern.

Bricht die Leitung ab – gewechseltes WLAN, kurz eingeschlafener Laptop –, baut `npm run tunnel` sie mit wachsenden Pausen von selbst wieder auf. Die Diagnose dazu steht einmal da und nicht bei jedem Versuch.

### Den Weg nach außen auch unter Windows zum Doppelklicken

`04a6126`

Der Vorposten fasst den Router ohnehin nicht an – die Leitung wird von innen nach außen aufgebaut, und hinaus darf jeder Rechner. Das stand bisher nur beiläufig in der Merkmalstabelle und ist jetzt ausgeschrieben, samt dem Fall, dass der Router einem gar nicht gehört.

Was fehlte, war Windows. Der Almanach hat mit `starten.cmd` längst eine Datei zum Doppelklicken; die Leitung nach außen hatte keine. Jetzt gibt es `tunnel.cmd` daneben, und für macOS und Linux `tunnel.sh` – zwei Fenster, zwei Doppelklicks, kein Terminal nötig.

In der Anleitung steht Windows 11 jetzt voran statt in einer Fußnote: eigene Befehlsblöcke für Eingabeaufforderung und Unix-Schale, und vier Fallen, die dort regelmäßig einen Abend kosten:

- Notepad macht aus `.env` ein `.env.txt`, und der Almanach findet nichts. Der `copy`-Befehl davor umgeht das, weil die Datei schon richtig heißt, bevor Notepad sie öffnet.
- Ein hereinkopierter Schlüssel gehört zu vielen, und ssh verweigert ihn mit `UNPROTECTED PRIVATE KEY FILE`.
- Die PowerShell-Ausführungsrichtlinie stolpert über npm.ps1 – in der Eingabeaufforderung arbeiten oder gleich die .cmd-Dateien nehmen.
- Ein zugeklappter Laptop nimmt die ganze Runde mit.

Und die Stelle, an der `ssh` fehlt, nennt jetzt den richtigen Weg unter Windows 11: Optionale Features statt Download.

### Klarstellen, wessen IP in die Domain gehört

`5b90ef7`

Die Anleitung lud zu genau dem Missverständnis ein, das sie verhindern sollte: Im A-Record steht die Adresse des Vorpostens, aber die Probe darunter sagte "Steht dort deine IP, weiter" – als gehörte der eigene Anschluss hinein.

Das ist der Punkt, an dem der ganze Aufbau kippt. Eine eigene IP wäre dort unbrauchbar: Sie wechselt, sie ist beim Mitspieler eine andere, und hinter dem Router ist sie von außen ohnehin nicht erreichbar. Genau deshalb gibt es den Vorposten – dessen Adresse steht fest.

Jetzt steht es an drei Stellen: im Überblick gleich unter dem Wegdiagramm, in Schritt 4 als eigener Kasten (samt dem Weg, die Adresse in der Oracle- Oberfläche wiederzufinden), und in der Störungstabelle als erster Verdacht bei einer Domain, die gar nicht antwortet.

### PowerShell statt cmd als Vorgabe, und die Blockeinfüge-Falle entschärfen

`8b19d79`

Ein Nutzer hat genau den Fehler getroffen, den diese Korrektur verhindert: ssh-keygen und der Anzeige-Befehl standen als Block, unter der Annahme, Windows 11 öffne die Eingabeaufforderung. Tatsächlich ist PowerShell heute der Standard-Prompt, und %USERPROFILE% wird dort nicht aufgelöst – `type %USERPROFILE%\.ssh\id_ed25519.pub` schlägt mit "Pfad kann nicht gefunden werden" fehl, wörtlich mit dem Prozentzeichen im Namen.

Der zweite, ernstere Fund aus demselben Protokoll: Beim Einfügen mehrerer Zeilen auf einmal blieb ein Rest im Eingabepuffer hängen und landete als Antwort auf ssh-keygens Frage nach dem Dateipfad. Der private Schlüssel bekam dadurch den Namen "ssh-keygen -t ed25519" und landete im aktuellen Ordner statt in .ssh – in diesem Fall mitten im Git-Repository.

Schritt 1 zeigt jetzt PowerShell zuerst (Get-Content statt type), mit der Eingabeaufforderung als zweite Möglichkeit, und ist ausdrücklich als einzeln auszuführende Befehle markiert statt als Block. Eine Randglosse sagt, woran man die verunglückte Antwort erkennt und wie man aufräumt, bevor versehentlich etwas committet wird. Dieselbe Falle steht jetzt auch in der Störungstabelle am Ende des Kapitels.

### Zurück zum benannten Cloudflare-Tunnel: keine Kreditkarte nötig

`b1eff9e`

Der Oracle-Vorposten aus den letzten beiden Commits verlangt eine Kreditkarte zur Kontoprüfung – auch wenn nie etwas abgebucht wird, ist das eine Hürde, die manche schlicht nicht nehmen können oder wollen. Cloudflare ist der einzige mir bekannte Weg zu einer eigenen, festen Domain, der weder Zahlung noch Karte verlangt.

Der benannte Tunnel war in dieser Sitzung schon einmal fertig gebaut (0f29338), bevor testweise erst Tailscale (keine eigene Domain möglich) und dann der Oracle-Vorposten (Kreditkarten-Pflicht) an seine Stelle traten. Diese Fassung holt cloudflared/benannterTunnel() aus jenem Commit zurück und baut sie mit dem auf, was seither dazugelernt wurde:

- cloudflared selbst installieren, bevorzugt über winget statt eines Downloads von einer fremden Website – das ist auf einem Rechner, der sonst nichts installieren darf, der einzige verbleibende Download an diesem ganzen Weg.
- PowerShell zuerst in allen Befehlsblöcken, mit der Eingabeaufforderung als zweiter Option – nicht mehr umgekehrt.
- Jeder Befehl in einem eigenen Kopierkasten statt mehrerer Zeilen im selben Block, nachdem ein Nutzer genau an dieser Stelle in einen verunglückten ssh-keygen-Aufruf gelaufen ist, weil ein Klick auf "Kopieren" mehrere Zeilen auf einmal einfügte.
- Der Windows-Firewall-Hinweis, den `cloudflared` beim ersten Start auslösen kann.

scripts/vorposten.sh ist gelöscht; der Oracle-Weg passt nicht mehr zu den Randbedingungen dieses Projekts. Das Tutorial-Artefakt (derselbe Link wie zuvor) ist auf denselben Stand gebracht.

### Direkter cloudflared-Download als vollwertiger Weg, nicht nur Randnotiz

`8d9d97e`

Ein Nutzer traf genau den Fall: winget fehlt auf seinem Firmenrechner komplett ("wurde nicht als Name eines Cmdlet... erkannt"), vermutlich eine bewusste Einschränkung auf verwalteten Windows-Geräten.

Bisher stand dafür nur ein vager Verweis auf die Release-Seite von GitHub. Jetzt steht der tatsächliche Befehl da: Invoke-WebRequest lädt cloudflared.exe direkt in den Almanach-Ordner, wo findeCloudflared() in scripts/tunnel.mjs ohnehin danach sucht - kein PATH-Eintrag nötig. Dazu der Hinweis auf die SmartScreen-Seite, die bei frisch heruntergeladenen Programmen erscheinen kann.

## 12. September 2026

### Zurück auf den Schnelltunnel – ein Commit, ein Revert für alles

`28bf127`

Sieben Commits haben in dieser Sitzung versucht, eine feste Domain draufzusetzen (Cloudflare → Tailscale → Oracle-Vorposten → Cloudflare mit winget/PowerShell-Feinschliff). Für den Alltag am Spieltisch ist das gerade zu viel auf einmal: Ein Mitspieler kommt schon mit dem Schnelltunnel klar, und die Cloudflare-Einrichtung braucht noch Zeit (Nameserver, Tunnel, Token).

Dieser eine Commit macht den Baum wieder exakt zu dem, was er vor 76f5293..HEAD war – geprüft per `git diff 76f5293 -- .`, keine Abweichung. Der Grund für den Squash-Revert statt sieben einzelner Reverts: Wer die feste Domain später doch will, braucht dafür nur einen einzigen Befehl:

git revert <dieser-commit>

und der ganze Cloudflare-Unterbau (domaene.js, umgebung.js, benannter Tunnel in tunnel.mjs, docker-compose-Profil, .env.example, Einrichtungs-Handbuch 6.5, tunnel.cmd/tunnel.sh) ist mit einem Commit wieder da – nichts geht verloren, nichts muss neu geschrieben werden.

Das Tutorial-Artefakt bleibt online und unverändert; es beschreibt weiterhin den Cloudflare-Weg für den Tag, an dem er zurückkommt.

### Revert "Zurück auf den Schnelltunnel – ein Commit, ein Revert für alles"

`3e21bf4`

This reverts commit 28bf1271ff520eb588a39c816c2dfacb29c1c94f.

## 14. September 2026

### Kampagnen: Datenmodell, Sitzung und Backend-Routen umgestellt

`55ebef0`

Eine Runde, mehrere Kampagnen: Konten und Anmeldung bleiben rundenweit gemeinsam, aber Charaktere, Chronik, Spieltisch, Karten, Beute und Chat gehören jetzt zu genau einer Kampagne. Wer mehreren angehört, wählt nach der Anmeldung die aktive – festgehalten in der eigenen Sitzung, nicht im Konto.

- campaigns/campaign_members-Tabellen, campaign_id auf allen Spieldaten-Tabellen, bestehende Installationen wandern automatisch in eine "Erste Kampagne" (samt app_state wie Beute und aktiver Szene).
- Neue Route campaigns.js: anlegen (jede Spielleitung selbst), auflisten, wechseln, Mitglieder verwalten.
- Jede bestehende Route filtert jetzt nach der aktiven Kampagne; der Live-Kanal (SSE) sendet Ereignisse nur noch an Fenster derselben Kampagne.
- Die zwölf Vorlagen-Charaktere säen sich jetzt je neu angelegter Kampagne statt einmalig beim Serverstart.

### Kampagnen: Auswahl, Wechsler und Mitgliederverwaltung in der Oberfläche

`02a8817`

Nach der Anmeldung steht eine Weiche: mit nur einer Kampagne geht es direkt zum Almanach, sonst wählt man erst. Ein Wechsler im Rahmen (nur sichtbar, wenn es etwas zu wechseln gibt) erlaubt den Sprung jederzeit; die Spielleitung kann von dort auch gleich neue Kampagnen eröffnen. Wer noch in keiner Kampagne steht, bekommt eine klare Ansage statt eines toten Endes.

Im Spielleitung-Board (Reiter „Runde") lässt sich jetzt auch festlegen, welche der rundenweiten Konten an der jeweils aktiven Kampagne beteiligt sind.

Per Playwright-Testlauf gegen den echten Server durchgespielt: erste Anmeldung, Kampagne anlegen, wechseln, Einladung, Mitglied hinzufügen, erneute Anmeldung als Spieler – keine Konsolenfehler.

### Kampagnen löschen: Namensabfrage, Papierkorb, 30 Tage Frist

`04c71ab`

Löschen darf nur, wer die Kampagne angelegt hat, und nur, wer ihren Namen abtippt. Danach ist sie nicht fort, sondern weggeräumt: Sie verschwindet aus allen Listen und aus laufenden Sitzungen, ihre Daten bleiben 30 Tage liegen und lassen sich mit einem Klick zurückholen.

Erst nach Ablauf der Frist – beim Serverstart und beim Blick in den Papierkorb geprüft – oder auf ausdrücklichen Knopfdruck mit erneuter Namensabfrage wird wirklich alles entfernt: Charaktere, Chronik, Szenen, Karten, Beute, Klänge und die hochgeladenen Bilddateien auf der Platte.

Durchgespielt gegen den echten Server: falscher Name sperrt den Knopf, Löschen der offenen Kampagne wirft sauber in die Auswahl zurück, Zurückholen stellt alles wieder her, endgültiges Löschen räumt Datenbank und Bilddateien restlos ab, und eine 31 Tage alte Kampagne verschwindet beim Start von selbst.

### Löschen: sagen, wer darf, statt den Knopf wortlos zu verstecken

`2e86554`

Wer eine Kampagne nicht angelegt hat, sah bisher gar nichts – kein Knopf, kein Hinweis, kein Weg zu verstehen, warum. Jetzt steht der Abschnitt auch dort, nennt aber den Namen dessen, der sie löschen darf.

### Fehlende Bilddateien beim Namen nennen

`0ff5649`

Beim Umzug auf ein anderes Gerät bleibt der Ordner "medien" leicht zurück oder landet eine Ebene zu tief. Bisher stand dann jeder Eintrag noch in der Datenbank, der Spieltisch blieb aber wortlos leer – und niemand konnte sehen, warum.

Jetzt sagt es der Server beim Start (wie viele Bilder fehlen und wo er sie erwartet) und beim einzelnen Abruf im Protokoll.

## 15. September 2026

### Charaktere in andere Kampagnen kopieren – nur die Spielleitung

`1af9f58`

Dieselben Helden in einer neuen Geschichte, oder ein NSC, der ein zweites Mal auftritt: Auf jedem Blatt steht für die Spielleitung „In Kampagne …“, dahinter die eigenen Kampagnen zur Auswahl.

Kopiert, nicht verschoben – das Blatt bleibt, wo es ist, und beide gehen danach getrennte Wege. Angeboten werden nur Kampagnen, in denen die Spielleitung selbst sitzt. Der Besitzer zieht mit, sofern er dort ebenfalls mitspielt, sonst fällt das Blatt an die Spielleitung.

Bildnisse stecken als Daten-URL im Blatt und wandern von allein mit; die alte miniMediaId aus der entfernten Figurenschmiede zeigt dagegen auf eine Datei und bekommt in der Zielkampagne eine eigene Abschrift – sonst zeigte die Kopie ins Leere.

### Kartenbibliothek gehört der Runde, nicht der einzelnen Kampagne

`3061d31`

Eine Karte ist Vorbereitung: ein Bild samt einmal ausgerichtetem Raster. Diese Arbeit für jede neue Geschichte zu wiederholen, wäre unsinnig – dieselbe Taverne steht überall gleich da. Bibliothek und Bilddateien sind deshalb rundenweit gemeinsam.

Getrennt bleibt, was daraus im Spiel wird: Die Szene auf dem Tisch – mit Nebel und Figuren – gehört weiter zu genau einer Kampagne. Dieselbe Karte in zwei Geschichten aufzulegen ergibt zwei Szenen, die nichts voneinander wissen; der Szenenzähler in der Bibliothek zählt nur die eigene Kampagne.

Damit darf das endgültige Löschen einer Kampagne Karten und Bilder nicht mehr mitnehmen – sonst risse eine beendete Geschichte der Runde ihre Vorbereitung weg. Die Texte an den Löschknöpfen sagen das jetzt auch.

Durchgespielt: Karte in Kampagne 1 hochgeladen, in Kampagne 2 vorhanden und auflegbar (eigene Szene), Bild in beiden abrufbar – und nach dem endgültigen Löschen von Kampagne 2 liegen Karte und Datei unversehrt da.

### Auch Bestiarium, Begegnungen und Klang gehören der Runde

`736d738`

Dieselbe Trennlinie wie bei den Karten, konsequent zu Ende gezogen: Was die Spielleitung einmal anlegt und immer wieder braucht, gehört der ganzen Runde – ein Goblin bleibt ein Goblin, „Wache am Stadttor“ lässt sich überall stellen, und die Tavernenmusik passt in jede Geschichte.

Was daraus im Spiel wird, bleibt dagegen bei genau einer Kampagne: die Kämpfer im Kampf, die Szene auf dem Tisch, der Klang, der gerade aufliegt.

Notizen und Charaktere bleiben bewusst kampagnengebunden. Ein Handzettel gehört zu dieser Geschichte (und würde sonst plötzlich in allen Runden ausliegen), und Charaktere entwickeln sich getrennt weiter – für die gibt es seit Kurzem das Kopieren.

Damit nimmt das endgültige Löschen einer Kampagne auch diese drei nicht mehr mit.

Durchgespielt: je ein Eintrag in Kampagne 1 angelegt, in Kampagne 2 alle drei vorhanden; eine dort gestellte Begegnung erzeugt Kämpfer nur in Kampagne 2 (2 gegen 0); nach dem endgültigen Löschen von Kampagne 2 steht die ganze Vorbereitung unversehrt da.

### Zwei Almanache nebeneinander: sagen, welcher spricht – und nie beide

`74689f4`

Wer einen zweiten Ordner zum Ausprobieren betreibt, steht vor zwei gleich aussehenden Fenstern. Der Start nennt deshalb jetzt den Datenordner: Daran sieht man auf einen Blick, welcher Almanach gerade antwortet.

Und wenn der Port schon belegt ist – der andere läuft also noch –, gibt es statt eines Stapelauszugs eine klare Ansage. Das ist keine Kosmetik: Über die Domain wird ausgeliefert, wer den Port hat, und zwei gleichzeitig wären ein Würfelspiel darüber, welche Fassung die Runde zu sehen bekommt.

### Alles, was einer Kampagne gehört, in eine andere kopieren

`7e65dc8`

Bisher konnte nur ein Charakterblatt hinüberwandern. Jetzt geht es für alles, was zu einer Geschichte gehört: Handzettel, Szenen samt Figuren und Nebel, Fundstücke aus der Beutekiste – einzeln über „In Kampagne …“ oder auf einen Schlag über „Alles in eine andere Kampagne“ unter Spielleitung → Runde.

Die Vorbereitung taucht dabei bewusst nicht auf: Karten, Bilder, Bestiarium, Begegnungen und Klang gehören ohnehin der ganzen Runde und stehen drüben schon. Würfe, Chat und Chronik bleiben ebenfalls hier – die gehören zu den Abenden, an denen sie geschahen, und wären anderswo eine Fälschung.

Drei Entscheidungen, die es wert sind, aufgeschrieben zu werden:

- Verweise auf Charaktere (Figuren auf der Karte, getragene Gegenstände) suchen drüben den gleichnamigen Charakter. Wer zuerst die Runde kopiert und dann die Szene, bekommt seine Helden wieder auf die Karte.
- Münzen werden dazugelegt, nicht ersetzt – was drüben liegt, darf ein Kopiervorgang nicht verschlucken.
- Beim Umzug „alles auf einmal“ bleiben unberührte Vorlagen zurück: Jede Kampagne bringt dieselben zwölf von selbst mit.

Nebenbei: Der Vertragsdurchgang kannte die Kampagnen noch nicht und brach seit dem Umbau mittendrin ab. Er legt jetzt eine an, holt die Runde hinein und prüft das Kopieren gleich mit – 230 Prüfungen, alle bestanden.

### Nebel in Bahnen statt Feld für Feld: Pinselbreite und Rechteck

`9b421b1`

Einen Saal mit einem 1×1-Pinsel aufzudecken dauerte eine Minute. Jetzt steht neben „Aufdecken“ und „Verhüllen“ die Pinselbreite – 1×1, 3×3, 5×5, 7×7 – und daneben ein Rechteck, das man über Saal oder Gang aufzieht und mit dem Loslassen öffnet. Beim Aufziehen steht dabei, wie viele Felder es werden.

Dazu zwei Dinge, ohne die das Breitere nichts taugt:

- Eine Vorschau unter dem Zeiger zeigt vorher, was der Strich trifft – golden beim Aufdecken, rot beim Verhüllen. Ohne sie wäre ein 5×5-Pinsel ein Ratespiel, bei dem man erst hinterher sieht, was man erwischt hat.
- Zwischen zwei Bildern springt der Zeiger bei einem schnellen Strich über mehrere Felder. Die Strecke dazwischen wird jetzt mitgemalt; bisher blieb eine Perlenkette stehen. Ein einziger Sprung über zwölf Felder deckt nachweislich zwölf Felder auf, nicht zwei.

Die Werkzeugleiste zeigt die Breite nur, solange einer der beiden Nebelgriffe gewählt ist – sonst wären es fünf Knöpfe mehr in einer ohnehin vollen Leiste. Am Server ändert sich nichts: Der Weg für den Nebel nahm schon immer eine Liste von Feldern entgegen.

## 19. September 2026

### Eine Kampagne umbenennen, ohne in der Datenbank zu stochern

`39b0c33`

Anlegen, wechseln, wegräumen kann der Almanach – umbenennen nicht. Wer sich beim Namen vertan hat, musste bisher selbst an die SQLite-Datei. Dieses Skript fasst genau ein Feld an und sonst nichts:

node backend/scripts/umbenennen.mjs "Alter Name" "Neuer Name"

Ohne Argumente zählt es die vorhandenen Namen auf, damit man sie abschreiben kann; es prüft dieselbe Namenslänge wie die Oberfläche, erkennt auch die Kennung statt des Namens und sagt es, wenn der Name zweimal vergeben ist.

Der Server darf dabei weiterlaufen: Der Name hängt an nichts weiter – Charaktere, Szenen und Beute zeigen auf die Kennung der Kampagne, nicht auf ihren Namen. Im Browser genügt danach ein Neuladen.

## 28. September 2026

### comment fix

`ea6fd9f`

### Kampagnen umbenennen, ohne die Kommandozeile

`5284dcf`

Unter Spielleitung → Runde steht jetzt „Diese Kampagne umbenennen“, direkt über dem Löschen und ohne dessen rote Umrandung: Es ist der harmlose der beiden Eingriffe. Der Name hängt an nichts – Charaktere, Szenen und Beute zeigen auf die Kennung der Kampagne, nie auf ihren Namen –, deshalb gibt es auch nichts nachzuziehen und kein Abtippen zur Bestätigung.

Bestimmen darf, wer die Kampagne angelegt hat, wie beim Löschen auch. Der Wächter hieß darfLoeschen und regelt jetzt beides, also heißt er darfVerwalten; die Oberfläche bekommt das Merkmal unter demselben Namen und sagt den anderen, wer stattdessen dürfte.

Das Skript backend/scripts/umbenennen.mjs bleibt als zweiter Weg – für den Fall, dass kein Browser zur Hand ist oder niemand mehr hineinkommt, der die Kampagne angelegt hat.

Geprüft: Umbenennen greift, die Habe der Kampagne bleibt unberührt, der Löschen-Kasten verlangt danach den neuen Namen und der alte gilt nicht mehr. 242 Prüfungen im Vertragsdurchgang.

### Kommentare: das Fundament der Oberfläche

`8a90f02`

main.jsx, App.jsx und die lib-Schicht – Anmeldung, Live-Draht, Datenhaken, API-Klient und die kleinen Helfer. Erklärt ist jeweils nicht, *was* eine Zeile tut, sondern warum sie so dasteht: warum der Live-Draht kein Polling ist, warum setPath kopiert statt zu ändern, warum 'credentials: same-origin' die wichtigste Zeile in api.js ist und was der key={activeId} in App.jsx verhindert.

### Kommentare: die Seiten

`48ceea5`

Jede Seite sagt jetzt oben, was sie ist, für wen sie da ist und wie sie in den Rest greift. Dazu die Stellen, die man sonst falsch versteht: das verzögerte Speichern am Charakterblatt, warum needsSetup die Anmeldung überstimmt, warum das Kompendium über unseren Server geht und weshalb die Knöpfe auf einer Blattkarte den Klick anhalten müssen.

### Kommentare: die Bauteile der Oberfläche

`364fe26`

Layout, Kampfliste, Würfelbeutel, Chat, die fünf Reiter des Charakterblattes, der Spieltisch und der Schirm der Spielleitung. Jedes Bauteil sagt jetzt oben, was es ist und wie es in den Rest greift.

Ausführlicher dort, wo man sonst rät: die drei Koordinatensysteme im Board, warum setPointerCapture eine gezogene Figur rettet, der Unterschied zwischen Karte und Szene, warum RepeatingRows eigene Kennungen vergibt und weshalb Konten der Runde gehören, alles Gespielte aber einer Kampagne.

### Kommentare: der Server und die letzten Innenteile

`4cc34de`

Datenbank, Anmeldung und jeder Zweig der API tragen jetzt einen Kopf, der sagt, worum es geht und welche Entscheidung dahintersteht: warum SQLite, warum Kennwörter gehasht und Sitzungen nur als Hash gespeichert werden, warum der Kampf zwei Sichten hat, warum Bilder als Dateien neben der Datenbank liegen und was Nebel von Sicht unterscheidet.

Dazu eine Zeile für jedes innere Bauteil der Oberfläche, das bisher ohne Erklärung dastand.

### Eine Landkarte für alle, die am Code arbeiten

`1620acf`

docs/CODE.md beantwortet, was Kommentare in einzelnen Dateien nicht können: Wo fange ich an zu lesen? Sechs Dateien in einer Reihenfolge, nach der man das Gerüst verstanden hat. Dazu die Vokabeln (Runde gegen Kampagne, Karte gegen Szene, Nebel gegen Sicht), ein Weg einer gezogenen Figur durch alle sieben Schichten und die Regeln des Hauses – der Server ist die Wahrheit, Schlüssel statt Sätze, Kommentare sagen warum.

Dazu die Falle, in die jeder einmal tappt: git pull allein ändert nichts, weil backend/public beim Bauen entsteht und nicht im Git liegt.

### CSS gehört in .css-Dateien, JavaScript in .js-Dateien

`8764dfd`

Vier Stellen, an denen das eine im anderen steckte:

- frontend/index.html trug ein <script> im Kopf. Es liegt jetzt als public/aussehen.js daneben – weiterhin ohne type="module", weil es genau deshalb dort steht: Es muss laufen, bevor gezeichnet wird, sonst blitzt der Start im Kerzenlicht hell auf.
- blattAusfuhr.js trug 72 Zeilen CSS als Zeichenkette. Sie liegen jetzt in blattAusfuhr.css und kommen beim Bauen über `?raw` herein – im Editor richtiges CSS, in der ausgeführten Datei weiterhin eingebettet, denn die soll ohne Netz und ohne Almanach funktionieren.
- drucksatz.mjs ebenso, über ein gewöhnliches Dateilesen (Node kennt kein `?raw`). Der Erklärkopf beider Stilblätter wird beim Einlesen abgeschnitten – er richtet sich an Mitarbeitende, nicht an Leser.
- index.css war eine Datei mit allem darin. Jetzt ist sie ein Inhaltsverzeichnis, und die Regeln stehen in stile/: schriften, farben, grundlage, bauteile, spieltisch, eigenheiten.

Dazu die statischen style={{…}} im JSX. Unterschieden wurde nach einer klaren Regel: Die *Regel* gehört ins Stilblatt, der *Wert* darf im JSX bleiben. Ein Rasternetz wird immer gleich gezeichnet – wie groß seine Felder sind, weiß erst die Karte. Übergeben wird das über eigene Eigenschaften (--feld, --anteil, --strichstaerke). Wo jemandes Farbe oder die Lage einer Figur eingesetzt wird, bleibt es inline; das ist kein Versäumnis, sondern die einzig mögliche Stelle.

Geprüft: Nebelpinsel und Rechteck unverändert (25 / 96 / 9 Felder), das ausgeführte Charakterblatt trägt sein Stilblatt und sieht aus wie zuvor, Druckfassung baut, 242 Prüfungen im Vertragsdurchgang.

### Atomarisiert: die Runde und der Spieltisch

`cce166d`

Zwei Dateien, die je ein halbes Dutzend Dinge auf einmal taten, sind jetzt je ein Dutzend Dateien, die eines tun.

Party.jsx (673 Zeilen) → components/dm/runde/, neun Teile: Einladungen, Kampagnenmitglieder, Umzugsgut, Konten, Charakterzuweisung, WerBestimmt, KampagneUmbenennen, KampagneLoeschen, Papierkorb. Der Block, der Umbenennen, Löschen und Papierkorb in einer Funktion mit sieben Zustandsvariablen vermengte, ist damit vier Bauteile mit je eigenem Zustand – ein Fehler beim Löschen kann nicht mehr über dem Umbenennen stehen. Die reine Satzrechnung („2 Charaktere und 1 Szene“) hat kein JSX und liegt deshalb als .js daneben. Party.jsx selbst ist auf die Reihenfolge zusammengeschrumpft.

Board.jsx (644 Zeilen) → neun Teile. Die Ansicht (Maßstab, Verschiebung, Rad, Kneifen) und der Pinselabdruck (welche Felder ein Strich trifft) sind jetzt Haken in eigenen .js-Dateien, ohne eine Zeile JSX. Nebelschicht, Figur, Rasternetz, Nebelvorschau, Lineal und Zeigefinger zeigen je eine Sache. Board selbst tut nur noch zweierlei: Zeigerereignisse deuten und die Teile übereinanderlegen.

Verhalten unverändert, und das ist nachgemessen: Pinsel 25 / 96 / 9 Felder wie zuvor, ein Sprung über zwölf Felder malt zwölf ohne Lücke, eine gezogene Figur schnappt aufs Raster (420,280), Rad zoomt 55→61 %, das Lineal sagt „9 Felder · 45 Fuß“. Alle sieben Abschnitte der Runde stehen und arbeiten. 242 Prüfungen im Vertragsdurchgang.

### Atomarisiert: Spieltisch und Datenbank auf dem Server

`bf9e962`

routes/scenes.js (702 Zeilen) war die anspruchsvollste Datei des Servers und tat drei verschiedene Dinge. Jetzt:

spieltisch/umwandlung.js    Zeilen in Objekte, die Nachschlagefragen spieltisch/sichtbarkeit.js  wer sieht was – die Kernfrage spieltisch/melden.js        wer erfährt wann davon routes/scenes.js            nur noch die Wege

Die Sichtbarkeit liegt jetzt für sich, und das ist mehr als Ordnung: Sie wird auch von anderen Wegen gebraucht (ein Nebelstrich deckt eine Figur auf, ein geändertes Blatt ändert die Sichtweite). Eine Rechnung an zwei Stellen ist an einer davon irgendwann falsch – und „falsch“ hieße hier: Die Runde sieht den Hinterhalt.

db.js (484 Zeilen) ebenso, entlang der vier Schritte beim Start:

datenbank/verbindung.js          SQLite öffnen, zwei Wege dorthin datenbank/schema.js              jede Tabelle, wie sie neu entsteht datenbank/nachruesten.js         was später dazukam datenbank/kampagnenwanderung.js  der eine Schritt, der mehr tut db.js                            bringt sie in die Reihenfolge

Beim Umzug von verbindung.js in einen Unterordner rutschte der Datenordner eine Ebene zu hoch – das hätte stumm eine zweite, leere Datenbank angelegt. Gefunden und berichtigt, mit einem Kommentar an der Stelle.

Zwei vergessene Einfuhren hat der Vertragsdurchgang gefunden, bevor sie jemanden erreichen konnten. Danach: 242 Prüfungen bestanden.

Zusätzlich eigens geprüft, was der Vertragsdurchgang nicht abdeckt, weil er mit leerer Datenbank beginnt: der Umzug einer *alten* Datenbank ohne Kampagnen. Er legt „Erste Kampagne“ an, ordnet alle 13 Blätter zu, benennt die app_state-Schlüssel um – und die 77 Gold der Runde liegen danach wieder in der Kiste.

### Atomarisiert: die Regeln von D&D 5e

`2a5af70`

lib/dnd5e.js (529 Zeilen) trennte nicht zwischen Listen und Rechnungen. Jetzt fünf Teile in lib/regeln/:

listen.js       Attribute, Fertigkeiten, Zustände, Erschöpfung masse.js        Fuß und Meter, Pfund und Kilogramm blattfelder.js  Aktionsarten, Merkmale, Aussehen, Erfahrung rechnen.js      was das Regelwerk ausrechnen lässt leeresBlatt.js  ein frisches Blatt – und alte auf neuen Stand

dnd5e.js ist das Inhaltsverzeichnis dazu und reicht alles weiter, damit die dreißig Stellen, die daraus einfuhren, unverändert bleiben.

Zwei Einfuhren fehlten nach dem Schnitt. Die Rechenprobe des Blattes hat sie gefunden: 340 Prüfungen, alle bestanden. Dazu 242 im Vertragsdurchgang, das ausgeführte Blatt unverändert, Nebel und Figuren nachgemessen.

### Atomarisiert: der Kampfreiter – und eine Probe gegen vergessene Einfuhren

`791bbed`

CombatTab.jsx (650 Zeilen) → sechs Teile in components/sheet/kampf/: felder.js (die Spalten der wiederkehrenden Zeilen, reine Daten), Todeszeichen, Wurfknopf, Trefferwuerfel, Standardaktionen, Ressourcen. CombatTab hält nur noch die Karten zusammen und die beiden Rechnungen, die nirgends sonst hingehören: Rettungswurf gegen den Tod und Konzentrationsprobe.

Wichtiger als das ist das Werkzeug, das dabei entstanden ist. Beim Zerlegen passiert immer wieder dasselbe: Eine Funktion wandert in eine neue Datei, die import-Zeile bleibt zurück. Der Bau merkt davon nichts – für ihn ist ein unbekannter Name eine globale Variable, die es zur Laufzeit schon geben wird. Auffallen tut es erst am weißen Fenster. Sieben solcher Lücken sind mir in dieser Sitzung untergekommen, jede von Hand gefunden.

npm run einfuhrprobe

sammelt, was der Almanach irgendwo ausführt, und meldet jede Datei, die einen dieser Namen benutzt, ohne ihn einzuführen oder selbst zu erklären. Ohne zusätzliches Paket (ein JSX-Parser liegt nicht bei), dafür eng gefasst: Nur Namen, die es wirklich gibt, werden betrachtet. Nachgewiesen an beiden echten Fällen dieser Sitzung – und auf dem heutigen Stand meldet sie nichts: 132 Dateien, alle Einfuhren gehen auf.

Geprüft: 242 Prüfungen im Vertragsdurchgang, 340 in der Blattprobe, alle acht Karten des Kampfreiters stehen, Trefferpunkte werden gespeichert (7/10), der Rettungswurf gegen den Tod läuft über den Server.

### Atomarisiert: die Blattausfuhr – und die Einfuhrprobe sieht jetzt in Vorlagen

`8227ada`

Die Blattausfuhr lag als eine Datei mit 615 Zeilen da. Jetzt sind es vier, und jede hat eine Aufgabe:

blatt/werkzeug.js    entschärfen, einrahmen, Bilder einbetten blatt/abschnitte.js  je eine Funktion für je eine Karte des Bogens blatt/koerper.js     welche Karte in welcher Reihenfolge blattAusfuhr.js      das Dokument zusammensetzen und herunterladen

Verschoben, nicht umgeschrieben: Alle 29 Einheiten stehen Zeichen für Zeichen so da wie vorher – nachgemessen im Vergleich mit der alten Fassung.

Dabei fiel der Einfuhrprobe etwas Grundsätzliches auf: Sie hatte Vorlagen mit Gegenstrichen bisher vollständig weggeworfen – samt dem Code, der in `${…}` darin steckt. Ausgerechnet in der Blattausfuhr steht davon am meisten. Statt einer Handvoll Ersetzungen liest jetzt ein kleiner Leser Zeichen für Zeichen durch die Datei und weiß, wo er gerade ist: in Code, in einem Kommentar, in einer Zeichenkette, in einem Suchmuster oder im Text einer Vorlage.

Das förderte gleich fünf vergessene Einfuhren zutage, die kein Bau gemeldet hätte:

blatt/koerper.js    formatModifier, passiverWert, zeilen, zauberblock runde/Umzugsgut.jsx stueck

Die letzte war ein echter Fehler für die Spielleitung: Nach einem gelungenen Umzug in eine andere Kampagne wäre der Bericht abgestürzt – also genau dann, wenn alles geklappt hat.

Dazu drei kleinere Berichtigungen an der Probe: JSX-Eigenschaften (`feld={g}`) sind keine Benutzung, Zerlegungen mit geschweiften Klammern darin werden vollständig gelesen, und die Kurzschreibweise für Methoden (`async protokoll(id) {`) ist eine Erklärung, kein Aufruf.

Geprüft: Bau, Vertrag (242), Blattprobe (340), Einfuhrprobe (135 Dateien), und im Browser die Ausfuhr zweier Blätter – Übungsbonus „+2“, Passive Wahrnehmung „12“, Zauberliste da – sowie ein vollständiger Umzug in eine andere Kampagne ohne Seitenfehler.

### Atomarisiert: die Werkzeugleiste des Spieltisches

`4dc5d49`

SceneBar.jsx waren 567 Zeilen, in denen vier voneinander unabhängige Dinge lagen. Jetzt stehen sie einzeln in tabletop/leiste/ und SceneBar setzt nur noch zusammen:

leiste/Vorhangriegel.jsx  der rote Riegel, wenn der Vorhang zu ist leiste/Werkzeuge.jsx      Bewegen, Aufdecken, Verhüllen, Messen, Zeigen samt Pinselbreite und NSC-Sicht leiste/Rasterfeld.jsx     Feldgröße, Versatz, Maßstab, dunkle Szene leiste/Szenenlade.jsx     neue Szene anlegen, auflegen, kopieren, löschen leiste/Knopf.jsx          der gemeinsame Leistenknopf

Damit wandert auch der Zustand dorthin, wo er hingehört: Was nur die Lade angeht – der Name der neuen Szene, ihre Feldmaße, ob gerade hochgeladen wird –, steht jetzt in der Lade. In SceneBar bleiben die drei Dinge, die mehr als einen Teil angehen: ob Rasterfeld und Lade offen stehen, die Fehlermeldung (das Rasterfeld schreibt hinein, die Lade zeigt sie) und die beiden Listen aus der Datenschicht.

Geprüft im Browser am laufenden Tisch: alle fünf Werkzeuge da, die Pinselbreiten erscheinen weiterhin nur beim Nebelwerkzeug, eine geänderte Feldgröße überlebt das Neuladen (70 → 80), die Szenenlade listet auf, und kein Seitenfehler. Dazu Bau, Vertrag (242) und Einfuhrprobe.

### Atomarisiert: die Kartenbibliothek – und kein totes Gepäck mehr

`e60b98e`

Kartenbibliothek.jsx waren 475 Zeilen, in denen drei Dinge steckten: das Regal, das einzelne Blatt und die Kachel in der Übersicht. Jetzt:

karten/Kartenkachel.jsx    eine Karte in der Übersicht, mit ihren drei Griffen (auflegen, frisch, wegwerfen) karten/Kartenblatt.jsx     die aufgeschlagene Karte: Name, Schlagworte, Raster, Maßstab, Klangteppich karten/Rastervorschau.jsx  das Gitter über dem Vorschaubild Kartenbibliothek.jsx       das Regal: hochladen, suchen, auflegen

Dazu ausgekehrt, was beim Zerlegen liegen geblieben war: zehn Einfuhren, die niemand mehr benutzt hat. Die Einfuhrprobe findet nur fehlende, nicht überzählige – dafür ist oxlint da, und der lief hier einmal über alles.

Geprüft im Browser: Karte hochgeladen, Kachel da, Blatt aufgeschlagen, Rastervorschau mit Gitter und Maßsatz („19 × 37 Felder, also 95 × 185 Fuß“), umbenannt und gesichert – der neue Name steht nach dem Neuladen noch da –, Suche ohne Treffer sagt es. Kein Seitenfehler. Dazu Bau, Vertrag (242), Blattprobe (340), Einfuhrprobe (143 Dateien).

### Atomarisiert: die Datenschicht – und sie heißt jetzt .js, weil sie .js ist

`e6da104`

daten.jsx waren 438 Zeilen mit zwanzig Haken darin. Die Datei hatte ihre Abschnitte längst selbst markiert; entlang dieser Striche ist sie jetzt zerlegt – und geordnet nach der Regel, die im ganzen Almanach gilt: Was der Runde gehört, steht getrennt von dem, was einer Kampagne gehört.

daten/grundlage.js  useDaten – das Fundament, auf dem alle aufbauen daten/spieltisch.js Szene, Szenenliste, Zeigefinger, Kartenbibliothek daten/kampf.js      laufender Kampf, Bestiarium, Begegnungen daten/kampagne.js   Charaktere, Beute, Notizen, Chronik daten/runde.js      Konten, Einladungen, Klangteppich daten/gespraech.js  Würfelchronik und Chat daten.js            das Inhaltsverzeichnis samt Erklärung der drei Muster

Und aus .jsx wurde .js: In der Datei stand kein einziges Stück JSX. Die achtzehn Stellen, die sie einführen, sind mitgezogen; die Nachbarn auth.jsx, live.jsx und campaign.jsx behalten ihr x, denn die haben welches.

Geprüft im Browser, einmal quer durch alle Haken: 13 Charaktere auf dem Schreibtisch, 10 Figuren auf dem Tisch, alle sieben Reiter der Spielleitung, die Chronik, ein W20 landet sofort in der Wurfchronik und eine Chatzeile steht nach dem Neuladen noch da. Kein Seitenfehler. Dazu Bau, Vertrag (242) und Einfuhrprobe (149 Dateien), und die drei Handbücher zeigen wieder auf den richtigen Namen.

### Atomarisiert: die Wege des Spieltisches

`6d2a04b`

routes/scenes.js waren 423 Zeilen mit vier Sachgebieten. Express kann Teilwege ineinanderhängen – also tut die Datei jetzt genau das:

routes/spieltisch/szenen.js   anlegen, ändern, auflegen, löschen, Vorhang routes/spieltisch/nebel.js    Striche setzen, alles verhüllen, aufdecken routes/spieltisch/figuren.js  auslegen, schieben, wegnehmen, aus dem Kampf routes/spieltisch/zeigen.js   der Zeigefinger routes/scenes.js              der Wächter und die Reihenfolge

Die Reihenfolge ist dieselbe wie vorher im Fluss der Datei, und sie ist kein Zufall: Bei Express gewinnt der erste Weg, dessen Muster passt. `requireAuth` steht weiterhin einmal vorn und gilt für alle vier; wer Spielleitung sein muss, steht wie gehabt am einzelnen Weg.

Geprüft am laufenden Server: ein Klick mit dem 5×5-Pinsel deckt genau 25 Felder auf, ein schneller Strich mit 7×7 lässt keine Lücke, das aufgezogene Rechteck kündigt 10 × 8 an und öffnet 80, Verhüllen mit 3×3 schließt 9 wieder. Eine Figur schnappt beim Ziehen aufs Raster ein, das Lineal sagt „9 Felder · 45 Fuß“, der Zeigefinger leuchtet auf, und eine Szene lässt sich weiterhin in eine andere Kampagne kopieren (201). Dazu Vertrag (242) und Einfuhrprobe.

### Atomarisiert: der laufende Kampf

`8406b69`

routes/encounter.js waren 413 Zeilen, in denen Rechnen, Filtern und Wege durcheinanderlagen. Jetzt liegt jedes für sich:

kampf/umwandlung.js       Zeilen in Objekte, Reihenfolge, Zustand kampf/sicht.js            die zwei Sichten – der Kern des Ganzen kampf/blatt.js            Trefferpunkte zurück aufs Charakterblatt routes/kampf/kaempfer.js  eintragen, ändern, Schaden, Initiative, entfernen routes/kampf/ablauf.js    eine Runde weiter, zurück, von vorn, Runde holen routes/encounter.js       der Wächter, die Gesamtsicht, die Reihenfolge

- Der Grund ist derselbe wie beim Spieltisch: Was die Runde nicht sehen darf
- verborgene Gegner, die genauen Trefferpunkte eines Monsters –, wird an genau einer Stelle entschieden. Stünde die Filterung an zwei Stellen, wäre sie an einer davon irgendwann falsch, und dann weiß der Tisch, wie viel das Ungetüm noch aushält.

`sendeKampf` wohnt jetzt in kampf/sicht.js; die zwei Wege, die es von außen benutzen (encounters.js und library.js), zeigen dorthin.

Geprüft am laufenden Server, jeder Weg einzeln: Kämpfer eintragen, 5 Schaden (12 → 7), Zustand „liegend“, Initiative 19, Runde holen (2 Kämpfer), Initiative würfeln, ein Zug weiter und wieder zurück, entfernen, Kampf beenden. Dazu die Oberfläche der Spielleitung und der Rückweg aufs Blatt: 3 Schaden im Kampf machen aus 7/10 auf dem Charakterbogen 4/10. Vertrag (242), Einfuhrprobe (158 Dateien), oxlint ohne Fund.

### Atomarisiert: der Kampfreiter des Charakterblattes

`47dcdc4`

CombatTab.jsx waren 437 Zeilen mit acht Karten darin. Jetzt sind es 78, und die Datei tut nur noch, was ihr Name sagt: die Karten untereinander stellen. Jede bringt mit, was sie selbst braucht – auch ihren Zustand:

kampf/Kampfwerte.jsx     Rüstung, Initiative, Bewegung kampf/Trefferpunkte.jsx  TP, Trefferwürfel, Rettungswürfe gegen den Tod kampf/Rasten.jsx         kurze und lange Rast kampf/Zustand.jsx        Zustände, Erschöpfung, Konzentration kampf/Sinne.jsx          Widerstände, Sichtweite, Dunkelsicht kampf/Angriffe.jsx       Angriffe und Zaubertricks samt Würfelknöpfen

Die beiden Rechnungen, die der Reiter bisher selbst hielt, sind dorthin gewandert, wo sie hingehören: der Rettungswurf gegen den Tod zu den Trefferpunkten, die Konzentrationsprobe zum Zustand. Vier Zustandshaken weniger in der obersten Datei – und keine Meldung mehr, die durch drei Ebenen gereicht wird.

Im Kopf steht jetzt außerdem, was die drei Handgriffe unterscheiden, die durch alle Karten wandern: `data` ist das Blatt, `update` ändert ein Feld über seinen Pfad, `replace` ersetzt das ganze Blatt – und das braucht, wer mehrere Felder in einem Zug ändert, etwa eine Rast oder eine gewürfelte 20.

Geprüft im Browser am Blatt der Thalia Sturmwind: alle acht Karten da, eine geänderte Rüstungsklasse überlebt das Neuladen (10 → 17), der Zustand „Blind“ ebenso, das Schadensfeld der Konzentrationsprobe erscheint beim Einschalten, und der Rettungswurf gegen den Tod würfelt und meldet („6 gewürfelt: Fehlschlag.“). Kein Seitenfehler. Dazu Bau, Vertrag (242), Blattprobe (340), Einfuhrprobe (164 Dateien), oxlint ohne Fund.

### Atomarisiert: das Bestiarium

`1cd88c7`

Bestiary.jsx waren 423 Zeilen; drei Dinge darin hatten miteinander nichts zu tun. Jetzt:

bestiarium/Eintrag.jsx          eine Zeile, zugeklappt oder ganz offen bestiarium/Formular.jsx         eintragen und ändern bestiarium/AusDemKompendium.jsx die Abschrift aus der 5e-API bestiarium/felder.js            das leere Blatt und die sechs Attribute Bestiary.jsx                    das Regal: suchen, filtern, auflisten

Beim Herausschneiden der Zeile fiel gleich etwas auf: Sie las die Anzahl noch als `anzahl[e.id] ?? 1` aus der ganzen Karte, bekommt sie als Bauteil aber als einzelne Zahl. Ohne die Berichtigung wäre immer genau ein Gegner in den Kampf gewandert, ganz gleich, was im Feld davor stand.

Geprüft im Browser: Eintrag „Rostmilbe“ angelegt (RK 14, 27 TP), aufgeklappt, Anzahl 3 eingetragen – und im Kampf stehen „Rostmilbe 1“, „Rostmilbe 2“, „Rostmilbe 3“. Suche findet ihn, der Filter NSC nicht (er ist ein Monster), Löschen räumt ihn weg. Kein Seitenfehler. Dazu Bau, Vertrag (242), Einfuhrprobe (168 Dateien), oxlint ohne Fund.

### Atomarisiert: der Rahmen um jede Seite

`0c58904`

Layout.jsx waren 408 Zeilen, in denen fünf Dinge lagen. Jetzt sind es 119, und der Rahmen tut nur noch, was ein Rahmen tut: Kopfleiste, `<Outlet />`, die drei schwebenden Bauteile und die Fußleiste fürs Telefon.

rahmen/navigation.js        welche Wege es gibt – und für wen rahmen/KampagneSchalter.jsx zwischen den eigenen Geschichten wechseln rahmen/Konto.jsx            wer online ist, Hilfe, Kennwort, Abmelden rahmen/PasswortWechsel.jsx  das Kennwort ändern rahmen/Verbindung.jsx       der Punkt, der zeigt, ob der Draht steht

Geprüft im Browser: alle fünf Wege in der Leiste, das Aussehen wechselt von Pergament zu Kerzenlicht und bleibt nach dem Neuladen dabei, der Kampagnenschalter zeigt beide Geschichten und „Neue Kampagne“, das Kontomenü Hilfe, Passwort wechseln und Abmelden – und das Passwortformular öffnet sich. Der Verbindungspunkt ist da. Kein Seitenfehler. Dazu Bau, Vertrag (242), Einfuhrprobe (173 Dateien), oxlint ohne Fund.

### Spotify spielt jetzt im Almanach – und die ganze Runde hört dasselbe

`5060ead`

Bisher hat der Klangteppich nur gesagt, was dran ist; gehört wurde nebenan in Spotify. Jetzt läuft die Musik in der Seite selbst, und die Spielleitung gibt den Takt für alle Fenster.

Wie: über Spotifys eingebetteten Spieler. Der verlangt vom Almanach nichts – keinen Entwicklerschlüssel, keine Freischaltliste, kein Konto, kein Geld.

klang/spotifyRahmen.js  Spotifys Skript einmal je Fenster holen, und die eine kleine Rechnung, an der alles hängt klang/Klangspieler.jsx  der Spieler samt Gleichschaltung klang/Klangleiste.jsx   die Leiste unten links, jetzt mit Taktstock

Das Gleichschalten steckt in drei Feldern, die der Server mitschickt: `spielt`, `position` und `stand`. Jedes Fenster rechnet daraus selbst aus, wo es stehen müsste – `position + (jetzt − stand)` –, und zieht sich bei jeder Rückmeldung des Spielers ein Stück dorthin. Deshalb muss der Server nichts ticken lassen und nichts nachschicken, und wer eine Minute später dazukommt, findet die Stelle von allein. Die Spielleitung hat dafür drei Knöpfe: Anhalten, Weiter, Gleichziehen.

Drei Grenzen, und sie stehen in der Oberfläche, im Code und in allen vier Handbüchern – nicht versteckt, weil sie am ersten Abend auffallen:

- Jede und jeder muss einmal auf den Lautsprecher tippen. Kein Browser lässt eine Seite ungefragt Ton machen.
- Ohne angemeldetes Spotify-Premium im selben Browser gibt es 30-Sekunden-Ausschnitte. Das ist Spotifys Regel für eingebettete Spieler, nicht unsere; wer die Stücke ganz will, nimmt den Verweis.
- Bei einer Wiedergabeliste beginnt jeder beim ersten Stück: Von außen lässt sich nur die Stelle im laufenden Stück setzen, nicht das wievielte. Bei einem Titel oder Album stimmt sie auf die Sekunde.

Mithören ist freiwillig und wird je Gerät gemerkt – wer neben der Spielleitung sitzt, hört sie schon aus deren Lautsprecher.

Neu geprüft: `npm run klangprobe` (10 Prüfungen) nimmt sich die Rechnung vor, an der das Gleichschalten hängt – mitlaufende Zeit, Pause, fehlender Zeitstempel, eine Uhr, die nachgeht. Der Vertrag deckt den neuen Zweig ab (254 statt 242): Takt nur für die Spielleitung, Stelle wird beschnitten, jeder Schlag trägt einen neuen Zeitstempel, und was still ist, lässt sich nicht steuern (409).

Im Browser mit zwei Fenstern durchgespielt: Auflegen startet, „Anhalten“ kommt beim anderen an („angehalten“ steht da), „Weiter“ nimmt es zurück, „Gleichziehen“ setzt einen neuen Stand, „Stille“ räumt die Leiste weg. Eine frisch eingeladene Spielerin sieht Lautsprecher und Verweis, aber keinen der drei Taktknöpfe – und wird am Server mit 403 `nur_spielleitung` abgewiesen. Dass Spotify aus dieser Umgebung nicht erreichbar ist, hat die Probe gleich mitbewiesen: Der Spieler sagt es dann und lässt den Verweis stehen, statt eine leere Fläche zu zeigen.

### Farbwerte benannt statt verstreut – der letzte Rest von "inline CSS"

`7f279a4`

Die eigentliche CSS/JS-Trennung (eigene .css-Dateien, keine <style>- oder <script>-Blöcke im Code) war schon fertig. Was blieb, war feiner: über vierzig hartkodierte Hex-Farben im JSX, obwohl farben.css selbst die Regel vorgibt – "Alles in der Oberfläche greift auf diese Namen zu, nie auf einen Farbwert." Diese Sitzung zieht diese Regel nach, wo sie noch nicht galt. Vier echte Funde, keine erfundenen:

1. **Der Lebensbalken doppelt sich.** stile/spieltisch.css kennt schon `.figur-balken-gut`/`-schlecht` für die Figur auf dem Tisch – Initiative.jsx deklarierte dieselben zwei Farben ein zweites Mal inline, statt die Klasse zu benutzen. Jetzt teilen sich beide dieselbe Regel.

2. **Der Anfangsbuchstabe auf einem farbigen Kreis** (Konto, Beutel, Mitgliederliste, Portrait-Overlay, ungelesen-Abzeichen) stand in sieben Dateien als derselbe Wert `#f0dca8`, unbenannt. Jetzt heißt er `--marke-schrift`, an einer Stelle erklärt, überall referenziert.

- 3. **Der Tisch selbst** (die dunkle Fläche, ihre Beschriftungen, der Gold-/Rot-Akzent von Nebel und Lineal) ist mit Absicht immer gleich dunkel, ganz gleich ob Pergament oder Kerzenlicht gilt – wie eine echte Tischplatte unter beliebigem Deckenlicht. Das war schon so, stand aber als Zahl in bis zu vier Dateien gleichzeitig, und der Kommentar über den Nebel-Farben ("dieselbe Sprache wie in der Werkzeugleiste") stimmte technisch gar nicht
- zwei getrennte Kopien derselben Absicht. Jetzt gibt es dafür sechs benannte, dokumentierte Werte in spieltisch.css: `--tisch-grund`, `--tisch-leer`, `--tisch-schrift`, `--tisch-schrift-matt`, `--tisch-akzent-auf`, `--tisch-akzent-zu`.

4. **Der Ausweichwert für „keine Farbe gesetzt"** (Chat, Würfelbeutel, Wurfmeldung) war exakt die *helle* Fassung von `--color-faint` fest einprogrammiert – blieb also hell, auch im Kerzenlicht. Jetzt zeigt er auf die Variable und wechselt mit.

Dazu eine kleine Korrektur in lib/useTheme.js: Die Farbe der mobilen Browserleiste stand dort als *dritte* Abschrift von `--color-leather` (nach Pergament- und Kerzenlicht-Fassung in farben.css). Jetzt liest sie den tatsächlich berechneten Wert der Variable – ändert sich die Farbe in farben.css, folgt die Browserleiste von selbst, statt still zu veralten.

Bewusst **nicht** angefasst: die neun Tokenfarben in TokenPanel.jsx (eine Palette zum Auswählen, kein Duplikat von irgendetwas), die Typ-Farben in Initiative.jsx (eine Nachschlagetabelle, idiomatisches Tailwind) und eine Handvoll Werte, die genau einmal vorkommen (etwa die "gesichert"-Anzeige auf dem Blatt) – dort gibt es nichts zu vereinheitlichen, nur eine Zahl durch einen Namen zu ersetzen, der niemandem hilft.

Geprüft im Browser: `var()` löst sich in SVG-Attributen korrekt auf (Lineal-Linie, -Schrift, -Kontur alle exakt auf den erwarteten Farbwert), der Initiative-Balken trägt jetzt tatsächlich die geteilte Klasse, der Ausweichpunkt unterscheidet sich nachweislich zwischen den beiden Aussehen, und `--tisch-marke` sowie `--marke-schrift` bleiben unter Kerzenlicht exakt gleich – wie es sein soll. Dazu Bau, oxlint (0 Funde), Einfuhrprobe (176 Dateien), Vertrag (254), Blattprobe (340), Klangprobe (10).

### Code-Review: Fehler behoben, Server gehärtet, Kommentare auf Review-Niveau

`f1d0a71`

Ein vollständiger Durchgang durch Server und Oberfläche mit den Augen eines Reviewers. Die Befunde sind nachgewiesen: 18 der neuen Prüfungen im Vertrag schlagen am vorigen Stand an und halten jetzt.

- Fehler
- Live-Kanal: `beute`, `chronik`, `chronik:sitzung`, `chronik:geaendert` kamen in der Oberfläche nie an – die handgepflegte Ereignisliste in live.jsx war dem Server davongelaufen. Zuhörer melden sich jetzt selbst an der Quelle an; die Liste gibt es nicht mehr.
- TP am Blatt geändert: Der Server schickte `kampf:aktualisiert`, auf das niemand hörte; dafür lud jedes Fenster bei jedem gespeicherten Tastendruck an irgendeinem Blatt die Kampfliste neu. Jetzt zieht der Server nur veraltete Kämpfer nach und verschickt `kampf`.
- Beute auszahlen: Doppelt genannte Charaktere bekamen doppelten Anteil.
- PATCH /characters, PATCH /auth/users: schrieben einen Teil, bevor sie mit 403/400 abwiesen. Jetzt erst prüfen, dann schreiben.
- Erfundene Verweise (Figur→Blatt, Kämpfer→Blatt, Fund→Träger) und kaputte Begegnungseinträge liefen als 500 auf den Fremdschlüssel; jetzt 400 mit Schlüssel, und nur Verweise in die eigene Kampagne.
- Würfel: „d6d8“ und „1W20 5“ gingen als stille Summe bzw. W205 durch.
- Chronik: /sessions/:id/ende ignorierte die Kennung.
- Doppelte GET-Route im Kampf, doppelte PRAGMAs, Figurengedächtnis nicht je Kampagne getrennt, Szenensicht je Zug doppelt gerechnet.

- Sicherheit
- CORS mit Cookie für jede Herkunft entfernt (Vite reicht /api durch).
- Offene Live-Kanäle hörten nach Abmelden, Rollen- oder Kennwortwechsel, Löschen oder Entfernen aus der Kampagne weiter mit: `trenne()`.
- Der KI-Rückblick bekam verdeckte Einträge – und steht bei allen.
- Anmeldung: Namen ließen sich an der Antwortzeit erkennen; scrypt lief synchron auf dem einzigen Faden; die Bremse zählt jetzt vor dem Rechnen und räumt sich selbst auf.
- Kompendium: `%2e%2e` führte aus der API hinaus.
- Kaputtes Cookie → 500 auf jedem Weg; `Secure` vertraute X-Forwarded-Proto am `trust proxy` vorbei; Bildstrom ohne Fehlerhörer; Zeigefinger hinter dem Vorhang; Flüstern an Nicht-Mitglieder; X-Frame-Options.

- Aufbau
- transaktion() (SAVEPOINT, verschachtelbar) für jeden Weg, der mehr als eine Zeile schreibt – samt der Kampagnenwanderung.
- werte.js, beute.js, klang.js, asynchron.js statt fünf Abschriften von toNumber/clamp/Schlagworten und Wegen, die andere Wege importieren.
- Oberfläche: useDaten verwirft überholte Antworten; das Blatt speichert nicht mehr aus dem setState-Rückruf heraus; eine zentrale Meldung zeigt Absagen des Servers, die kein Knopf selbst behandelt.

- Prüfnetz
- `npm test` (Lint, Einfuhr-, Blatt-, Klangprobe, Vertrag) und `npm run lint` auch über Server und Werkzeuge; Linter mit begründeter Einstellung.
- Einfuhrprobe trennt Oberfläche und Server.
- Vertrag: 254 → 276 Prüfungen.

## 30. September 2026

### Kein Stil mehr im JSX: Regeln ins Stilblatt, im JSX nur noch Werte

`5289dad`

Wie etwas aussieht, steht jetzt ausnahmslos in stile/. Wo ein Wert erst im Browser feststeht – die Lage einer Figur, die selbst gewählte Farbe eines Kontos, wie voll ein Balken ist –, übergibt das JSX ihn als CSS-Variable; die Regel, die ihn einsetzt, steht im Stilblatt (lib/stilwerte.js erklärt das Muster und liefert px()/prozent()).

- 27 style={…}-Stellen umgestellt: Farbpunkte (.farbpunkt), Balken (.fuellstand), Figuren, Auswahlring, Zeigefinger, Nebelschicht, Nebelvorschau, Lineal, die Bühne des Spieltisches (.tisch-buehne).
- Die letzten rohen Farbwerte im JSX haben Namen bekommen (--color-ok, --art-held, --art-nsc, --tisch-figur-schrift, --tisch-hinweis-*).
- Das mitgenommene Charakterblatt: Druckknopf ohne onclick="…", das Skript steht in lib/blatt/drucken.js, der Fußsatz ohne style="…".
- scripts/stilprobe.mjs erzwingt das künftig (in npm test): findet am vorigen Stand 53 Stellen, jetzt keine.

Geprüft: pixelgenauer Vergleich alter gegen neuer Stand im Browser – Spieltisch (mit Auswahl, Lineal, Nebelvorschau, Zoom, Kerzenlicht), Kampfliste, Übersicht, Kontomenü: alle neun Ansichten identisch.

### Server atomar: große Dateien an ihren Nähten zerlegt

`5392ee0`

Jede Datei des Servers hat jetzt eine Aufgabe und bleibt unter 250 Zeilen (die zwölf Helden-Steckbriefe als reine Daten ausgenommen). Die bisherigen Dateien bleiben als Eingang stehen und reichen weiter, damit sich an keinem Import etwas ändert:

- vorlagen/helden.js      → vorlagen/helden/<schluessel>.js, je Held eine
- auth.js                 → anmeldung/{kennwort,sitzung,keks,waechter,konten}.js
- routes/auth.js          → routes/konten/{anmeldung,verwaltung,einladungen, drossel,regeln}.js
- routes/campaigns.js     → routes/kampagnen/{liste,mitglieder,umzug, papierkorb,regeln}.js
- routes/characters.js    → routes/charaktere/{blatt,lesen,schreiben, abschriften}.js
- routes/chronicle.js     → routes/chronik/{abfragen,sitzungen,protokoll, rueckblick}.js
- uebernehmen.js          → uebernehmen/{ziel,stuecke,arten,alles}.js
- sicht.js                → sicht/{raster,sinne,felder,bitkarte}.js
- datenbank/schema.js     → datenbank/schema/<bereich>.js
- server.js               → Startbericht in start/bericht.js

Die Einfuhrprobe kennt jetzt auch `export { … } from '…'`.

Geprüft: Vertrag 276/276; Heldendaten und Datenbankschema gegen den vorigen Stand verglichen – identisch; Startbericht und „Port belegt“ unverändert.

### Werkzeuge atomar: Vertrag in Kapitel, Tunnel in Teile zerlegt

`4becf4c`

Der Vertrag (scripts/vertrag.mjs) war ein einziger Durchgang von über tausend Zeilen. Er steht jetzt in neunzehn Kapiteln unter scripts/vertrag/, eines je Sachgebiet in der Reihenfolge eines Spielabends; das Werkzeug (Klient, pruefe, gleich, Urteil) liegt in vertrag/werkzeug.mjs. Die Kapitel reichen sich ihren Stand über `lage` weiter – dieselben 276 Prüfungen, dieselbe Reihenfolge.

Der Tunnel (scripts/tunnel.mjs) ist in Grundlagen, Anbieter, Anleitung, benannten und schnellen Tunnel geteilt. Alle drei Wege (unbekannter Anbieter, benannter Tunnel ohne cloudflared, schneller Tunnel) von Hand nachgeprüft: dieselben Meldungen wie vorher.

### Oberfläche atomar: große Dateien zerlegt, Kartenbibliothek repariert

`754c10c`

Jede Datei über 250 Zeilen ist an ihren Nähten geteilt; die Einfuhren von außen bleiben, wie sie waren (icons.jsx, api.js und blatt/abschnitte.js sind jetzt Sammelstellen):

- Initiative → initiative/ (Zeile, Lebensbalken, Wunden, Zustandswahl, NeuerKaempfer, arten.js)
- icons.jsx → icons/ nach Sachgebiet, gemeinsamer Rahmen in rahmen.jsx; das nie benutzte Symbol `Vine` ist entfallen
- SpellsTab → sheet/zauber/ (Zauberwirken, Zauberplaetze, Zaubersuche, Zaubereintrag, Zauberspalten, Kurzzeile, spalten.js)
- Help → pages/hilfe/ (ein Abschnitt je Thema)
- Chronicle → pages/chronik/ (Seitenkopf, Sitzungsliste, Sitzungskopf, Kapitel, Eintrag, Nachtrag, kapitel.js)
- CharacterSheet → pages/blatt/; Laden, Speichern und Live-Draht jetzt als Haken useBlatt.js, getrennt vom Aussehen
- Board → Zeigerlogik als Haken tabletop/useZeiger.js
- Tabletop → pages/tisch/ (Seitenleiste, LeererTisch, Handzettel, useNebelpinsel.js)
- Encounters → dm/begegnungen/ (Bauplan, Posten)
- Beute → beute/ (Muenzen, Teilen, Fundstueck, NeuerFund, muenzen.js)
- lib/api.js → lib/api/ (anfrage, konten, blatt, kampf, chronik, tisch)
- lib/blatt/abschnitte.js → abschnitte/ (werte, kampf, zauber, inventar, person)
- blattAusfuhr.css → lib/blatt/stil/ (fünf Teile in Kaskadenfolge)
- stile/spieltisch.css → stile/spieltisch/ (farben, flaeche, figuren, schichten)
- scripts/einfuhrprobe.mjs → einfuhrprobe/ (leser, namen); Dateisuche der Proben gemeinsam in scripts/gemeinsam/dateien.mjs

Fehler behoben: In der Kartenbibliothek riefen „Auflegen“, „frisch“ und das Löschen `onAuflegen(k)` bzw. `onLoeschen(k)` auf, ohne dass es ein `k` gab – jeder Klick endete mit „k is not defined“. Damit so etwas nicht wieder unbemerkt bleibt, prüft `npm run lint` jetzt überall `no-undef` (Oberfläche mit Browser-, Server und Werkzeuge mit Node-Umgebung, neue .oxlintrc.json im Wurzelverzeichnis).

Nachgewiesen: 48 Ansichten (alle Seiten, alle Reiter des Blattes und des Schirms, Tisch mit Lineal, Nebel, Zoom, beide Erscheinungsbilder) pixelgleich gegen den vorigen Stand; die mitgenommenen Blätter regel- gleich; Handgriffe (Speichern, Auflegen, Schaden, Nachtrag, Beute, Zauber) von Hand im Browser nachgespielt. npm test grün.

### Kommentare flächendeckend, und eine Probe, die darüber wacht

`6d3e89e`

Jede Quelldatei (347: Oberfläche, Server, Werkzeuge, Stilblätter) beginnt jetzt mit einem Kopfkommentar, der sagt, wozu es sie gibt; jede benannte Ausfuhr hat einen Kommentar direkt darüber. Nachgetragen wurden unter anderem:

- Dateiköpfe für 32 Dateien, die bisher mit den Einfuhren begannen – darunter vite.config.js (warum Kompendium, Blätter und Bilder je eigene Zwischenspeicher-Regeln haben) und copy-frontend.mjs
- fünf Bauteile der Runde (Konten, Einladungen, Mitglieder, Zuweisung, Umzugsgut), bei denen der Kommentar zwischen `export default` und `function` stand
- JSDoc für 91 Ausfuhren: Felder aus ui.jsx, die Rechenregeln (Modifikator, Übungsbonus, Maße), die Abschnitte der Blattausfuhr, die Zeilenumwandler und Hilfen des Servers
- ein verwaister Kommentarblock in brett/Figur.jsx entfernt, der einmal die ganze Tischdatei beschrieben hatte

Neu: scripts/kommentarprobe.mjs (in `npm test`). Sie prüft, dass jede Datei einen Kopf hat, jede Ausfuhr erklärt ist und jeder Dateipfad, den ein Kommentar nennt („siehe lib/rasten.js“), auch existiert – so veralten Verweise nach dem nächsten Umzug nicht mehr unbemerkt.

Nur Kommentare und deren Stellung geändert; npm test grün, Pixel- vergleich und Handgriff-Probe unverändert.

### Handbuch-Werkzeug: Buch aus Markdown setzen, Verzeichnisse aus dem Code

`c4feb44`

Neu: `npm run handbuch` (scripts/handbuch.mjs). Es

- schreibt elf Verzeichnisse aus dem Code nach docs/buch/referenz/: jede Datei mit Kopfkommentar und Ausfuhren (Server, Oberfläche, Werkzeuge), alle 123 Wege der Schnittstelle mit Wächtern, die Tabellen der Datenbank (aus einem wirklich gestarteten Almanach per PRAGMA gelesen), die Live-Ereignisse beider Seiten, die Einstellungen, die npm-Befehle, die zwölf Vorlagen, die Regeltabellen (mit den Funktionen des Blattes gerechnet) und das Prüfnetz;
- setzt das Buch nach der Gliederung in docs/buch/README.md als eine HTML-Seite mit eindeutigen ASCII-Ankern und umgebogenen Verweisen;
- druckt es mit einem Browser, der ohnehin auf dem Rechner liegt (Chrome, Chromium, Edge, Brave – kein Download), zweimal: Der erste Druck legt die Seiten fest, handbuch/seitenzahlen.mjs liest die Sprungziele ohne PDF-Bibliothek aus dem PDF, der zweite trägt die Seitenzahlen ins Inhaltsverzeichnis ein.

Der Drucksatz ist dafür zerlegt (drucksatz/markdown.mjs, drucksatz/seite.mjs); der Markdown-Leser kann jetzt verschachtelte Listen, Bilder mit Unterschrift, Autolinks und eingerückte Codeblöcke unter Listenpunkten – die alten Handbücher setzen sich dadurch an drei Stellen richtiger als vorher.

Code-Kommentare: 39 Wege hatten gar keinen Kommentar, 25 nur ihre Kopfzeile – alle tragen jetzt einen Satz, was sie tun und was man wissen muss. Korrigiert: MIN_PASSWORT hieß im Kommentar „höchstens“. Die Einfuhrprobe kennt nun auch Parameter von Methoden in Kurzschreibweise.

### Blattmeldungen nur an die, die das Blatt sehen dürfen

`1379ca3`

charakter:aktualisiert ging bisher an jedes Fenster der Kampagne. Die Oberfläche zeigte ein NSC-Blatt zwar nicht an, aber Name, Bildnis, Trefferpunkte und Rüstungsklasse standen im Netzwerkfenster jedes Spielerbrowsers, sobald die Spielleitung das Blatt anfasste.

- backend/src/blattmeldung.js: meldeBlatt schickt an die Spielleitung und an die Mitspielenden, die das Blatt sehen dürfen; meldeEntzug nimmt ein Blatt aus der Übersicht, wer es nicht mehr sehen darf.
- Speichern, Zuteilen, Kopieren, Trefferpunkte aus dem Kampf und das Auszahlen der Beute gehen darüber.
- Vertrag: Mitschreiben am Live-Kanal, drei neue Prüfungen (279).
- Kommentarprobe: meldet Dateien, die mit einem verwaisten Kommentar enden; zwei solche Reste entfernt, Kommentare an vier Stellen berichtigt.

### Pinselstriche hinter dem Vorhang bleiben dort

`e99962d`

Das Ereignis `nebel` ging an jedes Fenster der Kampagne – auch bei geschlossenem Vorhang und für Szenen, die erst vorbereitet werden. Schon die Feldkoordinaten verrieten der Runde, wo die Spielleitung gerade aufbaut; der Zeigefinger vermeidet genau das seit jeher.

Die Spielleitung bekommt jeden Strich wie bisher, die Runde nur für die Szene, die offen auf dem Tisch liegt. Geht der Vorhang auf, kommt der ganze Nebel ohnehin mit der Szene. Zwei neue Prüfungen im Vertrag (281).

### `npm run vorlagen` legt wieder nach – je Kampagne

`3462fe4`

Seit Vorlagen je einer Kampagne gehören, erwartet saeVorlagen() als erstes die Kampagne. Das Skript übergab stattdessen nur die Optionen und brach mit „Provided value cannot be bound to SQLite parameter“ ab – gelöschte Vorlagen ließen sich nicht mehr zurückholen, obwohl drei Handbücher genau das versprechen.

Jetzt legt es in allen Kampagnen außerhalb des Papierkorbs nach, was fehlt, oder mit einem Namen nur in einer. Der Vertrag löscht eine Vorlage, ruft das Skript gegen den laufenden Prüfserver auf und prüft, dass sie wieder da ist (285 Prüfungen).

### Kennwort neu setzen, wenn niemand mehr hineinkommt

`e9da42c`

Vergaß die einzige Spielleitung ihr Kennwort, gab es keinen Weg zurück außer in der Datenbank herumzuschneiden – so stand es auch in der Einrichtung. `npm run kennwort -- "Name"` würfelt ein neues aus, zeigt es einmal an und beendet alle Anmeldungen des Kontos. Auf der Befehlszeile nimmt es bewusst keines entgegen: Das stünde danach in der Shell-Geschichte.

Neues Vertragskapitel 20-werkzeuge.mjs: Kennwort, Umbenennen und Sicherung laufen gegen den Datenordner des laufenden Prüfservers (298 Prüfungen).

### Handbuch: erste Kapitel, Bilder und das Verzeichnis der Fehlerschlüssel

`e0e9083`

Von Hand geschrieben: Einleitung, Rundgang (mit 30 Aufnahmen aus einer Probe-Runde), Begriffe, das Charakterblatt Feld für Feld, ein Spielabend von Anfang bis Ende, Betrieb im Alltag, Fehlersuche. Jede Aussage über Verhalten ist gegen den Code geprüft; wo das Kapitel und der Code auseinanderliefen, wurde das eine oder das andere berichtigt.

Aus dem Code geschrieben: ein neues Verzeichnis aller 74 Fehlerschlüssel mit Status, Satz des Servers, Satz der Oberfläche und Fundstelle (scripts/handbuch/referenz/fehler.mjs); die übrigen Verzeichnisse neu erzeugt.

### Handbuch: Architektur, Server, Sicherheit, Live-Kanal, Sicht und Nebel

`c95945c`

Fünf Kapitel über den Bau des Almanachs, jedes gegen den Code geprüft: das Bild im Ganzen mit den Grundsätzen und ihren Gründen; der Server von Start bis Anatomie eines Weges; Anmeldung, Rollen und was der Server wem schickt – samt dem, was nicht geschützt ist; beide Enden des Live-Kanals; die Sichtrechnung mit Beispielen, die Bitkarte und der Nebelpinsel.

Vertrag: zwei Prüfungen für die feineren Regeln des Lichts – fremdes Licht verlängert den eigenen Blick nicht, die eigene Fackel schon (300).

### Handbuch vollständig: Oberfläche, Datenmodell, Arbeiten, Grundsätze, Bau

`ce894d5`

Die letzten fünf Kapitel und das endgültige Inhaltsverzeichnis. Das Buch hat jetzt sechs Teile mit 36 Kapiteln: Einführung, Am Tisch, Betrieb, Wie er gebaut ist, Entwicklung und die Verzeichnisse, die bei jedem Bau aus dem Code geschrieben werden.

- 18 Die Oberfläche, 19 Das Blatt: Datenmodell und Ausfuhr, 21 Arbeiten am Almanach, 22 Grundsätze und Review-Leitfaden, 23 Das Handbuch bauen.
- Neues Verzeichnis „Wie der Almanach entstand“ aus dem Verlauf von git (scripts/handbuch/referenz/geschichte.mjs); Zeilen über Mitautoren und Sitzungen bleiben draußen.
- satz.mjs schnitt das kleine „## Inhalt“ der Handbücher mit einem regulären Ausdruck heraus, der Codeblöcke nicht kannte – im Kapitel über den Bau fehlte dadurch die halbe Beispielgliederung. Jetzt zeilenweise und zaunbewusst.
- docs/CODE.md auf den Stand der geteilten Dateien gebracht (anmeldung/, lib/api/, lib/daten/, useZeiger.js, npm test, 300 Vertragsprüfungen).
- README: Verweis auf das Handbuch und npm run handbuch.
- VS Code: oxc statt ESLint empfohlen, eine Aufgabe für npm test.

### Das Handbuch als PDF: 523 Seiten

`0fae4bc`

Gebaut mit npm run handbuch aus docs/buch/README.md – Titelblatt, Inhaltsverzeichnis mit Seitenzahlen, sechs Teilblätter, 36 Kapitel, anklickbare Verweise.

### Die bekannten Grenzen geschlossen, HTTPS im Heimnetz, eine Content-Security-Policy

`1fa0fe2`

Was das Handbuch unter „Bekannte Grenzen“ und „Was nicht geschützt ist“ führte, ist behoben:

- Figur an ein Blatt binden: PATCH /api/scenes/figuren/:id nimmt characterId (nur Spielleitung, nur ein Blatt dieser Kampagne, geprüft vor dem Schreiben); im Figurenfeld eine Auswahl der Blätter.
- Kämpfer und Figur zeigen sich gemeinsam (kampf/verbergen.js): Wer eine Seite verbirgt oder aufdeckt, tut es im selben Block für beide. „Figuren aus dem Kampf“ schreibt außerdem in einer Transaktion.
- Initiative mit Geschicklichkeitsbonus (kampf/initiative.js, neue Spalte combatants.initiative_bonus): Bestiarium, Begegnungen und „Initiative würfeln“ würfeln W20 + Bonus; ältere Begegnungen holen ihn aus dem Bestiarium; die Runde bekommt den Bonus der Gegner nicht geschickt.
- Mitgenommene Blätter lassen sich per Knopf einlesen (Übersicht → „Blatt einlesen“); der Server weist unbekannte Regelwerke und Datensätze, die kein Objekt sind, mit blatt_ungueltig ab.
- Zauber-SG und -Angriffsbonus lassen sich von Hand überschreiben; gerechnet wird an einer Stelle (zauberwerte) für Reiter und Ausfuhr.
- Content-Security-Policy auf jeder Antwort (kopfzeilen.js), ohne unsafe-inline und unsafe-eval.
- HTTPS im Heimnetz ohne Download: `npm run zertifikat` stellt mit Node allein ein beschränktes Stammzertifikat (nur private Netze und Heimnetznamen) und ein Serverzertifikat aus; der Server lauscht dann zusätzlich auf 3443, bietet das Stammzertifikat unter /almanach-stamm.crt an, und die Anmeldeseite weist über http auf den verschlüsselten Eingang hin. Die Schlüssel liegen in data/tls/ und sind von git ausgeschlossen.

Neues Vertragskapitel 21-luecken.mjs (56 Prüfungen, darunter ein zweiter Server mit echtem TLS); Gegenprobe: ohne die Korrekturen schlagen sie an. Blattprobe um Zauberwerte und das Einlesen erweitert (355).

### Nichts mehr eingebettet: kein style, kein Inline-Skript, kein SVG im Bauteil

`0736f9a`

Werte, die erst im Browser feststehen (Lage der Figuren, gewählte Farben, Balken), standen als CSS-Variable im style-Attribut. Jetzt bekommt jedes Bauteil eine eigene Klasse und eine Regel in einem Laufzeit-Stilblatt, gesetzt über das CSSOM (lib/laufstil.js, components/Laufwert.jsx); ältere iPads nehmen dafür die leere Datei public/laufstil.css. Im ganzen Dokument steht kein style-Attribut mehr – nachgemessen im Browser –, und die Content-Security-Policy kommt ohne 'unsafe-inline' aus: keine einzige Verletzung auf allen Seiten, in beiden Rollen, beim Ziehen, Mitnehmen und Einlesen.

- Alle 25 style-Attribute ersetzt; beim Ziehen wird eine Regel geändert, keine neue angelegt.
- Lineal: Farbe und Strich ins Stilblatt statt als SVG-Attribute; der Wappenschild des Blattes ist ein Symbol in components/icons/.
- Handbuch und Drucksatz tragen ihr Stilblatt nicht mehr in sich, sondern verweisen auf buch.css bzw. drucksatz.css daneben; der Zierrat ist eine eigene SVG-Datei.
- Das mitgenommene Blatt enthält kein Skript mehr (Hinweis „Strg+P“ statt Druckknopf); der Datensatz steht entschärft in einem <template>. Das Stilblatt bleibt darin – die Datei muss ohne Server funktionieren; die Stilprobe lässt genau diese eine Stelle mit Grund zu. Ältere Dateien liest „Blatt einlesen“ weiterhin.
- Stilprobe verschärft: kein style= im JSX, keine CSS-Werte in SVG-Attributen, SVG nur in components/icons/, kein <style>/<script>/ on…= in erzeugtem HTML. Gegenprobe: ein eingeschmuggeltes style= und ein <script> im Handbuch-Satz fallen auf.
- initiative_bonus auch im Schema (nicht nur nachgerüstet).

Dokumentation nachgezogen: Bekannte Grenzen (alle fünf geschlossen), Sicherheit (CSP, HTTPS im Heimnetz, Bedrohungstabelle), Einrichtung (Schritt 9.1 HTTPS samt Installation des Stammzertifikats je Gerät), Betrieb, Fehlersuche, Oberfläche (Laufzeit-Stilblatt), Datenmodell (Ausfuhr und Einlesen), Spielabend (ein Schalter statt zwei), Arbeiten (das Beispiel ist jetzt umgesetzt), Grundsätze, Begriffe, API, Hilfe im Almanach. Ein alter kaputter Anker in SPIELLEITUNG.md korrigiert. Handbuch neu gebaut: 541 Seiten.

### design/: Inline-Stil als bewusste Ausnahme dokumentiert

`bab84b2`

Die .dc.html-Artboards des Claude-Design-Tools nutzen Inline-Stil als natives Format – nur so bleiben sie im Tool weiter zu öffnen und anzupassen. Das war bisher nirgends festgehalten, sodass es wie eine übersehene Stelle aussah. Jetzt steht es an beiden Stellen, an denen man danach suchen würde: im Kopf von scripts/stilprobe.mjs (die den Ordner ohnehin nie geprüft hat) und in design/README.md.
