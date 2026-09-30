# Betrieb im Alltag

Das Kapitel „Einrichtung“ bringt den Almanach zum Laufen. Dieses Kapitel ist für die Zeit danach: für die Monate, in denen er im Regal steht oder auf dem Laptop mitreist, gesichert, aktualisiert, umgezogen und gelegentlich gerettet werden will. Wo die Einrichtung einen Handgriff schon Schritt für Schritt beschreibt, verweist dieses Kapitel darauf und erklärt stattdessen, was dabei geschieht und worauf es ankommt.

## Was läuft, wenn der Almanach läuft

Der Almanach ist **ein** Programm: der Server in `backend/src/server.js`. Er hält die Datenbank offen, beantwortet die Anfragen der Oberfläche, liefert die gebaute Oberfläche selbst aus und hält die Live-Kanäle zu allen offenen Fenstern. Es gibt keinen zweiten Dienst, keine separate Datenbank, keinen Hintergrundprozess.

Dazu kommt, wenn die Runde von außen spielt, **ein** Hilfsprogramm: `cloudflared`, der Tunnel. Er läuft neben dem Almanach, baut eine Verbindung zu Cloudflare auf und reicht Anfragen an den Almanach durch. Fällt er aus, spielt die Runde im Heimnetz weiter; nur von außen kommt niemand mehr herein.

| Weg | Was läuft | Wie man es sieht |
|---|---|---|
| Pi mit Docker | Container `dnd-manager`, dazu `dnd-manager-tunnel` (Schnelltunnel) oder `dnd-manager-domaene` (eigene Adresse) | `docker compose ps` |
| Laptop ohne Docker | ein Fenster mit `npm start`, dazu eines mit `npm run tunnel` | die beiden Fenster |

Der Server lauscht auf Port **3001** (einstellbar über `PORT`). Mehr Ports braucht es nicht: Die Oberfläche kommt über denselben Port, der Live-Kanal auch.

## Starten, anhalten, neu starten

### Auf dem Pi

Docker startet den Almanach nach einem Stromausfall oder Neustart des Pi von selbst (`restart: unless-stopped` in `docker-compose.yml`). Einmal eingerichtet, muss niemand etwas tun.

```bash
docker compose --profile tunnel up -d     # starten (samt Schnelltunnel)
docker compose --profile domaene up -d    # starten (samt benanntem Tunnel)
docker compose ps                         # läuft alles? steht da „healthy“?
docker compose --profile tunnel restart   # neu starten
docker compose down                       # anhalten – die Daten bleiben
```

Docker fragt den Almanach jede Minute nach seinem Lebenszeichen (`GET /api/health`). Die Antwort fasst dabei wirklich die Datenbank an: Ein Server, der noch antwortet, aber nicht mehr an seine Daten kommt – volle Karte, kaputtes Dateisystem –, gilt nach drei Fehlschlägen als `unhealthy`. Die Tunnel-Container starten erst, wenn der Almanach gesund ist; so sieht die Runde beim Hochfahren keine Fehlerseite von Cloudflare.

### Auf dem Laptop

```bash
npm start                 # prüfen, nachinstallieren, bauen (falls nötig), starten
npm start -- --neu-bauen  # die Oberfläche in jedem Fall neu bauen
npm start -- --ohne-bau   # den Bau überspringen – schnellster Start
npm run pruefen           # nur nachsehen, was zu tun wäre
```

Oder doppelklicken: `starten.cmd` unter Windows, `starten.sh` unter macOS und Linux. Das Fenster *ist* der Almanach – solange es offen ist, läuft er; `Strg+C` beendet ihn.

`npm start` (`scripts/start.mjs`) tut der Reihe nach vier Dinge:

