/**
 * Verzeichnis: die Regeltabellen, mit denen das Blatt rechnet – gelesen aus
 * frontend/src/lib/regeln/ und dort *ausgerechnet*.
 *
 * Die Tabellen hier sind keine Abschrift aus dem Regelwerk, sondern das,
 * was der Almanach tatsächlich tut: Die Modifikator-Tabelle entsteht, indem
 * `abilityModifier` für jeden Wert von 1 bis 30 gerufen wird, die
 * Übungsbonus-Tabelle aus `proficiencyBonus` und so fort. Stimmt hier etwas
 * nicht, stimmt es auch am Tisch nicht – und umgekehrt.
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { kapitelKopf } from './quelle.mjs';

/** Das Kapitel. */
export const REGELN = {
  datei: '89-regeln.md',
  async erzeugen(wurzel) {
    const laden = (datei) => import(pathToFileURL(path.join(wurzel, 'frontend', 'src', 'lib', 'regeln', datei)).href);
    const listen = await laden('listen.js');
    const rechnen = await laden('rechnen.js');
    const felder = await laden('blattfelder.js');
    const masse = await laden('masse.js');

    // Dezimalzahlen mit Komma, wie man sie im Deutschen schreibt.
    const de = (text) => String(text).replace(/(\d)\.(\d)/g, '$1,$2');
    const attribut = (k) => listen.ABILITIES.find((a) => a.key === k)?.label ?? k;
    const teile = [];

    teile.push(
      '## Attribute und Modifikatoren',
      '',
      `Die sechs Attribute: ${listen.ABILITIES.map((a) => `${a.label} (\`${a.key}\`)`).join(', ')}. Der Modifikator ist (Wert − 10) / 2, abgerundet – ausgerechnet von \`abilityModifier\`:`,
      '',
      '| Wert | ' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((w) => w).join(' | ') + ' |',
      '|' + '---|'.repeat(11),
      '| Mod. | ' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((w) => rechnen.formatModifier(rechnen.abilityModifier(w))).join(' | ') + ' |',
      '| Wert | ' + [11, 12, 13, 14, 15, 16, 17, 18, 19, 20].join(' | ') + ' |',
      '| Mod. | ' + [11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((w) => rechnen.formatModifier(rechnen.abilityModifier(w))).join(' | ') + ' |',
      '| Wert | ' + [21, 22, 23, 24, 25, 26, 27, 28, 29, 30].join(' | ') + ' |',
      '| Mod. | ' + [21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((w) => rechnen.formatModifier(rechnen.abilityModifier(w))).join(' | ') + ' |',
      ''
    );

    teile.push(
      '## Stufe, Erfahrung und Übungsbonus',
      '',
      'Die Stufe folgt aus den Erfahrungspunkten (`levelFromExperience`), der Übungsbonus aus der Stufe (`proficiencyBonus`). Er steckt in jedem geübten Rettungswurf, jeder geübten Fertigkeit (doppelt bei Expertise), im Zauber-SG und im Zauberangriff.',
      '',
      '| Stufe | ab EP | Übungsbonus |',
      '|---|---|---|',
      ...felder.XP_THRESHOLDS.map((ep, i) => `| ${i + 1} | ${ep.toLocaleString('de-DE')} | ${rechnen.formatModifier(rechnen.proficiencyBonus(i + 1))} |`),
      '',
      'Wer ohne Erfahrungspunkte spielt, stellt im Blatt auf „Meilensteine“ um; die Stufe wird dann von Hand gesetzt.',
      ''
    );

    teile.push(
      '## Fertigkeiten',
      '',
      'Jede Fertigkeit hängt an einem Attribut. Ihr Bonus ist dessen Modifikator plus – wenn geübt – der Übungsbonus, bei Expertise zweimal (`skillModifier`).',
      '',
      '| Fertigkeit | Schlüssel | Attribut |',
      '|---|---|---|',
      ...listen.SKILLS.map((s) => `| ${s.label} | \`${s.key}\` | ${attribut(s.ability)} |`),
      '',
      `Drei davon stehen auch *passiv* auf dem Blatt – zehn plus der Bonus, ohne Würfel (\`passiverWert\`): ${listen.PASSIVE_FERTIGKEITEN.map((p) => p.label).join(', ')}.`,
      ''
    );

    const beispiel = { level: 5, abilities: { wis: 14, int: 16 }, skills: { perception: { proficient: true } } };
    teile.push(
      '## Zauberwirken',
      '',
      'Zauber-SG = 8 + Übungsbonus + Modifikator des Zauberattributs (`spellSaveDC`); Zauberangriff = Übungsbonus + Modifikator (`spellAttackBonus`). Beides lässt sich im Blatt von Hand überschreiben, etwa für einen magischen Fokus.',
      '',
      '| Stufe | Attribut 14 | Attribut 16 | Attribut 18 | Attribut 20 |',
      '|---|---|---|---|---|',
      ...[1, 5, 9, 13, 17].map(
        (stufe) =>
          `| ${stufe} | ${[14, 16, 18, 20].map((w) => `SG ${rechnen.spellSaveDC(w, stufe)} / ${rechnen.formatModifier(rechnen.spellAttackBonus(w, stufe))}`).join(' | ')} |`
      ),
      '',
      `Beispiel: Eine Spielfigur der Stufe 5 mit Weisheit 14 und geübter Wahrnehmung hat Wahrnehmung ${rechnen.formatModifier(rechnen.skillModifier(beispiel, 'perception'))} und passive Wahrnehmung ${rechnen.passiverWert(beispiel, 'perception')}.`,
      '',
      `Zauberplätze gibt es für die Grade ${listen.SPELL_LEVELS.join(', ')}; Zaubertricks (Grad 0) brauchen keinen.`,
      ''
    );

    teile.push(
      '## Traglast',
      '',
      'Tragkraft = Stärke × 15 Pfund (`carryingCapacity`). Wer mehr trägt, ist überladen; bis zum Doppelten lässt sich noch schieben, ziehen und heben (`traglastStufen`).',
      '',
      '| Stärke | trägt bis | schiebt bis | metrisch |',
      '|---|---|---|---|',
      ...[8, 10, 12, 14, 16, 18, 20].map((st) => {
        const { ueberladen, schieben } = rechnen.traglastStufen(st);
        return `| ${st} | ${ueberladen} Pfund | ${schieben} Pfund | ${de(masse.gewichtMitEinheit(ueberladen, 'metrisch'))} / ${de(masse.gewichtMitEinheit(schieben, 'metrisch'))} |`;
      }),
      ''
    );

    teile.push(
      '## Maße',
      '',
      `Gespeichert wird immer in Fuß und Pfund; angezeigt wahlweise ${masse.MASSSYSTEME.map(([, name]) => name).join(' oder ')}. Weiten werden wie im Regelwerk *gesetzt*, nicht umgerechnet – ${de(masse.METER_JE_FUSS)} m je Fuß, so dass ein Feld von 5 Fuß 1,5 m misst –, Gewichte dagegen ehrlich umgerechnet (${de(masse.KILO_JE_PFUND)} kg je Pfund).`,
      '',
      '| Fuß | Meter | | Pfund | Kilogramm |',
      '|---|---|---|---|---|',
      ...[5, 10, 30, 60, 120].map((f, i) => {
        const pfund = [1, 5, 25, 100, 300][i];
        return `| ${f} | ${de(masse.weiteAnzeigen(f, 'metrisch'))} | | ${pfund} | ${de(masse.gewichtAnzeigen(pfund, 'metrisch'))} |`;
      }),
      ''
    );

    teile.push(
      '## Zustände und Erschöpfung',
      '',
      `Die Zustände des Regelwerks, wie sie im Blatt und in der Kampfliste heißen: ${listen.CONDITIONS.join(', ')}.`,
      '',
      'Erschöpfung wirkt in Stufen, jede zusätzlich zu den vorigen:',
      '',
      '| Stufe | Wirkung |',
      '|---|---|',
      ...listen.EXHAUSTION_STEPS.map((w, i) => `| ${i} | ${w} |`),
      ''
    );

    teile.push(
      '## Aktionen',
      '',
      `Was eine Handlung kostet: ${felder.AKTION_ARTEN.map(([, n]) => n).join(', ')}. Was jede Figur immer tun kann, steht auf dem Blatt unter „Standardaktionen“:`,
      '',
      '| Handlung | kostet | Wirkung |',
      '|---|---|---|',
      ...felder.STANDARD_AKTIONEN.map((a) => `| ${a.name} | ${felder.aktionArtLabel(a.art)} | ${String(a.description ?? a.text ?? '').replace(/\|/g, '/').replace(/\n+/g, ' ')} |`),
      ''
    );

    teile.push(
      '## Merkmale und Aussehen',
      '',
      `Woher ein Merkmal stammt, entscheidet, unter welcher Überschrift es auf dem Blatt steht: ${felder.MERKMAL_ARTEN.map(([, n]) => n).join(', ')}.`,
      '',
      `Die Felder der Seite „Aussehen“: ${felder.AUSSEHEN_FELDER.map((f) => f.label).join(', ')}.`,
      ''
    );

    return (
      kapitelKopf(
        'Die Regeln, mit denen das Blatt rechnet',
        'Alles, was das Charakterblatt selbst ausrechnet, und die Listen, aus denen es seine Auswahlfelder füllt. Die Zahlen in den Tabellen sind nicht abgeschrieben, sondern beim Bau des Handbuchs mit denselben Funktionen gerechnet, die auch das Blatt benutzt (frontend/src/lib/regeln/).'
      ) +
      '\n' +
      teile.join('\n')
    );
  },
};
