# Verzeichnis der Live-Ereignisse

> Dieses Kapitel schreibt `npm run handbuch` aus dem Code (scripts/handbuch/referenz/).
> Änderungen gehören in den Code und seine Kommentare, nicht hierher.

Über den Live-Kanal (`GET /api/stream`, Server-Sent Events) schickt der Server jedem offenen Fenster, was sich geändert hat. Jedes Ereignis hat einen Namen und einen Inhalt in JSON. Welche Fenster es bekommen, entscheidet der Server beim Schicken: nur die Spielleitung, nur bestimmte Konten (etwa weil jedes Konto eine eigene Sicht auf den Nebel hat), alle in einer Kampagne oder die ganze Runde. Das Fenster, das eine Änderung selbst ausgelöst hat, wird bei manchen Ereignissen ausgelassen – es kennt die Änderung schon, und das Echo ließe eine gezogene Figur kurz zurückspringen.

Wie der Kanal gebaut ist, steht im Kapitel über den Live-Kanal im Teil „Wie es gebaut ist“.

## Übersicht

| Ereignis | geschickt aus | an wen | gehört in |
|---|---|---|---|
| `anwesenheit` | events.js | in dieser Kampagne | lib/live.jsx |
| `beute` | routes/stash.js, uebernehmen/alles.js | ohne das auslösende Fenster, in dieser Kampagne; in dieser Kampagne | lib/daten/kampagne.js |
| `charakter:aktualisiert` | blattmeldung.js | nur die Spielleitung, ohne das auslösende Fenster, in dieser Kampagne; nur Rolle „spieler“, einzelne Konten (je eigene Sicht), ohne das auslösende Fenster, in dieser Kampagne | components/dm/runde/Charakterzuweisung.jsx, lib/daten/kampagne.js, pages/blatt/useBlatt.js |
| `charakter:entfernt` | blattmeldung.js, routes/charaktere/schreiben.js | nur Rolle „spieler“, einzelne Konten (je eigene Sicht), in dieser Kampagne; in dieser Kampagne | lib/daten/kampagne.js |
| `chat` | routes/chat.js | einzelne Konten (je eigene Sicht), ohne das auslösende Fenster, in dieser Kampagne | lib/daten/gespraech.js |
| `chat:geleert` | routes/chat.js | in dieser Kampagne | lib/daten/gespraech.js |
| `chronik` | chronicle.js | Verdecktes nur an die Spielleitung, in dieser Kampagne | lib/daten/kampagne.js |
| `chronik:geaendert` | routes/chronik/rueckblick.js, routes/chronik/sitzungen.js | in dieser Kampagne | lib/daten/kampagne.js |
| `chronik:sitzung` | chronicle.js | in dieser Kampagne | lib/daten/kampagne.js |
| `figur` | spieltisch/melden.js | nur die Spielleitung, ohne das auslösende Fenster, in dieser Kampagne | lib/daten/spieltisch.js |
| `figur:entfernt` | routes/spieltisch/figuren.js | nur die Spielleitung, in dieser Kampagne | lib/daten/spieltisch.js, pages/Tabletop.jsx |
| `figuren` | spieltisch/melden.js | einzelne Konten (je eigene Sicht), in dieser Kampagne | lib/daten/spieltisch.js |
| `kampf` | kampf/sicht.js | nur die Spielleitung, in dieser Kampagne; nur Rolle „spieler“, in dieser Kampagne | lib/daten/kampf.js |
| `klang` | klang.js | in dieser Kampagne | lib/daten/runde.js |
| `nebel` | routes/spieltisch/nebel.js | nur die Spielleitung, ohne das auslösende Fenster, in dieser Kampagne; nur Rolle „spieler“, in dieser Kampagne | lib/daten/spieltisch.js |
| `notizen:aktualisiert` | routes/notes.js, uebernehmen/alles.js | in dieser Kampagne | lib/daten/kampagne.js |
| `ping` | routes/spieltisch/zeigen.js | unter Bedingung nur die Spielleitung, in dieser Kampagne | lib/daten/spieltisch.js |
| `runde:aktualisiert` | routes/konten/anmeldung.js, routes/konten/verwaltung.js | nur die Spielleitung, die ganze Runde, kampagnenübergreifend | lib/daten/runde.js |
| `szene` | routes/spieltisch/szenen.js, spieltisch/melden.js | nur die Spielleitung, in dieser Kampagne; einzelne Konten (je eigene Sicht), in dieser Kampagne | lib/daten/spieltisch.js |
| `willkommen` | events.js | das eine Fenster, das sich gerade verbindet | lib/live.jsx |
| `wuerfe:geleert` | routes/dice.js | in dieser Kampagne | lib/daten/gespraech.js |
| `wurf` | routes/dice.js | Verdecktes nur an die Spielleitung, in dieser Kampagne | components/Wurfmeldung.jsx, lib/daten/gespraech.js, lib/live.jsx |

