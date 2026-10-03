# Der Live-Kanal

Am Spieltisch muss alles sofort bei allen ankommen: eine gezogene Figur, ein Wurf, ein Treffer, ein Zettel. Der Live-Kanal ist der Draht dafür – eine offene Verbindung von jedem Fenster zum Server, über die der Server von sich aus schickt, was sich geändert hat. Dieses Kapitel beschreibt beide Enden: `backend/src/events.js` auf dem Server und `frontend/src/lib/live.jsx` im Browser.

## Warum ein Kanal, und warum dieser

Ohne Kanal müsste jedes Fenster den Server regelmäßig fragen, ob es etwas Neues gibt. Bei sechs Leuten am Tisch und einer Frage je Sekunde wären das 360 Anfragen je Minute – und eine gezogene Figur käme trotzdem bis zu einer Sekunde zu spät. Mit einem Kanal schickt der Server, wenn es etwas gibt, und sonst nichts.

Der Almanach benutzt dafür **Server-Sent Events** (SSE): eine gewöhnliche HTTP-Antwort mit dem Typ `text/event-stream`, die nicht endet. Der Server schreibt Zeilen hinein, wann immer er will; der Browser liest sie mit dem eingebauten `EventSource`.

Die Alternative wären WebSockets gewesen – eine Verbindung in beide Richtungen. Der Almanach braucht sie nicht: Geschrieben wird über gewöhnliche Aufrufe, die Rechte, Prüfung und Fehlerbehandlung schon haben. Für den Rückweg genügt eine Einbahnstraße. Und SSE hat drei handfeste Vorteile:

- Es ist gewöhnliches HTTP. Es geht ohne Sonderbehandlung durch den Cloudflare-Tunnel und durch jeden Proxy, der HTTP versteht.
- Es braucht kein Paket – weder auf dem Server noch im Browser.
- Der Browser baut die Verbindung nach einem Abriss **von selbst** wieder auf. Kein eigener Code für Funklöcher.

## Was über den Draht geht

`GET /api/stream` antwortet so (gekürzt, jede Nachricht endet mit einer Leerzeile):

```
HTTP/1.1 200 OK
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache, no-transform
Connection: keep-alive
X-Accel-Buffering: no

retry: 3000

event: willkommen
data: {"clientId":17,"user":{"id":"…","name":"Mara","role":"spieler","color":"#2f6b4f","campaignId":"…"}}

event: anwesenheit
data: [{"id":"…","name":"Leo","role":"sl","color":"#9a2b22","fenster":2},{"id":"…","name":"Mara",…,"fenster":1}]

: ping

event: wurf
data: {"id":"…","userName":"Tom","label":"Heimlichkeit","expression":"1d20+7","total":19,…}

event: kampf
data: {"round":2,"activeCombatantId":"…","combatants":[…]}
```

- **`retry: 3000`** bittet den Browser, nach einem Abriss drei Sekunden zu warten, bevor er neu anklopft.
- **`willkommen`** kommt als Erstes und trägt die **Fensterkennung** (`clientId`). Das Fenster schickt sie ab jetzt bei jedem Aufruf im Kopf `X-Fenster` mit.
- **`anwesenheit`** geht an alle in der Kampagne, sobald jemand kommt oder geht: wer mit einem offenen Fenster am Tisch sitzt, und mit wie vielen.
- **`: ping`** ist eine Kommentarzeile, alle 25 Sekunden. Der Browser übergeht sie; sie hält die Verbindung wach, damit kein Proxy sie für tot hält und schließt.
- Alles andere sind **Ereignisse** mit einem Namen und einem JSON-Inhalt. Welche es gibt, wer sie schickt und wer sie hört, steht im Verzeichnis „Live-Ereignisse“.

