/**
 * Vertrag, Kapitel: Konten und Rollen.
 *
 * Das erste Konto führt die Spielleitung, jedes weitere braucht eine
 * Einladung; ohne Anmeldung gibt es keinen Zugriff, ohne Rolle kein
 * Bestiarium. Legt die drei Klienten an, die durch den ganzen Durchgang
 * gehen: Spielleitung, Spielerin, Fremder.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { gleich, klient, pruefe } from './werkzeug.mjs';

export default async function konten(lage) {
  const sl = klient();
  const spieler = klient();
  const fremd = klient();

  // --- Konten und Rollen -------------------------------------------------
  {
    const { daten } = await fremd.ruf('/auth/status');
    pruefe(daten?.needsSetup === true, 'Leerer Almanach meldet Einrichtungsbedarf');
  }
  {
    const { status, daten } = await sl.ruf('/auth/register', {
      methode: 'POST',
      koerper: { name: 'Vertrag-SL', password: 'ausreichend-lang' },
    });
    gleich(status, 201, 'Erstes Konto lässt sich anlegen');
    gleich(daten?.user?.role, 'sl', 'Erstes Konto führt die Spielleitung');
  }
  {
    const { status, daten } = await fremd.ruf('/auth/register', {
      methode: 'POST',
      koerper: { name: 'Ungebeten', password: 'ausreichend-lang' },
    });
    gleich(status, 403, 'Ohne Einladung kein zweites Konto');
    gleich(daten?.code, 'einladung_ungueltig', 'Fehler trägt einen Schlüssel');
  }
  const einladung = (await sl.ruf('/auth/invites', { methode: 'POST', koerper: {} })).daten;
  {
    const { status, daten } = await spieler.ruf('/auth/register', {
      methode: 'POST',
      koerper: { name: 'Vertrag-Spielerin', password: 'ausreichend-lang', invite: einladung.code },
    });
    gleich(status, 201, 'Mit Einladung geht es');
    gleich(daten?.user?.role, 'spieler', 'Weitere Konten gehören zur Runde');
  }
  const zweite = klient();
  {
    const code = (await sl.ruf('/auth/invites', { methode: 'POST', koerper: {} })).daten;
    const { status } = await zweite.ruf('/auth/register', {
      methode: 'POST',
      koerper: { name: 'Vertrag-Zweite', password: 'ausreichend-lang', invite: code.code },
    });
    gleich(status, 201, 'Auch ein zweiter Platz in der Runde lässt sich vergeben');
  }

  Object.assign(lage, { sl, spieler, fremd, zweite, einladung });
}
