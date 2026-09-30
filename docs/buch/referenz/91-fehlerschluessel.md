# Verzeichnis der Fehlerschlüssel

> Dieses Kapitel schreibt `npm run handbuch` aus dem Code (scripts/handbuch/referenz/).
> Änderungen gehören in den Code und seine Kommentare, nicht hierher.

Sagt der Server nein, antwortet er mit einem HTTP-Status und einem kleinen JSON-Rumpf:

```json
{ "code": "nur_spielleitung", "error": "Das darf nur die Spielleitung." }
```

`code` ist ein Schlüssel, der sich nie ändert – auf ihn verlässt sich die Oberfläche, und auf ihn darf sich jedes andere Programm verlassen, das mit dem Almanach spricht. `error` ist ein Satz für Menschen und darf sich jederzeit ändern. Für einige Schlüssel hat die Oberfläche einen eigenen Satz (`FEHLER` in `frontend/src/lib/beschriftung.js`); sonst zeigt sie den des Servers.

Eine Absage hat nichts geändert: Jeder Weg prüft erst alles und schreibt dann. Wer mit 400, 403 oder 409 abgewiesen wird, findet den Almanach so vor wie vorher.

Insgesamt 74 Schlüssel an 143 Stellen.

## Nach Status

| Status | allgemein | Schlüssel |
|---|---|---|
| 400 | Die Anfrage ist unvollständig oder ungültig. Nichts wurde geändert. | `anmeldedaten_fehlen`, `beute_zu_klein`, `bild_fehlt`, `bild_leer`, `charakter_nicht_gefunden`, `eigenes_konto`, `empfaenger_fehlen`, `empfaenger_selbst`, `gleiche_kampagne`, `kampf_ohne_gegner`, `keine_offene_sitzung`, `keine_spotify_adresse`, `konto_nicht_gefunden`, `letzte_spielleitung`, `monster_fehlt`, `nachricht_leer`, `name_fehlt`, `name_stimmt_nicht`, `name_ungueltig`, `nichts_gewaehlt`, `passwort_zu_kurz`, `sitzung_leer`, `text_fehlt`, `titel_fehlt`, `unbekannte_rolle`, `ungueltiger_pfad`, `verweis_unbekannt`, `wurfausdruck_fehlt`, `wurfausdruck_ungueltig` |
| 401 | Nicht angemeldet, oder die Anmeldung ist abgelaufen. | `anmeldung_falsch`, `nicht_angemeldet` |
| 403 | Angemeldet, aber nicht berechtigt – oder ein Kennwort, ein Code stimmt nicht. | `blatt_fremd`, `blatt_nicht_sichtbar`, `einladung_ungueltig`, `einladung_verbraucht`, `figur_fremd`, `kaempfer_fremd`, `nicht_angelegt`, `nicht_dabei`, `nur_spielleitung`, `passwort_falsch`, `ziel_unbekannt` |
| 404 | Das Gesuchte gibt es nicht – oder nicht in dieser Kampagne. | `begegnung_nicht_gefunden`, `bild_nicht_gefunden`, `bilddatei_fehlt`, `charakter_nicht_gefunden`, `einladung_nicht_gefunden`, `eintrag_nicht_gefunden`, `empfaenger_unbekannt`, `figur_nicht_gefunden`, `gegenstand_nicht_gefunden`, `kaempfer_nicht_gefunden`, `kampagne_nicht_gefunden`, `karte_nicht_gefunden`, `klang_nicht_gefunden`, `konto_nicht_gefunden`, `nicht_im_papierkorb`, `notiz_nicht_gefunden`, `route_unbekannt`, `sitzung_nicht_gefunden`, `szene_nicht_gefunden` |
| 409 | Der Zustand passt nicht: keine Kampagne gewählt, Name vergeben, nicht im Papierkorb. | `figur_andere_szene`, `keine_kampagne`, `klang_still`, `name_vergeben` |
| 413 | Zu groß. | `bild_zu_gross`, `daten_zu_gross` |
| 415 | Falsches Format. | `bildformat_nicht_erlaubt` |
| 429 | Zu viele Versuche. | `zu_viele_versuche` |
| 500 | Im Server ist etwas schiefgegangen. | `serverfehler` |
| 501 | Nicht eingerichtet. | `ki_nicht_eingerichtet` |
| 502 | Ein fremder Dienst hat nicht geantwortet. | `ki_fehler`, `ki_leer`, `ki_nicht_erreichbar`, `kompendium_nicht_erreichbar` |
| 503 | Der Server kommt nicht an seine Datenbank. | `datenbank_unerreichbar` |

