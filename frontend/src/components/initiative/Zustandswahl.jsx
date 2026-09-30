/** Zustände an- und abwählen. Ein Klick schaltet um, mehr ist es nicht. */
import { encounterApi } from '../../lib/api.js';
import { ZUSTAENDE } from './arten.js';

export default function Zustandswahl({ combatant, onFertig }) {
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
