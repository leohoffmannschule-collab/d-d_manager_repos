# Die Regeln, mit denen das Blatt rechnet

> Dieses Kapitel schreibt `npm run handbuch` aus dem Code (scripts/handbuch/referenz/).
> Änderungen gehören in den Code und seine Kommentare, nicht hierher.

Alles, was das Charakterblatt selbst ausrechnet, und die Listen, aus denen es seine Auswahlfelder füllt. Die Zahlen in den Tabellen sind nicht abgeschrieben, sondern beim Bau des Handbuchs mit denselben Funktionen gerechnet, die auch das Blatt benutzt (frontend/src/lib/regeln/).

## Attribute und Modifikatoren

Die sechs Attribute: Stärke (`str`), Geschicklichkeit (`dex`), Konstitution (`con`), Intelligenz (`int`), Weisheit (`wis`), Charisma (`cha`). Der Modifikator ist (Wert − 10) / 2, abgerundet – ausgerechnet von `abilityModifier`:

| Wert | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Mod. | -5 | -4 | -4 | -3 | -3 | -2 | -2 | -1 | -1 | +0 |
| Wert | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
| Mod. | +0 | +1 | +1 | +2 | +2 | +3 | +3 | +4 | +4 | +5 |
| Wert | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 |
| Mod. | +5 | +6 | +6 | +7 | +7 | +8 | +8 | +9 | +9 | +10 |

## Stufe, Erfahrung und Übungsbonus

Die Stufe folgt aus den Erfahrungspunkten (`levelFromExperience`), der Übungsbonus aus der Stufe (`proficiencyBonus`). Er steckt in jedem geübten Rettungswurf, jeder geübten Fertigkeit (doppelt bei Expertise), im Zauber-SG und im Zauberangriff.

| Stufe | ab EP | Übungsbonus |
|---|---|---|
| 1 | 0 | +2 |
| 2 | 300 | +2 |
| 3 | 900 | +2 |
| 4 | 2.700 | +2 |
| 5 | 6.500 | +3 |
| 6 | 14.000 | +3 |
| 7 | 23.000 | +3 |
| 8 | 34.000 | +3 |
| 9 | 48.000 | +4 |
| 10 | 64.000 | +4 |
| 11 | 85.000 | +4 |
| 12 | 100.000 | +4 |
| 13 | 120.000 | +5 |
| 14 | 140.000 | +5 |
| 15 | 165.000 | +5 |
| 16 | 195.000 | +5 |
| 17 | 225.000 | +6 |
| 18 | 265.000 | +6 |
| 19 | 305.000 | +6 |
| 20 | 355.000 | +6 |

Wer ohne Erfahrungspunkte spielt, stellt im Blatt auf „Meilensteine“ um; die Stufe wird dann von Hand gesetzt.

## Fertigkeiten

Jede Fertigkeit hängt an einem Attribut. Ihr Bonus ist dessen Modifikator plus – wenn geübt – der Übungsbonus, bei Expertise zweimal (`skillModifier`).

| Fertigkeit | Schlüssel | Attribut |
|---|---|---|
| Akrobatik | `acrobatics` | Geschicklichkeit |
| Tierhandhabung | `animalHandling` | Weisheit |
| Arkane Kunde | `arcana` | Intelligenz |
| Athletik | `athletics` | Stärke |
| Täuschen | `deception` | Charisma |
| Geschichte | `history` | Intelligenz |
| Motiv erkennen | `insight` | Weisheit |
| Einschüchtern | `intimidation` | Charisma |
| Nachforschung | `investigation` | Intelligenz |
| Heilkunde | `medicine` | Weisheit |
| Naturkunde | `nature` | Intelligenz |
| Wahrnehmung | `perception` | Weisheit |
| Auftreten | `performance` | Charisma |
| Überzeugen | `persuasion` | Charisma |
| Religion | `religion` | Intelligenz |
| Fingerfertigkeit | `sleightOfHand` | Geschicklichkeit |
| Heimlichkeit | `stealth` | Geschicklichkeit |
| Überlebenskunst | `survival` | Weisheit |

Drei davon stehen auch *passiv* auf dem Blatt – zehn plus der Bonus, ohne Würfel (`passiverWert`): Passive Wahrnehmung, Passive Motiverkennung, Passive Nachforschung.

## Zauberwirken

Zauber-SG = 8 + Übungsbonus + Modifikator des Zauberattributs (`spellSaveDC`); Zauberangriff = Übungsbonus + Modifikator (`spellAttackBonus`). Beides lässt sich im Blatt von Hand überschreiben, etwa für einen magischen Fokus.

| Stufe | Attribut 14 | Attribut 16 | Attribut 18 | Attribut 20 |
|---|---|---|---|---|
| 1 | SG 12 / +4 | SG 13 / +5 | SG 14 / +6 | SG 15 / +7 |
| 5 | SG 13 / +5 | SG 14 / +6 | SG 15 / +7 | SG 16 / +8 |
| 9 | SG 14 / +6 | SG 15 / +7 | SG 16 / +8 | SG 17 / +9 |
| 13 | SG 15 / +7 | SG 16 / +8 | SG 17 / +9 | SG 18 / +10 |
| 17 | SG 16 / +8 | SG 17 / +9 | SG 18 / +10 | SG 19 / +11 |

Beispiel: Eine Spielfigur der Stufe 5 mit Weisheit 14 und geübter Wahrnehmung hat Wahrnehmung +5 und passive Wahrnehmung 15.