1. **Node prüfen.** Unter Node 20 bricht es ab. Ab Node 22.5 bringt Node SQLite selbst mit (`node:sqlite`); darunter braucht es das Paket `better-sqlite3`, das kompiliert werden will – unter Windows mit Visual-Studio-Bauwerkzeugen, also genau dem, was auf einem verwalteten Laptop niemand installieren darf. Deshalb ist 22.5 die empfohlene Grenze.
2. **Abhängigkeiten holen**, nur wenn `backend/node_modules` oder `frontend/node_modules` fehlt. Mit eingebautem SQLite wird `better-sqlite3` gar nicht erst geholt (`--omit=optional`) – es wäre das einzige fertig kompilierte Stück im ganzen Almanach.
3. **Die Oberfläche bauen**, aber nur, wenn nötig: Ist irgendeine Datei unter `frontend/` jünger als das ausgelieferte `backend/public/index.html`, wird neu gebaut. Auf einem Pi dauert der Bau Minuten; ihn bei jedem Start zu wiederholen, wäre Zeitverschwendung.
4. **Den Server starten** – im selben Fenster, sodass `Strg+C` beide zusammen beendet.

`npm run pruefen` sagt, was es tun würde, ohne es zu tun:

```
  Abenteuer-Almanach – Prüfung
  Node           : v22.22.2
  Datenbank      : node:sqlite
  Bausteine      : vollständig
  Oberfläche     : aktuell
  Datenordner    : /home/mara/d-d_manager_repos/backend/data
  Port           : 3001
  Feste Adresse  : keine (DOMAENE nicht gesetzt)
  Tunnel-Kennwort: keins (dann Schnelltunnel)
```

## Der Startbericht

Der Almanach läuft meist auf einem Gerät, vor dem niemand sitzt. Was er beim Start ins Fenster (oder ins Docker-Protokoll) schreibt, ist deshalb die eine Gelegenheit, Klartext zu reden (`backend/src/start/bericht.js`):

```
  Abenteuer-Almanach läuft
  Datenbank      : node:sqlite
  Datenordner    : /app/data
  Oberfläche     : wird mit ausgeliefert
  Für die Runde  : https://almanach.example.org   (solange der Weg nach außen offen ist)
  Auf diesem PC  : http://localhost:3001
  Im Netzwerk    : http://192.168.1.40:3001   (für iPad/iPhone)
```

Darunter stehen, falls nötig, Warnungen – und jede davon ist ernst gemeint:

| Warnung | Bedeutung | Was tun |
|---|---|---|
| „*n* von *m* Bildern fehlen auf der Platte“ | In der Datenbank stehen Bilder, deren Dateien im Ordner `medien/` fehlen. Fast immer ein Umzug, bei dem der Ordner nicht (oder eine Ebene zu tief) mitkam. | Den Ordner `medien` aus dem alten Datenordner neben `manager.sqlite3` legen. |
| „DOMAENE=… ergibt keinen Domainnamen“ | Tippfehler in der `.env`. | Nur den nackten Namen eintragen: `DOMAENE=almanach.example.org`. |
| „Es liegt eine .env daneben, aber dieses Node kann sie nicht lesen“ | Node älter als 20.12. | Node aktualisieren, oder die Werte in der Umgebung setzen. |
| „Die .env ließ sich nicht lesen“ | Die Datei ist kaputt (etwa ein Zeilenumbruch mitten in einem Wert). | Die Zeile in der Meldung ansehen und berichtigen. |
| „*n* Kampagne(n) im Papierkorb waren über die Frist – endgültig entfernt“ | Beim Start räumt der Almanach Kampagnen, die länger als 30 Tage im Papierkorb lagen. | Nichts – es ist ein Hinweis. |
| „Noch kein Konto vorhanden“ | Frischer Almanach. | Die Adresse öffnen; das erste Konto führt die Spielleitung. |

Läuft auf dem Port schon etwas, sagt der Almanach auch das in Klartext statt mit einem Stapelauszug: Es kann immer nur einer den Port haben. Meist läuft der Almanach schon in einem anderen Fenster.

## Der Datenordner

Alles, was der Almanach weiß, liegt in **einem** Ordner:

```
backend/data/                 (auf dem Pi: das Docker-Volume dnd-manager-data, im Container /app/data)
├── manager.sqlite3           die Datenbank – Konten, Blätter, Szenen, Chronik, alles
├── manager.sqlite3-wal       das Schreibprotokoll (nur im Betrieb)
├── manager.sqlite3-shm       sein Inhaltsverzeichnis (nur im Betrieb)
├── medien/                   alle hochgeladenen Bilder, je eine Datei
│   ├── 3f2a…c1.jpg
│   └── …
├── sicherungen/              was `npm run sicherung` anlegt (ohne eigenes Ziel)
└── tunnel.log                das Protokoll des Tunnels (nur auf dem Laptop)
```

