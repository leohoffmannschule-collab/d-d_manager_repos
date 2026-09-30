/**
 * Vertrag, Kapitel: NSC-Blätter.
 *
 * NSC-Blätter sind der Zettel hinter dem Schirm: Die Runde sieht sie nicht,
 * auch nicht als „geteilt“ markiert, und das Holen der Runde in den Kampf
 * lässt sie liegen. Auch der Live-Kanal verrät nichts von ihnen – und wer
 * ein Blatt nicht mehr sehen darf, bekommt es aus seiner Übersicht genommen.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { gleich, mitschreiben, pruefe } from './werkzeug.mjs';

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

    // Auch über den Live-Kanal nicht: Fasst die Spielleitung das NSC-Blatt
    // an, geht die Nachricht nur an sie. Zur Gegenprobe wird danach ein
    // geteiltes Blatt gespeichert – kommt dessen Meldung bei der Runde an,
    // hätte die des NSC-Blattes schon vorher dort sein müssen.
    const ohr = await mitschreiben(spieler);
    await ohr.warteAuf('event: willkommen');
    await sl.ruf(`/characters/${nsc.id}`, {
      methode: 'PUT',
      koerper: { name: nsc.name, data: { geheim: 'Der Wirt kennt den Weg zur Schatzkammer' } },
    });
    const offen = (await sl.ruf('/characters')).daten.find((c) => c.shared && !c.npc);
    const offenesBlatt = (await sl.ruf(`/characters/${offen.id}`)).daten;
    await sl.ruf(`/characters/${offen.id}`, { methode: 'PUT', koerper: { name: offen.name, data: offenesBlatt.data } });
    pruefe(await ohr.warteAuf(offen.id), 'Die Runde erfährt live, wenn sich ein geteiltes Blatt ändert');
    pruefe(!ohr.text().includes(nsc.id), 'Von einem geänderten NSC-Blatt erfährt die Runde über den Live-Kanal nichts');

    // Wandert ein Blatt hinter den Schirm, verschwindet es aus der Übersicht
    // der Runde, ohne dass jemand neu laden muss.
    const bald = (
      await sl.ruf('/characters', { methode: 'POST', koerper: { name: 'Bald hinter dem Schirm', system: 'dnd5e', data: {} } })
    ).daten;
    await sl.ruf(`/characters/${bald.id}`, { methode: 'PATCH', koerper: { npc: true } });
    pruefe(
      await ohr.warteAuf(`event: charakter:entfernt\ndata: {"id":"${bald.id}"}`),
      'Wandert ein Blatt hinter den Schirm, nimmt die Runde es aus ihrer Übersicht'
    );
    await ohr.zu();
    await sl.ruf(`/characters/${bald.id}`, { methode: 'DELETE' });

    // Ein Spieler darf sich kein Blatt hinter den Schirm holen.
    const eigenes = (await spieler.ruf('/characters')).daten.find((c) => c.ownerId);
    gleich(
      (await spieler.ruf(`/characters/${eigenes.id}`, { methode: 'PATCH', koerper: { npc: true } })).status,
      403,
      'Ein NSC-Blatt macht nur die Spielleitung'
    );
  }

}
