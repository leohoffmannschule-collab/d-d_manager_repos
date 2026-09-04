# Abenteuer-Almanach

Eine selbst gehostete Runde für D&D 5e (und andere Pen-&-Paper-Systeme) im Gewand einer illuminierten
Handschrift – Pergament, Eisengallustinte, Rubrikrot und Blattgold. Alles läuft auf einem einzigen
Gerät, etwa einem **Raspberry Pi 5**, und wird von überall im Browser benutzt: vom Sofa, vom iPad am
Spieltisch oder aus dem Wohnzimmer der Mitspieler, drei Städte weiter.

Der Almanach besteht aus drei Teilen, die sich eine Anmeldung, eine Datenbank und einen Live-Kanal teilen:

| Teil                | Für wen           | Was darin steckt                                                             |
| ------------------- | ----------------- | ---------------------------------------------------------------------------- |
| **Charaktere**      | alle              | vollständige 5e-Charakterblätter, freies Blatt für andere Systeme, Kompendium |
| **Spieltisch**      | alle              | Karten, Figuren, Nebel des Krieges, Lineal, Zeigefinger, Initiative, Handzettel |
| **Spielleitung**    | nur die Leitung   | Initiative-Tracker, Bestiarium, Begegnungen, Karten- und Klangbibliothek, Notizen, Konten |
| **Chronik**         | alle              | Protokoll des Abends, aus dem entstanden, was am Tisch wirklich geschah       |

Was einer ändert, sehen die anderen sofort – ohne Neuladen.

> **Du willst ihn aufsetzen?** Das
> **[Einrichtungs-Handbuch](docs/EINRICHTUNG.md)** führt dich Schritt für
> Schritt vom nackten Raspberry Pi bis zur Runde, die von überall spielt –
> samt Cloudflare-Tunnel, Spotify, Sicherung und Störungssuche. Rechne mit
> zwei Stunden, davon die meiste Zeit Wartezeit.

## Funktionen

### Für die Runde

- **Charakterblatt** für D&D 5e: Attribute als Wappenschilde, Rettungswürfe, Fertigkeiten, Kampfwerte,
  Trefferpunkte samt Rettungswürfen gegen den Tod, Angriffe, Inventar & Münzen, Zauber (mit Suche im
  Kompendium), Chronik und Merkmale. Dazu ein **generisches Blatt** für andere Systeme.
- **Eigene Blätter bearbeiten, fremde lesen** – wer in der Runde ist, sieht die Werte der Gefährten,
  schreiben darf nur die Besitzerin (und die Spielleitung).
- **Spieltisch**: Karte schieben und zoomen, die eigene Figur ziehen (sie schnappt aufs Raster ein),
  mit `Alt`+Klick eine Stelle für alle aufleuchten lassen, Entfernungen in Feldern und Fuß messen.
- **Nebel des Krieges** – was die Spielleitung noch nicht aufgedeckt hat, bleibt schwarz, samt der
  Figuren, die darin lauern.
- **Gemeinsamer Würfelbeutel**: W4–W100, Anzahl und Modifikator, Vorteil/Nachteil, eigene Ausdrücke wie
  `2W6+3`. Gewürfelt wird auf dem Server, jeder Wurf steht sofort bei allen in der Chronik.
- **Initiativliste** und **Handzettel** der Spielleitung, live am Tisch.
- **Beutekiste**: die gemeinsame Kiste der Runde mit Münzen und Gefundenem, die alle füllen dürfen. Das Teilen
  rechnet der Almanach aus – und wechselt Münzen dabei nur nach unten, damit niemand Platin bekommt, das die Runde
  nie hatte. Die Spielleitung kann die Anteile direkt in die Beutel schreiben lassen.
- **Kompendium**: Völker, Klassen, Hintergründe, Talente, Zauber, Ausrüstung, magische Gegenstände,
  Monster und Zustände – durchsuchbar, direkt aus der D&D-5e-API und örtlich zwischengespeichert.