Jedes Ereignis wird geschickt *und* gehört – keines läuft ins Leere.

## Die Stellen im Einzelnen

### anwesenheit

- geschickt: backend/src/events.js, Zeile 64 – in dieser Kampagne
- geschickt: backend/src/events.js, Zeile 72 – in dieser Kampagne
- gehört: frontend/src/lib/live.jsx

### beute

- geschickt: backend/src/routes/stash.js, Zeile 44 – ohne das auslösende Fenster, in dieser Kampagne
- geschickt: backend/src/uebernehmen/alles.js, Zeile 41 – in dieser Kampagne
- gehört: frontend/src/lib/daten/kampagne.js

### charakter:aktualisiert

- geschickt: backend/src/blattmeldung.js, Zeile 41 – nur die Spielleitung, ohne das auslösende Fenster, in dieser Kampagne
- geschickt: backend/src/blattmeldung.js, Zeile 43 – nur Rolle „spieler“, einzelne Konten (je eigene Sicht), ohne das auslösende Fenster, in dieser Kampagne
- gehört: frontend/src/components/dm/runde/Charakterzuweisung.jsx
- gehört: frontend/src/lib/daten/kampagne.js
- gehört: frontend/src/pages/blatt/useBlatt.js

### charakter:entfernt

- geschickt: backend/src/blattmeldung.js, Zeile 77 – nur Rolle „spieler“, einzelne Konten (je eigene Sicht), in dieser Kampagne
- geschickt: backend/src/routes/charaktere/schreiben.js, Zeile 143 – in dieser Kampagne
- gehört: frontend/src/lib/daten/kampagne.js

### chat

- geschickt: backend/src/routes/chat.js, Zeile 131 – einzelne Konten (je eigene Sicht), ohne das auslösende Fenster, in dieser Kampagne
- gehört: frontend/src/lib/daten/gespraech.js

### chat:geleert

- geschickt: backend/src/routes/chat.js, Zeile 161 – in dieser Kampagne
- gehört: frontend/src/lib/daten/gespraech.js

### chronik

- geschickt: backend/src/chronicle.js, Zeile 126 – Verdecktes nur an die Spielleitung, in dieser Kampagne
- gehört: frontend/src/lib/daten/kampagne.js

### chronik:geaendert

- geschickt: backend/src/routes/chronik/rueckblick.js, Zeile 105 – in dieser Kampagne
- geschickt: backend/src/routes/chronik/sitzungen.js, Zeile 111 – in dieser Kampagne
- gehört: frontend/src/lib/daten/kampagne.js
- gehört: frontend/src/lib/daten/kampagne.js

### chronik:sitzung

- geschickt: backend/src/chronicle.js, Zeile 69 – in dieser Kampagne
- geschickt: backend/src/chronicle.js, Zeile 79 – in dieser Kampagne
- gehört: frontend/src/lib/daten/kampagne.js

### figur

- geschickt: backend/src/spieltisch/melden.js, Zeile 127 – nur die Spielleitung, ohne das auslösende Fenster, in dieser Kampagne
- gehört: frontend/src/lib/daten/spieltisch.js

