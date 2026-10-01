/**
 * SQL in Worten.
 *
 * SQL ist die Sprache, in der der Server mit der Datenbank spricht: Er
 * schreibt Anweisungen wie `SELECT name FROM characters WHERE id = ?` als
 * Text und übergibt sie SQLite. Die Fragezeichen sind Platzhalter, die beim
 * Ausführen mit Werten gefüllt werden – so kann kein eingegebener Text die
 * Anweisung selbst verändern.
 *
 * Zwei Werkzeuge:
 *
 *   zusammenfassung(sql)   eine ganze Anweisung in einem Satz – für
 *                          `db.prepare('…')` in einer Zeile
 *   new SqlZeilen()        ein Leser, der mehrzeiliges SQL Zeile für Zeile
 *                          erklärt und sich merkt, wo er steht (in einer
 *                          Tabelle, in der Spaltenliste eines SELECT …)
 */
import { code, aufzaehlen, kuerzen, gross } from './text.mjs';

/** Was die Spalten der Datenbank bedeuten – ihre Namen sind englisch. */
const SPALTEN = {
  id: 'die Kennung der Zeile (eindeutig)',
  name: 'der Name',
  title: 'der Titel',
  text: 'der Text',
  notes: 'Notizen',
  note: 'eine Notiz',
  content: 'der Inhalt',
  tags: 'Schlagworte (als JSON-Liste)',
  created_at: 'wann die Zeile angelegt wurde (Zeitpunkt als Text)',
  updated_at: 'wann sie zuletzt geändert wurde',
  created_by: 'wer sie angelegt hat',
  started_at: 'wann es begann',
  ended_at: 'wann es endete',
  joined_at: 'seit wann jemand dabei ist',
  last_seen: 'wann jemand zuletzt da war',
  fetched_at: 'wann es abgerufen wurde',
  used_at: 'wann es benutzt wurde',
  used_by: 'wer es benutzt hat',
  user_id: 'zu welchem Konto es gehört',
  user_name: 'der Name des Kontos (zum Anzeigen festgehalten)',
  to_user_id: 'an welches Konto es geht',
  to_user_name: 'der Name des Empfängers',
  holder_id: 'wer es gerade trägt',
  campaign_id: 'zu welcher Kampagne es gehört',
  character_id: 'zu welchem Charakterblatt es gehört',
  combatant_id: 'zu welchem Kämpfer es gehört',
  scene_id: 'zu welcher Szene es gehört',
  session_id: 'zu welcher Sitzung es gehört',
  media_id: 'welches Bild dazugehört',
  thumb_media_id: 'welches Vorschaubild dazugehört',
  role: 'die Rolle (Spielleitung oder Spieler)',
  password_hash: 'das Kennwort – nicht im Klartext, sondern als Prüfwert (Hash)',
  token_hash: 'der Prüfwert der Sitzungskennung (die Kennung selbst wird nie gespeichert)',
  secret: 'ein Geheimnis (etwa ein Schlüssel)',
  code: 'der Code (etwa einer Einladung)',
  system: 'das Regelsystem (dnd5e oder frei)',
  data: 'die Daten (als JSON)',
  payload: 'die mitgeschickten Daten (als JSON)',
  meta: 'Zusatzangaben (als JSON)',
  details: 'Einzelheiten (als JSON)',
  stats: 'die Werte (als JSON)',
  entries: 'die Einträge (als JSON)',
  summary: 'eine Zusammenfassung',
  hp: 'die aktuellen Trefferpunkte',
  max_hp: 'die höchsten Trefferpunkte',
  ac: 'die Rüstungsklasse',
  speed: 'die Bewegungsrate',
  initiative: 'der Initiativewert (wer wann dran ist)',
  initiative_bonus: 'der Bonus auf den Initiativewurf',
  conditions: 'die Zustände (als JSON-Liste, etwa „vergiftet“)',
  hidden: 'ob es verborgen ist (0 = sichtbar, 1 = verborgen)',
  visibility: 'wer es sehen darf',
  type: 'die Art',
  kind: 'die Art',
  category: 'die Kategorie',
  mode: 'der Modus',
  label: 'die Beschriftung',
  expression: 'der Würfelausdruck (etwa 2W6+3)',
  total: 'das Gesamtergebnis',
  x: 'die Lage waagrecht (in Feldern)',
  y: 'die Lage senkrecht (in Feldern)',
  width: 'die Breite',
  height: 'die Höhe',
  size: 'die Größe',
  color: 'die Farbe',
  grid_size: 'die Größe eines Rasterfeldes in Pixeln',
  grid_offset_x: 'wie weit das Raster waagrecht verschoben ist',
  grid_offset_y: 'wie weit das Raster senkrecht verschoben ist',
  grid_visible: 'ob das Raster zu sehen ist',
  fog: 'die aufgedeckten Felder des Nebels',
  fog_enabled: 'ob der Nebel an ist',
  qty: 'die Anzahl',
  weight: 'das Gewicht',
  value: 'der Wert',
  key: 'der Schlüssel',
  name_key: 'der Name in vereinheitlichter Form (zum Vergleichen)',
  cache_key: 'unter welchem Schlüssel es zwischengespeichert ist',
  uri: 'die Adresse (bei Spotify: spotify:…)',
  filename: 'der Dateiname',
  mime: 'die Art der Datei (etwa image/png)',
  bytes: 'die Größe in Bytes',
  abilities: 'die Fähigkeiten',
  actions: 'die Aktionen',
  actor: 'wer es ausgelöst hat',
  target: 'das Ziel',
};

