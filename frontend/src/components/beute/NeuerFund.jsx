/**
 * Einen Fund in die Kiste legen: Name und Anzahl. Eintragen darf jede und
 * jeder – was die Runde findet, gehört erst einmal allen.
 */
import { useState } from 'react';
import { stashApi } from '../../lib/api.js';
import { IconPlus } from '../icons.jsx';

export default function NeuerFund({ onEingetragen }) {
  const [neu, setNeu] = useState({ name: '', qty: 1 });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!neu.name.trim()) return;
        await stashApi.addItem(neu);
        setNeu({ name: '', qty: 1 }); onEingetragen();
      }}
      className="mt-2.5 flex gap-2"
    >
      <input
        value={neu.name}
        onChange={(e) => setNeu((n) => ({ ...n, name: e.target.value }))}
        placeholder="Was wurde gefunden?"
        className="field-box flex-1"
      />
      <input
        type="number"
        min={1}
        value={neu.qty}
        onChange={(e) => setNeu((n) => ({ ...n, qty: Math.max(1, Number(e.target.value) || 1) }))}
        className="field-box w-20 text-center font-display"
        aria-label="Anzahl"
      />
      <button type="submit" className="btn btn-seal px-4">
        <IconPlus size={16} />
      </button>
    </form>
  );
}