Die Kopfzeilen sind nicht zufällig: `no-transform` und `X-Accel-Buffering: no` bitten Zwischenschritte, den Strom nicht zu puffern oder zu verändern – ein puffernder Proxy ließe Ereignisse sekundenlang liegen. Der Server stellt außerdem die Zeitüberschreitung des Sockets ab (`setTimeout(0)`), schaltet Nagle ab (`setNoDelay`) und hält die Verbindung am Leben (`setKeepAlive`).

## Das Ende auf dem Server

### Verbinden

```js
app.get('/api/stream', requireCampaign, (req, res) => {
  req.socket.setTimeout(0);
  req.socket.setNoDelay(true);
  req.socket.setKeepAlive(true);
  addClient(req, res, req.user, req.campaignId);
});
```

Ohne Anmeldung und gewählte Kampagne gibt es keinen Kanal (401 bzw. 409). `addClient()` legt einen Eintrag an – Fensterkennung (eine laufende Nummer), die Antwort, das Konto, die Kampagne, das Sitzungskennzeichen – und legt ihn in eine Menge aller offenen Fenster. Dann schreibt es `retry`, `willkommen`, startet den Herzschlag und schickt allen in der Kampagne die neue Anwesenheit.

Schließt die Verbindung (das Fenster geht zu, das Netz reißt ab, der Server trennt), fällt der Eintrag aus der Menge, der Herzschlag endet, und die Anwesenheit geht neu hinaus. Gelauscht wird dafür am **Antwortstrom**, nicht an der Anfrage: `req` meldet sein `close` je nach Node-Fassung schon, wenn der leere Rumpf gelesen ist, `res` erst, wenn die Verbindung wirklich weg ist.

### Festhalten statt nachschlagen

Konto, Rolle und Kampagne werden **beim Verbinden festgehalten**. Bei jeder Nachricht nachzuschlagen, wer ein Fenster gerade ist, kostete an jedes Fenster eine Datenbankabfrage – bei jeder Figur, jedem Wurf. Festhalten ist billig und verlangt dafür an den wenigen Stellen Disziplin, an denen sich ändert, wer jemand ist: Dort wird getrennt (siehe unten).

### Schicken

```js
broadcast(ereignis, daten, { dmOnly, role, userIds, exceptClient, campaignId });
```

`broadcast()` geht alle offenen Fenster durch und schreibt die Nachricht in jedes, auf das **alle** Angaben passen:

| Angabe | Bedeutung |
|---|---|
| `campaignId` | nur Fenster in dieser Kampagne. Fehlt die Angabe, geht es an die ganze Runde – das ist für rundenweite Ereignisse wie Konten gedacht. |
| `role` | nur Fenster dieser Rolle (`sl` oder `spieler`) |
| `dmOnly` | nur die Spielleitung (älter; dasselbe wie `role: 'sl'`) |
| `userIds` | nur Fenster dieser Konten – für alles, was je Person anders aussieht |
| `exceptClient` | dieses eine Fenster auslassen – den Auslöser |

Ein Schreibfehler an einem einzelnen Fenster (die Verbindung ist gerade weg) wird verschluckt; das Aufräumen übernimmt der `close`-Hörer.

### Das Echo

Wer eine Figur zieht, hat sie schon örtlich gesetzt. Käme die eigene Änderung über den Kanal zurück, spränge die Figur kurz an die Stelle, die der Server zu dem Zeitpunkt kannte – ein Ruckeln, das jede Bewegung begleitet. Deshalb schickt das Fenster seine Kennung mit (`X-Fenster`), der Weg liest sie mit `originClient(req)`, und `broadcast(…, { exceptClient })` lässt genau dieses Fenster aus. Andere Fenster *desselben Kontos* bekommen die Änderung sehr wohl – wer am Tablet zieht, sieht es am Rechner.

Nicht jedes Ereignis lässt den Auslöser aus. Wo die Antwort auf die Anfrage ohnehin alles enthält (der Kampf), ist ein Echo harmlos; wo das Fenster vorgreift (Figuren, Nebel, Beute, Blätter, Chat), wird es ausgelassen.

