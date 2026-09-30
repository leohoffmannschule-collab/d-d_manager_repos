/**
 * Verzeichnis: wie der Almanach entstand – aus dem Verlauf von git.
 *
 * Jeder Commit ist ein kleiner Bericht: eine Überschrift und, bei den
 * meisten, ein paar Absätze, warum etwas so gebaut wurde. Zusammen erzählen
 * sie die Geschichte des Almanachs genauer, als ein nachträglich
 * geschriebenes Kapitel es könnte. Dieses Verzeichnis setzt sie in
 * zeitlicher Reihenfolge, nach Tagen geordnet.
 *
 * Weggelassen werden die Zusammenführungen (`Merge pull request …`) – sie
 * sagen nur, *dass* etwas zusammenkam, nicht was – und in den Nachrichten
 * die Zeilen über Mitautoren und Sitzungen, die nur für git selbst da sind.
 *
 * Gibt es kein git (der Almanach kam als ZIP), steht an Stelle der
 * Geschichte ein Satz, der das sagt. Das Buch entsteht trotzdem.
 */
import { spawnSync } from 'node:child_process';
import { kapitelKopf } from './quelle.mjs';

// Trennzeichen, die in keiner Commit-Nachricht vorkommen.
const FELD = '\u001f';
const EINTRAG = '\u001e';

/** Die Commits, ältester zuerst: { kurz, tag, titel, text }. */
function commits(wurzel) {
  const lauf = spawnSync(
    'git',
    ['log', '--reverse', '--no-merges', '--date=short', `--format=%h${FELD}%ad${FELD}%s${FELD}%b${EINTRAG}`],
    { cwd: wurzel, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
  );
  if (lauf.status !== 0 || !lauf.stdout) return null;
  return lauf.stdout
    .split(EINTRAG)
    .map((roh) => roh.trim())
    .filter(Boolean)
    .map((roh) => {
      const [kurz, tag, titel, rumpf = ''] = roh.split(FELD);
      // Zeilen für git selbst (Mitautoren, Sitzungsverweise) gehören nicht
      // in die Geschichte des Almanachs.
      const text = rumpf
        .split('\n')
        .filter((z) => !/^(Co-Authored-By|Claude-Session|Signed-off-by):/i.test(z.trim()))
        .filter((z) => !/^https?:\/\/claude\.ai\//.test(z.trim()))
        .join('\n')
        .trim();
      return { kurz, tag, titel: titel.trim(), text };
    });
}

/** Ein Datum als „30. September 2026“. */
function tagAlsText(iso) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Der Text einer Nachricht als Markdown: Absätze bleiben, Aufzählungen auch. */
function alsAbsaetze(text) {
  return text
    .split(/\n\s*\n/)
    .map((absatz) => {
      const zeilen = absatz.split('\n');
      // Eine Aufzählung (– oder -) bleibt eine; sonst werden die harten
      // Umbrüche der Commit-Nachricht zu einem fließenden Absatz.
      if (zeilen.some((z) => /^\s*[-–*]\s/.test(z))) {
        const punkte = [];
        for (const z of zeilen) {
          if (/^\s*[-–*]\s/.test(z)) punkte.push(z.replace(/^\s*[-–*]\s+/, ''));
          else if (punkte.length) punkte[punkte.length - 1] += ` ${z.trim()}`;
          else punkte.push(z.trim());
        }
        return punkte.map((p) => `- ${p}`).join('\n');
      }
      return zeilen.map((z) => z.trim()).join(' ');
    })
    .join('\n\n');
}

/** Das Kapitel. */
export const GESCHICHTE = {
  datei: '92-geschichte.md',
  erzeugen(wurzel) {
    const liste = commits(wurzel);
    const einleitung = `Der Almanach ist in kleinen Schritten gewachsen, und jeder Schritt hat eine Nachricht hinterlassen. Hier stehen sie alle bis zum Bau dieses Buches, ältester zuerst, nach Tagen geordnet – mit der Kurzkennung des Commits, unter der man die Änderung selbst nachsehen kann (\`git show <kennung>\`).

Die Nachrichten sind so abgedruckt, wie sie geschrieben wurden. Die ersten, vom 1. September, sind englisch; ab dem 3. September wurde der Almanach deutsch, im Code wie in seiner Geschichte.`;

    if (!liste) {
      return (
        kapitelKopf('Wie der Almanach entstand', einleitung) +
        '\nDieser Almanach liegt ohne git-Verlauf vor (etwa als ZIP geladen) – die Geschichte lässt sich hier nicht nachlesen.\n'
      );
    }

    const nachTag = new Map();
    for (const c of liste) {
      if (!nachTag.has(c.tag)) nachTag.set(c.tag, []);
      nachTag.get(c.tag).push(c);
    }

    const teile = [...nachTag.entries()].map(([tag, cs]) => {
      const eintraege = cs
        .map((c) => `### ${c.titel.replace(/^#+\s*/, '')}\n\n\`${c.kurz}\`${c.text ? `\n\n${alsAbsaetze(c.text)}` : ''}`)
        .join('\n\n');
      return `## ${tagAlsText(tag)}\n\n${eintraege}`;
    });

    return (
      kapitelKopf('Wie der Almanach entstand', einleitung) +
      `\nInsgesamt ${liste.length} Schritte an ${nachTag.size} Tagen.\n\n` +
      teile.join('\n\n') +
      '\n'
    );
  },
};
