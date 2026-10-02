# Begriffe

Der Almanach hat seine eigene Sprache, und zwar zweimal: einmal auf dem Schirm, einmal im Code. Meist decken sich beide, manchmal nicht – die Spielleitung heißt auf dem Schirm „Spielleitung“, im Code `sl`, in alten Stellen „DM“. Dieses Kapitel sammelt die Wörter, die im Buch immer wieder vorkommen, und sagt zu jedem, was es bedeutet, wo es im Code steht und womit man es nicht verwechseln darf.

Die Einträge stehen nach Themen, nicht nach dem Alphabet: Wer „Szene“ nachschlägt, soll „Karte“ und „Nebel“ gleich daneben finden. Ein alphabetisches Register mit Verweisen steht am Ende des Kapitels.

## Menschen und Rechte

### Runde

Die Menschen, die zusammen spielen, mit ihren Konten. Die Runde ist die oberste Ebene des Almanachs: Es gibt genau eine je Almanach. Wer zwei Gruppen hat, die nichts miteinander zu tun haben, stellt zwei Almanache auf (zwei Datenordner, zwei Ports) – oder nutzt zwei Kampagnen, wenn dieselbe Spielleitung beide führt.

Rundenweit gemeinsam sind Konten, Rollen, Einladungen und die gesamte Vorbereitung (Karten, Bilder, Bestiarium, Begegnungen, Klang). Im Code gibt es kein Objekt „Runde“; sie ist schlicht alles, was keine `campaign_id` trägt oder nicht danach gefiltert wird.

> Nicht zu verwechseln mit der **Kampfrunde** (siehe unten) – im Code `round`, auf dem Schirm „Runde 3“ in der Kampfliste.

### Konto

Ein Mensch im Almanach: Name, Kennwort, Rolle, Farbe. Tabelle `users`. Der Name ist eindeutig ohne Rücksicht auf Groß- und Kleinschreibung – dafür gibt es die Spalte `name_key`, die den Namen kleingeschrieben und ohne Leerzeichen am Anfang und Ende hält (`nameKey` in `backend/src/anmeldung/konten.js`). „Mara“ und „mara“ sind deshalb dasselbe Konto.

Die **Farbe** eines Kontos färbt seine Würfe, seinen Zeigefinger und seine Zeilen im Chat. Jede Person wählt sie im Konto-Menü selbst.

### Rolle

Was ein Konto darf. Es gibt genau zwei: `sl` (Spielleitung) und `spieler` (mitspielend). Die Rolle gilt rundenweit, nicht je Kampagne – wer leitet, leitet in allen Kampagnen dieses Almanachs. Mehrere Konten dürfen die Rolle `sl` haben; die letzte Spielleitung kann ihre Rolle aber nicht abgeben, sonst hätte niemand mehr die Schlüssel.

Geprüft wird die Rolle ausschließlich auf dem Server, durch den Wächter `requireDm` (Kapitel „Anmeldung, Rollen und Sicherheit“).

### Spielleitung

Wer den Abend führt. Im Code `sl` und an Stellen aus der Frühzeit des Almanachs `dm` (`isDm`, `DmBoard.jsx`, `requireDm`). Die Spielleitung sieht alles: verborgene Figuren, NSC-Blätter, die Trefferpunkte der Monster, den Nebel nur als Schatten, verdeckte Würfe. Und sie hat den Bereich „Spielleitung“ – den Schirm.

### Mitspielende

Alle Konten mit der Rolle `spieler`. Im Buch heißen sie auch „die Runde“, wenn es um die Sicht geht („was die Runde sieht“): gemeint ist dann jedes Fenster, das nicht der Spielleitung gehört.

### Einladung, Einladungscode

Der einzige Weg zu einem neuen Konto, sobald das erste existiert. Die Spielleitung erzeugt im Reiter „Runde“ einen Code wie `K7PM-3QXA-9FTE` (drei Gruppen zu vier Zeichen, ohne die leicht verwechselbaren `I`, `O`, `0` und `1` – man liest ihn am Tisch ja oft vor), gibt ihn weiter, und wer ihn bei der Anmeldung einträgt, darf sich ein Konto anlegen. Ein Code gilt genau einmal; danach steht in der Tabelle `invites`, wer ihn wann benutzt hat. Tabelle `invites`, Wege unter `/api/auth/invites`.

### Anmeldung, Sitzung (Anmeldesitzung)

Eine Anmeldung erzeugt eine **Sitzung**: ein zufälliges Kennzeichen, das als Cookie `almanach_sitzung` im Browser liegt. In der Datenbank steht nur dessen Hash (Tabelle `auth_sessions`), nie das Kennzeichen selbst. Eine Sitzung gilt dreißig Tage ab dem letzten Besuch und trägt die gerade gewählte Kampagne.

> Doppeldeutig: Die **Sitzung der Chronik** (siehe unten, Tabelle `game_sessions`) ist ein Spielabend. Im Code heißt die Anmeldesitzung `session` oder `sitzung` in `anmeldung/`, die Chronik-Sitzung `game_session`. Im Buch steht, wo es nicht aus dem Zusammenhang klar ist, „Anmeldesitzung“ oder „Spielabend“.

