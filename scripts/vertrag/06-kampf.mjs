/**
 * Vertrag, Kapitel: Der Kampf.
 *
 * Zwei Sichten auf denselben Kampf, die Initiative durch die Spielerin,
 * Schaden, der aufs Blatt wandert, und das Teilen der Beute.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { gleich, pruefe } from './werkzeug.mjs';

export default async function kampf(lage) {
  const { sl, spieler, held } = lage;
  await sl.ruf('/encounter/party', { methode: 'POST', koerper: {} });
  await sl.ruf('/encounter/combatants', {
    methode: 'POST',
    koerper: { name: 'Lauerer', type: 'monster', hp: 30, maxHp: 30, ac: 16, hidden: true, initiative: 18 },
  });
  await sl.ruf('/encounter/combatants', {
    methode: 'POST',
    koerper: { name: 'Wolf', type: 'monster', hp: 11, maxHp: 11, ac: 13, initiative: 12 },
  });
  {
    const slSicht = (await sl.ruf('/encounter')).daten;
    const rundenSicht = (await spieler.ruf('/encounter')).daten;
    pruefe(slSicht.combatants.some((c) => c.name === 'Lauerer'), 'Die Spielleitung sieht verborgene Kämpfer');
    pruefe(
      !rundenSicht.combatants.some((c) => c.name === 'Lauerer'),
      'Verborgene Kämpfer fehlen in der Fassung für die Runde'
    );
    const wolf = rundenSicht.combatants.find((c) => c.name === 'Wolf');
    gleich(wolf?.hp, null, 'Monster-Trefferpunkte bleiben der Runde verborgen');
    pruefe(
      ['unversehrt', 'leicht_verletzt', 'verwundet', 'schwer_verwundet', 'kampfunfaehig'].includes(wolf?.status),
      'Zustand ist ein bekannter Schlüssel',
      `war ${JSON.stringify(wolf?.status)}`
    );
    const eigener = rundenSicht.combatants.find((c) => c.characterId === held.id);
    pruefe(typeof eigener?.hp === 'number', 'Die eigenen Trefferpunkte sieht die Runde');
  }

  // --- Initiative durch die Spielerin ------------------------------------
  {
    const eigener = (await spieler.ruf('/encounter')).daten.combatants.find((c) => c.characterId === held.id);
    const { status } = await spieler.ruf(`/encounter/combatants/${eigener.id}/initiative`, {
      methode: 'POST',
      koerper: { value: 17 },
    });
    gleich(status, 200, 'Die Runde darf ihre eigene Initiative eintragen');
    const fremderKaempfer = (await sl.ruf('/encounter')).daten.combatants.find((c) => c.name === 'Wolf');
    const abgewiesen = await spieler.ruf(`/encounter/combatants/${fremderKaempfer.id}/initiative`, {
      methode: 'POST',
      koerper: { value: 20 },
    });
    gleich(abgewiesen.status, 403, 'Fremde Initiative bleibt tabu');
  }

  // --- Schaden wandert aufs Blatt ---------------------------------------
  {
    const eigener = (await sl.ruf('/encounter')).daten.combatants.find((c) => c.characterId === held.id);
    await sl.ruf(`/encounter/combatants/${eigener.id}/damage`, { methode: 'POST', koerper: { amount: 4 } });
    const blatt = (await spieler.ruf(`/characters/${held.id}`)).daten;
    gleich(blatt.data.combat.hp.current, 5, 'Schaden aus dem Kampf steht auf dem Charakterblatt');
  }

  // --- Beute teilen ------------------------------------------------------
  {
    await sl.ruf('/stash/coins', { methode: 'PUT', koerper: { pp: 0, gp: 43, ep: 0, sp: 7, cp: 0 } });
    const { daten } = await sl.ruf('/stash/teilung?anteile=3');
    gleich(daten.proKopf.gp, 14, 'Beute teilen: Gold je Kopf');
    gleich(daten.proKopf.sp, 5, 'Beute teilen: Silber je Kopf');
    gleich(daten.proKopf.cp, 6, 'Beute teilen: Kupfer je Kopf');
    gleich(daten.proKopf.pp, 0, 'Beute teilen erfindet kein Platin');
    gleich(daten.rest.cp, 2, 'Beute teilen: der Rest bleibt liegen');
  }

}
