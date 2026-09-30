# Das Handbuch bauen

Dieses Buch ist Teil des Almanachs und wird mit ihm gepflegt. Es liegt zweimal vor: als Markdown in `docs/`, zum Lesen auf GitHub und im Editor, und als PDF, gesetzt mit Titelblatt, Inhaltsverzeichnis samt Seitenzahlen, Teilblättern und Kopfzeilen. Beides entsteht aus denselben Dateien. Dieses Kapitel beschreibt, wie.

## Ein Befehl

```bash
npm run handbuch                 # Verzeichnisse, HTML und PDF
npm run handbuch -- --ohne-pdf   # nur Verzeichnisse und HTML
```

Heraus kommen:

| Datei | Was | im Git |
|---|---|---|
| `docs/buch/referenz/*.md` | die Verzeichnisse, aus dem Code geschrieben | ja |
| `docs/druck/handbuch.html` | das gesetzte Buch als eine HTML-Seite | nein |
| `docs/druck/handbuch-entwurf.pdf` | der erste Druckdurchgang (ohne Seitenzahlen im Verzeichnis) | nein |
| `docs/Abenteuer-Almanach-Handbuch.pdf` | das Buch | ja |

Das Werkzeug braucht kein Paket. Den Druck übernimmt ein Browser, der ohnehin auf dem Rechner liegt; findet sich keiner, bleibt es beim HTML, und jeder Browser macht mit `Strg+P` → „Als PDF sichern“ dasselbe daraus – Seitenzahlen und Kopfzeilen inklusive, denn die stehen im Stilblatt.

## Die Teile des Buches

### Die Gliederung

Die Reihenfolge des Buches steht in **`docs/buch/README.md`** – dem Inhaltsverzeichnis, das man auf GitHub anklickt. Es ist zugleich der Bauplan für den Druck (`scripts/handbuch/gliederung.mjs`). So gibt es nur *eine* Reihenfolge, und sie kann nicht auseinanderlaufen. Die Regeln:

```markdown
# Titel des Buches                 ← die erste Überschrift

Text bis „## Inhalt“               ← das Vorwort

## Inhalt

### Teil I · Einführung            ← beginnt einen Teil
Text bis zur ersten Kapitelzeile   ← steht auf dem Teilblatt

1. [Was der Almanach ist](01-einleitung.md)       ← ein Kapitel, Pfad von docs/buch/ aus
2. [Für die Runde](../SPIELER.md)                   ← auch Handbücher aus docs/

## Anhang zum Verzeichnis          ← ab hier gehört nichts mehr zur Gliederung
```

Die Kapitelnummern im Markdown sind nur für das Auge; im Druck zählt das Werkzeug selbst durch.

### Die Kapitel

Drei Sorten Kapitel stehen im Buch:

- **Von Hand geschriebene Kapitel** in `docs/buch/` (`01-einleitung.md` …). Sie erklären Zusammenhänge, die kein Code von selbst erzählt.
- **Die Handbücher** in `docs/` – für die Runde, für die Spielleitung, das Handbuch im Almanach, die Einrichtung, der Code-Überblick, die Schnittstelle. Sie stehen auch einzeln und werden im Buch unverändert gesetzt; ihr eigenes kleines Inhaltsverzeichnis (`## Inhalt` mit Verweisen) lässt das Werkzeug dort weg, weil es im Buch das große gibt.
- **Die Verzeichnisse** in `docs/buch/referenz/`, die das Werkzeug bei jedem Lauf aus dem Code schreibt (siehe unten).

### Bilder

Bilder liegen in `docs/buch/bilder/` und werden mit gewöhnlichem Markdown eingebunden:

```markdown
![Der Spieltisch aus Sicht der Spielleitung: …](bilder/tisch-spielleitung.jpg)
```

Der Text in den eckigen Klammern wird im Druck zur Bildunterschrift. Die Aufnahmen im Rundgang stammen aus einer Probe-Runde mit ausgedachten Daten – nie aus dem Almanach einer echten Runde.

## Die Verzeichnisse aus dem Code

Die Verzeichnisse am Ende des Buches sind nicht geschrieben, sondern gelesen: Jedes ist ein kleines Modul in `scripts/handbuch/referenz/`, das den Code durchsucht und ein Markdown-Kapitel zurückgibt. `scripts/handbuch/referenz.mjs` ruft sie der Reihe nach und schreibt die Ergebnisse.

