/**
 * Einen Kämpfer von Hand eintragen – für den Wachhund, den niemand
 * vorbereitet hat. Der gewöhnliche Weg führt über das Bestiarium oder eine
 * vorbereitete Begegnung.
 */
import { useState } from 'react';
import { encounterApi } from '../../lib/api.js';
import { IconPlus } from '../icons.jsx';

export default function NeuerKaempfer({ onFertig }) {
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
