# Ein Spielabend von Anfang bis Ende

Die Anleitungen für die Runde und für die Spielleitung sagen, *was* man tut. Dieses Kapitel erzählt einen ganzen Abend am Stück und sagt bei jedem Schritt auch, *was dabei im Almanach geschieht*: welcher Weg aufgerufen wird, was der Server prüft, wer welche Nachricht bekommt und was in der Chronik landet. Es ist damit zweierlei – ein Drehbuch für den ersten Abend und eine Führung durch das Innenleben, für alle, die verstehen wollen, warum der Almanach sich so verhält, wie er sich verhält.

Die Runde ist dieselbe wie im Rundgang: Leo leitet, Mara spielt die Klerikerin Seraphine Morgenlicht, Tom die Schurkin Zaira Kesselflick, Jana die Waldläuferin Naelith Silberpfeil – alle drei Abschriften der Vorlagen, die jede Kampagne mitbringt. Der Almanach läuft auf einem Raspberry Pi im Regal; Mara und Tom sitzen am selben Tisch, Jana ist über den Tunnel aus einer anderen Stadt dabei.

Die kleinen Kästen „Unter der Haube“ sind für die Neugierigen; wer nur spielen will, überspringt sie.

## Am Nachmittag: die Vorbereitung

### Die Karte

Leo hat für heute eine Battlemap des Gasthauses „Zum Krummen Kessel“ gefunden. Unter *Spielleitung → Karten* lädt Leo sie hoch, nennt sie beim Namen und gibt ihr die Schlagworte „Taverne“ und „Dorf“.

Dann das Wichtigste, was man einer Karte je antun wird: Leo legt sie einmal probehalber auf, klappt am Spieltisch das Rasterfeld aus und zieht Feldgröße und Versatz, bis das Gitter des Almanachs auf den gezeichneten Linien liegt. Ein Klick auf **„Raster in der Bibliothek merken“** – und jede spätere Szene aus dieser Karte kommt schon passend auf den Tisch.

> **Unter der Haube.** Das Bild geht als `POST /api/media` an den Server und liegt danach als Datei im Datenordner (`medien/`); in der Tabelle `media` steht nur der Verweis. Die Karte selbst ist eine Zeile in `maps` mit Name, Bildverweis, Vorschaubild, Raster, Schlagworten – und ohne jeden Bezug auf eine Kampagne im Sinne des Filterns: Karten sind Vorbereitung und gehören der Runde. „Raster merken“ schreibt Feldgröße und Versatz der Szene zurück in die Karte (`PUT /api/maps/:id`).

### Die Gegner

Im Hof des Gasthauses sollen sich zwei Goblins herumtreiben, und hinter dem Stall wartet ihr Anführer. Unter *Spielleitung → Bestiarium* sucht Leo „Goblin“ im Kompendium und übernimmt den Statblock mit einem Klick; den Anführer legt Leo von Hand an – ein Goblin mit mehr Trefferpunkten und einem Schlagwort „Boss“.

Unter *Begegnungen* stellt Leo daraus eine Aufstellung zusammen: „Hinterhof“ – zwei Goblins und ein Goblin-Anführer, alle drei **verborgen**. Die Runde soll sie erst entdecken, wenn sie in den Hof schaut.

> **Unter der Haube.** Der Statblock aus dem Kompendium kommt über `POST /api/library/aus-kompendium`: Der Server holt den Eintrag aus der offenen 5e-Schnittstelle (oder aus seinem Zwischenspeicher `api_cache`), übersetzt RK, TP, Bewegung und Attribute in die Form des Bestiariums und legt eine Zeile in `library` an. Die Begegnung ist eine Zeile in `encounters`, deren Einträge als JSON-Liste gespeichert sind: je Gruppe Name, Art, TP, RK, Anzahl und ob verborgen. Beides gehört der Runde und steht in jeder Kampagne bereit.

### Der Wirt

Der Wirt des Krummen Kessels wird öfter vorkommen, also bekommt er ein richtiges Blatt: *Neuer Charakter → als NSC anlegen*. Ein NSC-Blatt ist ein vollständiger Charakterbogen, den nur die Spielleitung sieht.

