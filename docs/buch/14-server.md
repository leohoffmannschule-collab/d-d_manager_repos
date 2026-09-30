# Der Server

Der Server ist ein Node.js-Programm mit Express, knapp elftausend Zeilen in `backend/src/`, die meisten davon Kommentare und Wege. Dieses Kapitel geht ihn von oben nach unten durch: wie er startet, wie er Anfragen verteilt, wie er mit der Datenbank umgeht, welche Fachmodule es gibt – und wie ein neuer Weg aussieht, der sich in das Ganze einfügt.

## Der Start

`node backend/src/server.js` tut in dieser Reihenfolge:

1. **Die Umgebung lesen** (`umgebung.js`). Das ist der erste Import überhaupt, und das mit Absicht: Liegt eine `.env` im Wurzelverzeichnis, lädt Node sie mit `process.loadEnvFile` in die Umgebung, *bevor* ein anderes Modul sie befragt – die Datenbank sucht ihren Ordner schon beim Laden. Was schon in der Umgebung steht, schlägt die Datei. Kann Node die Datei nicht lesen (älter als 20.12) oder ist sie kaputt, merkt sich das Modul den Grund; der Startbericht nennt ihn.
2. **Die Datenbank öffnen** (Import von `db.js`). Das öffnet die Datei, legt fehlende Tabellen an, rüstet Spalten nach und zieht beim allerersten Mal eine alte Datenbank ohne Kampagnen in eine erste Kampagne um (siehe unten).
3. **Express aufbauen**: Vertrauen in den Proxy, Sicherheitskopfzeilen, `attachUser`, der Bilderzweig, der JSON-Leser, die Zweige der Schnittstelle, die Auslieferung der Oberfläche, der Fehlerbehandler.
4. **Den Papierkorb räumen**: Kampagnen, die länger als 30 Tage darin liegen, werden endgültig entfernt.
5. **Lauschen** auf `PORT` (Vorgabe 3001) und den Startbericht schreiben (`start/bericht.js`). Ist der Port belegt, sagt der Server das in Klartext und beendet sich.

Es gibt keinen Bau des Servers: Node führt die Dateien so aus, wie sie sind (ES-Module, `"type": "module"`). Beim Entwickeln startet `npm run dev --prefix backend` den Server mit `node --watch`, der bei jeder Änderung neu startet.

## Die Verteilung der Anfragen

Express arbeitet seine `app.use`-Aufrufe von oben nach unten ab; der erste, der antwortet, gewinnt. Die Reihenfolge in `server.js` ist deshalb keine Geschmacksfrage:

| Reihenfolge | Was | Warum dort |
|---|---|---|
| 1 | `trust proxy` | bevor irgendetwas `req.secure` oder `req.ip` liest |
| 2 | Sicherheitskopfzeilen | für jede Antwort, auch Fehler und Bilder |
| 3 | `attachUser` | hängt `req.user` und `req.campaignId` an jede Anfrage |
| 4 | `/api/media` | bringt einen eigenen JSON-Leser mit 20 MB Rahmen mit – muss *vor* dem allgemeinen stehen |
| 5 | `express.json({ limit: '2mb' })` | der allgemeine Rahmen für alles andere |
| 6 | `/api/health`, `/api/stream`, `/api/anwesenheit` | drei Wege direkt in `server.js` |
| 7 | die Zweige | je `app.use('/api/…', Wächter, router)` |
| 8 | `/api` → 404 `route_unbekannt` | alles unter `/api`, das niemand kannte |
| 9 | die gebaute Oberfläche | statische Dateien aus `backend/public`, und für jede andere Adresse die `index.html` |
| 10 | der Fehlerbehandler | ganz zuletzt, damit er alles fängt |

### Die Zweige und ihre Wächter

Ein Wächter, der *vor* dem Router eines Zweiges steht, gilt für jeden Weg darin. Innerhalb eines Routers steht dann `requireDm` vor den einzelnen Wegen, die nur die Spielleitung gehen darf.

