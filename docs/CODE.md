# Der Almanach von innen

Eine Landkarte für alle, die am Code arbeiten – geschrieben für jemanden, der
programmieren kann, dieses Projekt aber noch nicht kennt. Kein Lehrbuch über
JavaScript, sondern die Antwort auf: *Wo fange ich an zu lesen, und warum
steht das so da?*

Die Erklärungen im Einzelnen stehen als Kommentare in den Dateien selbst.
Dieses Dokument sagt, wie die Dateien zueinander stehen.

---

## 1. Was hier eigentlich läuft

Zwei Programme, eine Datei als Datenbank:

| Teil          | Womit                          | Wo                     |
| ------------- | ------------------------------ | ---------------------- |
| **Server**    | Node.js + Express              | `backend/src/`         |
| **Oberfläche**| React + Vite + Tailwind CSS    | `frontend/src/`        |
| **Datenbank** | SQLite (eine Datei)            | `backend/data/`        |

Im Betrieb läuft **nur der Server**. Er liefert die fertig gebaute Oberfläche
aus `backend/public` gleich mit – deshalb gibt es im Spiel keine zwei
Adressen und keine Portfreigabe für ein Frontend.

Das ist auch die Falle, in die jeder einmal tappt:

> `git pull` allein ändert **nichts** am laufenden Almanach.
> `backend/public` entsteht beim Bauen und ist nicht im Git.
> Nach jeder Änderung an der Oberfläche: **`npm run build`**.

Beim Entwickeln nimmt man stattdessen `npm run dev` – dann läuft Vite auf
Port 5173 daneben und lädt Änderungen sofort nach.

---

## 2. Die Ordner

```
backend/src/
  server.js          alles wird eingehängt – die kürzeste Übersicht des Servers
  db.js              Datenbank öffnen, Schema anlegen, Altes nachrüsten
  auth.js            Kennwörter, Sitzungen, die Wächter requireAuth/requireDm/…
  events.js          der Live-Kanal (SSE): wer hängt dran, wer bekommt was
  sicht.js           was eine Figur sieht – Licht, Dunkelsicht, Nebel
  chronicle.js       die Chronik mitschreiben
  uebernehmen.js     Daten in eine andere Kampagne kopieren
  kampagnen.js       Papierkorb und endgültiges Entfernen
  dice.js            Würfelausdrücke auswerten („2W6+3“)
  routes/            je eine Datei für einen Zweig der API
  vorlagen/          die zwölf fertigen Charaktere für eine frische Kampagne

frontend/src/
  main.jsx           Startpunkt
  App.jsx            welche Adresse zeigt was – und die drei Tore davor
  lib/               alles ohne Aussehen: Server, Zustand, Regeln, Rechnungen
  pages/             je eine Datei für eine Seite
  components/        Bauteile; dm/ nur für die Spielleitung, sheet/, tabletop/

scripts/             Werkzeuge: starten, Tunnel, Prüfdurchgang, Drucksatz
docs/                die Handbücher – und dieses Dokument
```

---

## 3. Die Vokabeln

Der ganze Code ist **deutsch benannt**. Das ist ungewohnt, aber hier richtig:
Die Sprache am Spieltisch ist deutsch, und `verbleibendeTage` ist für die
Leute, die daran arbeiten, klarer als `remainingDays`. Englisch geblieben
sind nur Begriffe, die aus dem Regelwerk oder der Technik stammen (`combat`,
`npc`, `fog`).

Sechs Wörter, ohne die nichts zu verstehen ist:

| Wort           | Bedeutung                                                                     |
| -------------- | ----------------------------------------------------------------------------- |
| **Runde**      | die Menschen mit ihren Konten. Rundenweit gemeinsam.                           |
| **Kampagne**   | eine Geschichte. Alles Gespielte gehört zu genau einer.                        |
| **Spielleitung** (`sl`) | wer den Abend führt. In alten Stellen auch „DM“.                      |
| **Szene**      | eine Karte *im Spiel* – mit Nebel und Figuren darauf.                          |
| **Karte**      | die *Vorbereitung* dazu: Bild samt ausgerichtetem Raster.                      |
| **Nebel**      | welche Felder je aufgedeckt wurden. Nicht zu verwechseln mit **Sicht**: was gerade zu sehen ist. |

Der Merksatz, der die halbe Architektur erklärt:

> **Konten gehören der Runde, alles Gespielte gehört einer Kampagne.**
> Und: **Vorbereitung gehört der Runde, das Spiel gehört der Kampagne.**

Deshalb liegen Karten, Bilder, Bestiarium, Begegnungen und Klang in jeder
Kampagne bereit, während Charaktere, Szenen, Beute und Chronik zu genau einer
gehören.

---

## 4. In welcher Reihenfolge lesen

Sechs Dateien, und du verstehst das Gerüst. Rechne mit einer knappen Stunde.

1. **`backend/src/server.js`** – was es überhaupt gibt. Jede `app.use`-Zeile
   ist ein Zweig der API samt seiner Zugangsregel.
2. **`backend/src/db.js`** – das Schema. Wer die Tabellen kennt, kennt das
   Datenmodell.
3. **`backend/src/auth.js`** – die vier Wächter. Alles, was geschützt ist,
   ist *hier* geschützt.
4. **`frontend/src/App.jsx`** – die drei Tore: angemeldet, Kampagne gewählt,
   Live-Draht offen.
