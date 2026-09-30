# Grundsätze und Review-Leitfaden

Dieses Kapitel ist für alle, die eine Änderung am Almanach begutachten – die eigene vor dem Commit oder die eines anderen vor dem Zusammenführen. Es fasst die Grundsätze aus den vorigen Kapiteln zu Fragen zusammen, die man an eine Änderung stellt, und belegt jede mit einem Fehler, den es im Almanach wirklich gab. Denn ein Grundsatz, zu dem man keinen Fehler kennt, wird beim ersten Zeitdruck übergangen.

## Die Fragen

### Wer bekommt das zu sehen?

**Der Grundsatz:** Was jemand nicht sehen darf, schickt der Server nicht – weder als Antwort noch über den Live-Kanal. Die Oberfläche versteckt nichts, um etwas zu schützen.

**Beim Begutachten:**

- Filtert jede neue Abfrage im Spiel nach der Kampagne der Sitzung (`… AND campaign_id = ?`)?
- Gibt eine neue Antwort nur heraus, was die fragende Rolle sehen darf? Stehen verborgene Dinge, Notizen der Spielleitung, Trefferpunkte von Monstern darin?
- Hat jeder neue `broadcast()` die richtigen Empfänger? Die Frage ist nicht „wer braucht das?“, sondern „wer darf das *nicht* bekommen?“ – und dann steht dort `role`, `userIds` oder `dmOnly`.
- Gilt die Regel auch für die Nebenwege: Chronik, Wurfchronik, Zähler („23 Einträge“), Protokoll, Rückblick?

**Fehler, die es gab:**

- `charakter:aktualisiert` ging an jedes Fenster der Kampagne. Die Oberfläche zeigte ein NSC-Blatt nicht an, aber Name, Bildnis, Trefferpunkte und Rüstungsklasse des Räuberhauptmanns standen im Netzwerkfenster jedes Spielerbrowsers, sobald die Spielleitung sein Blatt anfasste. Behoben mit `backend/src/blattmeldung.js`; der Vertrag schreibt seitdem am Live-Kanal mit.
- Pinselstriche im Nebel (`nebel`) gingen an alle – auch hinter geschlossenem Vorhang und für Szenen, die erst vorbereitet wurden. Die Feldkoordinaten verrieten, wo die Spielleitung aufbaute; ausgerechnet der Zeigefinger vermied genau das seit jeher. Behoben in `routes/spieltisch/nebel.js`.
- Der Nebel lag früher nur *über* den Figuren, statt sie aus der Antwort zu nehmen: Kulisse, keine Deckung.

### Ist geprüft, bevor geschrieben wird?

**Der Grundsatz:** Ein Weg prüft alle Eingaben und Rechte, bevor er die erste Zeile schreibt. Eine Absage hat nichts geändert.

**Beim Begutachten:**

- Steht jede Prüfung, die zu 400 oder 403 führen kann, *vor* dem ersten `run()`?
- Werden Verweise (Blatt, Kämpfer, Konto) gegen die eigene Kampagne geprüft, bevor sie geschrieben werden?
- Gehen Eingaben durch `werte.js` statt durch eine eigene, leicht andere Fassung?

**Fehler, die es gab:**

- `PATCH /api/characters/:id` mit `{ shared, npc }` von einem Spieler schrieb `shared`, bevor `npc` mit 403 abgewiesen wurde – eine Absage, die doch etwas getan hatte.
- `PATCH /api/auth/users/:id` mit neuer Rolle und zu kurzem Kennwort änderte die Rolle und antwortete dann „400, nichts passiert“.
- Eine Figur an einem erfundenen Blatt ergab einen Fremdschlüsselfehler als 500 statt eines 400.

### Ganz oder gar nicht?

**Der Grundsatz:** Wer mehr als eine Zeile schreibt, schreibt in `transaktion()`, und die Arbeit darin ist synchron.

**Beim Begutachten:**

