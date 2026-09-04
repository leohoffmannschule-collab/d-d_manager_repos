# Einrichtungs-Handbuch

Vom nackten Raspberry Pi bis zur Runde, die am Freitagabend aus fünf
Wohnzimmern am selben Tisch sitzt.

Für den ganzen Weg brauchst du **etwa zwei Stunden**, davon die meiste Zeit
Wartezeit. Du musst kein Fachmann sein: Jeder Befehl steht hier zum Abtippen
oder Kopieren, und hinter jedem steht, was er tut.

---

## Inhalt

1. [Was du brauchst](#1-was-du-brauchst)
2. [Den Pi vorbereiten](#2-den-pi-vorbereiten)
3. [Docker installieren](#3-docker-installieren)
4. [Den Almanach holen und starten](#4-den-almanach-holen-und-starten)
5. [Erster Blick und das Konto der Spielleitung](#5-erster-blick-und-das-konto-der-spielleitung)
6. [Von außen erreichbar: der Cloudflare-Tunnel](#6-von-außen-erreichbar-der-cloudflare-tunnel)
7. [Musik: Spotify einrichten](#7-musik-spotify-einrichten)
8. [Sicherung einrichten](#8-sicherung-einrichten)
9. [Die Runde einladen](#9-die-runde-einladen)
10. [Aktualisieren](#10-aktualisieren)
11. [Wenn etwas klemmt](#11-wenn-etwas-klemmt)
12. [Anhang: alle Stellschrauben](#12-anhang-alle-stellschrauben)

---

## 1. Was du brauchst

**Geräte**

| Was | Anmerkung |
| --- | --- |
| Raspberry Pi 5 | 8 GB reichen, 16 GB sind bequem. Ein Pi 4 tut es auch, baut aber länger. |
| Speicherkarte oder SSD | Mindestens 32 GB. Eine SSD am USB-Anschluss hält deutlich länger als eine SD-Karte – Karten sterben nach ein bis zwei Jahren Dauerbetrieb gern. |
| Netzteil | Das offizielle. Ein zu schwaches Netzteil zeigt sich als sporadische Abstürze, die man ewig woanders sucht. |
| Netzwerkkabel | Geht auch per WLAN, aber Kabel ist an einem Server einfach eine Sorge weniger. |

**Konten**

| Was | Kosten | Wofür |
| --- | --- | --- |
| Cloudflare-Konto | kostenlos | Der Tunnel nach außen, ohne Portfreigabe im Router. |
| Eine eigene Domain | **etwa 10 € im Jahr** | Nötig für den Tunnel. Ohne Domain gibt es keine feste Adresse und kein HTTPS – und ohne HTTPS keine Musik. |
| Spotify Premium | falls schon vorhanden | Nur für den Klangteppich, und nur für die, die zuhören wollen. Der Rest der Runde spielt ohne. |

> **Zur Domain.** Das ist der einzige Posten, der wirklich Geld kostet. Eine
> `.de`- oder `.eu`-Adresse gibt es bei den üblichen Anbietern für rund
> 10 € im Jahr; Cloudflare selbst verkauft sie zum Einkaufspreis. Der Name
> ist egal – `wuerfelturm.de` tut es genauso wie etwas Seriöses.

---

## 2. Den Pi vorbereiten

### 2.1 Betriebssystem aufspielen

Lade den **Raspberry Pi Imager** auf deinen normalen Rechner und wähle:

- **Gerät:** Raspberry Pi 5
- **Betriebssystem:** Raspberry Pi OS (64-bit) – Lite genügt, du brauchst keine Oberfläche
- **Speicher:** deine Karte oder SSD

Vor dem Schreiben auf das **Zahnrad** klicken und gleich mit einstellen:

- Hostname: `almanach` (dann erreichst du ihn später als `almanach.local`)
- Benutzername und Passwort – **merken**, das brauchst du gleich
- SSH aktivieren
- WLAN-Zugang, falls kein Kabel

Schreiben, Karte in den Pi, Strom dran. Der erste Start dauert eine Minute.

### 2.2 Anmelden

Vom normalen Rechner aus (Terminal unter macOS/Linux, PowerShell unter Windows):

```bash
ssh deinname@almanach.local
```

Falls das nicht geht, findest du die Adresse im Router unter den verbundenen
Geräten, und es geht mit `ssh deinname@192.168.…` statt des Namens.

### 2.3 Auf den neuesten Stand bringen

```bash
sudo apt update && sudo apt full-upgrade -y
sudo reboot
```

Der Pi startet neu, die Verbindung bricht ab – das gehört so. Nach einer
Minute wieder anmelden.

---

## 3. Docker installieren

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

Der zweite Befehl erlaubt dir, Docker ohne `sudo` zu bedienen. Damit das
greift, musst du dich **einmal ab- und wieder anmelden**:

```bash
exit
ssh deinname@almanach.local
```

Prüfen, ob es sitzt:

```bash
docker run --rm hello-world
```

Kommt ein freundlicher Absatz Text, ist alles gut.

---

## 4. Den Almanach holen und starten

```bash
sudo apt install -y git
git clone https://github.com/leohoffmannschule-collab/d-d_manager_repos.git
cd d-d_manager_repos
```

> Solange die Arbeit noch auf einem Zweig liegt und nicht im Hauptzweig:
> `git checkout claude/dnd-platform-architecture-wbwul3`

Jetzt die Einstellungsdatei anlegen:

```bash
cp .env.example .env
```

Die Datei kannst du vorerst so lassen – die Werte tragen wir in Schritt 6
und 7 nach. Und dann:

```bash
docker compose up -d --build
```

**Das dauert beim ersten Mal fünf bis fünfzehn Minuten.** Der Pi baut die
Oberfläche selbst; danach geht jeder Start in Sekunden. Zusehen kannst du mit:

```bash
docker compose logs -f
```

(Mit `Strg+C` beendest du das Zusehen, nicht den Almanach.)

Wenn dort steht `Abenteuer-Almanach läuft`, ist er da. Prüfen:

```bash
docker compose ps
```

In der Spalte `STATUS` soll nach etwa einer halben Minute `healthy` stehen.
Der Container fragt sich alle sechzig Sekunden selbst, ob er noch antwortet
und an seine Datenbank kommt – und wird von Docker neu gestartet, wenn nicht.

---

## 5. Erster Blick und das Konto der Spielleitung

Ruf im Browser die Adresse deines Pi auf, Port 3001:

```
http://almanach.local:3001
```

Du siehst die Anmeldeseite. **Das allererste Konto wird automatisch die
Spielleitung** – das ist deins. Name und Passwort vergeben, fertig.

> Es gibt kein zweites „erstes Konto“. Alle weiteren treten nur mit einem
> Einladungscode bei, den du unter *Spielleitung → Runde* erzeugst. Von außen
> kann sich also niemand einfach ein Konto anlegen.

Schau dich ruhig um. Was jetzt schon geht: Charakterblätter, Spieltisch,
Bestiarium, Würfel, Kompendium. Was noch nicht geht: die Runde von außen
erreichen (Schritt 6) und Musik (Schritt 7).

---

## 6. Von außen erreichbar: der Cloudflare-Tunnel

Das ist der Schritt, der aus einem Kasten im Regal eine Runde macht, die von
überall spielt. Der Trick: Der Pi ruft bei Cloudflare **von innen nach außen**
an und hält die Leitung offen. Du brauchst keine Portfreigabe im Router, und
dein Anschluss steht nicht offen im Netz.

### 6.1 Domain zu Cloudflare bringen

1. Konto anlegen auf [dash.cloudflare.com](https://dash.cloudflare.com).
2. Domain hinzufügen. Hast du schon eine, folgt Cloudflare dich durch den
   Umzug der Nameserver (dauert ein paar Stunden). Hast du noch keine, kaufst
   du sie unter *Domain Registration* gleich dort.
3. Warten, bis die Domain in der Übersicht als **Active** geführt wird.

### 6.2 Tunnel anlegen

1. Auf [one.dash.cloudflare.com](https://one.dash.cloudflare.com) wechseln
   (das ist der Zero-Trust-Bereich).
2. **Networks → Tunnels → Create a tunnel**
3. Als Art **Cloudflared** wählen, Name z. B. `almanach`.
4. Cloudflare zeigt dir jetzt Installationsbefehle. **Die brauchst du nicht** –
   der Tunnel läuft bei uns im Container. Du brauchst nur das lange
   **Token** aus dem angezeigten Befehl (die Zeichenkette hinter
   `--token`). Kopieren.
5. Weiter zu **Public Hostname** und eintragen:

   | Feld | Wert |
   | --- | --- |
   | Subdomain | `almanach` (oder was du magst) |
   | Domain | deine Domain |
   | Type | `HTTP` |
   | URL | `dnd-manager:3001` |

   > `dnd-manager` ist der Name des Containers. Der Tunnel läuft im selben
   > Docker-Netz und erreicht ihn unter diesem Namen. **Nicht** `localhost`
   > eintragen – das wäre der Tunnel selbst.

6. Speichern.

### 6.3 Token eintragen und starten

Zurück auf dem Pi:

```bash
nano .env
```

Die Zeile `CLOUDFLARE_TUNNEL_TOKEN=` mit dem kopierten Token füllen, also
`CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoi…`. Speichern mit `Strg+O`, `Enter`,
schließen mit `Strg+X`.

Dann den Tunnel dazuschalten:

```bash
docker compose --profile tunnel up -d
```

Nach einer Minute ist deine Runde erreichbar unter:

```
https://almanach.deine-domain.de
```

Das `https` kommt von Cloudflare und kostet dich nichts. Ab jetzt ist **das**
die Adresse, die deine Runde benutzt.

> **Merke dir diese Adresse.** Schritt 7 braucht sie ganz genau.

### 6.4 Wenn du es noch fester zumachen willst

Der Almanach schützt sich selbst: Passwörter liegen nur als scrypt-Hash in
der Datenbank, nach acht Fehlversuchen ist zehn Minuten Ruhe, und ohne
Einladungscode kommt niemand hinein. Für eine private Runde reicht das.

Wer mehr will, legt in Cloudflare unter *Access → Applications* eine zweite
Tür davor. Bedenke aber: Deine Mitspieler müssen sich dann **zweimal**
anmelden, und die Live-Verbindung zum Spieltisch verträgt sich nicht mit
jeder Access-Einstellung. Für den Anfang: lass es.

---

## 7. Musik: Spotify einrichten

Freiwillig. Ohne diesen Schritt funktioniert alles andere, es ist nur still.

**Wie es funktioniert:** Der Almanach spielt selbst keine Musik und speichert
niemandes Spotify-Zugangsdaten. Er merkt sich nur, *welche* Wiedergabeliste
gerade laufen soll. Der Ton entsteht im Browser jedes Einzelnen – anders
ginge es nicht, wenn ihr in fünf verschiedenen Wohnzimmern sitzt.

### 7.1 Eine Spotify-Anwendung anlegen

1. Auf [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
   mit deinem Spotify-Konto anmelden.
2. **Create app**
3. Ausfüllen:

   | Feld | Wert |
   | --- | --- |
   | App name | `Abenteuer-Almanach` |
   | App description | irgendwas |
   | Redirect URI | `https://almanach.deine-domain.de/spotify` |
   | Which API/SDKs are you planning to use? | **Web API** *und* **Web Playback SDK** ankreuzen |

   > Die Redirect-URI muss **auf das Zeichen genau** stimmen – mit `https://`,
   > ohne Schrägstrich am Ende, und mit `/spotify` dahinter. Spotify weist
   > sonst die Anmeldung ab. Den fertigen Text zum Kopieren findest du auch
   > im Almanach selbst unter *Spielleitung → Klang*, sobald Schritt 6 steht.

4. Speichern, dann **Settings** öffnen und die **Client ID** kopieren.

### 7.2 Die Kennung eintragen

Auf dem Pi:

```bash
nano .env
```

Bei `SPOTIFY_CLIENT_ID=` die kopierte Kennung eintragen, speichern, und dann:

```bash
docker compose --profile tunnel up -d
```

Docker merkt, dass sich etwas geändert hat, und startet den Almanach neu.

### 7.3 Deine Mitspieler freischalten — **nicht überspringen**

Eine frisch angelegte Spotify-Anwendung läuft im *Development mode*. Darin
darf sie **nur Konten bedienen, die du ausdrücklich einträgst** – bis zu 25
Stück. Wer nicht auf der Liste steht, bekommt bei der Anmeldung eine
Fehlermeldung, und zwar eine, die nicht verrät, woran es liegt.

Also im Dashboard:

1. Deine App öffnen → **Settings → User Management**
2. Für jeden aus der Runde **Name und die E-Mail-Adresse des Spotify-Kontos**
   eintragen (nicht irgendeine Adresse – die, mit der sie bei Spotify
   angemeldet sind).
3. Speichern.

25 Plätze reichen für jede Spielrunde. So handhabt Spotify das derzeit; sollte
sich das ändern, steht es in deren Dashboard.

### 7.4 Ausprobieren

Im Almanach unter *Spielleitung → Klang*:

1. **Neue Ambiente** → einen Spotify-Link einfügen (in Spotify: Rechtsklick auf
   eine Wiedergabeliste → *Teilen* → *Link kopieren*), benennen, speichern.
2. **Auflegen**
3. Unten rechts erscheint die **Klangleiste**. Dort *Mit Spotify verbinden*,
   danach **Zuhören** drücken.

Der Knopf „Zuhören“ ist keine Schikane: Browser geben Ton erst nach einem
Klick frei. Einmal pro Sitzung, dann läuft es.

**Was jeder Mitspieler selbst regelt:** die eigene Lautstärke, Stummschalten
(merkt niemand), und ob der Ton aus dem Browserfenster kommt oder aus einem
anderen Spotify-Gerät – Handy, Rechner, Anlage.

**Zwei Grenzen, die von Spotify kommen:**

- Abspielen im Browser verlangt **Spotify Premium**. Ohne Premium leitet man
  den Ton auf ein anderes Gerät um, auf dem Spotify ohnehin läuft.
- Es geht **nur über die HTTPS-Adresse** aus Schritt 6. Über
  `http://almanach.local:3001` gibt der Browser keinen Ton frei und lässt
  auch die Anmeldung nicht zu. Auf dem iPad spielt der Browser gar nicht –
  dort nimmt man den Umweg über ein anderes Gerät.

---

## 8. Sicherung einrichten

Zwei Dinge können schiefgehen, und sie brauchen verschiedene Antworten:

| Missgeschick | Antwort |
| --- | --- |
| Jemand löscht versehentlich alle Notizen | Nächtliche Sicherung **auf dem Pi** |
| Die Speicherkarte stirbt | Wöchentliche Kopie **weg vom Pi** |

### 8.1 Nächtlich: die Datenbank

Die Datenbank darf im Betrieb **nicht einfach kopiert** werden. Der Almanach
schreibt im WAL-Verfahren; eine Kopie mitten im Spiel erwischt womöglich einen
halben Schreibvorgang und ist beim Zurückspielen wertlos. Das mitgelieferte
Skript zieht stattdessen einen in sich stimmigen Stand, während weitergespielt
wird.

Aufgabenplan öffnen:

```bash
crontab -e
```

(Beim ersten Mal fragt er nach einem Editor – `nano` wählen.) Ans Ende:

```cron
# Jede Nacht um vier: die Datenbank sichern, 14 Tage aufheben
0 4 * * * cd ~/d-d_manager_repos && docker compose exec -T dnd-manager node scripts/sicherung.mjs /app/data/sicherungen --behalten=14 >> ~/sicherung.log 2>&1

# Sonntags um fünf: einmal alles, samt Karten und Bildnissen
0 5 * * 0 cd ~/d-d_manager_repos && docker compose exec -T dnd-manager node scripts/sicherung.mjs /app/data/sicherungen --medien --behalten=14 >> ~/sicherung.log 2>&1
```

Einmal von Hand ausprobieren, damit du weißt, dass es geht:

```bash
docker compose exec -T dnd-manager node scripts/sicherung.mjs /app/data/sicherungen --medien
```

### 8.2 Wöchentlich: weg vom Pi

Das Obige liegt auf derselben Karte wie das Original – gegen einen Kartentod
hilft es nicht. Deshalb zusätzlich von deinem normalen Rechner aus, etwa
sonntags:

```bash
ssh deinname@almanach.local "cd ~/d-d_manager_repos && docker run --rm \
  -v dnd-manager-data:/data -v /tmp:/backup alpine \
  tar czf /backup/almanach-$(date +%F).tar.gz -C /data ."
scp deinname@almanach.local:/tmp/almanach-*.tar.gz ~/Almanach-Sicherungen/
```

Ein Ordner in der Cloud oder auf einer externen Platte tut es genauso. Der
Punkt ist nur: **nicht auf demselben Gerät.**

### 8.3 Zurückspielen

> **Die eine Falle.** Neben `manager.sqlite3` liegen im Betrieb zwei
> Begleitdateien, `manager.sqlite3-wal` und `manager.sqlite3-shm`. Darin steht,
> was zuletzt geschrieben wurde. Legst du nur die Datenbank zurück und lässt
> die beiden liegen, **legt sich der alte Stand beim Start wieder darüber –
> und dein Zurückspielen war wirkungslos, ohne jede Fehlermeldung.** Die
> Begleitdateien müssen mit weg.

**Aus einer nächtlichen Sicherung** (der übliche Fall):

```bash
cd ~/d-d_manager_repos
docker compose down                      # Almanach anhalten – wichtig

docker run --rm -v dnd-manager-data:/data alpine sh -c '
  ls /data/sicherungen'                  # welche gibt es?

docker run --rm -v dnd-manager-data:/data alpine sh -c '
  rm -f /data/manager.sqlite3 /data/manager.sqlite3-wal /data/manager.sqlite3-shm &&
  cp /data/sicherungen/almanach-2026-09-04-0400/manager.sqlite3 /data/ &&
  chown 1000:1000 /data/manager.sqlite3'

docker compose --profile tunnel up -d
```

Das Datum in der vorletzten Zeile durch den Ordner ersetzen, den der Befehl
davor angezeigt hat.

**Aus einer vollständigen Kopie** (nach einem Kartentod, auf frischem System):

```bash
docker compose down
docker run --rm -v dnd-manager-data:/data -v "$PWD":/backup alpine \
  sh -c 'rm -rf /data/* && tar xzf /backup/almanach-2026-09-04.tar.gz -C /data &&
         chown -R 1000:1000 /data'
docker compose --profile tunnel up -d
```

Hier fällt die Falle nicht auf, weil `rm -rf /data/*` die Begleitdateien
ohnehin mitnimmt.

**Danach prüfen**, ob es wirklich gegriffen hat – nicht nur, ob der Almanach
startet: Melde dich an und sieh nach, ob etwas fehlt, das *nach* dem
Sicherungszeitpunkt entstanden war. Ist es noch da, hat das Zurückspielen
nicht gewirkt.

---

## 9. Die Runde einladen

1. Im Almanach: *Spielleitung → Runde → Einladungscode erzeugen*
2. Den Code weitergeben – einer je Person, jeder gilt nur einmal.
3. Deine Mitspieler öffnen `https://almanach.deine-domain.de`, klicken auf
   *„Du hast einen Einladungscode? Konto anlegen“*, und tragen Name, Passwort
   und Code ein.

**Aufs Telefon oder iPad legen:** Die Seite im Browser öffnen, dann
*Teilen → Zum Home-Bildschirm*. Der Almanach läuft dann wie eine App, ohne
Adresszeile. Charakterblätter lassen sich außerdem herunterladen und
funktionieren dann auch, wenn der Pi gerade aus ist.

**Angemeldet bleiben:** Eine Anmeldung hält 30 Tage. Am Spielabend muss also
niemand hantieren.

**Passwort vergessen?** Du als Spielleitung setzt es unter *Runde* neu. Hast
*du* deins vergessen, hilft nur der Weg über die Datenbank – dann melde dich
lieber, bevor du darin herumschneidest.

---

## 10. Aktualisieren

```bash
cd ~/d-d_manager_repos
docker compose exec -T dnd-manager node scripts/sicherung.mjs /app/data/sicherungen --medien
git pull
docker compose --profile tunnel up -d --build
```

Erst sichern, dann holen, dann bauen. Die Datenbank wandert selbsttätig mit:
Neue Tabellen und Spalten legt der Almanach beim Start an, ohne dass etwas
verlorengeht.

Deine Runde muss nichts tun. Beim nächsten Aufruf lädt die Oberfläche sich
selbst neu.

> **Einmalig beim Umstieg auf diese Fassung:** Der Almanach läuft jetzt nicht
> mehr als Administrator im Container. Wer schon vorher eine Datenablage
> hatte, gibt sie einmal frei:
> ```bash
> docker compose run --rm --user root dnd-manager chown -R node:node /app/data
> ```
> Bei einer frischen Einrichtung ist das nicht nötig.

---

## 11. Wenn etwas klemmt

**Zuerst immer:**

```bash
docker compose ps        # läuft alles, steht da „healthy“?
docker compose logs --tail=50 dnd-manager
docker compose logs --tail=50 cloudflared
```

| Bild | Woran es meist liegt |
| --- | --- |
| `docker compose ps` zeigt `unhealthy` | Der Almanach kommt nicht an seine Datenbank. Meist volle Karte: `df -h`. |
| Im Heimnetz geht's, von außen kommt **Error 1033** oder **502** | Der Tunnel läuft nicht oder zeigt woandershin. Public Hostname prüfen: `HTTP` und `dnd-manager:3001`, nicht `localhost`. |
| Von außen **502**, obwohl der Tunnel läuft | Der Almanach war beim Start des Tunnels noch nicht bereit. `docker compose --profile tunnel restart` |
| Anmeldung sagt „Zu viele Versuche“ | Acht Fehlversuche, dann zehn Minuten Ruhe. Kein Fehler, sondern Absicht. Warten. |
| Spieler sehen den Spieltisch leer | Es liegt noch keine Szene auf. *Spielleitung → Karten → Auflegen* |
| Musik: „Mit Spotify verbinden“ tut nichts | Läuft die Seite über `https://`? Über `http://…local` gibt der Browser weder Anmeldung noch Ton frei. |
| Musik: Spotify meldet einen Fehler beim Anmelden | Meist Schritt 7.3 – das Konto steht nicht in der User-Management-Liste. Zweithäufigst: Redirect-URI stimmt nicht aufs Zeichen. |
| Musik: Alles verbunden, aber still | „Zuhören“ gedrückt? Und: Wiedergabe im Browser verlangt Premium. |
| Karte lässt sich nicht hochladen | Über 20 MB je Bild geht nicht. Große Scans vorher verkleinern – der Almanach rechnet ohnehin auf 4096 Pixel herunter. |
| Alles ist zäh | `docker stats`. Falls die Karte am Anschlag ist: alte Sicherungen wegräumen. |
| Zurückgespielt, aber der alte Stand ist immer noch da | Die WAL-Begleitdateien lagen noch daneben und haben sich darübergelegt. Siehe [8.3](#83-zurückspielen) – sie müssen mit gelöscht werden. |
| Nach dem Zurückspielen: „datenbank_unerreichbar“ | Die zurückgespielte Datei gehört noch `root`. `docker run --rm -v dnd-manager-data:/data alpine chown -R 1000:1000 /data` |

**Neu starten, wenn nichts hilft:**

```bash
docker compose --profile tunnel restart
```

**Ganz von vorn, ohne Datenverlust:**

```bash
docker compose down
docker compose --profile tunnel up -d --build
```

Die Daten liegen in einem eigenen Docker-Volume (`dnd-manager-data`) und
überleben beides. Nur `docker compose down -v` löscht sie – **dieser Befehl
ist der einzige gefährliche in diesem Handbuch.**

---

## 12. Anhang: alle Stellschrauben

### Umgebungsvariablen (in `.env` oder `docker-compose.yml`)

| Variable | Vorgabe | Bedeutung |
| --- | --- | --- |
| `CLOUDFLARE_TUNNEL_TOKEN` | – | Token des Tunnels. Nur nötig mit `--profile tunnel`. |
| `SPOTIFY_CLIENT_ID` | leer | Kennung der Spotify-Anwendung. Leer = Klangleiste bleibt verborgen. |
| `PORT` | `3001` | Port des Servers. |
| `DATA_DIR` | `/app/data` | Wo Datenbank und Bilder liegen. Im Container das Volume. |
| `TRUST_PROXY` | `1` (Compose) | Sagt dem Almanach, dass der Tunnel davorsteht – nötig für sichere Cookies. |
| `DND5E_API_BASE` | `…/api/2014` | Regelwerk-Fassung. `…/api/2024` für die neuen Regeln. |
| `CHRONIK_KI_URL` | leer | Freiwillig: Adresse eines Sprachmodells für den erzählenden Rückblick. |
| `CHRONIK_KI_MODELL` | `gpt-4o-mini` | Name des Modells. |
| `CHRONIK_KI_SCHLUESSEL` | leer | Zugangsschlüssel, falls der Dienst einen verlangt. |

### Wo was liegt

```
~/d-d_manager_repos/          der Quellcode, hierhin geht `git pull`
~/d-d_manager_repos/.env      deine Geheimnisse – nicht weitergeben
Docker-Volume dnd-manager-data
  ├── manager.sqlite3         alles: Konten, Charaktere, Karten, Chronik
  ├── medien/                 hochgeladene Karten und Bildnisse
  └── sicherungen/            was das Skript aus Schritt 8 anlegt
```

### Nützliche Befehle

```bash
docker compose ps                        # Was läuft?
docker compose logs -f dnd-manager       # Zusehen
docker compose --profile tunnel up -d    # Starten (auch nach Änderungen an .env)
docker compose --profile tunnel restart  # Neu starten
docker compose down                      # Anhalten (Daten bleiben)
curl -s localhost:3001/api/health        # Lebenszeichen
```

### Grenzen, die eingebaut sind

| | |
| --- | --- |
| Bild-Upload | 20 MB je Datei, wird auf 4096 Pixel Kantenlänge gerechnet |
| Fehlversuche bei der Anmeldung | 8, dann 10 Minuten Sperre je Name und Herkunft |
| Anmeldung gilt | 30 Tage |
| Protokolle | 3 × 10 MB je Dienst, danach überschreibt Docker die ältesten |
| Spotify-Konten je Anwendung | 25 (Vorgabe von Spotify im Development mode) |

---

## Und dann?

Das Handbuch endet hier, das Spiel fängt an. Was der Almanach am Tisch alles
kann, steht in der [README](../README.md) und – kürzer und an der richtigen
Stelle – unter *Hilfe* im Almanach selbst.

Viel Freude an der Runde.
