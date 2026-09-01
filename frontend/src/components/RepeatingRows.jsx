function emptyRow(fields) {
  const row = { id: crypto.randomUUID() };
  fields.forEach((f) => {
    row[f.key] = f.type === 'number' ? 0 : '';
  });
  return row;
}

export default function RepeatingRows({ items = [], onChange, fields, addLabel = '+ Hinzufügen', emptyText = 'Noch nichts eingetragen.' }) {
  function updateRow(id, key, value) {
    onChange(items.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  function removeRow(id) {
    onChange(items.filter((row) => row.id !== id));
  }

  function addRow() {
    onChange([...items, emptyRow(fields)]);
  }

  return (
    <div className="space-y-2">
      {items.length === 0 && <p className="text-sm text-parchment-100/40">{emptyText}</p>}
      {items.map((row) => (
        <div key={row.id} className="rounded-xl border border-ink-800 bg-ink-800/40 p-3">
          <div className="mb-2 flex flex-wrap gap-2">
            {fields.map((field) => (
              <label key={field.key} className={field.wide ? 'w-full' : 'flex-1 min-w-[6rem]'}>
                <span className="mb-1 block text-[11px] font-medium text-parchment-100/50">{field.label}</span>
                {field.type === 'textarea' ? (
                  <textarea
                    value={row[field.key] ?? ''}
                    onChange={(e) => updateRow(row.id, field.key, e.target.value)}
                    rows={2}
                    className="w-full resize-y rounded-lg border border-ink-700 bg-ink-900 px-2 py-1.5 text-sm text-parchment-50 focus:border-gold-500 focus:outline-none"
                  />
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    inputMode={field.type === 'number' ? 'numeric' : undefined}
                    value={row[field.key] ?? ''}
                    onChange={(e) =>
                      updateRow(row.id, field.key, field.type === 'number' ? Number(e.target.value) || 0 : e.target.value)
                    }
                    className="w-full rounded-lg border border-ink-700 bg-ink-900 px-2 py-1.5 text-sm text-parchment-50 focus:border-gold-500 focus:outline-none"
                  />
                )}
              </label>
            ))}
          </div>
          <button onClick={() => removeRow(row.id)} className="text-xs text-red-300/80 hover:underline">
            Entfernen
          </button>
        </div>
      ))}
      <button onClick={addRow} className="w-full rounded-lg border border-dashed border-ink-700 py-2 text-sm text-parchment-100/60 hover:border-gold-600/60 hover:text-gold-400">
        {addLabel}
      </button>
    </div>
  );
}
