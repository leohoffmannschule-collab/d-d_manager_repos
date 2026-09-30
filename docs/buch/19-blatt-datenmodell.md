# Das Blatt: Datenmodell und Ausfuhr

Das Kapitel „Das Charakterblatt Feld für Feld“ geht das Blatt so durch, wie man es am Schirm sieht. Dieses Kapitel geht es so durch, wie es gespeichert ist: als ein JSON-Dokument in einer Spalte – und wie aus diesem Dokument die eigenständige HTML-Datei wird, die „Mitnehmen“ erzeugt.

## Ein JSON-Dokument

In `characters.data` steht ein 5e-Blatt als ein einziges JSON-Objekt. Ein frisches, leeres sieht so aus (`defaultCharacterData()` in `frontend/src/lib/regeln/leeresBlatt.js`; Listen gekürzt):

```json
{
  "portrait": "",
  "race": "", "subrace": "", "className": "", "subclass": "",
  "level": 1, "background": "", "alignment": "", "playerName": "",
  "experience": 0, "experienceMode": "punkte",
  "units": "metrisch",

  "abilities":     { "str": 10, "dex": 10, "con": 10, "int": 10, "wis": 10, "cha": 10 },
  "savingThrows":  { "str": false, "dex": false, "con": false, "int": false, "wis": false, "cha": false },
  "savingThrowNote": "",
  "skills":        { "acrobatics": { "proficient": false, "expertise": false }, "…": "je Fertigkeit" },

  "combat": {
    "armorClass": 10, "initiativeBonus": 0, "speed": 30,
    "hp": { "max": 10, "current": 10, "temp": 0 },
    "hitDice": "1d8",
    "hitDicePool": { "size": 8, "total": 1, "used": 0 },
    "deathSaves": { "successes": 0, "failures": 0 },
    "conditions": [], "exhaustion": 0,
    "concentration": { "active": false, "spell": "" },
    "defenses": { "resistances": "", "immunities": "", "vulnerabilities": "" },
    "senses": { "sight": 0, "darkvision": 0, "blindsight": 0, "tremorsense": 0, "truesight": 0, "notes": "" }
  },

  "inspiration": false,
  "resources": [], "attunement": ["", "", ""],
  "attacks": [], "actions": [],
  "inventory": [],
  "currency": { "cp": 0, "sp": 0, "ep": 0, "gp": 0, "pp": 0 },
  "features": [],
  "spellcasting": {
    "ability": "int", "manualSaveDC": null, "manualAttackBonus": null,
    "slots": { "1": { "max": 0, "used": 0 }, "…": "bis 9" },
    "spells": []
  },
  "proficiencies": { "armor": "", "weapons": "", "tools": "", "languages": "" },
  "appearance": { "gender": "", "age": "", "size": "", "height": "", "weight": "", "faith": "", "skin": "", "eyes": "", "hair": "" },
  "traits": { "personality": "", "ideals": "", "bonds": "", "flaws": "", "backstory": "", "notes": "", "look": "", "allies": "" }
}
```

Die Einträge der Listen haben jeweils eine eigene Kennung (`id`) und ihre Felder:

| Liste | Felder je Eintrag |
|---|---|
| `resources` | `id`, `name`, `current`, `max`, `recharge` (`kurz`, `lang`, `keine`) |
| `attacks` | `id`, `name`, `bonus`, `damage`, `notes` |
| `actions` | `id`, `name`, `art` (`aktion`, `bonus`, `reaktion`, `frei`), `description` |
| `inventory` | `id`, `name`, `qty`, `weight` (Pfund, je Stück), `notes` |
| `features` | `id`, `name`, `category` (`klasse`, `spezies`, `talent`, `hintergrund`, `sonstiges`), `source`, `page`, `description` |
| `spellcasting.spells` | `id`, `index` (Kompendium, falls übernommen), `name`, `level`, `prepared`, `source`, `save`, `time`, `range`, `components`, `duration`, `page`, `notes` |

Ein **freies Blatt** (System nicht `dnd5e`) ist viel kleiner:

```json
{
  "portrait": "",
  "summary": "",
  "sections": [
    { "id": "…", "title": "Werte", "content": "" },
    { "id": "…", "title": "Ausrüstung", "content": "" },
    { "id": "…", "title": "Hintergrund", "content": "" },
    { "id": "…", "title": "Notizen", "content": "" }
  ]
}
```

### Drei Gewohnheiten

1. **Weiten in Fuß, Gewichte in Pfund.** `combat.speed`, `combat.senses.*` und `inventory[].weight` stehen immer in den Einheiten des Regelwerks. `units` sagt nur, wie angezeigt wird. So bleibt ein Blatt dasselbe, gleich wer es aufschlägt, Rundungsfehler sammeln sich nicht beim Hin- und Herrechnen, und der Server rechnet die Sicht aus einem einzigen Wert (Kapitel „Das Charakterblatt Feld für Feld“, „Weiten und Gewichte“).
2. **Kennungen für Listeneinträge.** Jeder Eintrag einer Liste bekommt beim Anlegen eine Kennung (`newId()` in `lib/id.js`). React braucht sie als stabilen `key`, und Änderungen an einem Eintrag gehen über seine Kennung, nicht über seinen Platz.
3. **Verbrauch statt Vorrat.** Zauberplätze und Trefferwürfel zählen `used` gegen `max` bzw. `total`. Eine Rast setzt `used` zurück, statt einen Vorrat aufzufüllen – so bleibt die Obergrenze unberührt, gleich wie oft gerastet wird.

### Das Bildnis

`portrait` ist eine `data:`-Adresse: das Bild selbst, verkleinert auf höchstens 320 Bildpunkte Kantenlänge, als JPEG mit 85 % Qualität (`fileToResizedDataUrl` in `lib/setPath.js`). Ein Foto vom Telefon mit mehreren Megabyte würde sonst bei jedem Speichern mitgeschickt – 600 Millisekunden nach jedem Tastendruck. Verkleinert sind es meist ein paar Dutzend Kilobyte. Der Vorteil, das Bild im Blatt zu halten statt als Datei daneben: Es reist mit, wenn das Blatt kopiert, umgezogen oder mitgenommen wird.

## Wie der Server das Blatt behandelt

Für den Server ist `data` ein Text. `POST` und `PUT` nehmen ihn als JSON entgegen, `GET` gibt ihn zurück. Es gibt keine Prüfung der Felder – mit zwei Ausnahmen, die das Kapitel „Das Charakterblatt Feld für Feld“ beschreibt:

- **`combat.hp`** wird beim Speichern mit den verknüpften Kämpfern abgeglichen (nur wenn sich `current` oder `max` wirklich unterscheiden), und Schaden aus der Kampfliste wird umgekehrt ins Blatt geschrieben (`kampf/blatt.js`).
- **`combat.senses`** wird vor und nach dem Speichern verglichen; weicht es ab, geht die Szene neu an alle.

Und an einer dritten Stelle liest der Server das Blatt, ohne zu schreiben: Die Kurzfassung für Listen (`summary()` in `routes/charaktere/blatt.js`) nimmt Klasse, Stufe, Volk, Bildnis, Trefferpunkte, Rüstungsklasse und die Initiative (GES-Modifikator plus Bonus) heraus. Beim Auszahlen der Beute schreibt er in `currency`.

Mehr nicht. Alles andere – was ein Feld bedeutet, was fehlt, was gerechnet wird – ist Sache der Oberfläche.

## Blätter aller Altersstufen

Weil der Server den Inhalt nicht kennt, gibt es für das Blatt keine Wanderung in der Datenbank. Ein Blatt, das vor zwei Jahren angelegt wurde, steht mit den Feldern von damals in der Datei. Die Oberfläche muss es trotzdem öffnen können. Dafür ist **`withDefaults(data)`** da – die Wanderung, die beim Öffnen passiert.

### Was `withDefaults` tut

```js
return {
  ...vorgabe,                      // alle Felder eines frischen Blattes
  ...data,                         // darüber, was im Blatt steht
  abilities: { ...vorgabe.abilities, ...(data.abilities ?? {}) },
  combat,                          // Ebene für Ebene aufgefüllt (siehe unten)
  …
};
```

