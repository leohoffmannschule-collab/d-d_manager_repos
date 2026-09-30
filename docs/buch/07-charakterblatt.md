# Das Charakterblatt Feld für Feld

Das Charakterblatt ist die Seite, an der die Runde am meisten sitzt – und die, an der am meisten gerechnet wird. Dieses Kapitel geht es Reiter für Reiter durch. Zu jedem Feld steht, was es bedeutet, wo es im gespeicherten Blatt liegt (sein **Pfad**), womit es anfängt und was der Almanach daraus ausrechnet.

Es ist zugleich ein Nachschlagewerk für zwei Leserschaften: für Spielerinnen, die wissen wollen, warum da „+5“ steht, und für alle, die am Code arbeiten und ein Feld ergänzen wollen. Der zweite Teil des Kapitels ist für sie geschrieben.

## Wie ein Blatt gespeichert ist

Ein Blatt ist eine Zeile in der Tabelle `characters`. Die Spalten dort sind wenige:

| Spalte | Bedeutung |
|---|---|
| `id` | Kennung (eine UUID; bei Vorlagen `vorlage-<schlüssel>--<kampagne>`) |
| `name` | der Name, wie er oben auf dem Blatt steht |
| `system` | `dnd5e` oder etwas anderes (dann: freies Blatt) |
| `data` | **das ganze Blatt** als ein JSON-Text |
| `owner_id` | wem es gehört |
| `shared` | ob die Mitspielenden es lesen dürfen |
| `npc` | ob es hinter dem Schirm liegt |
| `campaign_id` | zu welcher Kampagne es gehört |
| `created_at`, `updated_at` | wann angelegt, wann zuletzt geändert |

Alles, was auf den fünf Reitern steht, liegt in `data`. Der Server kennt diesen Inhalt nicht und will ihn nicht kennen: Er nimmt entgegen, was die Oberfläche schickt, und gibt es unverändert zurück. Das hat einen großen Vorteil – ein neues Feld auf dem Blatt braucht keine Änderung an der Datenbank – und eine Pflicht, von der weiter unten die Rede ist: Die Oberfläche muss mit Blättern jeder Altersstufe zurechtkommen.

Nur an zwei Stellen schaut der Server doch hinein, und beide sind am Tisch wichtig:

1. **Trefferpunkte.** Wer auf dem Blatt `combat.hp` ändert, ändert damit auch die Trefferpunkte des verknüpften Kämpfers in der Kampfliste – und umgekehrt schreibt die Spielleitung Schaden aus der Kampfliste zurück aufs Blatt.
2. **Sinne.** Wer `combat.senses` ändert – Dunkelsicht einträgt, die Sichtweite verkürzt –, verschiebt damit die Sicht am Spieltisch. Der Server schickt die Szene neu, sobald sich die Sinne tatsächlich geändert haben (nicht bei jedem Tastendruck am Namen).

Beides steht in `backend/src/routes/charaktere/schreiben.js`, im Weg `PUT /api/characters/:id`.

## Gespeichert wird von selbst

Es gibt keinen Speichern-Knopf. Jede Änderung wird 600 Millisekunden nach dem letzten Tastendruck an den Server geschickt; neben dem Namen steht, wie weit sie ist:

| Anzeige | Bedeutung |
|---|---|
| „Tinte trocknet …“ | geändert, der Zeitgeber läuft |
| „Wird eingetragen …“ | die Anfrage ist unterwegs |
| „In der Chronik verzeichnet“ | der Server hat bestätigt |
| „Konnte nicht gespeichert werden“ | die Anfrage ist gescheitert; der Grund steht oben |

Der Zeitgeber heißt im Code *debounce*: Jeder Tastendruck verwirft den vorigen und setzt einen neuen. Ein getippter Name löst so eine einzige Anfrage aus statt zehn. Die Einzelheiten – und warum es dabei eine Sperre für den Live-Draht braucht – stehen im Kapitel „Die Oberfläche“ und in `frontend/src/pages/blatt/useBlatt.js`.

Fremde Blätter (geteilt, aber nicht die eigenen) stehen zum Lesen da: Alle Felder sind gesperrt, und statt des Speicherstands steht „Blatt von … – nur zum Lesen“.

## Der Kopf

Über den Reitern steht der Kopf des Blattes (`frontend/src/pages/blatt/Blattkopf.jsx`).

**Bildnis** (`data.portrait`). Ein Klick darauf öffnet die Dateiauswahl. Das Bild wird im Browser auf höchstens 320 Bildpunkte Kantenlänge verkleinert und als JPEG mit 85 % Qualität *in das Blatt selbst* geschrieben – als `data:`-Adresse, nicht als Datei daneben. Dadurch reist es mit, wenn das Blatt kopiert, umgezogen oder mitgenommen wird. Bilder, die der Browser nicht lesen kann (HEIC vom iPhone etwa), werden mit einer Meldung abgewiesen; am sichersten sind JPEG und PNG. Ohne Bildnis steht der erste Buchstabe des Namens da.

