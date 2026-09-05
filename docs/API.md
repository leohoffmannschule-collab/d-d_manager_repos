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
    POST   /api/characters               { name, system?, data, npc? }   npc nur [SL]
    PUT    /api/characters/:id           { name?, data? }
    PATCH  /api/characters/:id           { ownerId?, shared?, npc? }   ownerId und npc nur [SL]
    DELETE /api/characters/:id
    POST   /api/characters/:id/duplicate
    GET    /api/characters/verwaltung/alle   [SL]

Die Kurzfassung enthält vorgerechnet `hp`, `ac` und `initiative`, damit eine
Übersicht nicht jedes Blatt einzeln laden muss.

**NSC-Blätter** (`npc: true`) sind der Zettel der Spielleitung hinter dem
Schirm. Sie liefern einer Spielerin `403`, tauchen in ihrer Übersicht nicht auf
und werden beim Holen der Runde in den Kampf übergangen. Geprüft wird das
*vor* allen anderen Regeln – auch ein versehentlich als „geteilt“ markiertes
NSC-Blatt bleibt hinter dem Schirm. Ein NSC-Blatt lässt sich mit einer Figur
auf dem Spieltisch verknüpfen; dann gelten dessen Sinne für ihre Sicht.

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
    POST   /api/scenes/:id/aktivieren        [SL] { verdeckt? }
    POST   /api/scenes/vorhang               [SL] { zu }
    POST   /api/scenes/:id/nebel             [SL]  { cells, revealed }
    POST   /api/scenes/:id/nebel/alles       [SL]  { revealed }
    POST   /api/scenes/:id/figuren           [SL]
    PATCH  /api/scenes/figuren/:id           bewegen darf, wem die Figur gehört
    DELETE /api/scenes/figuren/:id           [SL]
    POST   /api/scenes/:id/figuren/aus-kampf [SL]
    POST   /api/scenes/ping                  { x, y }
    POST   /api/scenes/nsc-sicht             [SL] { tokenId | null }

Eine Szene, die aus einer Karte der Bibliothek entstanden ist, trägt deren
`mapId` und erbt ihren Maßstab.

### Maßstab

Ein Rasterfeld steht für eine Spielweite, und die muss nicht 5 Fuß sein:

| Feld | Bedeutung |
| ---- | --------- |
| `unit` | `"fuss"` (Vorgabe) oder `"meter"` |
| `scale` | Spielweite je Feld, 0,1 bis 1000. Vorgabe 5 für Fuß, 1 für Meter. |

Damit lässt sich eine Karte in Metern anlegen: 200 × 200 Felder zu einem Meter
sind zweihundert Meter Kantenlänge. Lineal, Größenangaben und die
Sichtweiten rechnen damit – die Sinne stehen auf dem Blatt weiter in Fuß, weil
das Regelwerk in Fuß geschrieben ist, und werden umgerechnet: 30 Fuß
Dunkelsicht reichen auf einer Meterkarte neun Felder weit statt sechs.

### Nebel und Sicht als Bitkarte

`fogBits` und `sichtBits` sind base64 verpackte Bitfolgen, ein Bit je
Rasterfeld, zeilenweise über den Rasterbereich der Szene (`rasterBereich` in
`sicht.js` und `frontend/src/lib/rasterkarte.js` rechnen ihn identisch aus).
`sichtBits: null` heißt weiterhin „keine Sichtgrenze“.

Der Grund ist Arithmetik: Eine Karte über zweihundert Meter hat bei einem
Meter je Feld 40 000 Felder. Als Liste von `"x,y"` wären das **348 KB** – und
die Szene geht bei jedem Zug an jede Person neu hinaus, macht bei fünf
Spielern 1,7 MB für einen Schritt zur Seite. Als Bitkarte sind es **6,5 KB**.
Die Bitkarte ist dabei immer gleich groß, egal wie viel aufgedeckt ist; auch
bei kleinen Karten bleibt sie die sparsamere Form.

Die einzelnen Pinselstriche wandern weiterhin als `"x,y"` (im `nebel`-Ereignis
und in `POST /nebel`) – ein Strich ist klein, dafür lohnt kein Umpacken. Die
Szenenliste (`GET /api/scenes`) trägt gar keinen Nebel mehr; sie braucht ihn
nicht.

### Der Vorhang

