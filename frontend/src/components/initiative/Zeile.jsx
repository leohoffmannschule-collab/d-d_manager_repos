/**
 * Eine Zeile der Kampfliste. Aufgeklappt zeigt sie die Werkzeuge darunter –
 * Schaden, Zustände, Initiative.
 */
import { useState } from 'react';
import { encounterApi } from '../../lib/api.js';
import { formatModifier } from '../../lib/dnd5e.js';
import { IconChevronRight, IconEye, IconEyeOff, IconHeart, IconPlus, IconTrash } from '../icons.jsx';
import { TYP_FARBE, TYP_NAME } from './arten.js';
import Lebensbalken from './Lebensbalken.jsx';
import Wunden from './Wunden.jsx';
import Zustandswahl from './Zustandswahl.jsx';

export default function Zeile({ combatant, aktiv, isDm, voll }) {
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
            {/* Nur die Spielleitung bekommt den Bonus der Gegner geschickt. */}
            {combatant.type !== 'pc' && combatant.initiativeBonus != null && combatant.initiativeBonus !== 0 && (
              <span className="text-[14px] text-sepia" title="Initiativebonus – wird beim Würfeln hinzugezählt">
                Init {formatModifier(combatant.initiativeBonus)}
              </span>
            )}
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