| Weg | Wächter davor | Router | Inhalt |
|---|---|---|---|
| `/api/auth` | – (je Weg) | `routes/auth.js` → `routes/konten/` | Anmeldung, Einrichtung, Konten, Einladungen |
| `/api/campaigns` | `requireAuth` (im Router) | `routes/campaigns.js` → `routes/kampagnen/` | Kampagnen, Mitglieder, Umzug, Papierkorb |
| `/api/characters` | `requireCampaign` | `routes/characters.js` → `routes/charaktere/` | Blätter |
| `/api/encounter` | `requireCampaign` | `routes/encounter.js` → `routes/kampf/` | der laufende Kampf |
| `/api/encounters` | `requireCampaign` | `routes/encounters.js` | vorbereitete Begegnungen [SL] |
| `/api/library` | `requireCampaign` | `routes/library.js` | Bestiarium [SL] |
| `/api/scenes` | `requireCampaign` | `routes/scenes.js` → `routes/spieltisch/` | Szenen, Figuren, Nebel, Vorhang, Zeigen |
| `/api/maps` | `requireCampaign` | `routes/maps.js` | Kartenbibliothek [SL] |
| `/api/media` | `requireAuth` (im Router) | `routes/media.js` | Bilder hochladen und ausliefern |
| `/api/dice` | `requireCampaign` | `routes/dice.js` | Würfeln, Wurfchronik |
| `/api/chat` | `requireCampaign` | `routes/chat.js` | Chat |
| `/api/notes` | `requireCampaign` | `routes/notes.js` | Notizen und Handzettel |
| `/api/stash` | `requireCampaign` | `routes/stash.js` | Beutekiste |
| `/api/ambience` | `requireCampaign` | `routes/ambience.js` | Klangteppich |
| `/api/chronicle` | `requireCampaign` | `routes/chronicle.js` → `routes/chronik/` | Chronik, Protokoll, Rückblick |
| `/api/compendium` | `requireAuth` | `routes/compendium.js` | Spiegel der 5e-Schnittstelle |

Alle 123 Wege mit Methode, Wächter und Beschreibung stehen im Verzeichnis „Wege“.

### Große Zweige in Teilen

Wo ein Zweig groß wurde, ist sein Router nur noch ein Inhaltsverzeichnis, das Teilrouter hintereinanderhängt – `routes/characters.js` etwa:

```js
router.use(lesen);        // charaktere/lesen.js       Liste, einzelnes Blatt, Verwaltung
router.use(schreiben);    // charaktere/schreiben.js   anlegen, speichern, zuteilen, löschen
router.use(abschriften);  // charaktere/abschriften.js Abschrift, Kopie in andere Kampagne
```

Die Regeln, die alle Teile brauchen (wer darf sehen, wer darf ändern, wie sieht eine Antwort aus), stehen in einer eigenen Datei daneben (`charaktere/blatt.js`). Dasselbe Muster gilt für `konten/`, `kampagnen/`, `kampf/`, `spieltisch/` und `chronik/`. Die Reihenfolge der Teilrouter ist dabei nicht ganz beliebig: Ein Weg wie `GET /:id` fängt alles, was nach ihm kommt – deshalb stehen die festen Wege (`/verwaltung/alle`, `/papierkorb`, `/umfang`) vorn, und die Kommentare in den Routern sagen, wo.

## Die Datenbank

### Öffnen

`datenbank/verbindung.js` kennt zwei Wege zu SQLite:

1. **`node:sqlite`**, seit Node 22.5 eingebaut. Kein Kompilieren, kein node-gyp, keine Bauwerkzeuge.
2. **`better-sqlite3`**, als Rückfallebene für älteres Node – eine optionale Abhängigkeit, die nur geholt wird, wenn nötig.

Beide bieten dieselbe kleine Schnittstelle: `exec`, `prepare` und darauf `run`, `get`, `all`. Mehr braucht der Almanach nicht. Node meldet beim Laden seines SQLite noch eine Warnung, es sei „experimentell“; die wird für genau diesen einen Fall unterdrückt, damit sie nicht in jedem Startfenster steht.

