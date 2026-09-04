import { useEffect, useMemo, useRef, useState } from 'react';
import { mapsApi, mediaApi } from '../../lib/api.js';
import { useKarten, useKlangbibliothek } from '../../lib/daten.jsx';
import { bildUndVorschau } from '../../lib/bilder.js';
import { Rubric } from '../ui.jsx';
import { IconCheck, IconMap, IconSearch, IconTrash, IconUpload } from '../icons.jsx';

/**
 * Ein Rasternetz über der Vorschau. Damit lässt sich die Feldgröße
 * ausrichten, ohne die Karte erst auf den Tisch legen zu müssen – und die
 * Runde sieht dabei nichts von der Karte, die als Nächstes dran ist.
 */
function Rastervorschau({ karte, entwurf }) {
  const rahmen = useRef(null);
  const [breite, setBreite] = useState(0);

  useEffect(() => {
    const el = rahmen.current;
    if (!el) return undefined;
    const beobachter = new ResizeObserver(([eintrag]) => setBreite(eintrag.contentRect.width));
    beobachter.observe(el);
    setBreite(el.clientWidth);
    return () => beobachter.disconnect();
  }, []);

  // Die Vorschau ist kleiner als die Karte; das Raster muss im selben
  // Verhältnis schrumpfen, sonst zeigt sie etwas anderes als der Tisch.
  const faktor = karte.width > 0 && breite > 0 ? breite / karte.width : 0;
  const feld = entwurf.gridSize * faktor;
  const linie = 'rgba(196, 160, 82, 0.55)';

  return (
    <div ref={rahmen} className="relative overflow-hidden border border-rule bg-panel-soft">
      {karte.mediaId ? (
        <img src={mediaApi.url(karte.mediaId)} alt="" className="block w-full" />
      ) : (
        <div className="flex h-40 items-center justify-center text-faint">
          <IconMap size={28} />
        </div>
      )}
      {feld >= 4 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(to right, ${linie} 0 1px, transparent 1px ${feld}px),
                              repeating-linear-gradient(to bottom, ${linie} 0 1px, transparent 1px ${feld}px)`,
            backgroundPosition: `${entwurf.gridOffsetX * faktor}px ${entwurf.gridOffsetY * faktor}px`,
          }}
        />
      )}
    </div>
  );
}

/** Das aufgeschlagene Blatt einer Karte: benennen, verschlagworten, ausrichten. */
function Kartenblatt({ karte, onGespeichert, onSchliessen, onMelden }) {
  const { ambienten } = useKlangbibliothek();
  const [entwurf, setEntwurf] = useState({
    name: karte.name,
    tags: karte.tags.join(', '),
    notes: karte.notes,
    gridSize: karte.gridSize,
    gridOffsetX: karte.gridOffsetX,
    gridOffsetY: karte.gridOffsetY,
    ambienceId: karte.ambienceId ?? '',
  });
  const [laedt, setLaedt] = useState(false);

  const setzen = (feld) => (wert) => setEntwurf((v) => ({ ...v, [feld]: wert }));

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
          <p className="text-[15px] text-sepia italic">
            Ein Feld sind 5 Fuß. Einmal hier ausgerichtet, kommt jede Szene aus dieser Karte schon passend
            auf den Tisch.
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

/**
 * Die Kartenbibliothek.
 *
 * Szenen tragen Nebel und Figuren – sie gehören zum Abend. Karten sind
 * Vorbereitung: einmal hochgeladen, ausgerichtet und beschlagwortet, und dann
 * mit einem Griff wieder auf dem Tisch, ohne die alte Szene zu überschreiben.
 */
export default function Kartenbibliothek() {
  const { karten, laden, laedt } = useKarten();
  const [suche, setSuche] = useState('');
  const [meldung, setMeldung] = useState('');
  const [fortschritt, setFortschritt] = useState(null);
  const [offen, setOffen] = useState(null);
  const datei = useRef(null);

  const treffer = useMemo(() => {
    const wort = suche.trim().toLowerCase();
    if (!wort) return karten;
    return karten.filter(
      (k) =>
        k.name.toLowerCase().includes(wort) ||
        k.notes.toLowerCase().includes(wort) ||
        k.tags.some((t) => t.toLowerCase().includes(wort))
    );
  }, [karten, suche]);

  const geoeffnet = karten.find((k) => k.id === offen) ?? null;

  async function hochladen(dateien) {
    setMeldung('');
    const liste = Array.from(dateien);
    for (const [i, file] of liste.entries()) {
      setFortschritt(`${i + 1} von ${liste.length}: ${file.name}`);
      try {
        const bild = await bildUndVorschau(file);
        const { id: mediaId } = await mediaApi.upload(bild.dataUrl, bild.name);
        const { id: thumbMediaId } = await mediaApi.upload(bild.vorschauUrl, `vorschau-${bild.name}`);
        await mapsApi.create({
          name: file.name.replace(/\.[^.]+$/, ''),
          mediaId,
          thumbMediaId,
          width: bild.width,
          height: bild.height,
          gridSize: 70,
        });
      } catch (err) {
        setMeldung(`„${file.name}“ ging nicht: ${err.message}`);
      }
    }
    setFortschritt(null);
    await laden();
  }

  async function auflegen(karte, frisch = false) {
    try {
      const antwort = await mapsApi.auflegen(karte.id, { frisch });
      await laden();
      setMeldung(
        antwort.neu
          ? `„${antwort.name}“ liegt auf dem Tisch – unter frischem Nebel.`
          : `„${antwort.name}“ liegt auf dem Tisch, so wie ihr sie verlassen habt.`
      );
    } catch (err) {
      setMeldung(err.message);
    }
  }

  async function loeschen(karte) {
    if (!confirm(`„${karte.name}“ aus der Bibliothek nehmen? Szenen, die daraus entstanden sind, bleiben.`))
      return;
    await mapsApi.remove(karte.id);
    if (offen === karte.id) setOffen(null);
    await laden();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex min-w-[14rem] flex-1 items-center gap-2.5 border border-rule bg-panel-soft px-3">
          <IconSearch size={16} className="text-faint" />
          <input
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Nach Name oder Schlagwort suchen"
            className="min-h-11 flex-1 bg-transparent text-ink outline-none"
          />
        </label>
        <input
          ref={datei}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const dateien = e.target.files;
            if (dateien?.length) hochladen(dateien);
            e.target.value = '';
          }}
        />
        <button
          onClick={() => datei.current?.click()}
          disabled={Boolean(fortschritt)}
          className="btn btn-seal disabled:opacity-60"
        >
          <IconUpload size={16} /> {fortschritt ? 'lädt …' : 'Karten hochladen'}
        </button>
      </div>

      <p className="text-sepia italic">
        {laedt
          ? 'Die Bibliothek wird aufgeschlagen …'
          : karten.length === 0
            ? 'Noch liegt keine Karte bereit. Mehrere Bilder auf einmal auswählen geht auch.'
            : `${karten.length} ${karten.length === 1 ? 'Karte wartet' : 'Karten warten'} auf ihren Einsatz.`}
      </p>

      {fortschritt && (
        <p className="border-l-[3px] border-gold bg-gold/10 px-3.5 py-2.5 text-sepia">{fortschritt}</p>
      )}
      {meldung && <p className="border-l-[3px] border-gold bg-gold/10 px-3.5 py-2.5 text-sepia">{meldung}</p>}

      {geoeffnet && (
        <Kartenblatt
          key={geoeffnet.id}
          karte={geoeffnet}
          onGespeichert={laden}
          onSchliessen={() => setOffen(null)}
          onMelden={setMeldung}
        />
      )}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {treffer.map((k) => (
          <li key={k.id} className="panel flex flex-col overflow-hidden">
            <button
              onClick={() => setOffen((v) => (v === k.id ? null : k.id))}
              className="block aspect-[4/3] w-full overflow-hidden border-b border-rule bg-panel-soft"
              title="Aufschlagen und ausrichten"
            >
              {k.thumbMediaId || k.mediaId ? (
                <img
                  src={mediaApi.url(k.thumbMediaId ?? k.mediaId)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full items-center justify-center text-faint">
                  <IconMap size={26} />
                </span>
              )}
            </button>

            <div className="flex flex-1 flex-col gap-2 p-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-display text-[16px] text-ink" title={k.name}>
                  {k.name}
                </h3>
                <p className="text-[14px] text-faint">
                  {k.width}×{k.height} · Feld {k.gridSize}
                  {k.szenen > 0 && ` · ${k.szenen} ${k.szenen === 1 ? 'Szene' : 'Szenen'}`}
                </p>
                {k.tags.length > 0 && (
                  <p className="mt-1 flex flex-wrap gap-1">
                    {k.tags.map((t) => (
                      <span key={t} className="border border-rule px-1.5 text-[13px] text-sepia">
                        {t}
                      </span>
                    ))}
                  </p>
                )}
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => auflegen(k)}
                  className="btn btn-seal flex-1 text-[13px]"
                  title={k.szenen > 0 ? 'Die vorhandene Szene samt Nebel zurückholen' : 'Als neue Szene auf den Tisch'}
                >
                  <IconMap size={15} /> Auflegen
                </button>
                {k.szenen > 0 && (
                  <button
                    onClick={() => auflegen(k, true)}
                    className="btn-plate min-h-12 px-3 text-[13px]"
                    title="Neue Szene aus dieser Karte – alles wieder verhüllt"
                  >
                    frisch
                  </button>
                )}
                <button
                  onClick={() => loeschen(k)}
                  className="flex h-12 w-12 items-center justify-center border border-rule text-sepia hover:border-rubric hover:text-rubric"
                  aria-label={`${k.name} löschen`}
                >
                  <IconTrash size={16} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {karten.length > 0 && treffer.length === 0 && (
        <p className="text-sepia italic">Zu „{suche}“ liegt nichts in der Bibliothek.</p>
      )}
    </div>
  );
}