### Wächter

Die vier Funktionen, die vor den Wegen des Servers stehen: `attachUser` (hängt Konto und Kampagne an jede Anfrage), `requireAuth` (401 ohne Anmeldung), `requireCampaign` (409 ohne gewählte Kampagne), `requireDm` (403 für alle außer der Spielleitung). Datei `backend/src/anmeldung/waechter.js`.

### Drossel

Die Bremse gegen das Durchprobieren von Kennwörtern: höchstens acht Fehlversuche in zehn Minuten, gezählt je Adresse und Name. Datei `backend/src/routes/konten/drossel.js`.

## Kampagnen

### Kampagne

Eine Geschichte. Alles, was am Tisch *gespielt* wird, gehört zu genau einer Kampagne: Charakterblätter, Szenen und Figuren, der Kampf, die Beutekiste, Würfe, Chat, Notizen, die Chronik. Tabelle `campaigns`, Mitglieder in `campaign_members`.

Der Merksatz, der die halbe Architektur erklärt:

> **Konten gehören der Runde, alles Gespielte gehört einer Kampagne.**
> **Vorbereitung gehört der Runde, das Spiel gehört der Kampagne.**

### Aktive Kampagne

Die Kampagne, an der ein Fenster gerade sitzt. Sie hängt an der Anmeldesitzung (`auth_sessions.campaign_id`), nicht am Konto: Dieselbe Person kann auf dem Telefon in der einen und am Rechner in der anderen Kampagne sein. Der Server liest sie bei jeder Anfrage aus der Sitzung und legt sie als `req.campaignId` an; jede Abfrage im Spiel filtert danach.

### Mitglied

Ein Konto, das in einer Kampagne mitspielt. Nur Mitglieder können eine Kampagne wählen. Die Spielleitung ist in jeder Kampagne Mitglied, die sie anlegt, und kann andere hinzufügen und entfernen. Wer entfernt wird, dessen offene Fenster werden getrennt (`trenne()` in `events.js`) und landen wieder bei der Kampagnenauswahl.

### Papierkorb

Wohin eine gelöschte Kampagne zuerst wandert. Sie verschwindet aus allen Listen, ihre Daten bleiben aber liegen (`campaigns.deleted_at`), bis die Frist von 30 Tagen abläuft oder sie ausdrücklich endgültig entfernt wird. Wiederherstellen stellt alles zurück, wie es war. Löschen, Wiederherstellen und Umbenennen darf nur, wer die Kampagne angelegt hat – auch keine andere Spielleitung; zum Löschen muss ihr Name abgetippt werden. Code: `backend/src/kampagnen.js`, Wege unter `/api/campaigns`.

### Umzug

Eine laufende Runde in eine andere Kampagne mitnehmen: Die Spielleitung wählt eine Zielkampagne und was mitgeht – Charaktere, Notizen und Handzettel, Szenen mit ihren Figuren, die Beutekiste –, und der Almanach kopiert es hinüber. Kopiert wird, nicht verschoben: Die alte Kampagne bleibt, wie sie war, und zweimal ausgeführt steht drüben alles zweimal. Nicht mit geht die Geschichte selbst (Würfe, Chat, Chronik) – in einer anderen Kampagne wäre sie eine Fälschung. Code: `backend/src/uebernehmen.js` und `backend/src/uebernehmen/`, Weg `POST /api/campaigns/uebernehmen`.

### Vorlagen

Die zwölf fertigen Charaktere, die jede neue Kampagne als NSC-Blätter mitbringt – je einer für jede Klasse des Grundregelwerks, auf Stufe 1 fertig ausgefüllt. Sie liegen hinter dem Schirm; wer eine davon spielen will, bekommt von der Spielleitung eine Abschrift zugeteilt. Code: `backend/src/vorlagen/`, das Verzeichnis „Vorlagen“ am Ende des Buches.

## Blätter

### Charakterblatt, Blatt

Ein Charakter mit allen Werten. Tabelle `characters`: Name, System, Besitzer, zwei Schalter (`shared`, `npc`), die Kampagne – und `data`, das eigentliche Blatt als ein einziger JSON-Text. Der Server kennt den Inhalt von `data` nicht und will ihn nicht kennen; nur an zwei Stellen schaut er hinein (Trefferpunkte und Sinne, siehe Kapitel „Das Charakterblatt Feld für Feld“).

### System

Welche Regeln ein Blatt hat. `dnd5e` bekommt die fünf Reiter mit allen Rechnungen; alles andere bekommt das **freie Blatt**: eine Kurzbeschreibung und selbst benannte Abschnitte mit freiem Text. Das freie Blatt taugt für jedes Regelwerk, verliert aber alle Hilfen, die auf 5e beruhen.

### Besitzer

Wem ein Blatt gehört (`characters.owner_id`). Die Besitzerin und die Spielleitung dürfen es ändern; nur die Spielleitung darf es jemand anderem zuteilen.

### Geteilt

Ein geteiltes Blatt (`shared = 1`) dürfen alle Mitspielenden der Kampagne lesen, aber nicht ändern. Neue Blätter sind geteilt – am Tisch liegen die Bögen ja auch offen.

