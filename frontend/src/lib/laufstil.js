/**
 * Werte, die erst im Browser feststehen – ohne ein einziges `style`-Attribut.
 *
 * Die Regel des Almanachs heißt: Wie etwas aussieht, steht im Stilblatt
 * (`stile/`); im Markup steht nur, *was* da ist. Einige Werte kennt aber
 * kein Stilblatt im Voraus: wo eine Figur steht, wie weit die Karte gerade
 * verschoben ist, welche Farbe sich jemand gewählt hat, wie voll ein
 * Lebensbalken ist. Früher kamen sie als CSS-Variable im `style`-Attribut
 * (`style={{ '--x': '140px' }}`) – eingebettetes CSS, wenn auch nur ein
 * Wert.
 *
 * Jetzt bekommt jedes Bauteil, das solche Werte hat, eine eigene Klasse
 * (`lauf-1f`) und dazu eine Regel in einem Stilblatt, das es nur zur
 * Laufzeit gibt:
 *
 *     .lauf-1f { --x: 140px; --y: 210px; }
 *
 * Die Stilblätter in `stile/` lesen die Variablen wie bisher
 * (`left: var(--x)`). Ändert sich ein Wert – beim Ziehen sechzigmal in der
 * Sekunde –, wird die eine Regel geändert, keine neue angelegt; verschwindet
 * das Bauteil, verschwindet seine Regel mit.
 *
 * Das Stilblatt entsteht über das CSSOM (`new CSSStyleSheet()` bzw.
 * `insertRule`), nicht als `<style>` mit Text. Das ist auch der Grund, warum
 * die Content-Security-Policy ohne `'unsafe-inline'` auskommt: Sie verbietet
 * eingebettetes CSS im Markup, nicht Regeln, die ein erlaubtes Skript über
 * das CSSOM setzt. Die Werte gehen dabei über `setProperty` hinein, nie als
 * zusammengesetzter Text – ein Wert kann die Regel also nicht verlassen,
 * auch wenn er von außen käme (eine Farbe, die jemand gespeichert hat).
 *
 * Zwei Wege, dasselbe zu benutzen:
 *
 *   useLaufstil(werte)    ein Haken, gibt den Klassennamen zurück – für
 *                         Bauteile mit Verweisen und Rückrufen (die Bühne)
 *   <Laufwert als="span" werte={…} className="…" />
 *                         ein Element mit Werten – auch in Listen, wo kein
 *                         Haken stehen darf (components/Laufwert.jsx)
 */
import { useLayoutEffect, useRef, useState } from 'react';

let stilblatt = null;
let zaehler = 0;

/**
 * Das eine Laufzeit-Stilblatt des Fensters.
 *
 * Wo der Browser eigene Stilblätter bauen lässt (`adoptedStyleSheets`:
 * Chrome, Firefox, Safari ab 16.4), ist es eines davon. Ältere iPads nehmen
 * stattdessen `laufstil.css` – eine leere Datei, auf die index.html
 * verweist und deren Regeln ebenfalls nur über das CSSOM hineinkommen. Ein
 * per Skript eingefügtes `<style>` gibt es nicht: Das wäre wieder
 * eingebettetes CSS, und die Content-Security-Policy ließe es nicht zu.
 */
function blatt() {
  if (stilblatt) return stilblatt;
  if ('adoptedStyleSheets' in document && typeof CSSStyleSheet === 'function') {
    try {
      stilblatt = new CSSStyleSheet();
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, stilblatt];
      return stilblatt;
    } catch {
      // Ein Browser, der die Eigenschaft kennt, aber keine Stilblätter bauen
      // lässt – dann der Weg für ältere Geräte.
    }
  }
  stilblatt = document.getElementById('laufstil')?.sheet ?? null;
  return stilblatt;
}

/** Eine Regel wieder entfernen – ihr Platz in der Liste kann sich verschoben haben. */
function entferne(regel) {
  const b = blatt();
  if (!b || !regel) return;
  for (let i = b.cssRules.length - 1; i >= 0; i -= 1) {
    if (b.cssRules[i] === regel) {
      b.deleteRule(i);
      return;
    }
  }
}

/** Die Werte in die Regel schreiben; was fehlt oder leer ist, fällt heraus. */
function setze(regel, werte) {
  const stil = regel.style;
  for (let i = stil.length - 1; i >= 0; i -= 1) {
    const name = stil[i];
    if (werte[name] == null || werte[name] === false) stil.removeProperty(name);
  }
  for (const [name, wert] of Object.entries(werte)) {
    if (wert != null && wert !== false) stil.setProperty(name, String(wert));
  }
}

/**
 * Eine eigene Klasse für dieses Bauteil, mit einer Regel, die `werte` trägt.
 *
 * @param {Record<string, string|number|null|undefined|false>} werte
 *   CSS-Variablen (`'--x': px(140)`); null, undefined oder false lassen
 *   eine Variable weg, sodass die Rückfallfarbe im Stilblatt greift
 * @returns {string} der Klassenname, zum Anhängen an `className`
 */
export function useLaufstil(werte) {
  const [klasse] = useState(() => `lauf-${(zaehler += 1).toString(36)}`);
  const regel = useRef(null);
  // Als Text verglichen, damit ein neues Objekt mit denselben Werten
  // (bei jedem Zeichnen) nicht jedes Mal in die Regel schreibt.
  const schluessel = JSON.stringify(werte ?? {});

  // Beides vor dem Zeichnen (useLayoutEffect): Die Figur soll nie einen
  // Augenblick an der Stelle 0,0 stehen.
  useLayoutEffect(() => {
    const b = blatt();
    if (!b) return undefined;
    b.insertRule(`.${klasse} {}`, b.cssRules.length);
    regel.current = b.cssRules[b.cssRules.length - 1];
    return () => {
      entferne(regel.current);
      regel.current = null;
    };
  }, [klasse]);

  useLayoutEffect(() => {
    if (regel.current) setze(regel.current, JSON.parse(schluessel));
  }, [klasse, schluessel]);

  return klasse;
}