Ein flaches Zusammenlegen genügt nicht: Stünde im alten Blatt ein `combat` ohne `senses`, überschriebe `...data` das ganze `combat` der Vorgabe – und `data.combat.senses.darkvision` wäre ein Absturz. `withDefaults` füllt deshalb jede Ebene einzeln auf: `combat.hp`, `combat.hitDicePool`, `combat.deathSaves`, `combat.concentration`, `combat.defenses`, `combat.senses`, `spellcasting.slots` und die übrigen Objekte.

Dazu kommen Regeln für Dinge, die sich in früheren Fassungen anders darstellten:

| Früher | Heute | Regel in `withDefaults` |
|---|---|---|
| Zauber mit Name, Grad und Häkchen | Zauber mit sieben Spalten | fehlende Spalten als leere Texte |
| Merkmale ohne Herkunft | Merkmale mit `category` | fehlende Herkunft wird `sonstiges` – ehrlicher, als eine Klasse zu erfinden |
| Aktionen ohne Art | Aktionen mit `art` | fehlende Art wird `aktion` |
| kein `units` | `metrisch` oder `imperial` | Blatt mit Inhalt (Attribute, Kampfwerte, Ausrüstung …) → `imperial`; leeres Blatt → `metrisch` |
| kein `experienceMode` | `punkte` oder `meilenstein` | `punkte` |
| `conditions` fehlt oder ist keine Liste | eine Liste | leere Liste |

Die Regel für `units` verdient einen Satz mehr: Blätter aus der Zeit vor der Umstellung auf Meter wurden in Fuß geführt. Hätte `withDefaults` ihnen `metrisch` gegeben, ständen über Nacht andere Zahlen auf dem Blatt – nicht falsch, aber fremd. Ob ein Blatt „aus der Fuß-Zeit“ stammt, lässt sich nur am Inhalt erkennen; ein Blatt, das schon Attribute oder Kampfwerte trägt, wurde vorher geführt.

### Was `withDefaults` nicht tut

- **Es speichert nicht.** Das aufgefüllte Blatt geht erst beim nächsten Speichern an den Server – wenn ohnehin etwas geändert wird. Ein Blatt nur anzusehen, ändert nichts in der Datenbank.
- **Es wirft nichts weg.** Felder, die es nicht kennt (`mini` aus der Zeit der Figurenschmiede), bleiben stehen.
- **Es läuft nur für 5e-Blätter.** Das freie Blatt hat keine Vorgabe außer der beim Anlegen.

### Die Pflicht für jedes neue Feld

Ein neues Feld gehört in **beide** Funktionen: `defaultCharacterData()` für neue Blätter und `withDefaults()` für alte. Die Blattprobe (`npm run blattprobe`) nimmt Blätter in früheren Formen und prüft, dass sie `withDefaults` ohne Verlust überstehen. Wer das Datenmodell anfasst, sieht dort sofort, ob die alten Blätter mitkommen.

## Ändern ohne Anfassen

Die Reiter ändern das Blatt nie direkt. Sie rufen `update('combat.hp.current', 7)`; daraus baut `setPath()` in `lib/setPath.js` eine **neue** Kopie mit dem geänderten Wert:

```js
export function setPath(obj, path, value) {
  const keys = path.split('.');
  const clone = deepClone(obj);
  let cursor = clone;
  for (let i = 0; i < keys.length - 1; i++) cursor = cursor[keys[i]];
  cursor[keys[keys.length - 1]] = value;
  return clone;
}
```

React erkennt eine Änderung daran, dass ein Objekt ein *anderes* ist, nicht daran, was darin steht. `data.combat.hp.current = 5` änderte zwar den Wert, aber das Objekt bliebe dasselbe, und nichts würde neu gezeichnet. Die tiefe Kopie nimmt `structuredClone`, wo es das gibt, und sonst den Umweg über JSON – iPads vor iPadOS 15.4 kennen `structuredClone` nicht.