> **Unter der Haube.** `POST /api/characters` mit `npc: true`. Der Server legt das Blatt mit `npc = 1` und `shared = 0` an – ein NSC-Blatt ist nie geteilt. Die Nachricht über das neue Blatt geht nur an die Fenster der Spielleitung (`backend/src/blattmeldung.js`); die Runde bekommt es weder in einer Liste noch über den Live-Kanal.

### Der Handzettel

Unter *Spielleitung → Notizen* schreibt Leo zwei Dinge auf: die eigenen Stichworte für den Abend („Wirt weiß vom Keller, sagt es nur gegen Bezahlung“) und den Zettel, den die Runde finden wird – eine zerknitterte Nachricht der Goblins, „Heute Nacht. Der Keller. Bringt Säcke.“ Beide bleiben vorerst Leos Notizen; ausgeteilt wird am Abend.

### Die Musik

Unter *Spielleitung → Klang* fügt Leo den Spotify-Link einer Tavernen-Playlist ein, nennt sie „Krummer Kessel“ und hängt sie an die Karte. Wer die Karte auflegt, legt damit auch die Musik auf.

> **Unter der Haube.** Der Server nimmt nur Links an, die zu Spotify führen (`https://open.spotify.com/…` oder `spotify:…`), und merkt sich daraus die Art (Playlist, Album, Titel, Künstler) und die Kennung. Musik liegt nirgends im Almanach; jedes Fenster spielt sie später mit dem eigenen Spotify-Konto über den eingebetteten Spieler von Spotify ab.

## Kurz vor dem Abend: den Tisch aufbauen

Die Runde kommt um sieben. Um Viertel vor schließt Leo am Spieltisch den **Vorhang**.

> **Unter der Haube.** `POST /api/scenes/vorhang { zu: true }`. Im Schlüssel-Wert-Speicher steht jetzt `<kampagne>:vorhang = true`, und der Server schickt allen Fenstern die Szene neu – der Runde als `{ vorhang: true }`, sonst nichts. Kein Bild, keine Figuren, nicht einmal der Name der Szene.

Dann legt Leo aus der Kartenbibliothek den Krummen Kessel auf. Weil der Vorhang zu ist, sieht die Runde davon nichts, und in der Chronik steht auch noch nichts: Ein Ort, den am Tisch niemand gesehen hat, gehört nicht ins Protokoll.

> **Unter der Haube.** `POST /api/maps/:id/auflegen`. Gab es aus dieser Karte in dieser Kampagne schon eine Szene, kommt *diese* zurück – samt dem Nebel, den die Runde sich damals erspielt hat. Wer von vorn anfangen will, wählt „frisch“. Sonst legt der Server eine neue Zeile in `scenes` an, übernimmt Bild und Raster aus der Karte, merkt sich die Karte (`map_id`) und legt die Szene auf (`<kampagne>:szene`). Hängt an der Karte eine Ambiente, liegt sie jetzt ebenfalls auf.

Leo verhüllt den ganzen Nebel (**„alles verhüllen“**) und deckt mit dem Pinsel den Schankraum auf, in dem die Runde ankommen wird.

Dann die Figuren. Eine Heldenfigur, die an ihrem Blatt hängt – die also ihre Besitzerin ziehen darf und deren Sinne die Sicht bestimmen –, entsteht im Almanach über die Kampfliste: **„Runde holen“** setzt die drei Heldinnen als Kämpfer in die Liste, **„Figuren aus dem Kampf“** legt für jeden Kämpfer eine Figur in eine Reihe am oberen Kartenrand, blau für Heldinnen. Leo zieht sie an die Tür des Schankraums.

Als Nächstes die Begegnung: *Begegnungen → Hinterhof → in den Kampf*. Die drei Goblins stehen jetzt ebenfalls in der Kampfliste, jeder mit einer gewürfelten Initiative und verborgen. Ein zweites **„Figuren aus dem Kampf“** legt nur für die neuen Kämpfer Figuren aus – rot für Monster und ebenfalls verborgen. Leo zieht zwei in den Hof und den Anführer hinter den Stall.