Zauberplätze gibt es für die Grade 1, 2, 3, 4, 5, 6, 7, 8, 9; Zaubertricks (Grad 0) brauchen keinen.

## Traglast

Tragkraft = Stärke × 15 Pfund (`carryingCapacity`). Wer mehr trägt, ist überladen; bis zum Doppelten lässt sich noch schieben, ziehen und heben (`traglastStufen`).

| Stärke | trägt bis | schiebt bis | metrisch |
|---|---|---|---|
| 8 | 120 Pfund | 240 Pfund | 54,4 kg / 108,9 kg |
| 10 | 150 Pfund | 300 Pfund | 68 kg / 136,1 kg |
| 12 | 180 Pfund | 360 Pfund | 81,6 kg / 163,3 kg |
| 14 | 210 Pfund | 420 Pfund | 95,3 kg / 190,5 kg |
| 16 | 240 Pfund | 480 Pfund | 108,9 kg / 217,7 kg |
| 18 | 270 Pfund | 540 Pfund | 122,5 kg / 244,9 kg |
| 20 | 300 Pfund | 600 Pfund | 136,1 kg / 272,2 kg |

## Maße

Gespeichert wird immer in Fuß und Pfund; angezeigt wahlweise Meter und Kilogramm oder Fuß und Pfund. Weiten werden wie im Regelwerk *gesetzt*, nicht umgerechnet – 0,3 m je Fuß, so dass ein Feld von 5 Fuß 1,5 m misst –, Gewichte dagegen ehrlich umgerechnet (0,45359237 kg je Pfund).

| Fuß | Meter | | Pfund | Kilogramm |
|---|---|---|---|---|
| 5 | 1,5 | | 1 | 0,5 |
| 10 | 3 | | 5 | 2,3 |
| 30 | 9 | | 25 | 11,3 |
| 60 | 18 | | 100 | 45,4 |
| 120 | 36 | | 300 | 136,1 |

## Zustände und Erschöpfung

Die Zustände des Regelwerks, wie sie im Blatt und in der Kampfliste heißen: Bezaubert, Betäubt, Blind, Bewusstlos, Festgesetzt, Gelähmt, Gepackt, Handlungsunfähig, Liegend, Taub, Verängstigt, Vergiftet, Versteinert, Unsichtbar.

Erschöpfung wirkt in Stufen, jede zusätzlich zu den vorigen:

| Stufe | Wirkung |
|---|---|
| 0 | keine Erschöpfung |
| 1 | Nachteil auf Attributswürfe |
| 2 | Bewegungsrate halbiert |
| 3 | Nachteil auf Angriffe und Rettungswürfe |
| 4 | Trefferpunktemaximum halbiert |
| 5 | Bewegungsrate auf 0 |
| 6 | Tod |

## Aktionen

Was eine Handlung kostet: Aktion, Bonusaktion, Reaktion, Freie Handlung. Was jede Figur immer tun kann, steht auf dem Blatt unter „Standardaktionen“:

| Handlung | kostet | Wirkung |
|---|---|---|
| Angreifen | Aktion | Ein Angriff mit einer Waffe oder ein unbewaffneter Schlag. |
| Zaubern | Aktion | Einen Zauber wirken, dessen Wirkzeit eine Aktion beträgt. |
| Spurt | Aktion | Zusätzliche Bewegung in Höhe deiner Bewegungsrate. |
| Rückzug | Aktion | Deine Bewegung löst in diesem Zug keine Gelegenheitsangriffe aus. |
| Ausweichen | Aktion | Angriffe gegen dich haben Nachteil, deine Geschicklichkeits-Rettungswürfe Vorteil. |
| Helfen | Aktion | Einem Verbündeten Vorteil verschaffen – oder ihn stabilisieren. |
| Verstecken | Aktion | Heimlichkeitsprobe gegen SG 15; bei Erfolg giltst du als unsichtbar. |
| Bereit machen | Aktion | Eine Aktion an eine Bedingung knüpfen und als Reaktion auslösen. |
| Suchen | Aktion | Wahrnehmung, Nachforschung, Motiv erkennen oder Überlebenskunst einsetzen. |
| Nutzen | Aktion | Einen Gegenstand oder eine besondere Fähigkeit benutzen. |
| Ringen | Aktion | Athletik gegen Athletik oder Akrobatik – das Ziel wird Gepackt. |
| Stoßen | Aktion | Athletik gegen Athletik oder Akrobatik – das Ziel wird 1,5 m geschoben oder Liegend. |
| Studieren | Aktion | Arkane Kunde, Geschichte, Naturkunde, Religion oder Nachforschung. |
| Beeinflussen | Aktion | Täuschen, Einschüchtern, Auftreten, Überzeugen oder Tierhandhabung. |
| Improvisieren | Aktion | Etwas versuchen, wofür keine Regel vorgesehen ist. |
| Kampf mit zwei Waffen | Bonusaktion | Angriff mit der leichten Waffe in der anderen Hand, nachdem du angegriffen hast. |
| Gelegenheitsangriff | Reaktion | Wenn ein Feind deine Reichweite zu Fuß verlässt. |
| Mit einem Objekt interagieren | Freie Handlung | Einmal je Zug nebenbei: ziehen, öffnen, aufheben, ablegen. |

## Merkmale und Aussehen

Woher ein Merkmal stammt, entscheidet, unter welcher Überschrift es auf dem Blatt steht: Klasse, Spezies, Talent, Hintergrund, Sonstiges.

Die Felder der Seite „Aussehen“: Geschlecht, Alter, Statur, Körpergröße, Gewicht, Glaube, Haut, Augen, Haare.
