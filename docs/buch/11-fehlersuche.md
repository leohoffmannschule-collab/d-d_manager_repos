# Fehlersuche

Die meisten Störungen am Spieltisch sind keine Fehler, sondern Absicht, die man nicht erwartet hat: Der Goblin fehlt, weil er verborgen ist; der Tisch ist leer, weil der Vorhang zu ist; die Anmeldung klemmt, weil acht Versuche daneben gingen. Dieses Kapitel hilft, das eine vom anderen zu unterscheiden – und im zweiten Fall schnell die Stelle zu finden.

Die Tabellen in den Kapiteln „Einrichtung“ (Abschnitt 11) und „Für die Spielleitung“ (Abschnitt 9) sammeln die häufigsten Bilder für den Betrieb und den Abend. Dieses Kapitel ist gründlicher: Es erklärt, wie man sucht, mit welchen Werkzeugen, und was hinter den Meldungen steckt.

## Vier Fragen zuerst

Bevor man irgendetwas ändert, lohnen vier Fragen. Sie trennen in der Hälfte der Fälle Absicht von Fehler, bevor man einen einzigen Befehl getippt hat.

1. **Wer sieht es?** Nur eine Person, alle Spielenden, oder auch die Spielleitung? Sieht die Spielleitung etwas, das die Runde nicht sieht, ist das fast immer die Sicht, der Nebel, der Vorhang oder ein verborgenes Ding – und damit so gewollt.
2. **Alle Fenster oder eines?** Tritt es nur in einem Browser auf, liegt es an diesem Fenster: abgelaufene Anmeldung, abgerissener Live-Draht, ein alter Stand im Browser. Neu laden hilft dann meist.
3. **Seit wann?** Seit einem Update, einem Umzug, einem Stromausfall? Das grenzt die Ursache mehr ein als jede Meldung.
4. **Was sagt der Server?** Jede Absage des Servers trägt einen Fehlerschlüssel. Er steht in der Meldung auf dem Schirm oder in den Entwicklerwerkzeugen des Browsers – und er sagt genau, was los ist.

## Die Werkzeuge

### Der Punkt in der Leiste

Oben rechts neben dem Namen der Kampagne sitzt ein kleiner Punkt. Golden heißt: Der Live-Draht steht. Rot und pulsierend heißt: Er ist gerissen und wird neu geknüpft. Solange er rot ist, bewegt sich auf diesem Schirm nichts, was andere tun – und die Karte sieht trotzdem aus, als wäre alles in Ordnung. Wer glaubt, „der Almanach hängt“, schaut zuerst hierhin.

### Der Startbericht

Was der Server beim Start schreibt, nennt Datenbank, Datenordner und Adressen und warnt vor fehlenden Bildern, einer unlesbaren `.env` oder einem Port, der schon belegt ist (Kapitel „Betrieb im Alltag“). Auf dem Pi steht er in `docker compose logs dnd-manager`, auf dem Laptop im Fenster.

### Das Lebenszeichen

```bash
curl -s localhost:3001/api/health
```

```json
{ "status": "ok", "driver": "node:sqlite", "angemeldet": false, "time": "2026-09-30T19:12:04.113Z" }
```

Kommt das, läuft der Server und erreicht seine Datenbank. Kommt `503` mit `datenbank_unerreichbar`, läuft er, kommt aber nicht an seine Daten – meist eine volle Speicherkarte (`df -h`) oder eine zurückgespielte Datei, die dem falschen Benutzer gehört. Kommt gar nichts, läuft er nicht (oder auf einem anderen Port).

### Prüfen und Adresse

```bash
npm run pruefen    # Node, SQLite, Bausteine, Bau, Datenordner, Port, Domain, Tunnel-Kennwort
npm run adresse    # unter welchen Adressen der Almanach gerade zu erreichen ist
```

`pruefen` ändert nichts, es sagt nur, was `npm start` tun würde. `adresse` liest die Netzwerkadressen des Geräts und die Adresse des Tunnels aus dessen Protokoll.

### Die Entwicklerwerkzeuge des Browsers

Für alles, was nur ein Fenster betrifft, sind die Entwicklerwerkzeuge das stärkste Werkzeug (meist `F12`, am Mac `Wahl+Befehl+I`):