> **Unter der Haube.** Der Pinsel schickt je Strich die berührten Felder als Liste `["12,7", "12,8", …]` an `POST /api/scenes/:id/nebel`; der Server fügt sie der Liste der aufgedeckten Felder in `scenes.fog` hinzu oder nimmt sie heraus. Den Strich selbst bekommen nur die Fenster der Spielleitung – die Runde erst, wenn die Szene offen aufliegt; hinter dem Vorhang verrieten schon die Felder, wo gerade aufgebaut wird. „Runde holen“ (`POST /api/encounter/party`) nimmt alle geteilten Blätter, die kein NSC-Blatt sind; „Figuren aus dem Kampf“ (`POST /api/scenes/:id/figuren/aus-kampf`) übernimmt von jedem Kämpfer die Verknüpfung zum Blatt und überspringt Kämpfer, die schon eine Figur haben. „In den Kampf“ (`POST /api/encounters/:id/stellen`) legt alle Kämpfer in *einer* Transaktion an – bis zu tausend Zeilen auf die SD-Karte des Pi, die ganz oder gar nicht geschrieben werden. Die Initiative ist ein W20 je Kämpfer. Weil alle drei verborgen sind, steht der Satz „Begegnung ‚Hinterhof‘ wird gestellt“ nur in Leos Chronik. Offen steht dort dagegen schon „Ein Kampf beginnt.“ – ausgelöst von „Runde holen“, das nicht wissen kann, dass es nur ums Aufstellen ging. Leo streicht den Eintrag später in der Chronik (`DELETE /api/chronicle/eintrag/:id`).

Ab jetzt bewegt jede Spielerin ihre eigene Figur, und deren Sinne bestimmen, was sie sieht. Die Goblins stehen in der Kampfliste und auf der Karte – aber für die Runde weder hier noch dort.

> **Zwei Schalter, nicht einer.** Ein Kämpfer in der Liste und seine Figur auf der Karte haben je ihr eigenes „verborgen“. „Figuren aus dem Kampf“ übernimmt den Stand des Kämpfers beim Auslegen; danach schaltet man beide getrennt – den Kämpfer mit dem Auge in der Kampfliste, die Figur im Figurenfeld am Spieltisch. So kann ein Gegner in der Liste auftauchen, bevor seine Figur zu sehen ist, oder umgekehrt.

## Sieben Uhr: die Runde kommt

Mara öffnet auf dem Tablet die Adresse des Almanachs – im WLAN die örtliche, die `npm run adresse` nennt –, Jana in ihrer Stadt die Adresse des Tunnels. Beide sind noch angemeldet: Eine Anmeldung gilt dreißig Tage ab dem letzten Besuch.

> **Unter der Haube.** Der Browser schickt bei jeder Anfrage das Cookie `almanach_sitzung` mit. Der Server bildet daraus den SHA-256-Hash, sucht ihn in `auth_sessions`, hängt Konto und gewählte Kampagne an die Anfrage (`attachUser`) und frischt höchstens einmal in der Stunde `last_seen` auf. Das Kennzeichen selbst steht nirgends in der Datenbank; wer die Datei stiehlt, kann sich damit nicht anmelden.

Tom ist neu in der Runde. Leo hat Tom am Vormittag einen Einladungscode geschickt; Tom wählt auf der Anmeldeseite „Du hast einen Einladungscode? Konto anlegen“, gibt Namen, Kennwort und Code ein – und ist drin. Leo nimmt Tom unter *Spielleitung → Runde* in die Kampagne auf und teilt Tom die Abschrift von Zaira Kesselflick zu, die Leo am Nachmittag aus den Vorlagen gezogen hat.

> **Unter der Haube.** `POST /api/auth/register` prüft den Code in `invites`, legt das Konto an (Kennwort mit scrypt gehasht) und vermerkt beim Code, wer ihn wann eingelöst hat – alles in einer Transaktion, damit ein Code nie zweimal gilt. Das Zuteilen ist `PATCH /api/characters/:id { ownerId }`. Toms Fenster bekommt das Blatt über den Live-Kanal gemeldet, sobald es Tom gehört.

Jedes Fenster öffnet beim Start den **Live-Kanal**. Oben in der Leiste leuchtet der Punkt grün, und unter der Kampfliste steht, wer gerade am Tisch ist.

> **Unter der Haube.** `GET /api/stream` antwortet nicht und endet nicht: Es ist ein offener Strom von Server-Sent Events. Zuerst kommt `willkommen` mit der Fensterkennung, die das Fenster ab jetzt in jedem Aufruf im Kopf `X-Fenster` mitschickt; dann `anwesenheit` an alle in der Kampagne. Alle 25 Sekunden folgt eine Kommentarzeile als Herzschlag, damit kein Proxy die Verbindung für tot hält. Reißt sie ab, verbindet der Browser sich nach drei Sekunden von selbst neu, und die Oberfläche lädt alles nach, was sie in der Zwischenzeit verpasst haben könnte.

