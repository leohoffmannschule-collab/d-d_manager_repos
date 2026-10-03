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

  // Nachträglich umstellen, in beide Richtungen: Ein Held der Runde wandert
  // hinter den Schirm und kommt wieder hervor. Der Besitz bleibt stehen, aber
  // solange das Blatt dort liegt, ruhen alle Rechte, die er sonst gibt.
  {
    const wandel = (
      await spieler.ruf('/characters', {
        methode: 'POST',
        koerper: { name: 'Wandelheld', system: 'dnd5e', data: { combat: { hp: { current: 9, max: 12 } } } },
      })
    ).daten;
    await sl.ruf('/encounter/party', { methode: 'POST' });
    const zeile = async (wer) => (await wer.ruf('/encounter')).daten.combatants.find((c) => c.characterId === wandel.id);
    gleich((await zeile(sl))?.type, 'pc', 'Im Kampf steht der Held zunächst als Held');
    const szene = (await sl.ruf('/scenes/aktiv')).daten;
    const figur = szene?.id
      ? (
          await sl.ruf(`/scenes/${szene.id}/figuren`, {
            methode: 'POST',
            koerper: { name: 'Wandelheld', x: 70, y: 70, characterId: wandel.id },
          })
        ).daten
      : null;

    const ohr = await mitschreiben(spieler);
    await ohr.warteAuf('event: willkommen');
    const hinter = (await sl.ruf(`/characters/${wandel.id}`, { methode: 'PATCH', koerper: { npc: true } })).daten;
    gleich(hinter.npc, true, 'Die Spielleitung stellt einen Helden nachträglich hinter den Schirm');
    gleich(hinter.shared, false, 'Dort ist er nicht mehr geteilt');
    gleich(hinter.ownerId, wandel.ownerId, 'Der Besitz bleibt stehen – für den Weg zurück');
    pruefe(
      await ohr.warteAuf(`event: charakter:entfernt\ndata: {"id":"${wandel.id}"}`),
      'Die Runde – auch der Besitzer – verliert das Blatt live aus der Übersicht'
    );
    gleich((await spieler.ruf(`/characters/${wandel.id}`)).status, 403, 'Der Besitzer kommt nicht mehr an das Blatt');
    gleich(
      (await spieler.ruf(`/characters/${wandel.id}`, { methode: 'PUT', koerper: { name: 'Doch noch', data: {} } })).status,
      403,
      'Und ändert es nicht'
    );
    gleich((await zeile(sl))?.type, 'npc', 'Im Kampf wird seine Zeile zur NSC-Zeile');
    const sichtDerRunde = await zeile(spieler);
    pruefe(sichtDerRunde && sichtDerRunde.hp === null, 'Die Runde sieht seine Trefferpunkte nicht mehr genau');
    gleich(
      (
        await spieler.ruf(`/encounter/combatants/${(await zeile(sl)).id}/initiative`, {
          methode: 'POST',
          koerper: { value: 17 },
        })
      ).status,
      403,
      'Die Initiative trägt der Besitzer nicht mehr ein'
    );
    if (figur) {
      gleich(
        (await spieler.ruf(`/scenes/figuren/${figur.id}`, { methode: 'PATCH', koerper: { x: 140, y: 140 } })).status,
        403,
        'Seine Figur zieht der Besitzer nicht mehr'
      );
    }

    const vor = (await sl.ruf(`/characters/${wandel.id}`, { methode: 'PATCH', koerper: { npc: false } })).daten;
    gleich(vor.npc, false, 'Und holt ihn wieder hervor');
    gleich(vor.shared, true, 'Zurück steht er in der Runde');
    gleich(vor.ownerId, wandel.ownerId, 'Und gehört wieder derselben Person');
    pruefe(
      await ohr.warteAuf(`"id":"${wandel.id}","name":"Wandelheld","system":"dnd5e"`),
      'Die Runde bekommt ihn live mit der vollen Kurzfassung zurück'
    );
    gleich((await spieler.ruf(`/characters/${wandel.id}`)).status, 200, 'Der Besitzer kommt wieder an sein Blatt');
    gleich((await zeile(sl))?.type, 'pc', 'Und im Kampf ist er wieder ein Held');
    gleich((await zeile(spieler))?.hp, 9, 'Mit Trefferpunkten, die die Runde sieht');
    if (figur) {
      gleich(
        (await spieler.ruf(`/scenes/figuren/${figur.id}`, { methode: 'PATCH', koerper: { x: 140, y: 140 } })).status,
        200,
        'Seine Figur zieht er wieder selbst'
      );
    }
    await ohr.zu();

    // Hervorholen, aber privat: `shared: false` im selben Rumpf gilt.
    await sl.ruf(`/characters/${wandel.id}`, { methode: 'PATCH', koerper: { npc: true } });
    const privat = (await sl.ruf(`/characters/${wandel.id}`, { methode: 'PATCH', koerper: { npc: false, shared: false } }))
      .daten;
    pruefe(!privat.npc && !privat.shared, 'Mit shared: false kommt ein NSC als privates Blatt hervor');

    if (figur) await sl.ruf(`/scenes/figuren/${figur.id}`, { methode: 'DELETE' });
    await sl.ruf(`/encounter/combatants/${(await zeile(sl)).id}`, { methode: 'DELETE' });
    await sl.ruf(`/characters/${wandel.id}`, { methode: 'DELETE' });
  }
}
