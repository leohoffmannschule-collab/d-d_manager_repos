# Verzeichnis der Wege

> Dieses Kapitel schreibt `npm run handbuch` aus dem Code (scripts/handbuch/referenz/).
> Änderungen gehören in den Code und seine Kommentare, nicht hierher.

Alle 123 Wege der Schnittstelle, nach Bereichen, in der Reihenfolge, in der Express sie prüft. „Wer darf“ setzt sich aus den Wächtern zusammen, die davor stehen: *angemeldet* (requireAuth), *Kampagne gewählt* (requireCampaign – schließt die Anmeldung ein) und *Spielleitung* (requireDm).

Die Beschreibung jedes Weges ist der Kommentar, der im Code über ihm steht. Beispiele für Anfragen und Antworten stehen im Kapitel über die Schnittstelle.

## /api/media

| Methode | Pfad | Wer darf | Was |
|---|---|---|---|
| POST | `/api/media` | angemeldet | Ein Bild ablegen – eine Karte, ein Bildnis, das Bild einer Figur. |
| GET | `/api/media/:id` | angemeldet | Bilder gehören der Runde, nicht einer Kampagne: Dieselbe Karte soll in jeder Geschichte aufliegen können, ohne ein zweites Mal hochgeladen zu werden. |
| DELETE | `/api/media/:id` | Spielleitung | ein Bild samt Datei löschen. |

### POST /api/media

*backend/src/routes/media.js, Zeile 50 · angemeldet*

POST /api/media  { dataUrl, filename }

Ein Bild ablegen – eine Karte, ein Bildnis, das Bild einer Figur. Es kommt
als data:-URL, wird als Datei neben die Datenbank gelegt (data/medien/) und
bekommt eine Kennung, unter der GET es wieder ausliefert. Erlaubt sind nur
die Bildformate oben, und höchstens MAX_BYTES.

### GET /api/media/:id

*backend/src/routes/media.js, Zeile 90 · angemeldet*

GET /api/media/:id

Bilder gehören der Runde, nicht einer Kampagne: Dieselbe Karte soll in jeder
Geschichte aufliegen können, ohne ein zweites Mal hochgeladen zu werden.
Zu sehen bekommt sie ohnehin nur, wer angemeldet ist *und* die Kennung
kennt – und die steht nur in einer Szene, die die Spielleitung aufgelegt hat.

### DELETE /api/media/:id

*backend/src/routes/media.js, Zeile 130 · Spielleitung*

DELETE /api/media/:id – ein Bild samt Datei löschen. Wer es noch zeigt (eine
Szene, eine Figur), zeigt danach ins Leere; die Kartenbibliothek räumt
deshalb über `bildFreigeben` nur ab, was niemand mehr braucht.

## /api/health

| Methode | Pfad | Wer darf | Was |
|---|---|---|---|
| GET | `/api/health` | jeder | Lebenszeichen – auch für den Healthcheck des Containers. |

### GET /api/health

*backend/src/server.js, Zeile 103 · jeder*

Lebenszeichen – auch für den Healthcheck des Containers.

Die Datenbank wird dabei wirklich angefasst. Ein Server, der noch antwortet,
aber nicht mehr an seine Daten kommt (volle Karte, kaputtes Dateisystem),
soll nicht als gesund durchgehen: Docker startet ihn dann neu, statt eine
stille Ruine am Laufen zu halten.

## /api/stream

| Methode | Pfad | Wer darf | Was |
|---|---|---|---|
| GET | `/api/stream` | angemeldet, Kampagne gewählt | Der Live-Kanal. |

### GET /api/stream

*backend/src/server.js, Zeile 116 · angemeldet, Kampagne gewählt*

Der Live-Kanal. Alle offenen Fenster hängen hier und bekommen Änderungen
an Kampf, Spieltisch, Würfen und Charakteren zugeschickt.

## /api/anwesenheit

| Methode | Pfad | Wer darf | Was |
|---|---|---|---|
| GET | `/api/anwesenheit` | angemeldet, Kampagne gewählt | wer gerade mit einem offenen Fenster in dieser Kampagne sitzt (für den Punkt neben dem Namen und die Auswahl beim Flüstern). |

### GET /api/anwesenheit

*backend/src/server.js, Zeile 125 · angemeldet, Kampagne gewählt*

GET /api/anwesenheit – wer gerade mit einem offenen Fenster in dieser Kampagne sitzt
(für den Punkt neben dem Namen und die Auswahl beim Flüstern).

## /api/ambience

| Methode | Pfad | Wer darf | Was |
|---|---|---|---|
| GET | `/api/ambience/aktiv` | angemeldet, Kampagne gewählt | die ganze Runde darf wissen, was dran ist. |
| GET | `/api/ambience` | Spielleitung, Kampagne gewählt | die Sammlung ist Vorbereitung und bleibt beim DM. |
| POST | `/api/ambience` | Spielleitung, Kampagne gewählt | Einen Spotify-Link in die Klangbibliothek legen. |
| PUT | `/api/ambience/:id` | Spielleitung, Kampagne gewählt | umbenennen, neu verschlagworten oder auf einen anderen Link zeigen lassen. |
| DELETE | `/api/ambience/:id` | Spielleitung, Kampagne gewählt | aus der Bibliothek nehmen. |
| POST | `/api/ambience/:id/auflegen` | Spielleitung, Kampagne gewählt | diese Ambiente für die ganze Runde auflegen. |
| POST | `/api/ambience/steuerung` | Spielleitung, Kampagne gewählt | Der Taktstock der Spielleitung: anhalten, weiterlaufen lassen, oder alle wieder auf dieselbe Stelle ziehen. |
| POST | `/api/ambience/stille` | Spielleitung, Kampagne gewählt | nichts liegt mehr auf. |

### GET /api/ambience/aktiv

*backend/src/routes/ambience.js, Zeile 45 · angemeldet, Kampagne gewählt*

GET /api/ambience/aktiv – die ganze Runde darf wissen, was dran ist.

### GET /api/ambience

*backend/src/routes/ambience.js, Zeile 50 · Spielleitung, Kampagne gewählt*

GET /api/ambience – die Sammlung ist Vorbereitung und bleibt beim DM.

### POST /api/ambience

*backend/src/routes/ambience.js, Zeile 60 · Spielleitung, Kampagne gewählt*

POST /api/ambience  { name, link, tags?, notes? }

Einen Spotify-Link in die Klangbibliothek legen. Angenommen wird jede
Schreibweise, die Spotify selbst herausgibt – geteilter Link, Adresse aus
dem Browser, spotify:-Kennung –, gespeichert wird immer die Kennung.
Und nur die: Kein Stück, keine Datei, kein Konto – siehe den Kopf dieser Datei.

### PUT /api/ambience/:id

*backend/src/routes/ambience.js, Zeile 91 · Spielleitung, Kampagne gewählt*

PUT /api/ambience/:id – umbenennen, neu verschlagworten oder auf einen
anderen Link zeigen lassen. Nur, was mitgeschickt wird, ändert sich.

### DELETE /api/ambience/:id

*backend/src/routes/ambience.js, Zeile 134 · Spielleitung, Kampagne gewählt*

DELETE /api/ambience/:id – aus der Bibliothek nehmen. Karten, die diese
Ambiente mitbrachten, bringen danach keine mehr mit.

### POST /api/ambience/:id/auflegen

*backend/src/routes/ambience.js, Zeile 148 · Spielleitung, Kampagne gewählt*

POST /api/ambience/:id/auflegen – diese Ambiente für die ganze Runde
auflegen. Sie beginnt am Anfang und läuft; jedes Fenster bekommt sie über
den Live-Kanal (`klang`) und spielt sie im eigenen Spotify-Rahmen ab.

### POST /api/ambience/steuerung

*backend/src/routes/ambience.js, Zeile 167 · Spielleitung, Kampagne gewählt*