**Name** (Spalte `name`, nicht in `data`). Leer lässt er sich nicht speichern – der Server behält dann den alten.

**Unterzeile.** Volk · Klasse · Stufe, gerechnet aus `data.race`, `data.className` und `data.level`. Beim freien Blatt steht „Freies System“.

**Trefferpunkte.** Groß rechts: aktuell und höchstens, aus `data.combat.hp`. Nur zum Ablesen; geändert wird auf dem Reiter „Kampf“.

**Mitnehmen.** Speichert das Blatt als eigenständige HTML-Datei (siehe „Die Ausfuhr“ unten).

**Löschen.** Nur für die Besitzerin und die Spielleitung, mit Rückfrage. Gelöscht ist gelöscht – ein Blatt hat keinen Papierkorb. Figuren auf dem Spieltisch, die an dem Blatt hingen, bleiben stehen und verlieren nur die Verknüpfung.

## Reiter „Übersicht“

### Charakter

| Feld | Pfad | Vorgabe | Anmerkung |
|---|---|---|---|
| Volk | `race` | leer | frei; das Kompendium wird nicht befragt |
| Unterart | `subrace` | leer | |
| Klasse | `className` | leer | |
| Unterklasse | `subclass` | leer | |
| Stufe | `level` | 1 | mindestens 1; bestimmt den Übungsbonus |
| Hintergrund | `background` | leer | |
| Gesinnung | `alignment` | leer | |
| Spieler:in | `playerName` | leer | wer die Figur spielt – kann vom Konto abweichen |
| Aufstieg | `experienceMode` | `punkte` | `punkte` oder `meilenstein` |
| Erfahrung | `experience` | 0 | nur bei Aufstieg nach Punkten sichtbar |
| Maße | `units` | `metrisch` | `metrisch` oder `imperial`; siehe unten |

Unter den Feldern steht der **Übungsbonus**, gerechnet aus der Stufe: +2 auf Stufe 1 bis 4, +3 auf 5 bis 8, +4 auf 9 bis 12, +5 auf 13 bis 16, +6 auf 17 bis 20. Die Formel ist `⌊(Stufe − 1) / 4⌋ + 2` (`proficiencyBonus` in `frontend/src/lib/regeln/rechnen.js`).

Wer nach **Erfahrungspunkten** spielt, sieht daneben, welche Stufe die eingetragenen Punkte tragen und wie viele bis zur nächsten fehlen – nach der Tabelle des Grundregelwerks (300, 900, 2 700, 6 500 … bis 355 000 für Stufe 20). Weicht die eingetragene Stufe von der errechneten ab, erscheint ein Knopf „auf Stufe *n* setzen“. Der Almanach setzt die Stufe **nicht** von selbst: Wer aufsteigt, entscheidet am Tisch, und zwischen „genug Punkte“ und „aufgestiegen“ liegt oft eine lange Rast.

Wer nach **Meilensteinen** spielt, sieht kein Erfahrungsfeld, sondern den Satz „Die Stufe steigt, wenn die Geschichte es hergibt“. Die Punkte bleiben im Blatt gespeichert, falls die Runde einmal zurückwechselt.

### Attribute

Die sechs Attribute als Wappenschilde, jedes mit seinem Wert zum Eintippen und dem Modifikator darunter.

| Attribut | Pfad | Kürzel | Vorgabe |
|---|---|---|---|
| Stärke | `abilities.str` | STÄ | 10 |
| Geschicklichkeit | `abilities.dex` | GES | 10 |
| Konstitution | `abilities.con` | KON | 10 |
| Intelligenz | `abilities.int` | INT | 10 |
| Weisheit | `abilities.wis` | WEI | 10 |
| Charisma | `abilities.cha` | CHA | 10 |

Der **Modifikator** ist `⌊(Wert − 10) / 2⌋`: 10 und 11 geben +0, 12 und 13 geben +1, 8 und 9 geben −1. Ab +3 wird der Schild golden. Ein Klick auf den Modifikator würfelt eine Attributsprobe („Stärke-Probe“) für alle sichtbar.

### Rettungswürfe

Je Attribut ein Schalter „geübt“ (`savingThrows.<attribut>`, Vorgabe `false`) und der Bonus als Würfelknopf. Der Bonus ist der Modifikator des Attributs plus – wenn geübt – der Übungsbonus (`saveModifier`).

Darunter der **Vermerk** (`savingThrowNote`): ein freies Feld für alles, was für alle Rettungswürfe gilt und in kein Kästchen passt – „Vorteil auf Rettungswürfe, um Bezaubert zu vermeiden“.

### Fertigkeiten

Die achtzehn Fertigkeiten, jede mit Schalter „geübt“, bei geübten Fertigkeiten einem zweiten Schalter „Exp“ (Expertise) und dem Bonus als Würfelknopf. Gespeichert wird je Fertigkeit ein Paar: `skills.<schlüssel> = { proficient, expertise }`.