- Schreibt der Weg mehrere Zeilen, die zusammengehören? Dann `transaktion(() => …)`.
- Steht ein `await` in der Transaktion? Dann ist sie keine. Was asynchron ist (Kennwort hashen), gehört *davor*.
- Prüft ein Block „ist X noch frei?“ und schreibt dann X? Beides muss ohne Pause dazwischen geschehen, sonst lesen zwei gleichzeitige Anfragen beide „frei“.

**Fehler, die es gab:**

- Die Beute: Bräche das Auszahlen nach dem dritten von fünf Blättern ab, hätten drei das Gold – und beim zweiten Versuch bekämen sie es noch einmal. Seitdem in einer Transaktion.
- Doppelt genannte Empfänger beim Auszahlen zählten als zwei Köpfe und strichen zwei Anteile ein.
- Das Einrichten des ersten Kontos: Zwei gleichzeitige Anmeldungen hätten beide „noch kein Konto, ich werde Spielleitung“ lesen können. Seitdem hashen, *dann* ohne Pause prüfen und schreiben.
- Die Anmeldebremse zählte erst nach der asynchronen Prüfung; fünfzig gleichzeitige Versuche kamen alle durch, bevor der erste verbucht war.

### Wer ändert, wer jemand ist?

**Der Grundsatz:** Ein offener Live-Kanal hält Konto, Rolle und Kampagne vom Moment des Verbindens fest. Wer das ändert, ruft `trenne()`.

**Beim Begutachten:**

- Ändert die Änderung Rolle, Kennwort, Mitgliedschaft, das Bestehen eines Kontos oder einer Kampagne? Dann gehört ein `trenne()` dazu.
- Ändert sie die Sichtbarkeit eines Dings für jemanden, der es gerade offen hat? Dann braucht diese Person eine Nachricht (`charakter:entfernt`), sonst steht es bei ihr bis zum Neuladen.

**Fehler, die es gab:**

- Nach dem Abmelden hörte das Fenster weiter mit, was am Tisch geschah, bis jemand es schloss.
- Eine entzogene Spielleitung sah über das offene Fenster weiter die verdeckten Würfe.
- Ein Blatt, das hinter den Schirm wanderte, blieb in den Übersichten der Runde stehen und führte beim Anklicken ins 403.

### Überlebt es alte Daten?

**Der Grundsatz:** Die Datenbank wächst durch Nachrüsten, das Blatt durch `withDefaults()`. Beides läuft bei jedem Start bzw. jedem Öffnen und muss mit jedem früheren Stand zurechtkommen.

**Beim Begutachten:**

- Neue Spalte? Im Schema *und* in `nachruesten.js`, mit `DEFAULT`, wenn `NOT NULL`.
- Neues Feld am Blatt? In `defaultCharacterData()` *und* in `withDefaults()`, bei verschachtelten Feldern auf der richtigen Ebene.
- Schreibt ein Schritt Daten um? Dann muss er beim zweiten Lauf nichts tun.

**Fehler, die es gab:**

- Beim Umbau auf Kampagnen trugen die Einzelwerte in `app_state` ihre Kampagne noch nicht im Schlüssel. Ohne den Umzug der Schlüssel stünde die Beutekiste nach dem Update leer da.
- Blätter aus der Zeit vor der Umstellung auf Meter hätten über Nacht andere Zahlen gezeigt, hätte `withDefaults` ihnen `metrisch` gegeben.

### Funktioniert es auch dort, wo es niemand testet?

**Der Grundsatz:** Was nicht geprüft wird, bricht leise. Kommt ein Weg dazu, kommt eine Prüfung dazu – auch für Werkzeuge, die man nur in der Not braucht.

**Beim Begutachten:**

- Gibt es für die Änderung eine Prüfung im Vertrag, in der Blatt- oder Klangprobe?
- Prüft sie auch das Nein – dass jemand etwas *nicht* sieht, *nicht* darf?
- Hat sich ein Aufruf geändert, den ein Skript unter `backend/scripts/` benutzt?

**Fehler, die es gab:**

