# Einrichtungs-Handbuch

Vom nackten Raspberry Pi bis zur Runde, die am Freitagabend aus fünf
Wohnzimmern am selben Tisch sitzt.

Für den ganzen Weg brauchst du **etwa eine Stunde**, davon die meiste Zeit
Wartezeit. Du musst kein Fachmann sein: Jeder Befehl steht hier zum Abtippen
oder Kopieren, und hinter jedem steht, was er tut.

**Es kostet nichts.** Keine Domain, kein Abonnement, kein Konto irgendwo –
außer dem Strom für den Pi.

---

## Inhalt

1. [Was du brauchst](#1-was-du-brauchst)
2. [Den Pi vorbereiten](#2-den-pi-vorbereiten)
3. [Docker installieren](#3-docker-installieren)
4. [Den Almanach holen und starten](#4-den-almanach-holen-und-starten)
5. [Erster Blick und das Konto der Spielleitung](#5-erster-blick-und-das-konto-der-spielleitung)
6. [Von außen erreichbar: der Tunnel](#6-von-außen-erreichbar-der-tunnel)
7. [Musik: Spotify-Links hinterlegen](#7-musik-spotify-links-hinterlegen)
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

Keins. Der Weg nach außen läuft über den **Schnelltunnel** von Cloudflare, und
der verlangt weder Anmeldung noch Domain. Für die Musik hinterlegst du
Spotify-Links – auch dafür braucht der Almanach nichts von dir.

> **Was dich der Verzicht auf eine Domain kostet.** Die Adresse, unter der
> deine Runde spielt, ist geliehen und sieht aus wie
> `https://zufaellige-worte.trycloudflare.com`. Sie **wechselt, wenn der
> Tunnel neu startet** – also nach einem Neustart des Pi oder einer
> Aktualisierung. Dann schickst du deiner Runde einmal die neue Adresse. Im
> Alltag passiert das selten.
>
> Wenn dich das später stört, zeigt
> [Schritt 6.5](#65-wenn-die-wechselnde-adresse-stört) zwei Wege zu einer
> festen Adresse – beide jederzeit nachrüstbar.

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

Und starten – es ist nichts einzustellen:

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
Bestiarium, Würfel, Kompendium, Musik. Was noch nicht geht: die Runde von
außen erreichen – das ist Schritt 6.

---

## 6. Von außen erreichbar: der Tunnel

Das ist der Schritt, der aus einem Kasten im Regal eine Runde macht, die von
überall spielt. Der Trick: Der Pi ruft bei Cloudflare **von innen nach außen**
an und hält die Leitung offen. Du brauchst keine Portfreigabe im Router, dein
Anschluss steht nicht offen im Netz – und für den Schnelltunnel brauchst du
nicht einmal ein Konto.

### 6.1 Starten

```bash
cd ~/d-d_manager_repos
docker compose --profile tunnel up -d
```

Zehn bis zwanzig Sekunden warten, dann:

```bash
./scripts/adresse.sh
```

Das Skript sagt dir, unter welcher Adresse deine Runde den Almanach erreicht –
etwa `https://zufaellige-worte.trycloudflare.com`. Die schickst du in eure
Gruppe.

Das `https` kommt von Cloudflare und kostet dich nichts. Ab jetzt ist **das**
die Adresse, die deine Runde benutzt; im Heimnetz gilt weiterhin
`http://almanach.local:3001`.

### 6.2 Die Adresse wechselt

Sie ist geliehen. Startet der Tunnel neu – nach einem Neustart des Pi, nach
einer Aktualisierung –, bekommt er eine neue. Dann:

```bash
./scripts/adresse.sh
```

… und die neue Adresse in die Gruppe schicken. Das ist der Preis dafür, keine
Domain zu bezahlen.

> **Wichtig zu wissen:** Die alte Adresse führt danach ins Leere. Wer den
> Almanach auf dem Telefon zum Home-Bildschirm gelegt hat, muss ihn nach einem
> Wechsel neu ablegen. Die **Anmeldung** bleibt davon unberührt: Sie hängt am
> Browser, nicht an der Adresse – aber unter einer neuen Adresse ist es für
> den Browser eine neue Seite, also melden sich alle einmal neu an.

### 6.3 Umzug inklusive

Weil der Tunnel von innen nach außen aufgebaut wird, funktioniert er überall.
Nimmst du den Pi zur Runde bei Freunden mit, steckst du ihn dort einfach ins
Netz – neue Adresse holen, fertig.

### 6.4 Wenn du es noch fester zumachen willst

Der Almanach schützt sich selbst: Passwörter liegen nur als scrypt-Hash in
der Datenbank, nach acht Fehlversuchen ist zehn Minuten Ruhe, und ohne
Einladungscode kommt niemand hinein. Für eine private Runde reicht das.

Bedenke aber: Eine `trycloudflare.com`-Adresse ist zwar unwahrscheinlich zu
erraten, aber nicht geheim. Wer sie hat, sieht die Anmeldeseite – mehr nicht,
solange die Passwörter etwas taugen. Vergib also ordentliche.

### 6.5 Wenn die wechselnde Adresse stört

Zwei Wege zu einer festen Adresse, beide später jederzeit nachrüstbar:

| Weg | Kosten | Haken |
| --- | --- | --- |
| **Eigene Domain** bei Cloudflare, dann statt des Schnelltunnels einen *benannten* Tunnel anlegen (Zero Trust → Networks → Tunnels), Public Hostname auf `dnd-manager:3001` | ~10 €/Jahr | einmalige Einrichtung, danach nie wieder |
| **[Tailscale](https://tailscale.com/)** – feste Adresse auf `*.ts.net`, echtes HTTPS, alles privat im eigenen Netz | kostenlos | **jeder Mitspieler muss Tailscale installieren** |

Der Schnelltunnel braucht bei deinen Mitspielern nur einen Browser. Das ist
der Grund, warum er hier der voreingestellte Weg ist.

## 7. Musik: Spotify-Links hinterlegen

Freiwillig, aber schnell: Es ist nichts einzurichten. Keine Anwendung bei
Spotify, keine Kennung, keine Freischaltliste, kein Premium.

**Wie es funktioniert:** Der Almanach spielt keine Musik. Er sammelt
Spotify-Links, und wenn du einen auflegst, steht bei allen am Tisch, was jetzt
dran ist – mit einem Knopf, der es in ihrem Spotify öffnet. Jeder hört auf
seinem eigenen Gerät und dreht so laut auf, wie er mag.

### 7.1 Eine Ambiente hinterlegen

Im Almanach unter *Spielleitung → Klang*:

1. **Neue Ambiente**
2. In Spotify die Wiedergabeliste suchen → *Teilen* → *Link kopieren* →
   im Almanach ins erste Feld einfügen.
3. Benennen (*„Schankraum am Abend“*), verschlagworten (*Taverne, ruhig*), und
   in die Notiz, was die Runde wissen soll (*„leise, viel Gemurmel“*).
4. Speichern.

Wiedergabelisten, Alben, einzelne Stücke und Künstler gehen alle. Andere Links
weist der Almanach ab – was er der Runde vorlegt, soll nirgendwo anders
hinführen als zu Spotify.

### 7.2 Auflegen

**Auflegen** zeigt der ganzen Runde, was jetzt dran ist: unten links erscheint
eine kleine Leiste mit dem Namen und einem Knopf zum Öffnen. **Stille** nimmt
sie wieder weg.

Wer nicht mithören will, klickt einfach nicht – niemand merkt es.

### 7.3 An eine Karte hängen

Der schöne Teil: Unter *Spielleitung → Karten* kannst du einer Karte eine
Ambiente zuweisen. Wer die Karte auflegt, legt die Musik mit auf. Der
Schankraum bringt seine Schankraum-Musik selbst mit.

> **Warum nicht mehr?** Spotify kann Musik auch direkt im Browser abspielen
> und über alle Fenster gleichschalten – das verlangt aber eine verschlüsselte
> Adresse unter *eigenem* Namen, ein Premium-Konto für jeden Zuhörer und eine
> Freischaltliste im Entwickler-Dashboard. Ohne eigene Domain ist davon nichts
> zu erfüllen. Ein hinterlegter Link funktioniert dagegen für jeden, sofort
> und mit jedem Konto.

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
| Musik: Der Link lässt sich nicht speichern | Es muss ein Spotify-Link sein (Wiedergabeliste, Album, Stück oder Künstler). In Spotify: *Teilen → Link kopieren*. |
| Musik: Knopf öffnet nichts | Bei installierter Spotify-App öffnet der Link die App, sonst den Web-Spieler. Blockt der Browser das Aufgehen neuer Tabs, den Knopf mit der rechten Maustaste anklicken. |
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

### Umgebungsvariablen

Für den normalen Betrieb ist **nichts** einzustellen; die folgenden Werte
stehen schon passend in der `docker-compose.yml`. Eine `.env` brauchst du nur
für den erzählenden Rückblick in der Chronik.

| Variable | Vorgabe | Bedeutung |
| --- | --- | --- |
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
~/d-d_manager_repos/.env      freiwillig, nur für den KI-Rückblick
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


---

## Und dann?

Das Handbuch endet hier, das Spiel fängt an. Was der Almanach am Tisch alles
kann, steht in der [README](../README.md) und – kürzer und an der richtigen
Stelle – unter *Hilfe* im Almanach selbst.

Viel Freude an der Runde.