### Je Person verschieden

Die meisten Ereignisse sehen für alle gleich aus – oder für alle einer Rolle. Die **Szene** nicht: Welche Figuren jemand sieht, hängt davon ab, wo die eigenen Figuren stehen und wie weit sie sehen. `spieltisch/melden.js` rechnet deshalb die Sicht für jede verbundene Person einzeln und schickt jeder ihre eigene Fassung (`userIds: [person.id]`). Die Spielleitung wird dabei nur einmal gerechnet, gleich wie viele Spielleitungen verbunden sind. Wer nicht verbunden ist, bekommt nichts – er holt sich beim Verbinden ohnehin den ganzen Stand.

Nach einem Nebelstrich geht nicht die ganze Szene hinaus, sondern nur der Strich (`nebel`) und, falls sich dadurch für jemanden ändert, welche Figuren er sieht, dessen neue Figurenliste (`figuren`). Damit nicht jeder Strich über schon aufgedecktes Land eine Runde Figurenlisten auslöst, merkt sich der Server je Kampagne und Person, welche Figuren sie zuletzt sah, und schickt nur, wenn sich das ändert.

Beim **Kampf** genügen zwei Fassungen: eine für die Spielleitung, eine für die Runde (`kampf/sicht.js`). Beim **Blatt** entscheidet `blattmeldung.js`, wer es sehen darf – Spielleitung immer, die Runde nur bei geteilten, die Besitzerin bei ihrem eigenen, niemand aus der Runde bei einem NSC-Blatt.

Ändert sich, *wer* ein Blatt sieht, gehen zwei verschiedene Nachrichten hinaus. Wer es nicht mehr sehen darf – weil es hinter den Schirm wanderte oder nicht mehr geteilt ist –, bekommt `charakter:entfernt` (`meldeEntzug`); die Übersicht nimmt es heraus, ein offenes Blatt sagt „nicht mehr für dich da“ und speichert nicht weiter. Wer es neu sehen darf – etwa, wenn die Spielleitung einen NSC in die Runde holt –, bekommt `charakter:aktualisiert` mit der **vollen Kurzfassung**. Die Übersicht (`useCharaktere` in `lib/daten/kampagne.js`) nimmt ein Blatt, das sie noch nicht kennt, nur dann auf, wenn die Nachricht diese volle Kurzfassung ist (sie trägt `system`); eine Meldung nur mit Trefferpunkten aus dem Kampf oder der Beute ändert nur Einträge, die schon dastehen. Was ein Fenster sehen darf, hat der Server schon entschieden – die Oberfläche muss nicht noch einmal filtern.

### Trennen

```js
trenne({ userId, sitzung, campaignId });
```

schließt alle Fenster, auf die die Auswahl passt – alle Angaben müssen zutreffen, und ohne jede Angabe tut es nichts (alles zu trennen ist nie gemeint). Gerufen wird es beim Abmelden, nach einem Kennwortwechsel, bei einem Rollenwechsel, beim Löschen eines Kontos, beim Herausnehmen aus einer Kampagne und wenn eine Kampagne in den Papierkorb wandert. Das Kapitel „Anmeldung, Rollen und Sicherheit“ erklärt, warum das nötig ist.

## Das Ende im Browser

### Der Anbieter

`LiveProvider` in `lib/live.jsx` öffnet den Kanal, sobald jemand angemeldet ist und eine Kampagne gewählt hat – er steht in `App.jsx` hinter den Toren für Anmeldung und Kampagne. Beim Wechsel der Kampagne baut React den Anbieter neu auf (der `key` am Kampagnentor wechselt), und damit einen neuen Kanal: Sonst hinge der Draht an der alten Kampagne, und der neue Tisch bekäme die Ereignisse des alten.

