# Arbeiten am Almanach

Dieses Kapitel ist für alle, die etwas am Almanach ändern wollen: wie man ihn zum Entwickeln einrichtet, wie ein Arbeitsgang aussieht, welche Proben was fangen – und, als Rezepte, wie die häufigsten Änderungen gehen. Das größte Rezept arbeitet eine Lücke durch, die es wirklich gibt.

## Einrichten

```bash
git clone <adresse des repositorys>
cd d-d_manager_repos
npm run setup          # die Pakete für Server und Oberfläche
npm run dev            # Server auf 3001 (mit --watch), Oberfläche auf 5173
```

Dann `http://localhost:5173` öffnen. Vite lädt jede Änderung an der Oberfläche sofort nach; der Server startet bei jeder Änderung an `backend/src/` neu. Der Datenordner ist derselbe wie im Betrieb (`backend/data`) – wer mit echten Daten der Runde nicht experimentieren will, startet mit einem eigenen: `DATA_DIR=/tmp/entwicklung npm run dev`.

**Mit VS Code** liegt alles bereit (`.vscode/`): Aufgaben für Setup, Entwickeln, Starten, Adresse, Tunnel und den Prüfdurchgang (*Terminal → Aufgabe ausführen*), eine Startkonfiguration „Almanach starten (Server + Oberfläche)“ mit Haltepunkten im Server, und die Empfehlung für die Erweiterungen Tailwind CSS und oxc. Unter Windows ist die Eingabeaufforderung voreingestellt, weil die PowerShell `npm` gern mit einer Ausführungsrichtlinie blockiert.

**Node** mindestens 22.5 – darunter fehlt das eingebaute SQLite (Kapitel „Betrieb im Alltag“).

## Ein Arbeitsgang

1. **Verstehen.** Die Datei öffnen, ihren Kopfkommentar lesen. Er sagt, wozu es die Datei gibt, und oft auch, was man an ihr nicht ändern sollte. Die Verzeichnisse am Ende des Buches führen jede Datei mit ihrem Kopf auf.
2. **Ändern.** In kleinen Schritten, im Stil der Umgebung: deutsche Namen, Kommentare, die *warum* sagen, erst prüfen, dann schreiben.
3. **Proben.** `npm run lint`, `npm run einfuhrprobe`, `npm run stilprobe`, `npm run kommentarprobe` – zusammen ein paar Sekunden.
4. **Vertrag.** `npm run vertrag`, ein paar Sekunden (auf einem schnellen Rechner rund fünf, auf einem Pi etwas mehr). Kommt ein Weg dazu, kommt eine Prüfung dazu.
5. **Bauen.** `npm run build` – der Bau ist die letzte Prüfung, ob die Oberfläche zusammenpasst.
6. **Alles zusammen:** `npm test` (Lint, vier Proben, Blatt- und Klangprobe, Vertrag), vor jedem Commit.
7. **Dokumentieren.** `docs/API.md` bei neuen Wegen, die Hilfe im Almanach (`frontend/src/pages/hilfe/`) bei neuen Handgriffen, dieses Buch bei neuen Zusammenhängen; `npm run handbuch` schreibt die Verzeichnisse neu.
8. **Committen.** Eine Änderung je Commit, eine Nachricht auf Deutsch, die sagt, was und warum.

## Die Proben

| Befehl | fängt | Dauer |
|---|---|---|
| `npm run lint` | Programmierfehler, unbekannte Namen (`no-undef`), Regeln für Haken | Sekunden |
| `npm run einfuhrprobe` | einen Namen, der im Almanach ausgeführt, in einer Datei benutzt, aber dort nicht eingeführt wird | ~1 s |
| `npm run stilprobe` | Eingebettetes im Code: jedes `style=` im JSX, CSS-Werte in SVG-Attributen, SVG außerhalb der Symbol-Dateien, `style="…"`/`onclick="…"`/`<script>`/`<style>` in erzeugtem HTML, rohe Farbwerte, Eingebettetes in der index.html |
| `npm run kommentarprobe` | Dateien ohne Kopf, Ausfuhren ohne Kommentar, Pfade in Kommentaren, die es nicht gibt, verwaiste Kommentare am Dateiende | ~1 s |
| `npm run blattprobe` | falsche Rechnungen am Blatt, verlorene Felder alter Blätter, unvollständige Vorlagen | < 1 s |
| `npm run klangprobe` | die Rechnung, mit der alle Fenster dieselbe Stelle im Stück finden | < 1 s |
| `npm run vertrag` | alles, was Server und Oberfläche einander zusagen – wer was sehen und tun darf, welche Schlüssel Absagen tragen, wie Beute geteilt wird, dass die Werkzeuge laufen | ~5 s |

