# Die Schnittstelle des Almanachs

Dieses Papier beschreibt, worauf sich eine Oberfläche verlassen darf. Wer den
Almanach neu gestaltet, in einer anderen Technik nachbaut oder eine App dazu
schreibt, braucht nur dieses Papier – nicht den Quelltext des Servers.

Der Vertrag ist nicht bloß aufgeschrieben, sondern nachgewiesen:

```bash
npm run vertrag
```

Das Skript startet einen eigenen Almanach mit leerer Datenbank, spielt eine
Runde durch und prüft alles, was hier steht. Wer am Server schraubt, merkt
sofort, wenn er etwas bricht, worauf sich eine Oberfläche verlässt.

## Grundsätzliches

- Alles unter `/api`, alles JSON, alles über dieselbe Herkunft wie die
  Oberfläche (`credentials: 'same-origin'`).
- Die Anmeldung steckt in einem `HttpOnly`-Cookie. Es gibt kein Token, das
  eine Oberfläche selbst verwalten müsste – Anmelden genügt.
- Geschrieben wird über gewöhnliche REST-Aufrufe, zurück kommen Änderungen
  über einen Live-Kanal (siehe unten).

### Zwei Rollen

| Rolle       | Schlüssel   | darf                                                        |
| ----------- | ----------- | ------------------------------------------------------------ |
| Spielleitung| `sl`        | alles                                                        |
| Runde       | `spieler`   | eigene Blätter schreiben, fremde geteilte lesen, mitspielen  |

Das erste angelegte Konto führt die Spielleitung. Jedes weitere braucht einen
Einladungscode.

### Fehler

Jede Fehlerantwort trägt **beides**:

```json
{ "code": "einladung_verbraucht", "error": "Dieser Einladungscode wurde schon eingelöst." }
```

`code` ist unveränderlich und für die Oberfläche gedacht. `error` ist ein
fertiger deutscher Satz und darf sich jederzeit ändern – **niemals darauf
prüfen.** Die mitgelieferte Oberfläche übersetzt Schlüssel in
`frontend/src/lib/beschriftung.js`; eine andere Oberfläche tauscht diese Datei
aus und ist fertig.

Häufige Schlüssel: `nicht_angemeldet` (401), `nur_spielleitung` (403),
`blatt_fremd`, `figur_fremd`, `kaempfer_fremd`, `einladung_ungueltig`,
`einladung_verbraucht`, `name_vergeben`, `passwort_zu_kurz`,
`zu_viele_versuche` (429), `route_unbekannt` (404), `serverfehler` (500).

### Was der Server *nicht* tut

Er legt sich nicht auf eine Darstellung fest:

- **Zustände sind Schlüssel, keine Sätze.** Ein Kämpfer hat
  `status: "schwer_verwundet"`, nicht `"schwer verwundet"`. Mögliche Werte:
  `unversehrt`, `leicht_verletzt`, `verwundet`, `schwer_verwundet`,
  `kampfunfaehig`.
- **Chronikeinträge tragen Strukturdaten.** `kind` und `meta` sind der
  Inhalt; daraus baut jede Oberfläche ihren eigenen Satz. Das mitgelieferte
  `text` ist nur eine fertige Fassung für alle, die sich die Mühe sparen
  wollen, und für die Ausfuhr als Protokoll.
- **Keine Farben, keine Reihenfolgen, keine Beschriftungen** kommen vom
  Server – mit einer Ausnahme: Jedes Konto hat eine `color`, damit Würfe und
  Zeigefinger einer Person überall gleich aussehen.

## Was die Runde nicht sehen darf

Der Server rechnet für Spielleitung und Runde **getrennte Fassungen** aus. Er
verlässt sich nicht darauf, dass die Oberfläche etwas versteckt:

- Verborgene Kämpfer und Figuren fehlen in der Fassung für die Runde ganz.
- Von Monstern gibt es statt Trefferpunkten (`hp: null`) nur einen `status`.
- Verdeckte Würfe und verdeckte Chronikeinträge werden gar nicht erst
  geschickt.
