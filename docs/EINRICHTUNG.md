# Einrichtungs-Handbuch

Vom nackten Gerät bis zur Runde, die am Freitagabend aus fünf Wohnzimmern am
selben Tisch sitzt.

Es gibt **zwei Wege** dorthin, und beide stehen hier: ein Raspberry Pi, der
Tag und Nacht durchläuft, oder ein Laptop, auf dem außer Node.js nichts
installiert werden muss. Der Almanach ist in beiden Fällen derselbe – gleiche
Daten, gleiche Oberfläche, gleiche Befehle.

Du musst kein Fachmann sein: Jeder Befehl steht hier zum Abtippen oder
Kopieren, und hinter jedem steht, was er tut. Rechne mit **etwa einer Stunde**
für den Pi und mit **etwa zehn Minuten** für den Laptop, das meiste davon
Wartezeit.

**Es kostet nichts.** Keine Domain, kein Abonnement, kein Konto irgendwo –
außer dem Strom.

---

## Inhalt

1. [Zwei Wege – welcher ist deiner?](#1-zwei-wege--welcher-ist-deiner)
2. [Was du brauchst](#2-was-du-brauchst)
3. [Weg A: Der Raspberry Pi mit Docker](#3-weg-a-der-raspberry-pi-mit-docker)
4. [Weg B: Laptop oder PC, ganz ohne Docker](#4-weg-b-laptop-oder-pc-ganz-ohne-docker)
5. [Erster Blick und das Konto der Spielleitung](#5-erster-blick-und-das-konto-der-spielleitung)
6. [Von außen erreichbar: der Tunnel](#6-von-außen-erreichbar-der-tunnel)
7. [Musik: Spotify-Links hinterlegen](#7-musik-spotify-links-hinterlegen)
8. [Sicherung einrichten](#8-sicherung-einrichten)
9. [Die Runde einladen](#9-die-runde-einladen)
10. [Aktualisieren](#10-aktualisieren)
11. [Wenn etwas klemmt](#11-wenn-etwas-klemmt)
12. [Anhang: alle Stellschrauben](#12-anhang-alle-stellschrauben)

---

## 1. Zwei Wege – welcher ist deiner?

|  | **Weg A: Raspberry Pi** | **Weg B: Laptop oder PC** |
| --- | --- | --- |
| Was du installierst | Docker | Node.js |
| Läuft von selbst wieder an | ja, auch nach Stromausfall | nein – du startest ihn |
| Läuft, während du schläfst | ja | nur solange das Gerät wach ist |
| Von außen erreichbar | ja, über den Tunnel | im WLAN sofort, von außen [mit einem Zusatz](#44-wenn-der-rechner-keine-exe-herunterladen-darf) |
| Einrichtung | eine Stunde | zehn Minuten |
| Kostet | den Pi und ein wenig Strom | nichts |

**Nimm Weg A**, wenn die Runde jederzeit hineinschauen können soll – auch
zwischen den Sitzungen, wenn deine Spieler an ihren Blättern feilen.

**Nimm Weg B**, wenn du erst einmal sehen willst, ob euch der Almanach
gefällt, oder wenn du am Spielabend ohnehin mit dem Laptop am Tisch sitzt.
Auch für einen Rechner, auf dem du nichts installieren darfst, ist das der
Weg – [Schritt 4.4](#44-wenn-der-rechner-keine-exe-herunterladen-darf)
beschreibt ihn eigens.

> **Du kannst später wechseln.** Der ganze Almanach – Charaktere, Karten,
> Chronik, Bilder – steckt in einem einzigen Ordner. Kopierst du den auf das
> andere Gerät, spielt die Runde dort weiter, als wäre nichts gewesen. Wo er
> liegt, steht im [Anhang](#wo-was-liegt); wie man ihn mitnimmt, in
> [Schritt 8.3](#83-zurückspielen).

---

## 2. Was du brauchst

### 2.1 Für Weg A: den Pi

| Was | Anmerkung |
| --- | --- |
| Raspberry Pi 5 | 8 GB reichen, 16 GB sind bequem. Ein Pi 4 tut es auch, baut aber länger. |
| Speicherkarte oder SSD | Mindestens 32 GB. Eine SSD am USB-Anschluss hält deutlich länger als eine SD-Karte – Karten sterben nach ein bis zwei Jahren Dauerbetrieb gern. |
| Netzteil | Das offizielle. Ein zu schwaches Netzteil zeigt sich als sporadische Abstürze, die man ewig woanders sucht. |
| Netzwerkkabel | Geht auch per WLAN, aber Kabel ist an einem Server einfach eine Sorge weniger. |

### 2.2 Für Weg B: den Laptop

| Was | Anmerkung |
| --- | --- |
| Irgendein Rechner | Windows, macOS oder Linux. Was einen Browser flüssig darstellt, trägt auch den Almanach. |
| **Node.js 22 oder neuer** | Das Einzige, was installiert werden muss. Ab 22.5 bringt Node seine Datenbank selbst mit – nichts muss kompiliert werden, keine Bauwerkzeuge, kein Visual Studio. |
| Etwa 1 GB Platz | Für das Programm samt Bausteinen. Karten und Bildnisse kommen später obendrauf. |

### 2.3 Konten

Keins. Der Weg nach außen läuft über den **Schnelltunnel** von Cloudflare, und
der verlangt weder Anmeldung noch Domain. Für die Musik hinterlegst du
Spotify-Links – auch dafür braucht der Almanach nichts von dir.

> **Was dich der Verzicht auf eine Domain kostet.** Die Adresse, unter der
> deine Runde spielt, ist geliehen und sieht aus wie
> `https://zufaellige-worte.trycloudflare.com`. Sie **wechselt, wenn der
> Tunnel neu startet** – also nach einem Neustart des Geräts oder einer
> Aktualisierung. Dann schickst du deiner Runde einmal die neue Adresse. Im
> Alltag passiert das selten.
>
> Wenn dich das später stört, zeigt
> [Schritt 6.5](#65-wenn-die-wechselnde-adresse-stört) zwei Wege zu einer
> festen Adresse – beide jederzeit nachrüstbar.

---

## 3. Weg A: Der Raspberry Pi mit Docker

*Wenn du auf einem Laptop spielst, überspring dieses Kapitel und lies bei
[Weg B](#4-weg-b-laptop-oder-pc-ganz-ohne-docker) weiter.*

### 3.1 Betriebssystem aufspielen

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

### 3.2 Anmelden

Vom normalen Rechner aus (Terminal unter macOS/Linux, PowerShell unter Windows):

```bash
ssh deinname@almanach.local
```

Falls das nicht geht, findest du die Adresse im Router unter den verbundenen
Geräten, und es geht mit `ssh deinname@192.168.…` statt des Namens.

### 3.3 Auf den neuesten Stand bringen

```bash
sudo apt update && sudo apt full-upgrade -y
sudo reboot
```

Der Pi startet neu, die Verbindung bricht ab – das gehört so. Nach einer
Minute wieder anmelden.

### 3.4 Docker installieren

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

### 3.5 Den Almanach holen und starten

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

Weiter bei [Schritt 5](#5-erster-blick-und-das-konto-der-spielleitung).

---

## 4. Weg B: Laptop oder PC, ganz ohne Docker

Derselbe Almanach, nur ohne Container. Was Docker auf dem Pi tut – Bausteine
holen, Oberfläche bauen, Server starten –, macht hier ein einziger Befehl.

### 4.1 Node.js holen

Node.js ist der Motor, auf dem der Almanach läuft; sonst wird nichts
gebraucht. Von [nodejs.org](https://nodejs.org) die **LTS-Fassung** laden –
das ist die mit der geraden Versionsnummer, derzeit 22 oder neuer.

| System | Was du lädst |
| --- | --- |
| Windows | den **`.msi`**-Installer (kein `.exe`) oder das ZIP-Archiv – siehe [4.4](#44-wenn-der-rechner-keine-exe-herunterladen-darf) |
| macOS | den `.pkg`-Installer, oder mit Homebrew: `brew install node` |
| Linux | `sudo apt install nodejs npm` – aber prüfen, ob die Fassung neu genug ist; sonst über [nodesource](https://github.com/nodesource/distributions) oder `nvm` |

Danach ein neues Terminal öffnen (unter Windows: PowerShell oder
Eingabeaufforderung) und nachsehen:

```bash
node --version
```

Steht dort `v22.5.0` oder größer, ist alles beisammen. Steht dort etwas
Kleineres, hol die neuere Fassung – darunter müsste die Datenbank kompiliert
werden, und das verlangt Bauwerkzeuge, die du auf einem verwalteten Rechner
ohnehin nicht installieren darfst.

### 4.2 Den Almanach holen

Mit Git, wenn es da ist:

```bash
git clone https://github.com/leohoffmannschule-collab/d-d_manager_repos.git
cd d-d_manager_repos
```

> Solange die Arbeit noch auf einem Zweig liegt und nicht im Hauptzweig:
> `git checkout claude/dnd-platform-architecture-wbwul3`

Ohne Git geht es auch: Auf GitHub oben rechts auf **Code → Download ZIP**,
das Archiv irgendwohin entpacken und den entstandenen Ordner öffnen. Ein ZIP
ist keine `.exe` und geht deshalb auch dort durch, wo Programme geblockt
werden.

### 4.3 Starten

Im Ordner des Almanachs:

```bash
npm start
```

Wer lieber klickt: Unter Windows tut ein **Doppelklick auf `starten.cmd`**
dasselbe, unter macOS und Linux `./starten.sh` im Terminal.

Beim ersten Mal holt der Befehl die Bausteine und baut die Oberfläche – das
dauert **zwei bis fünf Minuten** und ist einmalig. Danach startet er in
Sekunden, denn gebaut wird nur neu, wenn sich wirklich etwas geändert hat.

Wenn im Fenster steht:

```
  Abenteuer-Almanach läuft
  Auf diesem PC  : http://localhost:3001
  Im Netzwerk    : http://192.168.…:3001   (für iPad/iPhone)
```

… ist er da. Die erste Adresse in den Browser, und weiter bei
[Schritt 5](#5-erster-blick-und-das-konto-der-spielleitung).

> **Das Fenster ist der Almanach.** Solange es offen bleibt, läuft er.
> Schließt du es oder drückst `Strg+C`, ist Schluss – die Daten bleiben
> natürlich erhalten. Denk am Spielabend außerdem daran, den Ruhezustand
> auszuschalten: Ein zugeklapptes Notebook nimmt die ganze Runde mit.

**Damit die anderen mitspielen können**, brauchen sie die zweite Adresse –
die mit `192.168.`. Die zeigt dir jederzeit:

```bash
npm run adresse
```

Unter Windows fragt die Firewall beim ersten Start, ob Node.js im Netzwerk
erreichbar sein darf. **Ja, für private Netzwerke** – sonst kommt niemand
sonst im WLAN an den Almanach heran.

### 4.4 Wenn der Rechner keine `.exe` herunterladen darf

Das ist auf Schul- und Firmenrechnern der Normalfall, und der Almanach kommt
damit zurecht: **Er selbst braucht kein einziges kompiliertes Programm.**
Keine Bauwerkzeuge, kein node-gyp, kein Visual Studio – die Datenbank steckt
seit Node 22.5 in Node drin.

Bleibt Node.js selbst. Drei Möglichkeiten, keine davon eine `.exe`:

1. **Der `.msi`-Installer** von nodejs.org. Windows-Installer sind `.msi`, und
   viele Sperren greifen nur bei `.exe`. Braucht allerdings Adminrechte.
2. **Das ZIP-Archiv** (`node-v22.…-win-x64.zip`), ebenfalls auf nodejs.org
   unter „Prebuilt Binaries“. Irgendwohin entpacken – etwa nach
   `C:\Users\DeinName\node` –, dann im Terminal für diese Sitzung bekannt
   machen:

   ```
   set PATH=C:\Users\DeinName\node;%PATH%
   node --version
   ```

   Das braucht **keine Adminrechte und installiert nichts**; der Ordner liegt
   einfach da und lässt sich genauso wieder löschen.
3. **Node ist vielleicht schon da.** Wo Entwicklungswerkzeuge im Einsatz sind,
   liegt Node oft schon mit dabei. Einfach `node --version` versuchen.

**Und wenn wirklich gar nichts geht?** Dann geht es nicht auf diesem Rechner.
Der Almanach ist ein Server: Irgendwo muss ein Programm laufen, das die Daten
hält und die Karten ausgibt. Ein Browser allein kann das nicht. Aber der
Rechner ist dann eben ein Spieler und kein Gastgeber – zum **Mitspielen**
braucht er nichts als seinen Browser. Gastgeber wird der Pi, ein anderer
Rechner im Haus oder das Notebook eines Mitspielers.

**Der Tunnel nach draußen** ist der eine Punkt, an dem doch ein Programm
gebraucht wird: `cloudflared`, und unter Windows ist das eine `.exe`. Im
selben WLAN spielt ihr trotzdem zu sechst, ganz ohne. Für die Runde über
Entfernung lässt du den Tunnel auf dem Pi laufen – oder du gehst
[Weg A](#3-weg-a-der-raspberry-pi-mit-docker). Mehr dazu in
[Schritt 6.1](#61-starten).

### 4.5 Was auf diesem Weg anders ist

| | Auf dem Pi | Auf dem Laptop |
| --- | --- | --- |
| Nach Stromausfall | startet von selbst wieder | du startest ihn |
| Starten | läuft schon | `npm start` |
| Adresse anzeigen | `npm run adresse` | `npm run adresse` |
| Sichern | `docker compose exec dnd-manager node scripts/sicherung.mjs` | `npm run sicherung` |
| Aktualisieren | `git pull && docker compose up -d --build` | `git pull && npm start` |
| Datenordner | im Docker-Volume `dnd-manager-data` | `backend/data` neben dem Programm |

Ansonsten nichts: dieselbe Oberfläche, dieselben Rechte, derselbe Nebel,
dieselben Karten.

---

## 5. Erster Blick und das Konto der Spielleitung

Ruf den Almanach im Browser auf:

| | Adresse |
| --- | --- |
| Weg A – auf dem Pi | `http://almanach.local:3001` |
| Weg B – auf dem Laptop | `http://localhost:3001` |

Weißt du sie nicht mehr, sagt sie dir jederzeit `npm run adresse` im Ordner
des Almanachs.

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
überall spielt. Der Trick: Das Gerät ruft bei Cloudflare **von innen nach
außen** an und hält die Leitung offen. Du brauchst keine Portfreigabe im
Router, dein Anschluss steht nicht offen im Netz – und für den Schnelltunnel
brauchst du nicht einmal ein Konto.

> **Nur für Mitspieler, die nicht im selben WLAN sitzen.** Im Haus genügt die
> Adresse aus [Schritt 5](#5-erster-blick-und-das-konto-der-spielleitung), und
> dieses Kapitel kannst du überspringen.

### 6.1 Starten

**Weg A – auf dem Pi, mit Docker:**

```bash
cd ~/d-d_manager_repos
docker compose --profile tunnel up -d
```

**Weg B – auf dem Laptop, ohne Docker:** Der Almanach läuft schon in einem
Fenster; öffne ein **zweites** Terminal im selben Ordner:

```bash
npm run tunnel
```

Beim ersten Mal wird `cloudflared` fehlen. Das Skript sagt dir dann genau,
welche Datei du wohin legen musst – eine einzige, die nichts installiert. Wo
gar keine Programme geladen werden dürfen, hilft
[Schritt 4.4](#44-wenn-der-rechner-keine-exe-herunterladen-darf) weiter.

Dann, auf beiden Wegen, zehn bis zwanzig Sekunden warten und:

```bash
npm run adresse
```

Das Skript sagt dir, unter welcher Adresse deine Runde den Almanach erreicht –
etwa `https://zufaellige-worte.trycloudflare.com`. Die schickst du in eure
Gruppe.

Das `https` kommt von Cloudflare und kostet dich nichts. Ab jetzt ist **das**
die Adresse, die deine Runde benutzt; im Heimnetz gilt weiterhin
`http://almanach.local:3001`.

### 6.2 Die Adresse wechselt

Sie ist geliehen. Startet der Tunnel neu – nach einem Neustart des Geräts,
nach einer Aktualisierung –, bekommt er eine neue. Dann:

```bash
npm run adresse
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
| Jemand löscht versehentlich alle Notizen | Regelmäßige Sicherung **auf dem Gerät** |
| Die Speicherkarte oder Platte stirbt | Kopie **weg vom Gerät** |

### 8.1 Regelmäßig: die Datenbank

Die Datenbank darf im Betrieb **nicht einfach kopiert** werden. Der Almanach
schreibt im WAL-Verfahren; eine Kopie mitten im Spiel erwischt womöglich einen
halben Schreibvorgang und ist beim Zurückspielen wertlos. Das mitgelieferte
Skript zieht stattdessen einen in sich stimmigen Stand, während weitergespielt
wird.

**Weg A – auf dem Pi.** Aufgabenplan öffnen:

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

**Weg B – auf dem Laptop.** Derselbe Vorgang, ein kürzerer Befehl, und er darf
laufen, während der Almanach läuft:

```bash
npm run sicherung -- --medien --behalten=14
```

Ein nächtlicher Plan lohnt hier meist nicht: Ein Laptop schläft nachts. Nimm
es dir stattdessen **nach dem Spielabend** vor – einmal der Befehl, bevor du
das Fenster schließt. Wer es doch selbsttätig will:

- macOS und Linux: dieselbe `crontab -e` wie oben, mit
  `cd /pfad/zum/almanach && npm run sicherung -- --behalten=14`
- Windows: **Aufgabenplanung** öffnen, *Einfache Aufgabe erstellen*, als
  Programm `npm.cmd`, als Argumente `run sicherung`, als Ordner den des
  Almanachs.

### 8.2 Wöchentlich: weg vom Gerät

Das Obige liegt auf derselben Karte wie das Original – gegen einen Kartentod
hilft es nicht. Auf dem Laptop genügt es dafür schon, den Ordner
`backend/data/sicherungen` gelegentlich auf einen Stick oder in deine Cloud zu
ziehen. Vom Pi holst du ihn dir so, etwa sonntags:

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

**Auf dem Laptop, ohne Docker**, ist es dasselbe in einfach – und die Falle
lauert genauso:

1. Den Almanach **anhalten**: `Strg+C` im Fenster, in dem er läuft.
2. Im Ordner `backend/data` diese drei löschen, falls vorhanden:
   `manager.sqlite3`, `manager.sqlite3-wal`, `manager.sqlite3-shm`.
   **Alle drei** – sonst legt sich der alte Stand gleich wieder darüber.
3. Aus `backend/data/sicherungen/almanach-…/` die Datei `manager.sqlite3`
   an die Stelle der gelöschten kopieren.
4. `npm start`.

**Danach prüfen**, ob es wirklich gegriffen hat – nicht nur, ob der Almanach
startet: Melde dich an und sieh nach, ob etwas fehlt, das *nach* dem
Sicherungszeitpunkt entstanden war. Ist es noch da, hat das Zurückspielen
nicht gewirkt.

---

## 9. Die Runde einladen

1. Im Almanach: *Spielleitung → Runde → Einladungscode erzeugen*
2. Den Code weitergeben – einer je Person, jeder gilt nur einmal.
3. Deine Mitspieler öffnen die Adresse, unter der der Almanach für sie
   erreichbar ist – im Haus die aus `npm run adresse`, von auswärts die des
   Tunnels –, klicken auf *„Du hast einen Einladungscode? Konto anlegen“*
   und tragen Name, Passwort und Code ein.

**Aufs Telefon oder iPad legen:** Die Seite im Browser öffnen, dann
*Teilen → Zum Home-Bildschirm*. Der Almanach läuft dann wie eine App, ohne
Adresszeile. Charakterblätter lassen sich außerdem herunterladen und
funktionieren dann auch, wenn der Almanach gerade nicht läuft.

**Angemeldet bleiben:** Eine Anmeldung hält 30 Tage. Am Spielabend muss also
niemand hantieren.

**Passwort vergessen?** Du als Spielleitung setzt es unter *Runde* neu. Hast
*du* deins vergessen, hilft nur der Weg über die Datenbank – dann melde dich
lieber, bevor du darin herumschneidest.

---

## 10. Aktualisieren

**Weg A – auf dem Pi:**

```bash
cd ~/d-d_manager_repos
docker compose exec -T dnd-manager node scripts/sicherung.mjs /app/data/sicherungen --medien
git pull
docker compose --profile tunnel up -d --build
```

**Weg B – auf dem Laptop:** Almanach anhalten (`Strg+C`), dann im selben
Ordner:

```bash
npm run sicherung -- --medien
git pull
npm start
```

`npm start` merkt selbst, dass sich die Oberfläche geändert hat, und baut sie
neu – das dauert dann wieder ein bis zwei Minuten statt Sekunden. Hast du den
Almanach als ZIP geladen statt mit Git, lädst du einfach das neue ZIP,
entpackst es daneben und kopierst deinen alten Ordner `backend/data` in den
neuen hinüber. **Vorher anhalten**, sonst kopierst du einen halben Stand.

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

**Zuerst immer, auf dem Pi:**

```bash
docker compose ps        # läuft alles, steht da „healthy“?
docker compose logs --tail=50 dnd-manager
docker compose logs --tail=50 cloudflared
```

**Zuerst immer, auf dem Laptop:** ins Fenster sehen, in dem der Almanach
läuft – da steht, was schiefging. Und:

```bash
npm run pruefen          # Node, Bausteine, Bau, Datenordner, Port
npm run adresse          # unter welchen Adressen er zu erreichen ist
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

**Und was nur auf dem Laptop vorkommt:**

| Bild | Woran es meist liegt |
| --- | --- |
| `npm` oder `node` wird nicht gefunden | Node ist nicht installiert oder das Terminal war schon offen, als es installiert wurde. Fenster schließen, neues öffnen. Sonst [4.1](#41-nodejs-holen). |
| „Dieses Node bringt SQLite noch nicht mit“ | Node ist älter als 22.5. `node --version` prüfen, neuere Fassung holen. |
| `EADDRINUSE` oder „Port belegt“ | Der Almanach läuft schon in einem anderen Fenster. Entweder das benutzen oder ihn dort mit `Strg+C` beenden. Ein zweiter darf auf einen anderen Port: `PORT=3002 npm start` |
| Andere im WLAN kommen nicht heran | Die Firewall hat beim ersten Start gefragt und ein „Nein“ bekommen. In den Windows-Firewall-Einstellungen Node.js für **private** Netzwerke erlauben. |
| Mitten im Spiel bricht alles ab | Der Laptop ist eingeschlafen oder wurde zugeklappt. Energieoptionen auf „niemals“ stellen, solange gespielt wird. |
| Nach `git pull` sieht die Oberfläche alt aus | Der Bau lief nicht durch. `npm start -- --neu-bauen` erzwingt ihn. |
| Der Bau bricht mit fehlenden Bausteinen ab | `npm run setup` holt sie noch einmal für Server und Oberfläche. |

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
| `DATA_DIR` | `/app/data` im Container, sonst `backend/data` | Wo Datenbank und Bilder liegen. |
| `TRUST_PROXY` | `1` (Compose), sonst `loopback` | Sagt dem Almanach, dass der Tunnel davorsteht – nötig für sichere Cookies. |
| `CLOUDFLARED` | leer | Pfad zu `cloudflared`, falls es nicht im Suchpfad liegt (nur für `npm run tunnel`). |
| `DND5E_API_BASE` | `…/api/2014` | Regelwerk-Fassung. `…/api/2024` für die neuen Regeln. |
| `CHRONIK_KI_URL` | leer | Freiwillig: Adresse eines Sprachmodells für den erzählenden Rückblick. |
| `CHRONIK_KI_MODELL` | `gpt-4o-mini` | Name des Modells. |
| `CHRONIK_KI_SCHLUESSEL` | leer | Zugangsschlüssel, falls der Dienst einen verlangt. |

### Wo was liegt

**Weg A – auf dem Pi:**

```
~/d-d_manager_repos/          der Quellcode, hierhin geht `git pull`
~/d-d_manager_repos/.env      freiwillig, nur für den KI-Rückblick
Docker-Volume dnd-manager-data
  ├── manager.sqlite3         alles: Konten, Charaktere, Karten, Chronik
  ├── medien/                 hochgeladene Karten und Bildnisse
  └── sicherungen/            was das Skript aus Schritt 8 anlegt
```

**Weg B – auf dem Laptop:** alles unter einem Dach, nichts liegt woanders.

```
d-d_manager_repos/            der Ordner, den du geholt hast
  ├── starten.cmd             Doppelklick-Start unter Windows
  ├── starten.sh              dasselbe für macOS und Linux
  ├── backend/public/         die gebaute Oberfläche (entsteht beim Start)
  └── backend/data/           ← der ganze Almanach; nur dieser Ordner zählt
       ├── manager.sqlite3    alles: Konten, Charaktere, Karten, Chronik
       ├── medien/            hochgeladene Karten und Bildnisse
       ├── sicherungen/       was `npm run sicherung` anlegt
       └── tunnel.log         Protokoll des Tunnels, für `npm run adresse`
```

Willst du den Almanach auf ein anderes Gerät umziehen, ist `backend/data` das
Einzige, was mit muss.

### Nützliche Befehle

**Auf dem Pi:**

```bash
docker compose ps                        # Was läuft?
docker compose logs -f dnd-manager       # Zusehen
docker compose --profile tunnel up -d    # Starten (auch nach Änderungen an .env)
docker compose --profile tunnel restart  # Neu starten
docker compose down                      # Anhalten (Daten bleiben)
curl -s localhost:3001/api/health        # Lebenszeichen
```

**Auf dem Laptop** – und die meisten davon auch auf dem Pi, denn sie stecken
im Quellcode und nicht in Docker:

```bash
npm start                 # holen, bauen (falls nötig) und starten
npm start -- --neu-bauen  # Oberfläche in jedem Fall neu bauen
npm start -- --ohne-bau   # Bau überspringen, sofort starten
npm run pruefen           # nur nachsehen, nichts tun
npm run adresse           # unter welchen Adressen er erreichbar ist
npm run tunnel            # den Weg von außen aufmachen (Strg+C schließt ihn)
npm run sicherung         # Datenbank sichern (--medien nimmt Bilder mit)
npm run vertrag           # prüfen, ob Server und Oberfläche zusammenpassen
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