## Der Vorhang hebt sich

Leo öffnet den Vorhang. Auf allen Schirmen erscheint der Schankraum – und nur der.

> **Unter der Haube.** `POST /api/scenes/vorhang { zu: false }`. Jetzt erst schreibt der Server in die Chronik: „Der Vorhang hebt sich: Zum Krummen Kessel.“ Dann rechnet er die Szene **je Person** und schickt jeder ihre eigene Fassung. Für Mara heißt das: Das Kartenbild, die Nebelkarte als Bitkarte (ein Bit je Feld), die Sichtkarte ihrer Figur – und nur die Figuren, die auf Feldern stehen, die sowohl aufgedeckt sind als auch in Seraphines Sicht liegen. Die Goblins im Hof sind nicht aufgedeckt; sie stehen nicht in Maras Daten. Nicht verdeckt, nicht durchsichtig – nicht vorhanden.

Die Tavernenmusik beginnt. Wer sie zum ersten Mal hört, muss einmal auf den Lautsprecher in der Klangleiste tippen: Kein Browser spielt ungefragt Ton ab.

## Erkunden

Zaira schleicht zur Hintertür. Tom zieht ihre Figur quer durch den Schankraum. Auf Toms Schirm liegt sie sofort dort, wo Toms Finger sie loslässt; bei den anderen einen Wimpernschlag später.

> **Unter der Haube.** Die Oberfläche setzt die Figur *sofort örtlich* und schickt erst dann `PATCH /api/scenes/figuren/:id { x, y }`. Der Server prüft, ob Tom diese Figur bewegen darf – sie hängt an einem Blatt, das Tom gehört (`darfBewegen` in `backend/src/spieltisch/melden.js`) –, schreibt die neue Stelle und rechnet die Szene für jede Person neu, denn ein Schritt zur Seite kann ändern, wer was sieht. Toms eigenes Fenster bekommt die Figur nicht als Echo zurück; sonst spränge sie kurz an die alte Stelle. Die Spielleitung bekommt die einzelne Figur, die Runde die ganze Szene.

An der Hintertür angekommen, fragt Tom: „Was sehe ich im Hof?“ Leo deckt mit dem Pinsel den Hof auf. Auf allen Schirmen erscheinen Pflaster, Brunnen und Stall – aber niemand darin: Die Goblins sind verborgen, und Leo lässt sie im Schatten, bis Zaira näher kommt. Der Stall selbst liegt ohnehin noch im Nebel.

Leo will wissen, ob der Anführer die Runde schon bemerkt haben kann. Oben rechts am Spieltisch wählt Leo unter **„alles sehen“** die Figur des Anführers – und sieht den Tisch mit seinen Augen: den Hof, einen Streifen des Stalls, die Hintertür. Zaira steht im Türrahmen, gut sichtbar. Zurück auf „alles sehen“.

> **Unter der Haube.** `POST /api/scenes/nsc-sicht { tokenId }`. Der Server merkt sich die Figur und rechnet für Leo ab jetzt mit *derselben* Funktion, mit der er für die Runde rechnet (`szenenSicht` in `backend/src/spieltisch/sichtbarkeit.js`). Eine Vorschau, die anders rechnete als das Original, wäre keine Hilfe, sondern eine Falle.

## Würfeln

Zaira will sich an die Goblins heranschleichen. Tom tippt auf Zairas Blatt auf „Heimlichkeit +7“ – Geschicklichkeit +3 und Expertise, also zweimal der Übungsbonus von +2. Der Wurf erscheint bei allen: mit Toms Namen, der Bezeichnung „Heimlichkeit“, dem Ausdruck `1d20+7`, dem gefallenen Würfel und der Summe 19. Leo würfelt verdeckt die passive Wahrnehmung der Goblins nach – der Wurf erscheint nur bei Leo.