| Fertigkeit | Schlüssel | Attribut |
|---|---|---|
| Akrobatik | `acrobatics` | GES |
| Tierhandhabung | `animalHandling` | WEI |
| Arkane Kunde | `arcana` | INT |
| Athletik | `athletics` | STÄ |
| Täuschen | `deception` | CHA |
| Geschichte | `history` | INT |
| Motiv erkennen | `insight` | WEI |
| Einschüchtern | `intimidation` | CHA |
| Nachforschung | `investigation` | INT |
| Heilkunde | `medicine` | WEI |
| Naturkunde | `nature` | INT |
| Wahrnehmung | `perception` | WEI |
| Auftreten | `performance` | CHA |
| Überzeugen | `persuasion` | CHA |
| Religion | `religion` | INT |
| Fingerfertigkeit | `sleightOfHand` | GES |
| Heimlichkeit | `stealth` | GES |
| Überlebenskunst | `survival` | WEI |

Der **Bonus** einer Fertigkeit ist der Modifikator ihres Attributs plus einmal den Übungsbonus, wenn geübt, und zweimal, wenn mit Expertise (`skillModifier`). Wer das Häkchen „geübt“ abnimmt, verliert die Expertise gleich mit – Expertise ohne Übung gibt es nicht.

Unter der Liste stehen drei **passive Werte**: Passive Wahrnehmung, Passive Motiverkennung, Passive Nachforschung. Jeder ist 10 plus der Bonus der Fertigkeit (`passiverWert`). Sie gelten ohne Wurf; die Spielleitung schlägt sie nach, wenn sie nicht verraten will, dass es überhaupt etwas zu bemerken gab.

## Reiter „Kampf“

Der Reiter, an dem am Abend am meisten passiert, und der einzige, der auch *schreibend* mit dem Rest des Tisches verbunden ist.

### Kampfwerte

| Feld | Pfad | Vorgabe | Anmerkung |
|---|---|---|---|
| Rüstungsklasse | `combat.armorClass` | 10 | wandert beim Holen der Runde in den Kampf mit |
| Initiative-Bonus | `combat.initiativeBonus` | 0 | *zusätzlich* zum GES-Modifikator |
| Bewegung | `combat.speed` | 30 (Fuß) | in der Einheit des Blattes angezeigt |
| Trefferwürfel | `combat.hitDice` | `1d8` | Freitext wie auf dem gedruckten Bogen |
| Inspiration | `inspiration` | aus | ein Schalter |

Darunter die **Initiative gesamt**: GES-Modifikator plus Initiative-Bonus, als Würfelknopf. Er würfelt für alle sichtbar – trägt das Ergebnis aber *nicht* in die Kampfliste ein. Das geschieht über den Knopf „Eigene Initiative würfeln“ in der Kampfliste selbst; das Blatt weiß nicht, ob gerade gekämpft wird.

### Trefferpunkte

| Feld | Pfad | Vorgabe | Grenzen |
|---|---|---|---|
| Aktuelle TP | `combat.hp.current` | 10 | −99 bis 999 |
| Maximale TP | `combat.hp.max` | 10 | 0 bis 999 |
| Temporäre TP | `combat.hp.temp` | 0 | 0 bis 999 |

Jedes Feld ist ein Zähler mit Minus- und Plusknopf. Aktuelle Trefferpunkte dürfen unter null fallen: Manche Runden spielen mit massivem Schaden, und die Zahl soll dann dastehen, statt still auf null gekappt zu werden.

Die Trefferpunkte sind die, die die Spielleitung in der Kampfliste sieht: Wer hier einen Treffer einträgt, dessen Kämpfer verliert ihn im selben Moment dort; wer dort verwundet wird, sieht es hier. Der Server gleicht nur ab, was sich wirklich geändert hat – jeder Tastendruck am Blatt speichert, aber nicht jeder betrifft die Trefferpunkte.

### Trefferwürfel

Der Vorrat für die kurze Rast, gezählt als Verbrauch:

| Feld | Pfad | Vorgabe |
|---|---|---|
| Würfelart (W) | `combat.hitDicePool.size` | 8 |
| Vorrat | `combat.hitDicePool.total` | 1 |
| Verbraucht | `combat.hitDicePool.used` | 0 |

Der Knopf **„Würfel ausgeben (n)“** würfelt einen Trefferwürfel plus den KON-Modifikator (`1W8+2`), zählt `used` um eins hoch und schreibt das Ergebnis den aktuellen Trefferpunkten gut – nie über das Maximum. In Klammern steht, wie viele Würfel noch übrig sind; bei null ist der Knopf gesperrt.

### Rettungswürfe gegen den Tod

Drei Kreise für Erfolge (`combat.deathSaves.successes`) und drei für Fehlschläge (`combat.deathSaves.failures`), von Hand zu setzen – und ein Knopf **„Würfeln“**, der den Wurf selbst einträgt:

