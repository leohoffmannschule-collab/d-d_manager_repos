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
| `darfBearbeiten` | ebenda | ein Blatt ändern: Spielleitung und Besitzerin |
| `darfBewegen` | `spieltisch/melden.js` | eine Figur ziehen: Spielleitung alle; sonst nur eine sichtbare Figur an einem eigenen Blatt |
| `darfVerwalten` | `routes/kampagnen/regeln.js` | eine Kampagne umbenennen, löschen, wiederherstellen: wer sie angelegt hat |
| eigene Initiative | `routes/kampf/kaempfer.js` | die Initiative der Zeile, die am eigenen Blatt hängt |

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

**Eingeschleuster Text.** React setzt jeden Text als Text, nie als HTML. Wo der Almanach selbst HTML erzeugt – das mitgenommene Blatt, der Drucksatz –, geht jeder Wert durch eine Entschärfung (`esc`), und der eingebettete Datensatz maskiert `<`, damit ein Text im Blatt das Skript nicht beenden kann. Die Stilprobe verbietet `style="…"` und `onclick="…"` in erzeugtem HTML.

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
- **Das Heimnetz.** Im WLAN spricht der Browser den Almanach über `http://` an – unverschlüsselt. Wer im selben Netz mitliest, sieht Kennwörter beim Anmelden. In einem fremden oder offenen WLAN meldet man sich deshalb über die Tunnel-Adresse an (HTTPS), nicht über die örtliche.
- **Die Spielleitung.** Sie sieht alles, was die Runde tut, außer Geflüstertem zwischen zwei anderen – und wer das Gerät betreibt, kann auch das in der Datenbank lesen.
- **Eine Content-Security-Policy** setzt der Almanach bisher nicht. Sie wäre eine zweite Mauer hinter der ersten (React setzt Texte als Texte, erzeugtes HTML ist entschärft); der eingebettete Spotify-Spieler und die Schriften müssten dabei bedacht werden.
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
- dass jede Absage einen Schlüssel trägt.

Kommt ein Weg dazu, kommt eine Prüfung dazu. Die Liste aller Prüfungen steht im Verzeichnis „Prüfnetz“.