Wo der Ordner liegt, bestimmt die Umgebungsvariable `DATA_DIR`; ohne sie ist es `backend/data` neben dem Programm. Der Startbericht nennt ihn immer.

**Die Datenbank** ist eine einzige SQLite-Datei. Der Almanach schreibt im WAL-Verfahren (*write-ahead log*): Neue Schreibvorgänge landen zuerst in `manager.sqlite3-wal` und werden von Zeit zu Zeit in die Hauptdatei übernommen. Das macht Schreiben schnell und Lesen während des Schreibens möglich – und es hat eine Folge, die man kennen muss: **Die Datei `manager.sqlite3` allein ist im Betrieb nicht der ganze Stand.** Wer sie kopiert, während der Almanach läuft, erwischt womöglich einen halben Schreibvorgang. Deshalb gibt es das Sicherungsskript.

**Die Bilder** liegen als gewöhnliche Dateien in `medien/`, benannt nach ihrer Kennung (`<uuid>.jpg`, `.png`, `.webp`, `.gif` oder `.avif`). In der Tabelle `media` steht nur der Verweis. Eine Battlemap hat gern zehn Megabyte; eine Datenbank mit dreihundert davon ließe sich weder schnell lesen noch bequem sichern. Bildnisse von Charakteren sind die Ausnahme: Sie stecken verkleinert *im* Blatt selbst.

**Wie groß wird das?** Die Datenbank bleibt klein – eine Runde mit einem Jahr Chronik, zwanzig Blättern und fünfzig Szenen landet selten über ein paar Megabyte. Der Platz geht an die Bilder: Jede hochgeladene Karte kostet so viel, wie sie groß ist, höchstens 12 MB. Wer eine Karte aus der Bibliothek löscht, gibt ihr Bild frei, sofern nichts anderes es noch braucht.

**Was eine Kampagne mitnimmt, wenn sie endgültig entfernt wird:** ihre Blätter, Kämpfer, Notizen, Würfe, Chat, Szenen samt Figuren, Beute und Chronik. Was bleibt: Konten, Karten, Bilder, Bestiarium, Begegnungen und Klänge – die Vorbereitung gehört der ganzen Runde.

## Sichern

### Was das Skript tut

```bash
npm run sicherung                           # nur die Datenbank, nach backend/data/sicherungen
npm run sicherung -- --medien               # samt Bildern
npm run sicherung -- /mnt/stick --medien    # an einen anderen Ort
npm run sicherung -- --behalten=30          # Sicherungen 30 statt 14 Tage aufheben
```

Auf dem Pi läuft dasselbe im Container: `docker compose exec -T dnd-manager node scripts/sicherung.mjs /app/data/sicherungen --medien`.

Das Skript (`backend/scripts/sicherung.mjs`) kopiert die Datenbank **nicht**. Es lässt SQLite einen in sich stimmigen Stand in eine neue Datei schreiben (`VACUUM INTO`) – während die Runde weiterspielt, ohne sie anzuhalten. Nebenbei ist die Sicherung aufgeräumt und oft kleiner als das Original.

Jede Sicherung ist ein eigener Ordner mit Datum und Uhrzeit:

```
sicherungen/
├── almanach-2026-09-28-0400/
│   └── manager.sqlite3
├── almanach-2026-09-29-0400/
│   └── manager.sqlite3
└── almanach-2026-09-30-2315/
    ├── manager.sqlite3
    └── medien/              (nur mit --medien)
```

Die Uhrzeit ist die des Rechners in UTC. Ordner, die älter sind als `--behalten` Tage (Vorgabe 14), räumt das Skript beim nächsten Lauf weg – gemessen am Änderungsdatum des Ordners. `--behalten=0` räumt nie.

### Wann

