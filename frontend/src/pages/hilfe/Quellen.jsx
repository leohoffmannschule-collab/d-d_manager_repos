/**
 * Hilfe: woher die Regeltexte stammen, mit Verweisen auf die Quellen.
 */
import { Card } from '../../components/ui.jsx';

export default function Quellen() {
  return (
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
  );
}
