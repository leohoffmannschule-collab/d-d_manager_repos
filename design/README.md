# Design

Die Entwürfe zum mittelalterlichen Erscheinungsbild des Abenteuer-Almanachs.
Jede `.html`-Datei ist ein Artboard – normales, statisches HTML5, das sich
mit einem Doppelklick im Browser öffnet, ganz ohne Bau:

| Datei                  | Inhalt                                        |
| ----------------------- | ---------------------------------------------- |
| `Main.html`             | Charakterblatt, Reiter „Übersicht“ (iPad)      |
| `Charakterliste.html`   | Übersicht aller Charaktere (iPad)              |
| `Kompendium.html`       | Kompendium mit Detailansicht (iPad)            |
| `Wuerfel.html`          | Würfelbeutel über dem Charakterblatt (iPhone)  |
| `StyleTile.html`        | Stilfibel: Palette, Schriften, Bausteine       |
| `Kerzenlicht.html`      | Dunkle Fassung als Alternative                 |
| `stil.css`              | Das gemeinsame Stilblatt aller Artboards       |

## Richtung

Illuminierte Handschrift. Pergament als Grund, Velin-Tafeln darauf,
Eisengallustinte, Rubrikrot für Überschriften, Blattgold als Zierrat. Cinzel
für Überschriften und Zahlen, EB Garamond für Fließtext, Unifraktur nur für
Initialen. Die App bekommt Pergament als Standard und Kerzenlicht als
Umschalter für dunkle Räume.

Diese Entwürfe entstanden ursprünglich mit Claude Design, das Artboards als
eigenständige `.dc.html`-Dateien mit eingebettetem `style="…"` erzeugt –
praktisch zum Nachschlagen, aber schlecht zum Weiterbearbeiten: dieselbe
Farbe stand an hundert Stellen, eine Änderung hieß Suchen und Ersetzen quer
durch sechs Dateien. Deshalb gilt für `design/` inzwischen dieselbe Regel
wie für den Almanach selbst – wie etwas aussieht, steht im Stilblatt, nicht
im Markup –, nur ohne Vite, Tailwind oder Laufzeit-Regeln: reines HTML und
ein gemeinsames `stil.css`.

## Stilblatt

`stil.css` trägt zwei Fassungen unter einem Satz Namen: `:root` ist
Pergament (die Standardfarben der App), `[data-theme="kerzenlicht"]`
überschreibt dieselben Namen für die dunkle Fassung – genau der Schalter,
den `frontend/src/lib/useTheme.js` in der echten App auch benutzt.
`Kerzenlicht.html` setzt das Attribut auf sein `<html>`-Element und braucht
sonst keine einzige eigene Regel.

Die Farbnamen spiegeln absichtlich `frontend/src/stile/farben.css` – nur
auf Deutsch, weil Tailwinds `@theme`-Mechanismus dort englische Namen
verlangt. Wer eine Farbe hier ändert, soll sofort sehen, welche Farbe der
App sie entspricht; die App selbst wird aber nicht aus `stil.css` erzeugt,
sie hat ihre eigenen Stilblätter unter `frontend/src/stile/`.

## Weiterbearbeiten

Eine Seite ändern: die `.html`-Datei und `stil.css` direkt von Hand
bearbeiten, wie jede andere Datei im Projekt auch – kein Werkzeug, kein
Build-Schritt. Eine neue Seite anlegen: eine neue `.html`-Datei mit
`<link rel="stylesheet" href="stil.css">` anlegen, vorhandene Klassen aus
`stil.css` wiederverwenden und nur wirklich neue Muster um eine neue Klasse
ergänzen – nie mit `style="…"` am Element.

`npm run stilprobe` prüft `design/*.html` auf genau dieselbe Regel wie den
Rest des Projekts: kein `style=`-Attribut, kein eingebettetes `<style>` oder
`<script>`.