Nach dem Öffnen zwei Einstellungen:

```sql
PRAGMA journal_mode = WAL;    -- Lesen und Schreiben behindern sich nicht
PRAGMA foreign_keys = ON;     -- in SQLite ab Werk aus!
```

Ohne die zweite Zeile blieben beim Löschen einer Szene ihre Figuren als Leichen liegen: SQLite prüft Fremdschlüssel nur, wenn man es darum bittet.

Der Datenordner ist `DATA_DIR` oder `backend/data`; darin `manager.sqlite3` und der Ordner `medien/`. Beide werden beim Start angelegt, falls sie fehlen.

### Das Schema

`datenbank/schema.js` setzt aus den Dateien in `schema/` ein einziges SQL zusammen – alles `CREATE TABLE IF NOT EXISTS` –, und `db.js` führt es bei jedem Start aus. Die Dateien in `schema/` sind nach Bereichen geschnitten (`runde.js`, `kampagnen.js`, `spielleitung.js`, `spieltisch.js`, `sammlungen.js`, `chronik.js`, `chat.js`, `grundstock.js`, `indizes.js`) und enthalten nur, wie eine Datenbank **neu** aussieht.

Gewohnheiten, die überall gelten:

- **Kennungen** sind Texte, meist UUIDs aus `crypto.randomUUID()`. Keine laufenden Nummern: Eine Kennung soll nichts über die Zahl oder Reihenfolge verraten, und Zeilen lassen sich zwischen Kampagnen kopieren, ohne dass etwas kollidiert.
- **Zeitpunkte** sind ISO-Zeichenketten in UTC (`2026-09-30T19:12:04.113Z`). So sortieren sie als Text richtig.
- **Wahrheitswerte** sind die Zahlen 0 und 1.
- **Listen und Objekte** stehen als JSON in einer TEXT-Spalte (Zustände eines Kämpfers, Schlagworte, der Nebel, das Blatt).
- **Spaltennamen** sind `snake_case` (`grid_size`), die JSON-Felder der Antworten `camelCase` (`gridSize`). Übersetzt wird an genau einer Stelle je Sache, in den `rowTo…`-Funktionen.

### Nachrüsten

Was nach der ersten Fassung dazukam, rüstet `datenbank/nachruesten.js` bei jedem Start nach:

```js
export function ruesteNach() {
  addColumnIfMissing('characters', 'owner_id', 'TEXT');
  addColumnIfMissing('characters', 'shared', 'INTEGER NOT NULL DEFAULT 1');
  …
  addColumnIfMissing('scenes', 'unit', "TEXT NOT NULL DEFAULT 'fuss'");
  addColumnIfMissing('scenes', 'scale', 'REAL NOT NULL DEFAULT 5');
}
```

`addColumnIfMissing` schaut mit `PRAGMA table_info` nach und fügt die Spalte nur an, wenn sie fehlt. Die Reihenfolge der Zeilen ist zugleich die Geschichte des Almanachs.

**Wer eine Spalte ergänzt, ergänzt sie an zwei Stellen:** im Schema (damit eine neue Datenbank sie hat) *und* hier (damit eine bestehende sie bekommt). Steht sie nur im Schema, fehlt sie jedem Almanach, der vorher schon lief.

### Der eine Umzug

`datenbank/kampagnenwanderung.js` ist der einzige Schritt, der mehr tut als eine Spalte anzufügen. Mit den Kampagnen bekam der Almanach eine Ebene, die es vorher nicht gab; ein bestehender Almanach hatte Blätter, Szenen und eine Beutekiste, aber keine Kampagne, zu der sie gehören könnten. Der Schritt

