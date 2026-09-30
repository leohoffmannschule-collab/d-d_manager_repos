/**
 * Die Kampfliste: wer wann dran ist, wie es ihm geht, was ihn plagt.
 *
 * Zwei Gesichter, gesteuert über `variant`:
 *   'voll'  – hinter dem Schirm (Spielleitung → Kampf): alle Werte, alle
 *             Knöpfe, auch die verborgenen Gegner.
 *   sonst   – am Spieltisch für die Runde: Monster-Trefferpunkte bleiben
 *             ein Wort („verwundet“) statt einer Zahl, Verborgenes fehlt
 *             ganz. Gefiltert hat das schon der Server – diese Datei
 *             *zeigt* nur weniger an, sie versteckt nichts.
 *
 * Die Initiative darf jeder für seine eigene Figur eintragen; das ist der
 * einzige Eingriff in den Kampf, der nicht der Spielleitung vorbehalten ist.
 *
 * Die Teile liegen in initiative/:
 *   Zeile.jsx          – eine Zeile der Liste, aufklappbar
 *   Lebensbalken.jsx   – Trefferpunkte als Balken oder Wort
 *   Wunden.jsx         – Schaden und Heilung eintragen
 *   Zustandswahl.jsx   – Zustände an- und abwählen
 *   NeuerKaempfer.jsx  – einen Kämpfer von Hand eintragen
 *   arten.js           – Zustände, Farben und Namen der Arten
 */
import { encounterApi } from '../lib/api.js';
import { blattWurf } from '../lib/wuerfeln.js';
import { useAuth } from '../lib/auth.jsx';
import { useCharaktere, useKampf } from '../lib/daten.js';
import { IconMinus, IconSwords, IconTrash, IconUsers } from './icons.jsx';
import NeuerKaempfer from './initiative/NeuerKaempfer.jsx';
import Zeile from './initiative/Zeile.jsx';

/**
 * Die Initiativliste – am Spieltisch schmal („tafel“), auf dem Board der
 * Spielleitung mit allen Griffen („voll“).
 */
export default function Initiative({ variant = 'tafel' }) {
  const { isDm } = useAuth();
  const { kampf } = useKampf();
  const { meine } = useCharaktere();
  const voll = variant === 'voll';

  // Die eigene Zeile im Kampf – falls die Runde schon geholt wurde.
  const eigene = kampf.combatants.find((c) => c.characterId && meine.some((m) => m.id === c.characterId));
  const eigenerCharakter = eigene && meine.find((m) => m.id === eigene.characterId);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-2 font-display text-[13px] tracking-[0.12em] text-rubric uppercase">
          <IconSwords size={16} /> Runde {kampf.round}
        </span>
        <span className="h-px flex-1 bg-rule" />
        {isDm && (
          <div className="flex items-center gap-1">
            <button onClick={() => encounterApi.prevTurn()} className="btn-plate flex h-11 w-11 items-center justify-center" aria-label="Zug zurück">
              <IconMinus size={16} />
            </button>
            <button onClick={() => encounterApi.nextTurn()} className="btn btn-seal px-4">
              Weiter
            </button>
          </div>
        )}
      </div>

      {/* Am Anfang jedes Kampfes würfelt die ganze Runde – jede und jeder
          trägt den eigenen Wurf selbst ein. */}
      {!isDm && eigene && (
        <button
          onClick={async () => {
            const wurf = await blattWurf('Initiative', eigenerCharakter?.initiative ?? 0);
            await encounterApi.setInitiative(eigene.id, wurf.total);
          }}
          className="btn btn-seal mb-3 w-full"
        >
          <IconSwords size={16} />
          Eigene Initiative würfeln
          {eigenerCharakter && ` (${eigenerCharakter.initiative >= 0 ? '+' : ''}${eigenerCharakter.initiative})`}
        </button>
      )}

      {isDm && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          <button onClick={() => encounterApi.addParty()} className="btn-plate flex min-h-11 items-center gap-1.5 px-3 text-[13px]">
            <IconUsers size={14} /> Runde holen
          </button>
          <button onClick={() => encounterApi.rollInitiative()} className="btn-plate flex min-h-11 items-center gap-1.5 px-3 text-[13px]">
            Initiative würfeln
          </button>
          <button
            onClick={() => confirm('Den Kampf beenden und die Liste räumen?') && encounterApi.reset()}
            className="flex min-h-11 items-center gap-1.5 border border-rule px-3 text-[13px] text-sepia hover:border-rubric hover:text-rubric"
          >
            <IconTrash size={14} /> Kampf beenden
          </button>
        </div>
      )}

      {kampf.combatants.length === 0 ? (
        <p className="text-sepia italic">
          {isDm ? 'Noch tritt niemand an. Hol die Runde oder trag Monster ein.' : 'Gerade wird nicht gekämpft.'}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {kampf.combatants.map((c) => (
            <Zeile key={c.id} combatant={c} aktiv={c.id === kampf.activeCombatantId} isDm={isDm} voll={voll} />
          ))}
        </ul>
      )}

      {isDm && voll && (
        <div className="mt-3">
          <NeuerKaempfer />
        </div>
      )}
    </div>
  );
}