> **Unter der Haube.** Gewürfelt wird auf dem Server: `POST /api/dice/roll { expression: "1d20+7", label: "Heimlichkeit" }`. Der Server würfelt mit `randomInt` aus dem Krypto-Modul, speichert den Wurf (die letzten 200 je Kampagne), schreibt ihn in die Chronik und schickt ihn als `wurf` an alle. Ein verdeckter Wurf (`secret: true`) geht nur an die Spielleitung – beim Verschicken, in der Wurfchronik und in der Chronik. Nur die Spielleitung darf verdeckt würfeln; ein Spielerfenster, das es versucht, bekommt einen offenen Wurf.

## Der Kampf

Die Goblins bemerken Zaira trotzdem. Leo sagt „Initiative!“ und zeigt die beiden Goblins im Hof – in der Kampfliste mit dem Auge, auf der Karte im Figurenfeld. Sie erscheinen bei allen, in der Liste und im Hof. Seraphine, Zaira und Naelith stehen seit dem Aufbau in der Liste, verknüpft mit ihren Blättern; NSC-Blätter bleiben draußen – der Wirt kämpft heute nicht.

Mara, Tom und Jana würfeln ihre Initiative selbst: Über ihrer Kampfliste steht der Knopf **„Eigene Initiative würfeln“**. Der Wurf erscheint bei allen, und die Zahl steht sofort in der Liste; die Liste ordnet sich neu.

> **Unter der Haube.** Das Zeigen ist zweimal ein Schalter: `PUT /api/encounter/combatants/:id { hidden: false }` für den Kämpfer und `PATCH /api/scenes/figuren/:id { hidden: false }` für die Figur. Erst jetzt stehen die Goblins im Datenstrom der Runde. Die eigene Initiative ist `POST /api/encounter/combatants/:id/initiative` – und der Server lässt eine Spielerin nur die Zeile ändern, die an *ihrem* Blatt hängt. Nach jeder Änderung am Kampf schickt der Server zwei Fassungen: der Spielleitung alles, der Runde ohne verborgene Kämpfer, ohne Notizen und bei NSC und Monstern ohne Zahlen.

Leo drückt **„Weiter“**. Der erste Goblin ist dran, sein Name leuchtet in der Liste und seine Figur auf der Karte. Er trifft Zaira mit dem Krummsäbel für 5 Schaden; Leo trägt die 5 in der Zeile ein.

Auf Zairas Blatt bei Tom fallen die Trefferpunkte im selben Moment von 10 auf 5.

> **Unter der Haube.** `POST /api/encounter/combatants/:id/damage { amount: 5 }`. Der Server zieht die Trefferpunkte ab (nie unter null), schreibt „Zaira Kesselflick nimmt 5 Schaden.“ in die Chronik und – weil der Kämpfer an einem Blatt hängt – die neuen Trefferpunkte zurück aufs Blatt (`syncCharakter` in `backend/src/kampf/blatt.js`). Die Meldung darüber geht an alle, die das Blatt sehen dürfen. Toms Fenster übernimmt sie, *es sei denn*, Tom tippt gerade selbst etwas auf dem Blatt ein: Dann hat die eigene, noch ungesicherte Änderung Vorrang, und der Stand gleicht sich beim nächsten Speichern an.

Naelith schießt mit dem Langbogen auf den zweiten Goblin. Jana tippt auf dem Blatt unter „Angriffe“ erst auf „Langbogen“ (Angriff: 1W20+5 = 17, trifft), dann auf „Schaden“ (1W8+3 = 9). Leo trägt die 9 beim Goblin ein. Mara sieht in der Kampfliste beim Goblin kein „0/7“, sondern „kampfunfähig“; beim ersten Goblin, der noch unversehrt ist, steht „unversehrt“.

> **Unter der Haube.** Die Runde bekommt bei Monstern und NSC `hp: null`, `maxHp: null`, `ac: null` und stattdessen `status`, einen Schlüssel wie `verwundet` oder `kampfunfaehig`, den der Server aus dem Verhältnis der Trefferpunkte bildet (`zustand` in `backend/src/kampf/umwandlung.js`). Wie er heißt, entscheidet die Oberfläche. Die Zahlen stehen nicht im Datenstrom der Runde – im Netzwerkfenster des Browsers ist nichts nachzurechnen.

In der dritten Kampfrunde tritt der Anführer hinter dem Stall hervor. Leo deckt den Stall auf und zeigt den Anführer, in der Kampfliste und im Figurenfeld. Er erscheint bei allen. Er trifft Seraphine mit einem vergifteten Pfeil; Leo trägt Schaden ein und setzt beim Kämpfer den Zustand „Vergiftet“. In der Chronik steht „Seraphine ist jetzt Vergiftet“.