1. fügt allen Tabellen des Spiels und der Vorbereitung eine Spalte `campaign_id` an,
2. legt – nur wenn es noch keine Kampagne, aber schon Konten gibt – eine „Erste Kampagne“ an, setzt alle Konten hinein und schreibt jede Zeile ohne Kampagne ihr zu,
3. schreibt die Einzelwerte in `app_state` von nackten Schlüsseln (`beute`) auf Schlüssel mit Kampagne (`<kampagne>:beute`) um.

Der dritte Punkt ist der heikle: Ohne ihn stünde die Beutekiste nach dem Update leer da – das Gold wäre nicht fort, aber niemand fände es wieder. Alles zusammen läuft in einer Transaktion, und die Prüfung „gibt es schon eine Kampagne?“ macht den Schritt wiederholbar: Beim zweiten Start tut er nichts mehr.

### Abfragen

Abfragen stehen als SQL im Code, mit Fragezeichen als Platzhalter:

```js
const row = db.prepare('SELECT * FROM scenes WHERE id = ? AND campaign_id = ?').get(id, campaignId);
```

**Nie** Werte in die Zeichenkette kleben. Die wenigen Stellen, an denen ein Tabellen- oder Spaltenname in der Zeichenkette steht (`addColumnIfMissing`, das Entfernen einer Kampagne), nehmen ihn aus einer festen Liste im Quelltext, nie aus einer Anfrage; ein Kommentar sagt dort jeweils, warum das in Ordnung ist.

Die zweite Gewohnheit: **Jede Abfrage im Spiel nennt die Kampagne.** `WHERE id = ? AND campaign_id = ?` statt `WHERE id = ?`. Eine Kennung aus einer fremden Kampagne findet so nichts, und der Weg antwortet 404, als gäbe es sie nicht. Die kleinen Helfer `holen(id, campaignId)` in den Wegen tun genau das.

### Transaktionen

```js
import { transaktion } from '../db.js';

transaktion(() => {
  db.prepare('UPDATE characters SET owner_id = ? WHERE owner_id = ?').run(neu, alt);
  db.prepare('DELETE FROM users WHERE id = ?').run(alt);
});
```

`transaktion()` (`datenbank/transaktion.js`) benutzt `SAVEPOINT` statt `BEGIN`: Außerhalb einer Transaktion verhält sich ein Sicherungspunkt wie `BEGIN`, innerhalb einer wie ein Zwischenstand. So darf ein Block einen anderen aufrufen – das Anlegen einer Kampagne etwa das Säen der Vorlagen –, ohne dass SQLite „cannot start a transaction within a transaction“ meldet. Wirft die Arbeit, wird zurückgerollt und der Fehler weitergereicht; gibt sie ein Promise zurück, wirft `transaktion()` selbst, denn ein `await` darin gäbe den Faden an andere Anfragen ab.

### Der Schlüssel-Wert-Speicher

`getState(name, kampagne, ersatz)` und `setState(name, kampagne, wert)` in `db.js` lesen und schreiben `app_state` unter `<kampagne>:<name>`, als JSON. Geht das Lesen schief (ein Wert aus einer früheren Fassung), kommt der Ersatzwert zurück statt eines Absturzes. Welche Namen es gibt, steht im Kapitel „Architektur“.

## Eingaben

Der Server glaubt dem Rumpf einer Anfrage nichts. Eine Zahl kann als Zeichenkette kommen, eine Liste als Objekt, ein Name als `null`. Die kleinen Handgriffe dafür stehen einmal in `werte.js`:

| Helfer | tut |
|---|---|
| `toNumber(wert, ersatz)` | endliche Zahl oder Ersatzwert (Achtung: `null`, `''`, `false` werden zu 0) |
| `zahlOderLeer(wert, ersatz)` | wie oben, aber leer bleibt leer – für „RK unbekannt“ |
| `clamp(wert, min, max)` | zwischen zwei Grenzen halten |
| `istFarbe(wert)` | `#rrggbb` |
| `hatText(wert)` | ein nicht leerer Text |
| `texte(liste, anzahl)` | nur die Texte einer Liste, höchstens `anzahl` |
| `schlagworte(liste)` | getrimmt, je höchstens 40 Zeichen, höchstens 12 |
| `jetzt()` | der Zeitstempel als ISO-Text |

