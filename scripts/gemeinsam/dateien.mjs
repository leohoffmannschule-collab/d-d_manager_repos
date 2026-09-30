/**
 * Dateien des Almanachs finden – für die Proben in scripts/.
 *
 * Einfuhr-, Stil- und Kommentarprobe gehen alle dieselben Ordner durch und
 * melden ihre Funde mit demselben kurzen Pfad und derselben Zeilennummer.
 * Das stand bisher in jeder Probe einzeln, leicht verschieden – und genau
 * solche Abweichungen führen dazu, dass eine Probe eine Datei übersieht,
 * die eine andere findet.
 *
 * Bewusst ohne Paket (kein glob): Der Almanach soll mit dem auskommen, was
 * Node ohnehin mitbringt.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Das Wurzelverzeichnis des Almanachs (eine Ebene über scripts/). */
export const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Quelltexte, wie sie Bau und Server laden: JavaScript und JSX. */
export const QUELLTEXT = /\.(js|jsx|mjs)$/;

/**
 * Alle Dateien unter `ordner` (relativ zur Wurzel), deren Name auf `muster`
 * passt – rekursiv, in der Reihenfolge, in der das Dateisystem sie liefert.
 * Ein Ordner, den es (noch) nicht gibt, ergibt eine leere Liste statt eines
 * Absturzes; so darf eine Probe Ordner nennen, die erst später entstehen.
 *
 * @param {string} ordner  z. B. 'frontend/src'
 * @param {RegExp} [muster]
 * @returns {string[]} absolute Pfade
 */
export function dateien(ordner, muster = QUELLTEXT) {
  const gefunden = [];
  const gehen = (verzeichnis) => {
    for (const eintrag of fs.readdirSync(verzeichnis, { withFileTypes: true })) {
      const pfad = path.join(verzeichnis, eintrag.name);
      if (eintrag.isDirectory()) gehen(pfad);
      else if (muster.test(eintrag.name)) gefunden.push(pfad);
    }
  };
  const anfang = path.join(wurzel, ordner);
  if (fs.existsSync(anfang)) gehen(anfang);
  return gefunden;
}

/** Der Pfad relativ zur Wurzel – so, wie ihn eine Meldung zeigen soll. */
export const kurz = (datei) => path.relative(wurzel, datei);

/** Liegt `datei` unterhalb von `ordner` (relativ zur Wurzel)? */
export const liegtIn = (datei, ordner) => kurz(datei).startsWith(ordner + path.sep);

/** Die Zeilennummer (ab 1) einer Stelle im Text. */
export const zeileVon = (text, stelle) => text.slice(0, stelle).split('\n').length;