Seraphine hält gerade *Segnen* aufrecht. Mara trägt auf ihrem Kampfreiter unter „Konzentration“ den erlittenen Schaden ein – 8 – und drückt „Konzentration prüfen“: SG 10, Konstitutions-Rettungswurf 1W20+2 = 14. Der Zauber hält.

Zaira fällt in der vierten Runde auf 0 Trefferpunkte. Die Chronik vermerkt „Zaira Kesselflick geht zu Boden.“ Tom würfelt auf dem Blatt den Rettungswurf gegen den Tod: eine 1 – zwei Fehlschläge auf einmal. In der nächsten Runde heilt Seraphine sie mit *Wunden heilen*; Leo trägt −7 als Schaden ein (negative Werte heilen), und Zaira steht wieder.

> **Unter der Haube.** Rettungswürfe gegen den Tod rechnet das Blatt, nicht der Server: Der Wurf läuft wie jeder andere über `POST /api/dice/roll`, und das Blatt trägt Erfolge und Fehlschläge nach der Regel ein (20 richtet auf, 1 zählt doppelt). Weil dabei mehrere Felder auf einmal wechseln, ersetzt es das ganze Blatt in einem Zug. Die Heilung aus der Kampfliste schreibt die Trefferpunkte zurück; die Zähler für Erfolge und Fehlschläge setzt Tom von Hand zurück – oder die nächste lange Rast.

Der Anführer flieht. Leo nimmt ihn aus der Kampfliste, und mit ihm den letzten Goblin; dann **„Kampf beenden“**. In der Chronik: „Der Kampf endet nach 6 Runden.“

Weil die Aufstellung gut funktioniert hat, sichert Leo vorher noch **„Laufenden Kampf sichern“** als Begegnung „Hinterhof (gespielt)“. Die beiden Goblins, einmal als „Goblin 1“ und „Goblin 2“ im Kampf, stehen dort wieder als eine Gruppe „2× Goblin“.

## Beute

Im Hof finden die drei einen Beutel mit 43 Goldstücken, 17 Silberstücken und 5 Kupferstücken – und die zerknitterte Nachricht. Jana trägt die Münzen in die **Beutekiste** ein (Seitenreiter „Beute“ am Spieltisch), Tom den „Krummsäbel des Anführers“ als Gegenstand. Jede und jeder darf in die Kiste legen; die Kiste gehört der Kampagne.

Leo teilt den Handzettel aus: *Notizen → austeilen*. Auf allen Schirmen erscheint am Spieltisch der Zettel: „Heute Nacht. Der Keller. Bringt Säcke.“ In der Chronik: „Die Runde erhält: ‚Nachricht der Goblins‘.“

> **Unter der Haube.** Austeilen setzt bei der Notiz `visibility = 'runde'` (`PUT /api/notes/:id`). Ab jetzt steht sie in der Antwort von `GET /api/notes` auch für die Runde – alle anderen Notizen nicht. Das Fenster erfährt davon durch den Wink `notizen:aktualisiert` und lädt nach.

Dann das Teilen. Unter „Teilen“ wählt die Runde, wer etwas bekommt – alle drei –, und sieht vorher, was je Kopf herauskommt: 14 Gold, 9 Silber, 1 Kupfer; übrig bleibt ein Rest von 2 Kupfer. (Von den 43 Gold bleibt nach 3 × 14 eines übrig; es wird in 10 Silber gewechselt und zu den 17 gelegt – 27 Silber sind 9 je Kopf.) Leo drückt **„Auszahlen“**: Die Anteile stehen im selben Augenblick in den Münzfeldern der drei Blätter, die Kiste hält nur noch den Rest.

> **Unter der Haube.** `GET /api/stash/teilung` rechnet vor, `POST /api/stash/auszahlen` zahlt aus – nur die Spielleitung darf das, denn es greift in fremde Blätter ein. Geteilt wird wie am Tisch von der größten Münze zur kleinsten; was sich nicht glatt aufteilen lässt, wird in kleinere Münzen gewechselt und weitergereicht, nie in größere (`teile` in `backend/src/beute.js`). Die drei Blätter und die Kiste werden in *einer* Transaktion geschrieben: Bräche es nach dem zweiten Blatt ab, hätten zwei das Gold schon, und beim nächsten Versuch bekämen sie es noch einmal.

