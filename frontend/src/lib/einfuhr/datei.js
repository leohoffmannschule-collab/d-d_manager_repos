/**
 * Eine Blattdatei aufbereiten und ihren Datensatz finden.
 *
 * Was zurückkommt, wenn man eine Datei durch eine KI geschickt hat, sieht
 * nicht immer aus wie das, was hineinging: Mal steht die Datei in einem
 * Codeblock mit ```html davor und einem Satz dahinter (aus dem Chatfenster
 * kopiert), mal fehlt die Hülle und es kommt nur das JSON, mal sind die
 * Anführungszeichen des Datensatzes wieder als `&quot;` geschrieben wie in
 * Dateien vor Fassung 2. Das alles wird hier auf eine Form gebracht.
 */

/** Die benannten Zeichen, die in einer Blattdatei vorkommen. */
const BENANNT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Was HTML entschärft, zurückverwandelt – benannt (`&amp;`) und als Zahl (`&#39;`, `&#x27;`). */
export const entitaeten = (text) =>
  String(text).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (ganz, name) => {
    if (name[0] === '#') {
      const code = name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : Number(name.slice(1));
      return Number.isFinite(code) ? String.fromCodePoint(code) : ganz;
    }
    return BENANNT[name.toLowerCase()] ?? ganz;
  });

/**
 * Den Dateitext auf eine Form bringen: ohne Byte-Order-Mark, mit `\n` als
 * Zeilenende – und aus einer Chat-Antwort der Codeblock, in dem die Datei
 * (oder der Datensatz) steht.
 */
export function aufbereiten(text) {
  const inhalt = String(text ?? '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  if (!/^\s*```/m.test(inhalt)) return inhalt;
  const bloecke = [...inhalt.matchAll(/^\s*```[\w-]*\s*\n([\s\S]*?)(?:\n\s*```|$(?![\s\S]))/gm)].map((m) => m[1]);
  if (bloecke.length === 0) return inhalt;
  const passend =
    bloecke.find((b) => /almanach-daten|data-feld=/.test(b)) ??
    bloecke.find((b) => /^\s*(\{|<!doctype|<html)/i.test(b)) ??
    bloecke.reduce((a, b) => (b.length > a.length ? b : a));
  return passend;
}

/**
 * Den Datensatz in der Datei finden.
 *
 * Gesucht wird das Element mit `id="almanach-daten"` – üblich ist ein
 * `<template>`, ältere Dateien hatten ein `<script>`, und eine KI macht
 * daraus manchmal ein `<pre>`. Kommentare zählen nicht mit: Die Anleitung
 * oben in der Datei spricht selbst vom Datensatz.
 *
 * @returns {{ roh: string|null, ab: number, abgeschnitten?: boolean }}  der
 *   Text des Datensatzes und wo er in der Datei beginnt (für Zeilenangaben);
 *   `roh` ist null, wenn die Datei keinen enthält; `abgeschnitten`, wenn er
 *   beginnt, aber nie endet
 */
export function datensatzFinden(text) {
  // Kommentare durch Leerzeichen ersetzen statt löschen – so stimmen die Stellen weiter.
  const ohneKommentare = text.replace(/<!--[\s\S]*?-->/g, (k) => k.replace(/[^\n]/g, ' '));
  const m = /<(template|script|pre|code|div|textarea)\b[^>]*\bid\s*=\s*["']?almanach-daten["']?[^>]*>([\s\S]*?)<\/\1\s*>/i.exec(
    ohneKommentare
  );
  if (m) {
    const ab = m.index + m[0].indexOf('>') + 1;
    // Vor Fassung 2 stand der Datensatz entschärft da („&quot;name&quot;: …“) –
    // und manche KI schreibt ihn beim Zurückgeben wieder so.
    const roh = /&quot;/.test(m[2]) ? entitaeten(m[2]) : m[2];
    return { roh: roh.trim() ? roh : null, ab };
  }
  // Der Anfang steht da, das Ende nicht: Die Datei wurde mittendrin abgeschnitten.
  const offen = /<(template|script|pre)\b[^>]*\bid\s*=\s*["']?almanach-daten["']?[^>]*>/i.exec(ohneKommentare);
  if (offen) {
    const ab = offen.index + offen[0].length;
    return { roh: ohneKommentare.slice(ab), ab, abgeschnitten: true };
  }
  const nackt = ohneKommentare.trim();
  if (nackt.startsWith('{')) return { roh: nackt, ab: ohneKommentare.indexOf('{') };
  return { roh: null, ab: 0 };
}
