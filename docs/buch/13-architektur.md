# Architektur

Dieses Kapitel ist die Luftaufnahme: welche Teile es gibt, wie sie miteinander sprechen, wo die Grenzen verlaufen und warum sie dort verlaufen. Die folgenden Kapitel gehen dann je einen Teil im Einzelnen durch – den Server, die Anmeldung, den Live-Kanal, die Sicht, die Oberfläche, das Blatt.

Wer nur eine Stunde hat, liest dieses Kapitel und danach sechs Dateien (am Ende des Kapitels aufgeführt). Das genügt, um sich im Code zurechtzufinden.

## Das Bild im Ganzen

```
   Browser (Telefon, Tablet, Rechner)                        Gerät der Runde (Pi oder Laptop)
  ┌──────────────────────────────────┐                     ┌────────────────────────────────────┐
  │ Oberfläche  (React, gebaut)      │   HTTPS  ┌───────┐  │  Server  (Node.js, Express)        │
  │                                  │ ───────► │Tunnel │─►│   /api/…       Wege der Schnittstelle│
  │  lib/api.js   ── fetch ─────────────────────┤ cloud-│  │   /api/stream  Live-Kanal (SSE)    │
  │  lib/live.jsx ◄─ EventSource ───────────────┤ flared│◄─│   /            gebaute Oberfläche  │
  │  lib/daten/   Haken über beidem  │          └───────┘  │                                    │
  │  pages/, components/  Aussehen   │   im Heimnetz:      │  ┌──────────────┐  ┌────────────┐  │
  └──────────────────────────────────┘   direkt über HTTP  │  │ SQLite-Datei │  │ medien/    │  │
                                                            │  │ manager.     │  │ Bilder     │  │
                                                            │  │ sqlite3      │  │            │  │
                                                            │  └──────────────┘  └────────────┘  │
                                                            └────────────────────────────────────┘
                                                                        │ auf Anfrage
                                                                        ▼
                                                             dnd5eapi.co (Kompendium, zwischengespeichert)
                                                             Sprachmodell (Rückblick, nur wenn eingerichtet)
```

Drei Dinge fallen daran auf, und alle drei sind gewollt:

1. **Es gibt nur einen Server.** Er hält die Daten, prüft jede Anfrage, rechnet die Sicht, würfelt und liefert die Oberfläche aus. Keine zweite Anwendung, keine separate Datenbank, kein Zwischenspeicher-Dienst.
2. **Es gibt zwei Richtungen, und sie sind getrennt.** Geschrieben (und gelesen) wird über gewöhnliche HTTP-Aufrufe. *Zurück* kommen Änderungen über einen einzigen offenen Kanal je Fenster, den Live-Kanal. Der Kanal ist eine Einbahnstraße vom Server zum Browser.
3. **Außen gibt es nur zwei Dienste, und beide sind entbehrlich.** Das Kompendium wird zwischengespeichert und bleibt nutzbar, wenn die Schnittstelle ausfällt; der Rückblick existiert nur, wenn jemand ihn einrichtet. Der Almanach spielt ohne beide.

## Die Schichten

### Im Server

```
  server.js                      einhängen: Wächter vor jeden Zweig, Zweige an ihre Wege
     │
  routes/…                       Wege: Anfrage lesen, prüfen, Modul rufen, antworten, melden
     │
  kampf/  spieltisch/  sicht/    Fachmodule: was ein Kampf, eine Szene, eine Sicht *ist*
  beute.js klang.js chronicle.js
  uebernehmen/ kampagnen.js
  vorlagen/  dice.js
     │
  db.js ─ datenbank/             Datenbank: öffnen, Schema, Nachrüsten, Transaktion
  events.js                      Live-Kanal: wer hängt dran, wer bekommt was
  anmeldung/ (auth.js)           Wächter, Sitzungen, Kennwörter
  werte.js asynchron.js          Handwerkszeug
```

Die Regel zwischen den Schichten: **Ein Weg rechnet nicht, ein Modul antwortet nicht.** Ein Weg in `routes/` liest die Anfrage, prüft Rechte und Eingaben, ruft ein Fachmodul und schickt die Antwort. Was ein Kampf ist, wie die Sicht entsteht, wie Beute geteilt wird, steht in den Modulen darüber – dort, wo es mehrere Wege brauchen. So gibt es zum Beispiel genau eine Stelle, an der die Sicht einer Person entsteht (`spieltisch/sichtbarkeit.js`), und jeder Weg, der eine Szene verschickt, bedient sich dort.