| Augen | Folge |
|---|---|
| 20 | Die Figur kommt mit 1 TP wieder zu sich; beide Zähler auf null. |
| 10 bis 19 | ein Erfolg |
| 2 bis 9 | ein Fehlschlag |
| 1 | zwei Fehlschläge |

Nach drei Erfolgen steht „Drei Erfolge – du bist stabil“, nach drei Fehlschlägen „Das war der letzte Atemzug“. Der Almanach entscheidet dabei nichts über Leben und Tod – er zählt nur und sagt, was die Regel sagt. Die Knöpfe sind absichtlich groß: Wer bei 0 Trefferpunkten liegt, soll sie im Halbdunkel treffen.

Weil beim Wurf mehrere Felder auf einmal wechseln (Trefferpunkte *und* beide Zähler), ersetzt der Knopf das ganze Blatt in einem Zug (`replace` statt `update`). Sonst könnten zwei getrennte Speichervorgänge einander überholen.

### Rasten

Zwei Knöpfe, deren Regeln in `frontend/src/lib/rasten.js` stehen:

**Kurze Rast.** Alle Ressourcen, die sich bei kurzer Rast erneuern, füllen sich auf. Trefferwürfel werden *nicht* von selbst ausgegeben – das tut man einzeln mit dem Knopf oben, so oft man will.

**Lange Rast** (mit Rückfrage). In einem Zug:

- Trefferpunkte auf das Maximum, temporäre auf null;
- die Hälfte der verbrauchten Trefferwürfel zurück – genauer: die Hälfte des *Vorrats*, abgerundet, mindestens einer;
- alle Zauberplätze frei;
- Rettungswürfe gegen den Tod vergessen;
- eine Stufe Erschöpfung weniger (nie unter null);
- Konzentration beendet;
- alle Ressourcen, die sich bei kurzer oder langer Rast erneuern, aufgefüllt.

### Zustand

**Zustände** (`combat.conditions`, eine Liste von Namen): vierzehn Knöpfe zum Umschalten – Bezaubert, Betäubt, Blind, Bewusstlos, Festgesetzt, Gelähmt, Gepackt, Handlungsunfähig, Liegend, Taub, Verängstigt, Vergiftet, Versteinert, Unsichtbar.

**Erschöpfung** (`combat.exhaustion`, 0 bis 6): sieben Knöpfe, über ihnen der kurze Text der gewählten Stufe:

| Stufe | Wirkung |
|---|---|
| 0 | keine Erschöpfung |
| 1 | Nachteil auf Attributswürfe |
| 2 | Bewegungsrate halbiert |
| 3 | Nachteil auf Angriffe und Rettungswürfe |
| 4 | Trefferpunktemaximum halbiert |
| 5 | Bewegungsrate auf 0 |
| 6 | Tod |

Die Stufen bauen aufeinander auf; der Almanach zeigt die Wirkung an, rechnet sie aber nicht ein (die Bewegung auf dem Blatt halbiert sich nicht von selbst).

**Konzentration** (`combat.concentration = { active, spell }`): ein Schalter und das Feld „worauf“. Solange sie aktiv ist, erscheint darunter ein Feld für erlittenen Schaden und der Knopf **„Konzentration prüfen“**. Der Schwierigkeitsgrad ist 10 oder die Hälfte des Schadens, was höher ist; gewürfelt wird ein Konstitutions-Rettungswurf mit dem Bonus des Blattes. Bricht die Konzentration, räumt der Almanach den Zauber gleich selbst ab.

### Widerstand und Sinne

| Feld | Pfad | Vorgabe |
|---|---|---|
| Resistenzen | `combat.defenses.resistances` | leer |
| Immunitäten | `combat.defenses.immunities` | leer |
| Verwundbarkeiten | `combat.defenses.vulnerabilities` | leer |
| Sichtweite | `combat.senses.sight` | 0 (unbegrenzt) |
| Dunkelsicht | `combat.senses.darkvision` | 0 |
| Blindsicht | `combat.senses.blindsight` | 0 |
| Erschütterung | `combat.senses.tremorsense` | 0 |
| Wahrer Blick | `combat.senses.truesight` | 0 |
| Weitere Sinne | `combat.senses.notes` | leer |

Die Sinne sind die Felder, an denen am Spieltisch der Nebel hängt:

- **Sichtweite** ist, wie weit der Blick bei Licht reicht. 0 heißt unbegrenzt – bei Tageslicht sieht man bis zum Horizont. Wer etwas einträgt, bekommt am Spieltisch ein Nebelfenster, das an der eigenen Figur hängt.
- **Dunkelsicht, Blindsicht, Erschütterung, Wahrer Blick** zählen erst in einer *dunklen* Szene. Dann nimmt die Figur so weit wahr, wie der weiteste dieser vier Sinne reicht, auch ohne jedes Licht.
- Im Dunkeln reicht der Blick außerdem so weit, wie die Sichtweite **oder die eigene Fackel** trägt – was von beidem weiter ist.

