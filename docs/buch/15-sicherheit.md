# Anmeldung, Rollen und Sicherheit

Der Almanach steht, sobald der Tunnel läuft, im offenen Netz. Jeder, der die Adresse kennt, kann die Anmeldeseite sehen und jeden Weg der Schnittstelle von Hand aufrufen. Dieses Kapitel beschreibt, wovor der Almanach sich schützt, wie er das tut – und wovor nicht.

## Wovor geschützt wird

Eine Runde ist kein Bankhaus, aber sie hat etwas zu verlieren: die Arbeit von Monaten, die Geheimnisse der Spielleitung, die Konten ihrer Mitglieder. Die Gefahren, gegen die der Almanach gebaut ist, der Reihe nach:

| Wer | will | Schutz |
|---|---|---|
| **Fremde im Netz**, die die Adresse gefunden haben | hinein | Anmeldung, Einladungscodes, Drossel gegen Durchprobieren |
| **Neugierige am Tisch**, angemeldet und mitspielend | sehen, was hinter dem Schirm liegt | Der Server schickt ihnen nichts, was sie nicht sehen dürfen |
| **Neugierige am Tisch** | tun, was nur die Spielleitung darf | Wächter auf dem Server vor jedem solchen Weg |
| **Andere Webseiten** im selben Browser | im Namen der angemeldeten Spielleitung lesen oder schreiben | keine CORS-Freigabe, `SameSite`-Cookie, kein Einrahmen |
| **Wer die Datenbankdatei erbeutet** | sich damit anmelden | Kennwörter nur als scrypt-Hash, Sitzungen nur als SHA-256-Hash |
| **Wer den Namen erraten will** | wissen, welche Konten es gibt | gleich lange Antwortzeit mit und ohne Konto, eine Meldung für beides |
| **Wer im selben WLAN mitliest** | Kennwort und Cookie abfangen | HTTPS im Heimnetz mit eigenem, beschränktem Zertifikat; `Secure`-Cookie |
| **Eingeschleustes HTML** an einer übersehenen Stelle | Skript im Browser der Runde ausführen | Entschärfung überall, dazu eine Content-Security-Policy ohne `unsafe-inline` |

Nicht geschützt wird gegen jemanden, der am Gerät selbst sitzt oder Zugriff darauf hat (siehe „Was nicht geschützt ist“ am Ende).

## Konten

Ein Konto hat einen Namen (zwei bis vierzig Zeichen, eindeutig ohne Rücksicht auf Groß- und Kleinschreibung und Leerzeichen am Rand), ein Kennwort (mindestens acht Zeichen), eine Rolle und eine Farbe.

**Das erste Konto führt die Spielleitung.** Jedes weitere braucht einen Einladungscode. Beides entscheidet `POST /api/auth/register` in *einem* synchronen Block: erst das Kennwort hashen (mit Pause), dann ohne jede Pause prüfen und schreiben – „gibt es schon Konten?“, „gilt der Code noch?“, „ist der Name frei?“, anlegen, Code als eingelöst vermerken. Andersherum könnten zwei gleichzeitige Anmeldungen beide lesen „noch kein Konto da, ich werde Spielleitung“ oder beide „Einladung noch frei“, bevor die andere geschrieben hat.

**Einladungscodes** haben die Form `K7PM-3QXA-9FTE`: drei Gruppen zu vier Zeichen aus 32 Zeichen ohne `I`, `O`, `0` und `1`, ausgewürfelt mit `crypto.randomInt`. Das sind 32¹² ≈ 10¹⁸ Möglichkeiten – ausreichend gegen Raten, zumal jeder Code nur einmal gilt und die Spielleitung liegengebliebene zurückziehen kann.

### Kennwörter

```
scrypt$16384$8$1$<salz, base64>$<hash, base64>
```

So steht ein Kennwort in `users.password_hash` (`anmeldung/kennwort.js`). **scrypt** mit N = 16384, r = 8, p = 1 und 64 Byte Schlüssellänge, mit 16 Byte Zufallssalz je Kennwort. scrypt steckt in Node selbst – kein bcrypt, das auf dem Pi kompiliert werden müsste. Die Parameter sind so gewählt, dass eine Prüfung auf einem Raspberry Pi 5 rund eine Zehntelsekunde kostet: für die Runde unmerklich, für jemanden, der eine erbeutete Datenbank durchprobiert, teuer.