### NSC-Blatt

Ein Blatt hinter dem Schirm (`npc = 1`): der Wirt, der Räuberhauptmann, der Drache, und die zwölf Vorlagen. Die Runde bekommt NSC-Blätter nie – nicht in Listen, nicht einzeln, nicht beim Holen der Runde in den Kampf. Diese Regel wird *vor* allen anderen geprüft: Auch ein versehentlich als geteilt markiertes NSC-Blatt bleibt verborgen.

> Nicht zu verwechseln mit einem **NSC im Kampf** (Kämpfer mit `type = 'npc'`) oder einem **NSC im Bestiarium** (Statblock mit `category = 'npc'`). Ein NSC-Blatt ist ein vollständiger Charakterbogen; die anderen beiden sind Einträge in Listen.

### Abschrift

Eine Kopie eines Blattes in derselben Kampagne, die der Person gehört, die sie anlegt. Eine Abschrift ist nie ein NSC-Blatt – das ist der Weg, auf dem eine Vorlage vom Schirm auf den Tisch kommt. Weg `POST /api/characters/:id/duplicate`.

### Kopie in eine andere Kampagne

Dasselbe Blatt noch einmal in einer anderen Kampagne; nur für die Spielleitung. Weg `POST /api/characters/:id/kopieren`. Allgemein heißt dieser Handgriff im Almanach **„Kopieren nach …“** und gibt es auch für Karten, Statblöcke, Begegnungen und Klänge.

### Mitnehmen, Ausfuhr

Das Blatt als eigenständige HTML-Datei sichern: alles, was darauf steht, samt Bildnis und Zaubertexten, zum Doppelklicken und Drucken, ohne Netz und ohne Server. Am Ende der Datei steckt der vollständige Datensatz, sodass sie zugleich eine Sicherung ist. Code: `frontend/src/lib/blattAusfuhr.js` und `lib/blatt/`.

### Einlesen

Der Rückweg der Ausfuhr: „Einlesen“ im Kopf eines Blattes oder „Blatt einlesen“ in der Übersicht nimmt eine mitgenommene Datei – auch eine, die jemand oder eine KI bearbeitet hat – und macht nach einer **Vorschau** daraus wieder ein Blatt: Es aktualisiert das vorhandene (erkannt an der Kennung in der Datei) oder legt ein neues an. Code: `frontend/src/lib/blattEinfuhr.js`, `lib/einfuhr/`, `components/BlattEinlesen.jsx`.

### KI-Anleitung, Feldmarke

Was eine mitgenommene Datei für die Bearbeitung durch eine KI mitbringt: oben eine **Anleitung für KI-Assistenten** samt Verzeichnis aller Felder (ein Kommentar, im Browser unsichtbar), und an jedem sichtbaren Wert eine **Feldmarke** – `data-feld` (der Pfad im Datensatz) und `data-war` (der Wert bei der Ausfuhr). An der Marke erkennt das Einlesen eine Änderung, die nur auf der sichtbaren Seite gemacht wurde. Code: `lib/blatt/datensatz.js`, `lib/blatt/glossar.js`, `marke` in `lib/blatt/werkzeug.js`.

### Pfad (im Blatt)

Die Adresse eines Feldes im Blatt, mit Punkten geschrieben: `combat.hp.current`, `abilities.dex`, `spellcasting.slots.3.used`. Jede Änderung am Blatt ist ein Pfad und ein Wert (`update('combat.hp.current', 7)`), und `setPath` in `frontend/src/lib/setPath.js` macht daraus ein neues Blatt, ohne das alte anzufassen.

### Maßsystem

Ob ein Blatt Weiten in Metern oder in Fuß anzeigt (`data.units`: `metrisch` oder `imperial`). **Gespeichert wird immer in Fuß und Pfund**; das Maßsystem ist nur die Brille. Ein Feld am Tisch sind fünf Fuß oder anderthalb Meter – der Almanach rechnet dafür mit 0,3 m je Fuß, damit aus 30 Fuß glatte 9 m werden, wie es im Regelwerk steht. Gewichte werden dagegen genau umgerechnet.

## Der Spieltisch

### Spieltisch

Der Bereich mit der Karte. Er zeigt immer die eine **aufliegende Szene** der Kampagne – alle am Tisch sehen dieselbe (jede mit ihrer eigenen Sicht darauf).

### Karte

Die *Vorbereitung*: ein Bild samt einmal ausgerichtetem Raster, dazu Name, Schlagworte, Notizen und auf Wunsch eine Ambiente, die mitgeht. Karten liegen in der **Kartenbibliothek** der Spielleitung und gehören der Runde. Tabelle `maps`.

### Szene

Eine Karte *im Spiel*: mit Nebel, Figuren, Licht und Sichtweite. Aus einer Karte lassen sich beliebig viele Szenen legen, ohne das Bild erneut hochzuladen oder das Raster neu auszurichten. Szenen gehören einer Kampagne. Tabelle `scenes`; die aufliegende steht im Schlüssel-Wert-Speicher unter `szene`.

> Merkregel: **Die Karte ist das Papier, die Szene ist das Spiel darauf.**