POST /api/ambience/steuerung  { spielt, position }

Der Taktstock der Spielleitung: anhalten, weiterlaufen lassen, oder alle
wieder auf dieselbe Stelle ziehen.

`position` kommt aus dem Fenster der Spielleitung – dort weiß der
Spotify-Spieler, wo er gerade steht. Der Server glaubt es ihr und
vermerkt nur, *wann* sie es gesagt hat; daraus rechnet jedes andere
Fenster seine eigene Stelle aus.

Liegt nichts auf, gibt es auch nichts zu steuern.

### POST /api/ambience/stille

*backend/src/routes/ambience.js, Zeile 182 · Spielleitung, Kampagne gewählt*

POST /api/ambience/stille – nichts liegt mehr auf.

## /api/auth

| Methode | Pfad | Wer darf | Was |
|---|---|---|---|
| GET | `/api/auth/status` | jeder | wer bin ich, und muss der Almanach erst eingerichtet werden? |
| POST | `/api/auth/register` | jeder | Das erste Konto wird Spielleitung, jedes weitere braucht eine Einladung. |
| POST | `/api/auth/login` | jeder | anmelden. |
| POST | `/api/auth/logout` | jeder | diese eine Anmeldung beenden (andere Geräte bleiben angemeldet) und ihre offenen Live-Kanäle schließen. |
| POST | `/api/auth/password` | angemeldet | eigenes Passwort ändern Nach dem Wechsel sind alle anderen Anmeldungen dieses Kontos beendet – wer das Kennwort ändert, tut das oft, weil ein fremdes Gerät es kennt. |
| GET | `/api/auth/users` | Spielleitung | alle Konten der Runde samt Rolle, Farbe und Zahl der Blätter; die Spielleitung zuerst. |
| PATCH | `/api/auth/users/:id` | Spielleitung | Erst wird *alles* geprüft, dann *alles* geschrieben. |
| DELETE | `/api/auth/users/:id` | Spielleitung | ein Konto entfernen. |
| GET | `/api/auth/invites` | Spielleitung | alle Einladungscodes, neueste zuerst, mit dem Namen dessen, der einen eingelöst hat. |
| POST | `/api/auth/invites` | Spielleitung | einen neuen Code erzeugen. |
| DELETE | `/api/auth/invites/:code` | Spielleitung | einen Code zurückziehen. |

### GET /api/auth/status

*backend/src/routes/konten/anmeldung.js, Zeile 35 · jeder*

GET /api/auth/status – wer bin ich, und muss der Almanach erst eingerichtet werden?

### POST /api/auth/register

*backend/src/routes/konten/anmeldung.js, Zeile 54 · jeder*

POST /api/auth/register { name, password, invite? }

Das erste Konto wird Spielleitung, jedes weitere braucht eine Einladung.

Die Reihenfolge ist wichtig. Zuerst wird – asynchron, also mit Pause –
das Kennwort gehasht. *Danach* kommt alles, was prüft und schreibt, in
einem synchronen Block ohne jede Pause dazwischen. Andersherum könnten
zwei gleichzeitige Anmeldungen beide „Einladung noch frei“ oder beide
„noch kein Konto da, ich werde Spielleitung“ lesen, bevor die jeweils
andere geschrieben hat.

### POST /api/auth/login

*backend/src/routes/konten/anmeldung.js, Zeile 107 · jeder*

POST /api/auth/login  { name, password } – anmelden. Bei Erfolg setzt der
Server das Anmelde-Cookie; die Antwort enthält nur das Konto. Nach acht
Fehlversuchen je Absender und Name ist für zehn Minuten Schluss (429).

### POST /api/auth/logout

*backend/src/routes/konten/anmeldung.js, Zeile 139 · jeder*

POST /api/auth/logout – diese eine Anmeldung beenden (andere Geräte bleiben
angemeldet) und ihre offenen Live-Kanäle schließen.

### POST /api/auth/password

*backend/src/routes/konten/anmeldung.js, Zeile 148 · angemeldet*

POST /api/auth/password – eigenes Passwort ändern
Nach dem Wechsel sind alle anderen Anmeldungen dieses Kontos beendet –
wer das Kennwort ändert, tut das oft, weil ein fremdes Gerät es kennt.

### GET /api/auth/users

*backend/src/routes/konten/verwaltung.js, Zeile 20 · Spielleitung*

GET /api/auth/users – alle Konten der Runde samt Rolle, Farbe und Zahl der
Blätter; die Spielleitung zuerst. Kennwort-Hashes verlassen den Server nie.

### PATCH /api/auth/users/:id

*backend/src/routes/konten/verwaltung.js, Zeile 38 · Spielleitung*

PATCH /api/auth/users/:id { role?, color?, password? }

Erst wird *alles* geprüft, dann *alles* geschrieben. Andersherum stünde
nach „neue Rolle, aber zu kurzes Kennwort“ die Rolle schon geändert da,
während die Antwort „400, nichts passiert“ behauptet.

### DELETE /api/auth/users/:id

*backend/src/routes/konten/verwaltung.js, Zeile 79 · Spielleitung*

DELETE /api/auth/users/:id – ein Konto entfernen. Das eigene nicht, und nie
die letzte Spielleitung. Die Blätter des Kontos bleiben und gehen an die
Spielleitung, die löscht.

### GET /api/auth/invites

*backend/src/routes/konten/einladungen.js, Zeile 19 · Spielleitung*

GET /api/auth/invites – alle Einladungscodes, neueste zuerst, mit dem Namen
dessen, der einen eingelöst hat.

### POST /api/auth/invites

*backend/src/routes/konten/einladungen.js, Zeile 33 · Spielleitung*

POST /api/auth/invites  { note? } – einen neuen Code erzeugen. Die Notiz
(„für Mara“) hilft nur der Spielleitung beim Zuordnen.

### DELETE /api/auth/invites/:code

*backend/src/routes/konten/einladungen.js, Zeile 43 · Spielleitung*

DELETE /api/auth/invites/:code – einen Code zurückziehen. Groß- und
Kleinschreibung spielen keine Rolle, die Codes sind immer groß.

## /api/campaigns

| Methode | Pfad | Wer darf | Was |
|---|---|---|---|
| GET | `/api/campaigns` | angemeldet | die eigenen Kampagnen, dazu welche gerade aktiv ist. |
| POST | `/api/campaigns` | Spielleitung | neue Kampagne, wer sie anlegt, ist gleich dabei. |
| POST | `/api/campaigns/:id/aktiv` | angemeldet | in diese Kampagne wechseln. |
| PATCH | `/api/campaigns/:id` | angemeldet | Umbenennen. |
| GET | `/api/campaigns/:id/mitglieder` | Spielleitung | wer in dieser Kampagne mitspielt, die Spielleitung zuerst. |
| POST | `/api/campaigns/:id/mitglieder` | Spielleitung | ein Konto in diese Kampagne aufnehmen. |
| DELETE | `/api/campaigns/:id/mitglieder/:userId` | Spielleitung | ein Konto aus der Kampagne nehmen. |
| GET | `/api/campaigns/umfang` | Spielleitung, Kampagne gewählt | was liegt in dieser Kampagne? |
| POST | `/api/campaigns/uebernehmen` | Spielleitung, Kampagne gewählt | Die ganze Kampagne – oder das Gewählte davon – in eine andere kopieren. |
| DELETE | `/api/campaigns/:id` | angemeldet | In den Papierkorb, nicht ins Nichts: Die Kampagne verschwindet aus allen Listen, ihre Daten bleiben die Frist über liegen (siehe kampagnen.js). |
| GET | `/api/campaigns/papierkorb` | angemeldet | was man selbst weggeräumt hat, samt Restfrist. |
| POST | `/api/campaigns/:id/wiederherstellen` | angemeldet | eine Kampagne aus dem Papierkorb zurückholen, solange die Frist läuft. |
| DELETE | `/api/campaigns/:id/endgueltig` | angemeldet | Jetzt und ohne Wiederkehr: Charaktere, Chronik, Szenen, Begegnungen und Beute dieser Kampagne sind danach fort. |

