/**
 * Pergament oder Kerzenlicht – hell oder dunkel.
 *
 * Die Farben selbst stehen nicht hier, sondern in index.css: Dort hängen
 * zwei Sätze von CSS-Variablen an `html[data-theme="…"]`. Diese Datei setzt
 * nur das Attribut; das Umfärben erledigt der Browser.
 *
 * Gemerkt wird die Wahl im localStorage, also je Browser und Gerät. Das ist
 * Absicht: Wer am Tisch auf dem iPad spielt und daheim am Schirm, will dort
 * vielleicht Kerzenlicht und hier Pergament.
 */
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'almanach-theme';
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

export function useTheme() {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    // `dataset.theme = 'kerzenlicht'` schreibt data-theme="kerzenlicht" an
    // das <html>-Element – daran hängen die Farbvariablen in index.css.
    document.documentElement.dataset.theme = theme;
    // Und die Farbe der Browserleiste auf dem Handy gleich mit.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'kerzenlicht' ? '#100c07' : '#382718');
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
