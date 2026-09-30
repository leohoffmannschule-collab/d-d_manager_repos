/**
 * Werte für CSS-Variablen – die einzige Brücke zwischen JSX und Stilblatt.
 *
 * Die Regel des Almanachs: Wie etwas aussieht, steht im Stilblatt
 * (`stile/`). Was sich erst im Browser ergibt – wo eine Figur steht, welche
 * Farbe sich jemand gewählt hat, wie voll ein Balken ist –, übergibt das JSX
 * als CSS-Variable, und das Stilblatt setzt sie ein:
 *
 *     <span className="farbpunkt" style={{ '--farbe': farbe }} />
 *     .farbpunkt { background-color: var(--farbe); }
 *
 * Ein `style={{ left: 5 }}` mit einer echten CSS-Eigenschaft gibt es damit
 * nicht mehr; die Stilprobe (scripts/stilprobe.mjs) passt darauf auf.
 *
 * Diese beiden Helfer gibt es, weil React eine Zahl in einer CSS-*Variable*
 * nicht mit einer Einheit versieht (anders als bei `left: 5`, das zu `5px`
 * wird). `'--x': 5` käme als nacktes `5` an – und `left: var(--x)` wäre
 * dann ungültig.
 */

/** Bildpunkte: `px(12)` → `'12px'`. */
export const px = (zahl) => `${zahl}px`;

/** Ein Anteil zwischen 0 und 1 als Prozentwert: `prozent(0.5)` → `'50%'`. */
export const prozent = (anteil) => `${anteil * 100}%`;