### figur:entfernt

- geschickt: backend/src/routes/spieltisch/figuren.js, Zeile 116 – nur die Spielleitung, in dieser Kampagne
- gehört: frontend/src/lib/daten/spieltisch.js
- gehört: frontend/src/pages/Tabletop.jsx

### figuren

- geschickt: backend/src/spieltisch/melden.js, Zeile 90 – einzelne Konten (je eigene Sicht), in dieser Kampagne
- gehört: frontend/src/lib/daten/spieltisch.js

### kampf

- geschickt: backend/src/kampf/sicht.js, Zeile 49 – nur die Spielleitung, in dieser Kampagne
- geschickt: backend/src/kampf/sicht.js, Zeile 50 – nur Rolle „spieler“, in dieser Kampagne
- gehört: frontend/src/lib/daten/kampf.js

### klang

- geschickt: backend/src/klang.js, Zeile 104 – in dieser Kampagne
- gehört: frontend/src/lib/daten/runde.js

### nebel

- geschickt: backend/src/routes/spieltisch/nebel.js, Zeile 55 – nur die Spielleitung, ohne das auslösende Fenster, in dieser Kampagne
- geschickt: backend/src/routes/spieltisch/nebel.js, Zeile 57 – nur Rolle „spieler“, in dieser Kampagne
- gehört: frontend/src/lib/daten/spieltisch.js

### notizen:aktualisiert

- geschickt: backend/src/routes/notes.js, Zeile 91 – in dieser Kampagne
- geschickt: backend/src/routes/notes.js, Zeile 114 – in dieser Kampagne
- geschickt: backend/src/routes/notes.js, Zeile 126 – in dieser Kampagne
- geschickt: backend/src/uebernehmen/alles.js, Zeile 40 – in dieser Kampagne
- gehört: frontend/src/lib/daten/kampagne.js

### ping

- geschickt: backend/src/routes/spieltisch/zeigen.js, Zeile 21 – unter Bedingung nur die Spielleitung, in dieser Kampagne
- gehört: frontend/src/lib/daten/spieltisch.js

### runde:aktualisiert

- geschickt: backend/src/routes/konten/anmeldung.js, Zeile 100 – nur die Spielleitung, die ganze Runde, kampagnenübergreifend
- geschickt: backend/src/routes/konten/verwaltung.js, Zeile 72 – nur die Spielleitung, die ganze Runde, kampagnenübergreifend
- geschickt: backend/src/routes/konten/verwaltung.js, Zeile 95 – nur die Spielleitung, die ganze Runde, kampagnenübergreifend
- gehört: frontend/src/lib/daten/runde.js

### szene

- geschickt: backend/src/routes/spieltisch/szenen.js, Zeile 217 – nur die Spielleitung, in dieser Kampagne
- geschickt: backend/src/spieltisch/melden.js, Zeile 74 – einzelne Konten (je eigene Sicht), in dieser Kampagne
- geschickt: backend/src/spieltisch/melden.js, Zeile 123 – einzelne Konten (je eigene Sicht), in dieser Kampagne
- gehört: frontend/src/lib/daten/spieltisch.js
- gehört: frontend/src/lib/daten/spieltisch.js

### willkommen

- geschickt: backend/src/events.js, Zeile 51 – das eine Fenster, das sich gerade verbindet
- gehört: frontend/src/lib/live.jsx

### wuerfe:geleert

- geschickt: backend/src/routes/dice.js, Zeile 140 – in dieser Kampagne
- gehört: frontend/src/lib/daten/gespraech.js

### wurf

- geschickt: backend/src/routes/dice.js, Zeile 132 – Verdecktes nur an die Spielleitung, in dieser Kampagne
- gehört: frontend/src/components/Wurfmeldung.jsx
- gehört: frontend/src/lib/daten/gespraech.js
- gehört: frontend/src/lib/live.jsx