Der Pfad muss vorhanden sein: Fehlt unterwegs eine Ebene, gibt es einen Fehler, statt sie anzulegen. Im Blatt liegt die Struktur fest (dafür sorgt `withDefaults`), und ein Tippfehler im Pfad soll auffallen.

Vorgänge, die viele Felder auf einmal ändern – eine Rast, ein Rettungswurf gegen den Tod mit einer 20 –, bauen das neue Blatt selbst (etwa `langeRast(data)` in `lib/rasten.js`) und übergeben es mit `replace()` als Ganzes. Zwei `update` hintereinander hießen zwei Speichervorgänge, die einander überholen könnten.

## Die Ausfuhr

„Mitnehmen“ erzeugt eine einzige HTML-Datei, die alles enthält, was auf dem Blatt steht, und ohne Server, ohne Netz und ohne den Almanach funktioniert. Gebaut wird sie ganz im Browser (`frontend/src/lib/blattAusfuhr.js` und `lib/blatt/`).

### Der Ablauf

```
blattAlsHtml(charakter)
  1  withDefaults(data)                 ein vollständiges Blatt, gleich wie alt
  2  alsDatenUrl(portrait)              das Bildnis einbetten (ist es schon eine data:-Adresse, bleibt es)
  3  zaubertexte(spells)                für jeden übernommenen Zauber den Text aus dem Kompendium
  4  dnd5eKoerper(…) / freiKoerper(…)   die Abschnitte als HTML, in der Reihenfolge des Bogens
  5  STIL + DATEN                       Stilblatt und Datensatz einbetten
  → eine Zeichenkette mit dem ganzen Dokument

ladeBlattHerunter(charakter)
  6  Blob aus der Zeichenkette, Adresse dafür (URL.createObjectURL)
  7  unsichtbarer <a download="Name-Datum.html"> anklicken
  8  die Adresse nach 60 Sekunden wieder freigeben
```

Schritt 3 ist der Grund, warum man ein Blatt überhaupt mitnimmt: Wer am Abend ohne Almanach spielt, will die Zaubertexte auf dem Papier haben, nicht nur die Namen. Schlägt ein Abruf fehl, bleibt es beim Namen – der Rest des Blattes steht trotzdem.

Schritt 8 hat eine Geschichte: Der Browser liest den Inhalt erst *nach* dem Klick, und auf einem iPad kann das einen Moment dauern. Wird die Adresse zu früh eingezogen, bricht das Sichern mittendrin ab.

### Die Teile

| Datei | Aufgabe |
|---|---|
| `lib/blattAusfuhr.js` | setzt zusammen und lädt herunter |
| `lib/blatt/werkzeug.js` | `esc`, `escAbsatz`, die drei Bausteine `tafel`, `feld`, `zeilen`; Bilder und Zaubertexte holen |
| `lib/blatt/koerper.js` | welche Tafel in welcher Reihenfolge – für das 5e-Blatt und das freie |
| `lib/blatt/abschnitte.js` und `abschnitte/` | je eine Funktion je Tafel: Attribute, Kampf, Zustand, Rettungswürfe, Sinne, Fertigkeiten, Aktionen, Ressourcen, Zauber, Zauberblock, Inventar, Merkmale, Erscheinung, Hintergrund |
| `lib/blatt/stil/*.css` | das Aussehen: Grund, Bogen, Listen, Zauberblock, Leiste (samt der Fassung für Papier) |
| `lib/blattEinfuhr.js` | der Rückweg: den Datensatz aus einer mitgenommenen Datei lesen |

### Entschärfen

**Jeder Wert aus dem Blatt geht durch `esc()`.** Ohne das würde aus einem Charakternamen wie `<b>Grim` eine Formatierung, und aus etwas Bösartigerem ausführbarer Code – in einer Datei, die jemand anderes doppelklickt. `esc` ersetzt `&`, `<`, `>`, `"` und `'`; `escAbsatz` erhält danach Zeilenumbrüche als `<br>`. Die Bausteine `tafel` und `feld` entschärfen ihre Beschriftungen selbst; `zeilen` erwartet schon entschärfte Zellen.

