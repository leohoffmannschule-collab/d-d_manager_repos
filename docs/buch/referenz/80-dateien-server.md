# Dateiverzeichnis: der Server

> Dieses Kapitel schreibt `npm run handbuch` aus dem Code (scripts/handbuch/referenz/).
> Änderungen gehören in den Code und seine Kommentare, nicht hierher.

Alle Dateien unter backend/src und backend/scripts (107 Dateien, 10.980 Zeilen), nach Ordnern. Zu jeder Datei ihr Kopfkommentar – dort steht, wozu es sie gibt und warum sie so gebaut ist – und ihre Ausfuhren mit dem Kommentar darüber.

Einen Überblick, wie die Teile zusammenspielen, gibt das Kapitel über den Server im Teil „Wie es gebaut ist“.

## backend/src/anmeldung/

### backend/src/anmeldung/keks.js

*67 Zeilen*

Das Anmelde-Cookie: lesen, setzen, löschen.

Bewusst ohne `cookie-parser`: Der Almanach braucht genau ein Cookie, und
dafür lohnt kein zusätzliches Paket, das auf dem Pi mit installiert und
aktuell gehalten werden müsste.

**Ausfuhren**

- `COOKIE_NAME` (const) – Der Name des einen Cookies, das der Almanach setzt.
- `readCookie` (function) – Ein Cookie aus der Anfrage lesen, ohne ein Paket dafür.
- `setSessionCookie` (function) – Das Anmelde-Cookie setzen: nur für den Server lesbar (`HttpOnly`), nur aus der eigenen Seite mitgeschickt (`SameSite=Lax`), so lange gültig wie die Sitzung selbst.
- `clearSessionCookie` (function) – Das Cookie beim Abmelden löschen – ein leerer Wert mit Ablauf sofort.

### backend/src/anmeldung/kennwort.js

*69 Zeilen*

Kennwörter: hashen und prüfen.

*Kennwörter* werden mit `scrypt` und einem zufälligen Salz gehasht und
nie im Klartext gespeichert. Verglichen wird mit `timingSafeEqual`, das
immer gleich lange braucht – ein gewöhnlicher Vergleich verriete über die
Antwortzeit, wie viele Zeichen schon stimmen.

**Ausfuhren**

- `hashPassword` (async function) – @returns {Promise<string>} `scrypt$N$r$p$salz$hash`, alles zum Prüfen Nötige in einer Zeile
- `verifyPassword` (async function) – Stimmt das Kennwort? Die Parameter stehen im gespeicherten Hash selbst – so bleiben alte Hashes prüfbar, auch wenn `SCRYPT` oben einmal steigt.
- `vergleichsHash` (function) – Ein Hash, gegen den geprüft wird, wenn es den Namen gar nicht gibt.

### backend/src/anmeldung/konten.js

*35 Zeilen*

Konten anlegen und zählen.

Konten gehören der ganzen Runde, nicht einer Kampagne. Was man mit ihnen
tun darf – einladen, Rollen vergeben, löschen –, steht in
routes/auth.js; hier liegt nur, was mehr als ein Weg braucht.

**Ausfuhren**

- `nameKey` (const) – Der Vergleichsschlüssel eines Namens: „Leo“, „leo“ und „ Leo “ sind derselbe. Gespeichert in `users.name_key`, dort eindeutig.
- `countUsers` (function) – Wie viele Konten es gibt – null heißt: Der Almanach ist frisch eingerichtet.
- `createUser` (function) – Ein Konto anlegen. Erwartet den schon gerechneten Hash, nicht das Kennwort: Das Rechnen ist asynchron, das Anlegen soll es nicht sein – sonst könnte zwischen „Name frei?“ und „Name belegt“ eine zweite Anfrage denselben Namen einschieben (siehe routes/auth.js, /register).

### backend/src/anmeldung/sitzung.js

*121 Zeilen*

Sitzungen: anmelden, abmelden, wiedererkennen.

*Sitzungen* liegen als Zufallskennzeichen im Cookie, in der Datenbank aber
nur als Hash davon. Wer die Datenbank in die Hände bekäme, könnte sich
damit also trotzdem nicht anmelden.

Zu jeder Sitzung gehört außerdem die gerade gewählte Kampagne
(`auth_sessions.campaign_id`) – sie hängt an der Anmeldung, nicht am
Konto, damit dieselbe Person in zwei Fenstern zwei Kampagnen offen haben
kann.

**Ausfuhren**

- `SESSION_DAYS` (const) – Wie lange eine Anmeldung ohne Besuch hält.
- `createSession` (function) – Neue Sitzung. Gehört das Konto genau einer Kampagne an, ist die gleich gewählt – bei mehreren entscheidet die Person selbst (Kampagnenauswahl nach der Anmeldung), also bleibt campaign_id dann zunächst leer.
- `destroySession` (function) – Eine Anmeldung beenden – und mit ihr die offenen Live-Kanäle dieser Anmeldung. Ohne das Zweite hörte ein abgemeldetes Fenster weiter mit, was am Tisch geschieht, bis jemand es schließt.
- `destroyAllSessions` (function) – Alle Anmeldungen eines Kontos beenden – nach Kennwortwechsel oder Löschen.
- `userForToken` (function) – Wer steckt hinter diesem Anmelde-Kennzeichen – oder niemand?
- `istMitglied` (function) – Ist dieses Konto Mitglied der Kampagne – oder war es das nicht (mehr)? Eine im Papierkorb liegende Kampagne zählt nicht: Wer noch mit ihr in der Sitzung steht, wird zur Auswahl zurückgeschickt.
- `setSessionCampaign` (function) – Trägt die gewählte Kampagne in die laufende Sitzung ein.

### backend/src/anmeldung/waechter.js

*54 Zeilen*

Die Wächter vor den Wegen des Servers.

```
attachUser      – hängt `req.user` und `req.campaignId` an jede Anfrage
requireAuth     – ohne Anmeldung ist Schluss (401)
requireDm       – nur die Spielleitung (403)
requireCampaign – erst eine Kampagne wählen (409)
```

In server.js steht ein Wächter *vor* dem Router eines Zweiges
(`app.use('/api/characters', requireCampaign, …)`) und gilt damit für
jeden Weg darin; innerhalb eines Routers steht `requireDm` vor den
einzelnen Wegen, die nur die Spielleitung gehen darf.

**Ausfuhren**

- `attachUser` (function) – Vor jedem Weg: Wer fragt, und in welcher Kampagne sitzt er gerade?
- `requireAuth` (function) – Ohne Anmeldung ist Schluss: 401 `nicht_angemeldet`.
- `requireCampaign` (function) – Für alles, was am Spieltisch entsteht: ohne gewählte Kampagne (oder ohne weiterhin gültige Mitgliedschaft darin) gibt es hier nichts zu holen.
- `requireDm` (function) – Nur die Spielleitung: 401 ohne Anmeldung, 403 `nur_spielleitung` mit falscher Rolle.
- `isDm` (const) – Führt dieses Konto die Spielleitung? Für Entscheidungen *innerhalb* eines Weges.

## backend/src/

### backend/src/asynchron.js

*16 Zeilen*

Eine Hülle für Wege mit `async`.

Express 4 kennt keine Promises. Wirft ein async-Handler, merkt Express
davon nichts: Die Anfrage bleibt ohne Antwort hängen, bis der Browser
aufgibt, und Node meldet eine unbehandelte Ablehnung. Diese Hülle reicht
den Fehler an `next()` weiter, damit der Fehlerbehandler am Ende von
server.js wie bei jedem anderen Weg antwortet.

```
router.post('/login', asynchron(async (req, res) => { … }));
```

(Express 5 macht das von selbst. Sobald der Almanach umzieht, kann diese
Datei weg.)

**Ausfuhren**

- `asynchron` (const) – Eine Hülle für Wege mit `async`.

### backend/src/auth.js

*38 Zeilen*

Anmeldung und Zutritt: Kennwörter, Sitzungen, Rollen, Kampagnenzugehörigkeit.

Hier liegen die Wächter, die vor fast jedem Weg des Servers stehen:

```
attachUser      – hängt `req.user` und `req.campaignId` an jede Anfrage
requireAuth     – ohne Anmeldung ist Schluss (401)
requireDm       – nur die Spielleitung (403)
requireCampaign – erst eine Kampagne wählen (409)
```

**Das ist der wirkliche Schutz des Almanachs.** Die Oberfläche versteckt
zwar Knöpfe, aber wer die Adresse kennt, kann jeden Weg von Hand
aufrufen. Was hier nicht geprüft wird, ist nicht geschützt.

Diese Datei ist nur der Eingang. Gebaut wird nebenan in `anmeldung/`:

```
anmeldung/kennwort.js  hashen und prüfen (scrypt, zeitgleich verglichen)
anmeldung/sitzung.js   Sitzungen anlegen, beenden, wiedererkennen
anmeldung/keks.js      das Anmelde-Cookie lesen, setzen, löschen
anmeldung/waechter.js  die vier Wächter oben
anmeldung/konten.js    Konten anlegen und zählen
```

Alle Wege holen sich, was sie brauchen, von hier – so bleibt es eine
einzige Adresse, egal wie die Teile dahinter geschnitten sind.

**Ausfuhren**

- `hashPassword` (aus ./anmeldung/kennwort.js)
- `verifyPassword` (aus ./anmeldung/kennwort.js)
- `vergleichsHash` (aus ./anmeldung/kennwort.js)
- `SESSION_DAYS` (aus ./anmeldung/sitzung.js)
- `createSession` (aus ./anmeldung/sitzung.js)
- `destroyAllSessions` (aus ./anmeldung/sitzung.js)
- `destroySession` (aus ./anmeldung/sitzung.js)
- `istMitglied` (aus ./anmeldung/sitzung.js)
- `setSessionCampaign` (aus ./anmeldung/sitzung.js)
- `COOKIE_NAME` (aus ./anmeldung/keks.js)
- `clearSessionCookie` (aus ./anmeldung/keks.js)
- `readCookie` (aus ./anmeldung/keks.js)
- `setSessionCookie` (aus ./anmeldung/keks.js)
- `attachUser` (aus ./anmeldung/waechter.js)
- `isDm` (aus ./anmeldung/waechter.js)
- `requireAuth` (aus ./anmeldung/waechter.js)
- `requireCampaign` (aus ./anmeldung/waechter.js)
- `requireDm` (aus ./anmeldung/waechter.js)
- `countUsers` (aus ./anmeldung/konten.js)
- `createUser` (aus ./anmeldung/konten.js)
- `nameKey` (aus ./anmeldung/konten.js)

### backend/src/beute.js

*109 Zeilen*

Die Beutekiste einer Kampagne: was darin liegt, und wie man es teilt.

Zwei Arten Inhalt, zwei Arten Ablage: Gegenstände sind Zeilen in
`stash_items`, die Münzen dagegen ein einzelner Stand im
Schlüssel-Wert-Speicher (`beute`). Wer „die Kiste“ braucht – der Weg
routes/stash.js, das Kopieren in eine andere Kampagne in uebernehmen.js –,
holt sie hier, damit beide dasselbe unter „Kiste“ verstehen.

Die Rechnung des Teilens steht ebenfalls hier und nicht im Weg: Sie ist
reine Arithmetik ohne Datenbank und damit das, was man als Erstes
nachprüfen will, wenn am Tisch jemand fragt, wo sein Kupferstück blieb.

**Ausfuhren**

- `MUENZEN` (const) – Die Münzsorten, von der größten zur kleinsten.
- `KEINE_MUENZEN` (const) – Ein leerer Beutel mit allen fünf Sorten – eingefroren, damit niemand ihn aus Versehen füllt.
- `MUENZNAME` (const) – Wie die Sorten am Tisch heißen – für die Sätze in der Chronik.
- `rowToItem` (function) – Eine Zeile aus `stash_items` so, wie sie die Oberfläche bekommt (camelCase, Zahlen als Zahlen).
- `muenzen` (const) – Die Münzen, immer mit allen fünf Sorten – auch wenn nie etwas hineinkam.
- `gegenstaende` (const) – Alle Gegenstände in der Kiste dieser Kampagne, in der Reihenfolge, in der sie hineinkamen.
- `kiste` (const) – Die ganze Kiste, so wie sie über den Live-Kanal und `GET /api/stash` geht.
- `inKupfer` (const) – Ein Münzhaufen in Kupfer umgerechnet – die gemeinsame Währung fürs Teilen.
- `ausKupfer` (function) – Kupfer wieder in Münzen fassen – ohne Elektrum, das am Tisch ohnehin niemand haben will.
- `teile` (function) – Beute teilen, so wie es am Tisch wirklich zugeht.

### backend/src/chronicle.js

*144 Zeilen*

Die Chronik der Sitzung.

Der Almanach weiß ohnehin, was am Tisch geschieht – wer würfelt, wer
Schaden nimmt, wann eine neue Runde beginnt, welche Szene aufgelegt wird.
Statt das alles wieder zu vergessen, schreibt er es mit. Am Ende steht ein
Protokoll, das sich lesen lässt wie der Bericht eines Chronisten, der still
am Tisch mitgeschrieben hat.