Die genaue Rechnung steht im Kapitel „Sicht und Nebel“. Eingetragen wird in der Einheit des Blattes (in Metern in Schritten von 1, in Fuß in Schritten von 5), gespeichert immer in Fuß.

### Klassenressourcen

Selbstverwaltete Zähler für alles, was eine Klasse zählen muss: Wutanfälle, Ki-Punkte, bardische Inspiration, Handauflegen, Zauberkraft. Statt für jede Klasse ein eigenes Feld zu bauen, trägt man sich ein, was man braucht (`resources`, eine Liste):

| Feld | Schlüssel | Anmerkung |
|---|---|---|
| Name | `name` | |
| Übrig | `current` | Zähler, höchstens `max` |
| Höchstens | `max` | |
| Erneuert sich | `recharge` | `kurz` (kurze Rast), `lang` (lange Rast), `keine` (von Hand) |

Jede Ressource trägt außerdem eine Kennung (`id`), damit sich zwei gleichnamige nicht in die Quere kommen.

### Aktionen

Oben die **Standardaktionen**, die jede Figur ohne Eintrag kann – Angreifen, Zaubern, Spurt, Rückzug, Ausweichen, Helfen, Verstecken, Bereit machen, Suchen, Nutzen, Ringen, Stoßen, Studieren, Beeinflussen, Improvisieren, dazu Kampf mit zwei Waffen (Bonusaktion), Gelegenheitsangriff (Reaktion) und Mit einem Objekt interagieren (frei). Jede mit einem Satz, was sie tut. Sie stehen da, damit niemand nachschlagen muss.

Darunter „Was du außerdem kannst“ (`actions`): eigene Fähigkeiten, die eine Handlung kosten – Handauflegen, Zweiter Wind, Wildgestalt. Jede Zeile hat `name` („Was“), `art` („Kostet“: `aktion`, `bonus`, `reaktion`, `frei`) und `description` („Wirkung“).

### Angriffe & Zaubertricks

Eine Liste (`attacks`) mit den Spalten `name` („Angriff / Zauber“), `bonus`, `damage` („Schaden / Art“) und `notes`. Für jede Zeile mit Namen erscheinen darunter zwei Knöpfe:

- **der Name** würfelt den Angriff: einen W20 plus die Zahl aus „Bonus“ (ein vorangestelltes Plus wird überlesen);
- **„Schaden“** würfelt den Schaden. Aus dem Eintrag wird dafür alles bis auf Ziffern, `d`, `w` und Vorzeichen weggeworfen: „2d6 + 3 Hieb“ ist ein guter Eintrag für die Spielerin, aber ein schlechter Würfelausdruck – übrig bleibt `2d6+3`.

## Reiter „Inventar“

### Beutel & Münzen

Fünf Zahlen (`currency`), alle mit Vorgabe 0: Platin (`pp`), Gold (`gp`), Elektrum (`ep`), Silber (`sp`), Kupfer (`cp`). Die Münzen auf dem Blatt gehören der Figur; die gemeinsame Beute liegt in der Beutekiste am Spieltisch und kommt erst beim Auszahlen hierher – das tragen die Spielenden selbst ein.

### Ausrüstung

Eine Liste (`inventory`) mit `name` („Gegenstand“), `qty` („Anzahl“), `weight` („Gewicht“) und `notes`. Das Gewicht gilt **je Stück** und wird in der Einheit des Blattes eingetragen, aber immer in Pfund gespeichert; das angezeigte Gewicht ist auf eine Stelle gerundet, das gespeicherte eine Stelle genauer, damit ein Wert beim Hin- und Herrechnen nicht wandert.

Darunter die **Traglast**, nach dem Grundregelwerk:

| Marke | Rechnung |
|---|---|
| Getragenes Gewicht | Summe aus Gewicht × Anzahl aller Gegenstände |
| Überladen ab | Stärke × 15 Pfund |
| Schieben / Ziehen / Heben | Stärke × 30 Pfund |

Wer mehr trägt, als die Marke „Überladen ab“ erlaubt, sieht die Zahl rot und darunter einen Satz. Verboten wird nichts – die meisten Runden spielen ohne Traglast, und dann soll sie nur ein Hinweis sein.

### Angelegte magische Gegenstände

Drei Plätze (`attunement`, eine Liste aus drei Texten). Auf mehr als drei magische Gegenstände lässt sich niemand einstimmen, und mehr Plätze gibt es deshalb auch nicht.

## Reiter „Zauber“

### Zauberwirken

| Feld | Pfad | Vorgabe |
|---|---|---|
| Zauberattribut | `spellcasting.ability` | `int` |

Daraus gerechnet, und nur zum Ablesen:

- **Zauber-SG** = 8 + Übungsbonus + Modifikator des Zauberattributs;
- **Angriffsbonus** = Übungsbonus + Modifikator des Zauberattributs.

