/**
 * Hilfe: rund ums Gerät – der Almanach auf dem Home-Bildschirm, die beiden
 * Erscheinungsbilder, das Würfeln und der rote Punkt neben dem Namen.
 */
import { Card } from '../../components/ui.jsx';

export default function Geraet() {
  return (
    <>
      <Card title="Auf dem iPad zum Home-Bildschirm hinzufügen">
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 leading-relaxed text-ink marker:font-display marker:text-rubric">
          <li>Diese Seite in Safari öffnen.</li>
          <li>Auf das Teilen-Symbol tippen (Quadrat mit Pfeil nach oben).</li>
          <li>„Zum Home-Bildschirm“ wählen.</li>
          <li>Die App startet danach im Vollbild – wie eine gewöhnliche App, mit eigenem Symbol.</li>
        </ol>
      </Card>

      <Card title="Pergament oder Kerzenlicht">
        <p className="leading-relaxed text-ink">
          Oben rechts lässt sich zwischen zwei Fassungen wechseln: <span className="font-display">Pergament</span> für
          helle Räume und <span className="font-display">Kerzenlicht</span> für den abgedunkelten Spieltisch. Die Wahl
          merkt sich jedes Gerät für sich.
        </p>
      </Card>

      <Card title="Würfeln">
        <p className="leading-relaxed text-ink">
          Der Würfelbeutel unten rechts ist von jeder Seite aus erreichbar: Anzahl und Modifikator eintragen, Würfel
          antippen, fertig. Vorteil und Nachteil gelten für den ersten W20 im Wurf, und eigene Ausdrücke wie{' '}
          <span className="font-display">2W6+3</span> gehen auch. Gewürfelt wird auf dem Server – jeder Wurf steht
          damit sofort bei allen am Tisch in der Wurfchronik.
        </p>
      </Card>

      <Card title="Wenn der Punkt neben dem Namen rot blinkt">
        <p className="leading-relaxed text-ink">
          Dann ist die Verbindung zum Spieltisch gerade unterbrochen – der Almanach knüpft sie von allein wieder an.
          Sobald der Punkt golden leuchtet, laufen die Änderungen der anderen wieder ein.
        </p>
      </Card>
    </>
  );
}
