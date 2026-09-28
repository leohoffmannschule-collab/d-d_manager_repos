/**
 * Die Kartenbibliothek: Battlemaps, bevor sie jemand sieht.
 *
 * Hier liegt der Unterschied zwischen **Karte** und **Szene**, und wer den
 * kennt, versteht den halben Spieltisch:
 *
 *   Karte  – Vorbereitung. Das Bild samt einmal ausgerichtetem Raster,
 *            Schlagworten und Notizen. Ändert sich im Spiel nie.
 *   Szene  – eine Karte *im Spiel*. Mit Nebel, Figuren und allem, was
 *            der Abend daraus macht.
 *
 * Aus einer Karte lassen sich beliebig viele Szenen legen, ohne das Bild
 * erneut hochzuladen oder das Raster neu auszurichten. „Auflegen“ holt die
 * zuletzt gelegte Szene samt Nebel zurück, „frisch“ beginnt eine neue.
 *
 * Karten gehören der ganzen Runde, nicht einer Kampagne – dieselbe Taverne
 * steht in jeder Geschichte bereit.
 *
 * Diese Datei ist das Regal: hochladen, suchen, auflegen, wegwerfen. Was an
 * einer einzelnen Karte hängt, steht nebenan in karten/:
 *
 *   karten/Kartenkachel.jsx   eine Karte in der Übersicht
 *   karten/Kartenblatt.jsx    die aufgeschlagene Karte zum Einstellen
 *   karten/Rastervorschau.jsx das Gitter über dem Vorschaubild
 */
import { useMemo, useRef, useState } from 'react';
import { mapsApi, mediaApi, scenesApi } from '../../lib/api.js';
import { useKarten, useSzene } from '../../lib/daten.jsx';
import { bildUndVorschau } from '../../lib/bilder.js';
import { IconFog, IconSearch, IconUpload } from '../icons.jsx';
import Kartenblatt from './karten/Kartenblatt.jsx';
import Kartenkachel from './karten/Kartenkachel.jsx';


/**
 * Die Kartenbibliothek.
 *
 * Szenen tragen Nebel und Figuren – sie gehören zum Abend. Karten sind
 * Vorbereitung: einmal hochgeladen, ausgerichtet und beschlagwortet, und dann
 * mit einem Griff wieder auf dem Tisch, ohne die alte Szene zu überschreiben.
 */
export default function Kartenbibliothek() {
  const { karten, laden, laedt } = useKarten();
  // Der Vorhang gehört zum Tisch, nicht zur einzelnen Karte – aber wer hier
  // eine auflegt, will ihn von hier aus zuziehen können.
  const { vorhang } = useSzene();
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
      const wie = antwort.neu ? 'unter frischem Nebel' : 'so wie ihr sie verlassen habt';
      setMeldung(
        vorhang
          ? `„${antwort.name}“ liegt bereit, ${wie} – hinter dem Vorhang. Die Runde sieht noch nichts.`
          : `„${antwort.name}“ liegt auf dem Tisch, ${wie}.`
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
        <button
          onClick={async () => {
            await scenesApi.vorhang(!vorhang);
            setMeldung(
              vorhang
                ? 'Der Vorhang ist offen – die Runde sieht den Tisch.'
                : 'Der Vorhang ist zu. Leg auf, was du magst; die Runde sieht nichts davon.'
            );
          }}
          className={`btn ${vorhang ? 'btn-seal' : 'btn-plate'}`}
          title="Liegt der Vorhang zu, kannst du in Ruhe Karten wechseln und aufbauen"
        >
          <IconFog size={16} /> {vorhang ? 'Vorhang öffnen' : 'Vorhang zu'}
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
          <Kartenkachel
            key={k.id}
            karte={k}
            onAufschlagen={() => setOffen((v) => (v === k.id ? null : k.id))}
            onAuflegen={auflegen}
            onLoeschen={loeschen}
          />
        ))}
      </ul>

      {karten.length > 0 && treffer.length === 0 && (
        <p className="text-sepia italic">Zu „{suche}“ liegt nichts in der Bibliothek.</p>
      )}
    </div>
  );
}