## Alle Schlüssel

| Schlüssel | Status | Satz des Servers | Datei |
|---|---|---|---|
| `anmeldedaten_fehlen` | 400 | Name und Passwort sind erforderlich. | routes/konten/anmeldung.js |
| `anmeldung_falsch` | 401 | Name oder Passwort stimmt nicht. | routes/konten/anmeldung.js |
| `begegnung_nicht_gefunden` | 404 | Begegnung nicht gefunden. | routes/encounters.js |
| `beute_zu_klein` | 400 | In der Kiste liegt zu wenig, um sie zu teilen. | routes/stash.js |
| `bild_fehlt` | 400 | Es wurde kein Bild übergeben. | routes/media.js |
| `bild_leer` | 400 | Die Bilddatei ist leer. | routes/media.js |
| `bild_nicht_gefunden` | 404 | Bild nicht gefunden. | routes/media.js |
| `bild_zu_gross` | 413 | Das Bild ist größer als … MB. | routes/media.js |
| `bilddatei_fehlt` | 404 | Zu diesem Bild fehlt die Datei auf der Platte. | routes/media.js |
| `bildformat_nicht_erlaubt` | 415 | Nur PNG, JPEG, WebP, GIF oder AVIF können abgelegt werden. | routes/media.js |
| `blatt_fremd` | 403 | Dieses Blatt gehört jemand anderem. | routes/charaktere/schreiben.js |
| `blatt_nicht_sichtbar` | 403 | Dieses Blatt ist nicht für dich bestimmt. | routes/charaktere/abschriften.js, routes/charaktere/lesen.js |
| `charakter_nicht_gefunden` | 400, 404 | Charakter nicht gefunden / Dieses Blatt gibt es in dieser Kampagne nicht. / Diesen Charakter gibt es in dieser Kampagne nicht. / Keiner dieser Charaktere ist verzeichnet. | routes/charaktere/abschriften.js, routes/charaktere/lesen.js, routes/charaktere/schreiben.js, routes/kampf/kaempfer.js, routes/stash.js |
| `daten_zu_gross` | 413 | Die gesendeten Daten sind zu groß. | server.js |
| `datenbank_unerreichbar` | 503 | *(wechselnd: `err.message`)* | server.js |
| `eigenes_konto` | 400 | Das eigene Konto lässt sich nicht löschen. | routes/konten/verwaltung.js |
| `einladung_nicht_gefunden` | 404 | Einladung nicht gefunden. | routes/konten/einladungen.js |
| `einladung_ungueltig` | 403 | Dieser Einladungscode gilt nicht. | routes/konten/anmeldung.js |
| `einladung_verbraucht` | 403 | Dieser Einladungscode wurde schon eingelöst. | routes/konten/anmeldung.js |
| `eintrag_nicht_gefunden` | 404 | Eintrag nicht gefunden. | routes/chronik/sitzungen.js, routes/library.js |
| `empfaenger_fehlen` | 400 | Es wurde niemand genannt, der etwas bekommen soll. | routes/stash.js |
| `empfaenger_selbst` | 400 | An sich selbst flüstert man nicht. | routes/chat.js |
| `empfaenger_unbekannt` | 404 | Diese Person gibt es nicht. | routes/chat.js |
| `figur_andere_szene` | 409 | Diese Figur steht nicht auf dem Tisch. | routes/spieltisch/szenen.js |
| `figur_fremd` | 403 | Diese Figur gehört jemand anderem. | routes/spieltisch/figuren.js |
| `figur_nicht_gefunden` | 404 | Figur nicht gefunden. | routes/spieltisch/figuren.js, routes/spieltisch/szenen.js |
| `gegenstand_nicht_gefunden` | 404 | Gegenstand nicht gefunden. | routes/stash.js |
| `gleiche_kampagne` | 400 | Das wäre dieselbe Kampagne – kopiert wird nur in eine andere. | uebernehmen/ziel.js |
| `kaempfer_fremd` | 403 | Diese Zeile gehört nicht dir. / Diese Zeile gehört jemand anderem. | routes/kampf/kaempfer.js |
| `kaempfer_nicht_gefunden` | 404 | Kämpfer nicht gefunden. | routes/kampf/kaempfer.js |
| `kampagne_nicht_gefunden` | 404 | Kampagne nicht gefunden. / Im Papierkorb liegt sie nicht. | routes/kampagnen/liste.js, routes/kampagnen/mitglieder.js, routes/kampagnen/papierkorb.js |
| `kampf_ohne_gegner` | 400 | Im Kampf steht gerade kein Gegner, den man sichern könnte. | routes/encounters.js |
| `karte_nicht_gefunden` | 404 | Karte nicht gefunden. | routes/maps.js |
| `keine_kampagne` | 409 | Bitte zuerst eine Kampagne wählen. | anmeldung/waechter.js, routes/media.js |
| `keine_offene_sitzung` | 400 | Diese Sitzung ist schon beendet. | routes/chronik/sitzungen.js |
| `keine_spotify_adresse` | 400 | Das ist kein Spotify-Link auf eine Wiedergabeliste, ein Album, ein Stück oder einen Künstler. / Das ist kein Spotify-Link. | routes/ambience.js |
| `ki_fehler` | 502 | Das Sprachmodell antwortete mit …: … | routes/chronik/rueckblick.js |
| `ki_leer` | 502 | Das Sprachmodell hat nichts geschrieben. | routes/chronik/rueckblick.js |
| `ki_nicht_eingerichtet` | 501 | Es ist kein Sprachmodell eingestellt. Setze CHRONIK_KI_URL (und bei Bedarf CHRONIK_KI_MODELL und CHRONIK_KI_SCHLUESSEL), um den Rückblick schreiben zu lassen. Das Protokoll selbst gibt es auch ohne.<br>*Oberfläche:* Es ist kein Sprachmodell eingestellt – das Protokoll gibt es auch ohne. | routes/chronik/rueckblick.js |
| `ki_nicht_erreichbar` | 502 | Das Sprachmodell war nicht erreichbar: … | routes/chronik/rueckblick.js |
| `klang_nicht_gefunden` | 404 | Ambiente nicht gefunden. | routes/ambience.js |
| `klang_still` | 409 | Es liegt gerade nichts auf. | routes/ambience.js |
| `kompendium_nicht_erreichbar` | 502 | D&D 5e API ist nicht erreichbar und es liegt kein Cache vor.<br>*Oberfläche:* Das Kompendium ist gerade nicht erreichbar. | routes/compendium.js |
| `konto_nicht_gefunden` | 400, 404 | Konto nicht gefunden. | routes/charaktere/schreiben.js, routes/kampagnen/mitglieder.js, routes/konten/verwaltung.js |
| `letzte_spielleitung` | 400 | Es braucht mindestens eine Spielleitung. | routes/konten/verwaltung.js |
| `monster_fehlt` | 400 | Kein Monster übergeben. | routes/library.js |
| `nachricht_leer` | 400 | Die Nachricht ist leer. | routes/chat.js |
| `name_fehlt` | 400 | Name ist erforderlich. / Name ist erforderlich / Ohne Namen kein Eintrag. | routes/ambience.js, routes/charaktere/schreiben.js, routes/encounters.js, routes/kampf/kaempfer.js, routes/library.js, routes/maps.js, routes/spieltisch/szenen.js, routes/stash.js |
| `name_stimmt_nicht` | 400 | Zum Bestätigen muss der Name der Kampagne genau abgetippt werden. | routes/kampagnen/papierkorb.js |
| `name_ungueltig` | 400 | *(wechselnd: `fehler`)* / *(wechselnd: `namensfehler`)* | routes/kampagnen/liste.js, routes/konten/anmeldung.js |
| `name_vergeben` | 409 | Diesen Namen führt der Almanach bereits. | routes/konten/anmeldung.js |
| `nicht_angelegt` | 403 | Umbenennen darf nur, wer diese Kampagne angelegt hat. / Löschen darf nur, wer diese Kampagne angelegt hat. / Das darf nur, wer die Kampagne angelegt hat. | routes/kampagnen/liste.js, routes/kampagnen/papierkorb.js |
| `nicht_angemeldet` | 401 | Bitte zuerst anmelden.<br>*Oberfläche:* Die Sitzung ist abgelaufen. Bitte melde dich noch einmal an. | anmeldung/waechter.js |
| `nicht_dabei` | 403 | Du bist kein Mitglied dieser Kampagne. | routes/kampagnen/liste.js |
| `nicht_im_papierkorb` | 404 | Endgültig entfernen lässt sich nur, was schon im Papierkorb liegt. | routes/kampagnen/papierkorb.js |
| `nichts_gewaehlt` | 400 | Es wurde nicht gesagt, was mitkommen soll. | routes/kampagnen/umzug.js |
| `notiz_nicht_gefunden` | 404 | Notiz nicht gefunden. | routes/notes.js |
| `nur_spielleitung` | 403 | Das ist der Spielleitung vorbehalten. / Das darf nur die Spielleitung.<br>*Oberfläche:* Das ist der Spielleitung vorbehalten. | anmeldung/waechter.js, routes/charaktere/schreiben.js |
| `passwort_falsch` | 403 | Das bisherige Passwort stimmt nicht. | routes/konten/anmeldung.js |
| `passwort_zu_kurz` | 400 | Das Passwort braucht mindestens … Zeichen. | routes/konten/regeln.js |
| `route_unbekannt` | 404 | Diesen Weg kennt der Almanach nicht. | server.js |
| `serverfehler` | 500 | Im Almanach ist etwas schiefgegangen. | server.js |
| `sitzung_leer` | 400 | In dieser Sitzung steht noch nichts. | routes/chronik/rueckblick.js |
| `sitzung_nicht_gefunden` | 404 | Sitzung nicht gefunden. | routes/chronik/protokoll.js, routes/chronik/rueckblick.js, routes/chronik/sitzungen.js |
| `szene_nicht_gefunden` | 404 | Szene nicht gefunden. | routes/spieltisch/figuren.js, routes/spieltisch/nebel.js, routes/spieltisch/szenen.js |
| `text_fehlt` | 400 | Ohne Text kein Eintrag. | routes/chronik/sitzungen.js |
| `titel_fehlt` | 400 | Titel ist erforderlich. | routes/notes.js |
| `unbekannte_rolle` | 400 | Unbekannte Rolle. | routes/konten/verwaltung.js |
| `ungueltiger_pfad` | 400 | Ungültiger Pfad. | routes/compendium.js |
| `verweis_unbekannt` | 400 | Blatt oder Kämpfer gibt es in dieser Kampagne nicht. | routes/spieltisch/figuren.js |
| `wurfausdruck_fehlt` | 400 | Würfelausdruck ist erforderlich. | routes/dice.js |
| `wurfausdruck_ungueltig` | 400 | *(wechselnd: `err.message`)* | routes/dice.js |
| `ziel_unbekannt` | 403 | In diese Kampagne kannst du nichts legen. | uebernehmen/ziel.js |
| `zu_viele_versuche` | 429 | Zu viele Versuche. Bitte in zehn Minuten noch einmal.<br>*Oberfläche:* Zu viele Versuche. Bitte in zehn Minuten noch einmal. | routes/konten/anmeldung.js |