Ist er zu (`POST /api/scenes/vorhang { zu: true }`), bekommt die Runde von
`/scenes/aktiv` und aus dem `szene`-Ereignis **nur noch** dies:

```json
{ "vorhang": true }
```

Kein Bild, keine Figuren, kein Nebel, nicht einmal der Name der Szene. Das ist
kein Ausblenden im Browser, sondern eine Nutzlast, die nichts enthält – die
Spielleitung kann dahinter die Karte wechseln, Gegner stellen und Nebel malen,
ohne dass ein Schnipsel davon herausgeht. Sie selbst sieht ihren Tisch weiter,
mit `vorhang: true` als Vermerk.

`aktivieren` und `maps/:id/auflegen` nehmen `verdeckt: true` und ziehen den
Vorhang in einem Zug mit zu. Der Chronikeintrag zur Szene entsteht dabei
nicht beim Auflegen, sondern erst, wenn der Vorhang aufgeht – im Protokoll
soll kein Ort stehen, den am Tisch niemand gesehen hat.

Kampfliste, Beute und Handzettel laufen daneben weiter. Verdeckt wird der
Tisch, nicht der ganze Abend.

### Wer sieht was

Die Szene geht **je Person** hinaus, nicht je Rolle. Neben `fog` (was die
Spielleitung aufgedeckt hat) trägt sie:

| Feld | Bedeutung |
| ---- | --------- |
| `dark` | Dunkle Szene: Erst dann greifen Licht und Dunkelsicht. |
| `sight` | Obere Sichtgrenze für alle in dieser Szene, in Fuß. `0` = keine – Nebelbank, Schneetreiben, dichter Wald. |
| `sichtBits` | Die Felder, die *diese* Person gerade sieht, als Bitkarte. `null` heißt „alles Aufgedeckte“ – helle Szene, kein Nebel, oder keine eigene Figur auf der Karte. |
| `nscSicht` | Nur für die Spielleitung: durch welche Figur sie gerade schaut, sonst `null`. |

Eine Figur trägt dazu `lightBright` und `lightDim` in Fuß – was sie an Licht
mit sich führt, erhellt die Karte für alle.

Gerechnet wird das auf dem Server, in `backend/src/sicht.js`, und zwar für die
Runde und für die NSC-Steuerung der Spielleitung mit **derselben** Funktion.
Entscheidend: **Figuren außerhalb der Sicht stehen nicht in der Nutzlast.** Sie
werden nicht im Browser weggeblendet – sie kommen gar nicht erst an. Das gilt
auch für den Nebel: Was nie aufgedeckt wurde, verbirgt keine Figur mehr bloß
optisch.

Sichtweiten kommen aus `combat.senses` des verknüpften Charakterblatts, alle
in Fuß. Zwei Dinge, die auseinandergehalten gehören:

| Feld | Bedeutung |
| ---- | --------- |
| `sight` | Wie weit der Blick **überhaupt** reicht. `0` = unbegrenzt (bei Tageslicht sieht man bis zum Horizont). Wer etwas einträgt, bekommt ein Nebelfenster um seine Figur. |
| `darkvision`, `blindsight`, `tremorsense`, `truesight` | Was **ohne Licht** wahrgenommen wird; zählt nur in einer dunklen Szene. Das Weiteste gewinnt. |

Die Rechnung in einem Satz: **Sichtbar ist, was innerhalb der eigenen
Reichweite liegt und dort auch wahrzunehmen ist.** Wie weit die Reichweite
geht, hängt vom Licht ab:

    eigenesLicht = figur.lightBright + figur.lightDim
    wetter       = scene.sight            // 0 heißt: keine Grenze

    helle Szene : reichweite = min(senses.sight, wetter)
                  Scheibe(figur, reichweite)

    dunkle Szene: reichweite = min(max(senses.sight, eigenesLicht), wetter)
                  Scheibe(figur, min(dunkelsinne, reichweite))
                  ∪ { beleuchtete Felder innerhalb reichweite }

Zwei Stellen tragen die eigentliche Bedeutung:

**`max(senses.sight, eigenesLicht)`** – im Dunkeln trägt die eigene Fackel den
Blick über die eingetragene Sichtweite hinaus. Wer sich im Finstern ein Licht
anzündet, sieht damit auch weiter; das ist der ganze Zweck einer Fackel. Das
`wetter` deckelt trotzdem: Nebel bleibt Nebel, auch mit Laterne.