### In der Oberfläche

```
  main.jsx  App.jsx              Startpunkt; die drei Tore (angemeldet, Kampagne, Live-Draht)
     │
  pages/                         Seiten: eine je Adresse, Zustand der Seite
     │
  components/                    Bauteile: Aussehen, Eingaben, kleine örtliche Zustände
     │
  lib/daten/  (lib/daten.js)     Datenhaken: laden, horchen, vorgreifen
  lib/live.jsx                   der Live-Draht
  lib/api/    (lib/api.js)       die Wege des Servers, eins zu eins
     │
  lib/regeln/ lib/rasten.js …    Regeln und Rechnungen ohne Aussehen
  stile/                         das Aussehen, als Stilblätter
```

Die Regel hier: **Nur `lib/api/` spricht mit dem Server, nur `lib/live.jsx` hört ihm zu, und nur `lib/daten/` bringt beides zusammen.** Ein Bauteil ruft nie selbst `fetch` und öffnet nie selbst einen Kanal. Wer die Oberfläche neu gestaltet oder austauscht, wirft Seiten und Bauteile weg und behält die Datenschicht – das mühsame Stück, wann geladen wird und welches Ereignis welchen Zustand betrifft, bleibt erhalten.

Die Regeln des Spiels (`lib/regeln/`) haben kein Aussehen und kennen keinen Server. Sie rechnen Modifikatoren, Übungsbonus, Traglast und Rasten aus, und dieselben Funktionen rechnen auf dem Bildschirm und in der Ausfuhr des Blattes.

## Das Datenmodell im Überblick

Die Datenbank hat 22 Tabellen. Sie fallen in vier Gruppen, und die Gruppe entscheidet, wem eine Zeile gehört:

| Gruppe | Tabellen | Gehört | `campaign_id` |
|---|---|---|---|
| **Runde** | `users`, `auth_sessions`, `invites` | der ganzen Runde | – (Sitzungen tragen die gewählte Kampagne) |
| **Kampagnen** | `campaigns`, `campaign_members` | – | – |
| **Spiel** | `characters`, `combatants`, `notes`, `rolls`, `messages`, `scenes` (mit `tokens`), `stash_items`, `game_sessions` (mit `chronicle`) | genau einer Kampagne | ja – und **jede Abfrage filtert danach** |
| **Vorbereitung** | `maps`, `media`, `library`, `encounters`, `ambience` | der ganzen Runde | ja – aber nur als Herkunftsvermerk, **gefiltert wird nicht** |
| **Sonstiges** | `app_state`, `api_cache` | je Kampagne (Schlüssel) / niemandem | im Schlüssel / – |

Der Merksatz dazu:

> **Konten gehören der Runde, alles Gespielte gehört einer Kampagne.**
> **Vorbereitung gehört der Runde, das Spiel gehört der Kampagne.**

Daraus folgt, was beim endgültigen Entfernen einer Kampagne verschwindet (die Gruppe „Spiel“) und was stehen bleibt (alles andere). Daraus folgt auch, dass eine Karte in jeder Kampagne aufgelegt werden kann, ohne sie zweimal hochzuladen – während die Szene, die daraus entsteht, mit ihrem Nebel nur dieser einen Kampagne gehört.

Zwei Tabellen hängen nicht selbst an einer Kampagne, sondern an einer Zeile, die es tut: Figuren (`tokens`) an ihrer Szene, Chronikeinträge (`chronicle`) an ihrer Sitzung. Beide werden deshalb immer über den Verbund geholt (`tokens JOIN scenes … WHERE s.campaign_id = ?`), damit eine Figur aus einer fremden Kampagne über ihre bloße Kennung nicht erreichbar ist.

Die einzelnen Spalten stehen im Verzeichnis „Tabellen“; wie sie entstehen und wachsen, im Kapitel „Der Server“.

### Einzelwerte