### Szenenlade

Die Schublade am Spieltisch, aus der die Spielleitung Szenen auflegt, anlegt, umbenennt und löscht – und in der auch die Karten der Bibliothek zum Auflegen bereitliegen. Code: `frontend/src/components/tabletop/leiste/Szenenlade.jsx`.

### Raster, Feld, Feldgröße, Versatz

Das Gitter über der Karte. Die **Feldgröße** (`grid_size`) ist die Kantenlänge eines Feldes in Bildpunkten der Karte, der **Versatz** (`grid_offset_x`, `grid_offset_y`) verschiebt das Gitter, bis es auf den gezeichneten Linien der Karte liegt. Figuren rasten beim Loslassen auf Felder ein.

### Maßstab

Wofür ein Feld steht (`scenes.unit`, `scenes.scale`): vorgegeben sind 5 Fuß wie im Regelwerk. Wer eine Landkarte über zweihundert Meter legen will, stellt ein Feld auf einen Meter oder mehr. Am Maßstab hängen das Lineal und die Sicht.

### Figur

Eine Marke auf der Karte (Tabelle `tokens`): Name, Stelle, Größe in Feldern, Farbe, Bild – und auf Wunsch zwei Verknüpfungen: mit einem **Charakterblatt** (dann bewegt sie, wem das Blatt gehört, und ihre Sinne bestimmen die Sicht) und mit einem **Kämpfer** (dann zeigt sie dessen Trefferpunkte und leuchtet, wenn er am Zug ist). Im Code heißen Figuren `token`.

### Verborgene Figur

Eine Figur mit `hidden = 1`. Die Spielleitung sieht sie blass, die Runde bekommt sie gar nicht geschickt. Gedacht für den Hinterhalt, der erst zuschlägt, wenn die Spielleitung ihn aufdeckt. Hängt die Figur an einem Kämpfer, sind beide gemeinsam verborgen oder sichtbar – wer eine Seite umlegt, legt beide um (`backend/src/kampf/verbergen.js`).

### Nebel (Nebel des Krieges)

Welche Felder einer Szene die Runde **je aufgedeckt** hat. Der Nebel ist Erinnerung: Ein erkundeter Raum bleibt aufgedeckt, auch wenn niemand mehr darin steht. Er wird von der Spielleitung mit dem Pinsel aufgedeckt und verhüllt und kann ganz abgeschaltet werden (`fog_enabled`). Gespeichert wird er als Liste der aufgedeckten Felder (`scenes.fog`); zum Browser wandert er als **Bitkarte** – ein Bit je Feld, Base64-verpackt –, damit auch große Karten mit Zehntausenden Feldern bei jedem Zug klein bleiben.

### Sicht

Was eine Figur **gerade** sehen kann. Die Sicht rechnet der Server bei jeder Änderung neu aus den Sinnen der Figuren, dem Licht und der Sichtweite der Szene; die Runde sieht das, was der Nebel aufgedeckt hat *und* was die eigenen Figuren gerade sehen. Code: `backend/src/sicht.js` und `backend/src/sicht/`.

> **Nebel** und **Sicht** sind nicht dasselbe, und der Unterschied ist der Kern des Kapitels „Sicht und Nebel“. Der Nebel sagt, was man *kennt*; die Sicht sagt, was man *sieht*.

### Dunkle Szene

Eine Szene mit `dark = 1`. Erst hier zählen Licht und Dunkelsicht: Wer weder eine Lichtquelle trägt noch im Dunkeln sehen kann, sieht nur das eigene Feld und was fremdes Licht in seiner Nähe erhellt. Bei Tageslicht wäre das nur Rechnerei, deshalb ist es ein Schalter an der Szene.

### Licht

Was eine Figur an Licht mit sich trägt, in Fuß: hell (`light_bright`) und dämmrig (`light_dim`). Eine Fackel sind 20 und 20. In einer dunklen Szene sieht jede Figur, so weit ihr eigenes Licht oder das einer anderen reicht.

### Sichtweite

Zweierlei, und beides ist eine Obergrenze. Die **Sichtweite der Szene** (`scenes.sight`) gilt für alle – Nebelbank, Schneetreiben, dichter Wald. Die **Sichtweite eines Blattes** (`combat.senses.sight`) gilt für eine Figur; wer sie einträgt, bekommt am Tisch ein Nebelfenster, das an der Figur hängt. 0 heißt jeweils: unbegrenzt.

### Vorhang

Der geschlossene Tisch. Solange der Vorhang zu ist, bekommt die Runde keine Szene – nur einen Hinweis, dass die Spielleitung aufbaut –, und selbst ein Zeigefinger der Spielleitung erreicht nur sie selbst, damit seine Stelle nichts verrät. So lässt sich eine Szene vorbereiten, während alle schon am Tisch sitzen. Im Schlüssel-Wert-Speicher unter `vorhang`.

### NSC-Sicht

Eine Auswahl für die Spielleitung: Sie schaut durch die Augen einer einzelnen Figur und sieht den Tisch genau so, wie diese Figur ihn sähe – um zu prüfen, was der Wachposten vom Turm aus bemerken würde, oder um einen NSC zu steuern. Gerechnet wird dabei buchstäblich dieselbe Sicht wie für die Runde. Im Schlüssel-Wert-Speicher unter `nsc_sicht`.

