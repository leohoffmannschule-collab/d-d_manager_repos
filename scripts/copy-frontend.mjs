/**
 * Die gebaute Oberfläche nach backend/public kopieren, damit der Server sie
 * mit ausliefert.
 *
 *   npm run build   (baut frontend/dist und ruft danach dieses Skript)
 *
 * Bewusst in Node geschrieben statt als cp/xcopy – so läuft derselbe Befehl
 * unter Windows, macOS und auf dem Raspberry Pi.
 *
 * Der alte Stand in backend/public wird vorher ganz entfernt: Vite versieht
 * jede gebaute Datei mit einem Prüfwert im Namen, und ohne das Aufräumen
 * sammelten sich dort mit jedem Bau die Dateien aller früheren Stände.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = path.join(root, 'frontend', 'dist');
const target = path.join(root, 'backend', 'public');

try {
  await fs.access(source);
} catch {
  console.error(`Kein Build gefunden unter ${source}. Bitte zuerst "npm run build" ausführen.`);
  process.exit(1);
}

await fs.rm(target, { recursive: true, force: true });
await fs.cp(source, target, { recursive: true });

console.log(`Oberfläche kopiert: ${path.relative(root, source)} -> ${path.relative(root, target)}`);