const TYPEN = { TEXT: 'Text', INTEGER: 'ganze Zahl', REAL: 'Kommazahl', BLOB: 'Binärdaten', NUMERIC: 'Zahl' };

/** Was eine Spalte bedeutet – oder ''. */
export const spalteBedeutet = (name) => SPALTEN[String(name).toLowerCase()] ?? '';

/** Spaltennamen als Code, aufgezählt. */
const spalten = (liste) => aufzaehlen(liste.split(',').map((s) => s.trim()).filter(Boolean).map((s) => code(s, 40)));

/** Die Bedingung einer WHERE-Klausel, so wörtlich wie lesbar. */
const wo = (t) => `für die gilt: ${code(t.trim(), 90)}`;

/** PRAGMA-Einstellungen. */
const PRAGMAS = {
  journal_mode: 'die Art des Protokolls (WAL: Lesen und Schreiben behindern einander nicht, und ein Absturz zerstört nichts)',
  foreign_keys: 'ob Verweise zwischen Tabellen geprüft werden (ON: ein Verweis ins Leere ist verboten)',
  busy_timeout: 'wie lange gewartet wird, wenn die Datenbank gerade beschäftigt ist',
  synchronous: 'wie gründlich jeder Schreibvorgang auf die Platte gebracht wird',
  table_info: 'die Spalten einer Tabelle',
  foreign_key_list: 'die Verweise einer Tabelle',
  index_list: 'die Indizes einer Tabelle',
  index_info: 'die Spalten eines Index',
  user_version: 'eine Versionsnummer der Datenbank',
};

/**
 * Eine ganze SQL-Anweisung in einem Satz.
 *
 * @param {string} sql
 * @returns {string}
 */
