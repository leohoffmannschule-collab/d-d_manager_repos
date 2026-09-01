# Abenteuer-Almanach

Ein selbst gehosteter Pen & Paper Charaktermanager im Gewand einer illuminierten Handschrift –
Pergament, Eisengallustinte, Rubrikrot und Blattgold. Er läuft auf einem **Windows-Rechner (VS Code)**
genauso wie auf einem **Raspberry Pi 5** und wird von **iPad, iPhone oder Browser** aus benutzt.
Kein Papier mehr, keine Cloud: Alle Charakterdaten bleiben auf deinem eigenen Gerät.

Referenzdaten (Völker, Klassen, Zauber, Ausrüstung, Monster …) kommen von der offenen
[D&D 5e API](https://www.dnd5eapi.co/api) des [5e-bits](https://github.com/5e-bits)-Projekts und
werden lokal zwischengespeichert.

## Dokumentation

Dieses Projekt bringt zwei ausführliche PDF-Dokumente mit, beide im Ordner [`docs/`](docs):

| Dokument | Für wen | Inhalt |
| -------- | ------- | ------ |
| 📘 [**Einrichtungsanleitung**](docs/Einrichtungsanleitung.pdf) | Wer den Server betreibt | Alles aus diesem README, ausführlicher: Windows/VS Code, macOS/Linux, Raspberry Pi, Konfiguration, Backup, Fehlerbehebung |
| 📗 [**Spielerhandbuch**](docs/Spielerhandbuch.pdf) | Wer am Spieltisch sitzt | Charakter erschaffen, das Blatt im Detail, Kompendium, Würfelbeutel, häufige Fragen |

Die restlichen Abschnitte dieses READMEs sind die Kurzfassung der Einrichtungsanleitung – für den
schnellen Blick zwischendurch reicht das README, für die vollständige Anleitung samt
Fehlerbehebung lohnt sich das PDF.

## Funktionen

- **Charakterliste** mit Anlegen, Abschrift und Löschen
- **Vollständiges D&D-5e-Charakterblatt**: Attribute als Wappenschilde, Rettungswürfe, Fertigkeiten,
  Kampfwerte, Trefferpunkte samt Rettungswürfen gegen den Tod, Angriffe, Inventar & Münzen, Zauber
  (mit Suche im Kompendium), Chronik und Merkmale
- **Generisches Charakterblatt** für andere Pen-&-Paper-Systeme (frei benannte Abschnitte)
- **Kompendium**: Völker, Klassen, Hintergründe, Talente, Zauber, Ausrüstung, magische Gegenstände,
  Monster und Zustände – durchsuchbar, direkt aus der D&D 5e API
- **Würfelbeutel** (W4–W100, Anzahl & Modifikator, Wurfchronik) von überall erreichbar
- **Zwei Fassungen**: *Pergament* für helle Räume, *Kerzenlicht* für den abgedunkelten Spieltisch
- **Automatisches Speichern** – kein Speichern-Knopf nötig
- **Als App installierbar** (PWA): eigenes Symbol auf dem Home-Bildschirm, Vollbild
- Läuft komplett lokal: eigene SQLite-Datei, keine Registrierung, keine Werbung

## Voraussetzungen

- [Node.js](https://nodejs.org/) **22.5 oder neuer** (empfohlen: aktuelle LTS-Fassung).
  Ab dieser Version bringt Node SQLite selbst mit – es muss **nichts kompiliert werden**,
  also braucht Windows weder Python noch Visual-Studio-Build-Tools.
- [Visual Studio Code](https://code.visualstudio.com/) (optional, aber unten beschrieben)
- [Git](https://git-scm.com/) zum Herunterladen des Projekts

## Schnellstart unter Windows mit VS Code

1. **Projekt holen** – in VS Code `Strg` + `Umschalt` + `P`, dann „Git: Clone“, die Repo-Adresse
   einfügen und den Ordner öffnen. (Oder in einem Terminal: `git clone <URL>` und
   `code d-d_manager_repos`.)
2. **Abhängigkeiten installieren** – in VS Code das Terminal öffnen (`Strg` + `Ö`) und eingeben:

   ```powershell
   npm run setup
   ```

3. **Starten** – entweder im Terminal:

   ```powershell
   npm run dev
   ```

   … oder komfortabler in VS Code:
   - `F5` → **„Almanach starten (Server + Oberfläche)“** (Debugger inklusive, der Browser geht
     automatisch auf), oder
   - `Strg` + `Umschalt` + `P` → „Tasks: Run Task“ → **„2 · Entwicklung starten“**.

4. **Öffnen** – <http://localhost:5173> im Browser. Änderungen am Code sind sofort sichtbar.

Für den „richtigen“ Betrieb (eine einzige Adresse, fertig gebaute Oberfläche, auch fürs iPad
im WLAN):

```powershell
npm start
```

Das baut die Oberfläche und startet den Server unter <http://localhost:3001>. Beim Start schreibt
er auch die Netzwerkadresse ins Terminal, z. B. `http://192.168.1.42:3001` – die ist für iPad und
iPhone gedacht.

> **Windows-Firewall:** Beim ersten Start fragt Windows, ob Node.js im Netzwerk erreichbar sein
> darf. Für den Zugriff vom iPad muss das für **private Netzwerke** erlaubt werden.

## Schnellstart unter macOS und Linux

Identisch, nur im Terminal:

```bash
git clone <URL>
cd d-d_manager_repos
npm run setup
npm run dev      # Entwicklung, Port 5173
npm start        # Fertige Fassung, Port 3001
```

## Raspberry Pi 5 mit Docker

Auf dem Pi (Raspberry Pi OS 64-bit, Docker installiert):

```bash
git clone <URL>
cd d-d_manager_repos
docker compose up -d --build
```

Danach läuft die App unter `http://<IP-des-Pi>:3001`, z. B. `http://raspberrypi.local:3001`.
Die Charakterdaten liegen im Docker-Volume `dnd-manager-data` und überstehen Neustarts und
Updates (`git pull && docker compose up -d --build`).

Ohne Docker geht es auf dem Pi genauso wie oben unter Linux beschrieben; für den Autostart bietet
sich `pm2` an:

```bash
npm run build
sudo npm install -g pm2
pm2 start src/server.js --name almanach --cwd /pfad/zu/d-d_manager_repos/backend
pm2 save && pm2 startup
```

## Zugriff von iPad und iPhone

1. `http://<IP-des-Rechners>:3001` in **Safari** öffnen (Rechner und iPad im selben WLAN).
2. Teilen-Symbol → **„Zum Home-Bildschirm“**.
3. Die App startet danach im Vollbild mit eigenem Symbol.

Tipp: Dem Rechner bzw. Pi im Router eine feste IP-Adresse zuweisen, damit sich die Adresse nicht
ändert. Wie die App danach am Spieltisch benutzt wird – Charakter erschaffen, das Blatt im Detail,
Würfeln – steht im [Spielerhandbuch](docs/Spielerhandbuch.pdf); am einfachsten direkt an die
Spielerinnen und Spieler weiterreichen.

### Hinweis zu HTTPS und Offline-Betrieb

Über normales `http://` im Heimnetz funktioniert alles – Charaktere führen, Kompendium lesen,
würfeln. Eine Einschränkung von Safari: Der **Offline-Zwischenspeicher (Service Worker)** wird nur
auf „sicheren“ Adressen (HTTPS oder `localhost`) aktiviert. Ohne HTTPS lädt die App also bei jedem
Öffnen frisch vom Server – im Heimnetz kein Problem, aber eben nicht vollständig offline.

Wer echtes HTTPS möchte (vollständiger Offline-Betrieb, Zugriff auch unterwegs), kann
[Tailscale](https://tailscale.com/) auf Rechner und Geräten installieren und mit `tailscale cert`
ein vertrauenswürdiges Zertifikat ausstellen. Für den Alltag ist das **nicht nötig**.

## Konfiguration

| Variable         | Standard                           | Bedeutung                                    |
| ---------------- | ---------------------------------- | -------------------------------------------- |
| `PORT`           | `3001`                             | Port des Servers                             |
| `DATA_DIR`       | `backend/data`                     | Ablageort der SQLite-Datei                   |
| `DND5E_API_BASE` | `https://www.dnd5eapi.co/api/2014` | Basis-URL der D&D-5e-API (Regelwerk-Version) |

## Daten sichern

Alle Charaktere stecken in einer einzigen Datei: `backend/data/manager.sqlite3`
(bei Docker im Volume `dnd-manager-data`). Kopieren genügt als Sicherung:

```powershell
# Windows
copy backend\data\manager.sqlite3 %USERPROFILE%\Desktop\almanach-sicherung.sqlite3
```

```bash
# Docker auf dem Pi
docker run --rm -v dnd-manager-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/almanach-sicherung-$(date +%F).tar.gz -C /data .
```

## Projektaufbau

```
frontend/   React 19 + Vite, Tailwind CSS v4, PWA
            Schriften (Cinzel, EB Garamond, Unifraktur) liegen als npm-Paket bei,
            damit die App auch ohne Internet richtig aussieht
backend/    Node.js + Express, SQLite über das eingebaute node:sqlite
            (Rückfallebene better-sqlite3 für ältere Node-Versionen)
design/     Die Design-Entwürfe (Artboards) zum mittelalterlichen Erscheinungsbild
docs/       Einrichtungsanleitung.pdf und Spielerhandbuch.pdf (siehe „Dokumentation" oben)
scripts/    Hilfsskripte, plattformunabhängig in Node geschrieben
.vscode/    Start- und Task-Konfiguration für VS Code
```

Nützliche Befehle im Projektstamm:

| Befehl          | Wirkung                                                         |
| --------------- | --------------------------------------------------------------- |
| `npm run setup` | Abhängigkeiten für Backend und Frontend installieren            |
| `npm run dev`   | Entwicklung: Server (3001) und Oberfläche (5173) gleichzeitig    |
| `npm run build` | Oberfläche bauen und ins Backend kopieren                        |
| `npm start`     | Bauen und fertige Fassung starten (3001)                         |
| `npm run serve` | Nur den Server starten (ohne neu zu bauen)                       |

## Erscheinungsbild

Das Design folgt dem Vorbild einer illuminierten Handschrift: Pergament als Grund, aufgelegte
Velin-Tafeln, Rubrikrot für Überschriften, Blattgold als Zierrat, Attribute als Wappenschilde.
Überschriften und Zahlen stehen in *Cinzel*, Fließtext in *EB Garamond*, Initialen in
*UnifrakturMaguntia*. Die Entwürfe dazu liegen als Artboards in `design/`.

Farben und Schriften sind als CSS-Variablen in `frontend/src/index.css` gebündelt – wer etwas
umfärben möchte, ändert sie dort einmal, und beide Fassungen (Pergament und Kerzenlicht) ziehen
mit.

## Quellen & Credits

- Regelwerksdaten: [dnd5eapi.co](https://www.dnd5eapi.co/) von [5e-bits](https://github.com/5e-bits),
  auf Grundlage des D&D 5e SRD (Open Gaming License / Creative Commons)
- API-Dokumentation & Tutorials: <https://5e-bits.github.io/docs/tutorials>
- Schriften: [Cinzel](https://fonts.google.com/specimen/Cinzel),
  [EB Garamond](https://fonts.google.com/specimen/EB+Garamond),
  [UnifrakturMaguntia](https://fonts.google.com/specimen/UnifrakturMaguntia) (SIL Open Font License)

Dungeons & Dragons ist eine Marke von Wizards of the Coast. Dieses Projekt ist ein privates,
nicht-kommerzielles Hilfsmittel und steht in keiner Verbindung zu Wizards of the Coast.