Manches ist zu klein für eine Tabelle: welche Szene aufliegt, ob der Vorhang zu ist, in welcher Kampfrunde man steckt und wer dran ist, welche Münzen in der Kiste liegen, was an Musik aufliegt, durch wessen Augen die Spielleitung schaut. Das steht in `app_state` unter einem Schlüssel `<kampagne>:<name>`, als JSON:

| Name | Inhalt |
|---|---|
| `szene` | Kennung der aufliegenden Szene |
| `vorhang` | `true` oder `false` |
| `nsc_sicht` | Kennung der Figur, durch deren Augen die Spielleitung schaut |
| `kampf` | `{ round, activeCombatantId }` |
| `beute` | die Münzen der Kiste, `{ pp, gp, ep, sp, cp }` |
| `klang` | was aufliegt und der Takt (`spielt`, `position`, `stand`) |
| `vorlagen:gesaet` | wann die Vorlagen gesät wurden |

Zugriff nur über `getState(name, kampagne, ersatz)` und `setState(name, kampagne, wert)` aus `backend/src/db.js`.

### Das Blatt als JSON

Eine Entscheidung verdient eigene Erwähnung, weil sie untypisch ist: **Ein Charakterblatt ist eine einzige JSON-Spalte** (`characters.data`). Der Server kennt seinen Inhalt nicht; er gibt ihn zurück, wie er ihn bekommen hat. Nur an zwei Stellen schaut er hinein – Trefferpunkte und Sinne –, weil beide den Rest des Tisches betreffen.

Der Vorteil: Ein neues Feld auf dem Blatt ist eine Änderung an der Oberfläche, nicht an der Datenbank. Ein anderes Regelsystem braucht keine neue Tabelle (das freie Blatt ist schlicht ein anderes JSON). Der Preis: Die Oberfläche muss Blätter jeder Altersstufe verstehen; dafür gibt es `withDefaults()` (Kapitel „Das Blatt: Datenmodell und Ausfuhr“).

## Der Weg einer Änderung

Fast jede Handlung im Almanach nimmt denselben Weg. Am Beispiel einer Spielerin, die ihre Figur zieht:

```
  Fenster der Spielerin                 Server                          andere Fenster
  ─────────────────────                 ──────                          ──────────────
  1  Figur loslassen
  2  örtlich setzen (sofort sichtbar)
  3  PATCH /api/scenes/figuren/:id ───► 4  Wächter: angemeldet? Kampagne?
     Kopf X-Fenster: 17                  5  darf sie diese Figur ziehen?
                                         6  schreiben
                                         7  Sicht je Person neu rechnen
                                         8  broadcast ───────────────────►  9  Live-Kanal: `szene` / `figur`
  ◄───────────── 200 { Figur } ─────────                                  10  Haken setzt neuen Stand
     (kein Echo über den Kanal:                                           11  Figur steht an neuer Stelle
      Fenster 17 wird ausgelassen)
```

Das Muster heißt: **örtlich vorgreifen, schicken, der Server entscheidet, alle erfahren es.** Es kommt überall vor, in Varianten:

- Wo sich niemand an einer halben Sekunde stört (ein Wurf, eine Notiz), fällt das Vorgreifen weg: Das Fenster schickt und zeigt die Antwort.
- Wo die Antwort für jede Person anders aussieht (Szene, Kampf), rechnet der Server je Person bzw. je Rolle und schickt jeder ihre Fassung.
- Wo es auf Tempo ankommt (Figuren, Nebel, das Blatt), greift das Fenster vor. Das Blatt geht noch einen Schritt weiter und speichert gebündelt, 600 Millisekunden nach dem letzten Tastendruck.

## Grundsätze und warum

Die Entscheidungen, die den Almanach prägen, mit ihren Gründen – und mit den naheliegenden Alternativen, die bewusst nicht genommen wurden. Wer eine davon ändern will, sollte die Gründe kennen.

### Der Server ist die Wahrheit

**Entscheidung:** Was jemand nicht sehen darf, schickt der Server nicht. Die Oberfläche blendet nichts aus, um etwas zu schützen.

