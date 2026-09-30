/**
 * Verzeichnis: jede Tabelle der Datenbank mit ihren Spalten, Schlüsseln und
 * Indizes – so, wie sie ein frisch gestarteter Almanach wirklich hat.
 *
 * Gelesen wird nicht das SQL, sondern die Datenbank selbst: Ein eigener
 * Node-Prozess startet die Datenschicht des Servers (backend/src/db.js)
 * gegen einen leeren, vorübergehenden Datenordner – mit Schema, Nachrüsten
 * und Kampagnen-Umzug, genau wie beim echten Start – und fragt SQLite dann
 * über `PRAGMA` nach dem Ergebnis. So stehen hier auch die Spalten, die erst
 * nachgerüstet werden, und keine, die es nur auf dem Papier gibt.
 *
 * Die Erklärungen kommen aus den Kommentaren in datenbank/schema/: der Kopf
 * jeder Datei für den Bereich, der Kommentar über jedem CREATE TABLE für die
 * Tabelle.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { alsMarkdown, dateienUnter, kapitelKopf, kommentarText, kopfkommentar, lesen } from './quelle.mjs';

/** Was der Kindprozess ausgibt: jede Tabelle mit Spalten, Fremdschlüsseln, Indizes. */
function bestandAufnehmen(wurzel) {
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'almanach-schema-'));
  const db = pathToFileURL(path.join(wurzel, 'backend', 'src', 'db.js')).href;
  const skript = `
    const { db } = await import(${JSON.stringify(db)});
    const tabellen = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
    const raus = tabellen.map(({ name }) => ({
      name,
      spalten: db.prepare('PRAGMA table_info(' + name + ')').all(),
      verweise: db.prepare('PRAGMA foreign_key_list(' + name + ')').all(),
      indizes: db.prepare('PRAGMA index_list(' + name + ')').all().map((i) => ({
        ...i,
        spalten: db.prepare('PRAGMA index_info(' + JSON.stringify(i.name) + ')').all().map((s) => s.name),
      })),
    }));
    process.stdout.write(JSON.stringify(raus));
  `;
  try {
    const lauf = spawnSync(process.execPath, ['--no-warnings', '--input-type=module', '-e', skript], {
      env: { ...process.env, DATA_DIR: ordner },
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
    if (lauf.status !== 0) throw new Error(lauf.stderr);
    return JSON.parse(lauf.stdout);
  } finally {
    fs.rmSync(ordner, { recursive: true, force: true });
  }
}

/** Zu jeder Tabelle: in welcher Schema-Datei sie steht und was der Kommentar über ihr sagt. */
function erklaerungen(wurzel) {
  const bereiche = [];
  const zuTabelle = new Map();
  for (const datei of dateienUnter(path.join(wurzel, 'backend', 'src', 'datenbank', 'schema'), /\.js$/)) {
    const text = lesen(datei);
    const bereich = { datei: path.basename(datei), kopf: kopfkommentar(text), tabellen: [] };
    bereiche.push(bereich);
    // Der Kommentar direkt vor CREATE TABLE – einer, der selbst kein `*/`
    // enthält, sonst griffe das Muster vom Dateikopf bis hierher.
    for (const m of text.matchAll(/(\/\*(?:(?!\*\/)[\s\S])*\*\/)?\s*CREATE TABLE IF NOT EXISTS (\w+)/g)) {
      const kommentar = m[1]
        ? kommentarText(m[1])
            .replace(/-{3,}/g, '')
            .split('\n')
            .map((z) => z.trim())
            .join('\n')
            .trim()
        : '';
      bereich.tabellen.push(m[2]);
      zuTabelle.set(m[2], { bereich, kommentar });
    }
  }
  return { bereiche, zuTabelle };
}

/** Eine Tabelle als Abschnitt. */
function tabellenAbschnitt(tabelle, erklaerung) {
  const verweisVon = new Map(tabelle.verweise.map((v) => [v.from, `→ ${v.table}.${v.to}${v.on_delete !== 'NO ACTION' ? ` (${v.on_delete})` : ''}`]));
  const zeilen = [
    '| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |',
    '|---|---|---|---|---|',
    ...tabelle.spalten.map((s) => {
      const schluessel = [s.pk ? 'Primärschlüssel' : '', verweisVon.get(s.name) ?? ''].filter(Boolean).join(' ');
      return `| \`${s.name}\` | ${s.type || '–'} | ${s.notnull || s.pk ? 'ja' : ''} | ${s.dflt_value != null ? `\`${s.dflt_value}\`` : ''} | ${schluessel} |`;
    }),
  ];
  const indizes = tabelle.indizes
    .filter((i) => i.origin === 'c')
    .map((i) => `\`${i.name}\` (${i.spalten.join(', ')}${i.unique ? ', eindeutig' : ''})`);
  const teile = [`### ${tabelle.name}`, ''];
  if (erklaerung?.kommentar) {
    // Die erste Zeile eines SQL-Kommentars ist eine Überschrift ohne Punkt.
    const [erste, ...rest] = erklaerung.kommentar.split('\n');
    const text = rest.length && !/[.:!?]$/.test(erste) ? `**${erste}.** ${rest.join('\n')}` : erklaerung.kommentar;
    teile.push(alsMarkdown(text), '');
  }
  teile.push(zeilen.join('\n'), '');
  if (indizes.length) teile.push(`Indizes: ${indizes.join('; ')}.`, '');
  return teile.join('\n');
}

/** Das Kapitel. */
export const DATENBANK = {
  datei: '84-datenbank.md',
  erzeugen(wurzel) {
    const bestand = bestandAufnehmen(wurzel);
    const { bereiche, zuTabelle } = erklaerungen(wurzel);
    const nachName = new Map(bestand.map((t) => [t.name, t]));
    const abschnitte = bereiche.map((bereich) => {
      const tabellen = bereich.tabellen.filter((name) => nachName.has(name));
      if (tabellen.length === 0) return `## ${bereich.datei}\n\n${alsMarkdown(bereich.kopf)}\n`;
      return `## ${bereich.datei}\n\n${alsMarkdown(bereich.kopf)}\n\n${tabellen
        .map((name) => tabellenAbschnitt(nachName.get(name), zuTabelle.get(name)))
        .join('\n')}`;
    });
    const unbeschrieben = bestand.filter((t) => !zuTabelle.has(t.name));
    if (unbeschrieben.length) {
      abschnitte.push(`## Weitere Tabellen\n\n${unbeschrieben.map((t) => tabellenAbschnitt(t, null)).join('\n')}`);
    }
    return (
      kapitelKopf(
        'Verzeichnis der Tabellen',
        `Die Datenbank ist eine einzige SQLite-Datei (data/manager.sqlite3). Hier steht jede ihrer ${bestand.length} Tabellen, wie sie ein frisch gestarteter Almanach hat – samt der Spalten, die erst beim Nachrüsten dazukommen –, nach den Bereichen in backend/src/datenbank/schema/.

Ein paar Gewohnheiten, die überall gelten: Kennungen sind Texte (UUIDs), Zeitpunkte ISO-Zeichenketten in UTC, Wahrheitswerte die Zahlen 0 und 1, und was eine Liste oder ein Objekt ist, steht als JSON in einer TEXT-Spalte. Was zu einer Kampagne gehört, trägt eine Spalte \`campaign_id\`.`
      ) +
      '\n' +
      abschnitte.join('\n')
    );
  },
};