export function zusammenfassung(sql) {
  const ohneKommentar = String(sql).replace(/--[^\n]*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');
  const anweisungen = ohneKommentar.split(';').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (anweisungen.length > 1) {
    const erste = anweisungen.slice(0, 3).map(einzeln);
    return `${anweisungen.length} Anweisungen nacheinander: ${erste.join('; ')}${anweisungen.length > 3 ? ' …' : ''}`;
  }
  return einzeln(anweisungen[0] ?? '');
}

/** Eine einzelne Anweisung. */
function einzeln(t) {
  let m;
  if ((m = /^CREATE TABLE (IF NOT EXISTS )?(\w+)/i.exec(t))) return `legt die Tabelle ${code(m[2])} an${m[1] ? ', falls es sie noch nicht gibt' : ''}`;
  if ((m = /^CREATE (UNIQUE )?INDEX (IF NOT EXISTS )?(\w+) ON (\w+)\s*\(([^)]*)\)/i.exec(t))) {
    return `legt den ${m[1] ? 'eindeutigen ' : ''}Index ${code(m[3])} auf ${code(m[4])} (${spalten(m[5])}) an – er beschleunigt das Suchen${m[1] ? ' und verbietet doppelte Werte' : ''}`;
  }
  if ((m = /^SELECT (DISTINCT )?(.+?) FROM (\w+)(.*)$/i.exec(t))) {
    const was = /^\*$/.test(m[2].trim()) ? 'alle Spalten' : /^COUNT\(\*\)/i.test(m[2].trim()) ? 'die Anzahl der Zeilen' : `${spalten(m[2])}`;
    const rest = m[4];
    const teile = [`liest ${was} aus der Tabelle ${code(m[3])}`];
    const join = /\b(LEFT )?JOIN (\w+)/i.exec(rest);
    if (join) teile.push(`verbunden mit ${code(join[2])}`);
    const w = /\bWHERE (.+?)(?= ORDER BY| GROUP BY| LIMIT|$)/i.exec(rest);
    if (w) teile.push(`nur Zeilen, ${wo(w[1])}`);
    const o = /\bORDER BY (.+?)(?= LIMIT|$)/i.exec(rest);
    if (o) teile.push(`sortiert nach ${code(o[1].trim(), 50)}${/\bDESC\b/i.test(o[1]) ? ' (absteigend)' : ''}`);
    const l = /\bLIMIT (\S+)/i.exec(rest);
    if (l) teile.push(`höchstens ${l[1] === '?' ? 'so viele Zeilen, wie der Platzhalter sagt' : `${l[1]} Zeile${l[1] === '1' ? '' : 'n'}`}`);
    return teile.join(', ');
  }
  if ((m = /^SELECT (.+)$/i.exec(t))) return `berechnet ${code(m[1], 60)} (ohne Tabelle)`;
  if ((m = /^INSERT (OR (IGNORE|REPLACE) )?INTO (\w+)\s*(\(([^)]*)\))?(.*)$/i.exec(t))) {
    let s = `fügt eine neue Zeile in die Tabelle ${code(m[3])} ein${m[5] ? ` (Spalten ${spalten(m[5])})` : ''}`;
    if (m[2]?.toUpperCase() === 'IGNORE') s += ' – gibt es sie schon, geschieht nichts';
    if (m[2]?.toUpperCase() === 'REPLACE') s += ' – eine vorhandene gleiche wird ersetzt';
    if (/ON CONFLICT/i.test(m[6])) s += /DO NOTHING/i.test(m[6]) ? ' – gibt es sie schon, geschieht nichts' : ' – gibt es sie schon, wird stattdessen die vorhandene geändert';
    return s;
  }
  if ((m = /^UPDATE (\w+) SET (.+?)(?: WHERE (.+))?$/i.exec(t))) {
    const gesetzt = m[2].split(/,(?![^(]*\))/).map((x) => x.split('=')[0].trim());
    return `ändert in der Tabelle ${code(m[1])} ${gesetzt.length === 1 ? 'die Spalte' : 'die Spalten'} ${aufzaehlen(gesetzt.map((x) => code(x)))}${m[3] ? ` – bei den Zeilen, ${wo(m[3])}` : ' – in allen Zeilen'}`;
  }
  if ((m = /^DELETE FROM (\w+)(?: WHERE (.+))?$/i.exec(t))) {
    return `löscht aus der Tabelle ${code(m[1])} ${m[2] ? `die Zeilen, ${wo(m[2])}` : 'alle Zeilen'}`;
  }
  if ((m = /^ALTER TABLE (\w+) ADD COLUMN (\w+)/i.exec(t))) return `fügt der Tabelle ${code(m[1])} die Spalte ${code(m[2])} hinzu`;
  if ((m = /^DROP TABLE (IF EXISTS )?(\w+)/i.exec(t))) return `löscht die Tabelle ${code(m[2])} samt Inhalt`;
  if ((m = /^PRAGMA (\w+)\s*(?:=\s*(\S+)|\(([^)]*)\))?/i.exec(t))) {
    const was = PRAGMAS[m[1].toLowerCase()];
    if (m[2]) return `stellt die Datenbank ein: ${code(m[1])} = ${code(m[2])}${was ? ` – ${was}` : ''}`;
    return `liest aus der Datenbank selbst: ${was ?? code(m[1])}${m[3] ? ` (für ${code(m[3])})` : ''}`;
  }
  if (/^BEGIN/i.test(t)) return 'beginnt eine Transaktion: Alles bis COMMIT gilt nur gemeinsam – ganz oder gar nicht';
  if (/^COMMIT/i.test(t)) return 'schließt die Transaktion ab: Alle Änderungen gelten jetzt';
  if ((m = /^ROLLBACK TO (?:SAVEPOINT )?(\w+)/i.exec(t))) return `nimmt alle Änderungen seit dem Sicherungspunkt ${code(m[1])} zurück`;
  if (/^ROLLBACK/i.test(t)) return 'nimmt alle Änderungen der Transaktion zurück';
  if ((m = /^SAVEPOINT (\w+)/i.exec(t))) return `setzt den Sicherungspunkt ${code(m[1])} – eine Transaktion innerhalb einer Transaktion`;
  if ((m = /^RELEASE (?:SAVEPOINT )?(\w+)/i.exec(t))) return `gibt den Sicherungspunkt ${code(m[1])} frei: Seine Änderungen bleiben`;
  return `die Anweisung ${code(t, 60)}`;
}