Nichts davon wirft. Ob ein fehlender Wert ein Fehler ist (400) oder „bleibt, wie er war“, entscheidet der Weg.

Verweise auf andere Zeilen – ein Blatt, an das eine Figur gebunden wird, ein Kämpfer, ein Konto – werden gegen die eigene Kampagne geprüft, *bevor* geschrieben wird. Ein Tippfehler soll ein 400 `verweis_unbekannt` sein, kein Fremdschlüsselfehler, der als 500 herauskommt.

Die Größen sind begrenzt: 2 MB für einen gewöhnlichen JSON-Rumpf, 20 MB für den Bilderzweig (ein Bild selbst höchstens 12 MB), 2000 Zeichen für eine Chatzeile, 200 Zeichen für einen Würfelausdruck, 4000 Felder je Nebelstrich, 65 536 aufgedeckte Felder je Szene. Wer darüber liegt, bekommt 400 oder 413.

## Fehler

Eine Absage hat immer dieselbe Form:

```js
return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });
```

`code` ist der Schlüssel, auf den sich die Oberfläche verlässt; `error` ein Satz für Menschen. Alle 74 Schlüssel stehen im Verzeichnis „Fehlerschlüssel“.

Was niemand vorhergesehen hat, landet beim Fehlerbehandler am Ende von `server.js`. Er schreibt den Fehler mit Stapelauszug ins Protokoll und antwortet 500 `serverfehler` – mit einem allgemeinen Satz, nicht mit der Fehlermeldung selbst, die Pfade oder Abfragen verraten könnte. Einen zu großen Rumpf erkennt er (`entity.too.large`) und antwortet 413 `daten_zu_gross`.

Express 4 kennt keine Promises: Wirft ein `async`-Weg, bleibt die Anfrage ohne Antwort hängen. Die Hülle `asynchron()` aus `asynchron.js` reicht den Fehler an `next()` weiter:

```js
router.post('/login', asynchron(async (req, res) => { … }));
```

Jeder Weg mit `await` trägt diese Hülle. Mit Express 5 kann die Datei weg.

## Die Fachmodule

| Modul | Aufgabe |
|---|---|
| `kampf/umwandlung.js` | Zeilen in Kämpfer, Reihenfolge, Wundenstufe aus Trefferpunkten |
| `kampf/sicht.js` | die zwei Fassungen des Kampfes (Spielleitung, Runde) und ihr Versand |
| `kampf/blatt.js` | Trefferpunkte vom Kämpfer zurück aufs Blatt |
| `spieltisch/umwandlung.js` | Zeilen in Szenen und Figuren, aufliegende Szene, Vorhang |
| `spieltisch/sichtbarkeit.js` | **wer was sieht** – die Szene je Person |
| `spieltisch/melden.js` | die Szene je Person verschicken; wer darf eine Figur ziehen; Szene auflegen |
| `sicht.js`, `sicht/` | die Geometrie: Raster, Licht, Sinne, Sichtfelder, Bitkarte |
| `blattmeldung.js` | Änderungen an Blättern nur denen melden, die sie sehen dürfen |
| `beute.js` | die Kiste, Münzen umrechnen, Beute teilen |
| `klang.js` | Spotify-Adressen prüfen, auflegen, den Takt halten |
| `chronicle.js` | Einträge schreiben, Sitzungen eröffnen und schließen |
| `uebernehmen.js`, `uebernehmen/` | Charaktere, Notizen, Szenen, Beute in eine andere Kampagne kopieren |
| `kampagnen.js` | Papierkorb: Frist, endgültiges Entfernen |
| `vorlagen/` | die zwölf Vorlagen bauen und säen |
| `dice.js` | Würfelausdrücke auswerten |
| `domaene.js` | die feste Adresse aus `DOMAENE` |
| `events.js` | der Live-Kanal |