- **Alles am Blatt ist würfelbar**: Ein Tipp auf den Bonus neben Fertigkeit, Rettungswurf, Attribut oder Angriff
  legt den Wurf für alle sichtbar auf den Tisch. Die eigene **Initiative** würfelt jede und jeder selbst; sie steht
  sofort in der Kampfliste.
- **Zauber im Blatt nachschlagen**: Ein Tipp auf den Namen klappt den vollen Text aus dem Kompendium auf –
  Reichweite, Komponenten, Wirkungsdauer, Beschreibung und höhere Grade.
- **Rettungswürfe gegen den Tod tragen sich selbst ein** (eine 20 richtet auf, eine 1 zählt doppelt), und die
  **Konzentrationsprobe** rechnet den Schwierigkeitsgrad aus dem erlittenen Schaden.
- **Vollständige Spielführung**: Zustände, Erschöpfung in sechs Stufen, Konzentration, Inspiration, Resistenzen und
  Sinne, eingestimmte Gegenstände, frei benannte Klassenressourcen (Wut, Ki, bardische Inspiration …), Trefferwürfel
  sowie **kurze und lange Rast**, die auffüllen, was sich erneuert.
- **Figurenschmiede**: eine eigene Miniatur zusammenstellen – Volk, Statur, Rüstung, Waffe, Haar, Bart, Farben –,
  drehen und gießen. Daraus entstehen Bildnis und Spielfigur.
- **Blatt mitnehmen**: Ein Knopf sichert das eigene Blatt als einzelne HTML-Datei – mit Bildnis, Figur und den
  vollständigen Zaubertexten, ohne Verweis nach draußen. Sie öffnet sich mit einem Doppelklick auf jedem Gerät, auch wenn der Pi ausgeschaltet ist,
  und druckt sich als Charakterbogen. Der vollständige Datensatz reist am Ende der Datei mit, sie ist also zugleich
  eine Sicherung.
- **Zwei Fassungen**: *Pergament* für helle Räume, *Kerzenlicht* für den abgedunkelten Spieltisch.
- **Als App installierbar** (PWA), automatisches Speichern, keine Werbung, keine Cloud.

### Für die Spielleitung

- **Initiative-Tracker**: Kämpfer eintragen oder die ganze Runde mit einem Klick holen, Initiative
  würfeln lassen, Schaden und Heilung austeilen, Zustände vergeben, Runde und Zug verfolgen.
  Trefferpunkte wandern automatisch zwischen Kampfliste und Charakterblatt hin und her.
- **Bestiarium**: eigene Statblöcke anlegen oder Monster aus dem Kompendium übernehmen, durchsuchen und
  mit einem Klick mehrfach in den Kampf stellen („3 Goblins“) – wahlweise **verborgen**, bis der
  Hinterhalt zuschnappt.
- **Szenen**: Karten hochladen, Raster einstellen, Szene auf den Tisch legen, Figuren aus dem laufenden
  Kampf auslegen, Figuren benennen, einfärben, vergrößern, mit einem Bildnis versehen oder verbergen.
- **Kartenbibliothek**: ganze Stapel Battlemaps auf einmal hochladen, mit Schlagworten versehen und
  durchsuchen. Das Raster wird einmal an der Vorschau ausgerichtet und vererbt sich an jede Szene aus
  dieser Karte. Ein Klick legt die Karte auf – samt dem Nebel, den die Runde sich schon erspielt hat,
  oder auf Wunsch frisch verhüllt.
- **Notizen** mit Schlagworten – geheim oder als **Handzettel** an die Runde ausgeteilt.
- **Begegnungen**: Gruppen einmal zusammenstellen und an jedem Abend mit einem Klick stellen – samt gewürfelter
  Initiative und wahlweise verborgen. Ein improvisierter Kampf lässt sich für das nächste Mal sichern.
