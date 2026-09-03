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
| **Spielleitung**    | nur die Leitung   | Initiative-Tracker, Bestiarium, geheime Notizen, Konten und Einladungen       |

Was einer ändert, sehen die anderen sofort – ohne Neuladen.

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
- **Kompendium**: Völker, Klassen, Hintergründe, Talente, Zauber, Ausrüstung, magische Gegenstände,
  Monster und Zustände – durchsuchbar, direkt aus der D&D-5e-API und örtlich zwischengespeichert.
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
- **Notizen** mit Schlagworten – geheim oder als **Handzettel** an die Runde ausgeteilt.
- **Verdeckt würfeln** – der Wurf erscheint nur im eigenen Würfelbeutel.
- **Konten und Einladungen**: Codes erzeugen, Rollen vergeben, vergessene Passwörter neu setzen,
  Charakterblätter ihren Besitzern zuordnen.

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

## Daten sichern

Alles steckt in einem Ordner: die Datenbank `manager.sqlite3` und der Ordner `medien/` mit den
hochgeladenen Karten und Bildnissen.

```bash
# Docker auf dem Pi
docker run --rm -v dnd-manager-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/almanach-sicherung-$(date +%F).tar.gz -C /data .
```

```powershell
# Windows, ohne Docker
Compress-Archive backend\data $env:USERPROFILE\Desktop\almanach-sicherung.zip
```

## Projektaufbau

```
frontend/   React 19 + Vite, Tailwind CSS v4, PWA
            src/pages/       Charaktere, Spieltisch, Spielleitung, Kompendium, Anmeldung
            src/components/  Spieltisch (Brett, Werkzeuge, Figuren), Spielleitung (Bestiarium,
                             Notizen, Runde), Initiativliste, Würfelbeutel, Blattbausteine
            src/lib/         API-Zugriff, Anmeldung, Live-Kanal, Bildverarbeitung
backend/    Node.js + Express, SQLite über das eingebaute node:sqlite
            src/auth.js      Passwörter (scrypt), Anmeldungen, Rollen
            src/events.js    Live-Kanal (Server-Sent Events)
            src/routes/      Konten, Charaktere, Kampf, Bestiarium, Notizen, Würfel,
                             Szenen/Figuren/Nebel, Bilder, Kompendium-Zwischenspeicher
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