- Das Bestiarium, die Begegnungen und die geheimen Notizen sind für die Runde
  gesperrt (403).

Eine neue Oberfläche kann sich also darauf verlassen: Was sie bekommt, darf
sie zeigen.

## Der Live-Kanal

```
GET /api/stream        →  text/event-stream
```

Gewöhnliches HTTP, kein WebSocket: Es geht ohne Sonderbehandlung durch den
Cloudflare-Tunnel, und der Browser verbindet nach einem Abbruch von selbst
neu. Beim Verbinden kommt zuerst `willkommen` mit der eigenen Fensterkennung.

Diese Kennung gehört bei jedem schreibenden Aufruf in den Kopf `X-Fenster`.
Dann schickt der Server die eigene Änderung nicht als Echo zurück – sonst
springt eine gezogene Figur kurz an ihren alten Platz.

| Ereignis                | Nutzlast                                   |
| ----------------------- | ------------------------------------------ |
| `willkommen`            | `{ clientId, user }`                       |
| `anwesenheit`           | Liste der Anwesenden                       |
| `kampf`                 | der vollständige Kampf (rollengefiltert)   |
| `szene`                 | die aufgelegte Szene samt Figuren und Nebel|
| `figur`                 | eine einzelne Figur (neu oder verändert)   |
| `figur:entfernt`        | `{ id }`                                   |
| `nebel`                 | `{ sceneId, cells, revealed }` – nur die Änderung |
| `ping`                  | `{ x, y, color, name, at }`                |
| `wurf`                  | ein Würfelwurf                             |
| `wuerfe:geleert`        | `{}`                                       |
| `charakter:aktualisiert`| Kurzfassung eines Charakters               |
| `charakter:entfernt`    | `{ id }`                                   |
| `beute`                 | `{ items, coins }`                         |
| `notizen:aktualisiert`  | `{}` – neu laden                           |
| `chronik`               | ein neuer Chronikeintrag                   |
| `chronik:sitzung`       | eine Sitzung begann oder endete            |
| `chronik:geaendert`     | `{}` – neu laden                           |
| `runde:aktualisiert`    | `{}` – Konten neu laden                    |

Manche Ereignisse tragen den neuen Stand mit (`kampf`, `szene`, `beute`),
andere sind nur ein Wink zum Nachladen. Alle 25 Sekunden kommt ein
Kommentarzeilen-Herzschlag, damit die Verbindung nicht einschläft.

## Die Wege im Einzelnen

`[SL]` heißt: nur für die Spielleitung. „Standard“ nennt den Schutz des
gesamten Zweigs.

### /api/auth   (Standard: offen)

    GET    /api/auth/status              wer bin ich, muss eingerichtet werden?
    POST   /api/auth/register            { name, password, invite? }
    POST   /api/auth/login               { name, password }
    POST   /api/auth/logout
    POST   /api/auth/password            { current, next }
    GET    /api/auth/users               [SL]
    PATCH  /api/auth/users/:id           [SL]  { role?, color?, password? }
    DELETE /api/auth/users/:id           [SL]
    GET    /api/auth/invites             [SL]
    POST   /api/auth/invites             [SL]  { note? }
    DELETE /api/auth/invites/:code       [SL]

### /api/characters   (Standard: angemeldet)

    GET    /api/characters               eigene und geteilte, als Kurzfassung
    GET    /api/characters/:id           samt `editable`
    POST   /api/characters               { name, system?, data }
    PUT    /api/characters/:id           { name?, data? }
    PATCH  /api/characters/:id           { ownerId?, shared? }   ownerId nur [SL]
    DELETE /api/characters/:id
    POST   /api/characters/:id/duplicate
    GET    /api/characters/verwaltung/alle   [SL]

Die Kurzfassung enthält vorgerechnet `hp`, `ac` und `initiative`, damit eine
Übersicht nicht jedes Blatt einzeln laden muss.

