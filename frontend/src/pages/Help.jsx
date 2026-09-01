import { Card } from '../components/ui.jsx';

export default function Help() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-[0.08em] text-ink uppercase sm:text-[27px]">Hilfe</h1>
        <p className="mt-1 text-sepia italic">Kurze Anleitung für den Gebrauch am Spieltisch</p>
      </div>

      <Card title="Über den Abenteuer-Almanach">
        <p className="leading-relaxed text-ink">
          Dieser Charaktermanager läuft auf deinem eigenen Rechner oder Raspberry Pi im Heimnetzwerk. Alle
          Charakterdaten bleiben ausschließlich dort – nichts wandert zu einem fremden Dienst. Angaben zu Völkern,
          Klassen, Zaubern und Ungeheuern stammen aus der offenen D&amp;D-5e-API und werden nach dem ersten Abruf
          örtlich verwahrt, damit das Kompendium auch bei wackligem Internet schnell bleibt.
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
          antippen, fertig. Die letzten zwanzig Würfe bleiben in der Wurfchronik stehen.
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