- `npm run vorlagen` brach seit dem Umbau auf Kampagnen mit einem Fehler von SQLite ab: `saeVorlagen()` erwartete jetzt als Erstes die Kampagne, das Skript übergab nur die Optionen. Drei Handbücher versprachen, dass es gelöschte Vorlagen zurückholt. Kein Durchgang rief es je auf. Behoben, und seitdem laufen die Werkzeuge im Vertrag mit (`20-werkzeuge.mjs`).
- In der Kartenbibliothek stand `onAuflegen(k)`, ohne dass es ein `k` gab. Der Bau merkte nichts – für ihn war `k` eine globale Variable –, erst ein Klick auf „Auflegen“ warf. Seitdem prüft oxlint `no-undef`, zusätzlich zur Einfuhrprobe.

### Stimmt der Kommentar noch?

**Der Grundsatz:** Kommentare sagen *warum*. Sie veralten leiser als Code: Eine Funktion, die umzieht, meldet sich beim Bau; ein Kommentar, der auf ihren alten Ort zeigt, schweigt, bis jemand ihm folgt.

**Beim Begutachten:**

- Hat jede neue Datei einen Kopf, jede neue Ausfuhr einen Kommentar?
- Nennt ein Kommentar eine Datei, einen Weg, eine Zahl, die sich geändert hat?
- Steht die verworfene Alternative im Kommentar, wo eine Entscheidung nicht offensichtlich ist?
- Die Kommentarprobe prüft Kopf, Ausfuhren, genannte Pfade und verwaiste Kommentare – nicht aber, ob ein Satz noch stimmt. Das bleibt Lesearbeit.

**Fehler, die es gab:**

- Nach dem Zerlegen großer Dateien hingen an zwei Dateienden noch die Kommentare von Funktionen, die längst woanders standen. Seitdem meldet die Kommentarprobe Dateien, die mit einem Kommentar enden.
- Ein Kommentar am Initiative-Knopf des Blattes behauptete, der Wurf trage sich in die Kampfliste ein; tatsächlich würfelt er nur. Eingetragen wird über „Eigene Initiative würfeln“ in der Kampfliste.

### Steht das Aussehen im Stilblatt?

**Der Grundsatz:** Wie etwas aussieht, steht im Stilblatt; was es tut, in einer Skriptdatei; ein Symbol in einer Symbol-Datei. Nichts davon steht eingebettet im Markup – kein `style`-Attribut, kein `<style>`, kein `<script>` ohne Quelle, kein `onclick="…"`. Werte, die erst im Browser feststehen, gehen als CSS-Variable in eine Laufzeit-Regel (`<Laufwert>`, `useLaufstil`).

**Beim Begutachten:** Die Stilprobe fängt jedes `style=` im JSX, CSS-Werte in SVG-Attributen (`fill="var(--…)"`), SVG außerhalb von `components/icons/`, `style="…"`, `onclick="…"`, `<script>` und `<style>` in erzeugtem HTML, rohe Farbwerte und Eingebettetes in der index.html. Die eine Ausnahme – das Stilblatt im mitgenommenen Blatt – steht mit Grund in ihrer Liste; eine zweite braucht einen ebenso guten. Was sie nicht fängt: eine Farbe, die nur in einem der beiden Erscheinungsbilder definiert ist. Neue Farbnamen gehören in beide Sätze von `stile/farben.css`.

**Warum so streng:** Eingebettetes ist nicht nur unordentlich. Solange auch nur ein `style`-Attribut im Markup steht, braucht eine Content-Security-Policy `'unsafe-inline'` – und damit ließe sie auch eingeschleustes CSS durch. Erst ohne jedes Eingebettete kann sie streng sein.

### Passt es auf einen Pi?

**Der Grundsatz:** Der Almanach läuft auf einem kleinen Rechner mit einer Speicherkarte. Schreibvorgänge nutzen sie ab, Rechenzeit ist knapp, und das Netz einer Runde ist manchmal ein Telefon im Keller.