Es wird nichts gehört und nichts aufgenommen: Grundlage sind allein die
Handlungen, die ohnehin durch den Server laufen.

**Ausfuhren**

- `kindLabel` (const) – Wie eine Art von Eintrag heißt („wurf“ → „Wurf“) – für das Protokoll; Unbekanntes bleibt, wie es ist.
- `offeneSitzung` (function) – Die gerade offene Sitzung dieser Kampagne – oder gar keine.
- `starteSitzung` (function) – Eine Sitzung beginnen – oder die laufende zurückgeben, wenn schon eine offen ist. Ohne Titel heißt sie nach dem Tag („Sitzung vom 3. Mai 2026“).
- `beendeSitzung` (function) – Die offene Sitzung dieser Kampagne schließen; danach beginnt der nächste Eintrag eine neue.
- `log` (function) – Einen Eintrag in die Chronik schreiben.
- `rowToEntry` (function) – Eine Zeile aus `chronicle` so, wie sie die Oberfläche bekommt; `meta` wird aus dem JSON gelesen.

### backend/src/db.js

*77 Zeilen*

Die Datenbank – Herzstück und einzige Stelle, an der Daten liegen.

Diese Datei ist der Eingang dazu und tut selbst fast nichts mehr. Sie
bringt vier Schritte in die richtige Reihenfolge und gibt weiter, was der
Rest des Almanachs braucht:

1. *Öffnen* (datenbank/verbindung.js) – zwei Wege zu SQLite, damit der
   Almanach überall ohne Bastelei läuft.
2. *Anlegen* (datenbank/schema.js) – jede Tabelle, wie sie beim ersten
   Start entsteht.
3. *Nachrüsten* (datenbank/nachruesten.js) – alles, was später dazukam.
   Läuft bei jedem Start, deshalb muss jeder Schritt darin gefahrlos
   wiederholbar sein.
4. *Umziehen* (datenbank/kampagnenwanderung.js) – der eine Schritt, der
   mehr tut als eine Spalte anzufügen.

Die Reihenfolge ist zwingend: Ohne Tabellen keine Spalten, ohne Spalten
kein Umzug.

Alles andere im Almanach holt sich `db` von hier. Wer eine Abfrage
schreibt: `db.prepare(...)` bereitet sie vor, `.get()` holt eine Zeile,
`.all()` alle, `.run()` schreibt. Die Fragezeichen darin sind
Platzhalter – *nie* Werte in die Zeichenkette kleben, sonst steht die Tür
für SQL-Injection offen.

Wer mehr als eine Zeile schreibt, nimmt `transaktion(() => …)` – siehe
datenbank/transaktion.js.

**Ausfuhren**

- `getState` (function) – Einzelwerte, für die eine eigene Tabelle zu viel wäre: welche Szene aufliegt, ob der Vorhang zu ist, in welcher Kampfrunde man steckt, wie viel Gold in der Kiste liegt.
- `setState` (function) – Einen Wert unter `key` für diese Kampagne ablegen (als JSON) und ihn zurückgeben.

### backend/src/dice.js

*98 Zeilen*

Würfelausdrücke auswerten – `2d6+3`, `1w20-1`, `4d8`.

Deutsche und englische Schreibweise sind gleichwertig (W wie Würfel,
d wie die). Gewürfelt wird mit `randomInt` aus dem Krypto-Modul – nicht
weil es hier auf Sicherheit ankäme, sondern weil es gleichmäßig verteilt
ist, anders als das gern gesehene `Math.floor(Math.random() * n)`.

**Ausfuhren**

- `rollDice` (function) – Einen Ausdruck würfeln.
- `rollD20` (const) – Ein einzelner W20 – kryptographisch zufällig, wie jeder Wurf im Almanach.

### backend/src/domaene.js

*41 Zeilen*

Die feste Adresse der Runde.

Ohne feste Adresse leiht sich der Schnelltunnel bei jedem Start eine neue,
und die Runde bekommt vor jedem Spielabend eine andere geschickt. Wer eine
feste hat, trägt sie einmal ein:

```
DOMAENE=www.deinemudda.fun
```

Danach heißt der Almanach für alle immer gleich – gleichgültig, in welchem
Netz der Rechner gerade steht. Getragen wird die Adresse vom *benannten*
Tunnel (`npm run tunnel` mit gesetztem `TUNNEL_TOKEN`); dieser Wert hier ist
nur das, was der Almanach der Runde nennt.

Geschrieben werden darf sie, wie man sie in den Browser tippt: mit oder ohne
`https://`, mit oder ohne Schrägstrich am Ende.

**Ausfuhren**

- `festeAdresse` (function) – Was in `DOMAENE` steht – auf den nackten Namen gebracht.

### backend/src/events.js

*155 Zeilen*

Live-Übertragung an alle offenen Fenster – per Server-Sent Events.

Warum SSE und nicht WebSockets? Es braucht keine zusätzliche Bibliothek,
es ist gewöhnliches HTTP (geht also ohne Sonderbehandlung durch den
Cloudflare-Tunnel) und der Browser baut die Verbindung nach einem
Funkloch von allein wieder auf. Geschrieben wird ohnehin über die
normalen REST-Aufrufe – dieser Kanal trägt nur Änderungen zurück.

**Ausfuhren**

- `addClient` (function) – Ein Fenster an den Kanal hängen.
- `broadcast` (function) – Schickt ein Ereignis an alle passenden Fenster.
- `trenne` (function) – Offene Fenster schließen, auf die die Auswahl passt – alle Angaben müssen zutreffen.
- `presence` (function) – Wer ist gerade in dieser Kampagne am Tisch? Mehrere Fenster einer Person zählen einmal.
- `originClient` (function) – Die auslösende Person schickt ihre Fensterkennung im Kopf `X-Fenster` mit, damit sie ihr eigenes Echo nicht noch einmal einspielt (sichtbar z. B. beim Ziehen einer Figur, die sonst kurz zurückspringt).

### backend/src/kampagnen.js

*88 Zeilen*

Der Papierkorb für Kampagnen.

Gelöscht wird in zwei Schritten. Zuerst wandert eine Kampagne nur in den
Papierkorb: Sie verschwindet aus allen Listen, aber kein Zeichen ihrer
Daten ist fort – ein Fehlgriff kostet so nichts weiter als einen Klick auf
„Wiederherstellen“. Erst nach Ablauf der Frist (oder auf ausdrücklichen
Wunsch) wird wirklich entfernt, was dieser Kampagne allein gehört.

Das ist Absicht: Was hier gelöscht wird, sind Monate an Spielabenden.

**Ausfuhren**

- `FRIST_TAGE` (const) – So lange liegt eine gelöschte Kampagne im Papierkorb, bevor sie endgültig verschwindet.
- `verbleibendeTage` (function) – Wie viele Tage bleiben dieser Kampagne noch im Papierkorb?
- `endgueltigEntfernen` (function) – Alles entfernen, was zu dieser Kampagne gehört – ohne Netz und doppelten Boden.
- `raeumePapierkorb` (function) – Was die Frist überschritten hat, wird geräumt. Läuft beim Start des Servers und jedes Mal, wenn jemand in den Papierkorb sieht – ein eigener Zeitgeber wäre für einen Almanach, der ohnehin selten tagelang durchläuft, Aufwand ohne Gewinn.

### backend/src/klang.js

*142 Zeilen*

Der Klangteppich einer Kampagne: was aufliegt, und wo es gerade steht.

Hier liegt alles, was mehr als ein Weg braucht – die Kartenbibliothek legt
beim Auflegen einer Karte deren Ambiente mit auf, und die Wege in
routes/ambience.js bedienen den Rest. Warum das Gleichschalten ohne
tickenden Server auskommt, steht dort im Kopf.

**Ausfuhren**

- `spotifyAdresse` (function) – Aus dem, was der DM einfügt, eine saubere Spotify-Adresse machen.
- `webAdresse` (function) – Die Adresse zum Anklicken. Sie öffnet die App, wo es eine gibt, sonst den Web-Spieler.
- `rowToKlang` (function) – Eine Zeile aus `ambience` so, wie sie die Oberfläche bekommt – samt Web-Adresse zum Öffnen bei Spotify.
- `holen` (const) – Eine Ambiente aus der Klangbibliothek, roh aus der Datenbank – oder undefined.
- `stelle` (const) – Eine Stelle im Stück, in Sekunden. Vier Stunden sind mehr als genug.
- `aktuellerKlang` (const) – Was in dieser Kampagne gerade aufliegt – oder Stille, wenn nichts.
- `setzeKlang` (function) – Den Klang dieser Kampagne setzen und allen Fenstern der Kampagne mitteilen.
- `klangAuflegen` (function) – Etwas auflegen – aus der Klangbibliothek, oder weil eine Karte aufgelegt wird, die ihre Ambiente mitbringt. Gibt den neuen Stand zurück, oder `null`, wenn es die Ambiente nicht gibt.

### backend/src/server.js

*179 Zeilen*

Der Server: hier läuft alles zusammen.

Diese Datei ist kurz und soll es bleiben. Sie tut vier Dinge:

1. *Vorbereiten* – Umgebung lesen, Datenbank öffnen (durch den Import
   von db.js), Sicherheitskopfzeilen setzen.
2. *Einhängen* – jeden Zweig der API an seinen Weg hängen. Die Zeile
   `app.use('/api/characters', requireCampaign, charactersRouter)`
   ist zugleich die Zugangsregel: Der Wächter steht *vor* dem Router,
   also gilt er für jeden Weg darin.
3. *Ausliefern* – die gebaute Oberfläche aus `backend/public`, samt
   der Regel, dass jede unbekannte Adresse die index.html bekommt
   (das braucht der Router im Browser).
4. *Berichten* – beim Start in Klartext sagen, was los ist: welche
   Datenbank, welcher Datenordner, welche Adressen, was fehlt (das steht
   in start/bericht.js).

Die Reihenfolge der `app.use`-Aufrufe ist keine Geschmacksfrage. Express
arbeitet sie von oben nach unten ab: Der erste, der antwortet, gewinnt.
Deshalb steht der Bilderzweig vor dem allgemeinen JSON-Leser (er braucht
einen größeren Rahmen), und der Fehlerbehandler ganz unten.

### backend/src/sicht.js

*37 Zeilen*

Wer sieht was?

Bis hierher war der Nebel eine Decke, die die Spielleitung von Hand
wegwischt. Das bleibt so – aber in einer *dunklen* Szene kommt eine zweite
Frage dazu: Was kann diese Figur von dort, wo sie steht, überhaupt
wahrnehmen? Eine Zwergin mit Dunkelsicht sieht dreißig Fuß weit ins
Schwarze; der Mensch neben ihr sieht nur so weit, wie die Fackel trägt.

Zwei Dinge, die dieses Modul bewusst *nicht* kann:

1. **Keine Wände.** Licht und Blick gehen hier durch Mauern hindurch. Wer
```
das nicht will, deckt den Nebel eben nicht auf – der von Hand gemalte
Nebel begrenzt jede Sicht und bleibt das Werkzeug der Spielleitung.
```
2. **Kein Unterschied zwischen hell und dämmrig.** Wer in dämmrigem Licht
```
steht, sieht; er würfelt nur mit Nachteil auf Wahrnehmung. Das ist eine
Regel für den Wurf, nicht für den Nebel.
```