| Wie oft | Was | Warum |
|---|---|---|
| jede Nacht (Pi) oder nach jedem Abend (Laptop) | `sicherung` | gegen Fehlgriffe: die versehentlich gelöschte Notiz, die kaputtgespielte Szene |
| einmal die Woche | `sicherung --medien` | damit auch neue Karten gesichert sind |
| einmal die Woche | den Ordner `sicherungen` **weg vom Gerät** kopieren | gegen den Tod der Speicherkarte |
| vor jedem Aktualisieren | `sicherung --medien` | damit es einen Weg zurück gibt |

Die Befehle für den nächtlichen Plan (cron auf dem Pi, Aufgabenplanung unter Windows) stehen im Kapitel „Einrichtung“, Abschnitt 8.

Eine Sicherung auf derselben Speicherkarte schützt vor Fehlgriffen, nicht vor dem Tod der Karte. Eine Speicherkarte im Pi lebt nicht ewig – Schreibvorgänge nutzen sie ab, und ein Stromausfall im falschen Moment kann sie beschädigen. Die Kopie weg vom Gerät ist deshalb keine Kür.

### Zurückspielen

Die Schritte im Einzelnen stehen in „Einrichtung“, Abschnitt 8.3. Das Wesentliche in drei Sätzen:

1. **Den Almanach anhalten.** Eine Datenbank, die gerade geöffnet ist, lässt sich nicht sicher ersetzen.
2. **`manager.sqlite3`, `manager.sqlite3-wal` und `manager.sqlite3-shm` löschen – alle drei** – und die Sicherung an ihre Stelle legen. Bleiben die beiden Begleitdateien liegen, legt sich beim Start der alte Stand über die zurückgespielte Datei, und das Zurückspielen war wirkungslos, ohne jede Fehlermeldung.
3. **Starten und prüfen**, ob etwas fehlt, das *nach* dem Sicherungszeitpunkt entstanden war. Ist es noch da, hat das Zurückspielen nicht gegriffen.

Auf dem Pi gehört die zurückgespielte Datei danach dem Benutzer des Containers (Kennung 1000); sonst meldet der Almanach `datenbank_unerreichbar`. Auch das steht in 8.3.

### Nur einen Teil zurückholen

Eine Sicherung ist immer der ganze Almanach. Wer nur eine gelöschte Notiz oder eine Szene von vorgestern zurückwill, ohne den Abend von gestern zu verlieren, startet die Sicherung als **zweiten Almanach daneben**:

```bash
DATA_DIR=/tmp/alter-stand PORT=3002 npm start
```

(`/tmp/alter-stand` enthält die zurückgeholte `manager.sqlite3` und, falls nötig, den Ordner `medien`.) Der zweite Almanach läuft auf Port 3002 mit dem alten Stand; der Startbericht nennt seinen Datenordner, damit man die beiden nicht verwechselt. Dort meldet man sich an, schlägt nach und schreibt ab – oder nimmt ein Blatt mit „Mitnehmen“ als Datei heraus. Danach das Fenster schließen und den Ordner löschen.

### Ein Blatt aus der mitgenommenen Datei zurückholen

Die Datei, die „Mitnehmen“ auf dem Charakterblatt erzeugt, trägt am Ende den vollständigen Datensatz des Blattes:

```html
<script type="application/json" id="almanach-daten">{ "name": …, "system": …, "data": { … }, "stand": … }</script>
```

Einen Knopf zum Einlesen gibt es nicht. Wer ein verlorenes Blatt daraus zurückholen will, geht so vor:

1. Die Datei in einem Texteditor öffnen und den Inhalt zwischen `<script type="application/json" id="almanach-daten">` und `</script>` kopieren.
2. Im Almanach anmelden, die Kampagne wählen und die Entwicklerwerkzeuge des Browsers öffnen (meist `F12`), Reiter „Konsole“.
3. Eingeben – für `DATEN` den kopierten Text einsetzen:

```js
const d = DATEN;
await fetch('/api/characters', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: d.name, system: d.system, data: d.data }),
}).then((r) => r.json());
```

Das Blatt steht danach in der Übersicht und gehört der Person, die angemeldet ist. Die Spielleitung teilt es unter *Spielleitung → Runde* der richtigen Person zu. In der Datei geänderte Werte kommen dabei mit – die Datei ist ja nur Text.

