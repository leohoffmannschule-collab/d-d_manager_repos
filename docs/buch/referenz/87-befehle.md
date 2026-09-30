# Verzeichnis der Befehle

> Dieses Kapitel schreibt `npm run handbuch` aus dem Code (scripts/handbuch/referenz/).
> Änderungen gehören in den Code und seine Kommentare, nicht hierher.

Jeder Befehl, den `npm run` kennt, mit dem, was er aufruft, und dem, was er tut. Die Erklärung ist der erste Absatz aus dem Kopf des Skripts, das der Befehl startet.

## Im Wurzelverzeichnis

Die Befehle für den Alltag. Sie laufen alle aus dem Wurzelverzeichnis des Almanachs, also dort, wo README.md liegt.

| Befehl | ruft auf |
|---|---|
| `npm run setup` | `npm install --prefix backend && npm install --prefix frontend` |
| `npm run dev` | `concurrently -n Server,Oberflaeche -c yellow,magenta "npm:dev:backend" "npm:dev:frontend"` |
| `npm run dev:backend` | `npm run dev --prefix backend` |
| `npm run dev:frontend` | `npm run dev --prefix frontend` |
| `npm run build` | `npm run build --prefix frontend && node scripts/copy-frontend.mjs` |
| `npm run start` | `node scripts/start.mjs` |
| `npm run pruefen` | `node scripts/start.mjs --pruefen` |
| `npm run serve` | `npm start --prefix backend` |
| `npm run adresse` | `node scripts/adresse.mjs` |
| `npm run tunnel` | `node scripts/tunnel.mjs` |
| `npm run sicherung` | `node backend/scripts/sicherung.mjs` |
| `npm run vorlagen` | `node backend/scripts/vorlagen.mjs` |
| `npm run drucksatz` | `node scripts/drucksatz.mjs` |
| `npm run vertrag` | `node scripts/vertrag.mjs` |
| `npm run blattprobe` | `node scripts/blattprobe.mjs` |
| `npm run klangprobe` | `node scripts/klangprobe.mjs` |
| `npm run einfuhrprobe` | `node scripts/einfuhrprobe.mjs` |
| `npm run stilprobe` | `node scripts/stilprobe.mjs` |
| `npm run kommentarprobe` | `node scripts/kommentarprobe.mjs` |
| `npm run lint` | `npm run lint --prefix frontend && node frontend/node_modules/oxlint/bin/oxlint -c .oxlintrc.json backend/src backend/scripts scripts` |
| `npm run test` | `npm run lint && npm run einfuhrprobe && npm run stilprobe && npm run kommentarprobe && npm run blattprobe && npm run klangprobe && npm run vertrag` |

### npm run setup

Holt die Pakete für Server und Oberfläche (`npm install` in beiden Ordnern). `npm start` erledigt das beim ersten Mal von selbst.

### npm run dev

Startet Server und Oberfläche nebeneinander im Entwicklungsmodus: Die Oberfläche lädt bei jeder Änderung neu (Vite auf Port 5173), der Server startet neu (Port 3001).

### npm run dev:backend

Nur den Server im Entwicklungsmodus (`node --watch`).

### npm run dev:frontend

Nur die Oberfläche im Entwicklungsmodus (Vite).

### npm run build

Baut die Oberfläche (Vite) und kopiert das Ergebnis nach backend/public, von wo der Server sie ausliefert.

### npm run start

Der Almanach ohne Docker – ein Befehl, überall.

### npm run pruefen

Berichtet nur, was `npm start` tun würde – Node-Fassung, fehlende Pakete, fehlender Bau –, und tut nichts davon.

### npm run serve

Startet nur den Server, ohne die Prüfungen von `npm start` – für den Container.

### npm run adresse

Welche Adresse hat der Almanach gerade?

### npm run tunnel

Der Weg nach außen – ohne Docker, ohne Portfreigabe, ohne Konto.

### npm run sicherung

Sicherung des Almanachs.

### npm run vorlagen

Die Vorlagen-Charaktere nachlegen.

### npm run drucksatz

Aus den Handbüchern druckfertige Seiten setzen.

### npm run vertrag

Der Vertrag zwischen Server und Oberfläche.

### npm run blattprobe

Die Rechenprobe des Charakterblattes.

### npm run klangprobe

Die Klangprobe: Rechnet der Almanach die Stelle im Stück richtig aus?

### npm run einfuhrprobe

Die Einfuhrprobe: Wer benutzt etwas, das er nicht eingeführt hat?

### npm run stilprobe

Die Stilprobe: Steht Aussehen oder Verhalten irgendwo, wo es nicht hingehört?

### npm run kommentarprobe

Die Kommentarprobe: Ist der Code so erklärt, wie es sich der Almanach vorgenommen hat?

### npm run lint

Prüft den Code mit oxlint: die Oberfläche mit ihren Browser-Regeln, Server und Werkzeuge mit den Node-Regeln (unter anderem `no-undef`).

### npm run test

Alles, was vor einem Commit laufen soll, der Reihe nach: lint, Einfuhr-, Stil- und Kommentarprobe, Blatt- und Klangprobe, der Vertrag. Bricht beim ersten Fehler ab.

## Im Server (backend/)

Selten direkt gebraucht – die Befehle oben rufen diese auf.

| Befehl | ruft auf |
|---|---|
| `npm run start` | `node src/server.js` |
| `npm run dev` | `node --watch src/server.js` |

### npm run start

Der Server: hier läuft alles zusammen.

### npm run dev

Startet Server und Oberfläche nebeneinander im Entwicklungsmodus: Die Oberfläche lädt bei jeder Änderung neu (Vite auf Port 5173), der Server startet neu (Port 3001).

## In der Oberfläche (frontend/)

Ebenso: meist über die Befehle im Wurzelverzeichnis.

| Befehl | ruft auf |
|---|---|
| `npm run dev` | `vite` |
| `npm run build` | `vite build` |
| `npm run lint` | `oxlint` |
| `npm run preview` | `vite preview` |

### npm run dev

Startet Server und Oberfläche nebeneinander im Entwicklungsmodus: Die Oberfläche lädt bei jeder Änderung neu (Vite auf Port 5173), der Server startet neu (Port 3001).

### npm run build

Baut die Oberfläche (Vite) und kopiert das Ergebnis nach backend/public, von wo der Server sie ausliefert.

### npm run lint

Prüft den Code mit oxlint: die Oberfläche mit ihren Browser-Regeln, Server und Werkzeuge mit den Node-Regeln (unter anderem `no-undef`).

### npm run preview

Zeigt die gebaute Oberfläche an, ohne Server – nur zum Anschauen des Baus.
