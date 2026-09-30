/**
 * Hilfe: rund ums eigene Blatt – das Charakterblatt, Zauber und Rasten,
 * die Beutekiste und das Mitnehmen als eigenständige Datei.
 */
import { Card } from '../../components/ui.jsx';

export default function Blatt() {
  return (
    <>
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
          Blatt als einzelne Datei auf dein Gerät – mit Bildnis und allem, was darauf steht. Diese Datei
          braucht weder Netz noch Server: Ein Doppelklick genügt, auf jedem Rechner, Tablet oder Telefon. Gedruckt
          sieht sie aus wie ein Charakterbogen.
        </p>
        <p className="mt-3 leading-relaxed text-ink">
          Das ist gedacht für die Vorbereitung, wenn der Almanach gerade nicht läuft – oder für den Zug zur Runde.
          Ändern lässt sich in der Datei nichts, was zurückwandert: Am Spieltisch gilt das Blatt im Almanach. Ganz
          hinten in der Datei steckt außerdem der vollständige Datensatz, sie ist also zugleich eine Sicherung.
        </p>
      </Card>
    </>
  );
}
