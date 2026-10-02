# Was der Almanach ist

Der Abenteuer-Almanach ist ein Spieltisch für Pen-&-Paper-Runden, der auf einem einzigen Gerät der Runde läuft – einem Raspberry Pi, der im Regal steht, oder dem Laptop, der am Spielabend ohnehin aufgeklappt ist. Alle anderen öffnen ihn im Browser: auf dem Telefon, dem Tablet oder dem Rechner, am selben Tisch oder drei Städte weiter.

Er vereint, was eine Runde sonst über fünf Werkzeuge verteilt: die Charakterblätter, eine Karte mit Figuren und Nebel des Krieges, die Kampfliste, einen gemeinsamen Würfelbecher, den Chat, die Beutekiste, eine Chronik der Abende und – für die Spielleitung – alles, was hinter dem Schirm liegt: Bestiarium, vorbereitete Begegnungen, Kartenbibliothek, Notizen, Handzettel und die Musik des Abends.

Dieses Buch beschreibt ihn vollständig: wie man ihn benutzt, wie man ihn betreibt, wie er gebaut ist und wie man daran weiterarbeitet.

## Wofür er gebaut ist

Der Almanach ist für **eine Runde** gebaut – eine Gruppe von Menschen, die sich regelmäßig trifft, meist vier bis acht, mit einer oder mehreren Personen, die leiten. Er ist kein Dienst für Tausende, sondern ein Werkzeug für die eigene Gruppe, so wie ein Würfelturm oder ein Spielleiterschirm.

Daraus folgen die Grundsätze, nach denen alles an ihm entschieden wurde:

**Die Daten gehören der Runde.** Alles liegt auf dem einen Gerät: eine SQLite-Datei und ein Ordner mit Bildern. Kein Konto bei einem fremden Dienst, keine Anmeldung bei einer Plattform, kein Abo. Wer den Almanach abschaltet, nimmt seine Geschichte mit – die Sicherung ist eine Datei, die man auf einen USB-Stick kopiert.

**Nichts kostet Geld.** Kein Teil des Almanachs verlangt eine Kreditkarte oder eine Zahlung im Netz: nicht der Betrieb, nicht der Weg von außen (der Cloudflare-Tunnel ist kostenlos, auch mit eigener Adresse), nicht die Musik (sie läuft über das Spotify-Konto jeder einzelnen Person, der Almanach speichert nur Verweise). Die einzige Ausgabe ist das Gerät, auf dem er läuft – und das kann ein alter Laptop sein. Selbst der erzählte Rückblick in der Chronik – die einzige Stelle, an der der Almanach auf Wunsch einen fremden Dienst fragt – ist abgeschaltet, bis jemand ihn einrichtet, und läuft auch mit einem Sprachmodell auf dem eigenen Rechner.

**Nur das Nötigste nachladen.** Außer Node.js und den Paketen, die `npm install` holt, braucht der Almanach nichts. Für den Weg von außen kommt `cloudflared` dazu, ein einzelnes Programm von Cloudflare. Alles andere – Datenbank, Anmeldung, Live-Kanal, Drucksatz, dieses Buch – steckt im Almanach selbst oder in Node.

**Der Server ist die Wahrheit.** Was die Runde nicht sehen darf – verborgene Gegner, geheime Notizen, verdeckte Würfe, der Nebel über unerkundetem Gelände –, wird ihr gar nicht erst geschickt. Die Oberfläche versteckt keine Knöpfe, um etwas zu schützen; sie zeigt nur an, was sie bekommen hat. Wer in die Entwicklerwerkzeuge des Browsers schaut, findet dort nichts, was er nicht sehen soll.

**Am Tisch muss es schnell gehen.** Eine gezogene Figur liegt sofort dort, wo der Finger sie loslässt; ein Wurf steht in einer halben Sekunde bei allen; Trefferpunkte, die die Spielleitung abzieht, stehen im selben Moment auf dem Blatt der Spielerin. Gespeichert wird von selbst – es gibt keinen Speichern-Knopf, und niemand soll mitten im Kampf ans Sichern denken müssen.

**Deutsch, durch und durch.** Die Oberfläche, die Meldungen, dieses Buch – und der Code. Die Sprache am Spieltisch ist deutsch, und für die Menschen, die daran arbeiten, ist `verbleibendeTage` klarer als `remainingDays`.

## Was er kann

Ein Überblick; jedes Stück hat später sein eigenes Kapitel.