Die Parameter stehen im gespeicherten Hash selbst. Steigen sie in einer späteren Fassung, bleiben alte Hashes prüfbar.

Gerechnet wird **asynchron**, im Hintergrund-Faden von Node. Die synchrone Fassung hielte für die Zehntelsekunde den ganzen Server an – jeder Live-Kanal, jeder Wurf am Tisch stünde still, solange sich jemand anmeldet, und wer es darauf anlegt, könnte den Server mit Anmeldeversuchen lahmlegen, ohne je ein Kennwort zu treffen.

Verglichen wird mit `timingSafeEqual`, das immer gleich lange braucht. Ein gewöhnlicher Vergleich bricht beim ersten abweichenden Byte ab und verrät über die Antwortzeit, wie viel schon stimmt.

### Namen verraten

Gibt es den Namen nicht, prüft der Server das Kennwort trotzdem – gegen einen **Scheinhash** (`vergleichsHash()`), der einmal ausgewürfelt und dann behalten wird. Ohne ihn käme die Absage für einen unbekannten Namen sofort, die für einen bekannten erst nach der Zehntelsekunde scrypt; die Antwortzeit verriete, welche Namen es gibt. Aus demselben Grund lautet die Meldung in beiden Fällen gleich: „Name oder Passwort stimmt nicht.“

### Die Drossel

Nach **acht Fehlversuchen** in zehn Minuten antwortet `POST /api/auth/login` mit 429 `zu_viele_versuche` (`routes/konten/drossel.js`). Gezählt wird je **Absender und Name** zugleich:

- Eine Sperre nur je Name ließe jeden Fremden die Spielleitung aussperren, indem er ihren Namen achtmal falsch eintippt.
- Eine Sperre nur je Absender träfe hinter einem gemeinsamen Anschluss die ganze Runde.

Gezählt wird **vor** dem Prüfen. Seit die Prüfung asynchron ist, kämen fünfzig *gleichzeitige* Versuche sonst alle an der Bremse vorbei, bevor der erste als Fehlschlag verbucht wäre. Wer richtig liegt, wird danach wieder ausgetragen.

Die Zählung liegt nur im Arbeitsspeicher; ein Neustart vergisst sie. Das ist hinnehmbar: Wer den Server neu starten kann, braucht kein Kennwort zu raten. Damit die Bremse selbst kein Speicherleck wird (wer mit immer neuen Namen rät, legt immer neue Einträge an), räumt sie ab tausend Einträgen die abgelaufenen weg.

## Sitzungen

Eine Anmeldung erzeugt ein Kennzeichen aus 32 Zufallsbytes (`crypto.randomBytes`, als base64url). Es geht als Cookie an den Browser; in `auth_sessions` steht nur sein **SHA-256-Hash**, dazu das Konto, die gewählte Kampagne und zwei Zeitpunkte. Wer die Datenbank in die Hände bekommt, kann sich damit nicht anmelden.

**Wiedererkennen** (`userForToken` in `anmeldung/sitzung.js`): Hash bilden, nachschlagen, Konto dazu holen. Eine Sitzung, deren letzter Besuch länger als **dreißig Tage** zurückliegt, wird dabei gelöscht. Den Zeitpunkt des letzten Besuchs schreibt der Server höchstens einmal je Stunde nach – sonst gäbe es bei jedem Bildaufruf einen Schreibzugriff auf die Speicherkarte.

**Beenden:**

| Anlass | Was endet |
|---|---|
| Abmelden | diese eine Sitzung – andere Geräte bleiben angemeldet |
| eigenes Kennwort ändern | alle Sitzungen des Kontos; das eigene Fenster bekommt gleich eine neue |
| Kennwort durch die Spielleitung oder `npm run kennwort` | alle Sitzungen des Kontos |
| Konto gelöscht | alle (per Fremdschlüssel) |
| dreißig Tage ohne Besuch | diese Sitzung, beim nächsten Versuch |

