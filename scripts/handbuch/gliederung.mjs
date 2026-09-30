/**
 * Die Gliederung des Buches – gelesen aus docs/buch/README.md.
 *
 * Das Inhaltsverzeichnis, das man auf GitHub anklickt, ist zugleich der
 * Bauplan für den Druck. So gibt es nur *eine* Reihenfolge, und sie kann
 * nicht auseinanderlaufen. Die Regeln:
 *
 *   # Titel                  – der Titel des Buches (erste Zeile)
 *   Text bis „## Inhalt“     – das Vorwort
 *   ### Teil I · Name        – beginnt einen Teil; der Text darunter (bis
 *                              zur ersten Kapitelzeile) steht auf dem
 *                              Teilblatt
 *   1. [Name](datei.md)      – ein Kapitel; der Pfad gilt von docs/buch/ aus
 *
 * Alles nach einer Zeile „## Anhang zum Verzeichnis“ gehört nicht mehr zur
 * Gliederung (dort steht, wie man das PDF baut).
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * @param {string} readme  Pfad zu docs/buch/README.md
 * @returns {{
 *   titel: string,
 *   vorwort: string,
 *   teile: { titel: string, einleitung: string, kapitel: { titel: string, datei: string }[] }[],
 * }}
 *   `datei` ist ein absoluter Pfad
 */
export function gliederung(readme) {
  const ordner = path.dirname(readme);
  const zeilen = fs.readFileSync(readme, 'utf8').replace(/\r\n/g, '\n').split('\n');
  const titel = (zeilen.find((z) => z.startsWith('# ')) ?? '# Handbuch').slice(2).trim();

  const inhaltAb = zeilen.findIndex((z) => /^## Inhalt\s*$/.test(z));
  const endeAb = zeilen.findIndex((z) => z.startsWith('## Anhang zum Verzeichnis'));
  const vorwort = zeilen
    .slice(zeilen.findIndex((z) => z.startsWith('# ')) + 1, inhaltAb === -1 ? undefined : inhaltAb)
    .join('\n')
    .trim();

  const teile = [];
  let teil = null;
  for (const zeile of zeilen.slice(inhaltAb + 1, endeAb === -1 ? undefined : endeAb)) {
    const teilKopf = zeile.match(/^### (.+)$/);
    if (teilKopf) {
      teil = { titel: teilKopf[1].trim(), einleitung: '', kapitel: [] };
      teile.push(teil);
      continue;
    }
    const kapitel = zeile.match(/^\s*\d+\.\s+\[([^\]]+)\]\(([^)]+)\)/);
    if (kapitel && teil) {
      teil.kapitel.push({ titel: kapitel[1], datei: path.resolve(ordner, kapitel[2]) });
      continue;
    }
    if (teil && teil.kapitel.length === 0 && zeile.trim()) {
      teil.einleitung += (teil.einleitung ? '\n' : '') + zeile;
    }
  }
  return { titel, vorwort, teile };
}