Warum so viele eigene Proben statt eines Testrahmens? Weil jede eine Lücke schließt, die der Bau nicht sieht, und keine ein Paket braucht. Die **Einfuhrprobe** ist das beste Beispiel: Wandert beim Zerlegen einer Datei eine Funktion in eine neue Datei und die `import`-Zeile bleibt zurück, merkt der Bau davon nichts – für ihn ist ein unbekannter Name eine globale Variable, die es zur Laufzeit schon geben wird. Auffallen würde es erst, wenn jemand die Seite öffnet und ein weißes Fenster bekommt. (Seit `no-undef` im Lint steht, fängt auch oxlint diesen Fall; die Einfuhrprobe bleibt als zweite Mauer, die nur Namen des Almanachs selbst betrachtet und deshalb nie Fehlalarm gibt.)

Der **Vertrag** ist das Sicherheitsnetz des Projekts. Er startet einen eigenen Almanach auf einem zufälligen freien Port mit einer frischen, leeren Datenbank in einem Wegwerfordner, legt Konten an und spielt in zwanzig Kapiteln (`scripts/vertrag/01-konten.mjs` bis `20-werkzeuge.mjs`) eine Runde durch: Kampagne, Blätter, Vorlagen, Kampf, Gespräch, Spieltisch, Klang, Sicht, Vorhang, Sichtweite, Maßstab, NSC, Live-Kanal, Umbenennen, Umzug, die Grenzen aus dem Code-Review, die Fehlerschlüssel und die Werkzeuge. Er liest sich wie ein Spielabend. Die Kapitel reichen einander über `lage` weiter, was frühere angelegt haben; ein Kapitel einzeln laufen zu lassen geht deshalb nicht ohne die davor.

## Rezept: Ein neues Feld am Blatt

Steht ausführlich im Kapitel „Das Charakterblatt Feld für Feld“. Kurz:

1. `defaultCharacterData()` **und** `withDefaults()` in `frontend/src/lib/regeln/leeresBlatt.js`.
2. Ein Eingabefeld auf dem passenden Reiter, `update('pfad.zum.feld', wert)`.
3. Falls es auf das mitgenommene Blatt soll: der Abschnitt in `lib/blatt/abschnitte/`.
4. Eine Prüfung in `scripts/blattprobe.mjs`, wenn gerechnet wird.

Keine Änderung am Server, keine an der Datenbank.

## Rezept: Eine neue Spalte in der Datenbank

1. **Schema** (`backend/src/datenbank/schema/<bereich>.js`): die Spalte in `CREATE TABLE` – für neue Datenbanken.
2. **Nachrüsten** (`backend/src/datenbank/nachruesten.js`): `addColumnIfMissing('tabelle', 'spalte', 'TYP NOT NULL DEFAULT …')` – für bestehende. Mit einem Kommentar, *warum* es die Spalte gibt. Ein `NOT NULL` braucht einen `DEFAULT`, sonst scheitert das Anfügen an einer Tabelle mit Zeilen.
3. **Umwandlung**: die Spalte in die passende `rowTo…`-Funktion (`snake_case` → `camelCase`).
4. **Wege**: lesen, prüfen (mit `werte.js`), schreiben – erst prüfen, dann schreiben.
5. **Vertrag**: eine Prüfung, dass der Wert ankommt und zurückkommt.
6. `npm run handbuch` schreibt das Verzeichnis der Tabellen neu.

Wer eine Spalte umbenennen oder löschen will: nicht. SQLite kann beides, aber jeder Almanach, der die neue Fassung bekommt, müsste dabei eine Wanderung durchlaufen, die wiederholbar sein muss und die niemand testet. Eine neue Spalte neben der alten, und die alte nicht mehr schreiben, ist fast immer der bessere Weg.