Jedes Beenden schließt auch die offenen Live-Kanäle dieser Sitzungen (siehe unten).

### Das Cookie

```
Set-Cookie: almanach_sitzung=<kennzeichen>; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000[; Secure]
```

- **`HttpOnly`** – JavaScript kommt nicht an das Kennzeichen. Ein eingeschleustes Skript könnte die Sitzung nicht stehlen. Die Oberfläche merkt sich deshalb nirgends ein Token; sie fragt den Server, wer sie ist.
- **`SameSite=Lax`** – Der Browser schickt das Cookie bei Anfragen, die eine andere Seite auslöst, nicht mit (außer beim schlichten Aufruf eines Links). Eine fremde Seite kann also kein `POST` an den Almanach schicken, das als die angemeldete Spielleitung ankommt.
- **`Secure`** – nur, wenn die Anfrage nachweislich über HTTPS kam (`req.secure`). Über den Tunnel ist das so; im Heimnetz über `http://` darf das Merkmal nicht gesetzt werden, sonst nähme der Browser das Cookie gar nicht an.
- **`Max-Age`** – dreißig Tage, wie die Sitzung.

Das Cookie wird ohne Paket gelesen (`anmeldung/keks.js`). Ein kaputt kodierter Wert (`%E0`) gilt als „nicht angemeldet“, statt die Anfrage mit einem 500 scheitern zu lassen – der Leser läuft vor *jeder* Anfrage.

### Wem glaubt der Server „HTTPS“?

`req.secure` ist wahr, wenn die Anfrage über HTTPS kam – oder wenn ein Zwischenschritt, dem Express vertraut, das im Kopf `X-Forwarded-Proto` behauptet. Wem vertraut wird, stellt `TRUST_PROXY` ein (`server.js`):

- **`loopback`** (Vorgabe): Nur ein Zwischenschritt auf demselben Gerät zählt. Das passt für den Laptop, auf dem `cloudflared` neben dem Almanach läuft.
- **`1`** (in `docker-compose.yml`): Genau ein Zwischenschritt davor zählt – der Tunnel-Container.

Den Kopf selbst zu lesen, hieße jedem zu glauben, der ihn mitschickt. `keks.js` fragt deshalb nur `req.secure`.

Über den eigenen HTTPS-Eingang im Heimnetz (unten) ist `req.secure` ohne Umweg wahr: Dort kommt die Verbindung verschlüsselt beim Almanach selbst an. Wer sich so anmeldet, bekommt ein `Secure`-Cookie – der Browser schickt es danach nie über das unverschlüsselte `http://` zurück.

## HTTPS im Heimnetz

Über den Tunnel ist der Almanach verschlüsselt, denn Cloudflare bringt das Zertifikat mit. Im WLAN dagegen sprach der Browser ihn über `http://192.168.…:3001` an, und wer im selben Netz mitlas, sah beim Anmelden das Kennwort und danach das Sitzungs-Cookie. Für eine Adresse im Heimnetz stellt keine öffentliche Stelle ein Zertifikat aus – also stellt der Almanach es selbst aus, ohne Download, allein mit Node (`npm run zertifikat`, Einrichtung Schritt für Schritt im Einrichtungs-Handbuch).

**Zwei Stufen**, wie bei Werkzeugen der Art von mkcert:

| Zertifikat | Wofür | Wie lange |
|---|---|---|
| Stammzertifikat | eine eigene kleine Ausstellungsstelle; wird einmal auf den Geräten der Runde installiert | zehn Jahre |
| Serverzertifikat | von ihm unterschrieben, für `localhost`, den Namen des Rechners und seine Adressen im Heimnetz | 820 Tage (Apple nimmt höchstens 825 an) |

Ändert sich die Adresse des Geräts, stellt `npm run zertifikat` nur das Serverzertifikat neu aus. An den Geräten ist dann nichts zu tun – sie vertrauen der Ausstellungsstelle, nicht dem einzelnen Zertifikat. Der Startbericht mahnt, wenn eine Adresse fehlt oder das Zertifikat in weniger als 30 Tagen abläuft.