**Warum:** Eine Oberfläche lässt sich umgehen – mit den Entwicklerwerkzeugen, mit einem eigenen Programm, mit `curl`. Was im Netzwerkverkehr steht, ist nicht geheim. Ein verborgener Gegner, der nur durchsichtig gezeichnet wird, ist für jeden sichtbar, der ins Netzwerkfenster schaut.

**Folgen:** Sicht, Kampf, Chronik, Würfe, Chat, Notizen und Blätter werden auf dem Server je Rolle oder je Person gefiltert – beim Beantworten einer Anfrage *und* beim Verschicken über den Live-Kanal. Der Vertrag prüft beides.

**Nicht gewählt:** Alles an alle schicken und im Browser filtern. Einfacher, schneller zu bauen – und wertlos.

### SQLite statt eines Datenbankservers

**Entscheidung:** Eine SQLite-Datei, geöffnet vom Server selbst.

**Warum:** Eine Runde hat eine Handvoll gleichzeitiger Nutzer. Ein Datenbankserver (PostgreSQL, MySQL) wäre ein zweiter Dienst zum Installieren, Aktualisieren, Sichern und Absichern – auf einem Pi, um den sich niemand kümmern will. SQLite ist eine Datei: sichern heißt kopieren (richtig gemacht), umziehen heißt verschieben. Seit Node 22.5 ist es in Node eingebaut, ohne Kompilieren.

**Folgen:** Schreibvorgänge sind synchron und blockieren den Server für ihre Dauer – bei den Mengen einer Runde Mikrosekunden. Transaktionen sind synchron (siehe unten). Das WAL-Verfahren erlaubt Lesen während des Schreibens.

**Nicht gewählt:** ein ORM. Die Abfragen stehen als SQL im Code, mit Platzhaltern. Das ist lesbar, genau, und es gibt keine Schicht, die man kennen müsste, um zu verstehen, was geschieht.

### Server-Sent Events statt WebSockets

**Entscheidung:** Der Live-Kanal ist ein SSE-Strom (`text/event-stream`), eine Einbahnstraße vom Server zum Browser.

**Warum:** Geschrieben wird ohnehin über gewöhnliche Aufrufe, die Rechte, Prüfung und Fehlerbehandlung schon haben. Für den Rückweg genügt eine Einbahnstraße. SSE ist gewöhnliches HTTP: Es geht ohne Sonderbehandlung durch den Cloudflare-Tunnel, braucht kein zusätzliches Paket, und der Browser baut die Verbindung nach einem Funkloch von selbst wieder auf.

**Nicht gewählt:** WebSockets. Sie hätten eine zweite Art von Verbindung mit eigener Anmeldung, eigenem Protokoll und eigener Fehlerbehandlung bedeutet – für einen Rückkanal, den SSE genauso gut bedient.

### Ein JSON-Blatt statt Tabellen je Feld

Siehe oben. **Nicht gewählt:** ein normalisiertes Schema mit Tabellen für Fertigkeiten, Zauber, Gegenstände. Es hätte jede Erweiterung des Blattes zu einer Datenbankwanderung gemacht und andere Regelsysteme ausgeschlossen.

### Nachrüsten statt Wanderungsdateien

**Entscheidung:** Keine nummerierten Migrationen. Bei jedem Start prüft jeder Schritt in `datenbank/nachruesten.js`, ob er nötig ist, und tut nur dann etwas.

**Warum:** Es gibt genau eine Datenbank je Almanach, keine Umgebungen, keine Rückwärtswanderung. Nummerierte Wanderungen brauchen eine Buchführung darüber, was schon gelaufen ist; selbstprüfende Schritte brauchen keine.

**Die eine Regel:** Jeder Schritt muss gefahrlos wiederholbar sein. `addColumnIfMissing` ist es von selbst; wer Daten umschreibt, sorgt selbst dafür (siehe `ersteKampagneSichern` in `kampagnenwanderung.js`).

### Transaktionen sind synchron

**Entscheidung:** Wer mehr als eine Zeile schreibt, schreibt in `transaktion(() => …)`, und die Arbeit darin darf kein `await` enthalten.

**Warum:** Node hat einen Faden. Ein `await` in einer Transaktion gäbe ihn an andere Anfragen ab, deren Schreibvorgänge dann mitten in der offenen Transaktion landeten – und mit ihr zurückgerollt würden. Wer vorher etwas Asynchrones braucht (ein Kennwort hashen), tut es *vor* dem Block. `transaktion()` wirft sogar, wenn die Arbeit ein Promise zurückgibt: lieber laut beim Entwickeln als still in der Datenbank.