### Lineal

Messen auf der Karte: ziehen, und der Almanach zeigt die Entfernung in Feldern und in der Einheit des Maßstabs. Ein Werkzeug der Spielleitung, und nur in ihrem Fenster; niemand sonst sieht es. Diagonalen zählen dabei einfach, wie bei der Bewegung.

### Zeigefinger (Ping)

„Schaut mal hierhin“: ein kurzes Aufleuchten an einer Stelle der Karte, bei allen, in der Farbe des Kontos. Nichts davon wird gespeichert. Weg `POST /api/scenes/ping`, Ereignis `ping`.

## Kampf

### Kampf, Kampfliste, Initiative

Die Liste aller **Kämpfer** einer Kampagne, nach Initiative absteigend geordnet (bei Gleichstand nach Namen), dazu die Kampfrunde und wer gerade am Zug ist. Es gibt je Kampagne genau einen Kampf; „kein Kampf“ heißt: die Liste ist leer.

### Kämpfer

Eine Zeile der Kampfliste (Tabelle `combatants`): Name, Art, Initiative, Initiativebonus, Trefferpunkte, Rüstungsklasse, Zustände, Notizen der Spielleitung, verborgen oder nicht. Ein Kämpfer kann an einem Charakterblatt hängen (`character_id`) – dann sind seine Trefferpunkte die des Blattes, in beide Richtungen.

### Initiativebonus

Was zum W20 der Initiative hinzukommt: bei Gegnern der Modifikator der Geschicklichkeit aus ihrem Statblock (GE 18 → +4), gespeichert am Kämpfer (`initiative_bonus`) und in den Posten einer Begegnung. Heldinnen würfeln selbst und bringen ihren Bonus vom Blatt mit. Die Runde bekommt den Bonus der Gegner nicht zu sehen. Code: `backend/src/kampf/initiative.js`.

### Art (eines Kämpfers)

`pc` (Held, Figur einer Spielerin), `npc` (Nichtspielercharakter) oder `monster`. Die Art entscheidet, was die Runde sieht: bei Helden die Trefferpunkte genau, bei NSC und Monstern nur ein Wort.

### Kampfrunde

Ein Durchgang durch die Initiativliste. Im Code `round`, im Schlüssel-Wert-Speicher unter `kampf`.

### Wundenstufe

Was die Runde statt der Trefferpunkte eines Monsters sieht: ein Schlüssel, den der Server aus dem Verhältnis von aktuellen zu höchsten Trefferpunkten bildet – `unversehrt`, `leicht_verletzt` (über zwei Drittel), `verwundet` (über ein Drittel), `schwer_verwundet`, `kampfunfaehig` (0 oder weniger). Wie er auf dem Schirm heißt, entscheidet die Oberfläche (`frontend/src/lib/beschriftung.js`). Code: `zustand()` in `backend/src/kampf/umwandlung.js`.

### Zustand

Die vierzehn Zustände aus dem Regelwerk – Bezaubert, Betäubt, Blind, Bewusstlos, Festgesetzt, Gelähmt, Gepackt, Handlungsunfähig, Liegend, Taub, Verängstigt, Vergiftet, Versteinert, Unsichtbar – auf dem Blatt (`combat.conditions`) und am Kämpfer (`conditions`). Dazu die **Erschöpfung** in sechs Stufen.

### Bestiarium, Statblock

Die Sammlung der Spielleitung: Werte für Monster und NSC, von Hand angelegt oder aus dem Kompendium übernommen, mit Schlagworten zum Wiederfinden. Aus einem Statblock wird mit einem Klick ein Kämpfer – mit gewürfelter Initiative. Tabelle `library`, gehört der Runde.

### Begegnung

Eine vorbereitete Aufstellung: welche Statblöcke in welcher Zahl. „In den Kampf“ legt sie alle auf einmal in die Kampfliste, jeden mit eigener Initiative und durchnummeriert („Goblin 1“, „Goblin 2“). Tabelle `encounters`, gehört der Runde.

### Runde holen

Der Knopf der Spielleitung, der alle geteilten Heldenblätter der Kampagne als Kämpfer in die Liste holt, verknüpft mit ihren Blättern. NSC-Blätter bleiben draußen.

## Würfel, Gespräch, Beute

### Würfelbeutel, Würfelbecher

Das Fenster zum Würfeln, unten rechts. Gewürfelt wird **auf dem Server** (`backend/src/dice.js`), nie im Browser – ein Wurf ist deshalb nie eine Behauptung. Er landet mit Namen, Uhrzeit und Einzelwürfeln in der **Wurfchronik**, die alle sehen.

### Würfelausdruck

Was der Server versteht: Würfel und Zahlen, verbunden durch Plus und Minus – `2W6+3`, `1d20-1`, `W100`, `3W8+1W6+4`. „W“ und „d“ sind gleichwertig, Leerzeichen zwischen den Gliedern erlaubt. Höchstens hundert Würfel je Glied, zwei bis tausend Seiten. Die genaue Grammatik steht in `backend/src/dice.js`.

