import { useCallback, useEffect, useMemo, useState } from 'react';
import { notesApi } from '../../lib/api.js';
import { IconEye, IconEyeOff, IconPlus, IconSearch, IconTrash } from '../icons.jsx';

/** Notizen der Spielleitung – wahlweise geheim oder als Handzettel für alle. */
export default function Notes() {
  const [notizen, setNotizen] = useState([]);
  const [suche, setSuche] = useState('');
  const [entwurf, setEntwurf] = useState(null);

  const laden = useCallback(() => {
    notesApi.list().then(setNotizen).catch(() => {});
  }, []);

  useEffect(() => {
    laden();
  }, [laden]);

  const treffer = useMemo(() => {
    const begriff = suche.trim().toLowerCase();
    if (!begriff) return notizen;
    return notizen.filter(
      (n) =>
        n.title.toLowerCase().includes(begriff) ||
        n.content.toLowerCase().includes(begriff) ||
        n.tags.some((t) => t.toLowerCase().includes(begriff))
    );
  }, [notizen, suche]);

  async function speichern(notiz) {
    const nutzlast = {
      title: notiz.title,
      content: notiz.content,
      visibility: notiz.visibility,
      tags: typeof notiz.tags === 'string' ? notiz.tags.split(',').map((t) => t.trim()).filter(Boolean) : notiz.tags,
    };
    if (notiz.id) await notesApi.update(notiz.id, nutzlast);
    else await notesApi.create(nutzlast);
    setEntwurf(null);
    laden();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex min-w-[12rem] flex-1 items-center gap-2.5 border border-rule bg-panel-soft px-3">
          <IconSearch size={16} className="text-faint" />
          <input
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="In den Notizen suchen"
            className="min-h-11 flex-1 bg-transparent text-ink outline-none"
          />
        </label>
        <button
          onClick={() => setEntwurf({ title: '', content: '', tags: [], visibility: 'sl' })}
          className="btn btn-seal"
        >
          <IconPlus size={16} /> Neue Notiz
        </button>
      </div>

      {entwurf && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!entwurf.title.trim()) return;
            speichern(entwurf);
          }}
          className="panel space-y-3 p-4"
        >
          <input
            value={entwurf.title}
            onChange={(e) => setEntwurf({ ...entwurf, title: e.target.value })}
            placeholder="Titel"
            className="field-box font-display text-lg"
          />
          <textarea
            value={entwurf.content}
            onChange={(e) => setEntwurf({ ...entwurf, content: e.target.value })}
            rows={8}
            placeholder="Was geschieht, wer wartet dort, was wissen die Helden noch nicht …"
            className="field-box resize-y leading-relaxed"
          />
          <input
            value={Array.isArray(entwurf.tags) ? entwurf.tags.join(', ') : entwurf.tags}
            onChange={(e) => setEntwurf({ ...entwurf, tags: e.target.value })}
            placeholder="Schlagworte, mit Komma getrennt"
            className="field-box"
          />

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                setEntwurf({ ...entwurf, visibility: entwurf.visibility === 'runde' ? 'sl' : 'runde' })
              }
              className={`btn ${entwurf.visibility === 'runde' ? 'btn-seal' : 'btn-plate'}`}
            >
              {entwurf.visibility === 'runde' ? <IconEye size={16} /> : <IconEyeOff size={16} />}
              {entwurf.visibility === 'runde' ? 'Handzettel für die Runde' : 'nur für die Spielleitung'}
            </button>
            <span className="flex-1" />
            <button type="submit" className="btn btn-seal">
              Speichern
            </button>
            <button type="button" onClick={() => setEntwurf(null)} className="btn btn-plate">
              Zurück
            </button>
          </div>
        </form>
      )}

      {treffer.length === 0 ? (
        <p className="text-sepia italic">Noch ist nichts vermerkt.</p>
      ) : (
        <ul className="space-y-2">
          {treffer.map((n) => (
            <li key={n.id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-2 font-display text-[17px] text-ink">
                    {n.title}
                    {n.visibility === 'runde' && (
                      <span className="flex items-center gap-1 border border-gold px-1.5 font-display text-[10px] tracking-[0.12em] text-gold uppercase">
                        <IconEye size={11} /> ausgeteilt
                      </span>
                    )}
                  </h3>
                  {n.tags.length > 0 && (
                    <p className="mt-1 flex flex-wrap gap-1">
                      {n.tags.map((t) => (
                        <span key={t} className="border border-rule px-1.5 text-[13px] text-faint">
                          {t}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() =>
                      notesApi
                        .update(n.id, { visibility: n.visibility === 'runde' ? 'sl' : 'runde' })
                        .then(laden)
                    }
                    className="btn-plate flex h-11 w-11 items-center justify-center"
                    title={n.visibility === 'runde' ? 'wieder einziehen' : 'an die Runde austeilen'}
                  >
                    {n.visibility === 'runde' ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                  <button onClick={() => setEntwurf(n)} className="btn-plate min-h-11 px-3 text-[13px]">
                    Bearbeiten
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`„${n.title}“ löschen?`)) return;
                      await notesApi.remove(n.id);
                      laden();
                    }}
                    className="flex h-11 w-11 items-center justify-center border border-rule text-sepia hover:border-rubric hover:text-rubric"
                    aria-label="Notiz löschen"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
              {n.content && <p className="mt-2 whitespace-pre-wrap text-sepia">{n.content}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