**Beschränkt.** Wer ein Stammzertifikat installiert, vertraut allem, was es unterschreibt. Deshalb darf dieses nur für private Adressen (`10.x`, `172.16–31.x`, `192.168.x`, `127.x`, `169.254.x`) und Heimnetznamen (`localhost`, `*.local`, `*.lan`, `*.home.arpa`, `*.internal`, `*.fritz.box`, den Namen des Rechners und was beim Anlegen eigens genannt wurde) bürgen – eingetragen als *Name Constraints*, als kritisch markiert. Gelangte sein Schlüssel je in falsche Hände, ließe sich damit trotzdem keine Bank und kein Postfach vortäuschen: Der Browser lehnt jedes Zertifikat für einen fremden Namen ab, auch wenn es richtig unterschrieben ist. Der Vertrag prüft das mit einer echten TLS-Verbindung.

**Wo es liegt.** Im Datenordner unter `tls/`: `stamm.crt` und `almanach.crt` (öffentlich), `stamm.key` und `almanach.key` (nur für den Besitzer lesbar, in `.gitignore`). Das Stammzertifikat bietet der Server unter `/almanach-stamm.crt` zum Installieren an. Weil es auch über `http://` kommen kann, nennen Startbericht und `npm run zertifikat` seinen **Fingerabdruck** (SHA-256); iPad und Telefon zeigen ihn beim Installieren an. Stimmen beide überein, ist es das richtige.

**Der alte Eingang bleibt.** Der Almanach lauscht zusätzlich auf Port 3443; der über `http://` auf 3001 bleibt offen, denn der Tunnel spricht ihn an, und wer noch nichts eingerichtet hat, soll nicht vor verschlossener Tür stehen. Die Anmeldeseite weist über `http://` im Heimnetz auf den verschlüsselten Eingang hin, sobald es einen gibt – umgeleitet wird bewusst nicht von selbst: Wer das Stammzertifikat noch nicht installiert hat, stünde sonst vor einer Warnseite, ohne zu wissen, warum.

**Warum eigener Code statt OpenSSL.** Node kann Schlüssel erzeugen und signieren, aber keine Zertifikate ausstellen. OpenSSL liegt nicht auf jedem Rechner (unter Windows fast nie), und ein Paket dafür wäre ein Download mehr. Die Zertifikate sind eine verschachtelte Folge von Feldern in DER-Schreibweise; `backend/src/https/der.js` kann genau die Bausteine schreiben, die gebraucht werden, und nicht mehr. Gelesen und geprüft wird mit Node selbst (`crypto.X509Certificate`).

## Rollen und Wächter

Es gibt zwei Rollen: `sl` und `spieler`. Die Rolle gilt rundenweit. Es muss immer mindestens eine Spielleitung geben; die letzte kann ihre Rolle weder abgeben noch ihr Konto löschen lassen.

Vor den Wegen stehen vier **Wächter** (`anmeldung/waechter.js`):

| Wächter | Antwort, wenn nicht erfüllt | Prüft |
|---|---|---|
| `attachUser` | – | hängt `req.user` und `req.campaignId` an jede Anfrage |
| `requireAuth` | 401 `nicht_angemeldet` | angemeldet? |
| `requireCampaign` | 401 / 409 `keine_kampagne` | angemeldet, Kampagne gewählt, noch Mitglied, Kampagne nicht im Papierkorb? |
| `requireDm` | 401 / 403 `nur_spielleitung` | Rolle `sl`? |

Innerhalb der Wege kommen feinere Regeln dazu, die an einer Zeile hängen:

| Regel | Wo | Wer darf |
|---|---|---|
| `darfSehen` | `routes/charaktere/blatt.js` | ein Blatt sehen: Spielleitung alle; sonst kein NSC-Blatt, und nur eigene und geteilte |
| `fuehrtSelbst` | ebenda | ein Blatt als eigenen Helden führen: wem es gehört, solange es nicht hinter dem Schirm liegt |
| `darfBearbeiten` | ebenda | ein Blatt ändern: Spielleitung und wer es selbst führt (`fuehrtSelbst`) |
| `darfBewegen` | `spieltisch/melden.js` | eine Figur ziehen: Spielleitung alle; sonst nur eine sichtbare Figur an einem eigenen Blatt, das nicht hinter dem Schirm liegt |
| `darfVerwalten` | `routes/kampagnen/regeln.js` | eine Kampagne umbenennen, löschen, wiederherstellen: wer sie angelegt hat |
| eigene Initiative | `routes/kampf/kaempfer.js` | die Initiative der Zeile, die am eigenen Blatt hängt – nicht, solange es hinter dem Schirm liegt |
| eigene Sicht | `spieltisch/sichtbarkeit.js` (`meineFiguren`) | durch die Augen der Figuren an eigenen Blättern sehen – ohne die Blätter hinter dem Schirm |

**Ein Blatt hinter dem Schirm behält seine Besitzerin, aber nicht ihre Rechte.** Holt die Spielleitung einen Helden nachträglich hinter den Schirm (`PATCH { npc: true }`), bleibt `owner_id` stehen – sonst wüsste niemand mehr, wem er beim Zurückholen gehört. Damit daraus keine Hintertür wird, fragt jede Regel, die am Besitz hängt, zugleich nach `npc`: Ändern, Figurziehen, Initiative, Sicht. Die Prüfungen dafür stehen im Vertrag (`scripts/vertrag/14-nsc.mjs`): Die Besitzerin bekommt 403 beim Lesen, Speichern, Ziehen und Würfeln, und die Kampfliste zeigt der Runde den Helden nur noch als „verwundet“.

**Die Oberfläche versteckt Knöpfe – das ist Höflichkeit, kein Schutz.** Die Seite „Spielleitung“ leitet eine Spielerin zur Übersicht um (`NurSpielleitung` in `App.jsx`); aber wer den Weg von Hand aufruft, trifft auf den Wächter des Servers. Was dort nicht geprüft wird, ist nicht geschützt.

## Was der Server wem schickt

Der Grundsatz „Was die Runde nicht sehen darf, wird nicht geschickt“ gilt für Antworten auf Anfragen *und* für den Live-Kanal. Die Übersicht:

| Was | Spielleitung | Runde |
|---|---|---|
| NSC-Blätter | alles | nichts – weder in Listen noch einzeln noch über den Live-Kanal |
| fremde, nicht geteilte Blätter | alles | nichts |
| geteilte Blätter | alles | zum Lesen |
| Kämpfer: Helden | alles | Trefferpunkte genau, Notizen der Spielleitung nicht |
| Kämpfer: NSC, Monster | alles | ohne Trefferpunkte und Rüstungsklasse, stattdessen eine Wundenstufe; ohne Notizen |
| verborgene Kämpfer | alles | nichts |
| Szene bei geschlossenem Vorhang | alles | nur `{ vorhang: true }` |
| Figuren im nie aufgedeckten Nebel oder außerhalb der Sicht | alles | nichts |
| verborgene Figuren | alles | nichts |
| Nebel-Pinselstriche | alle | nur für die offen aufliegende Szene |
| Zeigefinger hinter dem Vorhang | der eigene | nichts |
| verdeckte Würfe | alles | nichts – weder live noch in der Wurfchronik noch in der Chronik |
| verdeckte Chronikeinträge | alles | nichts, auch nicht in der Zahl der Einträge |
| Notizen | alle | nur ausgeteilte Handzettel |
| geflüsterte Chatzeilen | nur eigene | nur eigene |
| Bestiarium, Begegnungen, Kartenbibliothek, Klangbibliothek | alles | nichts (Wege nur für `sl`) |
| aufliegender Klang | ja | ja |
| Konten, Einladungen | alles | nichts |

Jede Zeile dieser Tabelle ist im Vertrag geprüft (`scripts/vertrag/`, vor allem die Kapitel 06 Kampf, 07 Gespräch, 10 Sicht, 11 Vorhang, 14 NSC und 18 Review).

## Der Live-Kanal und das Trennen

