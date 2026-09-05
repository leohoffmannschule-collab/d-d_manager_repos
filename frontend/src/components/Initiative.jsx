import { useState } from 'react';
import { encounterApi } from '../lib/api.js';
import { blattWurf } from '../lib/wuerfeln.js';
import { useAuth } from '../lib/auth.jsx';
import { useCharaktere, useKampf } from '../lib/daten.jsx';
import { ZUSTAND, benenne } from '../lib/beschriftung.js';
import {
  IconChevronRight,
  IconEye,
  IconEyeOff,
  IconHeart,
  IconMinus,
  IconPlus,
  IconSwords,
  IconTrash,
  IconUsers,
} from './icons.jsx';

export const ZUSTAENDE = [
  'Bezaubert',
  'Betäubt',
  'Blind',
  'Bewusstlos',
  'Erschöpft',
  'Festgesetzt',
  'Gelähmt',
  'Gepackt',
  'Handlungsunfähig',
  'Liegend',
  'Taub',
  'Verängstigt',
  'Vergiftet',
  'Versteinert',
  'Unsichtbar',
];

const TYP_FARBE = {
  pc: 'border-l-[#2d4f7c]',
  npc: 'border-l-[#2f6b4f]',
  monster: 'border-l-rubric',
};

const TYP_NAME = { pc: 'Held', npc: 'NSC', monster: 'Monster' };

/** Ein Balken für die Trefferpunkte, wo Zahlen zu viel verraten würden. */
function Lebensbalken({ hp, maxHp, status }) {
  if (hp == null) {
    return <span className="text-[15px] text-faint italic">{benenne(ZUSTAND, status, '—')}</span>;
  }
  const anteil = maxHp ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex h-2 w-12 overflow-hidden border border-rule-strong bg-panel-soft">
        <span
          className="h-full"
          style={{ width: `${anteil * 100}%`, backgroundColor: anteil > 0.5 ? '#2f6b4f' : '#9a2b22' }}
        />
      </span>
      <span className="font-display text-[14px] text-sepia">
        {hp}
        {maxHp ? `/${maxHp}` : ''}
      </span>
    </span>
  );
}

function Wunden({ combatant, onFertig }) {
  const [wert, setWert] = useState('');

  async function anwenden(vorzeichen) {
    const zahl = Number(wert);
    if (!Number.isFinite(zahl) || zahl === 0) return;
    await encounterApi.damage(combatant.id, zahl * vorzeichen);
    setWert('');
    onFertig?.();
  }

  return (
    <div className="mt-2 flex items-center gap-1.5">
      <input
        type="number"
        inputMode="numeric"
        value={wert}
        onChange={(e) => setWert(e.target.value)}
        placeholder="Punkte"
        className="h-11 w-20 border border-rule bg-panel-soft px-2 text-center font-display text-ink"
      />
      <button onClick={() => anwenden(1)} className="btn-plate flex h-11 items-center gap-1.5 px-3 text-[13px]">
        <IconSwords size={14} /> Schaden
      </button>
      <button onClick={() => anwenden(-1)} className="btn-plate flex h-11 items-center gap-1.5 px-3 text-[13px]">
        <IconHeart size={14} /> Heilung
      </button>
    </div>
  );
}

function Zustandswahl({ combatant, onFertig }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {ZUSTAENDE.map((zustand) => {
        const an = combatant.conditions.includes(zustand);
        return (
          <button
            key={zustand}
            onClick={async () => {
              const naechste = an
                ? combatant.conditions.filter((c) => c !== zustand)
                : [...combatant.conditions, zustand];
              await encounterApi.update(combatant.id, { conditions: naechste });
              onFertig?.();
            }}
            className={`min-h-9 border px-2 py-1 text-[14px] ${
              an ? 'border-rubric bg-rubric/15 text-rubric' : 'border-rule text-sepia'
            }`}
          >
            {zustand}
          </button>
        );
      })}
    </div>
  );
}

