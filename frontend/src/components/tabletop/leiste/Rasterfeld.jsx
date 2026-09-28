/**
 * Das ausklappbare Rasterfeld: Wie liegt das Gitter auf dieser Karte?
 *
 * Alles hier gehört der Szene und wird sofort gespeichert – jede Eingabe ist
 * ein kleiner Serveraufruf, es gibt keinen „Speichern“-Knopf. Beim Ausrichten
 * des Rasters ist das genau richtig: Man dreht an der Feldgröße und sieht die
 * Linien mitwandern.
 *
 * Zwei Zahlen wollen dabei auseinandergehalten sein:
 *
 *   *Feldgröße* ist ein Bildmaß – wie viele Bildpunkte ein Feld breit ist.
 *     Daran stellt man das Gitter auf die Karte.
 *   *Weite je Feld* ist ein Spielmaß – wofür ein Feld im Spiel steht, in Fuß
 *     oder Metern. Daran rechnet das Lineal.
 */
import { useMemo } from 'react';
import { mapsApi, scenesApi } from '../../../lib/api.js';
import { EINHEIT, rasterBereich, weite } from '../../../lib/rasterkarte.js';
import { IconCandle, IconCheck, IconFog } from '../../icons.jsx';
import Knopf from './Knopf.jsx';

export default function Rasterfeld({ scene, tokens, kartenLaden, onChanged, setFehler }) {
  // Wie groß ist diese Karte im Spiel? Aus dem Raster, nicht aus dem Bildmaß.
  const masse = useMemo(() => {
    if (!scene) return { spalten: 0, zeilen: 0, breite: 0, tiefe: 0 };
    const { cols, rows } = rasterBereich(scene);
    const rund = (wert) => (Number.isInteger(wert) ? wert : Math.round(wert * 10) / 10);
    return { spalten: cols, zeilen: rows, breite: rund(weite(scene, cols)), tiefe: rund(weite(scene, rows)) };
  }, [scene]);

  async function rasterAendern(feld, wert) {
    await scenesApi.update(scene.id, { [feld]: wert });
    onChanged?.();
  }

  return (
    <div className="flex flex-wrap items-end gap-4 border-t border-dashed border-rule px-3 py-2.5">
      {[
        ['Feldgröße', 'gridSize', scene.gridSize, 10, 400],
        ['Versatz →', 'gridOffsetX', scene.gridOffsetX, -400, 400],
        ['Versatz ↓', 'gridOffsetY', scene.gridOffsetY, -400, 400],
      ].map(([label, feld, wert, min, max]) => (
        <label key={feld} className="block">
          <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
            {label}
          </span>
          <input
            type="number"
            value={wert}
            min={min}
            max={max}
            onChange={(e) => rasterAendern(feld, Number(e.target.value) || 0)}
            className="field-box w-24 font-display"
          />
        </label>
      ))}
      <Knopf aktiv={scene.gridVisible} onClick={() => rasterAendern('gridVisible', !scene.gridVisible)}>
        <IconCheck size={13} /> Linien zeigen
      </Knopf>
      <Knopf aktiv={scene.fogEnabled} onClick={() => rasterAendern('fogEnabled', !scene.fogEnabled)}>
        <IconFog size={13} /> Nebel benutzen
      </Knopf>
      <Knopf
        aktiv={scene.dark}
        onClick={() => rasterAendern('dark', !scene.dark)}
        title="In einer dunklen Szene sieht jeder nur so weit, wie Licht und Dunkelsicht reichen"
      >
        <IconCandle size={13} /> Dunkle Szene
      </Knopf>
      <label className="block">
        <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
          Sichtweite hier
        </span>
        <input
          type="number"
          min={0}
          step={5}
          value={scene.sight}
          onChange={(e) => rasterAendern('sight', Number(e.target.value) || 0)}
          className="field-box w-24 font-display"
          title="Obere Grenze für alle in dieser Szene, in Fuß. 0 = so weit das Blatt hergibt."
        />
      </label>
      {scene.mapId && (
        <Knopf
          onClick={async () => {
            await mapsApi.update(scene.mapId, {
              gridSize: scene.gridSize,
              gridOffsetX: scene.gridOffsetX,
              gridOffsetY: scene.gridOffsetY,
            });
            await kartenLaden();
            setFehler('');
          }}
          title="Diese Ausrichtung für alle künftigen Szenen aus dieser Karte übernehmen"
        >
          <IconCheck size={13} /> Raster in der Bibliothek merken
        </Knopf>
      )}
      <label className="block">
        <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
          Ein Feld ist
        </span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0.1}
            step={0.5}
            value={scene.scale}
            onChange={(e) => rasterAendern('scale', Number(e.target.value) || 1)}
            className="field-box w-20 font-display"
            aria-label="Weite je Feld"
          />
          <select
            value={scene.unit}
            onChange={(e) => rasterAendern('unit', e.target.value)}
            className="field-box font-display"
            aria-label="Einheit"
          >
            <option value="fuss">Fuß</option>
            <option value="meter">Meter</option>
          </select>
        </div>
      </label>

      <p className="text-[15px] text-sepia italic">
        {masse.spalten} × {masse.zeilen} Felder – das sind{' '}
        <span className="text-ink">
          {masse.breite} × {masse.tiefe} {EINHEIT[scene.unit] ?? 'Fuß'}
        </span>
        . Die Feldgröße so einstellen, dass die Linien auf der Karte liegen; die Weite je Feld sagt,
        wofür ein Feld im Spiel steht. Die <span className="text-ink">Sichtweite hier</span> deckelt für
        alle, was ihr Blatt hergibt – für Nebelbänke, Schneetreiben oder dichten Wald. 0 hebt den Deckel.
      </p>

      {/* Dunkel ohne jedes Licht heißt: Die Runde sieht ihr eigenes Feld und
          sonst nichts. Das ist richtig, aber überraschend – also sagen wir es
          dort, wo es passiert. */}
      {scene.dark && !tokens.some((t) => (t.lightBright ?? 0) + (t.lightDim ?? 0) > 0) && (
        <p className="w-full border-l-[3px] border-rubric bg-rubric/10 px-3.5 py-2 text-[15px] text-sepia">
          Es ist dunkel, und niemand trägt ein Licht. Wer keine Dunkelsicht hat, sieht gerade nur das
          Feld, auf dem er steht. Eine Figur anklicken und ihr unter{' '}
          <span className="font-display text-ink">Lichtquelle</span> eine Fackel geben – das erweitert
          ihr Sichtfeld auch über ihre eingetragene Sichtweite hinaus.
        </p>
      )}
    </div>
  );
}