### Erst prüfen, dann schreiben

**Entscheidung:** Ein Weg prüft alle Eingaben und Rechte, bevor er die erste Zeile schreibt.

**Warum:** Ein 400 oder 403, das trotzdem etwas geändert hat, ist ein Widerspruch – die Oberfläche glaubt, nichts sei geschehen, und die Datenbank sagt etwas anderes. Die Kommentare an `PATCH /api/characters/:id` und `PATCH /api/auth/users/:id` erzählen, wie es vorher war.

### Schlüssel statt Sätze

**Entscheidung:** Jede Absage trägt `code` (unveränderlich) und `error` (ein Satz). Zustände, die der Server meldet, sind Schlüssel (`schwer_verwundet`), keine Sätze.

**Warum:** Die Oberfläche soll auf eine Absage reagieren können, ohne Sätze zu vergleichen, und Sätze sollen sich ändern dürfen, ohne etwas zu brechen. Wie ein Schlüssel auf dem Schirm heißt, entscheidet die Oberfläche (`lib/beschriftung.js`).

### Wer ändert, wer jemand ist, trennt den Kanal

**Entscheidung:** Ein offener Live-Kanal hält Rolle und Kampagne vom Moment des Verbindens fest. Wer das ändert (Abmelden, Rollenwechsel, Entfernen aus einer Kampagne, Löschen eines Kontos, Papierkorb), ruft `trenne()`.

**Warum:** Rolle und Kampagne bei jedem Ereignis neu nachzuschlagen, kostete bei jeder Nachricht an jedes Fenster eine Abfrage. Festhalten ist billig – und verlangt dafür Disziplin an den wenigen Stellen, an denen sich etwas ändert. Der Browser verbindet sich nach dem Trennen selbst neu und bekommt den neuen Stand.

### Wie etwas aussieht, steht im Stilblatt

**Entscheidung:** Kein `style={{ left: 5 }}` im JSX, kein `style="…"` im erzeugten HTML, keine rohen Farbwerte außerhalb der Stilblätter. Was sich erst im Browser ergibt (die Lage einer Figur, die Farbe eines Kontos), geht als CSS-Variable hinaus; die Regel dazu steht im Stilblatt.

**Warum:** Aussehen an einem Ort heißt: Wer das Erscheinungsbild ändert, ändert Stilblätter, nicht zweihundert Bauteile. Und es macht Erscheinungsbilder möglich – Pergament und Kerzenlicht sind zwei Sätze derselben Farbnamen, umgeschaltet mit einem Attribut. Die Stilprobe wacht darüber.

### Deutsch, auch im Code

**Entscheidung:** Namen, Kommentare, Fehlermeldungen und Dokumentation sind deutsch. Englisch bleiben Begriffe aus Regelwerk und Technik, die man so kennt (`combat`, `hp`, `fog`), und alte Namen aus der Frühzeit (`characters`, `scenes`).

**Warum:** Die Sprache am Tisch ist deutsch, und für die Menschen, die daran arbeiten, ist `verbleibendeTage` klarer als `remainingDays`. Die Mischung aus alten englischen und neuen deutschen Namen ist Geschichte, kein Plan; wer etwas umbenennt, nimmt die deutsche Form.

### Kommentare sagen warum

**Entscheidung:** Jede Datei hat einen Kopf, der sagt, wozu es sie gibt; jede Ausfuhr hat einen Kommentar; Kommentare erklären Entscheidungen, nicht Zeilen. Wo eine naheliegende Alternative verworfen wurde, steht sie im Kommentar.

**Warum:** Was eine Zeile tut, steht in der Zeile. Warum sie es *hier* tut und nicht dort, steht nirgends sonst – und wer das nicht weiß, baut die verworfene Alternative in einem Jahr wieder ein. Die Kommentarprobe wacht über Kopf, Ausfuhren, genannte Pfade und verwaiste Kommentare.

### Wenige Abhängigkeiten

