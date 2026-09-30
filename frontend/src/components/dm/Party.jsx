/**
 * Der Reiter „Runde“ hinter dem Schirm – und nur noch die Reihenfolge.
 *
 * Jeder Abschnitt steht in einer eigenen Datei unter `runde/` und holt
 * sich selbst, was er braucht. Diese Datei sagt lediglich, was in welcher
 * Reihenfolge untereinander steht; wer einen Abschnitt sucht, findet ihn
 * an seinem Namen.
 *
 * Die Reihenfolge ist nicht beliebig – sie führt von der **Runde** zur
 * **Kampagne** und endet beim Endgültigen:
 *
 *   Einladungen         die Runde: wer überhaupt ein Konto bekommt
 *   Mitglieder          die Kampagne: wer bei dieser Geschichte dabei ist
 *   Umzugsgut           die Kampagne: was in eine andere kopiert wird
 *   Konten              die Runde: Rollen, Farben, Kennwörter
 *   Charakterzuweisung  die Kampagne: welches Blatt wem gehört
 *   WerBestimmt …       die Kampagne selbst: umbenennen, löschen, Papierkorb
 *
 * Merksatz, der beim Lesen hilft: **Konten gehören der Runde, alles
 * Gespielte einer Kampagne.** Wer neu im Almanach ist, braucht beides –
 * ein Konto *und* einen Platz in einer Kampagne.
 */
import { useKonten } from '../../lib/daten.js';
import Einladungen from './runde/Einladungen.jsx';
import Kampagnenmitglieder from './runde/Kampagnenmitglieder.jsx';
import Umzugsgut from './runde/Umzugsgut.jsx';
import Konten from './runde/Konten.jsx';
import Charakterzuweisung from './runde/Charakterzuweisung.jsx';
import WerBestimmt from './runde/WerBestimmt.jsx';
import KampagneUmbenennen from './runde/KampagneUmbenennen.jsx';
import KampagneLoeschen from './runde/KampagneLoeschen.jsx';
import Papierkorb from './runde/Papierkorb.jsx';
import { IconUsers } from '../icons.jsx';

export default function Party() {
  // Die Kontenliste brauchen drei Abschnitte. Sie einmal hier zu holen und
  // durchzureichen erspart drei gleiche Anfragen beim Öffnen des Reiters.
  const { konten, laden } = useKonten();

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-sepia italic">
        <IconUsers size={17} className="text-faint" />
        {konten.length === 1
          ? 'Bisher bist nur du im Almanach verzeichnet.'
          : `${konten.length} Konten führt der Almanach.`}
      </p>

      <Einladungen />
      <Kampagnenmitglieder users={konten} />
      <Umzugsgut />
      <Konten users={konten} onChanged={laden} />
      <Charakterzuweisung users={konten} onChanged={laden} />

      <WerBestimmt />
      <KampagneUmbenennen />
      <KampagneLoeschen />
      <Papierkorb />
    </div>
  );
}