## Zwischendurch: reden und flüstern

Während Leo den Keller vorbereitet, schreibt Jana im Chat an alle: „Ich will den Wirt fragen, was im Keller ist.“ Tom flüstert Mara zu: „Ich klau dem Wirt vorher den Schlüssel.“ Das sieht nur Mara – auch Leo nicht. „Flüstern“ heißt im Almanach, was es sagt.

> **Unter der Haube.** Eine geflüsterte Zeile trägt das Konto der Empfängerin (`to_user_id`) und wird beim Verschicken nur an die beiden Beteiligten gesendet; beim Nachladen filtert der Server ebenso. Der Chat hält die letzten 300 Zeilen je Kampagne und steht nicht in der Chronik – Gerede ist kein Ereignis.

## Der Keller: hinter dem Vorhang wechseln

Leo will den Keller vorbereiten, ohne dass die Runde zusieht. In der Szenenlade legt Leo eine leere Szene „Keller“ **verdeckt** auf: Der Vorhang geht zu, die Szene liegt dahinter. Leo schaltet unter *Raster* **„Dunkle Szene“** ein und stellt ein paar Kisten als Figuren auf. Dann stellt Leo die Figuren der drei Heldinnen auf die Kellertreppe, verknüpft mit ihren Blättern, und öffnet den Vorhang.

Die Runde sieht: fast nichts. Der Keller ist dunkel.

- Naelith, Elfe, hat 60 Fuß Dunkelsicht auf dem Blatt – sie sieht ringsum achtzehn Meter weit, ohne Farben, aber genug.
- Zaira, Tiefling, hat ebenfalls Dunkelsicht.
- Seraphine, Aasimar, auch – aber Mara lässt sie trotzdem eine Fackel anzünden: Leo gibt Seraphines Figur im Figurenfeld Licht (20 Fuß hell, 20 Fuß dämmrig). Um sie herum wird es für alle hell.

> **Unter der Haube.** In einer dunklen Szene sieht eine Figur (1) ihr eigenes Feld, (2) was ihre Dunkelsinne erreichen – der weiteste von Dunkelsicht, Blindsicht, Erschütterung und Wahrem Blick – und (3) was irgendein Licht erhellt, soweit ihr eigener Blick reicht. Eine eigene Fackel verlängert den eigenen Blick; fremdes Licht kann ihn nicht verlängern. Die Sichtweite der Szene deckelt alles. Gerechnet wird in Feldern mit euklidischem Abstand; 60 Fuß sind bei 5 Fuß je Feld zwölf Felder. Die Einzelheiten stehen im Kapitel „Sicht und Nebel“.

Im Keller finden sie den Eingang zu einem Tunnel. Leo beschließt, dass es für heute genug ist.

## Nach dem Abend

### Die Chronik

Unter *Chronik* steht der Abend als Sitzung „Sitzung vom 30. September 2026“, in Kapitel gegliedert: der Krumme Kessel, der Kampf im Hinterhof, die Beute, der Keller. Jeder Wurf, jeder Treffer, jedes Auftreten, jeder Szenenwechsel und der Handzettel stehen darin, mit Uhrzeit.

Leo benennt die Sitzung um in „Der Krumme Kessel“, trägt von Hand nach, was der Almanach nicht sehen konnte („Der Wirt verrät den Keller für zwei Goldstücke“), und **schließt die Sitzung**. Der nächste Eintrag – am nächsten Spielabend – beginnt eine neue.

> **Unter der Haube.** Die Sitzung hat sich beim ersten Eintrag des Abends von selbst eröffnet (`log` in `backend/src/chronicle.js`): Niemand muss daran denken, auf „Sitzung beginnen“ zu drücken, und der erste Kampf geht nicht verloren. Verdeckte Einträge – Leos verdeckter Wurf, der Schaden am noch verborgenen Anführer, die Auftritte verborgener Gegner – sieht in der Chronik nur Leo; die Runde bekommt sie nicht, auch nicht als Zahl in der Anzeige „23 Einträge“.

Wer möchte, lädt die Sitzung als **Protokoll** herunter: eine Markdown-Datei, gebaut allein aus den Einträgen. Ist ein Sprachmodell eingerichtet, kann Leo außerdem einen **Rückblick** schreiben lassen, einen erzählten Text über den Abend; das Modell bekommt dafür nur, was die Runde ohnehin sehen darf. Ohne Einrichtung gibt es den Knopf nicht.

