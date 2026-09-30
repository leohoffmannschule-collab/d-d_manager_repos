/**
 * Pergament oder Kerzenlicht – hell oder dunkel.
 *
 * Die Farben selbst stehen nicht hier, sondern in stile/farben.css: Dort
 * hängen zwei Sätze von CSS-Variablen an `html[data-theme="…"]`. Diese Datei
 * setzt nur das Attribut; das Umfärben erledigt der Browser.
 *
 * Gemerkt wird die Wahl im localStorage, also je Browser und Gerät. Das ist
 * Absicht: Wer am Tisch auf dem iPad spielt und daheim am Schirm, will dort
 * vielleicht Kerzenlicht und hier Pergament.
 */
import { useCallback, useEffect, useState } from 'react';

// Achtung: Derselbe Schlüssel steht in public/aussehen.js, das ihn beim
// Start liest, bevor React überhaupt läuft. Wird er hier umbenannt, muss er
// dort mit umbenannt werden.
const STORAGE_KEY = 'almanach-theme';
/** Die beiden Erscheinungsbilder – hell (Pergament) und dunkel (Kerzenlicht). */
export const THEMES = ['pergament', 'kerzenlicht'];

/**
 * Die gemerkte Wahl – oder das, was die Seite schon anzeigt.
 *
 * localStorage kann werfen: im privaten Modus mancher Browser, oder wenn
 * Website-Daten gesperrt sind. Ein Absturz beim Start wegen einer
 * Farbeinstellung wäre absurd, deshalb der try/catch.
 */
function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (THEMES.includes(stored)) return stored;
  } catch {
    // Privater Modus o. ä. – dann eben ohne Gedächtnis.
  }
  return document.documentElement.dataset.theme === 'kerzenlicht' ? 'kerzenlicht' : 'pergament';
}

/**
 * Das Erscheinungsbild samt Umschalter.
 *
 * @returns {{ theme: 'pergament'|'kerzenlicht', toggleTheme: () => void }}
 */
export function useTheme() {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    // `dataset.theme = 'kerzenlicht'` schreibt data-theme="kerzenlicht" an
    // das <html>-Element – daran hängen die Farbvariablen in stile/farben.css.
    document.documentElement.dataset.theme = theme;
    // Und die Farbe der Browserleiste auf dem Handy gleich mit – gelesen aus
    // derselben Variable statt hier ein drittes Mal hinterlegt: Ändert sich
    // `--color-leather` in farben.css, folgt die Browserleiste von selbst.
    const leder = getComputedStyle(document.documentElement).getPropertyValue('--color-leather').trim();
    if (leder) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', leder);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // nicht schlimm
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'kerzenlicht' ? 'pergament' : 'kerzenlicht'));
  }, []);

  return { theme, toggleTheme };
}