function Zeile({ combatant, aktiv, isDm, voll }) {
  const [offen, setOffen] = useState(null);

  return (
    <li
      className={`border border-rule border-l-[3px] bg-panel px-3 py-2.5 ${TYP_FARBE[combatant.type]} ${
        aktiv ? 'ring-1 ring-gold' : ''
      } ${combatant.hidden ? 'opacity-70' : ''}`}
    >
      <div className="flex items-center gap-3">
        {isDm && voll ? (
          <input
            type="number"
            inputMode="numeric"
            value={combatant.initiative}
            onChange={(e) => encounterApi.update(combatant.id, { initiative: Number(e.target.value) || 0 })}
            className="h-11 w-14 shrink-0 border border-rule bg-panel-soft text-center font-display text-lg text-ink"
            aria-label="Initiative"
          />
        ) : (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center border font-display text-[15px] font-semibold ${
              aktiv ? 'border-gold bg-gold/20 text-ink' : 'border-rule text-sepia'
            }`}
          >
            {combatant.initiative}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate">
            {aktiv && <IconChevronRight size={15} className="shrink-0 text-gold" />}
            <span className={`truncate ${aktiv ? 'font-semibold text-ink' : 'text-ink'}`}>{combatant.name}</span>
            {combatant.hidden && <IconEyeOff size={13} className="shrink-0 text-rubric" title="für die Runde verborgen" />}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-display text-[10px] tracking-[0.14em] text-faint uppercase">
              {TYP_NAME[combatant.type]}
            </span>
            <Lebensbalken hp={combatant.hp} maxHp={combatant.maxHp} status={combatant.status} />
            {combatant.ac != null && <span className="text-[14px] text-sepia">RK {combatant.ac}</span>}
          </div>
          {combatant.conditions.length > 0 && (
            <p className="mt-1 flex flex-wrap gap-1">
              {combatant.conditions.map((c) => (
                <span key={c} className="border border-rubric/50 bg-rubric/10 px-1.5 text-[13px] text-rubric">
                  {c}
                </span>
              ))}
            </p>
          )}
        </div>

        {isDm && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => setOffen(offen === 'wunden' ? null : 'wunden')}
              className="btn-plate flex h-11 w-11 items-center justify-center"
              aria-label="Schaden oder Heilung"
              title="Schaden oder Heilung"
            >
              <IconHeart size={16} />
            </button>
            <button
              onClick={() => setOffen(offen === 'zustand' ? null : 'zustand')}
              className="btn-plate flex h-11 w-11 items-center justify-center"
              aria-label="Zustände"
              title="Zustände"
            >
              <IconPlus size={16} />
            </button>
            {voll && (
              <>
                <button
                  onClick={() => encounterApi.update(combatant.id, { hidden: !combatant.hidden })}
                  className="btn-plate flex h-11 w-11 items-center justify-center"
                  aria-label={combatant.hidden ? 'der Runde zeigen' : 'vor der Runde verbergen'}
                  title={combatant.hidden ? 'der Runde zeigen' : 'vor der Runde verbergen'}
                >
                  {combatant.hidden ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
                <button
                  onClick={() => encounterApi.remove(combatant.id)}
                  className="flex h-11 w-11 items-center justify-center border border-rule text-sepia hover:border-rubric hover:text-rubric"
                  aria-label="aus dem Kampf nehmen"
                >
                  <IconTrash size={16} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {offen === 'wunden' && <Wunden combatant={combatant} onFertig={() => setOffen(null)} />}
      {offen === 'zustand' && <Zustandswahl combatant={combatant} />}
    </li>
  );
}

function NeuerKaempfer({ onFertig }) {
  const [werte, setWerte] = useState({ name: '', type: 'monster', initiative: 0, hp: 0, ac: 10 });
  const setzen = (feld) => (e) =>
    setWerte((w) => ({ ...w, [feld]: feld === 'name' || feld === 'type' ? e.target.value : Number(e.target.value) || 0 }));

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!werte.name.trim()) return;
        await encounterApi.add({ ...werte, maxHp: werte.hp });
        setWerte({ name: '', type: 'monster', initiative: 0, hp: 0, ac: 10 });
        onFertig?.();
      }}
      className="flex flex-wrap items-end gap-2.5 border border-dashed border-rule-strong p-3"
    >
      <label className="min-w-[10rem] flex-1">
        <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">Name</span>
        <input value={werte.name} onChange={setzen('name')} className="field-box" placeholder="Wer tritt an?" />
      </label>
      <label>
        <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">Art</span>
        <select value={werte.type} onChange={setzen('type')} className="field-box w-28">
          <option value="monster">Monster</option>
          <option value="npc">NSC</option>
          <option value="pc">Held</option>
        </select>
      </label>
      {[
        ['Init', 'initiative', 16],
        ['TP', 'hp', 16],
        ['RK', 'ac', 16],
      ].map(([label, feld]) => (
        <label key={feld}>
          <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">{label}</span>
          <input
            type="number"
            inputMode="numeric"
            value={werte[feld]}
            onChange={setzen(feld)}
            className="field-box w-20 font-display"
          />
        </label>
      ))}
      <button type="submit" className="btn btn-seal">
        <IconPlus size={16} /> Eintragen
      </button>
    </form>
  );
}

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