### Aufräumen

Leo lässt den Kessel als Szene liegen: Beim nächsten Auflegen der Karte kommt sie mit ihrem Nebel zurück. Die Kampfliste ist leer, die Beutekiste hält zwei Kupferstücke. Den Chat leert Leo mit dem Mülleimer im Chatfenster, die Wurfchronik bleibt – die letzten 200 Würfe hält der Almanach ohnehin von selbst.

### Die Sicherung

Auf dem Pi läuft jede Nacht die Sicherung (`npm run sicherung -- --medien`, eingerichtet nach dem Kapitel „Einrichtung“). Wer den Almanach auf dem Laptop betreibt, ruft sie von Hand auf, bevor er das Fenster schließt. Das Kapitel „Betrieb im Alltag“ erklärt, was dabei entsteht und wie man zurückspielt.

## Der Abend als Zeitleiste

Zum Nachschlagen noch einmal alles, was der Server an diesem Abend geschickt hat, in der Reihenfolge des Geschehens:

| Moment | Weg | Live-Ereignis | an wen | Chronik |
|---|---|---|---|---|
| Vorhang zu | `POST /api/scenes/vorhang` | `szene` | je Person: Runde `{ vorhang: true }` | – |
| Karte auflegen | `POST /api/maps/:id/auflegen` | `szene`, `klang` | je Person | – (Vorhang zu) |
| Nebel malen | `POST /api/scenes/:id/nebel` | `nebel`, `szene` | Spielleitung; die Runde nur bei offenem Vorhang | – |
| Begegnung stellen | `POST /api/encounters/:id/stellen` | `kampf` | zwei Fassungen | „Begegnung …“ (ohne Verborgene) |
| Figuren aus dem Kampf | `POST /api/scenes/:id/figuren/aus-kampf` | `szene` | je Person | – |
| Anmelden, verbinden | `GET /api/stream` | `willkommen`, `anwesenheit` | das Fenster / die Kampagne | – |
| Vorhang auf | `POST /api/scenes/vorhang` | `szene` | je Person | „Der Vorhang hebt sich …“ |
| Figur ziehen | `PATCH /api/scenes/figuren/:id` | `figur` (SL), `szene` (Runde) | ohne das eigene Fenster | – |
| Würfeln | `POST /api/dice/roll` | `wurf` | alle; verdeckt nur SL | „… ergibt …“ |
| Runde holen | `POST /api/encounter/party` | `kampf` | zwei Fassungen | „Ein Kampf beginnt.“ |
| Eigene Initiative | `POST /api/encounter/combatants/:id/initiative` | `kampf` | zwei Fassungen | – |
| Weiter | `POST /api/encounter/next-turn` | `kampf` | zwei Fassungen | „Kampfrunde n beginnt.“ |
| Schaden | `POST /api/encounter/combatants/:id/damage` | `kampf`, `charakter:aktualisiert` | zwei Fassungen / wer das Blatt sieht | „… nimmt n Schaden.“ |
| Zustand setzen | `PUT /api/encounter/combatants/:id` | `kampf` | zwei Fassungen | „… ist jetzt …“ |
| Kampf beenden | `POST /api/encounter/reset` | `kampf` | zwei Fassungen | „Der Kampf endet nach n Runden.“ |
| Beute eintragen | `POST /api/stash/items`, `PUT /api/stash/coins` | `beute` | alle | – |
| Handzettel | `PUT /api/notes/:id` | `notizen:aktualisiert` | alle | „Die Runde erhält …“ |
| Auszahlen | `POST /api/stash/auszahlen` | `beute`, `charakter:aktualisiert` | alle / wer das Blatt sieht | „Die Beute wird geteilt …“ |
| Flüstern | `POST /api/chat` | `chat` | die beiden Beteiligten | – |
| Sitzung schließen | `POST /api/chronicle/sessions/:id/ende` | `chronik:sitzung` | alle | – |

Wer diese Tabelle neben den Code legt, hat die halbe Architektur des Almanachs verstanden: **Schreiben geht über gewöhnliche Wege, zurück kommt es über den einen Kanal, und was jemand nicht sehen darf, erreicht ihn auf keinem der beiden.**