Der Server hat genau **eine** Laufzeitabhängigkeit: Express. Dazu die optionale Rückfallebene `better-sqlite3` für Node vor 22.5. Kein Paket für Cookies, Sitzungen, Kennwörter, Protokolle, Validierung oder Datenbankzugriff – das steckt in Node oder in ein paar Zeilen im Almanach.

Die Oberfläche hat React, React Router und drei Schriftpakete zur Laufzeit; zum Bauen Vite, Tailwind CSS, das PWA-Plugin und oxlint.

**Warum:** Jede Abhängigkeit ist etwas, das auf einem Pi installiert, aktualisiert und geprüft werden will, und etwas, das kaputtgehen kann, ohne dass man es selbst geändert hat. Die Proben und der Vertrag kommen ganz ohne zusätzliche Pakete aus, ebenso das Werkzeug, das dieses Buch baut.

## Wo was liegt

```
d-d_manager_repos/
├── backend/
│   ├── src/                 der Server
│   │   ├── server.js        Einstieg: alles wird eingehängt
│   │   ├── db.js, datenbank/  Datenbank
│   │   ├── auth.js, anmeldung/  Anmeldung und Wächter
│   │   ├── events.js        Live-Kanal
│   │   ├── blattmeldung.js  wer von einer Blattänderung erfährt
│   │   ├── routes/          Wege, nach Zweigen
│   │   ├── kampf/ spieltisch/ sicht/ uebernehmen/ vorlagen/ start/
│   │   └── beute.js klang.js chronicle.js kampagnen.js dice.js werte.js …
│   ├── scripts/             Werkzeuge: Sicherung, Kennwort, Umbenennen, Vorlagen
│   ├── public/              die gebaute Oberfläche (entsteht beim Bauen)
│   └── data/                der Datenordner (nicht im Git)
├── frontend/
│   ├── src/
│   │   ├── main.jsx App.jsx index.css
│   │   ├── pages/           Seiten (und ihre Teile in blatt/, tisch/, chronik/, hilfe/)
│   │   ├── components/      Bauteile (sheet/, tabletop/, dm/, klang/, rahmen/ …)
│   │   ├── lib/             Datenschicht, Regeln, Ausfuhr, Helfer
│   │   └── stile/           Stilblätter
│   ├── public/              Symbole, das Aussehen-Skript
│   └── vite.config.js       Bau, PWA, Weiterleitung beim Entwickeln
├── scripts/                 Start, Tunnel, Proben, Vertrag, Drucksatz, Handbuch
├── docs/                    die Handbücher und dieses Buch
├── design/                  Entwürfe des Erscheinungsbildes (Design-Canvas)
├── Dockerfile, docker-compose.yml
└── starten.cmd/.sh, tunnel.cmd/.sh   zum Doppelklicken
```

Jede Datei steht mit ihrem Kopfkommentar in den Verzeichnissen „Dateien: Server“, „Dateien: Oberfläche“ und „Dateien: Werkzeuge“ am Ende des Buches.

## In welcher Reihenfolge lesen

Sechs Dateien, und das Gerüst steht. Rechne mit einer knappen Stunde.

1. **`backend/src/server.js`** – was es überhaupt gibt. Jede `app.use`-Zeile ist ein Zweig der Schnittstelle samt seiner Zugangsregel.
2. **`backend/src/datenbank/schema.js`** und die Dateien in `schema/` – die Tabellen. Wer sie kennt, kennt das Datenmodell.
3. **`backend/src/anmeldung/waechter.js`** – die vier Wächter. Alles, was geschützt ist, ist hier geschützt.
4. **`backend/src/spieltisch/sichtbarkeit.js`** – wer was sieht. Die Kernfrage des Spieltisches, an genau einer Stelle beantwortet.
5. **`frontend/src/App.jsx`** – die drei Tore: angemeldet, Kampagne gewählt, Live-Draht offen.
6. **`frontend/src/lib/daten/grundlage.js`** – wie die Oberfläche an Daten kommt. Darauf baut jeder Haken in `lib/daten/` auf.

Danach eine Sache aussuchen, die man im Almanach benutzt, und sie durch alle Schichten verfolgen – so, wie es das Kapitel „Ein Spielabend von Anfang bis Ende“ für einen ganzen Abend tut.
