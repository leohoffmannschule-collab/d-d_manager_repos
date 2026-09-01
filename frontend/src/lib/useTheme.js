import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'almanach-theme';
export const THEMES = ['pergament', 'kerzenlicht'];

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
    document.documentElement.dataset.theme = theme;
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