| Datei | Modul | liest |
|---|---|---|
| `80-dateien-server.md` | `dateien.mjs` | Kopfkommentar jeder Datei in `backend/` |
| `81-dateien-oberflaeche.md` | `dateien.mjs` | Kopfkommentar jeder Datei in `frontend/` |
| `82-dateien-werkzeuge.md` | `dateien.mjs` | Kopfkommentar jeder Datei in `scripts/` und `backend/scripts/` |
| `83-wege.md` | `wege.mjs` | jeden Weg: Methode, Pfad, Wächter, Kommentar darüber |
| `84-datenbank.md` | `datenbank.mjs` | die Tabellen aus `datenbank/schema/`, samt nachgerüsteter Spalten |
| `85-ereignisse.md` | `ereignisse.mjs` | jedes `broadcast()` im Server und jedes `useLive()` in der Oberfläche |
| `86-einstellungen.md` | `einstellungen.mjs` | jede Umgebungsvariable (`process.env.…`) samt Kommentar aus `.env.example` |
| `87-befehle.md` | `befehle.mjs` | die Befehle aus `package.json` samt Kopf des Skripts dahinter |
| `88-vorlagen.md` | `vorlagen.mjs` | die zwölf Vorlagen – gebaut, wie der Server sie baut |
| `89-regeln.md` | `regeln.mjs` | die Listen und Tabellen aus `lib/regeln/` |
| `90-pruefnetz.md` | `pruefnetz.mjs` | jede Prüfung im Vertrag und in den Proben |
| `91-fehlerschluessel.md` | `fehler.mjs` | jedes `code: '…'` im Server mit Status und Satz |
| `92-geschichte.md` | `geschichte.mjs` | den Verlauf von git |

Weil sie aus dem Code entstehen, können sie nicht veralten – sie sind der Code, nur lesbar gesetzt. Sie werden mit eingecheckt, damit man sie auf GitHub lesen kann; von Hand ändern lohnt aber nicht: Der nächste Lauf schreibt sie neu. Wer dort etwas ändern will, ändert den Code oder seinen Kommentar.

Nebenbei sind die Verzeichnisse eine Probe: Ein Weg ohne Kommentar steht dort ohne Beschreibung, ein Ereignis, das nur auf einer Seite des Drahtes vorkommt, steht eigens vermerkt.

### Ein neues Verzeichnis

Ein Modul in `scripts/handbuch/referenz/`, das so aussieht:

```js
import { kapitelKopf } from './quelle.mjs';

/** Das Kapitel. */
export const MEIN_VERZEICHNIS = {
  datei: '93-mein-verzeichnis.md',
  erzeugen(wurzel) {
    // den Code unter `wurzel` lesen …
    return kapitelKopf('Verzeichnis von …', 'Wozu es dient …') + '\n## …\n';
  },
};
```

Dann in `referenz.mjs` eintragen und in `docs/buch/README.md` als Kapitel aufführen. `quelle.mjs` hat die Helfer: Dateien unter einem Ordner finden, Kopfkommentare herauslösen, Kommentartext in Markdown verwandeln (eingerückte Spalten werden dabei zu Codeblöcken, damit ihre Ausrichtung stehen bleibt).

## Vom Markdown zum HTML

`scripts/handbuch/satz.mjs` setzt aus der Gliederung und den Kapiteln eine einzige HTML-Seite: Titelblatt, Inhaltsverzeichnis, Vorwort, und je Teil ein Teilblatt und seine Kapitel. Das Markdown liest `scripts/drucksatz/markdown.mjs` – ein eigener, kleiner Leser statt einer Bibliothek. Die Dokumente des Almanachs benutzen eine Handvoll Formen: Überschriften, Absätze, Listen (auch verschachtelt), Tabellen, Zitate, Codeblöcke, Bilder, Hervorhebungen, Verweise. Was er nicht kann – eingebettetes HTML, Fußnoten, Definitionslisten –, steht in keinem der Dokumente.

Drei Dinge machen die eigentliche Arbeit aus:

1. **Eindeutige Anker.** Jedes Kapitel ist für sich ein Markdown-Dokument, und „Überblick“ kommt in einem Dutzend davon vor. Im Buch bekommt jede Überschrift deshalb eine Kennung mit der Kapitelnummer davor (`k7-trefferpunkte`) – in reinem ASCII (ä wird ae, ß wird ss), weil das PDF die Kennungen als Sprungziele übernimmt. Doppelte innerhalb eines Kapitels werden mit `-2`, `-3` unterschieden.
2. **Verweise umbiegen.** Ein Verweis auf `docs/SPIELER.md#wuerfeln` zeigt im Buch auf das Kapitel, in dem SPIELER.md steht, und dort auf den Abschnitt – übersetzt von der Anker-Regel von GitHub in die des Buches. Ein Verweis auf eine Quelldatei (`../../backend/…`) bleibt als Text stehen; im Druck gibt es sie nicht. Ein Verweis auf das Inhaltsverzeichnis (`README.md`) zeigt auf das Verzeichnis des Buches.
3. **Das Verzeichnis.** Es sammelt Teile, Kapitel und deren Abschnitte zweiter Ebene und trägt, sobald bekannt, die Seitenzahlen ein.

