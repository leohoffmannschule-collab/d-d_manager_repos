/**
 * Verzeichnis: die Ereignisse des Live-Kanals – wer sie schickt, wer sie
 * bekommt und wer in der Oberfläche darauf hört.
 *
 * Gesucht wird nach den beiden Enden des Drahtes:
 *
 *   Server      `broadcast('name', daten, { … })` in backend/src – die
 *               Angaben in den geschweiften Klammern bestimmen, welche
 *               Fenster es bekommen (siehe backend/src/events.js)
 *   Oberfläche  `useLive('name', …)` und `useLiveAlle([…], …)` in
 *               frontend/src (siehe lib/live.jsx)
 *
 * Ein Ereignis, das nur auf einer Seite vorkommt, ist ein Hinweis auf einen
 * Fehler – es steht deshalb am Ende eigens aufgeführt.
 */
import path from 'node:path';
import { dateienUnter, kapitelKopf, lesen, relativ } from './quelle.mjs';

/** Aus den Angaben eines broadcast-Aufrufs einen Satz: wer bekommt es? */
function empfaenger(angaben) {
  const teile = [];
  // Steht die Einschränkung hinter einem `?`, gilt sie nur manchmal – bei
  // verdeckten Würfen etwa, oder solange der Vorhang zu ist.
  const bedingt = (muster) => new RegExp(`\\?\\s*\\{[^}]*${muster}`).test(angaben);
  if (/dmOnly/.test(angaben)) teile.push(bedingt('dmOnly') ? 'Verdecktes nur an die Spielleitung' : 'nur die Spielleitung');
  const rolle = /role:\s*'(\w+)'/.exec(angaben);
  if (rolle) {
    const wer = rolle[1] === 'sl' ? 'die Spielleitung' : `Rolle „${rolle[1]}“`;
    teile.push(bedingt('role') ? `unter Bedingung nur ${wer}` : `nur ${wer}`);
  }
  if (/userIds/.test(angaben)) teile.push('einzelne Konten (je eigene Sicht)');
  if (/exceptClient/.test(angaben)) teile.push('ohne das auslösende Fenster');
  if (/campaignId/.test(angaben)) teile.push('in dieser Kampagne');
  else teile.push('die ganze Runde, kampagnenübergreifend');
  return [...new Set(teile)].join(', ');
}

/** Alle Stellen im Server, die ein Ereignis schicken. */
function gesendet(wurzel) {
  const funde = [];
  for (const datei of dateienUnter(path.join(wurzel, 'backend', 'src'), /\.js$/)) {
    const text = lesen(datei);
    for (const m of text.matchAll(/broadcast\(\s*'([\w:]+)'([\s\S]*?)\);/g)) {
      const zeile = text.slice(0, m.index).split('\n').length;
      funde.push({ name: m[1], datei: relativ(wurzel, datei), zeile, wer: empfaenger(m[2]) });
    }
    for (const m of text.matchAll(/write\(\w+,\s*'([\w:]+)'/g)) {
      const zeile = text.slice(0, m.index).split('\n').length;
      funde.push({ name: m[1], datei: relativ(wurzel, datei), zeile, wer: 'das eine Fenster, das sich gerade verbindet' });
    }
  }
  return funde;
}

/** Alle Stellen in der Oberfläche, die auf ein Ereignis hören. */
function gehoert(wurzel) {
  const funde = [];
  for (const datei of dateienUnter(path.join(wurzel, 'frontend', 'src'), /\.(js|jsx)$/)) {
    const text = lesen(datei);
    for (const m of text.matchAll(/useLive\(\s*'([\w:]+)'/g)) funde.push({ name: m[1], datei: relativ(wurzel, datei) });
    for (const m of text.matchAll(/useLiveAlle\(\s*\[([^\]]*)\]/g)) {
      for (const n of m[1].matchAll(/'([\w:]+)'/g)) funde.push({ name: n[1], datei: relativ(wurzel, datei) });
    }
    // Gruß und Anwesenheit wertet lib/live.jsx direkt an der Quelle aus.
    for (const m of text.matchAll(/quelle\.addEventListener\(\s*'([\w:]+)'/g)) {
      funde.push({ name: m[1], datei: relativ(wurzel, datei) });
    }
  }
  return funde;
}

/** Das Kapitel. */
export const EREIGNISSE = {
  datei: '85-ereignisse.md',
  erzeugen(wurzel) {
    const raus = gesendet(wurzel);
    const rein = gehoert(wurzel);
    const namen = [...new Set([...raus.map((r) => r.name), ...rein.map((r) => r.name)])].sort((a, b) => a.localeCompare(b));
    const tabelle = [
      '| Ereignis | geschickt aus | an wen | gehört in |',
      '|---|---|---|---|',
      ...namen.map((name) => {
        const von = raus.filter((r) => r.name === name);
        const an = [...new Set(von.map((r) => r.wer))];
        const hoerer = [...new Set(rein.filter((r) => r.name === name).map((r) => r.datei.replace('frontend/src/', '')))];
        const orte = [...new Set(von.map((r) => r.datei.replace('backend/src/', '')))];
        return `| \`${name}\` | ${orte.join(', ') || '–'} | ${an.join('; ') || '–'} | ${hoerer.join(', ') || '–'} |`;
      }),
    ].join('\n');
    const einseitig = namen.filter(
      (name) => !raus.some((r) => r.name === name) || !rein.some((r) => r.name === name)
    );
    const stellen = namen
      .map((name) => {
        const von = raus.filter((r) => r.name === name).map((r) => `- geschickt: ${r.datei}, Zeile ${r.zeile} – ${r.wer}`);
        const zu = rein.filter((r) => r.name === name).map((r) => `- gehört: ${r.datei}`);
        return `### ${name}\n\n${[...von, ...zu].join('\n')}`;
      })
      .join('\n\n');
    return (
      kapitelKopf(
        'Verzeichnis der Live-Ereignisse',
        `Über den Live-Kanal (\`GET /api/stream\`, Server-Sent Events) schickt der Server jedem offenen Fenster, was sich geändert hat. Jedes Ereignis hat einen Namen und einen Inhalt in JSON. Welche Fenster es bekommen, entscheidet der Server beim Schicken: nur die Spielleitung, nur bestimmte Konten (etwa weil jedes Konto eine eigene Sicht auf den Nebel hat), alle in einer Kampagne oder die ganze Runde. Das Fenster, das eine Änderung selbst ausgelöst hat, wird bei manchen Ereignissen ausgelassen – es kennt die Änderung schon, und das Echo ließe eine gezogene Figur kurz zurückspringen.

Wie der Kanal gebaut ist, steht im Kapitel über den Live-Kanal im Teil „Wie es gebaut ist“.`
      ) +
      `\n## Übersicht\n\n${tabelle}\n\n` +
      (einseitig.length
        ? `Nur auf einer Seite des Drahtes gefunden: ${einseitig.map((n) => `\`${n}\``).join(', ')}. Das kann gewollt sein (ein Ereignis, auf das die Oberfläche noch nicht hört) oder ein Tippfehler.\n\n`
        : 'Jedes Ereignis wird geschickt *und* gehört – keines läuft ins Leere.\n\n') +
      `## Die Stellen im Einzelnen\n\n${stellen}\n`
    );
  },
};