### /api/encounter   (Standard: angemeldet)

    GET    /api/encounter                        rollengefiltert
    POST   /api/encounter/combatants             [SL]
    PUT    /api/encounter/combatants/:id         [SL]
    POST   /api/encounter/combatants/:id/damage  [SL]  { amount }  negativ heilt
    POST   /api/encounter/combatants/:id/initiative   { value }  eigene Zeile auch für die Runde
    DELETE /api/encounter/combatants/:id         [SL]
    POST   /api/encounter/next-turn              [SL]
    POST   /api/encounter/prev-turn              [SL]
    POST   /api/encounter/reset                  [SL]
    POST   /api/encounter/roll-initiative        [SL]  { onlyEmpty? }
    POST   /api/encounter/party                  [SL]  holt die Runde in den Kampf

Trefferpunkte wandern in beide Richtungen zwischen Kampf und Charakterblatt.

### /api/scenes   (Standard: angemeldet)

    GET    /api/scenes                       [SL] alle, sonst nur die aufgelegte
    GET    /api/scenes/aktiv                 was auf dem Tisch liegt
    POST   /api/scenes                       [SL]
    PUT    /api/scenes/:id                   [SL]
    DELETE /api/scenes/:id                   [SL]
    POST   /api/scenes/:id/aktivieren        [SL]
    POST   /api/scenes/:id/nebel             [SL]  { cells, revealed }
    POST   /api/scenes/:id/nebel/alles       [SL]  { revealed }
    POST   /api/scenes/:id/figuren           [SL]
    PATCH  /api/scenes/figuren/:id           bewegen darf, wem die Figur gehört
    DELETE /api/scenes/figuren/:id           [SL]
    POST   /api/scenes/:id/figuren/aus-kampf [SL]
    POST   /api/scenes/ping                  { x, y }

Der Nebel ist eine Liste von Rasterfeldern als `"x,y"`. Übers Netz wandern nur
die geänderten Felder.

### Weitere Zweige

    /api/dice        Würfeln und geteilte Wurfchronik (verdeckt nur [SL])
    /api/stash       Beutekiste: Münzen, Gefundenes, /teilung, /auszahlen [SL]
    /api/library     Bestiarium                                    (ganz [SL])
    /api/encounters  gespeicherte Begegnungen                      (ganz [SL])
    /api/notes       Notizen; die Runde sieht nur `visibility: "runde"`
    /api/chronicle   Sitzungen, Einträge, /protokoll (Markdown), /rueckblick [SL]
    /api/media       Bilder: POST als data:-URL, GET liefert sie aus
    /api/compendium  zwischengespeicherter Spiegel der offenen D&D-5e-API

## Eine andere Oberfläche bauen

Die mitgelieferte Oberfläche ist in Schichten gebaut, damit die oberste
austauschbar ist:

| Schicht | Ort | beim Umbau |
| ------- | --- | ---------- |
| Regelwerk | `frontend/src/lib/dnd5e.js`, `rasten.js`, `wuerfeln.js` | bleibt |
| Zugriff | `frontend/src/lib/api.js` | bleibt |
| Anmeldung, Live-Kanal | `frontend/src/lib/auth.jsx`, `live.jsx` | bleibt |
| **Daten** | `frontend/src/lib/daten.jsx` | bleibt |
| Beschriftung | `frontend/src/lib/beschriftung.js` | anpassen |
| Aussehen | `frontend/src/index.css` (Farben und Schriften als Variablen) | anpassen |
| Darstellung | `frontend/src/pages/`, `frontend/src/components/` | ersetzen |

Die Datei `daten.jsx` ist dabei die wichtigste: In ihr steckt, wann geladen
wird, welches Ereignis welchen Zustand betrifft und was nach einem Funkloch
nachzuholen ist. Ein Bauteil bekommt fertige Daten und einen Handgriff zum
Nachladen:

```jsx
const { kampf } = useKampf();
const { kiste, laden } = useBeute();
const { szene, figuren, nebel } = useSzene();
```

Wer die Oberfläche neu gestaltet, wirft `pages/` und `components/` weg und
behält alles darunter. Wer sie in einer anderen Technik nachbaut, hält sich an
dieses Papier und weist mit `npm run vertrag` nach, dass der Unterbau steht.