Das Stilblatt des Buches ist `scripts/handbuch/buch.css`: A4, Satzspiegel, Schriften, Tabellen, Codeblöcke, Seitenumbrüche vor Teilen und Kapiteln, Kopfzeilen mit dem Kapitelnamen und Seitenzahlen in der Fußzeile über `@page`-Randfelder. Wie beim Almanach selbst steht das Aussehen im Stilblatt und nirgends sonst.

## Vom HTML zum PDF

`scripts/handbuch/drucker.mjs` sucht einen Browser aus der Chromium-Familie, der schon da ist: Chrome, Chromium, Edge (unter Windows immer vorhanden), Brave – an den üblichen Orten je Betriebssystem, dazu ein Chromium, das Playwright schon einmal geholt hat. Ein anderer Weg lässt sich mit `CHROME_PFAD=/pfad/zum/browser` vorgeben. Heruntergeladen wird nichts.

Der Browser druckt ohne Fenster (`--headless`) in eine Datei, und zwar **zweimal**:

1. **Der erste Druck** legt die Seiten fest. Im Verzeichnis stehen dabei Platzhalter (`000`) in der Breite der späteren Zahlen, damit sich beim zweiten Druck nichts verschiebt.
2. **Seitenzahlen ablesen.** `scripts/handbuch/seitenzahlen.mjs` liest aus dem ersten PDF, auf welcher Seite jeder Anker gelandet ist. Chromium legt für jedes Element mit `id`, auf das ein Verweis zeigt, ein *benanntes Sprungziel* an – unkomprimiert im Wörterbuch `/Dests`:

   ```
   /Dests 20 0 R
   20 0 obj << /k3 [7 0 R /XYZ 0 842 0] … >> endobj
   ```

   Die Seite `7 0 R` wird im Seitenbaum (`/Pages` → `/Kids`) gesucht; ihre Stelle dort ist die Seitenzahl. Gelesen wird ohne PDF-Bibliothek.
3. **Der zweite Druck** setzt dieselben Seiten, jetzt mit den Zahlen im Verzeichnis.

Der Umweg ist nötig, weil Chromium die CSS-Funktion `target-counter()` nicht kennt, mit der ein Verzeichnis sich seine Seitenzahlen selbst holen könnte. Sollte Chromium die Sprungziele eines Tages komprimiert ablegen, bleibt das Verzeichnis ohne Zahlen – das Buch entsteht trotzdem.

Am Ende nennt das Werkzeug die Zahl der Seiten und die Größe des PDFs.

## Die einzelnen Handbücher

Neben dem Buch setzt `npm run drucksatz` die Handbücher einzeln – für die Runde, die Spielleitung, die Einrichtung und das Handbuch im Almanach – als eigenständige HTML-Dateien in `docs/druck/`, zum Ausdrucken oder Weitergeben (`scripts/drucksatz.mjs`, derselbe Markdown-Leser, eigenes Stilblatt `scripts/drucksatz.css`). Wer seiner Runde nur die zwei Seiten „Für die Runde“ geben will, nimmt diese.

## Ein Kapitel ergänzen

1. Die Datei in `docs/buch/` anlegen, mit einer Überschrift erster Ebene als Titel.
2. In `docs/buch/README.md` an der richtigen Stelle eine Zeile `n. [Titel](datei.md)` einfügen.
3. `npm run handbuch -- --ohne-pdf` und `docs/druck/handbuch.html` im Browser ansehen – schneller als ein PDF.
4. Stimmt alles: `npm run handbuch`, und PDF samt Kapitel und Verzeichnissen committen.

Die Kommentarprobe prüft auch Verweise in Kommentaren des Codes auf Dateien in `docs/`. Wer ein Kapitel umbenennt, sucht vorher nach seinem Namen.

## Worauf man beim Schreiben achtet

Das Buch folgt denselben Grundsätzen wie der Code:

- **Was es sagt, stimmt mit dem Code überein.** Jede Aussage über Verhalten ist nachprüfbar – mit der Datei, in der es steht. Wo Kapitel und Code auseinanderlaufen, gilt der Code, und das Kapitel gehört berichtigt.
- **Warum, nicht nur was.** Eine Anleitung sagt, welcher Knopf; ein Kapitel sagt auch, warum es den Knopf gibt und was er nicht tut.
- **Grenzen gehören hinein.** Was der Almanach nicht kann oder nicht schützt, steht da – in der Fehlersuche und im Kapitel über die Sicherheit.
- **Keine echten Daten.** Beispiele und Aufnahmen stammen aus einer Probe-Runde. Keine Kennwörter, keine Adressen echter Runden, kein Inhalt einer `.env`.
- **Deutsch, in ganzen Sätzen.** Knöpfe und Beschriftungen in Anführungszeichen, so wie sie auf dem Schirm stehen; Code in Schreibmaschinenschrift.