- **Klangteppich**: Ambiente über Spotify. Die Spielleitung sammelt Wiedergabelisten („Schankraum“,
  „Hinterhalt“, „Verlies“), legt eine mit einem Klick auf – und sie beginnt bei allen, die zuhören.
  Jeder regelt seine Lautstärke selbst oder leitet den Ton auf ein anderes Spotify-Gerät um. Eine Karte
  darf ihre Ambiente mitbringen: Wer sie auflegt, legt die Musik mit auf. Braucht eine eigene
  Spotify-Anwendung (siehe Konfiguration) und zum Abspielen im Browser Spotify Premium.
- **Verdeckt würfeln** – der Wurf erscheint nur im eigenen Würfelbeutel.
- **Konten und Einladungen**: Codes erzeugen, Rollen vergeben, vergessene Passwörter neu setzen,
  Charakterblätter ihren Besitzern zuordnen.

### Die Chronik

Der Almanach schreibt mit, was am Tisch geschieht: Würfe, Schaden und Heilung, wer zu Boden geht, welche Zustände
wirken, wann eine Kampfrunde beginnt, welche Gegner auftreten, wohin die Runde zieht, welche Handzettel ausgeteilt
werden. Daraus entsteht ein Protokoll, nach Stationen und Kämpfen in Kapitel geordnet, das sich als Markdown-Datei
sichern lässt. Die Spielleitung kann nachtragen, was der Almanach nicht sehen konnte, und Einträge verdeckt halten.

**Es wird nichts mitgehört und nichts aufgenommen.** Grundlage ist allein, was ohnehin durch den Server läuft – kein
Mikrofon, keine Spracherkennung, keine Einwilligungen, die einzuholen wären.

Wer zusätzlich einen erzählenden Rückblick möchte, kann ein Sprachmodell anschließen (siehe *Konfiguration*). Das ist
bewusst nicht voreingestellt: Es kostet Rechenzeit oder Geld und schickt das Protokoll aus dem Haus. Ohne diese
Einstellung fehlt nichts – das Protokoll entsteht so oder so.

## Voraussetzungen

