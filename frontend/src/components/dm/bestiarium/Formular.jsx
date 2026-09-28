/**
 * Das Formular für einen Eintrag – dasselbe zum Anlegen und zum Ändern.
 *
 * Gearbeitet wird an einer Kopie im Zustand dieses Bauteils; erst
 * „Speichern“ reicht sie nach oben. Abbrechen wirft sie weg, ohne dass
 * irgendwo etwas geschrieben wurde.
 */
import { useState } from 'react';
import { mediaApi } from '../../../lib/api.js';
import { Rubric } from '../../ui.jsx';
import { ATTRIBUTE, LEER } from './felder.js';

export default function Formular({ eintrag, onSpeichern, onAbbrechen }) {
  const [werte, setWerte] = useState(eintrag ?? LEER);
  const setzen = (feld, wert) => setWerte((w) => ({ ...w, [feld]: wert }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!werte.name.trim()) return;
        onSpeichern({ ...werte, tags: typeof werte.tags === 'string' ? werte.tags.split(',').map((t) => t.trim()).filter(Boolean) : werte.tags });
      }}
      className="panel space-y-3 p-4"
    >
      <Rubric>{eintrag ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}</Rubric>

      <div className="flex flex-wrap gap-3">
        <label className="min-w-[12rem] flex-1">
          <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">Name</span>
          <input value={werte.name} onChange={(e) => setzen('name', e.target.value)} className="field-box" />
        </label>
        <label>
          <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">Art</span>
          <select value={werte.category} onChange={(e) => setzen('category', e.target.value)} className="field-box w-32">
            <option value="monster">Monster</option>
            <option value="npc">NSC</option>
          </select>
        </label>
        {[
          ['RK', 'ac'],
          ['TP', 'hp'],
        ].map(([label, feld]) => (
          <label key={feld}>
            <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">{label}</span>
            <input
              type="number"
              value={werte[feld] ?? ''}
              onChange={(e) => setzen(feld, e.target.value)}
              className="field-box w-20 font-display"
            />
          </label>
        ))}
        <label className="min-w-[8rem] flex-1">
          <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">Bewegung</span>
          <input value={werte.speed} onChange={(e) => setzen('speed', e.target.value)} className="field-box" placeholder="30 Fuß" />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ATTRIBUTE.map(([feld, label]) => (
          <label key={feld}>
            <span className="mb-1 block text-center font-display text-[10px] tracking-[0.16em] text-faint uppercase">
              {label}
            </span>
            <input
              type="number"
              value={werte.stats?.[feld] ?? ''}
              onChange={(e) => setzen('stats', { ...werte.stats, [feld]: e.target.value })}
              className="field-box text-center font-display"
            />
          </label>
        ))}
      </div>

      {[
        ['Fähigkeiten', 'abilities', 3],
        ['Aktionen', 'actions', 4],
        ['Notizen', 'notes', 2],
      ].map(([label, feld, rows]) => (
        <label key={feld} className="block">
          <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">{label}</span>
          <textarea
            value={werte[feld]}
            rows={rows}
            onChange={(e) => setzen(feld, e.target.value)}
            className="field-box resize-y leading-relaxed"
          />
        </label>
      ))}

      <label className="block">
        <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
          Schlagworte, mit Komma getrennt
        </span>
        <input
          value={Array.isArray(werte.tags) ? werte.tags.join(', ') : werte.tags}
          onChange={(e) => setzen('tags', e.target.value)}
          className="field-box"
          placeholder="Wald, Untote"
        />
      </label>

      {werte.mediaId && (
        <div className="flex items-center gap-2 border-t border-dashed border-rule pt-3 text-sepia italic">
          <img src={mediaApi.url(werte.mediaId)} alt="" className="h-10 w-10 object-contain" />
          Dieser Eintrag hat noch eine Figur aus früheren Tagen; sie steht mit auf dem Spieltisch.
        </div>
      )}

      <div className="flex gap-2.5">
        <button type="submit" className="btn btn-seal">
          Aufnehmen
        </button>
        <button type="button" onClick={onAbbrechen} className="btn btn-plate">
          Zurück
        </button>
      </div>
    </form>
  );
}