### Würfelknopf

Jeder Wert auf dem Blatt mit einem kleinen W20 davor: Antippen würfelt einen W20 mit diesem Bonus, unter dem Namen des Wertes („Heimlichkeit“, „Rettungswurf Weisheit“).

### Vorteil, Nachteil

Zwei W20, der höhere beziehungsweise niedrigere zählt. Im Würfelbeutel zum Umschalten; der Server würfelt beide und zeigt beide. Es gilt für den ersten einzelnen W20 im Ausdruck – ein Schadenswurf ohne W20 bleibt davon unberührt.

### Verdeckter Wurf

Ein Wurf der Spielleitung, den die Runde nicht bekommt – weder live noch beim Nachladen der Wurfchronik. Nur die Spielleitung kann verdeckt würfeln.

### Chat

Das Gespräch am Tisch: Zeilen an alle oder **geflüstert** an eine einzelne Person. Geflüstertes bekommen nur die beiden Beteiligten, auch die Spielleitung nicht. Der Chat hält die letzten 300 Zeilen je Kampagne und steht nicht in der Chronik. Tabelle `messages`.

### Handzettel

Eine Notiz der Spielleitung, die sie an die Runde **austeilt**: den Brief des Grafen, die Inschrift auf der Tür. Ausgeteilte Notizen (`visibility = 'runde'`) erscheinen bei allen am Tisch; alle anderen Notizen bekommt ein Spielerfenster nie.

### Beutekiste

Was die Runde gemeinsam gefunden hat: Gegenstände und Münzen, je Kampagne eine Kiste. **Teilen** geht wie am Tisch von der größten Münze zur kleinsten: Was sich nicht glatt aufteilen lässt, wird in kleinere Münzen gewechselt und weitergereicht, nie in größere – aus 43 Gold für drei werden 14 Gold je Kopf und nicht „1 Platin, 4 Gold“. Elektrum wird dabei in Silber gewechselt. Übrig bleibt höchstens eine Handvoll Kupfer. Code: `teile()` in `backend/src/beute.js`.

### Klangteppich, Ambiente

Die Musik des Abends. Die Spielleitung legt einen Spotify-Link (Playlist, Album, Titel, Künstler) als **Ambiente** in ihre Klangbibliothek und legt ihn für alle auf; jedes Fenster spielt ihn mit dem eigenen Spotify-Konto ab, und der Almanach hält alle im selben Takt, ohne selbst Musik zu speichern oder zu senden. Code: `backend/src/klang.js`, `frontend/src/components/klang/`.

## Chronik

### Chronik

Das Gedächtnis der Kampagne. Der Almanach schreibt von selbst mit, was am Tisch geschieht – Würfe, Wunden, Heilung, Szenenwechsel, Kämpfe, Beute, Handzettel –, und ordnet es in **Sitzungen**. Code: `backend/src/chronicle.js`, Tabellen `game_sessions` und `chronicle`.

### Sitzung (Spielabend)

Ein Spielabend in der Chronik, mit Titel und allem, was dazwischen geschah. Eine Sitzung eröffnet sich beim ersten Eintrag des Abends von selbst; die Spielleitung kann sie außerdem ausdrücklich beginnen, beenden, umbenennen und von Hand ergänzen. Verdeckte Einträge (ein verdeckter Wurf, ein verborgener Gegner) sieht in der Chronik nur die Spielleitung.

### Protokoll

Eine Sitzung als Markdown-Text zum Herunterladen, erzeugt allein aus den Einträgen – ohne jede KI.

### Rückblick

Auf Wunsch ein erzählter Text über den Abend, den ein Sprachmodell aus dem Protokoll schreibt. Abgeschaltet, bis jemand die Umgebungsvariable `CHRONIK_KI_URL` setzt; dann bekommt das Modell nur, was die Runde ohnehin sehen darf. Die einzige Stelle, an der der Almanach von sich aus etwas aus dem Haus schickt.

## Technik

### Server

Das Node.js-Programm in `backend/`. Es hält die Datenbank, prüft jede Anfrage, würfelt, rechnet die Sicht und schickt Änderungen hinaus. Im Betrieb liefert es auch die Oberfläche aus.

### Oberfläche

Das React-Programm in `frontend/`, gebaut mit Vite. Im Betrieb liegt es fertig gebaut in `backend/public/`; beim Entwickeln läuft es auf Port 5173 mit sofortigem Nachladen.

### Weg (Route)

Eine Adresse der Schnittstelle mit ihrer Methode: `GET /api/characters`, `PATCH /api/scenes/tokens/:id`. Das Buch sagt „Weg“, der Code `route`. Alle Wege stehen im Verzeichnis „Wege“ am Ende des Buches.

### Fehlerschlüssel

Jede Absage des Servers trägt zwei Felder: `code`, einen unveränderlichen Schlüssel (`nicht_angemeldet`, `keine_kampagne`, `nur_spielleitung`), und `error`, einen deutschen Satz für Menschen. Die Oberfläche prüft **nur** den Schlüssel; der Satz darf sich jederzeit ändern.

