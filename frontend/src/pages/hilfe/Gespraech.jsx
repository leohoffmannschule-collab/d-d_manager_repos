/**
 * Hilfe: was am Abend gesprochen und festgehalten wird – der Chat am Tisch
 * und die Chronik.
 */
import { Card } from '../../components/ui.jsx';

export default function Gespraech() {
  return (
    <>
      <Card title="Der Chat am Tisch">
        <p className="leading-relaxed text-ink">
          Unten rechts, neben dem Würfelbeutel, liegt der Chat. Was du dort sagst, lesen alle am Tisch; die Zahl am
          Knopf zeigt, wie viel seit deinem letzten Blick hereingekommen ist.
        </p>
        <p className="mt-3 leading-relaxed text-ink">
          Über <span className="font-display">An</span> wählst du stattdessen eine einzelne Person – dann wird
          geflüstert. <strong>Das liest wirklich nur sie</strong>, auch die Spielleitung nicht: Der Server schickt
          die Zeile den übrigen Fenstern gar nicht erst. Umgekehrt gilt dasselbe, wenn dir jemand zuflüstert.
        </p>
        <p className="mt-3 leading-relaxed text-ink">
          Der Chat ist ein Gespräch, kein Archiv: Die letzten dreihundert Zeilen bleiben, ältere fallen hinten
          heraus, und in der Chronik steht davon nichts. Die Spielleitung kann ihn vor der nächsten Runde leeren.
        </p>
      </Card>

      <Card title="Die Chronik">
        <p className="leading-relaxed text-ink">
          Der Almanach schreibt mit, was am Tisch geschieht: Würfe, Wunden, wer zu Boden geht, welche Gegner
          auftreten, wohin die Runde zieht und was ausgeteilt wird. Unter <span className="font-display">Chronik</span>{' '}
          steht der Abend hinterher als Protokoll, nach Stationen und Kämpfen geordnet, und lässt sich als Datei
          sichern. Es wird dabei <span className="font-display">nichts mitgehört und nichts aufgenommen</span> –
          Grundlage ist allein, was ohnehin durch den Almanach läuft.
        </p>
      </Card>
    </>
  );
}