Ein offener Live-Kanal hält fest, wer beim Verbinden gefragt hat – Konto, Rolle, Kampagne, Sitzung. Nachgeschlagen wird bei den einzelnen Nachrichten nicht mehr (Kapitel „Der Live-Kanal“). Ändert sich, wer jemand ist, muss der Kanal deshalb geschlossen werden, sonst hört das Fenster mit dem alten Stand weiter mit – eine abgesetzte Spielleitung sähe weiter die verdeckten Würfe.

`trenne({ userId, sitzung, campaignId })` in `events.js` schließt alle Kanäle, auf die die Auswahl passt. Gerufen wird es

| bei | mit |
|---|---|
| Abmelden | der Sitzung |
| Kennwortwechsel, Konto gelöscht | dem Konto (über `destroyAllSessions`) |
| Rollenwechsel | dem Konto |
| aus einer Kampagne genommen | Konto und Kampagne |
| Kampagne in den Papierkorb | der Kampagne |

Der Browser verbindet sich danach von selbst neu und bekommt den neuen Stand – oder, ohne gültige Sitzung, eine Absage; dann fragt die Oberfläche nach, ob sie noch angemeldet ist und eine Kampagne gewählt hat, und schickt zur Anmeldung oder zur Auswahl.

## Der Browser

**Kein CORS.** Oberfläche und Schnittstelle kommen immer aus derselben Quelle: im Betrieb liefert der Server beides aus, beim Entwickeln reicht Vite `/api` an ihn durch. Eine CORS-Freigabe gibt es deshalb nicht – und das ist ein Schutz: Eine Freigabe mit Anmelde-Cookie für beliebige Herkunft, wie sie früher im Code stand, hätte jeder Seite im selben Netz erlaubt, im Namen der angemeldeten Spielleitung zu lesen und zu schreiben. Der Vertrag prüft, dass keine Freigabe zurückkommt.

**Sicherheitskopfzeilen** an jeder Antwort:

| Kopfzeile | Wirkung |
|---|---|
| `X-Content-Type-Options: nosniff` | Der Browser nimmt den angegebenen Typ ernst und rät nicht – ein hochgeladenes „Bild“ wird nicht als Skript ausgeführt. |
| `Referrer-Policy: same-origin` | Die Adresse des Almanachs geht nicht an fremde Seiten, auf die ein Link führt. |
| `X-Frame-Options: SAMEORIGIN` | Keine fremde Seite darf den Almanach in einen Rahmen setzen und darüber einen unsichtbaren Knopf legen („Kampagne endgültig entfernen“). |
| `Content-Security-Policy` | Was der Browser dieser Seite überhaupt erlaubt (siehe unten). |

Alle vier setzt `backend/src/kopfzeilen.js`, auf jede Antwort.

**Die Content-Security-Policy** ist die zweite Mauer hinter der ersten. Rutscht eines Tages doch ein Stück fremdes HTML durch – ein Name mit `<img onerror=…>` an einer Stelle, die jemand übersehen hat –, führt der Browser es trotzdem nicht aus:

```
default-src 'self'; script-src 'self' https://open.spotify.com https://*.spotifycdn.com;
style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self';
frame-src https://open.spotify.com; frame-ancestors 'self'; object-src 'none';
base-uri 'self'; form-action 'self'; manifest-src 'self'; worker-src 'self'
```

Kein `'unsafe-inline'` und kein `'unsafe-eval'`. Das geht, weil im Almanach nichts eingebettet ist: kein Skript im Markup (auch `aussehen.js` ist eine eigene Datei), kein `style`-Attribut, kein `<style>`. Werte, die erst im Browser feststehen – die Lage einer Figur, eine gewählte Farbe –, setzt `lib/laufstil.js` über das CSSOM in ein Laufzeit-Stilblatt; das erlaubt die Richtlinie, denn sie verbietet eingebettetes CSS im Markup, nicht Regeln, die ein erlaubtes Skript setzt. Fremd sind nur Spotifys Einbettungsschnittstelle und ihr Rahmen. Bilder dürfen `data:` sein (Bildnisse stehen so im Blatt) und `blob:` (die Vorschau beim Hochladen). Beim Entwickeln liefert Vite die Oberfläche aus, nicht der Server – dort gilt die Richtlinie nicht.