## Rezept: Ein neues Live-Ereignis

Steht ausführlich im Kapitel „Der Live-Kanal“. Kurz: `broadcast()` mit den richtigen Empfängern, den Auslöser auslassen, wenn er vorgreift, `useLive()` in einem Haken unter `lib/daten/`, eine Prüfung mit `mitschreiben()` im Vertrag – auch dafür, dass es bei denen, die es nicht sehen dürfen, *nicht* ankommt.

## Rezept: Eine große Datei zerlegen

Der Almanach hält Dateien klein – eine Aufgabe je Datei, selten über zweihundert Zeilen. Wird eine Datei zu groß:

1. **Die Nähte finden.** Meist hat eine große Datei schon Abschnitte (`/* --- … --- */`), die unabhängig voneinander sind.
2. **Die Teile in einen Ordner gleichen Sinns** neben die Datei: `routes/charaktere/` neben `routes/characters.js`, `components/sheet/kampf/` neben `CombatTab.jsx`.
3. **Die alte Datei wird das Inhaltsverzeichnis.** Sie führt mit benannten Weiterreichungen aus, was die Teile ausführen – `export { a, b } from './teil.js'`, nicht `export * from` (sonst weiß niemand, was durchgereicht wird). So ändert sich für die Aufrufer nichts: `import { holen } from '../lib/api.js'` funktioniert weiter.
4. **Jeder Teil bekommt einen Kopf**, der sagt, was er tut und woher er kommt; der Kopf der alten Datei listet die Teile auf.
5. **Proben:** Die Einfuhrprobe findet vergessene Einfuhren, die Kommentarprobe falsche Pfade und verwaiste Kommentare, der Lint unbekannte Namen.
6. **Nichts ändern außer dem Schnitt.** Wer zerlegt und dabei verbessert, macht zwei Dinge in einem Commit, und keines davon lässt sich mehr prüfen. Erst zerlegen (und prüfen, dass alles gleich ist), dann verbessern.

## Rezept: Aussehen ändern

- **Eine Farbe:** in `stile/farben.css`, in **beiden** Sätzen (Pergament und Kerzenlicht). Überall sonst steht ihr Name.
- **Ein wiederkehrendes Bauteil:** in `stile/bauteile.css` unter `@layer components`.
- **Etwas, das vom Zustand abhängt** (eine Lage, eine Farbe, ein Anteil): eine CSS-Variable über `<Laufwert werte={{ '--x': px(wert) }}>` oder, in einem Bauteil mit Verweisen und Rückrufen, `useLaufstil({ '--x': … })` (`components/Laufwert.jsx`, `lib/laufstil.js`); die Regel, die `var(--x)` benutzt, im Stilblatt.
- **Ein Symbol:** in `components/icons/`, nicht als `<svg>` mitten im Bauteil. Farben und Strichstärken im Stilblatt, nicht als `fill="…"`.
- **Nicht:** irgendein `style=` im JSX (auch nicht für eine Variable), eine Farbe als `#…` im JSX, `style="…"`, `<style>` oder `<script>` in erzeugtem HTML. Die Stilprobe meldet es.

## Beispiel: Eine Lücke schließen

Ein ausführliches Beispiel an einer Stelle, an der der Almanach wirklich eine Lücke hatte – sie stand in früheren Fassungen dieses Buches unter „Bekannte Grenzen“: **Eine Figur ließ sich im Figurenfeld nicht von Hand an ein Charakterblatt binden.** Heldenfiguren entstanden verknüpft nur über „Runde holen“ und „Figuren aus dem Kampf“ – was nebenbei die Kampfliste füllte und „Ein Kampf beginnt“ in die Chronik schrieb.

So wurde sie geschlossen, von der ersten Frage bis zum Commit.

### 1. Die Fragen vorher

- **Wer darf das?** Nur die Spielleitung. Eine Verknüpfung entscheidet, wer die Figur ziehen darf und wessen Sinne die Sicht bestimmen – das darf keine Spielerin selbst setzen.
- **Was darf verknüpft werden?** Ein Blatt dieser Kampagne, oder keines (`null` löst die Verknüpfung). Auch ein NSC-Blatt: dann gelten seine Sinne für die Sicht der Spielleitung durch diese Figur (NSC-Sicht).
- **Wer muss davon erfahren?** Alle: Die Sicht der Spielerin hängt daran, ob die Figur jetzt ihre eigene ist.
- **Was geht kaputt, wenn es schiefgeht?** Eine Figur an einem Blatt einer fremden Kampagne wäre ein Loch; ein Blatt, das es nicht gibt, ein Fremdschlüsselfehler.