| Bereich | Für wen | Was darin steckt |
|---|---|---|
| **Charaktere** | alle | vollständige Blätter für D&D 5e mit fünf Reitern, freie Blätter für andere Systeme, zwölf fertige Vorlagen, Mitnehmen als eigenständige Datei – die sich bearbeiten, auch von einer KI, und wieder einlesen lässt |
| **Spieltisch** | alle | Karte mit Raster, Figuren, Nebel des Krieges, Sicht nach den Sinnen der Figuren, Licht, Lineal, Zeigefinger |
| **Kampf** | alle | Initiativliste, Trefferpunkte, Zustände; Monster-TP für die Runde nur als Wort |
| **Würfel** | alle | Würfelbecher mit freien Ausdrücken, Vor- und Nachteil; jeder Wert auf dem Blatt ist ein Würfelknopf |
| **Gespräch** | alle | Chat am Tisch mit Flüstern, Handzettel der Spielleitung |
| **Beute** | alle | gemeinsame Kiste, Münzen teilen, auszahlen |
| **Musik** | alle | Spotify-Ambiente, für alle im selben Takt |
| **Chronik** | alle | schreibt Würfe, Wunden, Szenen und Kämpfe von selbst mit; Protokoll als Markdown; auf Wunsch ein erzählter Rückblick |
| **Kompendium** | alle | Zauber, Monster, Gegenstände aus der offenen 5e-Schnittstelle, auf dem Gerät zwischengespeichert |
| **Hinter dem Schirm** | Spielleitung | Bestiarium, vorbereitete Begegnungen, Kartenbibliothek, Klangbibliothek, Notizen, Konten und Einladungen |
| **Kampagnen** | Spielleitung | mehrere Geschichten mit derselben Runde, Papierkorb, Umzug einer Runde in eine neue Geschichte |

## Wie er gebaut ist – in einem Absatz

Der Almanach besteht aus zwei Programmen und einer Datei. Der **Server** (Node.js mit Express, in `backend/`) hält die Daten, prüft jede Anfrage und schickt Änderungen über einen offenen Kanal an alle Fenster. Die **Oberfläche** (React, gebaut mit Vite, in `frontend/`) läuft im Browser; im Betrieb liefert der Server sie gleich mit aus, es gibt also nur eine Adresse. Die **Datenbank** ist eine SQLite-Datei im Datenordner. Nach außen führt ein Cloudflare-Tunnel, der von innen nach außen aufgebaut wird und deshalb keine Freigabe im Router braucht.

Der Teil „Wie es gebaut ist“ nimmt das auseinander.

## Wer was lesen sollte

Das Buch ist in Teile gegliedert, und niemand muss alles lesen.

**Wer mitspielt**, liest das Kapitel für die Runde im Teil „Am Tisch“ – eine Betriebsanleitung vom Beitritt bis zum Rettungswurf gegen den Tod – und schlägt bei Bedarf im Kapitel über das Charakterblatt nach.

**Wer leitet**, liest dazu das Kapitel für die Spielleitung und den Spielabend von Anfang bis Ende; wer den Almanach selbst aufstellt, außerdem den Teil „Betrieb“.

**Wer den Almanach aufstellt und pflegt** – oft dieselbe Person –, findet im Teil „Betrieb“ die Einrichtung auf dem Pi und auf dem Laptop, den Weg nach außen, die Sicherung, das Aktualisieren und die Fehlersuche.

**Wer am Code arbeitet**, liest den Teil „Wie es gebaut ist“ von vorn nach hinten und den Teil „Entwicklung“. Die Verzeichnisse am Ende sind zum Nachschlagen da: jede Datei, jeder Weg der Schnittstelle, jede Tabelle, jedes Live-Ereignis, jede Einstellung.

## Wie dieses Buch geschrieben ist

Ein paar Gewohnheiten, die im ganzen Buch gelten:

- **Code, Dateinamen und Befehle** stehen in Schreibmaschinenschrift: `npm start`, `backend/src/server.js`, `combat.hp.current`. Pfade gelten, wenn nicht anders gesagt, vom Wurzelverzeichnis des Almanachs aus – dem Ordner, in dem `README.md` liegt.
- **Knöpfe und Beschriftungen** der Oberfläche stehen in Anführungszeichen, so wie sie auf dem Schirm stehen: „Runde holen“, „Vorhang zu“.
- **Die Spielleitung** heißt im Code `sl` (Rolle) und an manchen alten Stellen „DM“. Gemeint ist immer dasselbe.
- **Weiten** stehen in Fuß, wenn es um gespeicherte Werte geht (so speichert der Almanach sie), und in Metern, wenn es um das geht, was man auf dem Schirm sieht (so zeigt er sie in der Voreinstellung an).
- **Die Verzeichnisse** am Ende des Buches schreibt ein Werkzeug bei jedem Bau neu aus dem Code (`npm run handbuch`). Was dort steht, stimmt deshalb mit dem Code überein, aus dem das Buch gebaut wurde. Die übrigen Kapitel sind von Hand geschrieben; wo sie und der Code auseinanderlaufen, gilt der Code – und das Kapitel gehört berichtigt.

## Woher die Regeltexte stammen

Die Angaben im Kompendium – Völker, Klassen, Zauber, Monster, Gegenstände – stammen aus der offenen D&D-5e-Schnittstelle (dnd5eapi.co), die das System Reference Document von Wizards of the Coast unter der Creative-Commons-Lizenz bereitstellt. Der Almanach holt sie bei Bedarf und hält sie auf dem Gerät vor, damit das Nachschlagen auch bei schlechtem Netz schnell bleibt.

Die zwölf Vorlagen-Charaktere und alle Texte des Almanachs selbst sind für ihn geschrieben. Dungeons & Dragons ist eine Marke von Wizards of the Coast; der Almanach ist ein Werkzeug von Spielenden für Spielende und steht in keiner Verbindung zu ihnen.