## Aktualisieren

Die Befehle stehen in „Einrichtung“, Abschnitt 10. Was dabei geschieht:

1. **Sichern** – immer zuerst.
2. **`git pull`** holt den neuen Quellcode. Am laufenden Almanach ändert das noch nichts: Die Oberfläche, die er ausliefert, ist die gebaute in `backend/public`, und die ist nicht im Git.
3. **Bauen und neu starten.** Auf dem Pi baut `docker compose … up -d --build` ein neues Abbild und ersetzt den Container; das Volume mit den Daten bleibt. Auf dem Laptop merkt `npm start`, dass sich die Oberfläche geändert hat, und baut sie neu.
4. **Die Datenbank wächst mit**, ohne dass jemand etwas tun muss: Beim Start prüft jeder Schritt in `backend/src/datenbank/nachruesten.js`, ob eine Spalte fehlt, und legt sie an. Es gibt keine nummerierten Wanderungen und nichts, was man vergessen könnte.
5. **Die Runde muss nichts tun.** Beim nächsten Laden bekommt ihr Browser die neue Oberfläche.

**Zurück auf eine ältere Fassung** ist nicht vorgesehen. Eine neue Fassung legt womöglich Spalten an, die die alte nicht kennt; meist stört das nicht, aber zugesagt ist es nicht. Wer nach einem Update zurückwill, spielt die Sicherung von vor dem Update zurück *und* holt den alten Stand des Codes (`git checkout <commit>`), in dieser Reihenfolge.

## Umziehen

Vom Laptop auf den Pi, vom alten Pi auf den neuen, von einem Rechner auf einen anderen: Es muss nur **der Datenordner** mit, und die `.env`, falls es eine gibt.

1. Auf dem alten Gerät: den Almanach **anhalten** und `npm run sicherung -- --medien` ausführen (oder den Datenordner im angehaltenen Zustand ganz kopieren).
2. Auf dem neuen Gerät den Almanach einrichten, wie im Kapitel „Einrichtung“ beschrieben, aber noch **kein Konto anlegen**.
3. Den Almanach dort anhalten, `manager.sqlite3` und den Ordner `medien` in den neuen Datenordner legen (die Begleitdateien `-wal` und `-shm` dort vorher löschen, falls es sie schon gibt).
4. Die `.env` hinüberkopieren – mit ihr ziehen feste Adresse und Tunnel-Kennwort um.
5. Starten und **den Startbericht lesen**: Fehlen Bilder, steht es dort.

Ins Docker-Volume auf dem Pi kommt der Stand am einfachsten mit einem kurzlebigen Hilfscontainer, der Volume und aktuellen Ordner verbindet (siehe „Einrichtung“, 8.3, „Aus einer vollständigen Kopie“).

Die Runde merkt vom Umzug nichts – vorausgesetzt, die Adresse bleibt dieselbe. Mit eigener Domain ist das so, sobald der benannte Tunnel auf dem neuen Gerät läuft. Mit dem Schnelltunnel gibt es ohnehin bei jedem Start eine neue Adresse.

## Konten und Kampagnen pflegen

### Kennwörter

| Wer hat es vergessen? | Was hilft |
|---|---|
| jemand aus der Runde | Die Spielleitung setzt es unter *Spielleitung → Runde → Konten* neu. |
| die Spielleitung, und es gibt eine zweite | Die zweite setzt es dort neu. |
| die einzige Spielleitung | `npm run kennwort -- "Name"` auf dem Rechner des Almanachs (auf dem Pi: `docker compose exec dnd-manager node scripts/kennwort.mjs "Name"`). |

Das Skript (`backend/scripts/kennwort.mjs`) würfelt ein neues Kennwort aus, zeigt es einmal an und beendet alle Anmeldungen des Kontos. Es nimmt bewusst kein Kennwort auf der Befehlszeile entgegen: Was man dort tippt, steht danach in der Befehlsgeschichte der Shell. Man meldet sich mit dem ausgewürfelten an und wählt im Konto-Menü gleich ein eigenes. Ohne Namen aufgerufen, zeigt das Skript alle Konten.