### 2. Der Server

In `backend/src/routes/spieltisch/figuren.js` nahm `PATCH /figuren/:id` bis dahin Stelle, Name, Größe, Farbe, Bild, verborgen und Licht an. Dazu kam `characterId`:

```js
const nurBewegen = !isDm(req.user);

// Das Blatt hinter der Figur entscheidet, wer sie ziehen darf und wessen
// Sinne die Sicht bestimmen. Deshalb nur ein Blatt dieser Kampagne (oder
// keines) – geprüft, bevor irgendetwas geschrieben wird.
const mitBlatt = !nurBewegen && 'characterId' in body;
if (mitBlatt && !blattDieserKampagne(body.characterId, req.campaignId)) {
  return res.status(400).json({ code: 'verweis_unbekannt', error: 'Blatt oder Kämpfer gibt es in dieser Kampagne nicht.' });
}

db.prepare(`UPDATE tokens SET …, character_id = ? WHERE id = ?`).run(
  …,
  mitBlatt ? (body.characterId ?? null) : row.character_id,
  row.id
);
```

`blattDieserKampagne` gab es schon (der POST benutzt es) und lässt `null` durch. `meldeFigur(next, req)` am Ende des Weges verschickt die Szene ohnehin je Person neu – die neue Sicht kommt also von selbst an. Wichtig ist die Reihenfolge: erst prüfen, dann schreiben, damit ein 400 nichts geändert hat. (Im selben Zug steht das Schreiben jetzt in `transaktion()`, weil derselbe Weg beim Verbergen auch den Kämpfer mitnimmt – siehe `kampf/verbergen.js`.)

### 3. Die Schnittstelle der Oberfläche

In `frontend/src/lib/api/tisch.js` gibt es `scenesApi.moveToken(id, payload)` – das ist der `PATCH`, und er nimmt beliebige Felder. Neu war dort nichts nötig.

### 4. Das Figurenfeld

In `frontend/src/components/tabletop/TokenPanel.jsx` eine Auswahl mit den Blättern der Kampagne. Die Spielleitung bekommt alle Blätter über `useCharaktere()` (aus `lib/daten.js`), auch die NSC-Blätter:

```jsx
const { charaktere } = useCharaktere();
…
<label className="block">
  <FieldLabel>Blatt</FieldLabel>
  <select value={token.characterId ?? ''} onChange={(e) => aendern({ characterId: e.target.value || null })} className="field-box w-full">
    <option value="">– an keinem Blatt –</option>
    {(charaktere ?? []).map((c) => (
      <option key={c.id} value={c.id}>
        {c.name || 'Namenlos'}
        {c.npc ? ' (NSC)' : c.ownerName ? ` · ${c.ownerName}` : ''}
      </option>
    ))}
  </select>
</label>
```

`aendern()` gab es im Figurenfeld schon: Es ruft `scenesApi.moveToken` und lädt danach die Szene. Kein neuer Zustand, keine neue Datenschicht.

### 5. Der Vertrag

Ein eigenes Kapitel für alle geschlossenen Lücken, `scripts/vertrag/21-luecken.mjs`:

```js
const figur = (await sl.ruf(`/scenes/${szene.id}/figuren`, { methode: 'POST', koerper: { name: 'Lose Figur', x: 0, y: 0 } })).daten;
const schieben = (x) => spieler.ruf(`/scenes/figuren/${figur.id}`, { methode: 'PATCH', koerper: { x } });

gleich((await schieben(70)).status, 403, 'Eine Figur ohne Blatt zieht die Runde nicht');

const gebunden = await sl.ruf(`/scenes/figuren/${figur.id}`, { methode: 'PATCH', koerper: { characterId: held.id } });
gleich(gebunden.daten?.characterId, held.id, 'Die Spielleitung bindet die Figur an ein Blatt');
gleich((await schieben(140)).status, 200, 'Danach zieht die Besitzerin des Blattes sie');

const umgebogen = await spieler.ruf(`/scenes/figuren/${figur.id}`, { methode: 'PATCH', koerper: { x: 210, characterId: null } });
gleich(umgebogen.daten?.characterId, held.id, 'Die Bindung ändert nur die Spielleitung – die Runde wird still übergangen');

const erfunden = await sl.ruf(`/scenes/figuren/${figur.id}`, { methode: 'PATCH', koerper: { characterId: 'gibt-es-nicht', name: 'Umbenannt' } });
gleich(erfunden.status, 400, 'Ein erfundenes Blatt wird abgewiesen');
// … und nichts anderes aus demselben Rumpf wurde geschrieben (der Name bleibt).
```

