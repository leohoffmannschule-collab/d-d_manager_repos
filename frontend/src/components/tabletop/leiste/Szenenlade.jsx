/**
 * Die Szenenlade: neue Szene anlegen, vorhandene auflegen, kopieren, löschen.
 *
 * Drei Wege zu einer neuen Szene, und sie unterscheiden sich mehr, als es
 * aussieht:
 *
 *   *Karte hochladen* geht den Umweg über die Bibliothek. Das Bild bleibt
 *     dort liegen, wenn der Abend vorbei ist – beim nächsten Mal ist es ein
 *     Griff statt eines neuen Uploads.
 *   *Aus der Bibliothek* legt eine schon vorhandene Karte auf.
 *   *ohne Karte* baut ein reines Raster, dessen Größe in Feldern steht.
 *
 * Aufgelegt wird offen oder „verdeckt“ – verdeckt heißt: hinter dem Vorhang.
 * Die Runde sieht erst etwas, wenn die Spielleitung ihn öffnet.
 *
 * Die Fehlermeldung steht nicht hier, sondern eine Ebene höher in SceneBar:
 * Auch das Rasterfeld schreibt hinein, und beide zeigen sie an derselben
 * Stelle an.
 */
import { useRef, useState } from 'react';
import { mapsApi, mediaApi, scenesApi } from '../../../lib/api.js';
import { bildUndVorschau } from '../../../lib/bilder.js';
import Kopierziel from '../../Kopierziel.jsx';
import { IconMap, IconPlus, IconTrash, IconUpload } from '../../icons.jsx';

export default function Szenenlade({ szenen, laden, karten, kartenLaden, onChanged, fehler, setFehler }) {
  const [name, setName] = useState('');
  const [breit, setBreit] = useState(30);
  const [tief, setTief] = useState(20);
  const [laedt, setLaedt] = useState(false);
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

  return (
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
              {/* Dieselbe Szene in einer anderen Kampagne – samt Figuren
                  und Nebel. Die Karte darunter gehört ohnehin der Runde. */}
              <Kopierziel
                kopieren={(ziel) => scenesApi.kopieren(s.id, ziel)}
                beschriftung="kopieren"
                nachOben
                klasse="min-h-9 px-1 font-display text-[11px] tracking-[0.08em] text-sepia uppercase hover:text-ink"
              />
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
  );
}