### Live-Kanal, Live-Draht

Die stehende Verbindung vom Server zu jedem offenen Fenster (Server-Sent Events, `GET /api/events`). Über sie kommt jede Änderung sofort an: eine gezogene Figur, ein Wurf, ein Treffer. Der Punkt oben in der Leiste zeigt, ob der Draht steht. Code: `backend/src/events.js`, `frontend/src/lib/live.jsx`.

### Ereignis

Eine Nachricht auf dem Live-Kanal, mit Namen (`figur`, `kampf`, `wurf`, `charakter:aktualisiert`) und Inhalt. Alle Ereignisse stehen im Verzeichnis „Live-Ereignisse“.

### Fensterkennung

Jedes offene Fenster bekommt beim Verbinden eine eigene Kennung und schickt sie bei jeder Anfrage im Kopf `X-Fenster` mit. So kann der Server eine Änderung an alle *anderen* Fenster schicken und das eigene auslassen – es weiß es ja schon, und ein Echo ließe eine gezogene Figur kurz zurückspringen.

### Generation

Ein Zähler in der Oberfläche, der nach einer Unterbrechung des Live-Kanals hochgezählt wird. Alle Datenhaken laden dann neu, denn was während der Unterbrechung geschah, ist über den Kanal verloren. Code: `frontend/src/lib/live.jsx`, `lib/daten/grundlage.js`.

### Trennen

Einem Fenster den Live-Kanal kappen, weil sich geändert hat, wer es ist: nach dem Abmelden, einem Rollenwechsel, dem Entfernen aus einer Kampagne. Ein offenes Fenster hält Rolle und Kampagne vom Moment des Verbindens fest; ohne Trennen hörte es mit altem Stand weiter mit. `trenne()` in `backend/src/events.js`.

### Schlüssel-Wert-Speicher

Die Tabelle `app_state` für Einzelwerte, für die eine eigene Tabelle zu viel wäre: welche Szene aufliegt, ob der Vorhang zu ist, in welcher Kampfrunde man steckt, was in der Kiste an Münzen liegt, welche Ambiente spielt. Der Schlüssel trägt die Kampagne vorn (`<campaignId>:szene`). Zugriff über `getState`/`setState` in `backend/src/db.js`.

### Transaktion

Mehrere Schreibvorgänge, die ganz oder gar nicht geschehen: `transaktion(() => …)` aus `backend/src/db.js`. Die Arbeit darin muss synchron sein.

### Nachrüsten

Wie die Datenbank mit dem Almanach wächst: Bei jedem Start prüft jeder Schritt in `backend/src/datenbank/nachruesten.js`, ob eine Spalte fehlt, und fügt sie an. Nummerierte Wanderungsdateien gibt es nicht; jeder Schritt muss gefahrlos wiederholbar sein.

### Datenordner

Wo der Almanach seine Daten hält: die Datenbankdatei `manager.sqlite3` und der Ordner `medien/` mit allen hochgeladenen Bildern. Vorgabe ist `backend/data/`, einstellbar über `DATA_DIR`. Wer den Datenordner sichert, hat alles gesichert.

### Tunnel

Der Weg von außen: `cloudflared` baut von innen eine Verbindung zu Cloudflare auf, und die Runde erreicht den Almanach über eine öffentliche Adresse, ohne dass im Router etwas freigegeben werden muss. Der **Schnelltunnel** leiht sich bei jedem Start eine neue Adresse unter `trycloudflare.com`; der **benannte Tunnel** trägt eine eigene Domain und braucht dafür ein Kennwort (`TUNNEL_TOKEN`) in der `.env`. Code: `scripts/tunnel.mjs`, `scripts/tunnel/`.

### Content-Security-Policy

Eine Kopfzeile an jeder Antwort, die dem Browser sagt, was er dieser Seite erlauben soll: Skripte nur vom Almanach (und Spotifys Spieler), Stil nur aus seinen Stilblättern, kein Einrahmen durch fremde Seiten. Die zweite Mauer hinter der Entschärfung. Code: `backend/src/kopfzeilen.js`.

### Laufzeit-Stilblatt, Laufwert

Wie Werte, die erst im Browser feststehen (die Lage einer Figur, eine gewählte Farbe), ins Aussehen kommen, ohne dass ein `style`-Attribut im Markup steht: Das Bauteil bekommt eine eigene Klasse und dazu eine Regel mit CSS-Variablen in einem Stilblatt, das es nur zur Laufzeit gibt. Code: `frontend/src/lib/laufstil.js`, `components/Laufwert.jsx`.

### HTTPS im Heimnetz, Stammzertifikat

Der verschlüsselte Eingang auf Port 3443. `npm run zertifikat` stellt dafür mit Node ein **Stammzertifikat** aus – eine eigene kleine Ausstellungsstelle, beschränkt auf Heimnetzadressen, die man einmal auf den Geräten installiert – und ein **Serverzertifikat** für die Adressen des Geräts. Code: `backend/src/https/`, `backend/scripts/zertifikat.mjs`.

### Kompendium

