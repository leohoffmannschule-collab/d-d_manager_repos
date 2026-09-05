import { useEffect, useMemo, useRef, useState } from 'react';
import { mapsApi, mediaApi, scenesApi } from '../../lib/api.js';
import { useKarten, useSzenenListe } from '../../lib/daten.jsx';
import { bildUndVorschau } from '../../lib/bilder.js';
import { EINHEIT, rasterBereich, weite } from '../../lib/rasterkarte.js';
import {
  IconCandle,
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
export default function SceneBar({ scene, vorhang, laedtSzene, tokens = [], mode, onMode, onChanged, onFogAll, onTokensFromEncounter }) {
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
  const [breit, setBreit] = useState(30);
  const [tief, setTief] = useState(20);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState('');
  const datei = useRef(null);

  // Wie groß ist diese Karte im Spiel? Aus dem Raster, nicht aus dem Bildmaß.
  const masse = useMemo(() => {
    if (!scene) return { spalten: 0, zeilen: 0, breite: 0, tiefe: 0 };
    const { cols, rows } = rasterBereich(scene);
    const rund = (wert) => (Number.isInteger(wert) ? wert : Math.round(wert * 10) / 10);
    return { spalten: cols, zeilen: rows, breite: rund(weite(scene, cols)), tiefe: rund(weite(scene, rows)) };
  }, [scene]);

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
      {/* Der Vorhang steht vorn und ist rot, wenn er zu ist: Wer ihn vergisst,
          spielt vor einer Runde, die nichts sieht. */}
      {vorhang && (
        <button
          onClick={async () => {
            await scenesApi.vorhang(false);
            onChanged?.();
          }}
          className="flex w-full items-center justify-center gap-2.5 border-b border-rubric bg-rubric px-3 py-2.5 font-display text-[12px] tracking-[0.14em] text-rubric-ink uppercase"
        >
          <IconFog size={15} />
          Der Vorhang ist zu – die Runde sieht nichts. Jetzt öffnen
        </button>
      )}

      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2">
        {!vorhang && (
          <Knopf
            onClick={async () => {
              await scenesApi.vorhang(true);
              onChanged?.();
            }}
            title="Der Runde den Tisch verdecken, um in Ruhe aufzubauen"
          >
            <IconFog size={14} /> Vorhang zu
          </Knopf>
        )}

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
          <label
            className={`flex min-h-11 items-center gap-1.5 border px-2 font-display text-[11px] tracking-[0.10em] uppercase ${
              scene.nscSicht ? 'border-rubric bg-rubric/15 text-rubric' : 'border-rule text-sepia'
            }`}
            title="Sehen, was diese Figur sieht. Sonst sieht die Spielleitung alles."
          >
            <IconEye size={14} />
            <select
              value={scene.nscSicht ?? ''}
              onChange={async (e) => {
                await scenesApi.nscSicht(e.target.value || null);
                onChanged?.();
              }}
              className="min-h-9 max-w-[9rem] bg-transparent font-display text-[11px] tracking-[0.10em] text-inherit uppercase outline-none"
            >
              <option value="">alles sehen</option>
              {tokens.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || 'Figur'}
                </option>
              ))}
            </select>
          </label>
        )}

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
                // Reines Raster ohne Bild: Die Größe steht in Feldern, das
                // Bildmaß rechnet sich daraus. 60 Bildpunkte je Feld sind
                // auch bei zweihundert Feldern noch flüssig.
                const felder = Math.max(1, Math.min(250, Number(breit) || 30));
                const hoch = Math.max(1, Math.min(250, Number(tief) || 20));
                await scenesApi.create({
                  name: name.trim() || 'Leere Szene',
                  width: felder * 60,
                  height: hoch * 60,
                  gridSize: 60,
                });
                setName('');
                await laden();
                onChanged?.();
              }}
              className="btn btn-plate"
            >
              <IconPlus size={16} /> ohne Karte
            </button>
            <label className="flex items-center gap-1.5 text-[14px] text-faint">
              <input
                type="number"
                min={1}
                max={250}
                value={breit}
                onChange={(e) => setBreit(e.target.value)}
                className="field-box w-16 font-display"
                aria-label="Felder breit"
              />
              ×
              <input
                type="number"
                min={1}
                max={250}
                value={tief}
                onChange={(e) => setTief(e.target.value)}
                className="field-box w-16 font-display"
                aria-label="Felder hoch"
              />
              Felder
            </label>
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
                    <>
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
                      <button
                        onClick={async () => {
                          await scenesApi.activate(s.id, true);
                          await laden();
                          onChanged?.();
                        }}
                        title="Hinter dem Vorhang auflegen – die Runde sieht erst, wenn du öffnest"
                        className="min-h-9 px-1 font-display text-[11px] tracking-[0.08em] text-sepia uppercase hover:text-ink"
                      >
                        verdeckt
                      </button>
                    </>
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