Eine leere Tafel verschwindet: `tafel(titel, '')` gibt nichts zurück, und so steht auf dem Bogen einer Kämpferin ohne Zauber keine leere Tafel „Zauber“.

### Das Stilblatt – als echte Dateien, beim Bauen eingesetzt

Die fertige Datei muss ihr Stilblatt **in sich** tragen: Beim Doppelklick gibt es keinen Server, von dem eine zweite Datei käme, und beim Verschicken per Mail oder beim Öffnen aus der Dateien-App ginge ein Verweis auf eine zweite Datei verloren. Geschrieben wird das Stilblatt trotzdem als echte Dateien (`lib/blatt/stil/*.css`) – mit Hervorhebung im Editor, Prüfung durch die Werkzeuge, Formatierung. Beim Bauen holt Vite sie als Text herein:

```js
import GRUND from './blatt/stil/grund.css?raw';
import BOGEN from './blatt/stil/bogen.css?raw';
…
```

`?raw` ist Vites Weg, eine Datei als Zeichenkette einzuführen. Die Erklärköpfe der Dateien werden dabei abgeschnitten – sie richten sich an Mitarbeitende am Code und haben im Blatt einer Spielerin nichts verloren. Die Reihenfolge der Stilblätter ist die der Kaskade; `leiste.css` enthält die Regeln für Papier und kommt deshalb zuletzt.

**Das ist die eine Stelle im ganzen Almanach, an der eine Seite CSS in sich trägt** – und zwar nur in dieser erzeugten Datei, nicht im Quelltext. Die Stilprobe lässt genau diese Stelle zu, mit ihrem Grund, und keine andere.

**Ein Skript trägt die Datei nicht.** Früher hatte sie einen Knopf „Drucken“ mit einer Zeile JavaScript (`window.print()`). Er ist ersetzt durch den Hinweis, wie man druckt – Strg+P, am iPad Teilen → Drucken; das kann jeder Browser ohnehin, und eine Datei, die jemand anderes doppelklickt, führt so nichts aus.

### Für Papier

Gedruckt sieht die Datei aus wie ein Charakterbogen und nicht wie ein Bildschirmfoto: Die Leiste mit dem Druckhinweis verschwindet, der Hintergrund wird weiß, die Rahmen grau, die Schrift wird auf Punkt gestellt (11 pt). Die Regeln dafür stehen unter `@media print` in `lib/blatt/stil/leiste.css`. Tafeln, Tabellenzeilen und Zauberblöcke tragen `break-inside: avoid` und werden deshalb nicht mitten auf einer Seite zerschnitten.

### Der Datensatz

Am Ende der Datei steht der vollständige Datensatz – entschärft, in einem `<template>`:

```html
<template id="almanach-daten">{
  &quot;name&quot;: &quot;Seraphine Morgenlicht&quot;, &quot;system&quot;: &quot;dnd5e&quot;, &quot;data&quot;: { … }, …
}</template>
```

Ein `<template>` zeigt der Browser nicht an und führt nichts davon aus; er ist nur ein Behälter für Text. Weil der Text mit `esc()` entschärft ist, kann kein Text im Blatt – `</template>` in den Notizen – den Behälter vorzeitig schließen. (Ältere Dateien trugen den Datensatz in einem `<script type="application/json">`, mit `\u003c` statt `<`; auch die liest der Almanach.)

Mit diesem Datensatz ist die Datei zugleich eine Sicherung. **„Blatt einlesen“** in der Übersicht (`components/BlattEinlesen.jsx`) legt daraus wieder ein Blatt an: `lib/blattEinfuhr.js` liest den Datensatz mit einem regulären Ausdruck (ein DOMParser baute die ganze Seite samt Bildern auf, gebraucht wird nur der eine Block), prüft Name, Regelwerk und Form und schickt ihn als neues Blatt an den Server. Das Blatt gehört danach der Person, die angemeldet ist; ein vorhandenes wird nie überschrieben – wer zwei Stände hat, soll beide vor sich sehen. Der Server prüft dasselbe noch einmal (`POST /api/characters`: unbekanntes Regelwerk oder ein Datensatz, der kein Objekt ist, ergibt `blatt_ungueltig`). Die Blattprobe spielt Hin- und Rückweg durch, auch mit `</template>` und `&` in einem Text.