5. **`frontend/src/lib/daten.jsx`** – wie die Oberfläche an Daten kommt.
6. **`frontend/src/lib/api.js`** – der einzige Ort, an dem `fetch` steht.

Danach such dir eine Sache aus, die du im Almanach benutzt, und verfolge sie
durch alle Schichten. Der nächste Abschnitt macht das einmal vor.

---

## 5. Ein Weg durch alle Schichten

*Eine Spielerin zieht ihre Figur über die Karte.* Was passiert?

1. **`components/tabletop/Board.jsx`** – der Finger setzt auf. `beiZeigerAb`
   erkennt: eine Figur, und sie darf bewegt werden. Beim Loslassen schnappt
   sie aufs Raster ein.
2. **`pages/Tabletop.jsx`** – `figurBewegen` wird gerufen. Es setzt die Figur
   **sofort örtlich** (damit nichts ruckelt) und schickt sie dann los.
3. **`lib/api.js`** – `scenesApi.moveToken` schickt ein `PATCH` samt
   Anmelde-Cookie und der eigenen Fensterkennung.
4. **`backend/src/routes/scenes.js`** – der Server prüft: angemeldet?
   Kampagne gewählt? Gehört diese Figur zu einem Charakterblatt dieser
   Person? Erst dann schreibt er.
5. **`backend/src/events.js`** – `broadcast('figur', …)` schickt die
   Änderung an alle *anderen* Fenster dieser Kampagne. Das eigene wird
   übersprungen – es weiß es ja schon, und ein Echo ließe die Figur kurz
   zurückspringen.
6. **`lib/daten.jsx`** – in den anderen Fenstern fängt `useLive('figur', …)`
   die Nachricht und aktualisiert die Liste.
7. Und auf den Schirmen der anderen bewegt sich die Figur.

Dasselbe Muster gilt überall: **örtlich vorgreifen, schicken, Server
entscheidet, alle erfahren es.**

---

## 6. Die Regeln des Hauses

**Der Server ist die Wahrheit.** Die Oberfläche versteckt Knöpfe, mehr nicht.
Wer die Adresse kennt, kann jeden Weg von Hand aufrufen – was in
`backend/src/routes/` nicht geprüft wird, ist nicht geschützt. Verborgene
Gegner, geheime Notizen und verdeckte Würfe werden deshalb **gar nicht erst
geschickt**, statt in der Oberfläche ausgeblendet zu werden.

**Schlüssel statt Sätze.** Jeder Fehler trägt ein `code`-Feld
(`nicht_angemeldet`, `keine_kampagne`), das sich nie ändert, und ein
`error`-Feld mit einem deutschen Satz, der sich jederzeit ändern darf. Die
Oberfläche prüft **nur** den Schlüssel. Dasselbe gilt für Zustände
(`schwer_verwundet`, nicht `"schwer verwundet"`).

**Kommentare sagen *warum*, nicht *was*.** Dass eine Zeile den Namen setzt,
steht in der Zeile. Warum sie ihn *hier* setzt und nicht dort, steht nirgends
sonst. Wo eine Entscheidung gegen eine naheliegende Alternative getroffen
wurde, gehört die Alternative in den Kommentar – sonst baut sie jemand in
einem Jahr ein und wundert sich.

**Deutsch, ganze Sätze.** Auch in Kommentaren. Sie werden gelesen wie Text,
nicht wie Code.

---

## 7. Bevor du etwas abgibst

```
npm run build        # die Oberfläche neu bauen – sonst ändert sich nichts
npm run vertrag      # der Prüfdurchgang: startet einen eigenen Almanach
                     # auf einem freien Port mit leerer Datenbank und spielt
                     # eine ganze Runde durch (über 240 Prüfungen)
npm run blattprobe   # die Rechnungen des Charakterblattes (340 Prüfungen)
npm run einfuhrprobe # benutzt jemand etwas, das er nicht eingeführt hat?
```

Die **Einfuhrprobe** ist schnell (eine Sekunde) und deckt genau eine Lücke
ab, die sonst keiner sieht: Beim Zerlegen einer Datei wandert eine Funktion
in eine neue Datei – und die `import`-Zeile bleibt zurück. Der Bau merkt
davon **nichts**, weil ein unbekannter Name für ihn eine globale Variable
ist, die es zur Laufzeit schon geben wird. Auffallen würde es erst, wenn
jemand die Seite öffnet und ein weißes Fenster bekommt.

`npm run vertrag` ist das Sicherheitsnetz dieses Projekts. Er prüft nicht
einzelne Funktionen, sondern den **Vertrag zwischen Server und Oberfläche**:
Was darf die Runde sehen, was nicht, welche Schlüssel trägt welcher Fehler,
rechnet die Beute richtig. Wer am Server schraubt, merkt daran sofort, wenn
er etwas bricht, worauf sich die Oberfläche verlässt.

Kommt eine Funktion dazu, kommt eine Prüfung dazu. Die Datei ist
`scripts/vertrag.mjs`, und sie liest sich wie ein Spielabend.

Weiter:

- **`docs/API.md`** – jeder Weg des Servers, samt Rechten und Eigenheiten.
  Die Pflichtlektüre, bevor man einen neuen Weg baut.
- **`docs/HANDBUCH.md`** – was der Almanach kann, aus Sicht der Runde.
- **`frontend/src/pages/Help.jsx`** – die Hilfe *im* Almanach. Wer ein
  Werkzeug ändert, ändert sie mit. Eine Hilfe, die etwas anderes behauptet
  als die Oberfläche, ist schlimmer als gar keine.
