import { IconPlus } from './icons.jsx';

function emptyRow(fields) {
  const row = { id: crypto.randomUUID() };
  fields.forEach((f) => {
    row[f.key] = f.type === 'number' ? 0 : '';
  });
  return row;
}

export default function RepeatingRows({
  items = [],
  onChange,
  fields,
  addLabel = 'Hinzufügen',
  emptyText = 'Noch nichts eingetragen.',
}) {
  function updateRow(id, key, value) {
    onChange(items.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  function removeRow(id) {
    onChange(items.filter((row) => row.id !== id));
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.length === 0 && <p className="text-sepia italic">{emptyText}</p>}

      {items.map((row) => (
        <div key={row.id} className="border border-rule bg-panel-soft/60 p-3.5">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {fields.map((field) => (
              <label key={field.key} className={field.wide ? 'w-full' : 'min-w-[7rem] flex-1'}>
                <span className="mb-0.5 block font-display text-[10px] tracking-[0.14em] text-faint uppercase">
                  {field.label}
                </span>
                {field.type === 'textarea' ? (
                  <textarea
                    value={row[field.key] ?? ''}
                    onChange={(e) => updateRow(row.id, field.key, e.target.value)}
                    rows={2}
                    className="field-box resize-y text-[16px] leading-relaxed"
                  />
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    inputMode={field.type === 'number' ? 'numeric' : undefined}
                    value={row[field.key] ?? ''}
                    onChange={(e) =>
                      updateRow(row.id, field.key, field.type === 'number' ? Number(e.target.value) || 0 : e.target.value)
                    }
                    className="field-line text-[17px]"
                  />
                )}
              </label>
            ))}
          </div>
          <button onClick={() => removeRow(row.id)} className="mt-2 min-h-9 text-[15px] text-rubric hover:underline">
            Entfernen
          </button>
        </div>
      ))}

      <button
        onClick={() => onChange([...items, emptyRow(fields)])}
        className="flex min-h-12 items-center justify-center gap-2 border border-dashed border-rule-strong font-display text-[13px] tracking-[0.1em] text-sepia uppercase hover:border-gold hover:text-rubric"
      >
        <IconPlus size={15} />
        {addLabel}
      </button>
    </div>
  );
}
