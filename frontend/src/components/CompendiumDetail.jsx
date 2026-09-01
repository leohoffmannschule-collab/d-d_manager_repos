const SKIP_KEYS = new Set(['index', 'url', 'updated_at', 'name', 'desc', '_id']);

function humanizeKey(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderValue(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (value.every((v) => typeof v === 'string' || typeof v === 'number')) {
      return value.join(', ');
    }
    if (value.every((v) => v && typeof v === 'object' && 'name' in v)) {
      return value.map((v) => v.name).join(', ');
    }
    return value.map((v) => renderValue(v)).filter(Boolean).join('; ');
  }
  if (typeof value === 'object') {
    if ('name' in value) return value.name;
    const parts = Object.entries(value)
      .map(([k, v]) => {
        const rendered = renderValue(v);
        return rendered ? `${humanizeKey(k)}: ${rendered}` : null;
      })
      .filter(Boolean);
    return parts.join(', ');
  }
  return null;
}

export default function CompendiumDetail({ item }) {
  if (!item) return null;

  const descParagraphs = Array.isArray(item.desc) ? item.desc : item.desc ? [item.desc] : [];
  const entries = Object.entries(item).filter(([key, value]) => {
    if (SKIP_KEYS.has(key)) return false;
    const rendered = renderValue(value);
    return rendered !== null && rendered !== '';
  });

  return (
    <div>
      <h3 className="mb-3 font-display text-xl text-gold-400">{item.name}</h3>

      {descParagraphs.length > 0 && (
        <div className="mb-4 space-y-2 text-sm leading-relaxed text-parchment-100/80">
          {descParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      {item.higher_level && item.higher_level.length > 0 && (
        <div className="mb-4 rounded-lg bg-ink-800/60 p-3 text-sm text-parchment-100/70">
          <p className="mb-1 font-semibold text-gold-400/90">Auf höheren Graden</p>
          {item.higher_level.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="border-b border-ink-800 pb-1.5">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-parchment-100/40">{humanizeKey(key)}</dt>
            <dd className="text-parchment-50">{renderValue(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
