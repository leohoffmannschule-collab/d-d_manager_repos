/**
 * Vertrag, Kapitel: Kampf und Charakterblatt führen dieselben Werte.
 *
 * Schaden, Heilung und Zustände aus der Kampfliste stehen sofort auf dem
 * verknüpften Blatt – und umgekehrt. Verknüpft wird nicht nur über „Runde
 * holen“, sondern auch, wenn die Spielleitung eine Figur, die an einem
 * Kämpfer hängt, im Figurenfeld an ein Blatt bindet. Temporäre
 * Trefferpunkte des Blattes fangen Schaden zuerst ab.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und räumt hinter sich auf.
 */
import { gleich as genau, mitschreiben, pruefe } from './werkzeug.mjs';

/** Wie `gleich`, aber auch für Listen: verglichen wird die Schreibweise als JSON. */
const gleich = (ist, soll, was) => genau(JSON.stringify(ist), JSON.stringify(soll), was);

export default async function kampfUndBlatt(lage) {
  const { sl, spieler } = lage;

  // Ein Held der Runde, und ein Kämpfer, der von Hand eingetragen wurde –
  // ohne Blatt, wie aus dem Bestiarium oder dem Formular.
  const blatt = (
    await spieler.ruf('/characters', {
      methode: 'POST',
      koerper: {
        name: 'Brann Eisenhut',
        system: 'dnd5e',
        data: { combat: { hp: { current: 20, max: 24, temp: 3 }, conditions: [], exhaustion: 0 } },
      },
    })
  ).daten;
  await sl.ruf('/encounter/combatants', { methode: 'POST', koerper: { name: 'Brann', type: 'pc', hp: 1, maxHp: 1 } });
  const zeile = async (wer = sl) => (await wer.ruf('/encounter')).daten.combatants.find((c) => c.name === 'Brann');
  const kaempfer = await zeile();
  gleich(kaempfer?.characterId ?? null, null, 'Ein Kämpfer von Hand hängt zunächst an keinem Blatt');

  // Eine Figur für diesen Kämpfer, dann im Figurenfeld an das Blatt binden.
  const szene = (await sl.ruf('/scenes/aktiv')).daten;
  pruefe(Boolean(szene?.id), 'Für dieses Kapitel liegt eine Szene auf');
  const figur = (
    await sl.ruf(`/scenes/${szene.id}/figuren`, {
      methode: 'POST',
      koerper: { name: 'Brann', x: 140, y: 140, combatantId: kaempfer.id },
    })
  ).daten;
  await sl.ruf(`/scenes/figuren/${figur.id}`, { methode: 'PATCH', koerper: { characterId: blatt.id } });
  const verknuepft = await zeile();
  gleich(verknuepft.characterId, blatt.id, 'Wird die Figur an ein Blatt gebunden, hängt auch ihr Kämpfer daran');
  gleich([verknuepft.hp, verknuepft.maxHp], [20, 24], 'Und übernimmt dabei die Trefferpunkte des Blattes');

  const holeBlatt = async () => (await spieler.ruf(`/characters/${blatt.id}`)).daten.data.combat;
  const ohr = await mitschreiben(spieler);
  await ohr.warteAuf('event: willkommen');

  // Schaden: zuerst die temporären Trefferpunkte.
  await sl.ruf(`/encounter/combatants/${verknuepft.id}/damage`, { methode: 'POST', koerper: { amount: 5 } });
  let kampf = await holeBlatt();
  gleich([kampf.hp.current, kampf.hp.temp], [18, 0], 'Schaden aus dem Kampf zehrt erst die temporären TP auf, dann die echten');
  gleich((await zeile()).hp, 18, 'Die Kampfliste rechnet genauso');

  // Heilung.
  await sl.ruf(`/encounter/combatants/${verknuepft.id}/damage`, { methode: 'POST', koerper: { amount: -4 } });
  gleich((await holeBlatt()).hp.current, 22, 'Heilung aus dem Kampf steht auf dem Blatt');

  // Zustände aus dem Kampf, samt Erschöpfung.
  await sl.ruf(`/encounter/combatants/${verknuepft.id}`, {
    methode: 'PUT',
    koerper: { conditions: ['Vergiftet', 'Erschöpft'] },
  });
  kampf = await holeBlatt();
  gleich(kampf.conditions, ['Vergiftet'], 'Zustände aus dem Kampf stehen auf dem Blatt');
  gleich(kampf.exhaustion, 1, '„Erschöpft“ im Kampf ist auf dem Blatt Erschöpfungsstufe 1');
  pruefe(
    await ohr.warteAuf(`"conditions":["Vergiftet"]`),
    'Die Runde sieht den Zustand live auf dem offenen Blatt'
  );
  await ohr.zu();

  // Und zurück: was auf dem Blatt geändert wird, steht in der Kampfliste.
  const voll = (await spieler.ruf(`/characters/${blatt.id}`)).daten;
  voll.data.combat.hp.current = 9;
  voll.data.combat.conditions = ['Liegend'];
  voll.data.combat.exhaustion = 0;
  await spieler.ruf(`/characters/${blatt.id}`, { methode: 'PUT', koerper: { name: voll.name, data: voll.data } });
  const zurueck = await zeile();
  gleich(zurueck.hp, 9, 'Schaden auf dem Blatt steht in der Kampfliste');
  gleich(zurueck.conditions, ['Liegend'], 'Zustände vom Blatt stehen in der Kampfliste, Erschöpfung 0 nimmt „Erschöpft“ weg');

  // Lösen: Der Kämpfer hängt danach an keinem Blatt mehr.
  await sl.ruf(`/scenes/figuren/${figur.id}`, { methode: 'PATCH', koerper: { characterId: null } });
  gleich((await zeile()).characterId ?? null, null, 'Wird die Figur gelöst, löst sich auch ihr Kämpfer vom Blatt');

  await sl.ruf(`/scenes/figuren/${figur.id}`, { methode: 'DELETE' });
  await sl.ruf(`/encounter/combatants/${verknuepft.id}`, { methode: 'DELETE' });
  await sl.ruf(`/characters/${blatt.id}`, { methode: 'DELETE' });
}
