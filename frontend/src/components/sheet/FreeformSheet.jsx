import { Card, TextAreaField, TextField } from '../ui.jsx';

export default function FreeformSheet({ data, update }) {
  function updateSection(id, patch) {
    update('sections', data.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeSection(id) {
    update('sections', data.sections.filter((s) => s.id !== id));
  }

  function addSection() {
    update('sections', [...data.sections, { id: crypto.randomUUID(), title: 'Neuer Abschnitt', content: '' }]);
  }

  return (
    <div className="space-y-4">
      <Card title="Kurzbeschreibung">
        <TextAreaField value={data.summary} onChange={(v) => update('summary', v)} rows={3} />
      </Card>

      {data.sections.map((section) => (
        <Card key={section.id}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <TextField value={section.title} onChange={(v) => updateSection(section.id, { title: v })} className="flex-1" />
            <button onClick={() => removeSection(section.id)} className="shrink-0 text-xs text-red-300/80 hover:underline">
              Entfernen
            </button>
          </div>
          <TextAreaField value={section.content} onChange={(v) => updateSection(section.id, { content: v })} rows={5} />
        </Card>
      ))}

      <button
        onClick={addSection}
        className="w-full rounded-xl border border-dashed border-ink-700 py-3 text-sm text-parchment-100/60 hover:border-gold-600/60 hover:text-gold-400"
      >
        + Abschnitt hinzufügen
      </button>
    </div>
  );
}
