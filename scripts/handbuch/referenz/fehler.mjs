/**
 * Verzeichnis: die Fehlerschlüssel des Servers – jeder mit Status, Satz und
 * Fundstelle.
 *
 * Jede Absage des Servers trägt zwei Felder: `code`, einen Schlüssel, der
 * sich nie ändert, und `error`, einen deutschen Satz für Menschen. Gesucht
 * wird deshalb nach `code: '…'` in backend/src. Zu jeder Fundstelle holt das
 * Verzeichnis
 *
 *   – den HTTP-Status aus dem nächsten `status(NNN)` oder `status: NNN`
 *     davor (innerhalb derselben Anweisung),
 *   – den Satz aus dem ersten `error: '…'` danach; Einschübe wie `${x}`
 *     werden zu „…“, und steht dort ein Wert statt eines Satzes
 *     (`error: err.message`), wird dieser genannt,
 *   – und, falls die Oberfläche einen eigenen Satz dafür hat, diesen aus
 *     frontend/src/lib/beschriftung.js (`FEHLER`).
 *
 * Grob, aber für den Zweck genau: Die Wege des Almanachs schreiben ihre
 * Absagen alle in derselben Form, und der Vertrag
 * (scripts/vertrag/19-fehlerschluessel.mjs) prüft, dass sie es tun.
 */
import path from 'node:path';
import { dateienUnter, kapitelKopf, lesen, relativ } from './quelle.mjs';