Jeder Kennwortwechsel beendet Anmeldungen: der eigene im Konto-Menü alle *anderen* dieses Kontos (das eigene Fenster bleibt angemeldet), der durch die Spielleitung und der mit dem Skript alle. Wer ein Kennwort ändert, weil es jemand anderes kennen könnte, wirft damit auch diesen jemand hinaus.

### Wer die Runde verlässt

Unter *Spielleitung → Runde → Konten* lässt sich ein Konto löschen. Die Blätter des Kontos bleiben und gehen an die Spielleitung, die löscht – so geht keine Figur verloren, die noch als NSC gebraucht werden könnte. Das eigene Konto und die letzte Spielleitung lassen sich nicht löschen. Offene Fenster des gelöschten Kontos werden sofort getrennt.

Wer nur aus einer Kampagne heraus soll, aber in anderen weiterspielt, wird dort unter *Mitglieder* herausgenommen statt gelöscht.

Nicht eingelöste Einladungscodes lassen sich zurückziehen. Ein liegengebliebener Code ist eine offene Tür: Wer ihn findet, kann sich ein Konto anlegen. Codes, die niemand mehr braucht, gehören deshalb weg.

### Kampagnen

- **Umbenennen** geht in der Oberfläche unter *Spielleitung → Runde*. Wer gerade keinen Browser hat oder nicht mehr hineinkommt: `node backend/scripts/umbenennen.mjs "Alter Name" "Neuer Name"`. Ohne Namen zeigt das Skript alle Kampagnen, auch die im Papierkorb. Der Name hängt an nichts – alles verweist auf die Kennung der Kampagne –, Umbenennen ist also gefahrlos.
- **Löschen** schickt eine Kampagne in den Papierkorb; zur Bestätigung muss ihr Name abgetippt werden. Nach 30 Tagen entfernt der Almanach sie endgültig – beim nächsten Start oder beim nächsten Blick in den Papierkorb, was zuerst kommt; bis dahin stellt „Wiederherstellen“ alles zurück, wie es war. Umbenennen, Löschen und Wiederherstellen darf nur, wer die Kampagne angelegt hat.
- **Vorlagen nachlegen:** `npm run vorlagen` legt in jeder Kampagne außerhalb des Papierkorbs nach, was von den zwölf Vorlagen fehlt; `npm run vorlagen -- "Name"` nur in einer. Vorhandene – auch umgeschriebene – bleiben unangetastet.

Alle drei Skripte dürfen laufen, während der Almanach läuft. Die offenen Fenster sehen die Änderung nach einem Neuladen der Seite; die Skripte haben keinen Draht zu ihnen.

## Zwei Almanache nebeneinander

Manchmal will man etwas ausprobieren, ohne den Almanach der Runde anzufassen: eine neue Fassung, eine zurückgeholte Sicherung, eine Idee. Dafür genügen ein eigener Datenordner und ein eigener Port:

```bash
DATA_DIR=~/almanach-probe PORT=3002 npm start
```

Der Startbericht nennt den Datenordner in der zweiten Zeile – wer zwei Fenster offen hat, sieht so sofort, welcher Almanach gerade spricht. Zwei auf demselben Port gehen nicht, und das ist gut so: Über die Domain käme sonst mal der eine und mal der andere.

Ein laufender Tunnel zeigt auf den Port, mit dem er gestartet wurde – im Docker-Betrieb fest auf den Container `dnd-manager:3001`, auf dem Laptop auf `PORT` aus der Umgebung oder der `.env`, meist 3001. Ein Probe-Almanach auf 3002 ist also nur im Heimnetz zu erreichen – was für eine Probe genau richtig ist.

## Protokolle und Ressourcen

**Auf dem Pi** schreibt der Almanach ins Docker-Protokoll: `docker compose logs --tail=50 dnd-manager`, mit `-f` zum Mitlesen. Docker hält davon höchstens drei Dateien zu zehn Megabyte je Dienst und überschreibt dann die ältesten – ein Pi läuft monatelang, und ohne Grenze wüchse das Protokoll, bis die Karte voll ist.