- **Netzwerk.** Jede Anfrage an `/api/…` mit ihrem Status. Ein roter Eintrag zeigt im Reiter „Antwort“ den Rumpf mit `code` und `error`. Die Anfrage `stream` ist der Live-Draht; solange sie offen ist (Status 200, ohne Ende), steht er.
- **Konsole.** Fehler der Oberfläche selbst – etwa „Fehler im Zuhörer für ‚wurf‘“, wenn ein Bauteil über ein Ereignis stolpert. Der Almanach fängt solche Fehler ab, damit ein stolpernder Teil nicht den Rest mitreißt; hier stehen sie trotzdem.

Auf dem Telefon gibt es diese Werkzeuge nicht bequem. Dort hilft es, dasselbe Konto kurz an einem Rechner zu öffnen: Die Oberfläche ist dieselbe.

### Ein Probe-Almanach

Für alles, was sich nicht im laufenden Almanach ausprobieren lässt – eine zurückgespielte Sicherung, eine neue Fassung, eine Vermutung –, startet man einen zweiten daneben: `DATA_DIR=/tmp/probe PORT=3002 npm start`. Er stört niemanden und ist nach dem Schließen des Fensters vergessen.

### Der Prüfdurchgang

Wer am Code gearbeitet hat oder einem Update misstraut, lässt `npm test` laufen: Lint, die vier Proben und den Vertrag, der einen eigenen Almanach mit leerer Datenbank startet und fast dreihundert Zusagen zwischen Server und Oberfläche nachprüft. Scheitert dort etwas, steht in der Ausgabe, welche Zusage nicht hielt.

## Fehlerschlüssel lesen

Sagt der Server nein, antwortet er mit einem HTTP-Status und einem Rumpf wie

```json
{ "code": "keine_kampagne", "error": "Bitte zuerst eine Kampagne wählen." }
```

Der **Status** sagt die Art, der **Schlüssel** die Sache, der **Satz** ist für Menschen. Das Verzeichnis „Fehlerschlüssel“ am Ende des Buches führt alle Schlüssel mit Status, Satz und Datei auf. Die folgenden trifft man am häufigsten, und hinter jedem steckt etwas Bestimmtes:

**`nicht_angemeldet` (401).** Die Anmeldung fehlt oder ist abgelaufen – nach dreißig Tagen ohne Besuch, nach einem Kennwortwechsel auf einem anderen Gerät, nachdem die Spielleitung das Konto gelöscht hat. Die Oberfläche schickt einen dann zur Anmeldung. Tritt es bei *jeder* Anfrage auf, obwohl man sich gerade angemeldet hat, nimmt der Browser das Cookie nicht an – meist ein Browser, der Cookies sperrt. (Das Cookie trägt das Merkmal `Secure` nur, wenn die Anfrage nachweislich über HTTPS kam; im Heimnetz über `http://` wird es deshalb ohne gesetzt und kommt trotzdem an.)

**`anmeldung_falsch` (401).** Name oder Kennwort stimmen nicht. Der Almanach sagt absichtlich nicht, welches von beiden – sonst ließe sich ausprobieren, welche Namen es gibt. Groß- und Kleinschreibung spielen beim Namen keine Rolle, beim Kennwort schon.

**`zu_viele_versuche` (429).** Acht Fehlversuche in zehn Minuten, gezählt je Herkunft und Name. Warten, oder die Spielleitung setzt das Kennwort neu. Das ist keine Störung, sondern die Bremse gegen das Durchprobieren.

**`keine_kampagne` (409).** Angemeldet, aber keine Kampagne gewählt – oder die gewählte gilt nicht mehr, weil man aus ihr herausgenommen wurde oder sie im Papierkorb liegt. Die Oberfläche zeigt dann die Kampagnenauswahl.

**`nur_spielleitung` (403).** Ein Weg, den nur die Spielleitung gehen darf. In der Oberfläche sieht man solche Knöpfe als Spielerin gar nicht; wer die Meldung trotzdem sieht, hat meist gerade die Rolle verloren und ein altes Fenster offen. Neu laden.

**`blatt_nicht_sichtbar` (403), `blatt_fremd` (403).** Das erste: ein Blatt, das man nicht sehen darf (ein NSC-Blatt, ein nicht geteiltes fremdes). Das zweite: eines, das man sehen, aber nicht ändern darf. Beides passiert, wenn die Spielleitung ein Blatt hinter den Schirm legt oder das Teilen abschaltet, während es jemand offen hat.

**`figur_fremd` (403).** Die Figur hängt nicht an einem eigenen Blatt. Mitspielende dürfen nur Figuren ziehen, die an ihrem eigenen Charakterblatt hängen; alle anderen zieht die Spielleitung.