Die Regeltexte aus der offenen D&D-5e-Schnittstelle: Zauber, Monster, Gegenstände, Völker, Klassen und mehr. Der Server holt sie bei Bedarf und hält sie in `api_cache` vor. Weg `GET /api/compendium/…`.

### Prüfnetz, Proben, Vertrag

Die Werkzeuge, die vor jedem Commit laufen (`npm test`): die **Einfuhrprobe** (benutzt jemand einen Namen, den er nicht eingeführt hat?), die **Stilprobe** (steht irgendwo Stil oder Skript eingebettet im Markup statt in einer eigenen Datei?), die **Kommentarprobe** (ist jede Datei und jede Ausfuhr erklärt, stimmt jeder genannte Pfad?), die **Blattprobe** (rechnet das Blatt richtig?), die **Klangprobe** (bleibt der Klangteppich im Takt?) und der **Vertrag** (spielt eine ganze Runde gegen einen frischen Server durch und prüft, wer was sehen darf). Kapitel „Arbeiten am Almanach“ und das Verzeichnis „Prüfnetz“.

## Register

| Wort | steht unter |
|---|---|
| Abschrift | Blätter |
| Aktive Kampagne | Kampagnen |
| Ambiente | Würfel, Gespräch, Beute → Klangteppich |
| Anmeldung | Menschen und Rechte → Anmeldung, Sitzung |
| Art (eines Kämpfers) | Kampf |
| Ausfuhr | Blätter → Mitnehmen |
| Begegnung | Kampf |
| Besitzer | Blätter |
| Bestiarium | Kampf |
| Beutekiste | Würfel, Gespräch, Beute |
| Chat | Würfel, Gespräch, Beute |
| Chronik | Chronik |
| Content-Security-Policy | Technik |
| Datenordner | Technik |
| DM | Menschen und Rechte → Spielleitung |
| Drossel | Menschen und Rechte |
| Einlesen | Blätter |
| Dunkle Szene | Der Spieltisch |
| Einladung | Menschen und Rechte |
| Ereignis | Technik |
| Erschöpfung | Kampf → Zustand |
| Fehlerschlüssel | Technik |
| Feld, Feldgröße | Der Spieltisch → Raster |
| Fensterkennung | Technik |
| Figur | Der Spieltisch |
| Flüstern | Würfel, Gespräch, Beute → Chat |
| Freies Blatt | Blätter → System |
| Generation | Technik |
| Geteilt | Blätter |
| Handzettel | Würfel, Gespräch, Beute |
| HTTPS | Technik → HTTPS im Heimnetz |
| Initiative | Kampf |
| Initiativebonus | Kampf |
| Kämpfer | Kampf |
| KI-Anleitung, Feldmarke | Blätter |
| Kampagne | Kampagnen |
| Kampfrunde | Kampf |
| Karte | Der Spieltisch |
| Klangteppich | Würfel, Gespräch, Beute |
| Kompendium | Technik |
| Konto | Menschen und Rechte |
| Laufwert, Laufzeit-Stilblatt | Technik |
| Licht | Der Spieltisch |
| Lineal | Der Spieltisch |
| Live-Kanal | Technik |
| Maßstab | Der Spieltisch |
| Maßsystem | Blätter |
| Mitglied | Kampagnen |
| Mitnehmen | Blätter |
| Nachrüsten | Technik |
| Nebel | Der Spieltisch |
| NSC-Blatt | Blätter |
| NSC-Sicht | Der Spieltisch |
| Papierkorb | Kampagnen |
| Pfad | Blätter |
| Ping | Der Spieltisch → Zeigefinger |
| Protokoll | Chronik |
| Prüfnetz | Technik |
| Raster | Der Spieltisch |
| Rolle | Menschen und Rechte |
| Rückblick | Chronik |
| Runde | Menschen und Rechte |
| Runde holen | Kampf |
| Schlüssel-Wert-Speicher | Technik |
| Sicht | Der Spieltisch |
| Sichtweite | Der Spieltisch |
| Sitzung | Menschen und Rechte (Anmeldung), Chronik (Spielabend) |
| sl | Menschen und Rechte → Rolle |
| Spielleitung | Menschen und Rechte |
| Stammzertifikat | Technik → HTTPS im Heimnetz |
| Statblock | Kampf → Bestiarium |
| Szene | Der Spieltisch |
| Szenenlade | Der Spieltisch |
| Token | Der Spieltisch → Figur |
| Transaktion | Technik |
| Trennen | Technik |
| Tunnel | Technik |
| Umzug | Kampagnen |
| Verborgene Figur | Der Spieltisch |
| Verdeckter Wurf | Würfel, Gespräch, Beute |
| Versatz | Der Spieltisch → Raster |
| Vorhang | Der Spieltisch |
| Vorlagen | Kampagnen |
| Vorteil, Nachteil | Würfel, Gespräch, Beute |
| Wächter | Menschen und Rechte |
| Weg | Technik |
| Würfelausdruck | Würfel, Gespräch, Beute |
| Würfelbeutel | Würfel, Gespräch, Beute |
| Würfelknopf | Würfel, Gespräch, Beute |
| Wundenstufe | Kampf |
| Zeigefinger | Der Spieltisch |
| Zustand | Kampf |