/** Eine Spaltendefinition in einer CREATE TABLE: `hp INTEGER NOT NULL DEFAULT 0,`. */
function spaltenZeile(t) {
  const m = /^(\w+)\s+(TEXT|INTEGER|REAL|BLOB|NUMERIC)\b(.*)$/i.exec(t);
  if (!m) return null;
  const [, name, typ, rest] = m;
  const teile = [`Spalte ${code(name)}: ${TYPEN[typ.toUpperCase()]}`];
  if (/PRIMARY KEY/i.test(rest)) teile.push('der Schlüssel der Tabelle (jeder Wert nur einmal)');
  if (/AUTOINCREMENT/i.test(rest)) teile.push('zählt von selbst hoch');
  if (/NOT NULL/i.test(rest)) teile.push('muss gefüllt sein (NOT NULL)');
  if (/\bUNIQUE\b/i.test(rest)) teile.push('jeder Wert nur einmal (UNIQUE)');
  const vorgabe = /DEFAULT\s+('(?:[^']|'')*'|\S+?)(?=[\s,]|$)/i.exec(rest);
  if (vorgabe) teile.push(`Vorgabe ${code(vorgabe[1])}`);
  const verweis = /REFERENCES\s+(\w+)\s*\((\w+)\)(.*)$/i.exec(rest);
  if (verweis) {
    let v = `verweist auf ${code(`${verweis[1]}.${verweis[2]}`)}`;
    if (/ON DELETE CASCADE/i.test(verweis[3])) v += ' – wird dort gelöscht, verschwindet diese Zeile mit';
    if (/ON DELETE SET NULL/i.test(verweis[3])) v += ' – wird dort gelöscht, wird diese Spalte geleert';
    teile.push(v);
  }
  if (/COLLATE NOCASE/i.test(rest)) teile.push('Groß- und Kleinschreibung zählen beim Vergleichen nicht');
  if (/CHECK\s*\(/i.test(rest)) teile.push(`erlaubt nur Werte, die ${code(/CHECK\s*(\(.*\))/i.exec(rest)[1], 50)} erfüllen`);
  const bedeutung = spalteBedeutet(name);
  return `${teile.join(', ')}${bedeutung ? ` – ${bedeutung}` : ''}.`;
}

/** Ein Leser, der SQL Zeile für Zeile erklärt. */
export class SqlZeilen {
  constructor() {
    this.tabelle = null;
    this.teil = null;
  }