```js
const quelle = new EventSource('/api/stream');
quelle.addEventListener('willkommen', (e) => {
  const data = JSON.parse(e.data);
  setClientId(data.clientId);   // ab jetzt im Kopf X-Fenster jeder Anfrage
  setConnected(true);
  setGeneration((g) => g + 1);  // siehe unten
});
```

### Horchen

Ein Bauteil hört auf ein Ereignis mit

```js
useLive('wurf', (wurf) => setWuerfe((alt) => [wurf, ...alt]));
```

oder auf mehrere zugleich mit `useLiveAlle(['chronik:sitzung', 'chronik:geaendert'], laden)`.

Zwei Kniffe stecken darin:

1. **Anmelden, sobald jemand horcht.** SSE kennt kein „horche auf alles“: Jeder Ereignisname braucht sein eigenes `addEventListener` an der Quelle. Früher stand dafür eine von Hand gepflegte Liste im Code – und die lief dem Server davon; die Beutekiste und die Chronik standen bei allen anderen still, bis jemand neu lud, weil `beute` und `chronik` nicht in der Liste standen. Jetzt meldet sich jeder Name an der Quelle an, sobald ein Bauteil darauf horcht. Eine Liste, die veralten könnte, gibt es nicht mehr.
2. **Eine feste Hülle, eine wechselnde Funktion.** Die Funktion, die ein Bauteil übergibt, ist bei jedem Rendern eine neue. Sie jedes Mal ab- und wieder anzumelden, wäre teuer. `useLive` meldet deshalb einmal eine feste Hülle an, die immer die jüngste Fassung aus einem `ref` aufruft. So sieht der Zuhörer nie veralteten Zustand, ohne ständiges Ummelden.

Stolpert ein Zuhörer (wirft einen Fehler), fängt der Anbieter das ab und schreibt es in die Konsole. Ein Fehler in der Wurfanzeige soll nicht den halben Tisch anhalten.

### Nichts verpassen: die Generation

Während einer Unterbrechung gesendete Ereignisse sind verloren; SSE hebt nichts auf. Damit trotzdem niemand einen alten Stand behält, zählt der Anbieter bei jeder (neuen) Verbindung einen Zähler hoch, die **Generation**. `useDaten()` in `lib/daten/grundlage.js`, das Fundament aller Datenhaken, lädt bei jeder neuen Generation neu:

```js
useEffect(() => {
  if (generation > 0) laden();
}, [generation, laden]);
```

Das hat zwei Wirkungen: Der erste Ladevorgang geschieht erst, wenn der Draht steht (und nichts zwischen Laden und Verbinden verloren gehen kann), und nach jedem Abriss wird alles nachgezogen, was in der Zwischenzeit geschah.

Weil Nachladen und Live-Ereignisse sich überholen können, zählt `useDaten` außerdem seine Ladevorgänge: Nur der jüngste darf seinen Stand setzen. Sonst gewönne, wer *zuletzt ankommt*, nicht wer zuletzt gefragt hat, und ein alter Stand überschriebe den neuen.

### Abgewiesen

Der Browser baut die Verbindung nach einem Abriss selbst wieder auf – solange der Server nicht ausdrücklich ablehnt. Lehnt er ab (401, weil die Anmeldung weg ist; 409, weil die Kampagne nicht mehr gilt), gibt `EventSource` auf und steht auf `CLOSED`. Der Anbieter erkennt das im `onerror`, fragt dann nach, woran es liegt (Anmeldung und Kampagne neu prüfen), und setzt nach fünf Sekunden selbst neu an. Die Tore in `App.jsx` übernehmen, falls Anmeldung oder Kampagne weg sind: Das Fenster landet bei der Anmeldung oder der Kampagnenauswahl.

### Der Punkt

`useLiveStatus()` gibt `connected`, `generation` und `presence` heraus. Der kleine Punkt in der Leiste (`components/rahmen/Verbindung.jsx`) zeigt `connected`; die Anwesenheit füllt die Auswahl beim Flüstern und die Liste der Anwesenden.