**Auf dem Laptop** steht alles im Fenster, in dem der Almanach läuft. Der Tunnel schreibt zusätzlich nach `backend/data/tunnel.log`; daraus liest `npm run adresse` die gerade gültige Adresse.

Was im Protokoll steht, ist wenig: der Startbericht, Warnungen (eine fehlende Bilddatei, ein Fehler im Server mit Stapelauszug) und sonst nichts. Anfragen werden nicht mitgeschrieben – es gibt keine Liste, wer wann was aufgerufen hat.

**Was der Almanach braucht:** Im Leerlauf belegt der Server rund 70 MB Arbeitsspeicher (gemessen mit Node 22 auf einem 64-Bit-Linux); eine spielende Runde legt wenig darauf, und die Rechenlast ist ein kleiner Bruchteil eines Kerns. Teuer sind drei Dinge, und alle drei sind kurz: der Bau der Oberfläche (Minuten, nur beim Aktualisieren), eine Anmeldung (rund eine Zehntelsekunde für das Kennwort) und das Neurechnen der Sicht bei jedem Zug auf einer großen Karte. `docker stats` zeigt, was gerade verbraucht wird.

## Sicherheit im Betrieb

Der Almanach ist so gebaut, dass im Normalfall nichts einzustellen ist. Ein paar Dinge liegen trotzdem in der Hand dessen, der ihn betreibt:

- **Die `.env` gehört niemandem sonst.** Sie trägt das Kennwort des benannten Tunnels (`TUNNEL_TOKEN`) und gegebenenfalls den Schlüssel eines Sprachmodells. Sie steht in `.gitignore` und darf nie ins Git, nie in einen Chat, nie in ein Foto vom Bildschirm. Wer sie verloren glaubt, erzeugt in Cloudflare ein neues Tunnel-Kennwort.
- **`TRUST_PROXY` nur, wenn wirklich ein Proxy davorsteht.** Im Docker-Betrieb steht es auf `1`, weil der Tunnel-Container der erste Zwischenschritt ist. Nur wem der Almanach hier glaubt, darf ihm sagen, die Anfrage sei über HTTPS gekommen – und erst dann setzt er das Anmelde-Cookie als `Secure`. Ein falscher Wert öffnet dem Fälschen dieser Angabe die Tür.
- **Der Container läuft nicht als root.** Das Abbild legt den Datenordner für den Benutzer `node` an und startet den Server als dieser. Wer Dateien von Hand ins Volume legt, muss sie ihm übereignen (Kennung 1000).
- **Einladungscodes zurückziehen**, die niemand mehr braucht, und **Konten löschen**, deren Menschen die Runde verlassen haben.
- **Das Gerät aktuell halten.** Der Almanach selbst hat wenige Abhängigkeiten, aber das Betriebssystem darunter will seine Updates: `sudo apt update && sudo apt upgrade` auf dem Pi, gelegentlich.

Was der Almanach von sich aus tut – Kennwörter mit scrypt, Sitzungen nur als Hash, Drossel gegen Durchprobieren, keine Freigabe für fremde Seiten, Schutzkopfzeilen gegen Einbetten und Typraten –, beschreibt das Kapitel „Anmeldung, Rollen und Sicherheit“.

## Ein Wartungskalender

| Wann | Was | Wie lange |
|---|---|---|
| nach jedem Spielabend | Chronik-Sitzung schließen; auf dem Laptop `npm run sicherung` | eine Minute |
| jede Woche | `sicherung --medien`, Sicherungen weg vom Gerät kopieren | fünf Minuten |
| jeden Monat | Einladungscodes und Konten durchsehen; `docker compose ps` auf „healthy“; freien Platz prüfen (`df -h`) | fünf Minuten |
| alle paar Monate | Betriebssystem aktualisieren; Almanach aktualisieren (vorher sichern) | eine Viertelstunde |
| einmal im Jahr | Zurückspielen üben – mit einem Probe-Almanach auf Port 3002 | eine Viertelstunde |

Der letzte Punkt klingt übertrieben und ist der wichtigste: Eine Sicherung, die nie zurückgespielt wurde, ist eine Hoffnung. Mit einem Probe-Almanach daneben kostet die Probe nichts und stört niemanden.