**`verweis_unbekannt` (400).** Etwas verweist auf ein Blatt oder einen Kämpfer, den es in dieser Kampagne nicht gibt – meist ein Fenster mit altem Stand, in dem etwas längst gelöscht ist.

**`daten_zu_gross` (413), `bild_zu_gross` (413).** Eine Anfrage größer als 2 MB (ein riesiges Blatt, etwa mit einem unverkleinerten Bildnis) oder ein Bild größer als 12 MB. Große Karten vorher verkleinern.

**`bilddatei_fehlt` (404).** In der Datenbank steht ein Bild, dessen Datei im Ordner `medien` fehlt. Fast immer nach einem Umzug; der Startbericht sagt, wie viele es sind.

**`kompendium_nicht_erreichbar` (502).** Die offene 5e-Schnittstelle antwortet nicht, und der Almanach hat den Eintrag noch nicht zwischengespeichert. Einmal Nachgeschlagenes bleibt dreißig Tage vorrätig und wird auch danach noch ausgeliefert, wenn die Schnittstelle gerade nicht antwortet.

**`route_unbekannt` (404).** Die Oberfläche ruft einen Weg, den der Server nicht kennt. Das heißt fast immer: Oberfläche und Server stammen aus verschiedenen Fassungen – nach einem `git pull` ohne neuen Bau, oder ein Browser hält eine alte Oberfläche offen. Auf dem Laptop `npm start -- --neu-bauen`, auf dem Pi `docker compose … up -d --build`, und im Browser neu laden.

**`serverfehler` (500).** Etwas im Server ging schief, das niemand vorhergesehen hat. Im Protokoll des Servers steht dazu ein Stapelauszug. Das ist ein echter Fehler und gehört gemeldet (siehe unten).

## Nach Bildern

### Anmelden und Kampagne

| Bild | Wahrscheinliche Ursache | Was tun |
|---|---|---|
| Die Anmeldeseite zeigt „Almanach einrichten“ | Die Datenbank ist leer – frischer Almanach, oder ein falscher Datenordner. | Startbericht lesen: Stimmt der Datenordner? Nach einem Umzug liegt die Datenbank oft eine Ebene daneben. |
| „Dieser Einladungscode gilt nicht“ | Tippfehler, oder der Code wurde zurückgezogen. Groß- und Kleinschreibung spielen keine Rolle. | Neuen Code erzeugen lassen. |
| „Dieser Einladungscode wurde schon eingelöst“ | Jeder Code gilt einmal. | Neuen Code erzeugen lassen. |
| Nach der Anmeldung die Kampagnenauswahl, aber leer | Das Konto ist in keiner Kampagne Mitglied. | Die Spielleitung nimmt es unter *Spielleitung → Runde* als Mitglied auf. |
| Man wird immer wieder abgemeldet | Der Browser löscht Cookies beim Schließen, oder ein privates Fenster. | Browser-Einstellungen; kein privates Fenster. |
| Über die Tunnel-Adresse angemeldet, über die Adresse im WLAN nicht (oder umgekehrt) | Eine Anmeldung gilt je Adresse: Der Browser schickt das Cookie nur an die Adresse, die es gesetzt hat. | Einmal auch unter der anderen Adresse anmelden – oder immer dieselbe benutzen. |

### Live-Draht und Verbindung

| Bild | Wahrscheinliche Ursache | Was tun |
|---|---|---|
| Punkt rot, nichts bewegt sich | Funkloch, Laptop eingeschlafen, Server neu gestartet. | Warten – der Browser verbindet sich nach drei Sekunden von selbst neu und lädt dann alles nach. |
| Punkt dauerhaft rot | Server nicht erreichbar, oder er weist den Kanal ab (abgemeldet, keine Kampagne). | Seite neu laden; `api/health` prüfen. |
| Bei einer Person kommt nichts an, bei allen anderen schon | Dieses Fenster hängt an einem alten Stand. | Neu laden. |
| Änderungen kommen an, aber verzögert um Sekunden | Ein Proxy puffert den Strom (selten; der Almanach verbietet es mit `X-Accel-Buffering: no`). Oder ein sehr langsamer Pi beim Neurechnen einer großen Karte. | Bei eigenem Proxy dessen Puffern für `/api/stream` abschalten. |
| Nach einem Update: Knöpfe tun nichts, Meldungen mit `route_unbekannt` | Alte Oberfläche im Browser, neuer Server. Die Oberfläche ist als App zwischengespeichert (Service Worker) und holt eine neue Fassung im Hintergrund. | Neu bauen; im Browser neu laden – spätestens beim zweiten Mal ist die neue Fassung da. |

