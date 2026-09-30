/**
 * Vertrag, Kapitel: Jeder Fehler trägt einen Schlüssel.
 *
 * Jede Absage des Servers trägt einen unveränderlichen Schlüssel (`code`) –
 * die Oberfläche prüft nur ihn, nie den Satz daneben.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { gleich, pruefe } from './werkzeug.mjs';

export default async function fehlerschluessel(lage) {
  const { sl } = lage;
  {
    const faelle = [
      ['/characters/gibtesnicht', 404],
      ['/scenes/aktiv/gibtesnicht', 404],
      ['/maps/gibtesnicht', 404],
      ['/ambience/gibtesnicht', 404],
      ['/gibtesnicht', 404],
    ];
    for (const [pfad, status] of faelle) {
      const { status: ist, daten } = await sl.ruf(pfad);
      gleich(ist, status, `${pfad} antwortet mit ${status}`);
      pruefe(typeof daten?.code === 'string', `${pfad} nennt einen Fehlerschlüssel`);
    }
  }

}
