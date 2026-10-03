/**
 * Die Werkzeuge des Spieltisches: Was tut ein Klick auf die Karte?
 *
 * Eine Liste für beide Leisten – die der Spielleitung (Werkzeuge.jsx) und
 * die der Runde (../Spielerleiste.jsx). `id` ist zugleich der Wert von
 * `mode` in pages/Tabletop.jsx und wird in useZeiger.js abgefragt; wer ein
 * Werkzeug ergänzt, muss es also dort auch kennen.
 *
 * `fuerAlle` heißt: Auch die Runde bekommt es. Bewegen, Messen und Zeigen
 * ändern nichts am Tisch, das nicht ohnehin jedem gehört – die eigene
 * Figur, ein Lineal, das nur im eigenen Fenster steht, ein kurzes
 * Aufleuchten. Den Nebel malt nur die Spielleitung; das prüft auch der
 * Server.
 */
import { IconEye, IconFog, IconLineal, IconMap, IconTarget } from '../../icons.jsx';

/** Die Werkzeuge in der Reihenfolge der Leiste. */
export const WERKZEUGE = [
  { id: 'bewegen', label: 'Bewegen', Icon: IconMap, hinweis: 'Karte schieben, Figuren ziehen', fuerAlle: true },
  { id: 'nebel-auf', label: 'Aufdecken', Icon: IconEye, hinweis: 'Nebel wegwischen' },
  { id: 'nebel-zu', label: 'Verhüllen', Icon: IconFog, hinweis: 'Nebel zurückholen' },
  {
    id: 'messen',
    label: 'Messen',
    Icon: IconLineal,
    hinweis: 'Von einem Punkt zum anderen ziehen – Entfernung in Feldern und in der Einheit der Karte',
    fuerAlle: true,
  },
  {
    id: 'zeigen',
    label: 'Zeigen',
    Icon: IconTarget,
    hinweis: 'Antippen lässt die Stelle für alle kurz aufleuchten (am Rechner auch Alt+Klick)',
    fuerAlle: true,
  },
];

/** Die Werkzeuge, die auch die Runde bekommt. */
export const WERKZEUGE_FUER_ALLE = WERKZEUGE.filter((w) => w.fuerAlle);