### GET /api/campaigns

*backend/src/routes/kampagnen/liste.js, Zeile 18 · angemeldet*

GET /api/campaigns – die eigenen Kampagnen, dazu welche gerade aktiv ist.

### POST /api/campaigns

*backend/src/routes/kampagnen/liste.js, Zeile 43 · Spielleitung*

POST /api/campaigns { name } – neue Kampagne, wer sie anlegt, ist gleich dabei.

### POST /api/campaigns/:id/aktiv

*backend/src/routes/kampagnen/liste.js, Zeile 74 · angemeldet*

POST /api/campaigns/:id/aktiv – in diese Kampagne wechseln.

Dieselbe Prüfung wie requireCampaign: Eine Kampagne im Papierkorb zählt
nicht. Sonst ließe sie sich hier wählen, und jeder folgende Weg wiese die
Sitzung mit 409 zurück in die Auswahl – ein Kreis ohne Ausgang.

### PATCH /api/campaigns/:id

*backend/src/routes/kampagnen/liste.js, Zeile 93 · angemeldet*

PATCH /api/campaigns/:id  { name }

Umbenennen. Harmloser als alles andere hier: Der Name hängt an nichts –
Charaktere, Szenen und Beute zeigen auf die Kennung der Kampagne, nie auf
ihren Namen. Es gibt deshalb auch nichts nachzuziehen.

Bestimmen darf trotzdem nur, wer die Kampagne angelegt hat: Es ist ihr
Name, und in den Listen der Mitspieler steht er ebenfalls.

### GET /api/campaigns/:id/mitglieder

*backend/src/routes/kampagnen/mitglieder.js, Zeile 18 · Spielleitung*

GET /api/campaigns/:id/mitglieder – wer in dieser Kampagne mitspielt, die
Spielleitung zuerst.

### POST /api/campaigns/:id/mitglieder

*backend/src/routes/kampagnen/mitglieder.js, Zeile 36 · Spielleitung*

POST /api/campaigns/:id/mitglieder  { userId } – ein Konto in diese Kampagne
aufnehmen. Wer schon dabei ist, bleibt einfach dabei.

### DELETE /api/campaigns/:id/mitglieder/:userId

*backend/src/routes/kampagnen/mitglieder.js, Zeile 53 · Spielleitung*

DELETE /api/campaigns/:id/mitglieder/:userId – ein Konto aus der Kampagne
nehmen. Die Blätter bleiben liegen; wer gerade in ihr saß, landet wieder in
der Kampagnenauswahl.

### GET /api/campaigns/umfang

*backend/src/routes/kampagnen/umzug.js, Zeile 21 · Spielleitung, Kampagne gewählt*

GET /api/campaigns/umfang – was liegt in dieser Kampagne?

Bevor jemand „alles übernehmen“ anklickt, soll dastehen, was „alles“ heißt.

### POST /api/campaigns/uebernehmen

*backend/src/routes/kampagnen/umzug.js, Zeile 42 · Spielleitung, Kampagne gewählt*

POST /api/campaigns/uebernehmen  { campaignId, arten: [...] }

Die ganze Kampagne – oder das Gewählte davon – in eine andere kopieren.
Gedacht für den Umzug einer laufenden Runde in eine neue Geschichte: die
Helden mitnehmen, die Hausregeln mitnehmen, die Karten stehen ohnehin
bereit.

Kopiert wird, nicht verschoben, und es wird nicht abgeglichen: Zweimal
ausgeführt steht drüben alles zweimal. Entweder es geht ganz durch oder
gar nicht – eine halb umgezogene Kampagne wäre schlimmer als keine.

### DELETE /api/campaigns/:id

*backend/src/routes/kampagnen/papierkorb.js, Zeile 25 · angemeldet*

DELETE /api/campaigns/:id  { name }

In den Papierkorb, nicht ins Nichts: Die Kampagne verschwindet aus allen
Listen, ihre Daten bleiben die Frist über liegen (siehe kampagnen.js).
Verlangt wird der abgetippte Name – ein Fehlgriff im Menü soll keine
Kampagne kosten.

### GET /api/campaigns/papierkorb

*backend/src/routes/kampagnen/papierkorb.js, Zeile 54 · angemeldet*

GET /api/campaigns/papierkorb – was man selbst weggeräumt hat, samt Restfrist.

### POST /api/campaigns/:id/wiederherstellen

*backend/src/routes/kampagnen/papierkorb.js, Zeile 66 · angemeldet*

POST /api/campaigns/:id/wiederherstellen – eine Kampagne aus dem Papierkorb
zurückholen, solange die Frist läuft. Das darf nur, wer sie angelegt hat.

### DELETE /api/campaigns/:id/endgueltig

*backend/src/routes/kampagnen/papierkorb.js, Zeile 86 · angemeldet*

DELETE /api/campaigns/:id/endgueltig  { name }

Jetzt und ohne Wiederkehr: Charaktere, Chronik, Szenen, Begegnungen und
Beute dieser Kampagne sind danach fort. Die Kartenbibliothek bleibt – sie
gehört der Runde, nicht der einzelnen Geschichte. Auch hier muss der Name
abgetippt werden, und liegen muss sie ohnehin schon im Papierkorb.

## /api/characters

| Methode | Pfad | Wer darf | Was |
|---|---|---|---|
| GET | `/api/characters` | angemeldet, Kampagne gewählt | eigene Charaktere, dazu die geteilten der Mitspieler |
| GET | `/api/characters/:id` | angemeldet, Kampagne gewählt | ein Blatt vollständig, samt `editable`: ob der Fragende es ändern darf (eigenes Blatt oder Spielleitung). |
| GET | `/api/characters/verwaltung/alle` | Spielleitung, Kampagne gewählt | alle Blätter der Kampagne für die Verwaltung, NSC eingeschlossen. |
| POST | `/api/characters` | angemeldet, Kampagne gewählt | create |
| PUT | `/api/characters/:id` | angemeldet, Kampagne gewählt | full update (autosave from the sheet editor) |
| PATCH | `/api/characters/:id` | angemeldet, Kampagne gewählt | Besitz und Sichtbarkeit |
| DELETE | `/api/characters/:id` | angemeldet, Kampagne gewählt | ein Blatt löschen. |
| POST | `/api/characters/:id/duplicate` | angemeldet, Kampagne gewählt | eine Abschrift in derselben Kampagne, die dem Fragenden gehört. |
| POST | `/api/characters/:id/kopieren` | Spielleitung, Kampagne gewählt | Dasselbe Blatt in einer anderen Kampagne – etwa, wenn die Runde dieselben Helden in einer neuen Geschichte weiterspielt oder ein NSC ein zweites Mal gebraucht wird. |

### GET /api/characters

*backend/src/routes/charaktere/lesen.js, Zeile 16 · angemeldet, Kampagne gewählt*

GET /api/characters – eigene Charaktere, dazu die geteilten der Mitspieler

### GET /api/characters/:id

*backend/src/routes/charaktere/lesen.js, Zeile 30 · angemeldet, Kampagne gewählt*

GET /api/characters/:id – ein Blatt vollständig, samt `editable`: ob der
Fragende es ändern darf (eigenes Blatt oder Spielleitung). Fremde, nicht
geteilte Blätter und NSC-Blätter bekommt die Runde nicht (403).

### GET /api/characters/verwaltung/alle

*backend/src/routes/charaktere/lesen.js, Zeile 40 · Spielleitung, Kampagne gewählt*

GET /api/characters/verwaltung/alle – alle Blätter der Kampagne für die
Verwaltung, NSC eingeschlossen. Zwei Pfadteile, damit es sich nie mit
`GET /:id` überschneidet.

### POST /api/characters

