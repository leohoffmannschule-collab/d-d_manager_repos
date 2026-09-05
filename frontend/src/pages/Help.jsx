import { Card } from '../components/ui.jsx';
import { useAuth } from '../lib/auth.jsx';

export default function Help() {
  const { isDm } = useAuth();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-[0.08em] text-ink uppercase sm:text-[27px]">Hilfe</h1>
        <p className="mt-1 text-sepia italic">Kurze Anleitung für den Gebrauch am Spieltisch</p>
      </div>

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

      <Card title="Der Spieltisch">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 leading-relaxed text-ink marker:text-rubric">
          <li>
            Mit einem Finger oder der gedrückten Maustaste wird die Karte geschoben, mit dem Mausrad oder
            zwei Fingern gezoomt. Auch eine Karte über zweihundert Meter lässt sich so ganz herauszoomen –
            dann verschwinden die Rasterlinien, weil sie bei der Größe nur noch ein Grauschleier wären.
          </li>
          <li>Die eigene Figur lässt sich ziehen; beim Loslassen schnappt sie auf das Raster ein. Fremde Figuren bewegt nur die Spielleitung.</li>
          <li>Ein <span className="font-display">Alt+Klick</span> lässt eine Stelle für alle kurz aufleuchten – praktisch statt „da vorne links, nein, weiter unten“.</li>
          <li>Jede Bewegung, jeder Wurf und jede Änderung der Trefferpunkte steht sofort bei allen anderen auf dem Schirm.</li>
          <li>
            Trägst du unter <span className="font-display">Kampf → Widerstand und Sinne</span> eine{' '}
            <span className="font-display">Sichtweite</span> ein, bekommst du einen offenen Bereich um deine
            Figur – so weit, wie dein Blick reicht. Er hängt an ihr und bewegt sich nur, wenn sie sich bewegt.
            Wo du schon warst, bleibt gedämpft sichtbar; wer dort gerade steht, siehst du nicht mehr. Ohne
            Eintrag siehst du wie bisher alles Aufgedeckte.
          </li>
          <li>
            Ist die Szene <span className="font-display">dunkel</span>, reicht dein Blick so weit, wie deine
            Sichtweite <span className="font-display">oder deine eigene Lichtquelle</span> trägt – was von
            beidem weiter ist. Eine Fackel erweitert dein Sichtfeld also wirklich. Innerhalb davon siehst du,
            was beleuchtet ist und was deine Dunkelsicht erfasst; fremdes Licht hilft dir nur so weit, wie
            dein eigener Blick ohnehin hinreicht.
          </li>
        </ul>
      </Card>

      {isDm && (
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
              Initiative in den Kampf zu stellen – wahlweise verborgen, bis der Hinterhalt zuschnappt.
            </li>
            <li>
              <span className="font-display">Figuren aus dem Kampf</span> legt für jeden Kämpfer eine Figur auf die
              Karte. Schaden, den du in der Kampfliste einträgst, steht sofort auf dem Charakterblatt – und umgekehrt.
            </li>
            <li>
              Unter <span className="font-display">Begegnungen</span> stellst du Gruppen einmal zusammen und stellst
              sie an jedem Abend mit einem Klick – samt gewürfelter Initiative. Was du improvisiert hast, sicherst du
              mit <span className="font-display">Laufenden Kampf sichern</span> für das nächste Mal.
            </li>
            <li>
              Auch Gegner bekommen im Bestiarium eine gegossene Figur; sie steht dann mit auf dem Spieltisch.
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
            <li>Notizen lassen sich als Handzettel austeilen; die Runde sieht sie dann am Spieltisch.</li>
            <li>
              In der Chronik trägst du nach, was der Almanach nicht sehen konnte, und schließt am Ende die Sitzung.
            </li>
            <li>Im Würfelbeutel kannst du <span className="font-display">verdeckt</span> würfeln – das sieht nur du.</li>
          </ul>
        </Card>
      )}

      <Card title="Musik am Tisch">
        <p className="leading-relaxed text-ink">
          Legt die Spielleitung eine Ambiente auf, erscheint unten die{' '}
          <span className="font-display">Klangleiste</span> mit dem Namen und einem Knopf{' '}
          <span className="font-display">In Spotify öffnen</span>. Der Almanach spielt nichts ab – er sagt nur,
          was dran ist. Du hörst es in deinem eigenen Spotify, auf deinem eigenen Gerät und so laut, wie du
          magst. Das geht mit jedem Spotify-Konto, auch ohne Premium, und wer nicht mithören will, klickt
          einfach nicht.
        </p>
      </Card>

      <Card title="Dein Charakterblatt">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 leading-relaxed text-ink marker:text-rubric">
          <li>
            Jeder Wert ist zugleich ein Würfelknopf: Tippe auf den Bonus neben einer Fertigkeit, einem Rettungswurf
            oder einem Attribut, und der Wurf steht sofort bei allen am Tisch.
          </li>
          <li>
            Im Reiter <span className="font-display">Kampf</span> stehen Zustände, Erschöpfung, Konzentration,
            Widerstände und Sinne. Was deine Klasse zählen muss – Wut, Ki, bardische Inspiration – trägst du unter
            <span className="font-display"> Klassenressourcen</span> ein.
          </li>
          <li>
            <span className="font-display">Kurze</span> und <span className="font-display">lange Rast</span> füllen
            auf, was sich erneuert. Trefferwürfel gibst du einzeln aus; der Wurf wird gleich gutgeschrieben.
          </li>
          <li>Die Erfahrung verrät, welche Stufe dir zusteht – ein Knopf setzt sie.</li>
        </ul>
      </Card>

      <Card title="Zauber, Rasten und der letzte Atemzug">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 leading-relaxed text-ink marker:text-rubric">
          <li>
            Im Reiter <span className="font-display">Zauber</span> genügt ein Tipp auf den Namen, und der ganze
            Zaubertext steht da – Reichweite, Komponenten, Wirkungsdauer und Beschreibung. Kein Blättern ins
            Kompendium mitten im Zug.
          </li>
          <li>
            Der <span className="font-display">Rettungswurf gegen den Tod</span> trägt sich selbst ein: Eine 20
            richtet dich mit einem Trefferpunkt wieder auf, eine 1 zählt doppelt.
          </li>
          <li>
            Läuft eine <span className="font-display">Konzentration</span> und du wirst getroffen, trag den Schaden
            ein – der Schwierigkeitsgrad ergibt sich daraus, und der Wurf sagt dir, ob der Zauber hält.
          </li>
          <li>
            Beginnt ein Kampf, würfelst du deine <span className="font-display">Initiative</span> am Spieltisch
            selbst; sie steht sofort in der Liste der Spielleitung.
          </li>
        </ul>
      </Card>

      <Card title="Die Beutekiste">
        <p className="leading-relaxed text-ink">
          Am Spieltisch liegt unter <span className="font-display">Beute</span> die gemeinsame Kiste der Runde:
          Münzen und Gefundenes, für alle sichtbar, und jede und jeder darf eintragen. Ein Klick auf{' '}
          <span className="font-display">Auf … teilen</span> rechnet aus, was auf jeden Kopf entfällt – dabei werden
          Münzen nur nach unten gewechselt, damit niemand ein Platinstück ausgezahlt bekommt, das die Runde nie
          besessen hat. Die Spielleitung kann die Anteile mit einem Knopf in die Beutel schreiben lassen.
        </p>
      </Card>

      <Card title="Das Blatt mitnehmen">
        <p className="leading-relaxed text-ink">
          Oben auf deinem Blatt liegt der Knopf <span className="font-display">Mitnehmen</span>. Er sichert dein
          Blatt als einzelne Datei auf dein Gerät – mit Bildnis, Figur und allem, was darauf steht. Diese Datei
          braucht weder Netz noch Server: Ein Doppelklick genügt, auf jedem Rechner, Tablet oder Telefon. Gedruckt
          sieht sie aus wie ein Charakterbogen.
        </p>
        <p className="mt-3 leading-relaxed text-ink">
          Das ist gedacht für die Vorbereitung, wenn der Almanach gerade nicht läuft – oder für den Zug zur Runde.
          Ändern lässt sich in der Datei nichts, was zurückwandert: Am Spieltisch gilt das Blatt im Almanach. Ganz
          hinten in der Datei steckt außerdem der vollständige Datensatz, sie ist also zugleich eine Sicherung.
        </p>
      </Card>

      <Card title="Die Figurenschmiede">
        <p className="leading-relaxed text-ink">
          Im Reiter <span className="font-display">Figur</span> stellst du deine Miniatur zusammen: Volk, Statur,
          Rüstung, Waffe, Haar, Bart und Farben. Die Figur dreht sich, wenn du sie mit dem Finger ziehst;{' '}
          <span className="font-display">Auswürfeln</span> macht auf Zuruf einen Vorschlag. Beim{' '}
          <span className="font-display">Gießen</span> entsteht daraus das Bildnis für dein Blatt und die Figur, mit
          der du über die Karte ziehst – die Spielleitung legt sie beim nächsten Kampf von selbst aus.
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

      <Card title="Quellen">
        <ul className="flex flex-col gap-2 leading-relaxed text-ink">
          <li>
            Regelwerksdaten:{' '}
            <a className="text-rubric underline" href="https://www.dnd5eapi.co/" target="_blank" rel="noreferrer">
              dnd5eapi.co
            </a>{' '}
            von 5e-bits, auf Grundlage des D&amp;D-5e-SRD (OGL / Creative Commons).
          </li>
          <li>
            Anleitungen zur Schnittstelle:{' '}
            <a
              className="text-rubric underline"
              href="https://5e-bits.github.io/docs/tutorials"
              target="_blank"
              rel="noreferrer"
            >
              5e-bits.github.io/docs/tutorials
            </a>
          </li>
        </ul>
      </Card>
    </div>
  );
}