Die Prüfung mit `umgebogen` verdient einen Blick: Der Weg übergeht Felder, die eine Spielerin nicht setzen darf, *still* (so steht es im Kommentar des Weges – die Oberfläche schickt beim Ziehen ohnehin nur `x` und `y`). Die Besitzerin darf ihre Figur also ziehen, und der Versuch, sie dabei loszubinden, antwortet 200 – ohne die Bindung zu ändern. Deshalb prüft der Vertrag nicht auf 403, sondern darauf, dass die Verknüpfung noch dieselbe ist.

Und die **Gegenprobe**: Mit abgeschalteter Korrektur schlagen die Prüfungen an. Eine Prüfung, die nie scheitern kann, prüft nichts.

### 6. Dokumentation

- `docs/API.md`: `characterId` bei `PATCH /api/scenes/figuren/:id`, nur Spielleitung.
- `docs/SPIELLEITUNG.md` und die Hilfe im Almanach (`frontend/src/pages/hilfe/`): ein Satz im Abschnitt über Figuren.
- Dieses Buch: „Bekannte Grenzen“ im Kapitel „Fehlersuche“, und dieses Beispiel wurde zur Geschichte.
- `npm run handbuch` – das Verzeichnis der Wege liest seine Beschreibungen aus den Kommentaren.

### 7. Prüfen und abgeben

```bash
npm test          # Lint, Proben, Vertrag – alles grün?
npm run build     # passt die Oberfläche?
git add -p        # nur, was dazugehört
git commit        # „Figur im Figurenfeld an ein Blatt binden“ – und warum
```

## Wenn etwas nicht geht

- **Der Server startet nicht:** Das Fenster sagt, warum. Meist ein Syntaxfehler oder ein Import, den es nicht gibt – Node nennt Datei und Zeile.
- **Ein Weg antwortet 500:** Der Stapelauszug steht im Fenster des Servers. Mit der VS-Code-Startkonfiguration „Server (Backend)“ lässt sich ein Haltepunkt setzen.
- **Die Oberfläche bleibt weiß:** Die Konsole des Browsers nennt den Fehler. Fast immer ein unbekannter Name (die Einfuhrprobe hätte ihn gefunden) oder ein Feld, das in einem alten Blatt fehlt (`withDefaults`).
- **Ein Ereignis kommt nicht an:** Im Netzwerk-Reiter die Anfrage `stream` öffnen und die Nachrichten mitlesen. Kommt es dort nicht an, liegt es am Server (Empfänger?); kommt es an, am Haken (Name richtig geschrieben?). Das Verzeichnis der Live-Ereignisse zeigt Namen, die nur auf einer Seite des Drahtes vorkommen.
- **Der Vertrag scheitert:** Die Ausgabe nennt die Zusage, die nicht hielt, samt erwartetem und tatsächlichem Wert. Im Kapitel steht, wie der Stand dahin kam.

## Was in einen Commit gehört – und was nicht

**Gehört hinein:** der Code, die Proben und der Vertrag, die Dokumentation, die neu geschriebenen Verzeichnisse (`docs/buch/referenz/`), das neu gebaute PDF des Buches, wenn sich das Buch geändert hat.

**Gehört nicht hinein:** die `.env` (Kennwörter!), `backend/data/` (die Daten der Runde), `backend/public/` und `frontend/dist/` (entstehen beim Bauen), `docs/druck/` (die Zwischenfassungen des Drucksatzes), `node_modules/`. Alles davon steht in `.gitignore`.
