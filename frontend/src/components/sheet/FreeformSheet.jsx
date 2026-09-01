import { Card, TextAreaField } from '../ui.jsx';
import { IconPlus } from '../icons.jsx';

export default function FreeformSheet({ data, update }) {
  function updateSection(id, patch) {
    update('sections', data.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title="Kurzbeschreibung">
        <TextAreaField value={data.summary} onChange={(v) => update('summary', v)} rows={3} />
      </Card>

      {data.sections.map((section) => (
        <section key={section.id} className="panel p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-3 border-b border-rule pb-2">
            <input
              value={section.title}
              onChange={(e) => updateSection(section.id, { title: e.target.value })}
              className="flex-1 border-0 bg-transparent p-0 font-display text-[15px] font-semibold tracking-[0.14em] text-rubric uppercase focus:outline-none"
              aria-label="Überschrift des Abschnitts"
            />
            <button
              onClick={() => update('sections', data.sections.filter((s) => s.id !== section.id))}
              className="min-h-9 shrink-0 text-[15px] text-rubric hover:underline"
            >
              Entfernen
            </button>
          </div>
          <TextAreaField value={section.content} onChange={(v) => updateSection(section.id, { content: v })} rows={6} />
        </section>
      ))}

      <button
        onClick={() =>
          update('sections', [...data.sections, { id: crypto.randomUUID(), title: 'Neuer Abschnitt', content: '' }])
        }
        className="flex min-h-12 items-center justify-center gap-2 border border-dashed border-rule-strong font-display text-[13px] tracking-[0.1em] text-sepia uppercase hover:border-gold hover:text-rubric"
      >
        <IconPlus size={15} />
        Abschnitt hinzufügen
      </button>
    </div>
  );
}