### Spieltisch, Nebel und Sicht

| Bild | Wahrscheinliche Ursache | Was tun |
|---|---|---|
| Die Runde sieht einen leeren Tisch | Keine Szene aufgelegt, oder der Vorhang ist zu. | *Spielleitung → Karten → Auflegen*; Vorhang auf. |
| Die Runde sieht die Karte, aber keine Figuren | Die Figuren stehen im Nebel, sind verborgen oder außerhalb der Sicht. | So gedacht. Aufdecken, zeigen. |
| Eine Figur fehlt nur bei der Runde | Figur verborgen (Figurenfeld) – unabhängig davon, ob der Kämpfer in der Liste verborgen ist. | Im Figurenfeld zeigen. Kämpfer und Figur haben je ihren eigenen Schalter. |
| Ein Gegner steht in der Kampfliste, aber nicht auf der Karte | Die Figur ist noch verborgen oder im Nebel, oder es gibt keine. | „Figuren aus dem Kampf“, Figur zeigen, Nebel aufdecken. |
| Eine Spielerin sieht weniger als die anderen | Auf ihrem Blatt steht eine Sichtweite; ihr Nebelfenster hängt an ihrer Figur. | So gedacht. Sichtweite 0 heißt unbegrenzt. |
| Niemand sieht etwas, obwohl die Szene offen ist | Dunkle Szene ohne Licht und ohne Dunkelsicht. | Einer Figur Licht geben, oder „dunkle Szene“ aus. |
| Sicht geht durch Wände | Der Almanach kennt keine Wände. Licht und Blick gehen hindurch. | Nebel ist die einzige Sichtsperre: nicht aufdecken, was nicht zu sehen sein soll. |
| Eine Spielerin kann ihre Figur nicht ziehen | Die Figur hängt an keinem Blatt, oder an einem, das ihr nicht gehört. | Heldenfiguren entstehen verknüpft über „Runde holen“ + „Figuren aus dem Kampf“. |
| Das Raster liegt daneben | Feldgröße oder Versatz stimmen nicht. | Rasterfeld ausklappen, einstellen, „in der Bibliothek merken“. |
| Nach „Auflegen“ ist der Nebel von damals wieder da | Aus derselben Karte gab es schon eine Szene; sie kommt samt Nebel zurück. | Absicht. Wer neu anfangen will, legt „frisch“ auf. |
| Das Lineal zeigt andere Zahlen als die Sichtrechnung | Das Lineal zählt Diagonalen einfach (wie die Bewegungsregel), die Sicht misst Kreise (wie ein Radius). | Absicht – es sind zwei verschiedene Regeln. |

### Kampf

| Bild | Wahrscheinliche Ursache | Was tun |
|---|---|---|
| Die Runde sieht bei Monstern keine Trefferpunkte | Absicht: nur ein Wort wie „verwundet“. | – |
| Eine Heldin fehlt in der Kampfliste nach „Runde holen“ | Ihr Blatt ist nicht geteilt, oder es ist ein NSC-Blatt. | Blatt teilen (unter *Spielleitung → Runde*). |
| „Eigene Initiative würfeln“ fehlt | Die eigene Heldin steht nicht in der Liste. | „Runde holen“. |
| Schaden steht in der Liste, aber nicht auf dem Blatt | Der Kämpfer ist nicht mit dem Blatt verknüpft (von Hand angelegt), oder die Spielerin tippt gerade selbst auf ihrem Blatt. | Über „Runde holen“ verknüpfen. Im zweiten Fall gleicht es sich beim nächsten Speichern an. |
| Die Initiative eines Monsters wirkt zu niedrig | Sein Statblock hat keine Geschicklichkeit eingetragen – dann ist der Bonus 0. | Im Bestiarium GE nachtragen; bei einem Kämpfer von Hand den „Bonus“ beim Eintragen setzen. |
| Ein aufgedeckter Gegner steht noch unsichtbar auf der Karte | Seine Figur hängt an keinem Kämpfer (von Hand ausgelegt statt über „Figuren aus dem Kampf“). | Die Figur im Figurenfeld selbst zeigen – nur verbundene Figuren gehen mit. |

### Charakterblatt

