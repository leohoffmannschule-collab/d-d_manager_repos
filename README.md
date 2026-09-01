# Abenteuer-Almanach

Ein selbst gehosteter Pen & Paper Charaktermanager – gebaut, um auf einem **Raspberry Pi 5** im
Heimnetzwerk zu laufen und von **iPads und iPhones** aus per Browser genutzt zu werden. Kein Papier
mehr, keine Cloud, keine Abhängigkeit von fremden Servern: Alle Charakterdaten bleiben auf deinem Pi.

Referenzdaten (Völker, Klassen, Zauber, Ausrüstung, Monster, …) kommen von der offenen
[D&D 5e API](https://www.dnd5eapi.co/api) des [5e-bits](https://github.com/5e-bits)-Projekts und
werden lokal zwischengespeichert.

## Funktionen

- **Charakterliste** mit Anlegen, Duplizieren und Löschen
- **Vollständiges D&D-5e-Charakterblatt**: Attribute, Rettungswürfe, Fertigkeiten, Kampfwerte,
  Trefferpunkte inkl. Rettungswürfe gegen den Tod, Angriffe, Inventar & Vermögen, Zauber
  (inkl. Suche & Übernahme aus der offiziellen API), Hintergrundgeschichte & Merkmale
- **Generisches Charakterblatt** für andere Pen-&-Paper-Systeme (frei benennbare Abschnitte)
- **Kompendium**: Völker, Klassen, Hintergründe, Talente, Zauber, Ausrüstung, magische
  Gegenstände, Monster und Zustände durchsuchbar direkt aus der D&D 5e API
- **Würfel-Werkzeug** (W4–W100, Anzahl & Modifikator, Wurfverlauf) von überall in der App
  erreichbar
- **Automatisches Speichern** – kein manueller Speicher-Button nötig
- **Als App installierbar** (PWA) – Icon auf dem Home-Bildschirm von iPad/iPhone, läuft im
  Vollbild wie eine native App
- Läuft komplett lokal: eigene SQLite-Datenbank auf dem Pi, keine Registrierung, keine Werbung

## Architektur

```
frontend/   React 19 + Vite, Tailwind CSS, PWA (installierbar, Offline-Cache)
backend/    Node.js + Express, SQLite (better-sqlite3)
            → speichert Charaktere
            → cached die D&D 5e API lokal (funktioniert auch bei wackligem Internet)
```

Das Backend liefert im Produktivbetrieb zusätzlich das gebaute Frontend aus – es läuft also
**ein einziger Prozess/Container** auf Port `3001`.

## Schnellstart mit Docker (empfohlen)

Auf dem Raspberry Pi 5 (Raspberry Pi OS 64-bit, Docker & Docker Compose installiert):

```bash
git clone <URL-dieses-Repos>
cd d-d_manager_repos
docker compose up -d --build
```

Das war's. Die App läuft danach unter `http://<IP-des-Pi>:3001` – z. B.
`http://raspberrypi.local:3001` oder `http://192.168.1.42:3001`.

Docker Compose baut das Image direkt für die Architektur des Pi (arm64) und legt die
Charakterdaten in einem benannten Volume (`dnd-manager-data`) ab, das Container-Neustarts und
-Updates übersteht.

Update auf eine neue Version:

```bash
git pull
docker compose up -d --build
```

### Falls Docker noch nicht installiert ist

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# neu einloggen, danach:
sudo apt install -y docker-compose-plugin
```

## Zugriff von iPad / iPhone

1. Öffne `http://<IP-des-Pi>:3001` in **Safari**.
2. Tippe auf das Teilen-Symbol → **„Zum Home-Bildschirm“**.
3. Fertig – ab jetzt startet die App per Icon im Vollbildmodus, ganz ohne Adressleiste.

Tipp: Vergib dem Raspberry Pi im Router eine feste (DHCP-reservierte) IP-Adresse, damit sich die
Adresse nicht ändert.

### Hinweis zu HTTPS & Offline-Funktion

Über normales `http://` im Heimnetzwerk funktioniert die App vollständig – Charaktere anlegen,
bearbeiten, Kompendium durchsuchen, würfeln. Eine Einschränkung von Safari: der
**Offline-Cache (Service Worker)** wird nur auf „sicheren“ Adressen (HTTPS oder `localhost`)
aktiviert. Ohne HTTPS lädt die App also bei jedem Öffnen frisch vom Pi (kein Problem im
Heimnetz), aber nicht vollständig offline.

Wer echtes HTTPS im Heimnetz möchte (z. B. für vollständige Offline-Nutzung oder Zugriff auch
unterwegs), kann optional [Tailscale](https://tailscale.com/) auf dem Pi und den Geräten
installieren – es baut ein privates VPN zwischen den eigenen Geräten auf und kann per
`tailscale cert` automatisch vertrauenswürdige HTTPS-Zertifikate für den Pi ausstellen. Das ist
für den Alltagsgebrauch aber **nicht notwendig**.

## Manuelle Installation ohne Docker

Falls Docker nicht genutzt werden soll, läuft die App auch direkt mit Node.js (Version 20+):

```bash
# Frontend bauen
cd frontend
npm install
npm run build
cd ..

# Gebautes Frontend ins Backend kopieren, damit es mit ausgeliefert wird
cp -r frontend/dist backend/public

# Backend starten
cd backend
npm install
npm start
```

Für dauerhaften Betrieb (Autostart nach Neustart des Pi) empfiehlt sich `pm2` oder ein
systemd-Service:

```bash
sudo npm install -g pm2
pm2 start src/server.js --name dnd-manager --cwd /pfad/zu/d-d_manager_repos/backend
pm2 save
pm2 startup   # Anweisung ausführen, die pm2 ausgibt
```

## Konfiguration

Umgebungsvariablen (optional, mit sinnvollen Standardwerten):

| Variable         | Standard                                    | Bedeutung                                   |
| ---------------- | -------------------------------------------- | -------------------------------------------- |
| `PORT`           | `3001`                                       | Port des Servers                             |
| `DATA_DIR`       | `./data`                                     | Ablageort der SQLite-Datenbank               |
| `DND5E_API_BASE` | `https://www.dnd5eapi.co/api/2014`           | Basis-URL der D&D-5e-API (Regelwerk-Version) |

Für die 2024er-Regeln kann `DND5E_API_BASE` auf `https://www.dnd5eapi.co/api/2024` gesetzt
werden, sobald diese vollständig verfügbar sind.

## Daten-Backup

Alle Charaktere liegen in einer einzelnen SQLite-Datei im Docker-Volume. Sicherung:

```bash
docker run --rm -v dnd-manager-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/dnd-manager-backup-$(date +%F).tar.gz -C /data .
```

Wiederherstellen entsprechend umgekehrt (`tar xzf` in das Volume hinein).

## Entwicklung

```bash
# Terminal 1 – Backend (Port 3001)
cd backend && npm install && npm run dev

# Terminal 2 – Frontend mit Live-Reload (Port 5173, proxyt /api zum Backend)
cd frontend && npm install && npm run dev
```

## Datenquellen & Credits

- Regelwerksdaten: [dnd5eapi.co](https://www.dnd5eapi.co/) von [5e-bits](https://github.com/5e-bits),
  basierend auf dem D&D 5e SRD (Open Gaming License / Creative Commons)
- API-Dokumentation & Tutorials: <https://5e-bits.github.io/docs/tutorials>

Dungeons & Dragons ist eine Marke von Wizards of the Coast. Dieses Projekt ist ein privates,
nicht-kommerzielles Hilfsmittel und steht in keiner Verbindung zu Wizards of the Coast.