  /**
   * Die Erklärung einer Zeile.
   *
   * @param {string} roh  die Zeile (eingesetzte Werte `${…}` schon durch … ersetzt)
   * @returns {string}    ein Satz, oder '' für eine leere Zeile
   */
  zeile(roh) {
    const t = roh.trim();
    if (!t) return '';
    let m;
    if ((m = /^\/\*\s*-*\s*(.*?)\s*-*\s*\*\/$/.exec(t))) return m[1] ? `Kommentar im SQL – eine Zwischenüberschrift: „${m[1]}“.` : 'Kommentar im SQL.';
    if (t.startsWith('--')) return `Kommentar im SQL: „${kuerzen(t.replace(/^--\s*/, ''), 100)}“.`;
    if (t.startsWith('/*') || t.startsWith('*')) return 'Kommentar im SQL.';
    const versal = t.toUpperCase();

    if ((m = /^CREATE TABLE (IF NOT EXISTS )?(\w+)/i.exec(t))) {
      this.tabelle = m[2];
      this.teil = 'tabelle';
      return `${gross(einzeln(t.replace(/\($/, '')))}; ihre Spalten folgen.`;
    }
    if (this.teil === 'tabelle') {
      if (/^\)\s*;?$/.test(t)) {
        const name = this.tabelle;
        this.tabelle = null;
        this.teil = null;
        return `Ende der Tabelle ${code(name)}.`;
      }
      const spalte = spaltenZeile(t);
      if (spalte) return spalte;
      if ((m = /^PRIMARY KEY\s*\(([^)]*)\)/i.exec(t))) return `Der Schlüssel der Tabelle besteht aus ${spalten(m[1])} zusammen – jede Kombination nur einmal.`;
      if ((m = /^UNIQUE\s*\(([^)]*)\)/i.exec(t))) return `${spalten(m[1])} dürfen zusammen nur einmal vorkommen.`;
      if ((m = /^FOREIGN KEY\s*\((\w+)\)\s*REFERENCES\s+(\w+)\s*\((\w+)\)(.*)$/i.exec(t))) {
        return `Die Spalte ${code(m[1])} verweist auf ${code(`${m[2]}.${m[3]}`)}${/CASCADE/i.test(m[4]) ? ' – wird dort gelöscht, verschwindet die Zeile hier mit' : ''}.`;
      }
      if (/^CHECK/i.test(t)) return `Eine Prüfung: Jede Zeile muss ${code(t.replace(/,$/, ''), 70)} erfüllen.`;
    }

    if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|PRAGMA|ALTER|DROP|BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE)\b/i.test(t)) {
      this.teil = /^SELECT/i.test(t) ? 'auswahl' : /^UPDATE/i.test(t) ? 'aendern' : /^INSERT/i.test(t) ? 'einfuegen' : null;
      if (/^SELECT\s*$/i.test(t)) return 'SELECT: Es folgen die Spalten, die gelesen werden.';
      if (/^SELECT /i.test(t) && !/ FROM /i.test(t)) {
        const welche = /^SELECT \*/i.test(t) ? 'alle Spalten' : spalten(t.slice(7).replace(/,$/, ''));
        return `SELECT: liest ${welche}.`;
      }
      if (/^UPDATE \w+\s*$/i.test(t)) return `UPDATE: ändert Zeilen der Tabelle ${code(t.split(/\s+/)[1])}.`;
      if (/^INSERT (OR \w+ )?INTO \w+\s*\(?$/i.test(t)) return `INSERT: fügt eine neue Zeile in die Tabelle ${code(/INTO (\w+)/i.exec(t)[1])} ein.`;
      return `${gross(einzeln(t.replace(/;$/, '')))}.`;
    }
    if ((m = /^FROM (\w+)/i.exec(t))) return `… aus der Tabelle ${code(m[1])}${/ AS (\w+)/i.test(t) ? ` (hier kurz ${code(/ AS (\w+)/i.exec(t)[1])} genannt)` : ''}.`;
    if ((m = /^(LEFT |INNER )?JOIN (\w+)(?: AS (\w+)| (\w+))? ON (.+)$/i.exec(t))) {
      return `… verbunden mit der Tabelle ${code(m[2])}, wo ${code(m[5], 60)} gilt${m[1]?.trim().toUpperCase() === 'LEFT' ? ' (auch Zeilen ohne Gegenstück bleiben)' : ''}.`;
    }
    if ((m = /^WHERE (.+)$/i.exec(t))) return `… nur Zeilen, ${wo(m[1])}.`;
    if ((m = /^AND (.+)$/i.exec(t))) return `… und außerdem: ${code(m[1], 80)}.`;
    if ((m = /^OR (.+)$/i.exec(t))) return `… oder: ${code(m[1], 80)}.`;
    if ((m = /^ORDER BY (.+)$/i.exec(t))) return `… sortiert nach ${code(m[1].replace(/;$/, ''), 60)}${/\bDESC\b/i.test(m[1]) ? ' (absteigend, Neuestes zuerst)' : /\bASC\b/i.test(m[1]) ? ' (aufsteigend)' : ''}.`;
    if ((m = /^GROUP BY (.+)$/i.exec(t))) return `… zusammengefasst nach ${code(m[1], 60)} (eine Zeile je Wert).`;
    if ((m = /^LIMIT (\S+)/i.exec(t))) return `… höchstens ${m[1].replace(/;$/, '') === '?' ? 'so viele Zeilen, wie der Platzhalter sagt' : `${m[1].replace(/;$/, '')} Zeilen`}.`;
    if ((m = /^OFFSET (\S+)/i.exec(t))) return `… die ersten ${m[1]} Zeilen überspringen.`;
    if ((m = /^VALUES\s*(.*)$/i.exec(t))) return `… mit diesen Werten${m[1].includes('?') ? ' (jedes ? ist ein Platzhalter, den der Code beim Ausführen füllt)' : ''}.`;
    if ((m = /^ON CONFLICT\s*\(([^)]*)\)\s*DO (UPDATE SET|NOTHING)(.*)$/i.exec(t))) {
      return m[2].toUpperCase() === 'NOTHING'
        ? `… gibt es schon eine Zeile mit gleichem ${spalten(m[1])}, geschieht nichts.`
        : `… gibt es schon eine Zeile mit gleichem ${spalten(m[1])}, wird stattdessen sie geändert${m[3].trim() ? `: ${code(m[3].trim(), 60)}` : ''}.`;
    }
    if ((m = /^SET (.+)$/i.exec(t))) {
      this.teil = 'aendern';
      return `… setzt ${aufzaehlen(m[1].split(/,(?![^(]*\))/).filter((x) => x.trim()).map((x) => code(x.trim(), 50)))}.`;
    }
    if (/^RETURNING/i.test(t)) return '… und liefert die geänderten Zeilen gleich zurück.';
    if (/^(CASE|WHEN|THEN|ELSE|END)\b/i.test(t)) return `Fallunterscheidung im SQL: ${code(t, 70)}.`;
    if (/^\)\s*;?$/.test(t)) return 'Ende der Klammer.';
    if (/^;$/.test(t)) return 'Ende der Anweisung.';
    if (this.teil === 'auswahl' && /^[\w.*]+(\s+AS\s+\w+)?,?$/i.test(t)) {
      const name = t.replace(/,$/, '').split(/\s+AS\s+/i);
      const b = spalteBedeutet(name[0].split('.').pop());
      return `… die Spalte ${code(name[0])}${name[1] ? ` (unter dem Namen ${code(name[1])})` : ''}${b ? ` – ${b}` : ''}.`;
    }
    if (this.teil === 'aendern' && /^\w+\s*=/.test(t)) return `… setzt ${code(t.replace(/,$/, ''), 60)}.`;
    if (this.teil === 'einfuegen' && /^[\w\s,]+\)?$/.test(t)) return `… in die Spalten ${spalten(t.replace(/[()]/g, ''))}.`;
    if (versal.includes('COUNT(') || versal.includes('COALESCE(')) return `… berechnet ${code(t, 70)}.`;
    return `Teil der SQL-Anweisung: ${code(t, 70)}.`;
  }
}