Einige verdienen einen genaueren Blick.

### Würfel

`rollDice(ausdruck, modus)` in `dice.js` versteht Glieder – `2d6`, `d20`, eine Zahl –, die durch Plus oder Minus verbunden sind. Deutsch und englisch sind gleichwertig (`W` wie Würfel, `d` wie *die*). Der Ausdruck muss **als Ganzes** passen; dass jedes Stück für sich ein Glied ist, genügt nicht, sonst ginge `d6d8` als stille Summe durch. Leerzeichen zwischen Gliedern sind erlaubt, mitten in einer Zahl nicht – aus `1W20 5` würde nach dem Entfernen sonst ein zweihundertfünfseitiger Würfel.

Gewürfelt wird mit `crypto.randomInt`, nicht mit `Math.random()`: nicht der Sicherheit wegen, sondern weil es gleichmäßig verteilt ist. Vorteil und Nachteil gelten für den ersten einzelnen W20 im Ausdruck; ein unbekannter Modus gilt als normal und wird nicht heimlich zu Nachteil.

Die Antwort nennt je Glied, was fiel (`details`), damit die Oberfläche die Würfel zeigen kann. Die Wurfchronik hält die letzten 200 Würfe je Kampagne.

### Beute

`teile(vorrat, köpfe)` in `beute.js` teilt so, wie es am Tisch zugeht: von der größten Münze zur kleinsten, und was sich nicht glatt teilen lässt, wird in die nächstkleinere gewechselt und weitergereicht – nie in eine größere. Aus 43 Gold für drei werden 14 Gold je Kopf und ein Rest, der als Silber weiterwandert, nicht „1 Platin, 4 Gold“. Elektrum wird nur angenommen, nie ausgegeben; wer welches hat, bekommt es als Silber zurück. Am Ende bleibt höchstens eine Handvoll Kupfer.

Das Auszahlen schreibt alle Blätter und die Kiste in einer Transaktion: Bräche es nach dem zweiten von fünf Blättern ab, hätten zwei das Gold schon, und beim nächsten Versuch bekämen sie es noch einmal.

### Kompendium

`routes/compendium.js` ist ein Spiegel der offenen 5e-Schnittstelle. Der Browser fragt nie selbst dort an, sondern immer über diesen Weg:

- **Zwischenspeicher.** Jede Antwort liegt danach in `api_cache` und wird dreißig Tage lang von dort ausgeliefert.
- **Lieber veraltet als gar nicht.** Ist die Schnittstelle nicht erreichbar (nach 15 Sekunden ohne Antwort), kommt der alte Eintrag, auch wenn er älter als dreißig Tage ist. Erst wenn es keinen gibt, antwortet der Weg 502 `kompendium_nicht_erreichbar`.
- **Kein Ausbruch.** Der Pfad wird an die Adresse der Schnittstelle gehängt und die *fertig aufgelöste* Adresse geprüft: Sie muss bei derselben Quelle unter demselben Pfad liegen, und kein Teil darf nach dem Entschlüsseln `..` sein. Einen Rohtext nach `..` zu durchsuchen genügte nicht – `%2e%2e` sieht nicht danach aus und wird trotzdem als „eine Ebene hinauf“ gelesen.

Welche Fassung der Regeln gilt, stellt `DND5E_API_BASE` ein: `…/api/2014` (Vorgabe) oder `…/api/2024`.

### Bilder

Bilder kommen als `data:`-Adresse im JSON-Rumpf, nicht als Formular mit Datei – das spart ein Paket für mehrteilige Formulare, und der Browser erzeugt eine solche Adresse aus einer ausgewählten Datei von selbst. Erlaubt sind PNG, JPEG, WebP, GIF und AVIF bis 12 MB. Das Bild wird als `<uuid>.<endung>` in `medien/` abgelegt; in `media` stehen Kennung, Dateiname, Typ und Größe.