| Bild | Wahrscheinliche Ursache | Was tun |
|---|---|---|
| „Konnte nicht gespeichert werden“ | Server nicht erreichbar, abgemeldet, oder das Blatt ist zu groß. Die Meldung darüber sagt es. | Nach Ursache; die Eingabe bleibt im Fenster stehen, bis es wieder geht. |
| Alle Felder gesperrt | Fremdes Blatt – nur zum Lesen. | Die Spielleitung teilt es zu. |
| Ein Bildnis lässt sich nicht setzen | Ein Format, das der Browser nicht lesen kann (HEIC vom iPhone). | Als JPEG oder PNG speichern. |
| Weiten stehen plötzlich in Fuß | Das Blatt ist älter als die Umstellung auf Meter und behält Fuß. | Unter *Übersicht → Maße* umstellen. |
| Die Zaubersuche findet nichts | Das Kompendium ist nicht erreichbar. | Zauber von Hand eintragen. |

### Würfel, Chat, Musik

| Bild | Wahrscheinliche Ursache | Was tun |
|---|---|---|
| „Ungültiger Würfelausdruck“ | Etwas, das der Server nicht versteht: `2d6 3` (Leerzeichen mitten in einer Zahl), `d6d8`, mehr als 100 Würfel. | Würfel und Zahlen mit + und − verbinden: `2W6+3`. |
| Ein verdeckter Wurf fehlt bei der Runde | Absicht. | – |
| Ein geflüsterter Satz fehlt bei der Spielleitung | Absicht: Geflüstertes lesen nur die beiden Beteiligten. | – |
| Musik: kein Ton | Browser spielen ungefragt keinen Ton. | Einmal auf den Lautsprecher in der Klangleiste tippen. |
| Musik: „keine Spotify-Adresse“ | Der Link führt nicht zu Spotify, oder er ist kein Link auf eine Playlist, ein Album, einen Titel oder einen Künstler. | In Spotify *Teilen → Link kopieren*. |
| Musik läuft bei allen versetzt | Jeder spielt mit dem eigenen Spotify; der Almanach richtet nur aus. | Die Spielleitung drückt „Gleichziehen“. |

### Chronik

| Bild | Wahrscheinliche Ursache | Was tun |
|---|---|---|
| Ein Eintrag „Ein Kampf beginnt“ vor Beginn des Abends | „Runde holen“ beim Aufbauen. | Eintrag in der Chronik streichen. |
| Einträge fehlen bei der Runde | Verdeckte Einträge (verborgene Gegner, verdeckte Würfe) sieht nur die Spielleitung. | Absicht. |
| Der Knopf „Rückblick schreiben lassen“ fehlt | Kein Sprachmodell eingerichtet. | Nur nötig, wer den Rückblick will: `CHRONIK_KI_URL` setzen. |
| Rückblick: `ki_nicht_erreichbar`, `ki_fehler` | Das Sprachmodell antwortet nicht oder mit einem Fehler; auf einem Pi nach drei Minuten Frist. | Adresse und Schlüssel prüfen; bei einem örtlichen Modell, ob es läuft. |

### Start und Betrieb