/** Der erste Zeichenkettenwert hinter `error:` – auch über Zeilen und `+` hinweg. */
function satzNach(text) {
  const m = /error:\s*/.exec(text);
  if (!m) return '';
  let rest = text.slice(m.index + m[0].length);
  const teile = [];
  for (;;) {
    const s = /^(['`])((?:\\.|(?!\1)[\s\S])*)\1/.exec(rest);
    if (!s) break;
    teile.push(s[2]);
    rest = rest.slice(s[0].length);
    const plus = /^\s*\+\s*/.exec(rest);
    if (!plus) break;
    rest = rest.slice(plus[0].length);
  }
  // Kein fester Satz, sondern ein Wert (`error: err.message`): Dann sagt das
  // Verzeichnis, woher der Satz kommt.
  if (teile.length === 0) {
    const ausdruck = /^[\w.]+/.exec(rest)?.[0];
    return ausdruck ? `*(wechselnd: \`${ausdruck}\`)*` : '';
  }
  return teile
    .join('')
    .replace(/\$\{[^}]*\}/g, '…')
    .replace(/\\'/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Alle Fundstellen: { code, status, satz, datei, zeile }. */
function fundstellen(wurzel) {
  const funde = [];
  for (const datei of dateienUnter(path.join(wurzel, 'backend', 'src'), /\.js$/)) {
    const text = lesen(datei);
    for (const m of text.matchAll(/code:\s*'([a-z_]+)'/g)) {
      // Die Anweisung, in der der Schlüssel steht: vom letzten `;` oder `{`
      // am Zeilenanfang davor bis zum nächsten `;` danach – großzügig begrenzt.
      const davor = text.slice(Math.max(0, m.index - 240), m.index);
      const danach = text.slice(m.index, m.index + 400);
      const stati = [...davor.matchAll(/status(?:\(|:\s*)(\d{3})/g)];
      funde.push({
        code: m[1],
        status: stati.length ? Number(stati[stati.length - 1][1]) : null,
        satz: satzNach(danach),
        datei: relativ(wurzel, datei),
        zeile: text.slice(0, m.index).split('\n').length,
      });
    }
  }
  return funde;
}

/** Die eigenen Sätze der Oberfläche (`FEHLER` in lib/beschriftung.js). */
function saetzeDerOberflaeche(wurzel) {
  const text = lesen(path.join(wurzel, 'frontend', 'src', 'lib', 'beschriftung.js'));
  const block = /export const FEHLER = \{([\s\S]*?)\n\};/.exec(text)?.[1] ?? '';
  return new Map([...block.matchAll(/^\s*(\w+):\s*'((?:\\'|[^'])*)'/gm)].map((m) => [m[1], m[2].replace(/\\'/g, "'")]));
}

/** Was ein Status allgemein bedeutet – für die Übersicht. */
const STATUS = {
  400: 'Die Anfrage ist unvollständig oder ungültig. Nichts wurde geändert.',
  401: 'Nicht angemeldet, oder die Anmeldung ist abgelaufen.',
  403: 'Angemeldet, aber nicht berechtigt – oder ein Kennwort, ein Code stimmt nicht.',
  404: 'Das Gesuchte gibt es nicht – oder nicht in dieser Kampagne.',
  409: 'Der Zustand passt nicht: keine Kampagne gewählt, Name vergeben, nicht im Papierkorb.',
  413: 'Zu groß.',
  415: 'Falsches Format.',
  429: 'Zu viele Versuche.',
  500: 'Im Server ist etwas schiefgegangen.',
  501: 'Nicht eingerichtet.',
  502: 'Ein fremder Dienst hat nicht geantwortet.',
  503: 'Der Server kommt nicht an seine Datenbank.',
};

/** Das Kapitel. */
export const FEHLERSCHLUESSEL = {
  datei: '91-fehlerschluessel.md',
  erzeugen(wurzel) {
    const funde = fundstellen(wurzel);
    const eigene = saetzeDerOberflaeche(wurzel);
    const codes = [...new Set(funde.map((f) => f.code))].sort((a, b) => a.localeCompare(b));

    const zeilen = codes.map((code) => {
      const stellen = funde.filter((f) => f.code === code);
      const stati = [...new Set(stellen.map((f) => f.status).filter(Boolean))].sort();
      const saetze = [...new Set(stellen.map((f) => f.satz).filter(Boolean))];
      const orte = [...new Set(stellen.map((f) => f.datei.replace('backend/src/', '')))];
      const oberflaeche = eigene.get(code);
      return `| \`${code}\` | ${stati.join(', ') || '–'} | ${saetze.map((s) => s.replace(/\|/g, '\\|')).join(' / ') || '–'}${
        oberflaeche ? `<br>*Oberfläche:* ${oberflaeche.replace(/\|/g, '\\|')}` : ''
      } | ${orte.join(', ')} |`;
    });

    const nachStatus = new Map();
    for (const code of codes) {
      for (const status of new Set(funde.filter((f) => f.code === code).map((f) => f.status ?? 0))) {
        if (!nachStatus.has(status)) nachStatus.set(status, []);
        nachStatus.get(status).push(code);
      }
    }
    const uebersicht = [...nachStatus.entries()]
      .sort(([a], [b]) => a - b)
      .map(
        ([status, liste]) =>
          `| ${status || '–'} | ${STATUS[status] ?? ''} | ${liste.map((c) => `\`${c}\``).join(', ')} |`
      )
      .join('\n');

    return (
      kapitelKopf(
        'Verzeichnis der Fehlerschlüssel',
        `Sagt der Server nein, antwortet er mit einem HTTP-Status und einem kleinen JSON-Rumpf:

\`\`\`json
{ "code": "nur_spielleitung", "error": "Das darf nur die Spielleitung." }
\`\`\`

\`code\` ist ein Schlüssel, der sich nie ändert – auf ihn verlässt sich die Oberfläche, und auf ihn darf sich jedes andere Programm verlassen, das mit dem Almanach spricht. \`error\` ist ein Satz für Menschen und darf sich jederzeit ändern. Für einige Schlüssel hat die Oberfläche einen eigenen Satz (\`FEHLER\` in \`frontend/src/lib/beschriftung.js\`); sonst zeigt sie den des Servers.

Eine Absage hat nichts geändert: Jeder Weg prüft erst alles und schreibt dann. Wer mit 400, 403 oder 409 abgewiesen wird, findet den Almanach so vor wie vorher.

Insgesamt ${codes.length} Schlüssel an ${funde.length} Stellen.`
      ) +
      `\n## Nach Status\n\n| Status | allgemein | Schlüssel |\n|---|---|---|\n${uebersicht}\n\n` +
      `## Alle Schlüssel\n\n| Schlüssel | Status | Satz des Servers | Datei |\n|---|---|---|---|\n${zeilen.join('\n')}\n`
    );
  },
};