Geprüft wird die Richtlinie zweifach: Der Vertrag liest die Kopfzeile, und ein Durchgang im Browser (alle Seiten, beide Rollen, Figuren ziehen, Blatt mitnehmen und einlesen) meldete keine einzige Verletzung.

**Eingeschleuster Text.** React setzt jeden Text als Text, nie als HTML. Wo der Almanach selbst HTML erzeugt – das mitgenommene Blatt, der Drucksatz, das Handbuch –, geht jeder Wert durch eine Entschärfung (`esc`); auch der Datensatz am Ende des mitgenommenen Blattes steht so in einem `<template>`, dass kein Text im Blatt ihn beenden kann (`<`, `>` und `&` als JSON-Escapes). Ein Skript enthält die mitgenommene Datei nicht mehr. Die Stilprobe verbietet `style="…"`, `onclick="…"`, `<script>` und `<style>` in erzeugtem HTML – mit einer begründeten Ausnahme (das Stilblatt des mitgenommenen Blattes, Kapitel „Das Blatt: Datenmodell und Ausfuhr“).

**Eingelesene Blattdateien** sind fremde Eingaben, auch wenn sie aus dem eigenen Almanach stammen: Dazwischen hatte sie jemand in der Hand – oder eine KI. Gelesen werden sie im Browser und nur als Daten: Der Datensatz geht durch `JSON.parse`, ausgeführt wird nichts davon. Jeder Wert wird in die Form gebracht, die das Blatt vorgibt; ein Bildnis, das nicht in der Datei selbst steckt oder vom eigenen Server kommt, fällt weg – sonst könnte eine bearbeitete Datei jedes Fenster, das das Blatt öffnet, ein Bild von fremder Adresse laden lassen (und die Content-Security-Policy würde es ohnehin sperren). Der Server prüft danach wie bei jeder Änderung: nur eigene Blätter oder als Spielleitung, nur ein Objekt als Datensatz (`blatt_ungueltig`), geprüft vor dem Schreiben.

**Was eine KI zu sehen bekommt.** Wer sein mitgenommenes Blatt einer KI gibt, gibt es ihrem Anbieter – das ganze Blatt samt Bildnis und Notizen. Kennwörter, Sitzungen, Einladungscodes oder die `.env` stehen nicht in der Datei; sie enthält nur, was auf dem Blatt steht. Das steht so in den Anleitungen für Runde und Spielleitung.

**Hochgeladene Bilder** nur als PNG, JPEG, WebP, GIF oder AVIF – kein SVG, das Skript enthalten kann –, und ausgeliefert mit dem gespeicherten Typ und `nosniff`.

## Der Server

- **SQL** nur mit Platzhaltern. Die wenigen Namen in SQL-Zeichenketten stammen aus festen Listen im Quelltext.
- **Pfade** aus Anfragen werden nie zu Dateipfaden: Bilder werden über ihre Kennung nachgeschlagen, nicht über einen Dateinamen aus der Anfrage. Das Kompendium prüft die fertig aufgelöste Adresse gegen Ausbruch (`..`, auch kodiert).
- **Fremde Kampagnen** sind unerreichbar, weil jede Abfrage im Spiel die Kampagne der Sitzung nennt. Eine erratene Kennung aus einer anderen Kampagne findet nichts.
- **Verweise** (Blatt, Kämpfer, Konto) werden vor dem Schreiben gegen die eigene Kampagne geprüft.
- **Größen** sind begrenzt (Rumpf 2 MB, Bild 12 MB, Chat 2000 Zeichen, Würfelausdruck 200 Zeichen, 100 Würfel, Nebelstrich 4000 Felder).
- **Fehler** verraten nichts: Ein unerwarteter Fehler antwortet mit einem allgemeinen Satz; der Stapelauszug steht nur im Protokoll.

## Betrieb

