/**
 * Das aufgeschlagene Blatt einer Karte.
 *
 * Alles, was einmal eingestellt wird und dann für jede Szene aus dieser Karte
 * gilt: Name, Schlagworte, Notizen, das Raster und der Klangteppich, der beim
 * Auflegen anspringen soll.
 *
 * Gearbeitet wird an einem *Entwurf* – einer Kopie der Karte im Zustand
 * dieses Bauteils. Erst „Sichern“ schickt ihn zum Server. Dadurch läuft die
 * Rastervorschau beim Schieben der Regler mit, ohne dass jede Zahl einzeln
 * über die Leitung geht.
 */
import { useMemo, useState } from 'react';
import { mapsApi } from '../../../lib/api.js';
import { useKlangbibliothek } from '../../../lib/daten.js';
import { EINHEIT, rasterBereich, weite } from '../../../lib/rasterkarte.js';
import { Rubric } from '../../ui.jsx';
import { IconCheck } from '../../icons.jsx';
import Rastervorschau from './Rastervorschau.jsx';

export default function Kartenblatt({ karte, onGespeichert, onSchliessen, onMelden }) {
  const { ambienten } = useKlangbibliothek();
  const [entwurf, setEntwurf] = useState({
    name: karte.name,
    tags: karte.tags.join(', '),
    notes: karte.notes,
    gridSize: karte.gridSize,
    gridOffsetX: karte.gridOffsetX,
    gridOffsetY: karte.gridOffsetY,
    unit: karte.unit ?? 'fuss',
    scale: karte.scale ?? 5,
    ambienceId: karte.ambienceId ?? '',
  });
  const [laedt, setLaedt] = useState(false);

  const setzen = (feld) => (wert) => setEntwurf((v) => ({ ...v, [feld]: wert }));

  // Wie groß ist diese Karte im Spiel? Aus dem Raster des Entwurfs gerechnet,
  // damit die Zahl schon beim Schieben der Regler mitläuft.
  const feldMasse = useMemo(() => {
    const probe = { ...karte, ...entwurf };
    const { cols, rows } = rasterBereich(probe);
    const rund = (wert) => (Number.isInteger(wert) ? wert : Math.round(wert * 10) / 10);
    return { spalten: cols, zeilen: rows, breite: rund(weite(probe, cols)), tiefe: rund(weite(probe, rows)) };
  }, [karte, entwurf]);

  async function speichern() {
    setLaedt(true);
    try {
      await mapsApi.update(karte.id, {
        name: entwurf.name,
        tags: entwurf.tags.split(',').map((t) => t.trim()).filter(Boolean),
        notes: entwurf.notes,
        gridSize: entwurf.gridSize,
        gridOffsetX: entwurf.gridOffsetX,
        gridOffsetY: entwurf.gridOffsetY,
        unit: entwurf.unit,
        scale: entwurf.scale,
        ambienceId: entwurf.ambienceId || null,
      });
      await onGespeichert();
      onMelden('Die Karte ist gesichert.');
    } catch (err) {
      onMelden(err.message);
    } finally {
      setLaedt(false);
    }
  }

  return (
    <div className="panel space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <Rubric>Karte</Rubric>
        <span className="flex-1" />
        <button onClick={onSchliessen} className="btn-plate min-h-11 px-3 text-[13px]">
          Zuklappen
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Rastervorschau karte={karte} entwurf={entwurf} />

        <div className="space-y-3">
          <input
            value={entwurf.name}
            onChange={(e) => setzen('name')(e.target.value)}
            placeholder="Name der Karte"
            className="field-box font-display text-lg"
          />
          <input
            value={entwurf.tags}
            onChange={(e) => setzen('tags')(e.target.value)}
            placeholder="Schlagworte, z. B. Wald, Nacht, Hinterhalt"
            className="field-box"
          />
          <textarea
            value={entwurf.notes}
            onChange={(e) => setzen('notes')(e.target.value)}
            rows={3}
            placeholder="Woran soll ich mich erinnern, wenn diese Karte wieder dran ist?"
            className="field-box resize-y leading-relaxed"
          />

          <div className="flex flex-wrap gap-3 border-t border-dashed border-rule pt-3">
            {[
              ['Feldgröße', 'gridSize', 10, 500],
              ['Versatz →', 'gridOffsetX', -500, 500],
              ['Versatz ↓', 'gridOffsetY', -500, 500],
            ].map(([label, feld, min, max]) => (
              <label key={feld} className="block">
                <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
                  {label}
                </span>
                <input
                  type="number"
                  min={min}
                  max={max}
                  value={entwurf[feld]}
                  onChange={(e) => setzen(feld)(Number(e.target.value) || 0)}
                  className="field-box w-24 font-display"
                />
              </label>
            ))}
          </div>
          <label className="block">
            <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
              Ein Feld ist
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0.1}
                step={0.5}
                value={entwurf.scale}
                onChange={(e) => setzen('scale')(Number(e.target.value) || 1)}
                className="field-box w-20 font-display"
                aria-label="Weite je Feld"
              />
              <select
                value={entwurf.unit}
                onChange={(e) => setzen('unit')(e.target.value)}
                className="field-box font-display"
                aria-label="Einheit"
              >
                <option value="fuss">Fuß</option>
                <option value="meter">Meter</option>
              </select>
            </div>
          </label>

          <p className="text-[15px] text-sepia italic">
            {feldMasse.spalten} × {feldMasse.zeilen} Felder, also{' '}
            <span className="text-ink">
              {feldMasse.breite} × {feldMasse.tiefe} {EINHEIT[entwurf.unit] ?? 'Fuß'}
            </span>
            . Einmal hier ausgerichtet, kommt jede Szene aus dieser Karte schon passend auf den Tisch.
          </p>

          {ambienten.length > 0 && (
            <label className="block border-t border-dashed border-rule pt-3">
              <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
                Ambiente
              </span>
              <select
                value={entwurf.ambienceId}
                onChange={(e) => setzen('ambienceId')(e.target.value)}
                className="field-box w-full"
              >
                <option value="">— keine —</option>
                {ambienten.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[14px] text-faint italic">
                Wer diese Karte auflegt, legt zugleich diese Musik auf.
              </span>
            </label>
          )}

          <button onClick={speichern} disabled={laedt} className="btn btn-seal disabled:opacity-60">
            <IconCheck size={16} /> {laedt ? 'sichert …' : 'Sichern'}
          </button>
        </div>
      </div>
    </div>
  );
}