| Bild | Wahrscheinliche Ursache | Was tun |
|---|---|---|
| „Auf Port 3001 lauscht schon jemand“ | Ein zweiter Almanach, oder ein anderes Programm. | Den anderen beenden, oder `PORT=3002`. |
| „Dieses Node bringt SQLite noch nicht mit“ | Node älter als 22.5. | Neueres Node. |
| `unhealthy` in `docker compose ps` | Der Server kommt nicht an seine Datenbank. | `df -h`; Rechte des Datenordners (Kennung 1000). |
| Nach dem Zurückspielen ist der alte Stand noch da | Die WAL-Begleitdateien lagen noch daneben. | Alle drei Dateien löschen, dann zurückspielen (Kapitel „Betrieb im Alltag“). |
| Von außen Error 1033 oder 502 | Der Tunnel läuft nicht oder zeigt auf den falschen Dienst. | Tunnel-Protokoll; beim benannten Tunnel das Ziel `http://dnd-manager:3001` (Docker) bzw. `http://localhost:3001` (Laptop). |
| Nach `git pull` sieht alles aus wie vorher | Die Oberfläche wurde nicht neu gebaut. | `npm start -- --neu-bauen` bzw. `--build`. |
| `npm run vorlagen` bricht ab | Fassungen vor diesem Buch hatten dort einen Fehler. | Aktualisieren. |
| Der Browser warnt bei `https://…:3443` („nicht privat“, „nicht sicher“) | Das Stammzertifikat ist auf diesem Gerät nicht installiert. | Einmal installieren (Einrichtung, „HTTPS im Heimnetz“); vorher den Fingerabdruck mit dem Startbericht vergleichen. |
| `https://…:3443` antwortet gar nicht | Kein Zertifikat angelegt, der Server nicht neu gestartet, oder (Docker) der Port nicht freigegeben. | `npm run zertifikat`, neu starten; der Startbericht nennt „Verschlüsselt: …“. In Docker `3443:3443` in der compose-Datei. |
| Zertifikat gilt nicht für die Adresse („falscher Name“) | Der Router hat dem Gerät eine neue Adresse gegeben, oder im Container kennt das Skript die Adresse des Pi nicht. | `npm run zertifikat` erneut (im Container mit der Adresse des Pi als Angabe), neu starten. An den Geräten ist nichts zu tun. |
| Über https angemeldet, über http nicht mehr | Absicht: Das Cookie ist dann `Secure` und geht nie unverschlüsselt. | Beim verschlüsselten Eingang bleiben. |
| Musik legt nicht auf, in der Konsole „Content Security Policy“ | Spotify hat den Ort seiner Einbettung geändert. | Die Zeile `script-src`/`frame-src` in `backend/src/kopfzeilen.js` um die neue Adresse ergänzen. |

## Bekannte Grenzen

Manches, was nach einem Fehler aussieht, ist eine bewusste Grenze. Sie steht hier, damit niemand lange sucht.

**Bewusst so:**

- **Keine Wände.** Die Sicht rechnet mit Entfernungen, nicht mit Mauern. Die Spielleitung begrenzt die Sicht mit dem Nebel.
- **Hell und dämmrig sind für die Sicht dasselbe.** Dämmriges Licht gibt Nachteil auf Wahrnehmung – eine Regel für den Wurf, nicht für den Nebel.
- **Monster-TP nur als Wort**, verborgene Gegner gar nicht, Geflüstertes nur für zwei: Was die Runde nicht sehen soll, bekommt sie nicht.
- **Kein Speichern-Knopf** am Blatt; gespeichert wird von selbst.
- **Der Almanach braucht seinen Server.** Ohne ihn geht nichts außer den mitgenommenen Blattdateien.
- **Musik nur über das eigene Spotify-Konto** jeder Person; der Almanach speichert und sendet keine Musik.

**Inzwischen geschlossen.** Frühere Fassungen dieses Buches führten hier fünf Lücken auf. Alle sind behoben, jede mit Prüfungen im Vertrag (Kapitel 21, `scripts/vertrag/21-luecken.mjs`):

- Eine Figur lässt sich im Figurenfeld von Hand an ein Blatt binden (Auswahl „Blatt“).
- Kämpfer und Figur verbergen und zeigen sich gemeinsam – wer eine Seite umlegt, legt beide um.
- Gegner aus Bestiarium und Begegnungen würfeln ihre Initiative mit dem Geschicklichkeitsbonus des Statblocks, auch bei „Initiative würfeln“.
- Mitgenommene Blattdateien liest der Knopf „Blatt einlesen“ in der Übersicht wieder ein.
- Zauber-SG und -Angriffsbonus lassen sich auf dem Reiter „Zauber“ von Hand überschreiben.

## Einen Fehler melden

Ein echter Fehler – ein `serverfehler`, ein weißer Bildschirm, etwas, das eindeutig nicht so gedacht ist – lässt sich am schnellsten beheben, wenn die Meldung vier Dinge enthält:

1. **Was man getan hat**, Schritt für Schritt, und was man erwartet hätte.
2. **Was stattdessen geschah**, mit dem Fehlerschlüssel, falls einer angezeigt wurde, und dem Rumpf der Antwort aus dem Netzwerk-Reiter.
3. **Die Fassung**: `git log --oneline -1` im Ordner des Almanachs, und der Startbericht.
4. **Das Protokoll des Servers** um den Zeitpunkt herum – bei einem `serverfehler` steht dort ein Stapelauszug.

Nie in eine Fehlermeldung gehören: die `.env`, das Tunnel-Kennwort, Kennwörter, der Inhalt des Cookies `almanach_sitzung` und die Datenbank selbst. Wer einen Fehler nachstellen muss, der von Daten abhängt, baut ihn in einem Probe-Almanach mit ausgedachten Daten nach.