*backend/src/routes/charaktere/schreiben.js, Zeile 23 · angemeldet, Kampagne gewählt*

POST /api/characters – create

### PUT /api/characters/:id

*backend/src/routes/charaktere/schreiben.js, Zeile 42 · angemeldet, Kampagne gewählt*

PUT /api/characters/:id – full update (autosave from the sheet editor)

### PATCH /api/characters/:id

*backend/src/routes/charaktere/schreiben.js, Zeile 94 · angemeldet, Kampagne gewählt*

PATCH /api/characters/:id – Besitz und Sichtbarkeit

### DELETE /api/characters/:id

*backend/src/routes/charaktere/schreiben.js, Zeile 136 · angemeldet, Kampagne gewählt*

DELETE /api/characters/:id – ein Blatt löschen. Das darf, wem es gehört,
und die Spielleitung; Figuren auf dem Tisch verlieren dabei nur ihren
Verweis darauf.

### POST /api/characters/:id/duplicate

*backend/src/routes/charaktere/abschriften.js, Zeile 20 · angemeldet, Kampagne gewählt*

POST /api/characters/:id/duplicate – eine Abschrift in derselben Kampagne,
die dem Fragenden gehört. So kommt eine Vorlage vom Schirm auf den Tisch.

### POST /api/characters/:id/kopieren

*backend/src/routes/charaktere/abschriften.js, Zeile 51 · Spielleitung, Kampagne gewählt*

POST /api/characters/:id/kopieren  { campaignId }

Dasselbe Blatt in einer anderen Kampagne – etwa, wenn die Runde dieselben
Helden in einer neuen Geschichte weiterspielt oder ein NSC ein zweites Mal
gebraucht wird. Kopiert wird, nicht verschoben: Das Blatt hier bleibt, wo
es ist, und beide gehen fortan getrennte Wege.

## /api/chat

| Methode | Pfad | Wer darf | Was |
|---|---|---|---|
| GET | `/api/chat` | angemeldet, Kampagne gewählt | der Verlauf, jüngste zuerst |
| POST | `/api/chat` | angemeldet, Kampagne gewählt | etwas sagen; mit `an` wird geflüstert |
| GET | `/api/chat/wer` | angemeldet, Kampagne gewählt | an wen sich flüstern lässt |
| DELETE | `/api/chat` | Spielleitung, Kampagne gewählt | aufräumen, bevor die nächste Runde beginnt |

### GET /api/chat

*backend/src/routes/chat.js, Zeile 67 · angemeldet, Kampagne gewählt*

GET /api/chat – der Verlauf, jüngste zuerst

### POST /api/chat

*backend/src/routes/chat.js, Zeile 73 · angemeldet, Kampagne gewählt*

POST /api/chat – etwas sagen; mit `an` wird geflüstert

### GET /api/chat/wer

*backend/src/routes/chat.js, Zeile 141 · angemeldet, Kampagne gewählt*

GET /api/chat/wer – an wen sich flüstern lässt

### DELETE /api/chat

*backend/src/routes/chat.js, Zeile 159 · Spielleitung, Kampagne gewählt*

DELETE /api/chat – aufräumen, bevor die nächste Runde beginnt

## /api/compendium

| Methode | Pfad | Wer darf | Was |
|---|---|---|---|
| GET | `/api/compendium/…` | angemeldet | > der gleichnamige Pfad bei der API, zwischengespeichert |

### GET /api/compendium/…

*backend/src/routes/compendium.js, Zeile 75 · angemeldet*

