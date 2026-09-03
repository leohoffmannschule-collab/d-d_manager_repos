import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { broadcast } from './events.js';

/**
 * Die Chronik der Sitzung.
 *
 * Der Almanach weiß ohnehin, was am Tisch geschieht – wer würfelt, wer
 * Schaden nimmt, wann eine neue Runde beginnt, welche Szene aufgelegt wird.
 * Statt das alles wieder zu vergessen, schreibt er es mit. Am Ende steht ein
 * Protokoll, das sich lesen lässt wie der Bericht eines Chronisten, der still
 * am Tisch mitgeschrieben hat.
 *
 * Es wird nichts gehört und nichts aufgenommen: Grundlage sind allein die
 * Handlungen, die ohnehin durch den Server laufen.
 */

const KIND_LABELS = {
  wurf: 'Wurf',
  schaden: 'Schaden',
  heilung: 'Heilung',
  tod: 'Niedergestreckt',
  zustand: 'Zustand',
  runde: 'Kampfrunde',
  kampf: 'Kampf',
  auftritt: 'Auftritt',
  szene: 'Szene',
  handzettel: 'Handzettel',
  rast: 'Rast',
  notiz: 'Anmerkung',
  stufe: 'Stufenaufstieg',
};

export const kindLabel = (kind) => KIND_LABELS[kind] ?? kind;

/** Die gerade offene Sitzung – oder gar keine. */
export function offeneSitzung() {
  return db.prepare('SELECT * FROM game_sessions WHERE ended_at IS NULL ORDER BY started_at DESC').get() ?? null;
}

function heutigerTitel() {
  return `Sitzung vom ${new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })}`;
}

export function starteSitzung(title) {
  const laufend = offeneSitzung();
  if (laufend) return laufend;
  const id = randomUUID();
  db.prepare('INSERT INTO game_sessions (id, title, started_at) VALUES (?, ?, ?)').run(
    id,
    (title || heutigerTitel()).slice(0, 150),
    new Date().toISOString()
  );
  const sitzung = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(id);
  broadcast('chronik:sitzung', sitzung);
  return sitzung;
}

export function beendeSitzung() {
  const laufend = offeneSitzung();
  if (!laufend) return null;
  db.prepare('UPDATE game_sessions SET ended_at = ? WHERE id = ?').run(new Date().toISOString(), laufend.id);
  const sitzung = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(laufend.id);
  broadcast('chronik:sitzung', sitzung);
  return sitzung;
}

/**
 * Einen Eintrag in die Chronik schreiben.
 *
 * Läuft gerade keine Sitzung, wird eine eröffnet – sonst ginge der erste
 * Kampf des Abends verloren, nur weil niemand auf „Sitzung beginnen“ gedrückt
 * hat. Die Spielleitung kann sie hinterher umbenennen.
 */
export function log({ kind, actor = '', target = '', text, meta = {}, secret = false }) {
  if (!text) return null;
  const sitzung = offeneSitzung() ?? starteSitzung();
  const eintrag = {
    id: randomUUID(),
    sessionId: sitzung.id,
    kind,
    actor,
    target,
    text,
    meta,
    secret: !!secret,
    createdAt: new Date().toISOString(),
  };

  db.prepare(
    `INSERT INTO chronicle (id, session_id, kind, actor, target, text, meta, secret, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    eintrag.id,
    sitzung.id,
    kind,
    actor,
    target,
    text,
    JSON.stringify(meta),
    secret ? 1 : 0,
    eintrag.createdAt
  );

  // Geheimes bleibt geheim – auch in der Chronik.
  broadcast('chronik', eintrag, secret ? { dmOnly: true } : {});
  return eintrag;
}

export function rowToEntry(row) {
  return {
    id: row.id,
    sessionId: row.session_id,
    kind: row.kind,
    actor: row.actor,
    target: row.target,
    text: row.text,
    meta: JSON.parse(row.meta),
    secret: !!row.secret,
    createdAt: row.created_at,
  };
}
