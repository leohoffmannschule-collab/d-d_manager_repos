/**
 * Schaden und Heilung an einem Kämpfer – ein Feld, zwei Knöpfe.
 *
 * Geschickt wird immer eine *Änderung*, nie der neue Stand: Der Server
 * rechnet und kümmert sich um temporäre Trefferpunkte und die Grenze bei
 * null. Zwei Leute, die gleichzeitig Schaden eintragen, überschreiben sich
 * so nicht gegenseitig.
 */
import { useState } from 'react';
import { encounterApi } from '../../lib/api.js';
import { IconHeart, IconSwords } from '../icons.jsx';

export default function Wunden({ combatant, onFertig }) {
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