Das Blatt kennt außerdem zwei Felder, die diese Rechnung übersteuern: `spellcasting.manualSaveDC` und `spellcasting.manualAttackBonus`. Stehen sie auf einer Zahl statt auf `null`, gilt die Zahl – für Figuren mit einem magischen Fokus oder einer Hausregel. Auf dem Reiter gibt es für sie bisher kein Eingabefeld; sie stehen im Datenmodell, damit die Ausfuhr und das Blatt dieselbe Zahl zeigen, sobald eines dazukommt.

### Zauberplätze

Je Grad von 1 bis 9 ein Paar `spellcasting.slots.<grad> = { max, used }`. Gezählt wird **Verbrauch**, nicht Vorrat: Der Zähler oben ist `used`, darunter „von *max*“. Wird `max` gesenkt, rückt `used` mit, damit nie mehr verbraucht als vorhanden ist. Eine lange Rast setzt alle `used` auf null. Zaubertricks (Grad 0) brauchen keine Plätze und haben deshalb keinen.

### Zauber aus dem Kompendium übernehmen

Ein Suchfeld über der Liste aller Zauber der offenen 5e-Schnittstelle. Die Liste wird einmal geladen und dann im Browser durchsucht – ohne Verzögerung und ohne Anfrage je Tastendruck; gezeigt werden die ersten zwanzig Treffer. Ein Klick übernimmt den Zauber mit Name, Grad und seinen Spalten (Zeit, Reichweite, Komponenten, Dauer, Rettungswurf oder Angriff).

Übernommen wird eine **Abschrift**, kein Verweis: Das Blatt soll auch dann vollständig sein, wenn das Kompendium gerade nicht erreichbar ist. Ist es das nicht, erscheint ein Hinweis, und man trägt Zauber mit **„Eigenen Zauber eintragen“** von Hand ein. Ein Zauber, der schon auf dem Blatt steht (gleicher Name), wird nicht zweimal übernommen.

### Zauberliste

Die Zauber (`spellcasting.spells`, eine Liste) stehen nach Grad geordnet, innerhalb eines Grades nach dem Alphabet – erst „Zaubertricks (nach Belieben)“, dann „Zauber vom 1. Grad“ und so fort. Jeder Eintrag hat:

| Feld | Schlüssel | Anmerkung |
|---|---|---|
| Name | `name` | |
| Grad | `level` | 0 für Zaubertricks |
| Vorbereitet | `prepared` | Häkchen |
| Quelle | `source` | Klasse, Abstammung, Talent – bleibt beim Übernehmen leer |
| RW / Angriff | `save` | etwa „WEI-RW“ oder „Angriff“ |
| Zeit | `time` | Wirkzeit |
| Reichweite | `range` | |
| Komponenten | `components` | „V, S, M“; ein „(M)“ zeigt, dass ein Material nötig ist |
| Dauer | `duration` | |
| Seite | `page` | zum Nachschlagen im Buch |
| Anmerkungen | `notes` | |
| Kompendiumsschlüssel | `index` | nur bei übernommenen Zaubern |

Ein Klick auf einen Zauber **schlägt ihn auf**: Seine Spalten stehen zum Bearbeiten da, und darunter der volle Text aus dem Kompendium – geholt beim ersten Aufschlagen und gemerkt, solange das Blatt offen ist.

## Reiter „Hintergrund“

Der einzige Reiter, auf dem nichts gerechnet wird.

### Erscheinung

Neun kurze Felder unter `appearance`: Geschlecht (`gender`), Alter (`age`), Statur (`size`), Körpergröße (`height`), Gewicht (`weight`), Glaube (`faith`), Haut (`skin`), Augen (`eyes`), Haare (`hair`). Dazu zwei längere: **Erscheinungsbild** (`traits.look`) und **Verbündete & Organisationen** (`traits.allies`).

Das Gewicht hier ist Freitext und wird *nicht* umgerechnet – es beschreibt die Figur, es ist keine Regel.

### Wesenszüge, Chronik, Übungen

| Karte | Felder |
|---|---|
| Wesenszüge | Persönlichkeit (`traits.personality`), Ideale (`traits.ideals`), Bindungen (`traits.bonds`), Makel (`traits.flaws`) |
| Chronik | die Vorgeschichte (`traits.backstory`) |
| Übungen & Sprachen | Rüstungen (`proficiencies.armor`), Waffen (`proficiencies.weapons`), Werkzeuge (`proficiencies.tools`), Sprachen (`proficiencies.languages`) |
| Lose Notizen | `traits.notes` |

Die Karte „Chronik“ auf dem Blatt ist die Vorgeschichte der Figur – nicht zu verwechseln mit der Chronik der Kampagne, die der Almanach selbst schreibt.

### Merkmale & Eigenschaften

Eine Liste (`features`) mit `name`, `category` („Woher“), `source`, `page` und `description`. Die Herkunft ist eine von fünf: Klasse, Spezies, Talent, Hintergrund, Sonstiges.