**`∪ … innerhalb reichweite`** – fremdes Licht kann innerhalb der eigenen
Reichweite etwas sichtbar machen, aber es kann das Fenster nicht *aufziehen*.
Die Fackel am anderen Kartenrand geht dich nichts an; sonst wanderte der
offene Bereich, ohne dass die eigene Figur einen Schritt getan hätte.

Ist nichts eingetragen und die Szene hell, gibt es keine Grenze und
`sichtBits` bleibt `null`: eine Szene ohne Sichtweiten bleibt, wie sie war.

Radien werden auf Feldmittelpunkten euklidisch ausgelegt, wie die Regeln einen
Radius auf dem Raster meinen.

Zwei bewusste Grenzen: **keine Wände** (Licht und Blick gehen hindurch – der
von Hand gemalte Nebel bleibt das Werkzeug dagegen) und **kein Unterschied
zwischen hell und dämmrig** (wer in Dämmerung steht, sieht; er würfelt nur mit
Nachteil, und das ist eine Regel für den Wurf).

### /api/maps   (ganz [SL])

    GET    /api/maps                  Bibliothek, alphabetisch, je Karte `szenen`
    POST   /api/maps                  { name, mediaId?, thumbMediaId?, width, height, gridSize? }
    PUT    /api/maps/:id              { name?, tags?, notes?, gridSize?, gridOffsetX?, gridOffsetY? }
    DELETE /api/maps/:id
    POST   /api/maps/:id/auflegen     { frisch?, name?, fogEnabled? } -> { sceneId, name, neu }

Die Bibliothek ist Vorbereitungsmaterial und deshalb ganz hinter dem Schirm:
Jeder Zweig antwortet einem Spielerkonto mit `403`. Eine Karte trägt ihre
Rasterausrichtung selbst; jede Szene, die aus ihr entsteht, erbt sie.

`auflegen` bringt die Karte auf den Tisch. Gibt es aus ihr schon eine Szene,
wird diese samt Nebel wieder aktiviert (`neu: false`, `200`); `frisch: true`
erzwingt eine neue Szene (`neu: true`, `201`). Ein Bild, das noch von einer
Szene, Figur oder einem Bestiarium-Eintrag gebraucht wird, überlebt das Löschen
seiner Karte.

### /api/ambience   (Bibliothek [SL], `aktiv` für alle)

    GET    /api/ambience/aktiv         was gerade aufliegt (auch für die Runde)
    GET    /api/ambience               [SL] die Sammlung
    POST   /api/ambience               [SL] { name, uri|link, tags?, notes? }
    PUT    /api/ambience/:id           [SL]
    DELETE /api/ambience/:id           [SL]
    POST   /api/ambience/:id/auflegen  [SL]
    POST   /api/ambience/stille        [SL]

Hier liegen Spotify-Links, sonst nichts. Der Server spielt nichts ab und kennt
kein Spotify-Konto; er sagt der Runde nur, was gerade dran ist:

```json
{ "ambienceId": "…", "uri": "spotify:playlist:…",
  "webUrl": "https://open.spotify.com/playlist/…", "kind": "playlist",
  "name": "Schankraum am Abend", "notes": "…",
  "seit": "2026-09-04T19:12:00.000Z" }
```

`uri` wird beim Anlegen aus dem Teilen-Link normalisiert (Sprachkürzel und
`?si=…` fallen weg) und auf `playlist`, `album`, `track` oder `artist` mit
22-stelliger Kennung geprüft – alles andere wird mit `keine_spotify_adresse`
abgewiesen. Das ist keine Kosmetik: `webUrl` wird der Runde als Verweis
vorgelegt, und der soll nirgendwo anders hinführen als zu Spotify.

Jede Änderung geht als `klang` über den Live-Kanal an alle Fenster. Abgespielt
wird in Spotify selbst, auf dem Gerät des jeweiligen Zuhörers – das braucht
weder Premium noch eine verschlüsselte Adresse unter eigenem Namen.

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
const { karten } = useKarten();      // leer, solange die Rolle nicht stimmt
const { klang } = useKlang();       // was gerade über dem Tisch liegt
```

Wer die Oberfläche neu gestaltet, wirft `pages/` und `components/` weg und
behält alles darunter. Wer sie in einer anderen Technik nachbaut, hält sich an
dieses Papier und weist mit `npm run vertrag` nach, dass der Unterbau steht.
