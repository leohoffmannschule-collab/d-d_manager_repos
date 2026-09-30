/**
 * Vertrag, Kapitel: Charaktere.
 *
 * Die Spielerin legt ihren Helden an; er begleitet den ganzen weiteren
 * Durchgang (Kampf, Spieltisch, Sicht, Umzug).
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { gleich, pruefe } from './werkzeug.mjs';

export default async function charaktere(lage) {
  const { spieler } = lage;
  const held = (
    await spieler.ruf('/characters', {
      methode: 'POST',
      koerper: {
        name: 'Vertrag-Held',
        data: { abilities: { dex: 16 }, combat: { armorClass: 15, initiativeBonus: 1, hp: { current: 9, max: 12 } } },
      },
    })
  ).daten;
  {
    const { daten } = await spieler.ruf('/characters');
    const eintrag = daten.find((c) => c.id === held.id);
    pruefe(!!eintrag, 'Angelegter Charakter steht in der Übersicht');
    gleich(eintrag?.ac, 15, 'Rüstungsklasse steht in der Übersicht');
    gleich(eintrag?.initiative, 4, 'Initiative wird vorgerechnet (GE +3, Bonus +1)');
    pruefe(typeof eintrag?.ownerId === 'string', 'Übersicht nennt den Besitzer');
  }

  Object.assign(lage, { held });
}