## Ein Beispiel ohne Takt: der Klangteppich

Ein Ereignis, das zeigt, wie viel sich mit wenig Kanal machen lässt: die Musik. Alle sollen dieselbe Stelle desselben Stückes hören. Der naheliegende Weg wäre, dass der Server jede Sekunde die Position schickt. Der Almanach schickt stattdessen drei Felder, einmal:

| Feld | Bedeutung |
|---|---|
| `spielt` | soll gerade Musik laufen? |
| `position` | an welcher Stelle, in Sekunden |
| `stand` | wann `position` gemessen wurde |

Jedes Fenster rechnet daraus selbst, wo es stehen müsste: `position + (jetzt − stand)`. Der Server muss nichts ticken lassen und nichts nachschicken; ein Fenster, das eine Minute später dazukommt, findet die Stelle von allein. Nur wenn die Spielleitung anhält, weiterlaufen lässt oder „Gleichziehen“ drückt, geht ein neues `klang`-Ereignis hinaus. Die Klangprobe (`npm run klangprobe`) prüft diese Rechnung.

## Grenzen

- **Kein Nachholen.** Was während eines Abrisses geschah, kommt nicht über den Kanal, sondern über das Neuladen nach der neuen Generation. Ein Ereignis, das nur „Bescheid“ sagt (`notizen:aktualisiert`), ist deshalb genauso gut wie eines, das den neuen Stand mitbringt – beide enden in einem aktuellen Stand.
- **Reihenfolge je Fenster, nicht über Fenster hinweg.** Ein Fenster bekommt die Nachrichten in der Reihenfolge, in der der Server sie schrieb. Zwei Fenster können dieselbe Nachricht zu leicht verschiedenen Zeiten bekommen.
- **Sechs Verbindungen je Adresse** erlauben Browser über HTTP/1.1. Jedes offene Almanach-Fenster belegt eine davon dauerhaft. Wer im Heimnetz (über `http://`) sechs Reiter mit dem Almanach im selben Browser öffnet, findet den siebten hängen – und im sechsten stocken die gewöhnlichen Anfragen. Über den Tunnel spricht der Browser HTTP/2 mit Cloudflare, und die Grenze fällt weg. Am Tisch hat niemand sechs Reiter offen; beim Entwickeln kommt es vor.
- **Ein Server.** Die Menge der offenen Fenster liegt im Arbeitsspeicher des einen Servers. Zwei Server nebeneinander für dieselbe Datenbank wüssten nichts voneinander – was für einen Almanach je Runde nie nötig ist.

## Ein neues Ereignis einführen

1. **Auf dem Server** an der Stelle, an der sich etwas ändert, `broadcast('mein:ereignis', daten, { campaignId, … })` rufen. Die Angaben bestimmen, wer es bekommt. Im Zweifel: Wer darf das sehen? Wenn die Antwort „nicht alle“ ist, gehört `role` oder `userIds` dazu.
2. **Den Auslöser auslassen** (`exceptClient: originClient(req)`), wenn das Fenster die Änderung schon örtlich zeigt.
3. **In der Oberfläche** in einem Haken unter `lib/daten/` mit `useLive('mein:ereignis', …)` darauf horchen. Eine Liste der Namen muss nirgends gepflegt werden.
4. **Im Vertrag** mitschreiben (`mitschreiben()` in `scripts/vertrag/werkzeug.mjs`) und prüfen, dass es ankommt – und, wo es darauf ankommt, dass es bei denen, die es nicht sehen dürfen, *nicht* ankommt.
5. **`npm run handbuch`** schreibt das Verzeichnis der Ereignisse neu. Taucht ein Name nur auf einer Seite des Drahtes auf, steht es dort eigens vermerkt – ein Hinweis auf einen Tippfehler.