Unter der Eingabeliste stehen die ausgefüllten Merkmale noch einmal **nach Herkunft geordnet** – erst die Klasse, dann die Spezies, dann Talente, Hintergrund und Sonstiges –, mit Quelle und Seite. Am Tisch sucht man genau so: „Was gibt mir noch mal mein Hintergrund?“

## Das freie Blatt

Ein Blatt mit einem anderen System als `dnd5e` hat keine Reiter, sondern eine einzige Seite:

- **Kurzbeschreibung** (`summary`), ein Textfeld;
- beliebig viele **Abschnitte** (`sections`, eine Liste aus `{ id, title, content }`) mit selbst gewählter Überschrift und freiem Text. Ein neues freies Blatt beginnt mit „Werte“, „Ausrüstung“, „Hintergrund“ und „Notizen“.

Kein Wert ist hier ein Würfelknopf, nichts wird gerechnet. Dafür taugt das freie Blatt für Call of Cthulhu, Vampire, DSA oder ein selbst gebautes System. Das Bildnis, das Mitnehmen, das Teilen und das Zuteilen funktionieren wie beim 5e-Blatt.

## Weiten und Gewichte

Die eine Regel, die das ganze Blatt trägt: **Gespeichert wird immer in Fuß und Pfund, angezeigt wahlweise metrisch.** Umgerechnet wird erst beim Anzeigen und beim Eintippen (`frontend/src/lib/regeln/masse.js`).

| | gespeichert | angezeigt metrisch | Umrechnung |
|---|---|---|---|
| Weite | Fuß | Meter | × 0,3 (gesetzt, nicht gemessen) |
| Gewicht | Pfund | Kilogramm | × 0,45359237 (genau) |

Bei Weiten wird bewusst *gesetzt* statt gerechnet: Das Regelwerk sagt „ein Feld sind 5 Fuß oder 1,5 m“ und rechnet nicht um. Mit 0,3 m je Fuß werden aus 30 Fuß glatte 9 m und aus 60 Fuß Dunkelsicht glatte 18 m – so, wie es im deutschen Regelwerk steht. Beim Gewicht dagegen wird ehrlich umgerechnet, denn Traglast ist eine Regel, die man ausrechnet.

Warum nicht einfach in Metern speichern? Aus zwei Gründen. Erstens sammelten sich sonst bei jedem Öffnen und Schließen Rundungsfehler an. Zweitens ist ein Blatt dann dasselbe, gleich wer es aufschlägt: Die Spielleitung darf in Fuß denken, die Spielerin in Metern, und der Server rechnet die Sicht aus einem einzigen Wert.

**Neue Blätter sind metrisch.** Blätter, die älter sind als die Umstellung, haben kein Maßsystem gespeichert; sie werden am Inhalt erkannt (wer schon Attribute oder Kampfwerte hat, wurde vorher geführt) und behalten Fuß und Pfund, damit über Nacht keine anderen Zahlen dastehen.

## Die Ausfuhr

Der Knopf **„Mitnehmen“** im Kopf des Blattes erzeugt eine einzige HTML-Datei mit dem ganzen Blatt (`frontend/src/lib/blattAusfuhr.js`):

- Sie braucht **weder Netz noch Server**: Stilblatt und Druckskript stecken darin, das Bildnis ist als `data:`-Adresse eingebettet. Doppelklicken genügt, auf jedem Gerät.
- Gedruckt sieht sie aus wie ein **Charakterbogen**: Kopf mit Bildnis, Übungsbonus und passiver Wahrnehmung, dann Attribute, Kampfwerte, Verteidigung und Zustand, Rettungswürfe, Sinne, Fertigkeiten, Angriffe, Aktionen, Ressourcen, Zauber samt ihren vollen Beschreibungen aus dem Kompendium, Ausrüstung, Merkmale, Aussehen und Hintergrund. Leere Abschnitte fallen weg.
- Am Ende der Datei steckt der **vollständige Datensatz** als JSON (`<script type="application/json" id="almanach-daten">`). Die Datei ist damit zugleich eine Sicherung, aus der sich ein verlorenes Blatt wiederherstellen lässt.
- Der Dateiname ist der Name der Figur mit dem Datum, Umlaute umschrieben („Kapitaen Sturmhand-2026-09-30.html“) – ein Dateiname mit „ä“ überlebt nicht jeden Browser und nicht jeden USB-Stick.

Änderungen in der mitgenommenen Datei wandern nicht zurück; am Spieltisch gilt das Blatt im Almanach. Wie die Datei im Einzelnen gebaut ist, steht im Kapitel „Das Blatt: Datenmodell und Ausfuhr“.

## Die Vorlagen

Jede neue Kampagne bringt zwölf fertige Charaktere mit – einer je Klasse und je Spezies, alle auf Stufe 1, mit Startausrüstung, Zaubern und Merkmalen, gebaut nach dem Standardwertesatz (15, 14, 13, 12, 10, 8) plus den Boni des Hintergrunds nach den Regeln von 2024. Sie liegen als NSC-Blätter hinter dem Schirm. Wer eine davon spielen will:

1. Die Spielleitung öffnet die Übersicht und wählt bei der Vorlage „Abschrift“. Die Abschrift gehört ihr und ist kein NSC-Blatt mehr.
2. Im Reiter „Runde“ hinter dem Schirm teilt sie die Abschrift der Spielerin zu.
3. Die Vorlage selbst bleibt liegen und steht für die nächste Runde bereit.

Eine gelöschte Vorlage wächst nicht nach. Wer sie zurückhaben will, ruft auf dem Rechner des Almanachs `npm run vorlagen` auf (Kapitel „Betrieb im Alltag“). Alle zwölf mit ihren Werten stehen im Verzeichnis „Vorlagen“ am Ende des Buches.

## Für alle, die am Code arbeiten: ein Feld ergänzen

Weil der Server den Inhalt des Blattes nicht kennt, ist ein neues Feld reine Sache der Oberfläche – aber eine, bei der man drei Stellen treffen muss.

**1. Das leere Blatt und das Auffüllen.** In `frontend/src/lib/regeln/leeresBlatt.js` stehen zwei Funktionen, und das neue Feld gehört in **beide**:

- `defaultCharacterData()` liefert ein vollständiges, leeres Blatt.
- `withDefaults(data)` ergänzt an einem *vorhandenen* Blatt alles, was seither dazugekommen ist. Sie läuft bei jedem Öffnen eines 5e-Blattes.

Steht das Feld nur in der ersten, stürzt die Oberfläche über jedem Blatt ab, das älter ist als das Feld – `data.combat.neuesFeld.wert` auf `undefined` ist ein weißer Bildschirm. `withDefaults` ist die Wanderung, die es für das Blatt in der Datenbank nicht gibt. Sie schreibt nichts zurück; gespeichert wird das aufgefüllte Blatt erst, wenn ohnehin etwas geändert wird.

Für verschachtelte Felder reicht ein flaches `{ ...vorgabe, ...data }` nicht: Es übernähme ein altes `combat` ohne das neue Unterfeld. Deshalb füllt `withDefaults` jede Ebene einzeln auf (`combat.hp`, `combat.senses` …). Ein neues Unterobjekt bekommt dort seine eigene Zeile.

**2. Der Reiter.** Das Feld braucht ein Eingabefeld auf einem Reiter. Reiter halten keinen eigenen Zustand; sie bekommen `data`, `update(pfad, wert)` und `replace(data)`:

```jsx
<NumberField
  label="Neues Feld"
  value={data.combat.neuesFeld}
  onChange={(v) => update('combat.neuesFeld', v)}
/>
```

Wer mehrere Felder in einem Zug ändert, baut ein neues Blatt und ruft `replace` – nie zweimal `update` hintereinander, denn jedes `update` stößt ein eigenes Speichern an.

**3. Die Ausfuhr.** Soll das Feld auch auf dem mitgenommenen Blatt stehen, bekommt der passende Abschnitt in `frontend/src/lib/blatt/abschnitte/` eine Zeile. Die Abschnitte bekommen das schon aufgefüllte Blatt und dürfen sich darauf verlassen, dass das Feld existiert.

**4. Die Vorlagen** (falls das Feld bei ihnen einen besonderen Wert haben soll). `backend/src/vorlagen/bauen.js` baut die zwölf Vorlagen aus knappen Steckbriefen; was dort nicht gesetzt wird, ergänzt `withDefaults` beim Öffnen ohnehin.

**5. Die Probe.** `scripts/blattprobe.mjs` prüft die Rechnungen des Blattes (340 Prüfungen). Kommt eine Rechnung dazu, kommt dort eine Prüfung dazu; `npm run blattprobe` läuft in unter einer Sekunde.

Soll der **Server** auf das neue Feld reagieren – so wie auf Trefferpunkte und Sinne –, ist das eine größere Änderung: Sie gehört in `PUT /api/characters/:id` und in den Vertrag (`scripts/vertrag/`), und sie macht aus dem JSON-Klumpen an dieser einen Stelle ein Feld, das der Server kennt. Das sollte die Ausnahme bleiben.

### Altlasten im Blatt

Zwei Felder stehen noch im Code, obwohl nichts sie mehr füllt:

- `data.mini` reicht `withDefaults` durch. Es stammt aus der Zeit der Figurenschmiede, die entfernt wurde; ältere Blätter können es noch tragen, und es soll beim Speichern nicht verloren gehen.
- `data.miniMediaId` liest „Runde holen“ als Figurenbild des Kämpfers. Neue Blätter setzen es nicht; es bleibt `null`.

Beide dürfen bleiben, solange es Blätter aus jener Zeit gibt. Wer sie entfernt, muss vorher sicher sein, dass keines mehr im Umlauf ist – eine mitgenommene Ausfuhrdatei zählt dabei nicht, denn aus ihr wird nicht automatisch zurückgelesen.
