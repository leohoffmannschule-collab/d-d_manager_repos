/**
 * Aus HTML ein PDF drucken – mit einem Browser, der ohnehin auf dem Rechner
 * liegt.
 *
 * Kein Paket, kein Download: Gesucht wird ein Chromium-Abkömmling, den es
 * fast überall schon gibt – Chrome, Chromium, Edge (unter Windows immer
 * vorhanden), Brave. Er druckt ohne Fenster (`--headless`) direkt in eine
 * Datei. Ein anderer Weg lässt sich mit `CHROME_PFAD=/pfad/zum/browser`
 * vorgeben.
 *
 * Findet sich keiner, ist das kein Fehler: Das Buch liegt dann als HTML
 * vor, und jeder Browser macht mit Strg+P → „Als PDF sichern“ dasselbe
 * daraus – Seitenzahlen inklusive, denn die stehen im Stilblatt.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

/** Wo die üblichen Browser liegen, je Betriebssystem. */
function kandidaten() {
  const heim = os.homedir();
  const programme = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean);
  const windows = programme.flatMap((ordner) => [
    path.join(ordner, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(ordner, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(ordner, 'Chromium', 'Application', 'chrome.exe'),
    path.join(ordner, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
  ]);
  const mac = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  ];
  const linux = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/microsoft-edge',
    '/snap/bin/chromium',
  ];
  // Ein Chromium, das Playwright schon einmal geholt hat – etwa auf einem
  // Entwicklungsrechner. Genommen wird nur, was schon da ist.
  const playwright = [process.env.PLAYWRIGHT_BROWSERS_PATH, path.join(heim, '.cache', 'ms-playwright')]
    .filter((ordner) => ordner && fs.existsSync(ordner))
    .flatMap((ordner) =>
      fs
        .readdirSync(ordner)
        .filter((name) => /^chromium-\d+$/.test(name))
        .map((name) => path.join(ordner, name, 'chrome-linux', 'chrome'))
    );
  return [process.env.CHROME_PFAD, ...windows, ...mac, ...linux, ...playwright].filter(Boolean);
}

/** Der erste Browser, den es wirklich gibt – oder null. */
export function findeBrowser() {
  return kandidaten().find((pfad) => fs.existsSync(pfad)) ?? null;
}

/**
 * Eine HTML-Datei als PDF drucken.
 *
 * `--generate-pdf-document-outline` legt aus den Überschriften die
 * Lesezeichen an, die ein PDF-Betrachter am Rand zeigt. Ohne Sandbox nur,
 * wenn als root gedruckt wird (etwa in einem Container) – dort verweigert
 * Chromium sonst den Start.
 *
 * @param {string} browser  Pfad zum Browser
 * @param {string} html     Pfad zur HTML-Datei
 * @param {string} pdf      wohin das PDF soll
 * @returns {Buffer} das gedruckte PDF
 */
export function drucken(browser, html, pdf) {
  const schalter = [
    '--headless',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--generate-pdf-document-outline',
    `--print-to-pdf=${pdf}`,
    pathToFileURL(html).href,
  ];
  if (process.getuid?.() === 0) schalter.unshift('--no-sandbox');
  fs.rmSync(pdf, { force: true });
  const lauf = spawnSync(browser, schalter, { stdio: 'pipe', timeout: 10 * 60 * 1000 });
  if (!fs.existsSync(pdf)) {
    const grund = lauf.error?.message ?? lauf.stderr?.toString().trim().split('\n').slice(-3).join('\n');
    throw new Error(`Der Browser hat kein PDF geschrieben.\n${grund ?? ''}`);
  }
  return fs.readFileSync(pdf);
}
