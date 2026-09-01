import { Fleuron } from './icons.jsx';

const SKIP_KEYS = new Set(['index', 'url', 'updated_at', 'name', 'desc', '_id']);

function humanizeKey(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
    return Object.entries(value)
      .map(([k, v]) => {
        const rendered = renderValue(v);
        return rendered ? `${humanizeKey(k)}: ${rendered}` : null;
      })
      .filter(Boolean)
      .join(', ');
  }
  return null;
}

export default function CompendiumDetail({ item }) {
  if (!item) return null;

  const name = item.name ?? '';
  const initial = name.charAt(0);
  const rest = name.slice(1);
  const descParagraphs = Array.isArray(item.desc) ? item.desc : item.desc ? [item.desc] : [];
  const entries = Object.entries(item).filter(([key, value]) => {
    if (SKIP_KEYS.has(key)) return false;
    const rendered = renderValue(value);
    return rendered !== null && rendered !== '';
  });

  return (
    <div className="flex flex-col gap-4">
      <h3 className="flex items-baseline">
        <span className="font-initial text-[42px] leading-none text-rubric">{initial}</span>
        <span className="font-display text-2xl font-semibold tracking-[0.03em] text-ink">{rest}</span>
      </h3>

      <div className="flex items-center gap-3 text-gold">
        <span className="h-px w-10 bg-gold" />
        <Fleuron size={13} />
        <span className="h-px flex-1 bg-gold" />
      </div>

      {descParagraphs.length > 0 && (
        <div className="flex flex-col gap-2 leading-relaxed text-ink">
          {descParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      {item.higher_level?.length > 0 && (
        <div className="border-l-[3px] border-gold bg-gold/15 px-4 py-3">
          <p className="mb-1 font-display text-[12px] font-semibold tracking-[0.14em] text-rubric uppercase">
            Auf höheren Graden
          </p>
          {item.higher_level.map((p, i) => (
            <p key={i} className="text-sepia">
              {p}
            </p>
          ))}
        </div>
      )}

      {entries.length > 0 && (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {entries.map(([key, value]) => (
            <div key={key} className="border-b border-dotted border-rule pb-1.5">
              <dt className="font-display text-[10px] tracking-[0.16em] text-faint uppercase">{humanizeKey(key)}</dt>
              <dd className="text-ink">{renderValue(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