### Der Dateiname

Name der Figur und Datum: `Seraphine Morgenlicht-2026-09-30.html`. Umlaute werden umschrieben (ä → ae, ß → ss), alles außer Buchstaben, Ziffern, Leerzeichen und Bindestrich fällt weg. Ein Dateiname mit „ä“ überlebt weder jeden Browser noch jeden USB-Stick, und „Kapitaen Sturmhand“ liest sich immer noch wie der Gemeinte.

## Die Vorlagen

Die zwölf Vorlagen (`backend/src/vorlagen/`) sind auf dem Server gebaut, nicht in der Oberfläche – sie werden beim Anlegen einer Kampagne gesät, ohne dass ein Browser dabei ist.

**Steckbriefe.** Jede Vorlage steht als knapper Steckbrief in `vorlagen/helden/<klasse>-<spezies>.js`: Name, Spezies, Klasse, Hintergrund, Werte, geübte Rettungswürfe und Fertigkeiten, Rüstungsklasse, Trefferpunkte, Sinne, Angriffe, Aktionen, Ressourcen, Merkmale, Zauber, Ausrüstung, Münzen, Aussehen, Wesen. Dort steht, was einen Charakter ausmacht – nicht, dass achtzehn Fertigkeiten allesamt auf „nicht geübt“ stehen.

**Bauen.** `blattAus(steckbrief)` in `vorlagen/bauen.js` macht daraus ein vollständiges Blatt in genau der Form von `defaultCharacterData()`. Zwei Dinge stehen dabei ausdrücklich da, die `withDefaults` sonst anders entschiede: `units: 'metrisch'` (sonst hielte die Oberfläche eine Vorlage mit Inhalt für ein altes Fuß-Blatt) und `experienceMode: 'punkte'`.

**Feste Kennungen.** Die Kennungen der Listeneinträge werden aus dem Schlüssel der Vorlage abgeleitet (`schurke-tiefling-ang-1`), nicht ausgewürfelt. Dieselbe Vorlage bekommt so bei jedem Säen dieselben Kennungen; das hält die Oberfläche ruhig und macht die Prüfung wiederholbar. Die Kennung des Blattes selbst ist `vorlage-<schlüssel>--<kampagne>` – je Kampagne eine eigene, sonst träfe das Säen mit `INSERT OR IGNORE` eine Vorlage in einer fremden Kampagne.

**Säen.** `saeVorlagen(kampagne)` legt die zwölf als NSC-Blätter ohne Besitzer an (sie gehören damit der Spielleitung) und merkt sich in `app_state`, dass gesät wurde – genau einmal je Kampagne. `npm run vorlagen` sät mit `erzwingen` und legt nach, was fehlt.

**Prüfen.** Die Blattprobe prüft, dass jede Klasse und jede Spezies genau einmal vorkommt, dass jede Vorlage ein vollständiges Blatt ergibt und dass die Werte stimmen (Standardwertesatz plus Hintergrund). Der Vertrag prüft, dass sie als NSC-Blätter hinter dem Schirm liegen und die Runde keine davon sieht.

## Was die Blattprobe prüft

`npm run blattprobe` (`scripts/blattprobe.mjs`) prüft rund 340 Aussagen über das Blatt, ohne Server und ohne Browser:

- die Rechnungen: Modifikatoren, Übungsbonus, Fertigkeiten mit Übung und Expertise, passive Werte, Rettungswürfe, Traglast;
- die Umrechnung zwischen Fuß und Meter, Pfund und Kilogramm – in beide Richtungen, ohne dass ein Wert beim Hin- und Herrechnen wandert;
- `withDefaults` an Blättern in früheren Formen: dass nichts verlorengeht und alles Neue dasteht, und die Entscheidung zwischen metrisch und imperial;
- die zwölf Vorlagen: vollständig, jede Klasse und Spezies einmal, Werte nach den Regeln.

Sie läuft in unter einer Sekunde und gehört zu `npm test`.
