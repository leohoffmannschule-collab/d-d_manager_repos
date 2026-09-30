/**
 * Werte für CSS-Variablen – Einheiten, die das Stilblatt erwartet.
 *
 * Die Regel des Almanachs: Wie etwas aussieht, steht im Stilblatt
 * (`stile/`). Was sich erst im Browser ergibt – wo eine Figur steht, welche
 * Farbe sich jemand gewählt hat, wie voll ein Balken ist –, geht als
 * CSS-Variable in eine Laufzeit-Regel (lib/laufstil.js), und das Stilblatt
 * setzt sie ein:
 *
 *     <Laufwert className="farbpunkt" werte={{ '--farbe': farbe }} />
 *     .farbpunkt { background-color: var(--farbe); }
 *
 * Ein `style`-Attribut gibt es im Almanach nicht mehr, auch nicht für eine
 * einzelne Variable; die Stilprobe (scripts/stilprobe.mjs) passt darauf auf.
 *
 * Diese beiden Helfer gibt es, weil eine nackte Zahl in einer CSS-Variable
 * keine Einheit hat: `'--x': 5` käme als `5` an, und `left: var(--x)` wäre
 * dann ungültig.
 */

/** Bildpunkte: `px(12)` → `'12px'`. */
export const px = (zahl) => `${zahl}px`;

/** Ein Anteil zwischen 0 und 1 als Prozentwert: `prozent(0.5)` → `'50%'`. */
export const prozent = (anteil) => `${anteil * 100}%`;
