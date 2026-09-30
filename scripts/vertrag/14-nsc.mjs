/**
 * Vertrag, Kapitel: NSC-Blätter.
 *
 * NSC-Blätter sind der Zettel hinter dem Schirm: Die Runde sieht sie nicht,
 * auch nicht als „geteilt“ markiert, und das Holen der Runde in den Kampf
 * lässt sie liegen.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { gleich, pruefe } from './werkzeug.mjs';

export default async function nsc(lage) {
  const { sl, spieler } = lage;
  {
    const nsc = (
      await sl.ruf('/characters', {
        methode: 'POST',
        koerper: { name: 'Wirt zum Grinsenden Troll', system: 'dnd5e', data: {}, npc: true },
      })
    ).daten;
    gleich(nsc.npc, true, 'Ein NSC-Blatt weiß, dass es eins ist');
    gleich(nsc.shared, false, 'Und ist nie geteilt');

    gleich((await spieler.ruf(`/characters/${nsc.id}`)).status, 403, 'Die Runde kommt nicht an das Blatt');
    pruefe(
      !(await spieler.ruf('/characters')).daten.some((c) => c.id === nsc.id),
      'Und findet es auch nicht in der Übersicht'
    );
    pruefe(
      (await sl.ruf('/characters')).daten.some((c) => c.id === nsc.id),
      'Die Spielleitung sieht es sehr wohl'
    );

    // Auch ein versehentlich geteiltes NSC-Blatt bleibt hinter dem Schirm.
    await sl.ruf(`/characters/${nsc.id}`, { methode: 'PATCH', koerper: { shared: true } });
    gleich(
      (await spieler.ruf(`/characters/${nsc.id}`)).status,
      403,
      'Auch als „geteilt“ markiert bleibt es hinter dem Schirm'
    );

    // Und die Runde holen zieht es nicht in den Kampf.
    await sl.ruf('/encounter/party', { methode: 'POST' });
    pruefe(
      !(await sl.ruf('/encounter')).daten.combatants.some((c) => c.name.startsWith('Wirt')),
      'Beim Holen der Runde bleibt der Wirt in seiner Schänke'
    );

    // Ein Spieler darf sich kein Blatt hinter den Schirm holen.
    const eigenes = (await spieler.ruf('/characters')).daten.find((c) => c.ownerId);
    gleich(
      (await spieler.ruf(`/characters/${eigenes.id}`, { methode: 'PATCH', koerper: { npc: true } })).status,
      403,
      'Ein NSC-Blatt macht nur die Spielleitung'
    );
  }

}