Gerechnet wird auf Feldmittelpunkten mit euklidischem Abstand – so, wie die
Regeln einen Radius auf dem Raster auslegen ("alle Felder, deren Mitte
innerhalb liegt"). Das Lineal am Brett misst dagegen die Entfernung
*zwischen zwei Figuren* und zählt Diagonalen einfach; das sind zwei
verschiedene Fragen, und beide werden hier so beantwortet, wie es im
Regelwerk steht.

Diese Datei ist der Eingang; gerechnet wird in `sicht/`:

```
raster.js    Fuß und Felder, Feld einer Figur, Umfang der Karte
sinne.js     Licht, Dunkelsicht, Sichtweiten
felder.js    was die eigenen Figuren zusammen sehen
bitkarte.js  eine Feldmenge als Bitkarte für die Übertragung
```

**Ausfuhren**

- `figurenFeld` (aus ./sicht/raster.js)
- `fussJeFeld` (aus ./sicht/raster.js)
- `inFelder` (aus ./sicht/raster.js)
- `rasterBereich` (aus ./sicht/raster.js)
- `beleuchteteFelder` (aus ./sicht/sinne.js)
- `eigeneSichtweite` (aus ./sicht/sinne.js)
- `sinnesReichweite` (aus ./sicht/sinne.js)
- `szenenSichtweite` (aus ./sicht/sinne.js)
- `sichtFelder` (aus ./sicht/felder.js)
- `alsBitkarte` (aus ./sicht/bitkarte.js)

### backend/src/uebernehmen.js

*37 Zeilen*

Daten von einer Kampagne in eine andere kopieren.

Die Vorbereitung – Karten, Bilder, Bestiarium, Begegnungen, Klang – gehört
ohnehin der ganzen Runde und liegt in jeder Kampagne bereit; dort gibt es
nichts zu kopieren. Was hier hinüberwandert, ist das, was zu *einer*
Geschichte gehört: Charaktere, Handzettel, Szenen und die Beutekiste.

Kopiert wird, nicht verschoben: Was hier liegt, bleibt liegen, und beide
Fassungen gehen danach getrennte Wege. Der Almanach führt auch nicht Buch
darüber, was schon einmal hinüber ist – zweimal kopiert heißt zweimal dort.

Nicht kopiert wird die Geschichte selbst: Würfe, Chat und Chronik gehören
zu den Abenden, an denen sie geschahen, und in einer anderen Kampagne wären
sie eine Fälschung. Ein laufender Kampf ebenso wenig – dafür gibt es
„Kampf als Begegnung sichern“, und Begegnungen liegen der ganzen Runde
bereit.

Diese Datei ist nur der Eingang; gebaut wird in `uebernehmen/`:

```
ziel.js     darf hier hineingelegt werden?
stuecke.js  je Art ein Stück kopieren
arten.js    welche Arten es gibt, in welcher Reihenfolge
alles.js    alles Gewählte auf einmal, und Bescheid an das Ziel
```

**Ausfuhren**

- `zielKampagne` (aus ./uebernehmen/ziel.js)
- `zielPruefen` (aus ./uebernehmen/ziel.js)
- `kopiereCharakter` (aus ./uebernehmen/stuecke.js)
- `kopiereGegenstand` (aus ./uebernehmen/stuecke.js)
- `kopiereMuenzen` (aus ./uebernehmen/stuecke.js)
- `kopiereNotiz` (aus ./uebernehmen/stuecke.js)
- `kopiereSzene` (aus ./uebernehmen/stuecke.js)
- `ARTEN` (aus ./uebernehmen/arten.js)
- `istArt` (aus ./uebernehmen/arten.js)
- `umfang` (aus ./uebernehmen/arten.js)
- `meldeNachZiel` (aus ./uebernehmen/alles.js)
- `uebernimmAlles` (aus ./uebernehmen/alles.js)

### backend/src/umgebung.js

*45 Zeilen*

Die eigene Umgebung aus der Datei `.env` neben dem Almanach.

Im Container stellt Docker die Werte selbst zusammen; auf einem Laptop gibt
es nichts dergleichen. Damit dort nicht vor jedem Spielabend
`DOMAENE=… TUNNEL_TOKEN=… npm start` getippt werden muss, liest der Almanach
beim Start die Datei `.env` ein – dieselbe, aus der auch `docker compose`
schöpft.

Was schon in der Umgebung steht, bleibt stehen: `PORT=3002 npm start`
schlägt also die Datei und nicht umgekehrt.

Dieses Modul gehört als **erstes** importiert – die Werte müssen dastehen,
bevor ein anderes sie liest (der Datenordner etwa wird beim Laden der
Datenbank gebraucht, nicht erst beim ersten Zugriff).

**Ausfuhren**

- `umgebung` (const) – Was beim Laden der .env herauskam – für die Meldung beim Start (start/bericht.js).

### backend/src/werte.js

*57 Zeilen*

Aus dem, was eine Anfrage mitbringt, saubere Werte machen.

Der Server glaubt dem Rumpf einer Anfrage nichts: Eine Zahl kann als
Zeichenkette kommen, eine Liste als Objekt, ein Name als `null`. Jeder Weg
braucht deshalb dieselben kleinen Handgriffe – und die standen bisher in
fünf Dateien je einmal, jeweils leicht anders. Hier stehen sie einmal.

Nichts davon wirft. Was nicht passt, wird zum Ersatzwert; ob ein fehlender
Wert ein Fehler ist (400) oder einfach „bleibt, wie er war“, entscheidet
der Weg selbst.

**Ausfuhren**

- `toNumber` (const) – Eine endliche Zahl – oder der Ersatzwert.
- `zahlOderLeer` (const) – Wie `toNumber`, aber ein leeres Feld bleibt leer (für „RK unbekannt“).
- `clamp` (const) – Zwischen zwei Grenzen halten.
- `istFarbe` (const) – Eine Farbe, wie das Farbwahlfeld des Browsers sie liefert: `#rrggbb`.
- `hatText` (const) – Ein nicht leerer Text – der häufigste Pflichtfeld-Check.
- `texte` (const) – Eine Liste von Texten, alles andere darin fällt heraus. Für Zustände und die Schlagworte der Notizen und des Bestiariums, wo die Texte so bleiben, wie sie eingegeben wurden.
- `schlagworte` (const) – Schlagworte für Karten und Klänge: getrimmt, kurz, leere fallen weg. Enger als `texte`, weil sie als Filterknöpfe in einer Zeile stehen.
- `jetzt` (const) – Der Zeitstempel, den jede Zeile trägt – als ISO-Text, so sortiert er richtig.

## backend/src/datenbank/

### backend/src/datenbank/kampagnenwanderung.js

*116 Zeilen*

Der eine Wanderungsschritt, der mehr tut als eine Spalte anzufügen.

Mit den Kampagnen bekam der Almanach eine Ebene, die es vorher nicht gab.
Ein bestehender Almanach hatte Charaktere, Szenen und eine Beutekiste –
nur keine Kampagne, zu der sie gehören könnten. Dieser Schritt legt sie
an und schreibt alles Vorhandene hinein.

Er läuft **nur einmal**: Sobald eine Kampagne existiert, kehrt er sofort
um. Das ist wichtig, denn aufgerufen wird er bei jedem Start.

Das Heikelste daran steht ganz unten: `app_state` trug seine Werte bisher
unter nacktem Schlüssel („beute“, „szene“). Jetzt gehört die Kampagne
davor. Ohne diesen Umzug stünde die Kiste der Runde nach dem Update
plötzlich leer da – das Gold wäre nicht fort, aber niemand fände es
wieder.

**Ausfuhren**

- `KAMPAGNEN_TABELLEN` (const) – Jede Tabelle, die am Tisch entsteht, bekommt eine `campaign_id`.
- `ruesteKampagnenNach` (function) – Die Spalten anfügen – und, falls nötig, die erste Kampagne bauen.

### backend/src/datenbank/nachruesten.js

*85 Zeilen*

Die Wanderung: was eine bestehende Datenbank nachträglich bekommt.

Der Almanach hat keine Wanderungsdateien mit Nummern, wie man sie aus
größeren Projekten kennt. Er braucht sie auch nicht: Jeder Schritt hier
prüft selbst, ob er nötig ist, und läuft bei *jedem* Start. Daraus folgt
die eine Regel, die man nie brechen darf:

```
**Jeder Schritt muss gefahrlos wiederholbar sein.**
```

`addColumnIfMissing` erfüllt das von selbst. Wer etwas anderes braucht –
Daten umschreiben etwa –, muss selbst dafür sorgen, dass der zweite Lauf
nichts mehr tut (siehe `ersteKampagneSichern` in kampagnenwanderung.js).

Die Reihenfolge der Zeilen ist zugleich die Geschichte des Almanachs:
Konten kamen nach den Charakteren, Bilder nach dem Bestiarium, die
Kampagnen zuletzt.

**Ausfuhren**

- `addColumnIfMissing` (function) – Fügt eine Spalte hinzu, falls eine ältere Datenbank sie noch nicht hat.
- `ruesteNach` (function) – Alle Spalten nachrüsten, die nach der ersten Fassung dazukamen. Läuft bei jedem Start und tut nichts, wo die Spalte schon steht.

### backend/src/datenbank/schema.js

*44 Zeilen*

Das Schema: jede Tabelle des Almanachs, wie sie beim ersten Start
entsteht.

Alles als `CREATE TABLE IF NOT EXISTS` – deshalb braucht eine frische
Installation keinen Einrichtungsschritt und einen bestehenden Almanach
stört das erneute Ausführen nicht.

**Wichtig:** Hier steht nur, wie eine Datenbank *neu* aussieht. Was
später dazukam, muss zusätzlich in nachruesten.js – sonst bekommen
bestehende Almanache die neue Spalte nie. Wer eine Spalte ergänzt,
ergänzt sie an beiden Stellen.

Für Neulinge in SQL: Die Fragezeichen, die anderswo in Abfragen stehen,
gibt es hier nicht – dieses SQL enthält keine Werte, nur Struktur.

Die Tabellen stehen nach Bereichen getrennt in `schema/`. Die Reihenfolge
unten ist die, in der sie angelegt werden; SQLite nimmt einen
Fremdschlüssel auf eine Tabelle, die es noch nicht gibt, zwar hin, aber
wer liest, soll die Vorgängerin schon kennen.

**Ausfuhren**

- `SCHEMA` (const) – Das ganze Schema als ein SQL-Text – für `db.exec` in db.js.

### backend/src/datenbank/transaktion.js

*58 Zeilen*

Ganz oder gar nicht: mehrere Schreibvorgänge als ein Block.

Wo ein Weg mehr als eine Zeile schreibt – ein Konto samt erster Kampagne,
eine Kampagne samt zwölf Vorlagen, eine Auszahlung an fünf Blätter –, darf
ein Fehler auf halber Strecke keinen halben Stand hinterlassen. Der wäre
schwerer zu beheben als ein klarer Fehlschlag: ein Konto ohne Kampagne,
Gold, das aus der Kiste verschwunden, aber nie angekommen ist.

Warum `SAVEPOINT` und nicht `BEGIN`: Ein SAVEPOINT außerhalb einer
Transaktion verhält sich wie `BEGIN`, *innerhalb* einer aber wie ein
Zwischenstand. Damit darf ein Block einen anderen aufrufen – etwa das
Anlegen einer Kampagne das Säen der Vorlagen –, ohne dass SQLite mit
„cannot start a transaction within a transaction“ abbricht. Eine
Transaktions-API, die beide Treiber (node:sqlite und better-sqlite3)
gemeinsam hätten, gibt es nicht; SQL verstehen beide.

**Die Arbeit muss synchron sein.** Ein `await` darin gäbe den Faden an
andere Anfragen ab, und deren Schreibvorgänge landeten mitten in diesem
Block – und würden mit ihm zurückgerollt. Deshalb wird eine zurückgegebene
Promise nicht hingenommen, sondern als Fehler behandelt: lieber laut beim
Entwickeln als still in der Datenbank.

**Ausfuhren**

- `transaktion` (function) – `arbeit` ganz oder gar nicht ausführen – verschachtelbar über SAVEPOINTs.

### backend/src/datenbank/verbindung.js

*87 Zeilen*

Die Datenbank öffnen – und sagen, wo sie liegt.

Warum SQLite und keine „richtige“ Datenbank? Weil der Almanach auf einem
Laptop oder Raspberry Pi einer Spielrunde läuft, nicht in einem
Rechenzentrum. Eine Datei, kein Dienst, kein Kennwort, keine Wartung –
und sichern heißt, eine Datei zu kopieren.

Für Neulinge in SQL: `db.prepare(...)` bereitet eine Abfrage vor,
`.get()` holt eine Zeile, `.all()` alle, `.run()` schreibt. Die
Fragezeichen darin sind Platzhalter, die später gefüllt werden – *nie*
Werte in die Zeichenkette kleben, sonst steht die Tür für SQL-Injection
offen.

**Ausfuhren**

- `dataDir` (const) – Auch nach außen sichtbar: Skripte wie die Sicherung sollen denselben Ordner treffen wie der Server – und ihn nicht aus dem Arbeitsverzeichnis raten müssen, das je nach Aufrufort ein anderer wäre.
- `mediaDir` (const) – Der Ordner für hochgeladene Bilder – Karten, Bildnisse, Figuren – neben der Datenbank.

## backend/src/datenbank/schema/

### backend/src/datenbank/schema/chat.js

*28 Zeilen*

Der Chat am Tisch.

Eine Zeile mit `to_user_id` ist geflüstert und geht nur an die beiden
Beteiligten (siehe routes/chat.js).

Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
steht in ../nachruesten.js und ../kampagnenwanderung.js.

**Ausfuhren**

- `CHAT` (const) – Der Chat am Tisch.

### backend/src/datenbank/schema/chronik.js

*33 Zeilen*

Die Chronik der Sitzungen.

Ein Eintrag gehört zu einer Sitzung und geht mit ihr. Verdeckte Einträge
(`secret`) bekommt die Runde nie zu sehen.

Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
steht in ../nachruesten.js und ../kampagnenwanderung.js.

**Ausfuhren**

- `CHRONIK` (const) – Die Chronik der Sitzungen.

### backend/src/datenbank/schema/grundstock.js

*28 Zeilen*

Die ältesten Tabellen: Charakterblätter und der Spiegel des Kompendiums.

Die Charaktere waren zuerst da – noch vor Konten und Kampagnen. Deshalb
stehen `owner_id`, `shared`, `npc` und `campaign_id` nicht hier, sondern
kommen über datenbank/nachruesten.js und kampagnenwanderung.js dazu.
`api_cache` gehört niemandem: Er hält Antworten der offenen 5e-API vor.

Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
steht in ../nachruesten.js und ../kampagnenwanderung.js.

**Ausfuhren**

- `GRUNDSTOCK` (const) – Die ältesten Tabellen: Charakterblätter und der Spiegel des Kompendiums.

### backend/src/datenbank/schema/indizes.js

*15 Zeilen*

Indizes für die häufigsten Abfragen.

Figuren einer Szene, die jüngsten Würfe, die Einträge einer Sitzung – das
sind die Abfragen, die bei jedem Zug am Tisch laufen.

Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
steht in ../nachruesten.js und ../kampagnenwanderung.js.

**Ausfuhren**

- `INDIZES` (const) – Indizes für die häufigsten Abfragen.

### backend/src/datenbank/schema/kampagnen.js

*32 Zeilen*

Kampagnen und wer darin mitspielt.

Eine Kampagne im Papierkorb erkennt man an `deleted_at` (nachgerüstet in
kampagnenwanderung.js); bis die Frist abläuft, bleibt alles stehen.

Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
steht in ../nachruesten.js und ../kampagnenwanderung.js.

**Ausfuhren**

- `KAMPAGNEN` (const) – Kampagnen und wer darin mitspielt.

### backend/src/datenbank/schema/runde.js

*40 Zeilen*

Die Runde: Konten, Anmeldungen, Einladungen.

Konten gehören der ganzen Runde, nicht einer Kampagne. Eine Sitzung
(`auth_sessions`) trägt nur den Hash ihres Kennzeichens – nie das
Kennzeichen selbst.

Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
steht in ../nachruesten.js und ../kampagnenwanderung.js.

**Ausfuhren**

- `RUNDE` (const) – Die Runde: Konten, Anmeldungen, Einladungen.

### backend/src/datenbank/schema/sammlungen.js

*46 Zeilen*

Die Sammlungen: gespeicherte Begegnungen, Beutekiste, Klangteppich.

Begegnungen und Klänge sind Vorbereitung der ganzen Runde; die Beute
gehört einer Kampagne – ihre Münzen stehen nicht hier, sondern als
Einzelwert `beute` in `app_state`.

Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
steht in ../nachruesten.js und ../kampagnenwanderung.js.

**Ausfuhren**

- `SAMMLUNGEN` (const) – Die Sammlungen: gespeicherte Begegnungen, Beutekiste, Klangteppich.

### backend/src/datenbank/schema/spielleitung.js

*67 Zeilen*

Was die Spielleitung führt: laufender Kampf, Bestiarium, Notizen, Würfe.

`combatants` sind die Kämpfer des *laufenden* Kampfes einer Kampagne;
`library` ist das Bestiarium der ganzen Runde. Würfe (`rolls`) stehen hier,
weil sie wie der Kampf von der Spielleitung verdeckt werden können.

Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
steht in ../nachruesten.js und ../kampagnenwanderung.js.

**Ausfuhren**

- `SPIELLEITUNG` (const) – Was die Spielleitung führt: laufender Kampf, Bestiarium, Notizen, Würfe.

### backend/src/datenbank/schema/spieltisch.js

*80 Zeilen*

Der Spieltisch: Szenen, Karten, Figuren, Bilder, der kleine Schlüssel-Wert-Speicher.

Eine *Karte* (`maps`) ist Vorbereitung und gehört der Runde, eine *Szene*
(`scenes`) ist eine Karte im Spiel und gehört einer Kampagne. Bilder
(`media`) liegen als Dateien neben der Datenbank; hier steht nur der
Verweis darauf. `app_state` hält Einzelwerte je Kampagne – welche Szene
aufliegt, ob der Vorhang zu ist (siehe db.js, getState/setState).

Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
steht in ../nachruesten.js und ../kampagnenwanderung.js.

**Ausfuhren**

- `SPIELTISCH` (const) – Der Spieltisch: Szenen, Karten, Figuren, Bilder, der kleine Schlüssel-Wert-Speicher.

## backend/src/kampf/

### backend/src/kampf/blatt.js

*33 Zeilen*

Trefferpunkte laufen in beide Richtungen.

Schaden, den die Spielleitung im Kampf einträgt, steht sofort auf dem
Charakterblatt – und umgekehrt. Ohne das führte jede Runde zwei Zahlen
für dasselbe, und am Ende des Abends stimmte keine davon.

Es geht nur, wenn der Kämpfer mit einem Blatt verknüpft ist; ein Monster
hat keines, und dann tut diese Funktion nichts.

**Ausfuhren**

- `syncCharakter` (function) – Trefferpunkte auf das verknüpfte Charakterblatt zurückschreiben.

### backend/src/kampf/sicht.js

*58 Zeilen*

Die **zwei Sichten** auf den laufenden Kampf – der Kern des Ganzen.

Die Spielleitung bekommt alle Kämpfer mit allen Werten. Die Runde bekommt

- verborgene Gegner gar nicht,
- bei NSC und Monstern weder Trefferpunkte noch Rüstungsklasse, sondern
  nur einen Zustand („verwundet“, „schwer_verwundet“),
- bei Helden (`pc`) die Trefferpunkte genau – die eigenen wie die der
  Gefährten; wie es um die Gruppe steht, weiß man am Tisch ohnehin,
- Notizen der Spielleitung zu keinem Kämpfer.

Gefiltert wird hier, auf dem Server, nicht in der Oberfläche. Was ein
Spielerfenster nicht wissen soll, bekommt es nicht geschickt – sonst
stünde es im Netzwerkfenster des Browsers, und der Tisch rechnete aus,
wie viel das Ungetüm noch aushält.

**Ausfuhren**

- `encounterView` (function) – Der Kampf so, wie dieses Konto ihn sehen darf: die Spielleitung alles, die Runde ohne Verborgenes, ohne fremde Notizen und mit Monster-TP als Wort.
- `sendeKampf` (function) – Beide Fassungen an alle offenen Fenster schicken.
- `antwort` (function) – Verschicken und dem Fragenden zugleich seine eigene Sicht zurückgeben.

### backend/src/kampf/umwandlung.js

*64 Zeilen*

Zeilen in Objekte – und die kleinen Fragen, die jeder Weg des Kampfes
stellt.

Die Datenbank kennt `max_hp`, der Almanach kennt `maxHp`; hier wird das
eine ins andere übersetzt. Dazu die beiden Rechnungen, die mehr als einmal
gebraucht werden: die Reihenfolge der Kämpfer und der Zustand eines
Kämpfers, wenn die Runde seine Trefferpunkte nicht sehen darf.

**Ausfuhren**

- `TYPEN` (const) – Die drei Arten von Kämpfern: Held, NSC, Monster.
- `meta` (function) – Runde und wer dran ist – das steht im kleinen Schlüssel-Wert-Speicher.
- `rowToCombatant` (function) – Eine Zeile aus `combatants` so, wie sie die Oberfläche bekommt.
- `alleKaempfer` (function) – Nach Initiative absteigend, bei Gleichstand alphabetisch.
- `zustand` (function) – Wie es um einen Kämpfer steht, ohne seine Trefferpunkte zu verraten.
- `holen` (const) – Einen einzelnen Kämpfer holen – aber nur aus der eigenen Kampagne.

## backend/src/routes/

### backend/src/routes/ambience.js

*188 Zeilen*

Der Klangteppich.

Hier liegen Spotify-Adressen, sonst nichts – kein Ton geht je durch diesen
Server. Er sammelt, was die Spielleitung vorbereitet hat, sagt der Runde,
was gerade dran ist, und gibt den Takt vor: läuft es gerade, und an welcher
Stelle. Abgespielt wird in den Browsern der Runde, von Spotify selbst.

Die Sammlung gehört der ganzen Runde: Dieselbe Tavernenmusik passt in jede
Geschichte. Was gerade aufliegt, gilt dagegen nur für die eine Kampagne –
sonst wechselte der anderen Runde mitten im Spiel die Musik.

Drei Felder tragen das Gleichschalten, und ihr Zusammenspiel ist der Kern:

```
`spielt`    Soll gerade Musik laufen?
`position`  An welcher Stelle des Stückes, in Sekunden.
`stand`     Wann `position` gemessen wurde.
```

Aus den letzten beiden rechnet jedes Fenster selbst aus, wo es stehen
müsste: `position + (jetzt − stand)`. Deshalb muss der Server nichts
ticken lassen und nichts nachschicken – ein Fenster, das eine Minute
später dazukommt, findet die Stelle von allein.

Was der Almanach dabei *nicht* tut: Er verlangt kein Spotify-Konto, keinen
Entwicklerschlüssel und keine Freischaltliste. Das geht, weil die Runde
Spotifys eigenen Einbettungsspieler benutzt (siehe
frontend/src/components/klang/Klangspieler.jsx). Der Preis dafür steht
dort: ohne angemeldetes Premium-Konto im selben Browser gibt es
30-Sekunden-Ausschnitte statt ganzer Stücke.

### backend/src/routes/auth.js

*40 Zeilen*

Die Wege rund um Konten: anmelden, abmelden, einrichten, einladen,
verwalten.

Diese Datei hängt nur drei Teilwege hintereinander:

```
konten/anmeldung.js    anmelden, abmelden, einrichten, Kennwort
konten/verwaltung.js   Konten der Runde verwalten [SL]
konten/einladungen.js  Einladungscodes [SL]
```

Gemeinsames steht in konten/regeln.js, die Anmeldebremse in
konten/drossel.js.

Drei Dinge, die hier anders sind als überall sonst im Almanach:

- *Das erste Konto führt die Spielleitung.* Nicht weil jemand es
  auswählt, sondern weil es das erste ist. Danach braucht jedes weitere
  einen Einladungscode; ohne den stünde ein Almanach, der im Netz
  erreichbar ist, jedem offen, der die Adresse kennt.
- *Die Anmeldung wird gedrosselt.* Nach zu vielen Fehlversuchen je
  Absender und Name ist für eine Weile Schluss (429). Das macht das
  Durchprobieren von Kennwörtern aussichtslos, ohne jemanden
  auszusperren, der sich nur vertippt hat.
- *Das erste Konto bekommt gleich eine Kampagne* samt zwölf Vorlagen,
  sonst stünde die frisch eingerichtete Spielleitung vor einem leeren
  Almanach ohne Weg hinein.

### backend/src/routes/campaigns.js

*47 Zeilen*

Kampagnen: anlegen, wechseln, Mitglieder, umbenennen, wegräumen,
übernehmen.

Der Grundsatz dahinter, und er erklärt den ganzen Rest des Almanachs:
**Konten gehören der Runde, alles Gespielte gehört einer Kampagne.**
Dieselben Leute können mehrere Geschichten nebeneinander spielen, ohne
sich neu anzumelden.

Welche Kampagne offen ist, hängt an der **Sitzung**, nicht am Konto
(`auth_sessions.campaign_id`). Dieselbe Spielleitung kann deshalb in zwei
Browserfenstern in zwei Kampagnen sitzen. Wer noch keine gewählt hat,
bekommt auf jedem Spielweg ein 409 `keine_kampagne` – das ist das Tor,
durch das die Oberfläche in ihre Auswahl schickt.

Diese Datei hängt nur vier Teilwege hintereinander:

```
kampagnen/liste.js       auflisten, anlegen, wechseln, umbenennen
kampagnen/mitglieder.js  wer mitspielt [SL]
kampagnen/umzug.js       in eine andere Kampagne kopieren [SL]
kampagnen/papierkorb.js  wegräumen, wiederherstellen, entfernen
```

Über eine Kampagne bestimmt, wer sie angelegt hat (`darfVerwalten`) –
auch keine andere Spielleitung. Gelöscht wird zweistufig: erst in den
Papierkorb, nach 30 Tagen endgültig (siehe ../kampagnen.js).

### backend/src/routes/characters.js

*45 Zeilen*

Charakterblätter: anlegen, lesen, schreiben, zuweisen, kopieren.

Der Server kennt den **Inhalt** eines Blattes nicht. Er nimmt entgegen,
was die Oberfläche als `data` schickt, und gibt es unverändert zurück –
ein JSON-Klumpen in einer Spalte. Das ist Absicht: So lassen sich Felder
am Blatt ergänzen, ohne die Datenbank anzufassen, und ein anderes
Regelsystem braucht keine neue Tabelle.

Was der Server dagegen sehr wohl entscheidet, ist **wer was sehen darf**:

- `npc` – NSC-Blätter sind der Zettel hinter dem Schirm. Sie werden
  *vor* allen anderen Regeln geprüft; auch ein versehentlich als
  „geteilt“ markiertes NSC-Blatt bleibt verborgen.
- `shared` – ein geteiltes Blatt dürfen Mitspieler lesen, nicht ändern.
- `owner_id` – wem das Blatt gehört. Nur die Spielleitung darf das
  ändern.

Diese Datei hängt nur drei Teilwege hintereinander; die Regeln, wer was
sehen und ändern darf, stehen in charaktere/blatt.js:

```
charaktere/lesen.js        Liste, einzelnes Blatt, Verwaltung
charaktere/schreiben.js    anlegen, speichern, zuteilen, löschen
charaktere/abschriften.js  Abschrift hier, Kopie in eine andere Kampagne
```

Eine Besonderheit, die leicht übersehen wird: Wer Trefferpunkte auf dem
Blatt ändert, ändert sie damit auch am verknüpften Kämpfer im Kampf – und
wer die Sinne ändert, verschiebt den Nebel am Spieltisch. Beides steht
unten in `PUT /:id`.

### backend/src/routes/chat.js

*166 Zeilen*

Der Chat am Tisch.

Zwei Arten von Nachrichten, und der Unterschied ist eine Spalte:

```
an alle    to_user_id ist leer – jede und jeder in der Runde liest mit
geflüstert to_user_id trägt ein Konto – nur die beiden Beteiligten
```

Geflüstertes bekommt sonst niemand, auch die Spielleitung nicht. Das ist
Absicht: „flüstern“ soll heißen, was es sagt. Wer als Spielleitung etwas
Geheimes an die Runde geben will, hat dafür die Handzettel – die sind zum
Austeilen gedacht und stehen hinterher in der Chronik.

Wie überall im Almanach entscheidet der Server, wer was bekommt: Eine
geflüsterte Zeile wird gar nicht erst an die übrigen Fenster geschickt.
Gefiltert wird beim Verschicken *und* beim Nachladen – der Live-Kanal
erreicht nur, wer gerade offen hat, das Nachladen jeden, der später
dazukommt.

Nicht in der Chronik: Gerede ist kein Ereignis. Die Chronik soll nach dem
Abend lesbar bleiben, und dafür ist es besser, wenn nicht jede Nachfrage
nach dem Pizzadienst darin steht.

### backend/src/routes/chronicle.js

*40 Zeilen*

Die Wege zur Chronik: Sitzungen, Einträge, Protokoll, Rückblick.

Geschrieben wird die Chronik nicht hier, sondern im Vorbeigehen von
überall her (`chronik.log(...)` in ../chronicle.js). Diese Datei liest
sie und gibt sie heraus – in drei Formen:

- als Liste von Einträgen für die Chronikseite,
- als **Protokoll** in Markdown, zum Ausdrucken oder Weitergeben,
- als **Rückblick**, von einem Sprachmodell erzählt.

Der Rückblick ist die einzige Stelle im ganzen Almanach, an der etwas
nach außen geht, und er ist freiwillig: Ohne Schlüssel in der `.env`
antwortet der Weg, dass die Chronik-KI nicht eingerichtet ist. Ohne ihn
funktioniert alles andere unverändert.

Verdeckte Einträge (`secret`) bekommt ein Spielerfenster nicht – gefiltert
wird in `eintraege()` (chronik/abfragen.js), also an einer einzigen Stelle.

Die drei Teilwege:

```
chronik/sitzungen.js  Sitzungen und eigene Einträge
chronik/protokoll.js  die Sitzung als Markdown
chronik/rueckblick.js der Rückblick eines Sprachmodells
```

### backend/src/routes/compendium.js

*112 Zeilen*

Das Nachschlagewerk – ein Spiegel der offenen D&D-5e-API.

Der Browser fragt nicht selbst dort an, sondern immer über diesen Weg.
Das hat drei Gründe:

1. *Schnelligkeit.* Jede Antwort wird in `api_cache` abgelegt; beim
   zweiten Mal kommt sie ohne Umweg.
2. *Am Spieltisch.* Mit wackligem Netz funktioniert das Nachschlagen
   weiter, solange es einmal geladen war.
3. *Höflichkeit.* Ein fremder Dienst soll nicht für jedes geöffnete
   Fenster erneut angefragt werden.

Die Adresse lässt sich über die Umgebung umstellen, falls die API einmal
umzieht oder jemand einen eigenen Spiegel betreibt.

### backend/src/routes/dice.js

*145 Zeilen*

Der Würfelbeutel.

Gewürfelt wird **hier**, auf dem Server, nicht im Browser. Das ist der
ganze Sinn der Sache: Ein im eigenen Fenster erzeugtes Ergebnis wäre eine
Behauptung. So steht jeder Wurf mit Namen und Uhrzeit bei allen am Tisch.

Die Spielleitung darf verdeckt würfeln (`secret`). Solche Würfe werden
gar nicht erst an die Runde geschickt und auch beim Nachladen der
Wurfchronik herausgefiltert.

Das Würfeln selbst steht in ../dice.js – hier ist nur der Weg dorthin,
samt Chronikeintrag und Verteilung an den Tisch.

### backend/src/routes/encounter.js

*43 Zeilen*

Die Wege des **laufenden** Kampfes: Initiative, Trefferpunkte, Zustände,
wer dran ist.

Nicht zu verwechseln mit routes/encounters.js (mit s) – das sind die
*vorbereiteten* Begegnungen. Hier geht es um den Kampf, der gerade
stattfindet.

Diese Datei hängt nur noch zwei Teilwege hintereinander; gerechnet und
verschickt wird zwei Ordner weiter:

```
kampf/kaempfer.js   eintragen, ändern, Schaden, Initiative, entfernen
kampf/ablauf.js     eine Runde weiter, zurück, von vorn, Runde holen

../kampf/umwandlung.js  Zeilen in Objekte, Reihenfolge, Zustand
../kampf/sicht.js       die zwei Sichten – der Kern des Ganzen
../kampf/blatt.js       Trefferpunkte zurück aufs Charakterblatt
```

Die Aufteilung hat denselben Grund wie beim Spieltisch: Was die Runde
nicht sehen darf, wird an genau einer Stelle entschieden. Stünde die
Filterung an zwei Stellen, wäre sie an einer davon irgendwann falsch –
und „falsch“ hieße hier: Der Tisch weiß, wie viel das Ungetüm noch
aushält.

### backend/src/routes/encounters.js

*212 Zeilen*

Vorbereitete Begegnungen: „Wache am Stadttor“, „3 Goblins im Hohlweg“ –
einmal zusammengestellt, beliebig oft mit einem Klick in den Kampf gesetzt.

Nicht zu verwechseln mit routes/encounter.js (ohne s), dem *laufenden*
Kampf. Eine Begegnung ist Vorbereitung und geht die Runde nichts an –
deshalb gilt `requireDm` für jeden Weg hier.

Wie das Bestiarium gehören sie der ganzen Runde: „Wache am Stadttor“ lässt
sich in jeder Geschichte stellen. Gestellt wird sie dann aber in genau
einer Kampagne – die Kämpfer, die dabei entstehen, bleiben dort.

### backend/src/routes/library.js

*225 Zeilen*

Das Bestiarium: Statblöcke für Monster und NSC, aus denen mit einem Klick
Kämpfer werden.

Es ist Sache der Spielleitung – die Runde soll die Statblöcke des heutigen
Abends schließlich nicht vorab lesen können. Deshalb gilt `requireDm` für
jeden Weg hier.

Es gehört der ganzen Runde, nicht einer Kampagne: Ein Goblin bleibt ein
Goblin, gleich in welcher Geschichte er auftritt. Was daraus im Kampf wird –
der einzelne Kämpfer mit seinen Trefferpunkten – gehört dagegen zu genau
einer Kampagne.

### backend/src/routes/maps.js

*234 Zeilen*

Die Kartenbibliothek: Battlemaps samt einmal ausgerichtetem Raster.

Der Unterschied zwischen **Karte** und **Szene** ist der Schlüssel zu
dieser Datei:

```
Karte – Vorbereitung. Bild, Raster, Maßstab, Schlagworte, Notizen.
        Ändert sich im Spiel nicht.
Szene – eine Karte *im Spiel*: mit Nebel, Figuren und dem, was der
        Abend daraus macht (siehe routes/spieltisch/).
```

„Auflegen“ holt die zuletzt aus dieser Karte gelegte Szene samt Nebel
zurück; mit `frisch: true` entsteht stattdessen eine neue unter
geschlossenem Nebel. So kann dieselbe Taverne zweimal im Abenteuer
vorkommen, einmal erkundet und einmal nicht.

Karten gehören der ganzen Runde, nicht einer Kampagne: Das Raster einer
Taverne einmal auszurichten genügt, dieselbe Taverne steht in jeder
Geschichte gleich da. Was daraus im Spiel wird – die Szene mit Nebel und
Figuren –, gehört dagegen zu genau einer Kampagne; die eine Runde wischt
der anderen also keinen Nebel weg.

Wird eine Karte gelöscht, räumt dieser Weg auch ihre Bilddateien weg –
aber nur, wenn nichts anderes mehr darauf zeigt.

### backend/src/routes/media.js

*141 Zeilen*

Bilder: hochladen und ausliefern.

Bilder liegen als **Dateien** neben der Datenbank (im Ordner `medien`),
nicht in ihr. Nur der Verweis steht in der Tabelle `media`. Der Grund:
Eine Battlemap hat gern zehn Megabyte, und eine Datenbank, in der
dreihundert davon stecken, lässt sich weder schnell lesen noch bequem
sichern.

Hochgeladen wird als `data:`-URL im JSON-Rumpf statt als multipart-
Formular. Das spart ein zusätzliches Paket auf dem Server, und der
Browser erzeugt so eine URL aus einer ausgewählten Datei von selbst.
Deshalb hat dieser Weg auch einen eigenen, größeren Rahmen (20 MB) und
steht in server.js *vor* dem allgemeinen JSON-Leser.

Bilder gehören der ganzen Runde, nicht einer Kampagne: Dieselbe Karte
soll in jeder Geschichte aufliegen können, ohne ein zweites Mal
hochgeladen zu werden.

### backend/src/routes/notes.js

*148 Zeilen*

Notizen und Handzettel.

Ein und dieselbe Sache in zwei Zuständen, unterschieden durch
`visibility`:

```
'sl'    – geheime Vorbereitung. Ein Spielerfenster bekommt sie nicht
          einmal in der Liste zu sehen.
'runde' – ausgeteilter Handzettel. Steht am Spieltisch im Reiter
          „Handzettel“ und wird in der Chronik vermerkt.
```

Austeilen und Einziehen ist also nur das Umlegen eines Feldes – deshalb
gibt es dafür keinen eigenen Weg, sondern ein gewöhnliches `PUT`.

Notizen gehören zu **einer** Kampagne: Ein Steckbrief passt nicht von
selbst in eine andere Geschichte. Was doch überall gelten soll –
Hausregeln etwa –, lässt sich hinüberkopieren (`/:id/kopieren`).

### backend/src/routes/scenes.js

*46 Zeilen*

Die Wege des Spieltisches: Szenen, Nebel, Figuren, Vorhang, Zeigen.

Diese Datei hängt nur noch vier Teilwege hintereinander. Gebaut werden sie
nebenan in `spieltisch/`, gerechnet und verschickt wird eine Ebene
darunter:

```
spieltisch/szenen.js   anlegen, ändern, auflegen, löschen, Vorhang
spieltisch/nebel.js    Striche setzen, alles verhüllen, alles aufdecken
spieltisch/figuren.js  auslegen, schieben, wegnehmen, aus dem Kampf holen
spieltisch/zeigen.js   der Zeigefinger

../spieltisch/umwandlung.js    Zeilen in Objekte, und die Nachschlagefragen
../spieltisch/sichtbarkeit.js  wer sieht was (die Kernfrage)
../spieltisch/melden.js        wer erfährt wann davon
```

Die Aufteilung ist keine Ordnungsliebe: Die Sichtbarkeit wird auch von
anderen Wegen gebraucht (ein Nebelstrich kann eine Figur aufdecken, ein
geändertes Charakterblatt die Sichtweite ändern), und eine Rechnung, die
an zwei Stellen steht, ist an einer davon irgendwann falsch. In diesem
Fall hieße „falsch“: Die Runde sieht den Hinterhalt.

Die Reihenfolge der vier Teilwege ist dieselbe wie früher im Fluss der
Datei. Bei Express zählt sie: Der erste Weg, dessen Muster passt, gewinnt.

### backend/src/routes/stash.js

*222 Zeilen*

Die Beutekiste: eintragen, verteilen, teilen, auszahlen.

Was die Runde gemeinsam findet, gehört erst einmal allen – und wird am Ende
des Abends geteilt. Beides erledigt der Almanach: Gegenstände und Münzen
liegen in einer gemeinsamen Kiste, die alle sehen und füllen dürfen, und das
Teilen rechnet er aus, statt es dem Tisch zu überlassen (die Rechnung selbst
steht in ../beute.js).

Nur das Auszahlen ist der Spielleitung vorbehalten: Es schreibt in fremde
Charakterblätter.

## backend/src/routes/charaktere/

### backend/src/routes/charaktere/abschriften.js

*64 Zeilen*

Abschriften: dasselbe Blatt noch einmal – in dieser Kampagne oder in einer
anderen.

Kopiert wird, nicht verschoben. Das Blatt hier bleibt, wo es ist, und
beide gehen fortan getrennte Wege.

### backend/src/routes/charaktere/blatt.js

*94 Zeilen*

Ein Charakterblatt zwischen Datenbank und Antwort – und wer es sehen oder
ändern darf.

Hier stehen die Regeln, die jeder Weg der Charaktere braucht:

```
darfSehen       NSC-Blätter nur die Spielleitung; sonst eigene und geteilte
darfBearbeiten  die Spielleitung und wem das Blatt gehört
```

Und die zwei Formen, in denen ein Blatt hinausgeht: vollständig
(`rowToCharacter`) und als Kurzfassung für Listen (`summary`).

**Ausfuhren**

- `rowToCharacter` (function) – Eine Zeile aus `characters` so, wie die Oberfläche sie bekommt – das Blatt als Objekt.
- `summary` (function) – Kurzfassung für Übersichten, Spieltisch und Kampfliste.
- `SELECT` (const) – Jede Abfrage holt den Namen des Besitzers gleich mit.
- `holen` (const) – Ein Blatt dieser Kampagne – eines aus einer fremden gibt es für diesen Weg nicht.
- `darfBearbeiten` (const) – Charaktere ohne Besitzer stammen aus der Zeit vor den Konten – sie gehören der Spielleitung, bis sie jemandem zugewiesen werden.
- `darfSehen` (const) – NSC-Blätter sind der Zettel der Spielleitung hinter dem Schirm: die Werte des Wirts, des Räuberhauptmanns, des Drachen. Sie bleiben dort, auch wenn das Blatt versehentlich als „geteilt“ markiert ist – deshalb wird das hier *vor* allen anderen Regeln geprüft, nicht danach.
- `sinneAus` (function) – Die Sinne aus einem gespeicherten Blatt, ohne dass ein Fehler alles reißt.
- `meldeAenderung` (function) – Den anderen Fenstern der Kampagne die Kurzfassung schicken – dem eigenen nicht.

### backend/src/routes/charaktere/lesen.js

*45 Zeilen*

Blätter lesen: die Liste, ein einzelnes, die Verwaltungsansicht.

Die Liste filtert der Server: Die Runde bekommt ihre eigenen und die
geteilten Blätter, nie ein NSC-Blatt – auch nicht in der Anfrage, sodass
es im Netzwerkfenster des Browsers gar nicht erst auftaucht.

### backend/src/routes/charaktere/schreiben.js

*143 Zeilen*

Blätter anlegen, speichern, zuteilen, löschen.

Das Speichern (`PUT /:id`) ist der häufigste Weg des ganzen Almanachs:
Das Blatt speichert sich 600 ms nach jedem Tastendruck von selbst. Es
zieht zwei Dinge nach sich, die man leicht übersieht – Trefferpunkte
wandern zum verknüpften Kämpfer, und geänderte Sinne verschieben die Sicht
am Spieltisch.

## backend/src/routes/chronik/

### backend/src/routes/chronik/abfragen.js

*24 Zeilen*

Was mehrere Chronik-Wege lesen: die Einträge einer Sitzung und eine
Sitzung dieser Kampagne.

Verdeckte Einträge (`secret`) bekommt ein Spielerfenster nicht – gefiltert
wird in `eintraege()`, also an einer einzigen Stelle. Auch der
KI-Rückblick holt seine Einträge hier, in der Sicht der Runde.

**Ausfuhren**

- `eintraege` (function) – Die Einträge einer Sitzung, je nach Rolle vollständig oder gefiltert.
- `sitzungHolen` (const) – Eine Sitzung dieser Kampagne – eine aus einer fremden gibt es hier nicht.

### backend/src/routes/chronik/protokoll.js

*74 Zeilen*

Das Protokoll: eine Sitzung als lesbarer Markdown-Text.

Zum Ausdrucken, zum Weitergeben, und als Vorlage für den Rückblick eines
Sprachmodells (rueckblick.js). Die Runde bekommt ihr Protokoll ohne die
verdeckten Einträge – dieselbe Filterung wie überall, aus abfragen.js.

**Ausfuhren**

- `protokoll` (function) – Aus den Einträgen ein lesbares Protokoll setzen. Szenenwechsel und Kämpfe beginnen ein neues Kapitel – so liest sich der Abend hinterher als Folge von Stationen und nicht als endlose Liste.

### backend/src/routes/chronik/rueckblick.js

*113 Zeilen*

Der Rückblick: ein Sprachmodell erzählt eine Sitzung nach – freiwillig.

Die einzige Stelle im ganzen Almanach, an der etwas nach außen geht. Ohne
`CHRONIK_KI_URL` in der Umgebung antwortet der Weg nur, dass nichts
eingerichtet ist.

### backend/src/routes/chronik/sitzungen.js

*116 Zeilen*

Sitzungen der Chronik und von Hand nachgetragene Einträge.

Eine Sitzung eröffnet sich beim ersten Eintrag des Abends von selbst
(siehe ../../chronicle.js, `log`); diese Wege sind für alles, was die
Spielleitung ausdrücklich tut – beginnen, beenden, umbenennen, löschen,
etwas nachtragen.

## backend/src/routes/kampagnen/

### backend/src/routes/kampagnen/liste.js

*114 Zeilen*

Die eigenen Kampagnen: auflisten, anlegen, hineinwechseln, umbenennen.

Welche Kampagne offen ist, hängt an der **Sitzung**, nicht am Konto
(`auth_sessions.campaign_id`). Dieselbe Spielleitung kann deshalb in zwei
Browserfenstern in zwei Kampagnen sitzen.

### backend/src/routes/kampagnen/mitglieder.js

*70 Zeilen*

Wer sitzt in welcher Kampagne? – nur für die Spielleitung.

Konten gehören der ganzen Runde; welche davon in einer Kampagne
mitspielen, steht in `campaign_members`. Wer herausgenommen wird, verliert
sofort den Zugang: Seine Sitzung zeigt auf keine Kampagne mehr, und sein
offenes Fenster wird getrennt.

### backend/src/routes/kampagnen/papierkorb.js

*109 Zeilen*

Der Papierkorb: wegräumen, ansehen, wiederherstellen, endgültig entfernen.

Gelöscht wird zweistufig – erst in den Papierkorb, nach der Frist (oder
auf ausdrücklichen Wunsch) endgültig. Beide Schritte verlangen den
abgetippten Namen, und beide darf nur, wer die Kampagne angelegt hat.
Die Regeln dahinter stehen in ../../kampagnen.js.

### backend/src/routes/kampagnen/regeln.js

*35 Zeilen*

Was mehrere Kampagnen-Wege gemeinsam fragen: Taugt der Name? Wer darf
über diese Kampagne bestimmen? Stimmt die abgetippte Bestätigung?

**Ausfuhren**

- `pruefeName` (function) – @returns {string|null} ein Satz, was am Namen nicht stimmt – oder null
- `darfVerwalten` (function) – Wer über diese Kampagne bestimmt: umbenennen, wegräumen, endgültig entfernen.
- `nameBestaetigt` (function) – Der abgetippte Name muss stimmen – Wort für Wort.
- `holen` (const) – Eine Kampagne nach Kennung – auch eine im Papierkorb.

### backend/src/routes/kampagnen/umzug.js

*61 Zeilen*

Umziehen: Daten aus dieser Kampagne in eine andere kopieren.

Gedacht für eine Runde, die in einer neuen Geschichte weiterspielt: die
Helden mitnehmen, die Hausregeln mitnehmen, die Karten stehen ohnehin
bereit. Was dabei wie kopiert wird, steht in ../../uebernehmen.js.

## backend/src/routes/kampf/

### backend/src/routes/kampf/ablauf.js

*139 Zeilen*

Der Ablauf des Kampfes: eine Runde weiter, eine zurück, von vorn – und
die beiden Handgriffe, die eine Runde vorbereiten.

„Eine Runde weiter“ ist mehr als ein Zeiger, der wandert: Am Ende der
Reihe beginnt eine neue Kampfrunde, und rückwärts über den Anfang hinaus
geht es in die vorige zurück. Das steht deshalb einmal in `zug()` und
wird für beide Richtungen benutzt.

### backend/src/routes/kampf/kaempfer.js

*211 Zeilen*

Die Kämpfer selbst: eintragen, ändern, Schaden geben, Initiative setzen,
wieder herausnehmen.

Alles hier ist Sache der Spielleitung – mit einer Ausnahme: Die eigene
Initiative darf auch die Runde selbst eintragen. Wessen Kämpfer welcher
ist, entscheidet der Weg, nicht die Oberfläche.

## backend/src/routes/konten/

### backend/src/routes/konten/anmeldung.js

*166 Zeilen*

Anmelden, abmelden, einrichten, Kennwort wechseln.

Das erste Konto führt die Spielleitung – nicht weil jemand es auswählt,
sondern weil es das erste ist. Danach braucht jedes weitere einen
Einladungscode; ohne den stünde ein Almanach, der im Netz erreichbar ist,
jedem offen, der die Adresse kennt.

### backend/src/routes/konten/drossel.js

*63 Zeilen*

Die Anmeldebremse.

Nach zu vielen Fehlversuchen je Absender und Name ist für eine Weile
Schluss (429). Das macht das Durchprobieren von Kennwörtern aussichtslos,
ohne jemanden auszusperren, der sich nur vertippt hat.

**Ausfuhren**

- `SPERRE_AB` (const) – Ab so vielen Fehlversuchen gibt es 429.
- `drosseln` (function) – Wie viele Fehlversuche stehen für diesen Schlüssel (`Absender|Name`)? Ein abgelaufener Eintrag zählt als null und wird dabei gleich entfernt.
- `fehlversuch` (function) – Einen Versuch verbuchen – vor dem Prüfen, siehe anmeldung.js.
- `erfolg` (function) – Wer richtig lag, fängt wieder bei null an.

### backend/src/routes/konten/einladungen.js

*50 Zeilen*

Einladungscodes: anlegen, auflisten, zurückziehen – nur für die
Spielleitung.

Ein Code gilt genau einmal. Eingelöst wird er beim Einrichten eines
Kontos (anmeldung.js, /register); danach steht bei ihm, wer ihn benutzt
hat.

### backend/src/routes/konten/regeln.js

*59 Zeilen*

Was mehrere Konto-Wege gemeinsam brauchen: Mindestlänge, Namensregel,
Farben neuer Konten, Einladungscodes, die erste Kampagne.

**Ausfuhren**

- `MIN_PASSWORT` (const) – So lang muss ein Kennwort mindestens sein.
- `neuerEinladungscode` (function) – Ein Einladungscode wie `K7PM-3QXA-9FTE`.
- `naechsteFarbe` (function) – Die erste Farbe, die noch kein Konto trägt.
- `pruefeName` (function) – @returns {string|null} ein Satz, was am Namen nicht stimmt – oder null
- `passwortZuKurz` (const) – Die Absage für ein zu kurzes Kennwort – an drei Stellen gleich.
- `letzteSpielleitung` (const) – Ist das hier die einzige Spielleitung? Dann darf sie weder gehen noch absteigen.
- `ersteKampagne` (function) – Die Kampagne, die das allererste Konto vorfindet – samt zwölf Vorlagen.

### backend/src/routes/konten/verwaltung.js

*100 Zeilen*

Die Konten der Runde verwalten – nur für die Spielleitung.

Rolle und Farbe ändern, ein neues Kennwort setzen, ein Konto löschen. Wer
ändert, wer jemand ist, trennt dessen offene Live-Kanäle: Ein Fenster
hält die Rolle vom Moment des Verbindens fest (siehe events.js).

## backend/src/routes/spieltisch/

### backend/src/routes/spieltisch/figuren.js

*169 Zeilen*

Die Figuren auf dem Tisch: auslegen, schieben, wegnehmen, aus dem Kampf
holen.

Das Schieben ist der einzige Weg hier, den auch die Runde gehen darf –
und auch nur für die eigene Figur. Wem welche gehört, entscheidet
`darfBewegen`, nicht die Oberfläche.

### backend/src/routes/spieltisch/nebel.js

*78 Zeilen*

Der Nebel des Krieges: Striche setzen, alles verhüllen, alles aufdecken.

Gespeichert wird der Nebel als JSON-Liste der aufgedeckten Felder
(`["3,4", "3,5", …]`) in `scenes.fog`. Zum Browser wandert er dagegen als
Bitkarte, ein Bit je Feld (siehe ../../sicht.js, `alsBitkarte`) – und ein
einzelner Strich nur als die Felder, die er berührt.

### backend/src/routes/spieltisch/szenen.js

*222 Zeilen*

Die Szenen selbst: anlegen, ändern, auflegen, löschen, kopieren – und der
Vorhang.

Der Vorhang ist der heikelste Weg darin. Zugezogen heißt: Die Runde
bekommt *keine* Szene mehr geschickt, nicht etwa eine, die sie nicht
anzeigt. Was hinter dem Vorhang aufgebaut wird, verlässt den Server nicht.

### backend/src/routes/spieltisch/zeigen.js

*30 Zeilen*

Der Zeigefinger: „Schaut mal hierhin.“

Nichts davon wird gespeichert. Das Ereignis geht hinaus, leuchtet auf den
Schirmen kurz auf und ist danach fort.

Hinter dem Vorhang zeigt die Spielleitung nur sich selbst: Die Runde hat
dort keine Karte, und schon die Stelle eines Zeigefingers verriete, wo auf
dem Brett gerade etwas vorbereitet wird.

## backend/src/sicht/

### backend/src/sicht/bitkarte.js

*31 Zeilen*

Eine Feldmenge als Bitkarte, ein Bit je Rasterfeld, base64 verpackt.

Der Grund ist schlichte Arithmetik. Eine Karte über zweihundert Meter hat
bei einem Meter je Feld 40 000 Felder. Als Liste von `"x,y"` sind das
348 KB – und die Szene geht bei jedem Zug an jede Person neu hinaus, macht
bei fünf Spielern 1,7 MB für einen Schritt zur Seite. Als Bitkarte sind es
6,5 KB, also das Fünfzigfache weniger, und der Browser liest sie beim Malen
des Nebels sogar schneller als eine Menge.

Die einzelnen Pinselstriche wandern weiterhin als `"x,y"` – ein Strich ist
klein, und dafür lohnt kein Umpacken.

**Ausfuhren**

- `alsBitkarte` (function) – Eine Feldmenge als Bitkarte, ein Bit je Rasterfeld, base64 verpackt.

### backend/src/sicht/felder.js

*96 Zeilen*

Was sehen diese Figuren zusammen? – die eigentliche Sichtrechnung.

Zusammengesetzt aus raster.js (wo steht wer) und sinne.js (wie weit reicht
wessen Blick, was ist beleuchtet). Aufgerufen wird sie an genau einer
Stelle: spieltisch/sichtbarkeit.js.

**Ausfuhren**

- `sichtFelder` (function) – Was sehen diese Figuren zusammen?

### backend/src/sicht/raster.js

*68 Zeilen*

Das Raster in Zahlen: Wie viel Fuß ist ein Feld, auf welchem Feld steht
eine Figur, welche Felder umfasst eine Karte?

Gerechnet wird auf Feldmittelpunkten mit euklidischem Abstand – so, wie
die Regeln einen Radius auf dem Raster auslegen („alle Felder, deren Mitte
innerhalb liegt“). Dieselbe Rechnung steht für den Browser in
frontend/src/lib/rasterkarte.js; beide müssen übereinstimmen, sonst passt
die Bitkarte nicht zum Bild.

**Ausfuhren**

- `fussJeFeld` (function) – Wie viel Spielweite steckt in einem Feld – in Fuß gerechnet?
- `inFelder` (const) – Fuß in Rasterfelder, im Maßstab dieser Karte.
- `figurenFeld` (function) – In welchem Rasterfeld steht der Mittelpunkt dieser Figur?
- `rasterBereich` (function) – Die Rasterfelder, die eine Karte überhaupt umfasst.
- `scheibe` (function) – Alle Felder im Umkreis eines Feldes in eine Menge legen.

### backend/src/sicht/sinne.js

*58 Zeilen*

Licht und Sinne: Was leuchtet, und wie weit reicht ein Blick?

Alle Weiten stehen in Fuß – wie im Regelwerk und auf dem Charakterblatt.
In Felder umgerechnet wird erst mit dem Maßstab der Karte (raster.js).

**Ausfuhren**

- `beleuchteteFelder` (function) – Was leuchtet auf dieser Karte?
- `sinnesReichweite` (function) – Die Sinne einer Figur für die *Dunkelheit*, in Fuß. Was davon zählt, ist das Weiteste: Wer dreißig Fuß Dunkelsicht und zehn Fuß Blindsicht hat, nimmt dreißig Fuß weit wahr, auch ohne jedes Licht.
- `eigeneSichtweite` (const) – Wie weit sieht diese Figur überhaupt, in Fuß – bei genug Licht.
- `szenenSichtweite` (const) – Was die Szene allen aufzwingt, in Fuß – Nebelbank, Schneetreiben, dichter Wald. Das ist die harte Grenze: Auch eine Fackel leuchtet nicht durch Nebel hindurch.

## backend/src/spieltisch/

### backend/src/spieltisch/melden.js

*151 Zeilen*

Den Tisch verkünden: wer erfährt wann, dass sich etwas geändert hat.

Der Unterschied zu allem anderen im Almanach: Hier bekommt **jede Person
eine eigene Fassung**. Eine gezogene Figur kann für die eine sichtbar
werden und für die andere nicht, je nachdem, wo ihre eigenen Figuren
stehen und wie weit sie sehen. Also wird die Sicht je Person gerechnet
und je Person verschickt.

Drei Wege hinaus, vom groben zum feinen:

```
sendeSzene              die ganze Szene an alle – beim Auflegen, beim
                        Vorhang, nach dem Ziehen einer Figur
sendeFigurenWennGeaendert  nur die Figurenliste, und nur wenn sich
                        wirklich etwas geändert hat – nach einem
                        Nebelstrich
meldeFigur              die eine Figur an die Spielleitung, die ganze
                        Szene an die Runde
```

`letzteFiguren` merkt sich je Kampagne und Person, welche Figuren sie zuletzt sah.
Ohne dieses Gedächtnis löste jeder Pinselstrich über schon aufgedecktes
Land eine Runde Figurenlisten aus – bei einem gezogenen Strich hundert
Mal in der Sekunde.

**Ausfuhren**

- `sendeSzene` (function) – Die ganze Szene an alle – jede Person in ihrer eigenen Fassung.
- `sendeFigurenWennGeaendert` (function) – Nach einem Nebelstrich wandert nur die Änderung übers Netz – aber wenn dabei eine Figur auftaucht oder verschwindet, muss auch das ankommen. Gesendet wird nur, wenn sich wirklich etwas geändert hat; ein Pinselstrich über schon aufgedecktes Land soll nicht fünf Figurenlisten auslösen.
- `darfBewegen` (function) – Darf diese Person die Figur bewegen?
- `meldeFigur` (function) – Eine Figur hat sich geändert.
- `aktiviereSzene` (function) – Eine Szene auf den Tisch legen – aus der Szenenliste wie aus der Kartenbibliothek. Mit `verdeckt` geht vorher der Vorhang zu: Dann baut die Spielleitung dahinter auf, und die Runde merkt nichts davon.

### backend/src/spieltisch/sichtbarkeit.js

*142 Zeilen*

Wer sieht was? – die Kernfrage des Spieltisches.

Hier entsteht die Antwort *einmal*, und alle Wege des Servers bedienen
sich daraus. Das ist wichtiger, als es klingt: Gäbe es zwei Stellen, an
denen Sicht gerechnet wird, wäre irgendwann eine davon falsch – und in
diesem Fall hieße „falsch“, dass die Runde den Hinterhalt sieht.

Die Regel dahinter: **Was die Runde nicht sehen darf, wird nicht
geschickt.** Nicht ausgeblendet, nicht durchsichtig gemacht – es steht
nicht in der Antwort. Wer im Browser ins Netzwerkfenster schaut, findet
es dort also auch nicht.

Drei Begriffe, die leicht durcheinandergehen:

```
*Nebel* – welche Felder je aufgedeckt wurden. Gehört zur Szene und
bleibt, bis jemand ihn ändert.

*Sicht* – was gerade wirklich zu sehen ist, gerechnet aus Lichtquellen
und den Sinnen der eigenen Figuren. Je Person verschieden, entsteht
neu bei jeder Anfrage, wird nirgends gespeichert (siehe ../sicht.js
für die Geometrie dahinter).

*Vorhang* – ist er zu, bekommt die Runde gar nichts.
```

Nebel und Sicht wandern als **Bitkarte** zum Browser – ein Bit je Feld,
base64 verpackt. Als Liste von `"x,y"` wären es bei einer großen Karte
348 KB je Zug und Person, als Bitkarte 6,5 KB.

**Ausfuhren**

- `sinneJeFigur` (function) – Die Sinne hinter den Figuren. Eine Figur sieht, was ihr Charakterblatt hergibt – Dunkelsicht, Blindsicht und was sonst noch eingetragen ist.
- `figurSichtbar` (function) – Steht diese Figur auf einem Feld, das der Betrachter sehen kann?
- `szenenSicht` (function) – Was von dieser Szene geht an diese Person?
- `meineFiguren` (function) – Die Figuren, die dieser Person gehören.
- `durchAugenVon` (function) – Schaut die Spielleitung gerade durch die Augen einer Figur?

### backend/src/spieltisch/umwandlung.js

*96 Zeilen*

Zwischen Datenbank und Antwort: Zeilen in Objekte, und die immer gleichen
Nachschlagefragen.

Nichts davon entscheidet etwas – hier wird nur umgeformt und geholt.
Deshalb steht es für sich: Wer wissen will, welche Felder eine Szene zum
Browser schickt, muss dafür nicht durch fünfhundert Zeilen Routen.

Die Schreibweisen unterscheiden sich mit Absicht: In der Datenbank heißt
es `grid_size`, im JSON `gridSize`. Diese Datei ist die einzige Stelle,
an der beides aufeinandertrifft.

**Ausfuhren**

- `rowToScene` (function) – Eine Zeile aus `scenes` so, wie sie die Oberfläche bekommt (ohne den Nebel – der geht eigens).
- `offeneFelder` (function) – Die aufgedeckten Felder einer Szene, roh aus der Datenbank.
- `rowToToken` (function) – Eine Zeile aus `tokens` so, wie sie die Oberfläche bekommt.
- `holeSzene` (const) – Eine Szene dieser Kampagne, roh – oder undefined, auch wenn sie einer anderen Kampagne gehört.
- `holeFigur` (const) – Figuren tragen ihre Kampagne nicht selbst – sie hängen an einer Szene, die es bereits tut. Der Verbund verhindert, dass eine Figur aus einer fremden Kampagne über ihre bloße Kennung erreicht werden kann.
- `aktiveSzeneId` (const) – Die Kennung der Szene, die in dieser Kampagne auf dem Tisch liegt – oder null.
- `vorhangZu` (const) – Der Vorhang über dem Spieltisch.
- `figuren` (function) – Alle Figuren einer Szene, in der Reihenfolge, in der sie ausgelegt wurden.

## backend/src/start/

### backend/src/start/bericht.js

*113 Zeilen*

Was der Server beim Start sagt – und wenn er nicht starten kann.

Der Almanach läuft bei den meisten auf einem Gerät, vor dem niemand sitzt.
Was beim Start im Fenster steht, ist deshalb die eine Gelegenheit, Klartext
zu reden: welche Datenbank, welcher Ordner, unter welchen Adressen die
Runde ihn erreicht – und was fehlt, bevor es mitten im Spielabend auffällt.

**Ausfuhren**

- `berichteStart` (function) – Der Bericht, sobald der Server lauscht.
- `portBelegt` (function) – Zwei Almanache auf demselben Port gehen nicht – und das ist gut so.

## backend/src/uebernehmen/

### backend/src/uebernehmen/alles.js

*43 Zeilen*

Alles Gewählte auf einmal kopieren – und der Zielkampagne Bescheid geben.

**Ausfuhren**

- `uebernimmAlles` (function) – Alles Gewählte aus einer Kampagne in eine andere.
- `meldeNachZiel` (function) – Wer drüben gerade ein Fenster offen hat, soll nicht erst neu laden müssen.

### backend/src/uebernehmen/arten.js

*84 Zeilen*

Die Arten, die umziehen können – und in welcher Reihenfolge.

Jede Art weiß, wie sie heißt, wie man alle ihre Stücke einer Kampagne
findet, wie ein einzelnes, und wie man es kopiert.

**Ausfuhren**

- `ARTEN` (const) – Charaktere stehen mit Bedacht vorn: Figuren und getragene Gegenstände suchen drüben ihren gleichnamigen Charakter, und den gibt es nur, wenn er schon dort ist.
- `istArt` (const) – Ist das eine der Arten oben? `Object.hasOwn` und nicht `art in ARTEN`: `in` fände auch „toString“ auf der Prototypkette.
- `umfang` (function) – Was liegt in dieser Kampagne? Für die Frage „was nehme ich mit?“.

### backend/src/uebernehmen/stuecke.js

*162 Zeilen*

Die einzelnen Stücke, die in eine andere Kampagne wandern können – je
eine Funktion für je eine Art.

Jede bekommt die Zeile aus der Quellkampagne und die Kennung des Ziels,
legt drüben eine neue Zeile an und gibt zurück, was sie angelegt hat.
Keine davon öffnet selbst eine Transaktion; das tut, wer mehrere
zusammen kopiert (alles.js).

**Ausfuhren**

- `gleicherCharakter` (function) – Ein Verweis auf einen Charakter, übersetzt in die Zielkampagne.
- `kopiereCharakter` (function) – Ein Charakterblatt.
- `kopiereNotiz` (function) – Ein Handzettel. Ob er ausgeteilt war, zieht mit – drüben ist es ein neuer Abend.
- `kopiereSzene` (function) – Eine Szene samt Figuren und aufgedecktem Nebel.
- `kopiereGegenstand` (function) – Ein Stück aus der Beutekiste. Getragen wird es drüben nur von jemandem gleichen Namens.
- `kopiereMuenzen` (function) – Die Münzen der Kiste – dazugelegt, nicht ersetzt.

### backend/src/uebernehmen/ziel.js

*49 Zeilen*

Die Zielkampagne: Darf hier überhaupt hineingelegt werden?

Jede Kopierroute beginnt mit derselben Vergewisserung – nicht dieselbe
Kampagne, und nur eine, in der die Spielleitung selbst sitzt. Wer nicht
hineinsieht, soll auch nichts hineinlegen können.

**Ausfuhren**

- `zielKampagne` (function) – Darf hier hineingelegt werden?
- `zielPruefen` (function) – Die Zielkampagne aus dem Rumpf der Anfrage, geprüft und in `req.ziel` abgelegt – oder eine Absage. Jede Kopierroute beginnt mit derselben Vergewisserung, also steht sie einmal hier.

## backend/src/vorlagen/

### backend/src/vorlagen/bauen.js

*169 Zeilen*

Aus einem knappen Steckbrief wird ein vollständiges Charakterblatt.

Die Vorlagen in `helden.js` sollen lesbar bleiben – dort steht, was einen
Charakter ausmacht, und nicht, dass achtzehn Fertigkeiten allesamt auf
„nicht geübt“ stehen. Das Auffüllen erledigt diese Datei.

Die Kennungen der Zeilen (Gegenstände, Merkmale, Zauber) werden aus dem
Schlüssel der Vorlage abgeleitet und nicht gewürfelt. So bekommt dieselbe
Vorlage bei jedem Säen dieselben Kennungen – das hält die Oberfläche ruhig
und macht die Prüfung wiederholbar.

**Ausfuhren**

- `FERTIGKEITEN` (const) – Die achtzehn Fertigkeiten, in derselben Reihenfolge wie auf dem Blatt.
- `ATTRIBUTE` (const) – Die Schlüssel der sechs Attribute, in der Reihenfolge des Blattes.
- `blattAus` (function) – Ein Charakterblatt aus dem Steckbrief.

### backend/src/vorlagen/helden.js

*54 Zeilen*

Zwölf fertige Charaktere, wie sie ein Spieler am Abend vor der ersten
Runde angelegt hätte.

Jede Klasse kommt genau einmal vor, jede Spezies genau einmal – die zehn
aus dem Regelwerk von 2024, dazu Halbelf und Halbork aus dem älteren Buch,
damit auch die beiden nicht fehlen. Alle stehen auf Stufe 1 und tragen die
Startausrüstung ihrer Klasse und ihres Hintergrunds.

Gebaut sind sie nach dem Standardwertesatz (15, 14, 13, 12, 10, 8), auf den
der Hintergrund nach den Regeln von 2024 noch +2 und +1 legt. Halbelf und
Halbork bekommen deshalb keine eigenen Attributsboni, sondern nur ihre
Eigenschaften – sonst stünden zwei Blätter besser da als die übrigen zehn.

Wer eine Vorlage übernehmen will, macht eine Abschrift davon und trägt sich
als Spieler ein. Die Vorlage selbst bleibt liegen.

**Ausfuhren**

- `HELDEN` (const) – Die zwölf, in der Reihenfolge, in der sie hinter dem Schirm liegen.

### backend/src/vorlagen/index.js

*65 Zeilen*

Die Vorlagen säen.

Ein frischer Almanach ist leer, und ein leerer Almanach ist schwer zu
beurteilen: Man sieht nicht, was ein Blatt alles trägt, bevor man selbst
eines ausgefüllt hat. Deshalb liegen von Anfang an zwölf fertige Charaktere
hinter dem Schirm – einer je Klasse, einer je Spezies.

Sie liegen als **NSC-Blätter**: Die Spielleitung sieht sie, die Runde nicht.
Wer eine Vorlage übernehmen will, macht eine Abschrift davon (*Abschrift*
auf der Übersicht), trägt sich als Besitzerin ein und nimmt sie damit vom
Schirm auf den Tisch. Die Vorlage selbst bleibt liegen.

Gesät wird **genau einmal**. Wer eine Vorlage löscht, hat sie gelöscht – sie
wächst beim nächsten Start nicht nach. Wer sie zurückhaben will, ruft
`npm run vorlagen` auf.

**Ausfuhren**

- `VORLAGEN` (const) – Die zwölf Vorlagen, fertig als Charakterblatt.
- `saeVorlagen` (function) – Legt die Vorlagen in einer Kampagne an, sofern das dort noch nie geschehen ist. Eine Kampagne ist die neue „frische Installation“: Jede neu angelegte Kampagne bekommt ihre eigenen zwölf Vorlagen, unabhängig davon, was in anderen Kampagnen liegt oder schon gelöscht wurde.

## backend/src/vorlagen/helden/

### backend/src/vorlagen/helden/barbar-goliath.js

*158 Zeilen*

Vorlage: Kaskar Steinatem – Barbar, Goliath.

Einer der zwölf fertigen Charaktere, die jede neue Kampagne hinter dem
Schirm vorfindet (siehe ../helden.js für die Auswahl und ../index.js fürs
Säen). Hier steht nur der Steckbrief – was diesen Charakter ausmacht.
Zum vollständigen Blatt mit allen achtzehn Fertigkeiten und leeren
Feldern macht ihn erst ../bauen.js.

### backend/src/vorlagen/helden/barde-halbelf.js

*223 Zeilen*

Vorlage: Lysandre Abendlied – Barde, Halbelf.

Einer der zwölf fertigen Charaktere, die jede neue Kampagne hinter dem
Schirm vorfindet (siehe ../helden.js für die Auswahl und ../index.js fürs
Säen). Hier steht nur der Steckbrief – was diesen Charakter ausmacht.
Zum vollständigen Blatt mit allen achtzehn Fertigkeiten und leeren
Feldern macht ihn erst ../bauen.js.

### backend/src/vorlagen/helden/druide-gnom.js

*244 Zeilen*

Vorlage: Fibbel Wurzelbart – Druide, Gnom.

Einer der zwölf fertigen Charaktere, die jede neue Kampagne hinter dem
Schirm vorfindet (siehe ../helden.js für die Auswahl und ../index.js fürs
Säen). Hier steht nur der Steckbrief – was diesen Charakter ausmacht.
Zum vollständigen Blatt mit allen achtzehn Fertigkeiten und leeren
Feldern macht ihn erst ../bauen.js.

### backend/src/vorlagen/helden/hexenmeister-halbork.js

*210 Zeilen*

Vorlage: Mek Halbmond – Hexenmeister, Halbork.

Einer der zwölf fertigen Charaktere, die jede neue Kampagne hinter dem
Schirm vorfindet (siehe ../helden.js für die Auswahl und ../index.js fürs
Säen). Hier steht nur der Steckbrief – was diesen Charakter ausmacht.
Zum vollständigen Blatt mit allen achtzehn Fertigkeiten und leeren
Feldern macht ihn erst ../bauen.js.

### backend/src/vorlagen/helden/kaempfer-zwerg.js

*153 Zeilen*

Vorlage: Brunhild Erzhammer – Kämpfer, Zwerg.

Einer der zwölf fertigen Charaktere, die jede neue Kampagne hinter dem
Schirm vorfindet (siehe ../helden.js für die Auswahl und ../index.js fürs
Säen). Hier steht nur der Steckbrief – was diesen Charakter ausmacht.
Zum vollständigen Blatt mit allen achtzehn Fertigkeiten und leeren
Feldern macht ihn erst ../bauen.js.

### backend/src/vorlagen/helden/kleriker-aasimar.js

*249 Zeilen*

Vorlage: Seraphine Morgenlicht – Kleriker, Aasimar.

Einer der zwölf fertigen Charaktere, die jede neue Kampagne hinter dem
Schirm vorfindet (siehe ../helden.js für die Auswahl und ../index.js fürs
Säen). Hier steht nur der Steckbrief – was diesen Charakter ausmacht.
Zum vollständigen Blatt mit allen achtzehn Fertigkeiten und leeren
Feldern macht ihn erst ../bauen.js.

### backend/src/vorlagen/helden/magier-mensch.js

*289 Zeilen*

Vorlage: Aldric Fenn – Magier, Mensch.

Einer der zwölf fertigen Charaktere, die jede neue Kampagne hinter dem
Schirm vorfindet (siehe ../helden.js für die Auswahl und ../index.js fürs
Säen). Hier steht nur der Steckbrief – was diesen Charakter ausmacht.
Zum vollständigen Blatt mit allen achtzehn Fertigkeiten und leeren
Feldern macht ihn erst ../bauen.js.

### backend/src/vorlagen/helden/moench-halbling.js

*147 Zeilen*

Vorlage: Pip Sommerfeld – Mönch, Halbling.

Einer der zwölf fertigen Charaktere, die jede neue Kampagne hinter dem
Schirm vorfindet (siehe ../helden.js für die Auswahl und ../index.js fürs
Säen). Hier steht nur der Steckbrief – was diesen Charakter ausmacht.
Zum vollständigen Blatt mit allen achtzehn Fertigkeiten und leeren
Feldern macht ihn erst ../bauen.js.

### backend/src/vorlagen/helden/paladin-drachenbluetiger.js

*178 Zeilen*

Vorlage: Vaskir Goldschuppe – Paladin, Drachenblütiger.

Einer der zwölf fertigen Charaktere, die jede neue Kampagne hinter dem
Schirm vorfindet (siehe ../helden.js für die Auswahl und ../index.js fürs
Säen). Hier steht nur der Steckbrief – was diesen Charakter ausmacht.
Zum vollständigen Blatt mit allen achtzehn Fertigkeiten und leeren
Feldern macht ihn erst ../bauen.js.

### backend/src/vorlagen/helden/schurke-tiefling.js

*170 Zeilen*

Vorlage: Zaira Kesselflick – Schurke, Tiefling.

Einer der zwölf fertigen Charaktere, die jede neue Kampagne hinter dem
Schirm vorfindet (siehe ../helden.js für die Auswahl und ../index.js fürs
Säen). Hier steht nur der Steckbrief – was diesen Charakter ausmacht.
Zum vollständigen Blatt mit allen achtzehn Fertigkeiten und leeren
Feldern macht ihn erst ../bauen.js.

### backend/src/vorlagen/helden/waldlaeufer-elf.js

*235 Zeilen*

Vorlage: Naelith Silberpfeil – Waldläufer, Elf.

Einer der zwölf fertigen Charaktere, die jede neue Kampagne hinter dem
Schirm vorfindet (siehe ../helden.js für die Auswahl und ../index.js fürs
Säen). Hier steht nur der Steckbrief – was diesen Charakter ausmacht.
Zum vollständigen Blatt mit allen achtzehn Fertigkeiten und leeren
Feldern macht ihn erst ../bauen.js.

### backend/src/vorlagen/helden/zauberer-ork.js

*226 Zeilen*

Vorlage: Ghorza Sturmader – Zauberer, Ork.

Einer der zwölf fertigen Charaktere, die jede neue Kampagne hinter dem
Schirm vorfindet (siehe ../helden.js für die Auswahl und ../index.js fürs
Säen). Hier steht nur der Steckbrief – was diesen Charakter ausmacht.
Zum vollständigen Blatt mit allen achtzehn Fertigkeiten und leeren
Feldern macht ihn erst ../bauen.js.

## backend/scripts/

### backend/scripts/sicherung.mjs

*70 Zeilen*

Sicherung des Almanachs.

```
node scripts/sicherung.mjs [Zielordner] [--medien] [--behalten=14]
```

Die Datenbank wird *nicht* einfach kopiert. Der Almanach schreibt im
WAL-Verfahren: Eine Kopie mitten im Betrieb erwischt womöglich einen
halben Schreibvorgang und ist beim Zurückspielen wertlos. `VACUUM INTO`
dagegen schreibt einen in sich stimmigen Stand heraus, während die Runde
weiterspielt – und nebenbei einen aufgeräumten, kleineren.

Die Bilder liegen als gewöhnliche Dateien daneben und ändern sich selten;
sie wandern nur mit `--medien` mit. So kann die Datenbank jede Nacht
gesichert werden, ohne jedes Mal alle Karten mitzuschleppen.

### backend/scripts/umbenennen.mjs

*97 Zeilen*

Eine Kampagne umbenennen.

```
node backend/scripts/umbenennen.mjs "Alter Name" "Neuer Name"
node backend/scripts/umbenennen.mjs                 (zeigt alle Namen)
```

In der Oberfläche steht das unter Spielleitung → Runde. Dieses Skript ist
der zweite Weg – für den Fall, dass gerade kein Browser zur Hand ist oder
niemand mehr hineinkommt, der die Kampagne angelegt hat. Es fasst genau
ein Feld an (`campaigns.name`) und sonst nichts.

Der Name ist nirgends sonst gespeichert: Figuren, Szenen und Beute hängen
an der Kennung der Kampagne, nicht an ihrem Namen. Umbenennen ist deshalb
gefahrlos und ändert nichts weiter. Der Server darf dabei ruhig
weiterlaufen – im Browser genügt danach ein Neuladen der Seite.

### backend/scripts/vorlagen.mjs

*24 Zeilen*

Die Vorlagen-Charaktere nachlegen.

Beim ersten Start legt der Almanach sie von selbst an. Wer sie danach
gelöscht hat und zurückhaben will, ruft dieses Skript auf:

```
npm run vorlagen
```

Es fügt nur hinzu, was fehlt. Eine Vorlage, die noch liegt – und sei sie
längst umgeschrieben –, bleibt unangetastet.