Ausgeliefert wird mit `sendFile` und `Cache-Control: private, max-age=31536000, immutable` – der Inhalt zu einer Kennung ändert sich nie, der Browser darf ihn für immer behalten. Fehlt die Datei, obwohl der Eintrag steht (nach einem Umzug), antwortet der Weg 404 `bilddatei_fehlt` und schreibt eine Warnung ins Protokoll, statt still ein leeres Bild zu liefern.

### Chronik

`log()` in `chronicle.js` schreibt einen Eintrag: Art (`wurf`, `schaden`, `heilung`, `tod`, `zustand`, `runde`, `kampf`, `auftritt`, `szene`, `klang`, `handzettel`, `rast`, `notiz`, `stufe`), Handelnde, Ziel, einen fertigen Satz und `meta` mit den Einzelheiten, aus denen jede Oberfläche ihren eigenen Satz bauen kann. Läuft gerade keine Sitzung, eröffnet `log()` eine – sonst ginge der erste Kampf des Abends verloren, nur weil niemand auf „Sitzung beginnen“ gedrückt hat. Verdeckte Einträge (`secret`) gehen über den Live-Kanal nur an die Spielleitung und kommen beim Lesen nur zu ihr.

Das Protokoll (`GET /api/chronicle/sessions/:id/protokoll`) setzt eine Sitzung als Markdown; der Rückblick (`POST …/rueckblick`) schickt das Protokoll der Runde – ohne verdeckte Einträge – an ein Sprachmodell mit OpenAI-kompatibler Schnittstelle, sofern `CHRONIK_KI_URL` gesetzt ist, mit einer Frist von drei Minuten.

## Anatomie eines Weges

Ein Weg im Almanach folgt fast immer demselben Aufbau. Am Beispiel `PATCH /api/characters/:id` (Besitz und Sichtbarkeit eines Blattes, gekürzt):

```js
router.patch('/:id', (req, res) => {
  // 1. Holen – aus der eigenen Kampagne, sonst 404.
  const existing = holen(req.params.id, req.campaignId);
  if (!existing) return res.status(404).json({ code: 'charakter_nicht_gefunden', error: 'Charakter nicht gefunden' });

  // 2. Rechte – grob: darf diese Person das Blatt überhaupt ändern?
  if (!darfBearbeiten(req.user, existing)) {
    return res.status(403).json({ code: 'blatt_fremd', error: 'Dieses Blatt gehört jemand anderem.' });
  }

  // 3. Eingaben lesen und *alles* prüfen, bevor irgendetwas geschrieben wird.
  const { ownerId, shared, npc } = req.body ?? {};
  if ((ownerId !== undefined || npc !== undefined) && !isDm(req.user)) {
    return res.status(403).json({ code: 'nur_spielleitung', error: 'Das darf nur die Spielleitung.' });
  }
  if (ownerId != null && !db.prepare('SELECT id FROM users WHERE id = ?').get(ownerId)) {
    return res.status(400).json({ code: 'konto_nicht_gefunden', error: 'Konto nicht gefunden.' });
  }

  // 4. Schreiben – mehr als eine Zeile, also in einer Transaktion.
  transaktion(() => { … });

  // 5. Melden – an alle, die es angeht, und nur an die.
  const row = holen(existing.id, req.campaignId);
  meldeAenderung(row, req);
  meldeEntzug(existing, row, req.campaignId);

  // 6. Antworten – mit dem neuen Stand, in der Form der Oberfläche.
  res.json(rowToCharacter(row));
});
```

Holen, Rechte, Prüfen, Schreiben, Melden, Antworten. Wer einen neuen Weg baut, hält diese Reihenfolge ein – und ergänzt drei Dinge außerhalb der Datei: den Aufruf in `frontend/src/lib/api/`, die Beschreibung in `docs/API.md` und Prüfungen im Vertrag (`scripts/vertrag/`). Das Kapitel „Arbeiten am Almanach“ führt das an einem vollständigen Beispiel vor.
