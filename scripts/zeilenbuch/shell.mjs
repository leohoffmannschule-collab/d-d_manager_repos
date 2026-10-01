/**
 * Shell-Skripte (.sh) und Stapeldateien für Windows (.cmd) erklären.
 *
 * Beide sind Listen von Befehlen, die ein Kommandozeilen-Programm der Reihe
 * nach ausführt – die .sh-Dateien die Shell von macOS und Linux, die
 * .cmd-Dateien die Eingabeaufforderung von Windows. Im Almanach tun sie nur
 * eines: prüfen, ob Node da ist, und dann ein Skript in scripts/ starten.
 * Die eigentliche Arbeit steht in Node, damit sie auf allen Systemen
 * dieselbe ist.
 *
 * Erklärt wird Zeile für Zeile nach dem Befehl am Zeilenanfang; Kommentare
 * (# bzw. rem) werden zu Blöcken zusammengefasst.
 */
import { code, zeile, zitat } from './text.mjs';

/** Die Erklärung einer Zeile eines Shell-Skripts. */
function shZeile(t, offen) {
  let m;
  if (/^set -eu$/.test(t)) return 'Strenger Modus: -e bricht das Skript beim ersten fehlgeschlagenen Befehl ab, -u bricht ab, wenn eine Variable ohne Wert benutzt wird.';
  if (/^cd "\$\(dirname "\$0"\)"$/.test(t)) {
    return `Wechselt in den Ordner, in dem dieses Skript liegt: ${code('$0')} ist der Pfad des Skripts, ${code('dirname')} schneidet den Dateinamen ab. So findet es seine Nachbarn, ganz gleich, von wo aus es gestartet wurde.`;
  }
  if ((m = /^if ! command -v (\S+) >\/dev\/null 2>&1; then$/.exec(t))) {
    offen.push({ art: 'if', nr: offen.zeile });
    return `Wenn es den Befehl ${code(m[1])} auf diesem Rechner nicht gibt, dann: (${code('command -v')} sucht ihn, ${code('!')} kehrt das Ergebnis um, ${code('>/dev/null 2>&1')} verschluckt jede Ausgabe.)`;
  }
  if ((m = /^if (.*); then$/.exec(t))) {
    offen.push({ art: 'if', nr: offen.zeile });
    return `Wenn ${code(m[1])} gelingt, dann:`;
  }
  if (t === 'fi') {
    const auf = offen.pop();
    return `Ende des ${code('if')}${auf ? ` aus ${zeile(auf.nr)}` : ''}.`;
  }
  if (t === 'else') return 'Sonst:';
  if (/^echo ""$/.test(t) || t === 'echo') return 'Gibt eine Leerzeile aus.';
  if ((m = /^echo "(.*)"$/.exec(t))) return `Gibt aus: ${zitat(m[1].trim())}.`;
  if ((m = /^exit (\d+)$/.exec(t))) return `Beendet das Skript mit dem Code ${m[1]}${m[1] === '0' ? ' (alles in Ordnung)' : ' (Fehler)'}.`;
  if ((m = /^exec node (\S+?) "\$@"$/.exec(t))) {
    const datei = m[1].replace(/"\$\(dirname "\$0"\)"\//, '');
    return `Ersetzt dieses Skript durch Node, das ${code(datei)} ausführt (${code('exec')}: es läuft nichts mehr danach). ${code('"$@"')} reicht alle Angaben weiter, mit denen das Skript gestartet wurde.`;
  }
  if ((m = /^export (\w+)=(.*)$/.exec(t))) return `Setzt die Umgebungsvariable ${code(m[1])} auf ${code(m[2])} – auch für Programme, die das Skript startet.`;
  if ((m = /^(\w+)=(.*)$/.exec(t))) return `Setzt die Variable ${code(m[1])} auf ${code(m[2])}.`;
  return `Führt den Befehl ${code(t, 80)} aus.`;
}

/** Die Erklärung einer Zeile einer Windows-Stapeldatei. */
function cmdZeile(t, offen) {
  let m;
  if (/^@echo off$/i.test(t)) return 'Schaltet das Mitschreiben der Befehle aus – sonst zeigte das Fenster jede Zeile, bevor sie läuft. Das @ verbirgt schon diese Zeile selbst.';
  if (/^setlocal$/i.test(t)) return 'Was das Skript an Umgebungsvariablen ändert, gilt nur bis zu seinem Ende.';
  if (/^cd \/d "%~dp0"$/i.test(t)) {
    return `Wechselt in den Ordner, in dem diese Datei liegt: ${code('%~dp0')} ist Laufwerk und Pfad der Datei selbst, ${code('/d')} wechselt bei Bedarf auch das Laufwerk. So findet sie ihre Nachbarn, auch wenn man sie per Doppelklick startet.`;
  }
  if ((m = /^where (\S+) >nul 2>nul$/i.exec(t))) return `Sucht das Programm ${code(m[1])}. ${code('>nul 2>nul')} verschluckt Ausgabe und Fehlermeldung – es zählt nur, ob es gefunden wurde.`;
  if (/^if errorlevel 1 \($/i.test(t)) {
    offen.push({ nr: offen.zeile });
    return 'Wenn der letzte Befehl einen Fehler meldete (Fehlercode 1 oder höher), dann – bis zur schließenden Klammer:';
  }
  if (t === ')') {
    const auf = offen.pop();
    return `Ende des Blocks${auf ? ` aus ${zeile(auf.nr)}` : ''}.`;
  }
  if (/^echo\.$/i.test(t)) return 'Gibt eine Leerzeile aus.';
  if ((m = /^echo\s+(.*)$/i.exec(t))) return `Gibt aus: ${zitat(m[1].trim())}.`;
  if (/^pause$/i.test(t)) return 'Wartet auf einen Tastendruck – das Fenster bleibt so lange offen, dass man lesen kann, was darin steht.';
  if ((m = /^exit \/b (\d+)$/i.exec(t))) return `Beendet das Skript mit dem Code ${m[1]} (${code('/b')}: nur das Skript, nicht das ganze Fenster).`;
  if ((m = /^node (\S+) %\*$/i.exec(t))) return `Startet Node mit ${code(m[1])}. ${code('%*')} reicht alle Angaben weiter, mit denen die Datei gestartet wurde.`;
  return `Führt den Befehl ${code(t, 80)} aus.`;
}

/**
 * Ein Shell-Skript oder eine Stapeldatei erklären.
 *
 * @param {import('./blatt.mjs').Blatt} blatt
 * @param {'sh'|'cmd'} art
 */
export function erklaereShell(blatt, art) {
  const offen = [];
  const kommentar = art === 'sh' ? /^#(?!!)/ : /^rem(\s|$)/i;
  let lauf = null;
  let erster = true;
  const schliessen = () => {
    if (!lauf) return;
    const text = erster
      ? `Kopfkommentar: Er sagt, wozu es dieses Skript gibt. Zeilen, die mit ${code(art === 'sh' ? '#' : 'rem')} beginnen, überspringt die ${art === 'sh' ? 'Shell' : 'Eingabeaufforderung'}.`
      : `Kommentar${lauf.naechste ? ` zu ${zeile(lauf.naechste)}` : ''}: Er erklärt, warum die Zeile darunter dasteht.`;
    if (lauf.von === lauf.bis) blatt.dazu(lauf.von, text);
    else blatt.gruppe(lauf.von, lauf.bis, text);
    erster = false;
    lauf = null;
  };
  for (let nr = 1; nr <= blatt.anzahl; nr += 1) {
    const t = blatt.text(nr).trim();
    if (!t) {
      schliessen();
      continue;
    }
    if (kommentar.test(t)) {
      if (lauf) lauf.bis = nr;
      else lauf = { von: nr, bis: nr };
      continue;
    }
    if (lauf) lauf.naechste = nr;
    schliessen();
    offen.zeile = nr;
    if (art === 'sh' && t.startsWith('#!')) {
      blatt.dazu(nr, `Die „Shebang“-Zeile: Sie sagt dem Betriebssystem, mit welchem Programm diese Datei läuft, wenn man sie direkt startet – hier mit ${code('sh')}, der einfachen Shell, die es auf jedem Mac und jedem Linux gibt (${code('/usr/bin/env')} sucht sie).`);
      erster = true;
      continue;
    }
    blatt.dazu(nr, art === 'sh' ? shZeile(t, offen) : cmdZeile(t, offen));
  }
  schliessen();
}
