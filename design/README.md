# Design

Die Entwürfe zum mittelalterlichen Erscheinungsbild des Abenteuer-Almanachs,
gebaut mit Claude Design. Jede `.dc.html`-Datei ist ein Artboard:

| Datei                     | Inhalt                                              |
| ------------------------- | --------------------------------------------------- |
| `Main.dc.html`            | Charakterblatt, Reiter „Übersicht“ (iPad)           |
| `Charakterliste.dc.html`  | Übersicht aller Charaktere (iPad)                    |
| `Kompendium.dc.html`      | Kompendium mit Detailansicht (iPad)                  |
| `Wuerfel.dc.html`         | Würfelbeutel über dem Charakterblatt (iPhone)        |
| `StyleTile.dc.html`       | Stilfibel: Palette, Schriften, Bausteine             |
| `Kerzenlicht.dc.html`     | Dunkle Fassung als Alternative                       |
| `canvas.json`             | Anordnung der Artboards auf der Fläche               |

Die Farbwerte und Schriften aus der Stilfibel stecken in der App als
CSS-Variablen in `frontend/src/index.css` – dort wird umgefärbt, nicht hier.