**Beim Begutachten:**

- Schreibt die Änderung bei jeder Anfrage? (Der letzte Besuch einer Sitzung wird nur einmal je Stunde nachgetragen – sonst schriebe jeder Bildaufruf.)
- Schickt sie bei jedem Zug große Mengen an jede Person? (Nebel und Sicht als Bitkarte: 6,5 KB statt 348 KB.)
- Rechnet sie während des Ziehens statt beim Loslassen?
- Speichert die Oberfläche bei jedem Tastendruck, statt zu bündeln?

### Braucht es wirklich ein Paket?

**Der Grundsatz:** Der Server hat eine Laufzeitabhängigkeit (Express). Jede weitere will installiert, aktualisiert und geprüft werden, auf einem Pi, um den sich niemand kümmern will.

**Beim Begutachten:** Ließe sich das mit Node selbst oder in fünfzig Zeilen lösen? Cookies, Sitzungen, Kennwörter, Protokoll, Validierung, SQLite, die Proben, dieses Buch – alles steht ohne zusätzliches Paket.

### Stimmen Hilfe, Handbuch und Schnittstellenbeschreibung?

**Der Grundsatz:** Eine Hilfe, die etwas anderes behauptet als die Oberfläche, ist schlimmer als gar keine.

**Beim Begutachten:** Neue Wege in `docs/API.md`; neue Handgriffe in der Hilfe (`frontend/src/pages/hilfe/`) und in den Anleitungen für Runde und Spielleitung; neue Zusammenhänge in diesem Buch. Die Verzeichnisse schreibt `npm run handbuch` aus dem Code.

## Die Liste zum Abhaken

Für eine Änderung, die man abgeben will:

- [ ] `npm test` ist grün (Lint, Einfuhr-, Stil-, Kommentar-, Blatt-, Klangprobe, Vertrag).
- [ ] `npm run build` läuft durch.
- [ ] Jede neue Abfrage nennt die Kampagne; jede neue Antwort und jeder neue `broadcast()` nur, was der Empfänger sehen darf.
- [ ] Erst prüfen, dann schreiben; mehrere Zeilen in `transaktion()`, ohne `await` darin.
- [ ] Wer ändert, wer jemand ist, ruft `trenne()`.
- [ ] Neue Spalten im Schema und in `nachruesten.js`; neue Blattfelder in `defaultCharacterData()` und `withDefaults()`.
- [ ] Jede Absage mit `code` und `error`; neue Schlüssel stehen danach im Verzeichnis.
- [ ] Neue Wege und Ereignisse haben Prüfungen im Vertrag – auch für das Nein.
- [ ] Neue Dateien haben einen Kopf, neue Ausfuhren einen Kommentar, der *warum* sagt.
- [ ] Aussehen im Stilblatt, Farben in beiden Erscheinungsbildern.
- [ ] `docs/API.md`, die Hilfe, die Anleitungen und dieses Buch stimmen noch; `npm run handbuch` ist gelaufen.
- [ ] Kein Kennwort, keine `.env`, keine Daten der Runde im Commit.

## Wie ein guter Befund aussieht

Wer eine Änderung begutachtet und etwas findet, schreibt den Befund so, dass die Autorin ihn ohne Rückfrage beheben kann:

1. **Die Stelle:** Datei und Zeile.
2. **Was geschieht:** konkret, mit Eingaben – „Ein Spieler schickt `PATCH /api/characters/:id` mit `{ shared: false, npc: true }`: `shared` wird geschrieben, dann antwortet der Weg 403.“
3. **Warum es schadet:** „Die Oberfläche glaubt, nichts sei geschehen; die Datenbank sagt etwas anderes.“
4. **Ein Vorschlag**, wenn einer auf der Hand liegt: „Alle Rechte prüfen, dann in einer Transaktion schreiben.“

Ein Befund ohne Szenario („das könnte ein Problem sein“) ist eine Vermutung. Eine Vermutung ist erlaubt, aber sie heißt so.
