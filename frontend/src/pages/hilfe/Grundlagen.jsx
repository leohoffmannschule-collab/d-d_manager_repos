/**
 * Hilfe, erster Teil: was der Almanach ist, wer welche Rolle hat und wie
 * mehrere Kampagnen nebeneinander leben.
 *
 * Die Spielleitung liest beim Thema Kampagnen mehr: wie man umbenennt,
 * löscht und etwas in eine andere Kampagne kopiert.
 *
 * @param {{ isDm: boolean }} props
 */
import { Card } from '../../components/ui.jsx';

export default function Grundlagen({ isDm }) {
  return (
    <>
      <Card title="Über den Abenteuer-Almanach">
        <p className="leading-relaxed text-ink">
          Der Almanach läuft auf deinem eigenen Rechner oder Raspberry Pi. Alle Daten bleiben ausschließlich dort –
          nichts wandert zu einem fremden Dienst. Angaben zu Völkern, Klassen, Zaubern und Ungeheuern stammen aus der
          offenen D&amp;D-5e-API und werden nach dem ersten Abruf örtlich verwahrt, damit das Kompendium auch bei
          wackligem Internet schnell bleibt.
        </p>
      </Card>

      <Card title="Konten und Rollen">
        <p className="leading-relaxed text-ink">
          Das erste angelegte Konto führt die <span className="font-display">Spielleitung</span>. Alle weiteren treten
          mit einem Einladungscode bei, den die Spielleitung unter <span className="font-display">Spielleitung →
          Runde</span> erzeugt. Wer zur Runde gehört, sieht sein eigenes Charakterblatt, die Blätter der Mitspieler
          zum Lesen, den Spieltisch und die ausgeteilten Handzettel. Bestiarium, geheime Notizen und verborgene
          Figuren bleiben hinter dem Schirm der Spielleitung.
        </p>
      </Card>

      <Card title="Mehrere Kampagnen">
        <p className="leading-relaxed text-ink">
          Eine Runde kann mehrere Geschichten nebeneinander spielen. Die Konten bleiben dieselben; gewechselt wird
          oben rechts über den Namen der Kampagne. Was am Tisch entsteht – Charaktere, Handzettel, Szenen, Beute,
          Kampf, Würfe, Chat und Chronik –, gehört zu genau einer Kampagne. Die Vorbereitung dagegen gehört der
          ganzen Runde: Karten, hochgeladene Bilder, Bestiarium, vorbereitete Begegnungen und der Klangteppich
          stehen in jeder Kampagne bereit und müssen nie zweimal angelegt werden.
        </p>
        {isDm && (
          <>
            <p className="mt-3 leading-relaxed text-ink">
              Neue Kampagnen legt die Spielleitung im Kampagnenmenü an. Über eine bestehende bestimmt, wer sie
              angelegt hat: Unter <span className="font-display">Spielleitung → Runde</span> steht für sie{' '}
              <span className="font-display">Diese Kampagne umbenennen</span> – das ändert nur den Namen, alles darin
              bleibt unberührt – und darunter das Löschen. Gelöscht wird nur, indem der Name abgetippt wird; danach
              liegt die Kampagne 30 Tage im Papierkorb und lässt sich zurückholen.
            </p>
            <p className="mt-3 leading-relaxed text-ink">
              <span className="font-display">Etwas hinüberkopieren:</span> An jedem Charakterblatt, jedem Handzettel,
              jeder Szene und jedem Fund in der Beutekiste steht der Knopf{' '}
              <span className="font-display">In Kampagne …</span> bereit. Unter{' '}
              <span className="font-display">Spielleitung → Runde</span> nimmt{' '}
              <span className="font-display">Alles in eine andere Kampagne</span> auf einen Schlag mit, was du
              ankreuzt – gedacht für den Umzug einer Runde in eine neue Geschichte. Kopiert wird, nicht verschoben:
              Hier bleibt alles liegen, und beide Fassungen gehen danach getrennte Wege. Zweimal kopiert heißt
              drüben zweimal.
            </p>
            <p className="mt-3 leading-relaxed text-ink">
              Figuren auf der Karte und getragene Gegenstände finden drüben den Charakter{' '}
              <span className="italic">gleichen Namens</span> wieder – kopiere also zuerst die Runde und dann die
              Szenen. Die zwölf Vorlagen hinter dem Schirm bleiben beim Umzug zurück, weil jede Kampagne dieselben
              von selbst mitbringt.
            </p>
          </>
        )}
      </Card>
    </>
  );
}