GET /api/compendium/*  ->  der gleichnamige Pfad bei der API, zwischengespeichert

## /api/dice

| Methode | Pfad | Wer darf | Was |
|---|---|---|---|
| GET | `/api/dice/history` | angemeldet, Kampagne gewählt | verdeckte Würfe sieht nur die Spielleitung |
| POST | `/api/dice/roll` | angemeldet, Kampagne gewählt | Würfeln – auf dem Server, nicht im Browser: So kann niemand am eigenen Ergebnis drehen, und alle sehen denselben Wurf. |
| DELETE | `/api/dice/history` | Spielleitung, Kampagne gewählt | den Würfelverlauf dieser Kampagne leeren, etwa vor einem neuen Abend. |

### GET /api/dice/history

*backend/src/routes/dice.js, Zeile 45 · angemeldet, Kampagne gewählt*

GET /api/dice/history – verdeckte Würfe sieht nur die Spielleitung

### POST /api/dice/roll

*backend/src/routes/dice.js, Zeile 61 · angemeldet, Kampagne gewählt*

POST /api/dice/roll  { expression, mode?, label?, secret? }

Würfeln – auf dem Server, nicht im Browser: So kann niemand am eigenen
Ergebnis drehen, und alle sehen denselben Wurf. `mode` ist 'advantage'
oder 'disadvantage' für zwei W20, von denen der bessere oder schlechtere
zählt.

### DELETE /api/dice/history

*backend/src/routes/dice.js, Zeile 138 · Spielleitung, Kampagne gewählt*

DELETE /api/dice/history – den Würfelverlauf dieser Kampagne leeren, etwa
vor einem neuen Abend.

## /api/chronicle

| Methode | Pfad | Wer darf | Was |
|---|---|---|---|
| GET | `/api/chronicle/sessions` | angemeldet, Kampagne gewählt | alle Sitzungen dieser Kampagne, jüngste zuerst. |
| GET | `/api/chronicle/sessions/:id` | angemeldet, Kampagne gewählt | eine Sitzung samt Einträgen; verdeckte nur für die Spielleitung. |
| POST | `/api/chronicle/sessions` | Spielleitung, Kampagne gewählt | eine Sitzung beginnen. |
| POST | `/api/chronicle/sessions/:id/ende` | Spielleitung, Kampagne gewählt | Es läuft höchstens eine Sitzung je Kampagne. |
| PATCH | `/api/chronicle/sessions/:id` | Spielleitung, Kampagne gewählt | umbenennen. |
| DELETE | `/api/chronicle/sessions/:id` | Spielleitung, Kampagne gewählt | eine Sitzung samt allen Einträgen löschen (die Einträge hängen per Fremdschlüssel daran). |
| POST | `/api/chronicle/eintrag` | Spielleitung, Kampagne gewählt | Die Spielleitung kann von Hand nachtragen, was der Server nicht mitbekommt – eine gelungene List, ein Schwur, der Name des Wirts. |
| DELETE | `/api/chronicle/eintrag/:id` | Spielleitung, Kampagne gewählt | einen einzelnen Eintrag streichen. |
| GET | `/api/chronicle/sessions/:id/protokoll` | angemeldet, Kampagne gewählt | die Sitzung als Markdown zum Sichern oder Weitergeben. |
| GET | `/api/chronicle/ki` | angemeldet, Kampagne gewählt | ist ein Sprachmodell eingestellt? |
| POST | `/api/chronicle/sessions/:id/rueckblick` | Spielleitung, Kampagne gewählt | das Sprachmodell einen Rückblick auf die Sitzung schreiben lassen und ihn an der Sitzung speichern. |

### GET /api/chronicle/sessions

*backend/src/routes/chronik/sitzungen.js, Zeile 35 · angemeldet, Kampagne gewählt*

GET /api/chronicle/sessions – alle Sitzungen dieser Kampagne, jüngste zuerst.
Die Zahl der Einträge zählt für die Runde nur, was sie sehen darf.

### GET /api/chronicle/sessions/:id

*backend/src/routes/chronik/sitzungen.js, Zeile 42 · angemeldet, Kampagne gewählt*

GET /api/chronicle/sessions/:id – eine Sitzung samt Einträgen; verdeckte
nur für die Spielleitung.

### POST /api/chronicle/sessions

*backend/src/routes/chronik/sitzungen.js, Zeile 50 · Spielleitung, Kampagne gewählt*

POST /api/chronicle/sessions  { title? } – eine Sitzung beginnen. Läuft
schon eine, kommt diese zurück – es gibt nie zwei offene zugleich.

### POST /api/chronicle/sessions/:id/ende

*backend/src/routes/chronik/sitzungen.js, Zeile 57 · Spielleitung, Kampagne gewählt*

Es läuft höchstens eine Sitzung je Kampagne. Die Kennung im Pfad muss
trotzdem stimmen: Sonst beendete ein veraltetes Fenster, das eine längst
geschlossene Sitzung anzeigt, stillschweigend die gerade laufende.

### PATCH /api/chronicle/sessions/:id

*backend/src/routes/chronik/sitzungen.js, Zeile 66 · Spielleitung, Kampagne gewählt*

PATCH /api/chronicle/sessions/:id  { title } – umbenennen.

### DELETE /api/chronicle/sessions/:id

*backend/src/routes/chronik/sitzungen.js, Zeile 77 · Spielleitung, Kampagne gewählt*

DELETE /api/chronicle/sessions/:id – eine Sitzung samt allen Einträgen
löschen (die Einträge hängen per Fremdschlüssel daran).

### POST /api/chronicle/eintrag

*backend/src/routes/chronik/sitzungen.js, Zeile 86 · Spielleitung, Kampagne gewählt*

Die Spielleitung kann von Hand nachtragen, was der Server nicht mitbekommt –
eine gelungene List, ein Schwur, der Name des Wirts.

### DELETE /api/chronicle/eintrag/:id

*backend/src/routes/chronik/sitzungen.js, Zeile 102 · Spielleitung, Kampagne gewählt*

DELETE /api/chronicle/eintrag/:id – einen einzelnen Eintrag streichen.

### GET /api/chronicle/sessions/:id/protokoll

*backend/src/routes/chronik/protokoll.js, Zeile 65 · angemeldet, Kampagne gewählt*

GET /api/chronicle/sessions/:id/protokoll – die Sitzung als Markdown zum
Sichern oder Weitergeben. Jede und jeder bekommt die eigene Sicht: Die
Runde sieht keine verdeckten Einträge, auch nicht im Protokoll.

### GET /api/chronicle/ki

*backend/src/routes/chronik/rueckblick.js, Zeile 41 · angemeldet, Kampagne gewählt*

GET /api/chronicle/ki – ist ein Sprachmodell eingestellt? Die Oberfläche
zeigt den Knopf „Rückblick schreiben lassen“ nur, wenn ja.

### POST /api/chronicle/sessions/:id/rueckblick

*backend/src/routes/chronik/rueckblick.js, Zeile 49 · Spielleitung, Kampagne gewählt*

POST /api/chronicle/sessions/:id/rueckblick – das Sprachmodell einen
Rückblick auf die Sitzung schreiben lassen und ihn an der Sitzung speichern.
Geschickt wird nur, was die Runde sehen darf (siehe oben), und nur auf
Anfrage der Spielleitung – nie von selbst.

## /api/encounter

| Methode | Pfad | Wer darf | Was |
|---|---|---|---|
| GET | `/api/encounter` | angemeldet, Kampagne gewählt | der ganze Kampf, in der Sicht des Fragenden |
| POST | `/api/encounter/combatants` | Spielleitung, Kampagne gewählt | einen Kämpfer von Hand in den Kampf setzen. |
| PUT | `/api/encounter/combatants/:id` | Spielleitung, Kampagne gewählt | Werte eines Kämpfers ändern: Initiative, Zustände, verborgen oder nicht. |
| POST | `/api/encounter/combatants/:id/damage` | Spielleitung, Kampagne gewählt | negative Werte heilen |
| POST | `/api/encounter/combatants/:id/initiative` | angemeldet, Kampagne gewählt | Zu Beginn jedes Kampfes würfelt die ganze Runde. |
| DELETE | `/api/encounter/combatants/:id` | Spielleitung, Kampagne gewählt | einen Kämpfer aus dem Kampf nehmen. |
| POST | `/api/encounter/next-turn` | Spielleitung, Kampagne gewählt | und /prev-turn – der Nächste ist dran, oder zurück zum Vorigen. |
| POST | `/api/encounter/prev-turn` | Spielleitung, Kampagne gewählt | und /prev-turn – der Nächste ist dran, oder zurück zum Vorigen. |
| POST | `/api/encounter/reset` | Spielleitung, Kampagne gewählt | den Kampf beenden: alle Kämpfer weg, zurück auf Runde 1. |
| POST | `/api/encounter/roll-initiative` | Spielleitung, Kampagne gewählt | für alle NSC und Monster ohne Wert |
| POST | `/api/encounter/party` | Spielleitung, Kampagne gewählt | die Charaktere der Runde in den Kampf holen |

### GET /api/encounter

*backend/src/routes/encounter.js, Zeile 35 · angemeldet, Kampagne gewählt*

GET /api/encounter – der ganze Kampf, in der Sicht des Fragenden

### POST /api/encounter/combatants

*backend/src/routes/kampf/kaempfer.js, Zeile 27 · Spielleitung, Kampagne gewählt*

POST /api/encounter/combatants  { name, type?, initiative?, hp?, maxHp?, ac?,
conditions?, notes?, characterId?, hidden? } – einen Kämpfer von Hand in den
Kampf setzen. Meist kommen Kämpfer über „Runde holen“, das Bestiarium oder
eine vorbereitete Begegnung; dieser Weg ist für den Rest.

### PUT /api/encounter/combatants/:id

*backend/src/routes/kampf/kaempfer.js, Zeile 67 · Spielleitung, Kampagne gewählt*

PUT /api/encounter/combatants/:id – Werte eines Kämpfers ändern: Initiative,
Zustände, verborgen oder nicht. Trefferpunkte gehen besser über /damage,
das mit temporären TP und der Null richtig umgeht.

### POST /api/encounter/combatants/:id/damage

*backend/src/routes/kampf/kaempfer.js, Zeile 130 · Spielleitung, Kampagne gewählt*

POST /api/encounter/combatants/:id/damage – negative Werte heilen

### POST /api/encounter/combatants/:id/initiative

*backend/src/routes/kampf/kaempfer.js, Zeile 175 · angemeldet, Kampagne gewählt*

POST /api/encounter/combatants/:id/initiative  { value }

Zu Beginn jedes Kampfes würfelt die ganze Runde. Bisher musste die
Spielleitung fünf Zahlen abtippen – hier trägt jede und jeder den eigenen
Wurf selbst ein. Fremde Zeilen bleiben tabu.

### DELETE /api/encounter/combatants/:id

*backend/src/routes/kampf/kaempfer.js, Zeile 194 · Spielleitung, Kampagne gewählt*

DELETE /api/encounter/combatants/:id – einen Kämpfer aus dem Kampf nehmen.
War er gerade dran, ist es danach der, der in der Reihenfolge an seine
Stelle rückt.

### POST /api/encounter/next-turn

*backend/src/routes/kampf/ablauf.js, Zeile 65 · Spielleitung, Kampagne gewählt*

POST /api/encounter/next-turn und /prev-turn – der Nächste ist dran, oder
zurück zum Vorigen. Über das Ende der Liste hinaus beginnt eine neue Runde
(und die Chronik vermerkt sie); rückwärts geht es nie unter Runde 1.

### POST /api/encounter/prev-turn

*backend/src/routes/kampf/ablauf.js, Zeile 66 · Spielleitung, Kampagne gewählt*

POST /api/encounter/next-turn und /prev-turn – der Nächste ist dran, oder
zurück zum Vorigen. Über das Ende der Liste hinaus beginnt eine neue Runde
(und die Chronik vermerkt sie); rückwärts geht es nie unter Runde 1.

### POST /api/encounter/reset

*backend/src/routes/kampf/ablauf.js, Zeile 70 · Spielleitung, Kampagne gewählt*

POST /api/encounter/reset – den Kampf beenden: alle Kämpfer weg, zurück auf
Runde 1. Die Chronik vermerkt, wie viele Runden es waren.

### POST /api/encounter/roll-initiative

*backend/src/routes/kampf/ablauf.js, Zeile 89 · Spielleitung, Kampagne gewählt*

POST /api/encounter/roll-initiative – für alle NSC und Monster ohne Wert

### POST /api/encounter/party

*backend/src/routes/kampf/ablauf.js, Zeile 102 · Spielleitung, Kampagne gewählt*

POST /api/encounter/party – die Charaktere der Runde in den Kampf holen

## /api/encounters

| Methode | Pfad | Wer darf | Was |
|---|---|---|---|
| GET | `/api/encounters` | Spielleitung, Kampagne gewählt | alle vorbereiteten Begegnungen, nach Namen. |
| POST | `/api/encounters` | Spielleitung, Kampagne gewählt | eine Begegnung anlegen. |
| PUT | `/api/encounters/:id` | Spielleitung, Kampagne gewählt | ändern; nur, was mitgeschickt wird. |
| DELETE | `/api/encounters/:id` | Spielleitung, Kampagne gewählt | löschen. |
| POST | `/api/encounters/:id/stellen` | Spielleitung, Kampagne gewählt | die ganze Begegnung in den Kampf setzen |
| POST | `/api/encounters/aus-kampf` | Spielleitung, Kampagne gewählt | den laufenden Kampf als Begegnung sichern |

### GET /api/encounters

*backend/src/routes/encounters.js, Zeile 62 · Spielleitung, Kampagne gewählt*

GET /api/encounters – alle vorbereiteten Begegnungen, nach Namen.
Sie gehören der ganzen Runde und stehen in jeder Kampagne bereit.

### POST /api/encounters

*backend/src/routes/encounters.js, Zeile 68 · Spielleitung, Kampagne gewählt*

POST /api/encounters  { name, notes?, entries } – eine Begegnung anlegen.
Jeder Posten trägt seine Werte selbst (siehe saubereEintraege oben).

### PUT /api/encounters/:id

*backend/src/routes/encounters.js, Zeile 86 · Spielleitung, Kampagne gewählt*

PUT /api/encounters/:id – ändern; nur, was mitgeschickt wird.

### DELETE /api/encounters/:id

*backend/src/routes/encounters.js, Zeile 101 · Spielleitung, Kampagne gewählt*

DELETE /api/encounters/:id – löschen. Ein laufender Kampf, der aus ihr
gestellt wurde, bleibt davon unberührt.

### POST /api/encounters/:id/stellen

*backend/src/routes/encounters.js, Zeile 108 · Spielleitung, Kampagne gewählt*

POST /api/encounters/:id/stellen – die ganze Begegnung in den Kampf setzen

### POST /api/encounters/aus-kampf

*backend/src/routes/encounters.js, Zeile 170 · Spielleitung, Kampagne gewählt*

POST /api/encounters/aus-kampf – den laufenden Kampf als Begegnung sichern

## /api/library

| Methode | Pfad | Wer darf | Was |
|---|---|---|---|
| GET | `/api/library` | Spielleitung, Kampagne gewählt | das Bestiarium: alle Statblöcke, nach Namen. |
| POST | `/api/library` | Spielleitung, Kampagne gewählt | einen Statblock von Hand anlegen. |
| PUT | `/api/library/:id` | Spielleitung, Kampagne gewählt | ändern; nur, was mitgeschickt wird. |
| DELETE | `/api/library/:id` | Spielleitung, Kampagne gewählt | löschen. |
| POST | `/api/library/:id/add-to-encounter` | Spielleitung, Kampagne gewählt | „3 Goblins“ mit einem Klick |
| POST | `/api/library/aus-kompendium` | Spielleitung, Kampagne gewählt | ein Monster aus dem Kompendium übernehmen. |

### GET /api/library

*backend/src/routes/library.js, Zeile 54 · Spielleitung, Kampagne gewählt*

GET /api/library – das Bestiarium: alle Statblöcke, nach Namen.

### POST /api/library

*backend/src/routes/library.js, Zeile 61 · Spielleitung, Kampagne gewählt*

POST /api/library – einen Statblock von Hand anlegen. Zahlen, die sich
nicht lesen lassen, bleiben leer statt 0 – ein Monster ohne bekannte RK
ist etwas anderes als eines mit RK 0.

### PUT /api/library/:id

*backend/src/routes/library.js, Zeile 93 · Spielleitung, Kampagne gewählt*

PUT /api/library/:id – ändern; nur, was mitgeschickt wird.

### DELETE /api/library/:id

*backend/src/routes/library.js, Zeile 121 · Spielleitung, Kampagne gewählt*

DELETE /api/library/:id – löschen. Vorbereitete Begegnungen behalten ihre
Werte, denn jeder Posten hat eine eigene Abschrift.

### POST /api/library/:id/add-to-encounter

*backend/src/routes/library.js, Zeile 128 · Spielleitung, Kampagne gewählt*

POST /api/library/:id/add-to-encounter – „3 Goblins“ mit einem Klick

### POST /api/library/aus-kompendium

*backend/src/routes/library.js, Zeile 184 · Spielleitung, Kampagne gewählt*

POST /api/library/aus-kompendium – ein Monster aus dem Kompendium übernehmen.

Der Rumpf ist ein Monster, wie es die 5e-API liefert (`hit_points`,
`armor_class`, `special_abilities` …). Übernommen wird eine Abschrift, kein
Verweis: Danach gehört der Statblock der Spielleitung und darf abweichen.

## /api/maps

| Methode | Pfad | Wer darf | Was |
|---|---|---|---|
| GET | `/api/maps` | Spielleitung, Kampagne gewählt | die Kartenbibliothek, nach Namen, und zu jeder Karte, wie viele Szenen in *dieser* Kampagne schon aus ihr entstanden sind. |
| POST | `/api/maps` | Spielleitung, Kampagne gewählt | eine Karte in die Bibliothek legen. |
| PUT | `/api/maps/:id` | Spielleitung, Kampagne gewählt | umbenennen, verschlagworten, Raster nachjustieren |
| DELETE | `/api/maps/:id` | Spielleitung, Kampagne gewählt | eine Karte aus der Bibliothek löschen. |
| POST | `/api/maps/:id/auflegen` | Spielleitung, Kampagne gewählt | Bringt die Karte auf den Tisch. |

### GET /api/maps

*backend/src/routes/maps.js, Zeile 90 · Spielleitung, Kampagne gewählt*

GET /api/maps – die Kartenbibliothek, nach Namen, und zu jeder Karte, wie
viele Szenen in *dieser* Kampagne schon aus ihr entstanden sind.

### POST /api/maps

*backend/src/routes/maps.js, Zeile 105 · Spielleitung, Kampagne gewählt*

POST /api/maps  { name, mediaId, thumbMediaId?, width, height, gridSize?, unit?,
scale?, tags?, notes? } – eine Karte in die Bibliothek legen. Das Bild ist
vorher über /api/media hochgeladen; hier steht nur der Verweis darauf.

### PUT /api/maps/:id

*backend/src/routes/maps.js, Zeile 134 · Spielleitung, Kampagne gewählt*

PUT /api/maps/:id – umbenennen, verschlagworten, Raster nachjustieren

### DELETE /api/maps/:id

*backend/src/routes/maps.js, Zeile 160 · Spielleitung, Kampagne gewählt*

DELETE /api/maps/:id – eine Karte aus der Bibliothek löschen. Szenen, die aus
ihr entstanden, bleiben; das Bild geht nur, wenn es niemand mehr braucht.

### POST /api/maps/:id/auflegen

*backend/src/routes/maps.js, Zeile 187 · Spielleitung, Kampagne gewählt*

POST /api/maps/:id/auflegen

Bringt die Karte auf den Tisch. Mit `verdeckt` hinter dem Vorhang, damit
die Spielleitung erst in Ruhe aufbauen kann. Gab es aus ihr schon eine Szene, kommt
diese zurück – samt Nebel, den die Runde sich erspielt hat. Wer wirklich
von vorn anfangen will, schickt `frisch: true`; sonst würde zweimaliges
Auflegen die Bibliothek mit halbaufgedeckten Zwillingen zumüllen.

Das Raster wandert in jedem Fall mit: einmal ausgerichtet, immer richtig.

## /api/notes

| Methode | Pfad | Wer darf | Was |
|---|---|---|---|
| GET | `/api/notes` | angemeldet, Kampagne gewählt | die Spielleitung bekommt alles, die Runde nur die ausgeteilten Handzettel (`visibility = 'runde'`). |
| POST | `/api/notes` | Spielleitung, Kampagne gewählt | eine Notiz anlegen; ohne Angabe bleibt sie hinter dem Schirm. |
| PUT | `/api/notes/:id` | Spielleitung, Kampagne gewählt | ändern, austeilen oder zurückziehen. |
| DELETE | `/api/notes/:id` | Spielleitung, Kampagne gewählt | löschen; war sie ausgeteilt, verschwindet sie auch bei der Runde. |
| POST | `/api/notes/:id/kopieren` | Spielleitung, Kampagne gewählt | Denselben Zettel in einer anderen Kampagne. |

### GET /api/notes

*backend/src/routes/notes.js, Zeile 58 · angemeldet, Kampagne gewählt*

GET /api/notes – die Spielleitung bekommt alles, die Runde nur die
ausgeteilten Handzettel (`visibility = 'runde'`).

### POST /api/notes

*backend/src/routes/notes.js, Zeile 70 · Spielleitung, Kampagne gewählt*

POST /api/notes  { title, content?, tags?, visibility? } – eine Notiz
anlegen; ohne Angabe bleibt sie hinter dem Schirm. Wird sie gleich
ausgeteilt, erfährt es die Runde sofort und die Chronik vermerkt es.

### PUT /api/notes/:id

*backend/src/routes/notes.js, Zeile 98 · Spielleitung, Kampagne gewählt*

PUT /api/notes/:id – ändern, austeilen oder zurückziehen.

### DELETE /api/notes/:id

*backend/src/routes/notes.js, Zeile 122 · Spielleitung, Kampagne gewählt*

DELETE /api/notes/:id – löschen; war sie ausgeteilt, verschwindet sie
auch bei der Runde.

### POST /api/notes/:id/kopieren

*backend/src/routes/notes.js, Zeile 138 · Spielleitung, Kampagne gewählt*

POST /api/notes/:id/kopieren  { campaignId }

Denselben Zettel in einer anderen Kampagne. Handzettel gehören zu einer
Geschichte – der Steckbrief aus der einen Stadt passt nicht von allein in
die andere –, aber manchmal eben doch: dieselbe Hausregel, derselbe
Götterkatalog, dieselbe Karte in Worten.

## /api/scenes

| Methode | Pfad | Wer darf | Was |
|---|---|---|---|
| GET | `/api/scenes` | angemeldet, Kampagne gewählt | die Spielleitung sieht alle, die Runde nur die aktive |
| GET | `/api/scenes/aktiv` | angemeldet, Kampagne gewählt | was gerade auf dem Tisch liegt |
| POST | `/api/scenes` | Spielleitung, Kampagne gewählt | Eine Szene anlegen, unter vollem Nebel. |
| PUT | `/api/scenes/:id` | Spielleitung, Kampagne gewählt | Raster, Nebel, Dunkelheit, Sichtweite, Maßstab. |
| DELETE | `/api/scenes/:id` | Spielleitung, Kampagne gewählt | eine Szene samt Figuren und Nebel löschen. |
| POST | `/api/scenes/:id/kopieren` | Spielleitung, Kampagne gewählt | Die Szene noch einmal in einer anderen Kampagne – samt Figuren und samt dem Nebel, so wie er gerade steht. |
| POST | `/api/scenes/:id/aktivieren` | Spielleitung, Kampagne gewählt | Szene auf den Tisch legen |
| POST | `/api/scenes/vorhang` | Spielleitung, Kampagne gewählt | Der Vorhang über dem Tisch. |
| POST | `/api/scenes/nsc-sicht` | Spielleitung, Kampagne gewählt | Die Spielleitung sieht das Brett standardmäßig ganz – sie muss ja wissen, was hinter dem Hügel steht. |
| POST | `/api/scenes/:id/nebel` | Spielleitung, Kampagne gewählt | Felder aufdecken oder wieder verhüllen – ein Pinselstrich der Spielleitung. |
| POST | `/api/scenes/:id/nebel/alles` | Spielleitung, Kampagne gewählt | die ganze Karte auf einmal aufdecken oder zudecken. |
| POST | `/api/scenes/:id/figuren` | Spielleitung, Kampagne gewählt | eine Figur auslegen. |
| PATCH | `/api/scenes/figuren/:id` | angemeldet, Kampagne gewählt | Bewegen darf auch, wem die Figur gehört |
| DELETE | `/api/scenes/figuren/:id` | Spielleitung, Kampagne gewählt | eine Figur vom Tisch nehmen. |
| POST | `/api/scenes/:id/figuren/aus-kampf` | Spielleitung, Kampagne gewählt | alle Kämpfer als Figuren auslegen |
| POST | `/api/scenes/ping` | angemeldet, Kampagne gewählt | ein kurzes Aufleuchten für alle, nichts wird gespeichert |

### GET /api/scenes

*backend/src/routes/spieltisch/szenen.js, Zeile 24 · angemeldet, Kampagne gewählt*

GET /api/scenes – die Spielleitung sieht alle, die Runde nur die aktive

### GET /api/scenes/aktiv

*backend/src/routes/spieltisch/szenen.js, Zeile 44 · angemeldet, Kampagne gewählt*

GET /api/scenes/aktiv – was gerade auf dem Tisch liegt

### POST /api/scenes

*backend/src/routes/spieltisch/szenen.js, Zeile 52 · Spielleitung, Kampagne gewählt*

POST /api/scenes  { name, mediaId?, width, height, gridSize?, unit?, scale? }

Eine Szene anlegen, unter vollem Nebel. Die erste Szene einer Kampagne
kommt gleich auf den Tisch; alle weiteren warten, bis sie aufgelegt werden.

### PUT /api/scenes/:id

*backend/src/routes/spieltisch/szenen.js, Zeile 84 · Spielleitung, Kampagne gewählt*

PUT /api/scenes/:id – Raster, Nebel, Dunkelheit, Sichtweite, Maßstab.
Alle Zahlen werden auf vernünftige Grenzen gestutzt (siehe werte.js,
`clamp`), damit ein Tippfehler keine Karte aus einer Million Feldern macht.

### DELETE /api/scenes/:id

*backend/src/routes/spieltisch/szenen.js, Zeile 116 · Spielleitung, Kampagne gewählt*

DELETE /api/scenes/:id – eine Szene samt Figuren und Nebel löschen. Lag
sie auf dem Tisch, rückt die jüngste andere nach.

### POST /api/scenes/:id/kopieren

*backend/src/routes/spieltisch/szenen.js, Zeile 144 · Spielleitung, Kampagne gewählt*

POST /api/scenes/:id/kopieren  { campaignId }

Die Szene noch einmal in einer anderen Kampagne – samt Figuren und samt
dem Nebel, so wie er gerade steht. Die Karte dahinter gehört ohnehin der
ganzen Runde und wird nicht zweimal abgelegt.

Figuren, die an einem Charakterblatt hängen, suchen drüben den Charakter
gleichen Namens. Wer also erst die Runde kopiert und dann die Szene,
bekommt seine Helden wieder auf die Karte; wer es umgekehrt tut, bekommt
Figuren ohne Blatt dahinter. Ein Kämpfer aus einem laufenden Kampf bleibt
in jedem Fall hier – Kämpfe reisen nicht mit.

### POST /api/scenes/:id/aktivieren

*backend/src/routes/spieltisch/szenen.js, Zeile 156 · Spielleitung, Kampagne gewählt*

POST /api/scenes/:id/aktivieren – Szene auf den Tisch legen

### POST /api/scenes/vorhang

*backend/src/routes/spieltisch/szenen.js, Zeile 173 · Spielleitung, Kampagne gewählt*

POST /api/scenes/vorhang  { zu: true|false }

Der Vorhang über dem Tisch. Zu heißt: Die Runde bekommt keine Szene mehr,
und zwar wirklich keine – der Server schickt nichts, statt im Browser etwas
zu verdecken. Auf heißt: Bühne frei.

Kampfliste, Beute und Handzettel laufen daneben weiter. Verdeckt wird der
Tisch, nicht der ganze Abend.

### POST /api/scenes/nsc-sicht

*backend/src/routes/spieltisch/szenen.js, Zeile 207 · Spielleitung, Kampagne gewählt*

POST /api/scenes/nsc-sicht  { tokenId }

Die Spielleitung sieht das Brett standardmäßig ganz – sie muss ja wissen,
was hinter dem Hügel steht. Manchmal will sie aber genau das Gegenteil:
sehen, was ihr Späher sieht, bevor sie ihn losschickt.

Gerechnet wird das nicht im Browser, sondern hier – mit derselben Funktion,
die auch für die Runde rechnet. Ein Vorschaubild, das anders rechnet als
das Original, wäre keine Hilfe, sondern eine Falle.

`tokenId: null` schaltet zurück auf die Vogelperspektive.

### POST /api/scenes/:id/nebel

*backend/src/routes/spieltisch/nebel.js, Zeile 29 · Spielleitung, Kampagne gewählt*

POST /api/scenes/:id/nebel  { cells: ['3,4', …], revealed: true }

Felder aufdecken oder wieder verhüllen – ein Pinselstrich der
Spielleitung. Die Oberfläche bündelt die Felder eines Strichs, bevor sie
schickt (pages/tisch/useNebelpinsel.js); höchstens 4000 je Anfrage.

### POST /api/scenes/:id/nebel/alles

*backend/src/routes/spieltisch/nebel.js, Zeile 66 · Spielleitung, Kampagne gewählt*

POST /api/scenes/:id/nebel/alles  { revealed: true|false } – die ganze Karte
auf einmal aufdecken oder zudecken.

### POST /api/scenes/:id/figuren

*backend/src/routes/spieltisch/figuren.js, Zeile 41 · Spielleitung, Kampagne gewählt*

POST /api/scenes/:id/figuren  { name, x, y, size?, color?, mediaId?,
characterId?, combatantId?, hidden? } – eine Figur auslegen. Ein Blatt oder
Kämpfer, an den sie gebunden wird, muss zu dieser Kampagne gehören.

### PATCH /api/scenes/figuren/:id

*backend/src/routes/spieltisch/figuren.js, Zeile 76 · angemeldet, Kampagne gewählt*

PATCH /api/scenes/figuren/:id – Bewegen darf auch, wem die Figur gehört

### DELETE /api/scenes/figuren/:id

*backend/src/routes/spieltisch/figuren.js, Zeile 110 · Spielleitung, Kampagne gewählt*

DELETE /api/scenes/figuren/:id – eine Figur vom Tisch nehmen.

### POST /api/scenes/:id/figuren/aus-kampf

*backend/src/routes/spieltisch/figuren.js, Zeile 122 · Spielleitung, Kampagne gewählt*

POST /api/scenes/:id/figuren/aus-kampf – alle Kämpfer als Figuren auslegen

### POST /api/scenes/ping

*backend/src/routes/spieltisch/zeigen.js, Zeile 19 · angemeldet, Kampagne gewählt*

POST /api/scenes/ping – ein kurzes Aufleuchten für alle, nichts wird gespeichert

## /api/stash

| Methode | Pfad | Wer darf | Was |
|---|---|---|---|
| GET | `/api/stash` | angemeldet, Kampagne gewählt | die Beutekiste dieser Kampagne: Gegenstände und Münzen. |
| POST | `/api/stash/items` | angemeldet, Kampagne gewählt | jede und jeder darf eintragen, was gefunden wurde |
| PUT | `/api/stash/items/:id` | angemeldet, Kampagne gewählt | ändern, auch wer den Gegenstand trägt. |
| DELETE | `/api/stash/items/:id` | angemeldet, Kampagne gewählt | aus der Kiste nehmen. |
| PUT | `/api/stash/coins` | angemeldet, Kampagne gewählt | die Münzen in der Kiste setzen. |
| GET | `/api/stash/teilung` | angemeldet, Kampagne gewählt | Rechnet nur nach, wie die Münzen aufgingen – ändert nichts. |
| POST | `/api/stash/auszahlen` | Spielleitung, Kampagne gewählt | Schreibt jedem genannten Charakter seinen Anteil in den Beutel und leert die Kiste bis auf den Rest. |
| POST | `/api/stash/items/:id/kopieren` | Spielleitung, Kampagne gewählt | Ein Fund in einer anderen Kampagne – der Dolch, der in zwei Geschichten vorkommen soll. |

### GET /api/stash

*backend/src/routes/stash.js, Zeile 48 · angemeldet, Kampagne gewählt*

GET /api/stash – die Beutekiste dieser Kampagne: Gegenstände und Münzen.

### POST /api/stash/items

*backend/src/routes/stash.js, Zeile 53 · angemeldet, Kampagne gewählt*

POST /api/stash/items – jede und jeder darf eintragen, was gefunden wurde

### PUT /api/stash/items/:id

*backend/src/routes/stash.js, Zeile 81 · angemeldet, Kampagne gewählt*

PUT /api/stash/items/:id  { name?, qty?, weight?, notes?, holderId? } –
ändern, auch wer den Gegenstand trägt. Der Träger muss ein Blatt dieser
Kampagne sein.

### DELETE /api/stash/items/:id

*backend/src/routes/stash.js, Zeile 101 · angemeldet, Kampagne gewählt*

DELETE /api/stash/items/:id – aus der Kiste nehmen.

### PUT /api/stash/coins

*backend/src/routes/stash.js, Zeile 110 · angemeldet, Kampagne gewählt*

PUT /api/stash/coins  { pp?, gp?, ep?, sp?, cp? } – die Münzen in der Kiste
setzen. Nur, was mitgeschickt wird, ändert sich; nie unter null.

### GET /api/stash/teilung

*backend/src/routes/stash.js, Zeile 127 · angemeldet, Kampagne gewählt*

GET /api/stash/teilung?anteile=4

Rechnet nur nach, wie die Münzen aufgingen – ändert nichts. Der Rest, der
sich nicht glatt teilen lässt, bleibt ausdrücklich stehen: Wer ihn bekommt,
ist eine Frage für den Tisch und nicht für den Almanach.

### POST /api/stash/auszahlen

*backend/src/routes/stash.js, Zeile 141 · Spielleitung, Kampagne gewählt*

POST /api/stash/auszahlen  { characterIds: [...] }

Schreibt jedem genannten Charakter seinen Anteil in den Beutel und leert die
Kiste bis auf den Rest. Das greift in fremde Charakterblätter ein – deshalb
darf es nur die Spielleitung.

### POST /api/stash/items/:id/kopieren

*backend/src/routes/stash.js, Zeile 213 · Spielleitung, Kampagne gewählt*

POST /api/stash/items/:id/kopieren  { campaignId }

Ein Fund in einer anderen Kampagne – der Dolch, der in zwei Geschichten
vorkommen soll. Getragen wird er drüben nur, wenn dort jemand gleichen
Namens steht; sonst liegt er einfach in der Kiste.
