/**
 * Vertrag, Kapitel: Die Vorlagen liegen hinter dem Schirm.
 *
 * Jede Kampagne bringt zwölf fertige Charaktere als NSC-Blätter mit. Die
 * Runde sieht keines davon; eine Abschrift holt eines hinter dem Schirm
 * hervor.
 *
 * Zwölf fertige Charaktere werden beim ersten Start angelegt. Sie sind
 * NSC-Blätter: Die Spielleitung sieht sie, die Runde nicht. Wer eine davon
 * spielen will, macht eine Abschrift – und die gehört dann ihr.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { gleich, pruefe } from './werkzeug.mjs';

export default async function vorlagen(lage) {
  const { sl, spieler } = lage;
  {
    const beiDerSl = (await sl.ruf('/characters')).daten.filter((c) => c.id?.startsWith('vorlage-'));
    gleich(beiDerSl.length, 12, 'Die Spielleitung findet zwölf Vorlagen');
    pruefe(beiDerSl.every((c) => c.npc === true), 'Vorlagen liegen als NSC-Blätter');
    pruefe(new Set(beiDerSl.map((c) => c.classLevel)).size === 12, 'Jede Vorlage trägt eine eigene Klasse');
    pruefe(new Set(beiDerSl.map((c) => c.race)).size === 12, 'Jede Vorlage trägt eine eigene Spezies');
    pruefe(beiDerSl.every((c) => c.classLevel.endsWith(' 1')), 'Alle Vorlagen stehen auf Stufe 1');

    const beiDerRunde = (await spieler.ruf('/characters')).daten.filter((c) => c.id?.startsWith('vorlage-'));
    gleich(beiDerRunde.length, 0, 'Die Runde sieht keine einzige Vorlage');

    const eine = beiDerSl[0];
    gleich((await spieler.ruf(`/characters/${eine.id}`)).status, 403, 'Die Runde kommt nicht an ein Vorlagenblatt');

    // Ein volles Blatt: Die Vorlagen sollen zeigen, was ein Blatt alles trägt.
    const blatt = (await sl.ruf(`/characters/${eine.id}`)).daten.data;
    gleich(blatt.units, 'metrisch', 'Vorlagen rechnen metrisch');
    gleich(blatt.level, 1, 'Vorlagen stehen auf Stufe 1');
    pruefe(blatt.inventory.length >= 5, 'Eine Vorlage bringt ihre Startausrüstung mit');
    pruefe(blatt.features.length >= 4, 'Eine Vorlage bringt ihre Merkmale mit');
    pruefe(blatt.traits.backstory.length > 200, 'Eine Vorlage bringt ihre Vorgeschichte mit');
    pruefe(!!blatt.appearance.eyes, 'Eine Vorlage bringt ihr Aussehen mit');

    // Abschrift nehmen: Sie gehört danach der Spielleitung und ist kein NSC
    // mehr – so wandert eine Vorlage vom Schirm auf den Tisch.
    const abschrift = (await sl.ruf(`/characters/${eine.id}/duplicate`, { methode: 'POST' })).daten;
    pruefe(abschrift.name.endsWith('(Kopie)'), 'Die Abschrift trägt den Namen der Vorlage');
    gleich(abschrift.npc, false, 'Die Abschrift ist kein NSC-Blatt mehr');
    pruefe(typeof abschrift.ownerId === 'string', 'Die Abschrift hat einen Besitzer');
    gleich(
      JSON.stringify(abschrift.data.abilities),
      JSON.stringify(blatt.abilities),
      'Die Abschrift trägt dieselben Werte wie die Vorlage'
    );
    await sl.ruf(`/characters/${abschrift.id}`, { methode: 'DELETE' });
  }

}
