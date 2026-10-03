/**
 * Hilfe: der Abschnitt „Für die Spielleitung“ – was hinter dem Schirm
 * liegt und wie man es benutzt.
 *
 * Nur die Spielleitung bekommt ihn zu sehen; die Seite (Help.jsx)
 * entscheidet das, nicht dieser Abschnitt.
 */
import { Card } from '../../components/ui.jsx';

export default function Spielleitung() {
  return (
    <Card title="Für die Spielleitung">
      <ul className="flex list-disc flex-col gap-1.5 pl-5 leading-relaxed text-ink marker:text-rubric">
        <li>
          <span className="font-display">Karte hochladen</span> legt die Karte auf den Tisch und zugleich in
          die Bibliothek. Unter „Raster“ die Feldgröße so einstellen, dass die Linien auf der Karte liegen –
          ein Feld sind fünf Fuß – und dann{' '}
          <span className="font-display">Raster in der Bibliothek merken</span>: Jede spätere Szene aus dieser
          Karte kommt schon passend auf den Tisch.
        </li>
        <li>
          Unter <span className="font-display">Spielleitung → Karten</span> liegt die Kartenbibliothek. Dort
          lädst du ganze Stapel auf einmal hoch, gibst ihnen Schlagworte („Wald“, „Nacht“, „Verlies“) und
          findest sie über die Suche wieder. <span className="font-display">Auflegen</span> holt eine Karte
          samt bereits aufgedecktem Nebel zurück auf den Tisch, <span className="font-display">frisch</span>{' '}
          beginnt sie neu unter geschlossenem Nebel.
        </li>
        <li>
          Mit <span className="font-display">Vorhang zu</span> siehst nur noch du den Tisch – die Runde
          bekommt kein Bild, keine Figuren, nicht einmal den Namen. Dahinter wechselst du in Ruhe die
          Karte, stellst die Gegner und malst den Nebel; ein Klick auf das rote Band öffnet wieder. In
          der Szenenlade legt <span className="font-display">verdeckt</span> eine Szene gleich hinter dem
          Vorhang auf. Kampf, Beute und Handzettel laufen daneben weiter.
        </li>
        <li>
          <span className="font-display">Aufdecken</span> und <span className="font-display">Verhüllen</span> malen
          den Nebel des Krieges. Vor dem Spiel einmal „alles verhüllen“, dann Raum für Raum öffnen. Was du nie
          aufgedeckt hast, wird der Runde gar nicht erst geschickt – auch die Figuren nicht, die dort stehen.
        </li>
        <li>
          Sobald eines der beiden gewählt ist, steht daneben der <span className="font-display">Pinsel</span>:
          1×1 für die Feinarbeit an einer Wand, 3×3, 5×5 oder 7×7 für einen breiten Strich – und{' '}
          <span className="font-display">Rechteck</span>, um einen Saal oder einen Gang aufzuziehen und auf
          einmal zu öffnen. Was der nächste Strich trifft, steht vorher hell auf der Karte (rot beim
          Verhüllen); beim Rechteck steht daneben, wie viele Felder es sind. Die Wahl bleibt stehen, auch
          wenn du zwischendurch etwas anderes tust.
        </li>
        <li>
          Unter „Raster“ stellst du auch den <span className="font-display">Maßstab</span> ein: wofür ein
          Feld im Spiel steht. Fünf Fuß nach Regelwerk oder ein Meter – darunter steht dann, wie groß die
          Karte insgesamt ist. Eine leere Szene legst du mit „ohne Karte“ in der gewünschten Feldzahl an,
          bis zu 250 × 250; bei einem Meter je Feld sind das zweihundertfünfzig Meter.
        </li>
        <li>
          Unter „Raster“ steht <span className="font-display">Dunkle Szene</span>. Ab dann zählt, was ohne
          Licht wahrgenommen wird. Einer Figur gibst du im Figurenfeld eine{' '}
          <span className="font-display">Lichtquelle</span> – Fackel, Laterne, Zauber –, und sie erhellt die
          Karte für alle. Wer selbst ein Licht trägt, sieht damit auch weiter als seine eingetragene
          Sichtweite – dafür ist eine Fackel da. Daneben steht{' '}
          <span className="font-display">Sichtweite hier</span>: eine obere Grenze für alle in dieser Szene,
          für Nebelbänke oder dichten Wald. 0 hebt sie auf.
        </li>
        <li>
          Du selbst siehst immer alles. Willst du wissen, was dein Späher sieht, bevor du ihn losschickst,
          wähle ihn oben rechts unter <span className="font-display">alles sehen</span> aus – dann
          siehst du genau seine Sicht. Zurück geht es über denselben Weg.
        </li>
        <li>
          Zwei Grenzen, damit du nicht suchst: Es gibt <span className="font-display">keine Wände</span> –
          Licht und Blick gehen hindurch, dagegen hilft nur der Nebel. Und dämmriges Licht zählt wie helles;
          der Nachteil auf Wahrnehmung ist eine Regel für den Wurf, nicht für den Nebel.
        </li>
        <li>
          Im <span className="font-display">Bestiarium</span> genügt ein Klick, um „3 Goblins“ samt gewürfelter
          Initiative in den Kampf zu stellen – W20 plus Geschicklichkeitsbonus aus dem Statblock, wahlweise
          verborgen, bis der Hinterhalt zuschnappt.
        </li>
        <li>
          <span className="font-display">Figuren aus dem Kampf</span> legt für jeden Kämpfer eine Figur auf die
          Karte. Schaden, den du in der Kampfliste einträgst, steht sofort auf dem Charakterblatt – und umgekehrt.
          Einen Gegner deckst du einmal auf – mit dem Auge in der Kampfliste oder im Figurenfeld –, und er erscheint
          in der Liste und auf der Karte zugleich.
        </li>
        <li>
          Eine Figur bindest du im <span className="font-display">Figurenfeld</span> unter{' '}
          <span className="font-display">Blatt</span> an ein Charakterblatt. Danach zieht die Besitzerin sie selbst,
          und ihre Sinne bestimmen, was sie sieht – auch ganz ohne Kampf.
        </li>
        <li>
          Unter <span className="font-display">Begegnungen</span> stellst du Gruppen einmal zusammen und stellst
          sie an jedem Abend mit einem Klick – samt gewürfelter Initiative. Was du improvisiert hast, sicherst du
          mit <span className="font-display">Laufenden Kampf sichern</span> für das nächste Mal.
        </li>
        <li>
          Unter <span className="font-display">Klang</span> hinterlegst du Spotify-Links als Ambiente: Link
          einfügen, benennen, verschlagworten. <span className="font-display">Auflegen</span> zeigt der ganzen
          Runde, was jetzt dran ist. Hängst du eine Ambiente an eine Karte, legt sie sich mit der Karte auf.
        </li>
        <li>
          Ein <span className="font-display">NSC-Blatt</span> legst du unter „Neuer Charakter“ an. Es ist ein
          vollständiges Blatt – für den Wirt, den Räuberhauptmann, den Drachen –, aber nur du siehst es. Es
          steht bei dir unter „Hinter dem Schirm“, taucht bei der Runde nirgends auf und wird beim Holen der
          Runde in den Kampf übergangen. Verknüpfst du eine Figur damit, gelten dessen Sinne für ihre Sicht.
        </li>
        <li>
          Jedes Blatt lässt sich nachträglich umstellen: <span className="font-display">Zum NSC</span> bzw.{' '}
          <span className="font-display">In die Runde</span> unten auf seiner Karte in der Übersicht. Ein Held
          hinter dem Schirm verschwindet sofort bei allen; seine Besitzerin kann ihn so lange weder ändern noch
          ziehen. Holst du ihn zurück, gehört er wieder ihr. In der Kampfliste wechselt seine Zeile mit.
        </li>
        <li>
          <span className="font-display">Blätter einlesen</span> nimmt mehrere Dateien auf einmal. Neue Blätter
          kannst du dabei gleich <span className="font-display">als NSC</span> anlegen – einzeln oder alle auf
          einmal.
        </li>
        <li>Notizen lassen sich als Handzettel austeilen; die Runde sieht sie dann am Spieltisch.</li>
        <li>
          In der Chronik trägst du nach, was der Almanach nicht sehen konnte, und schließt am Ende die Sitzung.
        </li>
        <li>Im Würfelbeutel kannst du <span className="font-display">verdeckt</span> würfeln – das sieht nur du.</li>
      </ul>
    </Card>
  );
}