- [Node.js](https://nodejs.org/) **22.5 oder neuer** (empfohlen: aktuelle LTS-Fassung).
  Ab dieser Version bringt Node SQLite selbst mit – es muss **nichts kompiliert werden**,
  also braucht Windows weder Python noch Visual-Studio-Build-Tools.
- [Git](https://git-scm.com/) zum Herunterladen des Projekts
- [Visual Studio Code](https://code.visualstudio.com/) (optional, aber unten beschrieben)

## Der erste Start

```bash
git clone <URL>
cd d-d_manager_repos
npm run setup
npm start
```

Danach <http://localhost:3001> öffnen. Beim ersten Aufruf steht dort **„Den Almanach eröffnen“**:

1. Das **erste angelegte Konto führt die Spielleitung** – kein Einladungscode nötig.
2. Unter **Spielleitung → Runde** einen Einladungscode je Mitspieler erzeugen und weitergeben.
3. Die Mitspieler öffnen dieselbe Adresse, wählen „Du hast einen Einladungscode? Konto anlegen“ und
   legen mit dem Code ihr eigenes Konto an.

Ohne gültigen Code kommt niemand hinein – wichtig, weil der Almanach über den Tunnel (siehe unten) am
offenen Netz hängt.

## Raspberry Pi 5 mit Docker

Auf dem Pi (Raspberry Pi OS Bookworm 64-bit, Docker installiert):

```bash
git clone <URL>
cd d-d_manager_repos
docker compose up -d --build
```

Danach läuft der Almanach im Heimnetz unter `http://<IP-des-Pi>:3001`, z. B.
`http://raspberrypi.local:3001`. Alle Daten liegen im Docker-Volume `dnd-manager-data` und überstehen
Neustarts und Updates (`git pull && docker compose up -d --build`).

Ohne Docker geht es genauso wie oben; für den Autostart bietet sich `pm2` an:

```bash
npm run build
sudo npm install -g pm2
pm2 start src/server.js --name almanach --cwd /pfad/zu/d-d_manager_repos/backend
pm2 save && pm2 startup
```

## Von außen erreichbar – ohne den Router anzufassen

Damit die Mitspieler von zu Hause aus mitspielen können, muss der Almanach aus dem Internet erreichbar
sein. Eine Portfreigabe im Router ist dafür **nicht** nötig (und oft auch nicht möglich, wenn der Router
jemand anderem gehört): **Cloudflare Tunnel** baut die Verbindung von innen nach außen auf.

1. Bei [Cloudflare](https://one.dash.cloudflare.com/) anmelden (kostenlos) und unter
   **Networks → Tunnels** einen Tunnel anlegen.
2. Als **Public Hostname** eine Adresse wählen. Ohne eigene Domain vergibt Cloudflare eine kostenlose
   `*.trycloudflare.com`-Adresse; eine später gekaufte Domain lässt sich jederzeit nachtragen.
3. Als **Service** eintragen: `http://dnd-manager:3001`
   (so heißt der Almanach im Docker-Netz; ohne Docker: `http://localhost:3001`).
4. Das angezeigte **Tunnel-Kennwort** in eine Datei `.env` neben der `docker-compose.yml` schreiben –
   `.env.example` zeigt, wie:

   ```bash
   cp .env.example .env
   # CLOUDFLARE_TUNNEL_TOKEN=... eintragen
   docker compose --profile tunnel up -d --build
   ```

Danach ist der Almanach unter der Cloudflare-Adresse erreichbar – mit gültigem HTTPS-Zertifikat, ohne
offene Ports und ohne feste IP-Adresse.

> **Umzug inklusive:** Weil der Tunnel von innen nach außen aufgebaut wird, funktioniert er überall.
> Nimmst du den Pi zur Runde bei Freunden mit, steckst du ihn dort einfach ins Netz – dieselbe Adresse
> tut es weiter, ohne dass irgendetwas umgestellt werden müsste. Im selben Raum geht natürlich auch
> weiterhin `http://<IP-des-Pi>:3001`.

Wer lieber [Tailscale](https://tailscale.com/) nutzt: Das funktioniert genauso gut, verlangt aber, dass
alle Mitspieler Tailscale installieren. Der Cloudflare-Tunnel braucht bei ihnen nur einen Browser.

## Zugriff von iPad und iPhone

1. Die Adresse in **Safari** öffnen (im Heimnetz `http://<IP>:3001`, von unterwegs die Tunnel-Adresse).
2. Teilen-Symbol → **„Zum Home-Bildschirm“**.
3. Die App startet danach im Vollbild mit eigenem Symbol.

Über die Tunnel-Adresse (HTTPS) arbeitet auch der Offline-Zwischenspeicher; im Heimnetz über
gewöhnliches `http://` lädt die App bei jedem Öffnen frisch – am Spieltisch kein Problem.

Wer sich unabhängig davon machen will, nimmt sein Blatt einfach mit: Der Knopf **Mitnehmen** oben auf dem
Charakterblatt sichert es als einzelne Datei, die ohne Server, ohne Netz und ohne App auskommt. Das ist der
verlässliche Weg, sich auf eine Runde vorzubereiten, während der Pi aus ist – der Zwischenspeicher des Browsers
ist immer nur so gut wie das, was zuletzt geöffnet war.

## Entwickeln unter Windows mit VS Code

1. **Projekt holen** – `Strg` + `Umschalt` + `P`, dann „Git: Clone“.
2. **Abhängigkeiten installieren** – im Terminal (`Strg` + `Ö`): `npm run setup`
3. **Starten** – `npm run dev`, oder `F5` → **„Almanach starten (Server + Oberfläche)“**,
   oder `Strg` + `Umschalt` + `P` → „Tasks: Run Task“ → **„2 · Entwicklung starten“**.
4. **Öffnen** – <http://localhost:5173>. Änderungen am Code sind sofort sichtbar.

> **Windows-Firewall:** Beim ersten Start fragt Windows, ob Node.js im Netzwerk erreichbar sein darf.
> Für den Zugriff vom iPad muss das für **private Netzwerke** erlaubt werden.

## Konfiguration

| Variable         | Standard                           | Bedeutung                                                        |
| ---------------- | ---------------------------------- | ----------------------------------------------------------------- |
| `PORT`           | `3001`                             | Port des Servers                                                  |
| `DATA_DIR`       | `backend/data`                     | Ablageort von Datenbank und hochgeladenen Bildern                 |
| `DND5E_API_BASE` | `https://www.dnd5eapi.co/api/2014` | Basis-URL der D&D-5e-API (Regelwerk-Version)                      |
| `TRUST_PROXY`    | `loopback`                         | `1`, wenn ein Tunnel im eigenen Container davorsteht (siehe Compose) |

Freiwillig, für den Klangteppich:

| Variable            | Bedeutung                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `SPOTIFY_CLIENT_ID` | Kennung einer eigenen Spotify-Anwendung (developer.spotify.com/dashboard). Als Redirect URI dort `https://deine-adresse/spotify` eintragen und Web API sowie Web Playback SDK anhaken. Ohne diese Variable bleibt die Klangleiste verborgen. Der Almanach speichert keine Spotify-Zugangsdaten – jeder meldet sich in seinem Browser selbst an. |

Freiwillig, nur für den erzählenden Rückblick in der Chronik:

| Variable               | Bedeutung                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `CHRONIK_KI_URL`       | Adresse einer OpenAI-kompatiblen Schnittstelle. Örtlich z. B. `http://localhost:8080/v1/chat/completions` für llama.cpp oder Ollama; sonst die von OpenAI oder Anthropic. Ohne diese Variable bleibt der Knopf verborgen. |
| `CHRONIK_KI_MODELL`    | Name des Modells (Vorgabe `gpt-4o-mini`).                                                    |
| `CHRONIK_KI_SCHLUESSEL`| Zugangsschlüssel, falls der Dienst einen verlangt. Bei einem örtlichen Modell nicht nötig.   |

## Daten sichern

Alles steckt in einem Ordner: die Datenbank `manager.sqlite3` und der Ordner `medien/` mit den
hochgeladenen Karten und Bildnissen.

Im laufenden Betrieb darf die Datenbank **nicht einfach kopiert** werden – der Almanach schreibt
im WAL-Verfahren, und eine Kopie mitten im Spiel erwischt womöglich einen halben Schreibvorgang.
Das mitgelieferte Skript zieht stattdessen einen in sich stimmigen Stand, während die Runde
weiterspielt:

```bash
# Datenbank sichern (klein, taugt für jede Nacht)
docker compose exec -T dnd-manager node scripts/sicherung.mjs /app/data/sicherungen

# Alles, samt Karten und Bildnissen
docker compose exec -T dnd-manager node scripts/sicherung.mjs /app/data/sicherungen --medien
```

Damit ist ein Missgeschick abgedeckt, nicht aber eine kaputte Speicherkarte. Dafür wandert der
ganze Ordner regelmäßig vom Pi herunter:

```bash
docker run --rm -v dnd-manager-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/almanach-sicherung-$(date +%F).tar.gz -C /data .
```

Wie beides zusammen als Nacht- und Wochenaufgabe eingerichtet wird, steht im
[Einrichtungs-Handbuch](docs/EINRICHTUNG.md#8-sicherung-einrichten).

## Projektaufbau

```
frontend/   React 19 + Vite, Tailwind CSS v4, PWA
            src/pages/       Charaktere, Spieltisch, Spielleitung, Chronik, Kompendium, Anmeldung
            src/components/  Spieltisch (Brett, Werkzeuge, Figuren), Spielleitung (Bestiarium,
                             Begegnungen, Karten, Klang, Notizen, Runde), Figurenschmiede,
                             Initiativliste, Würfelbeutel, Klangleiste, Blattbausteine
            src/lib/         daten.jsx (Datenschicht), api.js, auth.jsx, live.jsx,
                             klang.jsx + spotify.js (Ambiente), beschriftung.js,
                             Regelwerk, Rasten, Miniaturen
backend/    Node.js + Express, SQLite über das eingebaute node:sqlite
            src/auth.js      Passwörter (scrypt), Anmeldungen, Rollen
            src/events.js    Live-Kanal (Server-Sent Events)
            src/chronicle.js Mitschrift der Sitzung
            src/routes/      Konten, Charaktere, Kampf, Bestiarium, Begegnungen, Notizen,
                             Würfel, Szenen/Figuren/Nebel, Karten- und Klangbibliothek,
                             Bilder, Beute, Chronik,
                             Kompendium-Zwischenspeicher
design/     Die Design-Entwürfe (Artboards) zum mittelalterlichen Erscheinungsbild
scripts/    Hilfsskripte, plattformunabhängig in Node geschrieben
```

Nützliche Befehle im Projektstamm:

| Befehl          | Wirkung                                                       |
| --------------- | ------------------------------------------------------------- |
| `npm run setup` | Abhängigkeiten für Backend und Frontend installieren          |
| `npm run dev`   | Entwicklung: Server (3001) und Oberfläche (5173) gleichzeitig  |
| `npm run build` | Oberfläche bauen und ins Backend kopieren                      |
| `npm start`     | Bauen und fertige Fassung starten (3001)                       |
| `npm run serve` | Nur den Server starten (ohne neu zu bauen)                     |
| `npm run vertrag` | Die Schnittstelle gegen einen eigenen Testserver prüfen      |

## Die Oberfläche umbauen

Der Almanach ist so geschnitten, dass die Oberfläche austauschbar ist – ohne den Server anzufassen.

| Schicht                  | Ort                                                        | beim Umbau |
| ------------------------ | ---------------------------------------------------------- | ---------- |
| Regelwerk                | `frontend/src/lib/dnd5e.js`, `rasten.js`, `wuerfeln.js`     | bleibt     |
| Zugriff auf den Server   | `frontend/src/lib/api.js`                                   | bleibt     |
| Anmeldung und Live-Kanal | `frontend/src/lib/auth.jsx`, `live.jsx`                     | bleibt     |
| **Datenschicht**         | `frontend/src/lib/daten.jsx`                                | bleibt     |
| Beschriftung             | `frontend/src/lib/beschriftung.js`                          | anpassen   |
| Aussehen                 | `frontend/src/index.css` (Farben, Schriften als Variablen)  | anpassen   |
| Darstellung              | `frontend/src/pages/`, `frontend/src/components/`           | ersetzen   |

In `daten.jsx` steckt das mühsame Stück: wann geladen wird, welches Ereignis welchen Zustand betrifft, was nach
einem Funkloch nachzuholen ist. Ein Bauteil bekommt fertige Daten und einen Handgriff zum Nachladen – mehr weiß es
nicht:

```jsx
const { kampf } = useKampf();
const { kiste, laden } = useBeute();
const { szene, figuren, nebel } = useSzene();
```

Der Server legt sich seinerseits auf keine Darstellung fest: Zustände und Fehler kommen als unveränderliche
Schlüssel (`schwer_verwundet`, `einladung_verbraucht`), nicht als fertige Sätze. Übersetzt werden sie an einer
einzigen Stelle, in `beschriftung.js`.

Die ganze Schnittstelle steht in **[docs/API.md](docs/API.md)** – genug, um eine neue Oberfläche zu bauen, ohne den
Quelltext des Servers zu lesen. Und sie ist nicht nur aufgeschrieben, sondern nachgewiesen:

```bash
npm run vertrag
```

Das startet einen eigenen Almanach mit leerer Datenbank, spielt eine Runde durch und prüft fünfzig Zusagen –
Rollen, getrennte Sichten für Spielleitung und Runde, Fehlerschlüssel, Rechenwege, den Live-Kanal. Wer die
Oberfläche umbaut, weist damit nach, dass der Unterbau steht; wer am Server schraubt, merkt sofort, wenn er etwas
bricht, worauf sich eine Oberfläche verlässt.

## Wie die Technik dahinter arbeitet

- **Anmeldung.** Passwörter werden mit `scrypt` aus Nodes eigenem Krypto-Modul gehasht (kein `bcrypt`,
  das auf dem Pi kompiliert werden müsste). Die Anmeldung liegt in einem `HttpOnly`-Cookie; in der
  Datenbank steht davon nur der Hash. Wer Passwörter durchprobiert, wird nach acht Fehlversuchen für
  zehn Minuten ausgebremst.
- **Live-Übertragung.** Änderungen kommen über **Server-Sent Events** zurück – gewöhnliches HTTP, das
  ohne Sonderbehandlung durch den Cloudflare-Tunnel geht, keine zusätzliche Bibliothek braucht und nach
  einem Funkloch von allein wieder aufgebaut wird. Geschrieben wird über die normalen REST-Aufrufe.
- **Was die Runde nicht sehen darf,** wird gar nicht erst geschickt: Der Server stellt für Spielleitung
  und Runde getrennte Fassungen von Kampf und Szene zusammen. Verborgene Kämpfer und Figuren fehlen in
  der Spielerfassung vollständig, von Monstern gibt es statt der Trefferpunkte nur „verwundet“ oder
  „schwer verwundet“.
- **Der Nebel** ist ein Rasterfeld je Bildpunkt auf einer kleinen Leinwand, die der Browser hochskaliert –
  das bleibt auch auf einem iPad flüssig, und übers Netz wandern nur die geänderten Felder.
- **Bilder** werden als `data:`-URL hochgeladen, auf der Platte abgelegt und unter einer Kennung
  ausgeliefert, die sich nie ändert – der Browser behält sie also.
- **Die Miniaturen** sind keine geladenen Modelle, sondern werden aus einfachen Körpern zusammengesetzt: Kugeln,
  Kästen, Kegel. So muss keine Modelldatei auf den Pi, jede Figur steht in Sekundenbruchteilen neu da, und beim
  Gießen entsteht daraus ein PNG mit durchsichtigem Grund. three.js wird erst geladen, wenn jemand die Schmiede
  aufschlägt – wer nur sein Blatt führt, wartet nicht darauf.

## Erscheinungsbild

Das Design folgt dem Vorbild einer illuminierten Handschrift: Pergament als Grund, aufgelegte
Velin-Tafeln, Rubrikrot für Überschriften, Blattgold als Zierrat, Attribute als Wappenschilde.
Überschriften und Zahlen stehen in *Cinzel*, Fließtext in *EB Garamond*, Initialen in
*UnifrakturMaguntia*. Die Entwürfe dazu liegen als Artboards in `design/`.

Farben und Schriften sind als CSS-Variablen in `frontend/src/index.css` gebündelt – wer etwas umfärben
möchte, ändert sie dort einmal, und beide Fassungen (Pergament und Kerzenlicht) ziehen mit.

## Quellen & Credits

- Regelwerksdaten: [dnd5eapi.co](https://www.dnd5eapi.co/) von [5e-bits](https://github.com/5e-bits),
  auf Grundlage des D&D 5e SRD (Open Gaming License / Creative Commons)
- API-Dokumentation & Tutorials: <https://5e-bits.github.io/docs/tutorials>
- Schriften: [Cinzel](https://fonts.google.com/specimen/Cinzel),
  [EB Garamond](https://fonts.google.com/specimen/EB+Garamond),
  [UnifrakturMaguntia](https://fonts.google.com/specimen/UnifrakturMaguntia) (SIL Open Font License)

Dungeons & Dragons ist eine Marke von Wizards of the Coast. Dieses Projekt ist ein privates,
nicht-kommerzielles Hilfsmittel und steht in keiner Verbindung zu Wizards of the Coast.