- Der Container läuft **nicht als root**, sondern als Benutzer `node`.
- Das Tunnel-Kennwort geht über die **Umgebung** an `cloudflared`, nicht über die Befehlszeile: Was im Befehl steht, zeigt `docker ps` jedem, der auf dem Gerät nachsieht.
- Die **`.env`** steht in `.gitignore` und gehört niemandem sonst.
- **Nach außen** geht von sich aus nichts, außer den Anfragen an das Kompendium (nur Pfade von Regeltexten, keine Daten der Runde) und – nur wenn eingerichtet – dem Protokoll einer Sitzung an ein Sprachmodell, ohne verdeckte Einträge.

## Was nicht geschützt ist

Ehrlichkeit gehört zur Sicherheit. Diese Dinge schützt der Almanach nicht, und wer ihn betreibt, sollte es wissen:

- **Das Gerät selbst.** Wer an den Pi oder den Laptop kommt, kommt an die Datenbank – und darin steht alles im Klartext außer Kennwörtern und Sitzungen: Blätter, Notizen, Chronik, geflüsterte Chatzeilen. Die Datenbank ist nicht verschlüsselt. Sicherungen ebenso wenig; wer sie in eine Cloud legt, legt dort die Geheimnisse der Spielleitung ab.
- **Das Heimnetz, solange kein Zertifikat angelegt ist.** Ohne `npm run zertifikat` spricht der Browser den Almanach im WLAN über `http://` an – unverschlüsselt; wer im selben Netz mitliest, sieht Kennwörter beim Anmelden. Mit Zertifikat gibt es den verschlüsselten Eingang (oben), aber der alte bleibt offen: Wer ihn trotzdem benutzt, ist so ungeschützt wie vorher. Der Startbericht sagt, welcher Stand gilt.
- **Die Spielleitung.** Sie sieht alles, was die Runde tut, außer Geflüstertem zwischen zwei anderen – und wer das Gerät betreibt, kann auch das in der Datenbank lesen.
- **Das Stammzertifikat auf den Geräten.** Wer es installiert, vertraut dem Almanach als Ausstellungsstelle – beschränkt auf Heimnetzadressen und -namen. Wer den Datenordner in die Hand bekommt, hat mit `tls/stamm.key` diese Vollmacht; auch deshalb gehört das Gerät geschützt.
- **Zwei-Faktor-Anmeldung, Kennwortregeln** über die Mindestlänge hinaus, eine Sperre des Kontos nach Fehlversuchen (statt nur der Drossel je Absender) – bewusst nicht, weil sie einer Runde von Freunden mehr im Weg stünden als nützten.

## Was geprüft wird

Die Sicherheit des Almanachs ist nur so gut wie ihre Prüfung. Der Vertrag (`npm run vertrag`) prüft unter anderem:

- dass ein zweites Konto ohne Einladung abgewiesen wird und ein Code nur einmal gilt;
- dass die Drossel auch einem Schwall gleichzeitiger Versuche standhält;
- dass ein kaputtes Cookie den Server nicht umreißt;
- dass es keine CORS-Freigabe gibt und der Almanach sich nicht einrahmen lässt;
- dass nach dem Abmelden der Live-Kanal schließt;
- dass die Runde keine NSC-Blätter, keine verborgenen Kämpfer, keine Monster-TP, keine verdeckten Würfe, keinen Nebel hinter dem Vorhang und keine fremden Flüstereien bekommt – in Antworten und über den Live-Kanal;
- dass Spielende nicht tun dürfen, was nur die Spielleitung darf, und keine fremden Figuren ziehen;
- dass Verweise auf Zeilen anderer Kampagnen abgewiesen werden;
- dass das Kompendium sich nicht verlassen lässt;
- dass jede Absage einen Schlüssel trägt;
- dass jede Antwort die Content-Security-Policy trägt, ohne `unsafe-inline`;
- dass `npm run zertifikat` nur private Adressen annimmt, das Serverzertifikat vom Stammzertifikat unterschrieben ist, für einen fremden Namen nicht hält und ein Anmelden über HTTPS ein `Secure`-Cookie ergibt.

Kommt ein Weg dazu, kommt eine Prüfung dazu. Die Liste aller Prüfungen steht im Verzeichnis „Prüfnetz“.
