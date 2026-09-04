import { useEffect, useRef, useState } from 'react';
import { mapsApi, mediaApi, scenesApi } from '../../lib/api.js';
import { useKarten, useSzenenListe } from '../../lib/daten.jsx';
import { bildUndVorschau } from '../../lib/bilder.js';
import {
  IconCheck,
  IconEye,
  IconFog,
  IconMap,
  IconPlus,
  IconSwords,
  IconTarget,
  IconTrash,
  IconUpload,
} from '../icons.jsx';

const WERKZEUGE = [
  { id: 'bewegen', label: 'Bewegen', Icon: IconMap, hinweis: 'Karte schieben, Figuren ziehen' },
  { id: 'nebel-auf', label: 'Aufdecken', Icon: IconEye, hinweis: 'Nebel wegwischen' },
  { id: 'nebel-zu', label: 'Verhüllen', Icon: IconFog, hinweis: 'Nebel zurückholen' },
  { id: 'messen', label: 'Messen', Icon: IconTarget, hinweis: 'Entfernung in Feldern' },
  { id: 'zeigen', label: 'Zeigen', Icon: IconTarget, hinweis: 'kurz aufleuchten lassen (auch Alt+Klick)' },
];

function Knopf({ aktiv, children, ...rest }) {
  return (
    <button
      {...rest}
      className={`flex min-h-11 items-center gap-1.5 border px-3 font-display text-[11px] tracking-[0.10em] uppercase ${
        aktiv ? 'border-gold bg-gold/20 text-ink' : 'border-rule text-sepia hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

/** Werkzeugleiste und Szenenverwaltung – nur für die Spielleitung. */
export default function SceneBar({ scene, laedtSzene, mode, onMode, onChanged, onFogAll, onTokensFromEncounter }) {
  const { szenen, laden } = useSzenenListe();
  const { karten, laden: kartenLaden } = useKarten();
  const [offen, setOffen] = useState(false);
  const entschieden = useRef(false);

  // Liegt noch nichts auf dem Tisch, steht die Szenenlade gleich offen – sonst
  // sucht man beim ersten Mal nach dem Weg zur ersten Karte. Erst nach dem
  // Laden entscheiden: solange geholt wird, ist `scene` noch leer, und die
  // Lade würde jedes Mal aufspringen, auch wenn eine Karte längst liegt.
  useEffect(() => {
    if (entschieden.current || laedtSzene) return;
    entschieden.current = true;
    if (!scene) setOffen(true);
  }, [laedtSzene, scene]);
  const [raster, setRaster] = useState(false);
  const [name, setName] = useState('');
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState('');
  const datei = useRef(null);

  /**
   * Eine hochgeladene Karte geht den Umweg über die Bibliothek: dort bleibt
   * sie liegen, wenn der Abend vorbei ist. Was am Tisch entsteht, ist beim
   * nächsten Mal einen Griff entfernt statt einen neuen Upload.
   */
  async function neueSzene(file) {
    setFehler('');
    setLaedt(true);
    try {
      const bild = await bildUndVorschau(file);
      const { id: mediaId } = await mediaApi.upload(bild.dataUrl, bild.name);
      const { id: thumbMediaId } = await mediaApi.upload(bild.vorschauUrl, `vorschau-${bild.name}`);
      const karte = await mapsApi.create({
        name: name.trim() || file.name.replace(/\.[^.]+$/, ''),
        mediaId,
        thumbMediaId,
        width: bild.width,
        height: bild.height,
        gridSize: 70,
      });
      await mapsApi.auflegen(karte.id);
      setName('');
      await Promise.all([laden(), kartenLaden()]);
      onChanged?.();
    } catch (err) {
      setFehler(err.message);
    } finally {
      setLaedt(false);
    }
  }

  async function ausBibliothek(karte) {
    setFehler('');
    try {
      await mapsApi.auflegen(karte.id);
      await Promise.all([laden(), kartenLaden()]);
      onChanged?.();
    } catch (err) {
      setFehler(err.message);
    }
  }

  async function rasterAendern(feld, wert) {
    await scenesApi.update(scene.id, { [feld]: wert });
    onChanged?.();
  }

  return (
    <div className="border-b border-rule bg-panel-soft">
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2">
        {scene &&
          WERKZEUGE.map(({ id, label, Icon, hinweis }) => (
            <Knopf key={id} aktiv={mode === id} onClick={() => onMode(id)} title={hinweis}>
              <Icon size={14} /> {label}
            </Knopf>
          ))}

        {scene && (
          <>
            <span className="mx-1 hidden h-6 w-px bg-rule sm:block" />

            <Knopf onClick={() => onFogAll(false)} title="Die ganze Karte verhüllen">
              <IconFog size={14} /> alles verhüllen
            </Knopf>
            <Knopf onClick={() => onFogAll(true)} title="Die ganze Karte aufdecken">
              <IconEye size={14} /> alles aufdecken
            </Knopf>
            <Knopf onClick={onTokensFromEncounter} title="Für jeden Kämpfer eine Figur auslegen">
              <IconSwords size={14} /> Figuren aus dem Kampf
            </Knopf>
          </>
        )}

        <span className="flex-1" />

        {scene && (
          <Knopf aktiv={raster} onClick={() => setRaster((r) => !r)}>
            Raster
          </Knopf>
        )}
        <Knopf aktiv={offen} onClick={() => setOffen((o) => !o)}>
          <IconMap size={14} /> Szenen ({szenen.length})
        </Knopf>
      </div>

      {raster && scene && (
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
          <p className="text-[15px] text-sepia italic">
            Ein Feld entspricht 5 Fuß. Die Feldgröße so einstellen, dass die Linien auf der Karte liegen.
          </p>
        </div>
      )}

      {offen && (
        <div className="border-t border-dashed border-rule px-3 py-3">
          <div className="mb-3 flex flex-wrap items-center gap-2.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name der neuen Szene"
              className="field-box max-w-xs flex-1"
            />
            <input
              ref={datei}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) neueSzene(file);
              }}
            />
            <button onClick={() => datei.current?.click()} disabled={laedt} className="btn btn-seal disabled:opacity-60">
              <IconUpload size={16} />
              {laedt ? 'lädt …' : 'Karte hochladen'}
            </button>
            <button
              onClick={async () => {
                await scenesApi.create({ name: name.trim() || 'Leere Szene', width: 2100, height: 1400, gridSize: 70 });
                setName('');
                await laden();
                onChanged?.();
              }}
              className="btn btn-plate"
            >
              <IconPlus size={16} /> ohne Karte
            </button>
          </div>

          {fehler && <p className="mb-3 text-rubric">{fehler}</p>}

          {karten.length > 0 && (
            <div className="mb-3 border-b border-dashed border-rule pb-3">
              <p className="mb-1.5 font-display text-[10px] tracking-[0.16em] text-faint uppercase">
                Aus der Bibliothek
              </p>
              <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                {karten.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => ausBibliothek(k)}
                    className="btn-plate flex min-h-11 items-center gap-1.5 py-1 pr-3 pl-1 text-[13px]"
                    title={k.notes || `${k.width}×${k.height}`}
                  >
                    {k.thumbMediaId || k.mediaId ? (
                      <img src={mediaApi.url(k.thumbMediaId ?? k.mediaId)} alt="" className="h-9 w-12 object-cover" />
                    ) : (
                      <span className="flex h-9 w-12 items-center justify-center text-faint">
                        <IconMap size={14} />
                      </span>
                    )}
                    {k.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {szenen.map((s) => (
              <li
                key={s.id}
                className={`flex items-center gap-3 border p-2 ${
                  s.aktiv ? 'border-gold bg-gold/10' : 'border-rule bg-panel'
                }`}
              >
                <div className="h-12 w-16 shrink-0 overflow-hidden border border-rule bg-panel-soft">
                  {s.mediaId ? (
                    <img src={mediaApi.url(s.mediaId)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-faint">
                      <IconMap size={18} />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-ink">{s.name}</p>
                  <p className="text-[14px] text-faint">
                    {s.width}×{s.height} · {s.tokenCount ?? 0} Figuren
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {!s.aktiv && (
                    <button
                      onClick={async () => {
                        await scenesApi.activate(s.id);
                        await laden();
                        onChanged?.();
                      }}
                      className="min-h-9 px-1 font-display text-[11px] tracking-[0.08em] text-rubric uppercase"
                    >
                      auflegen
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      if (!confirm(`Szene „${s.name}“ samt Figuren löschen?`)) return;
                      await scenesApi.remove(s.id);
                      await laden();
                      onChanged?.();
                    }}
                    className="flex min-h-9 items-center justify-center text-sepia hover:text-rubric"
                    aria-label="Szene löschen"
                  >
                    <IconTrash size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
