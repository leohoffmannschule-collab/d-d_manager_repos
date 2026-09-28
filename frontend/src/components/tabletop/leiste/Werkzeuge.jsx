/**
 * Die eigentliche Werkzeugleiste: Was tut ein Klick auf die Karte?
 *
 * Gewählt ist immer genau eines – Bewegen, Aufdecken, Verhüllen, Messen oder
 * Zeigen. Welches, weiß diese Datei nicht: Das hält pages/Tabletop.jsx und
 * gibt es als `mode` herein. Hier wird nur gezeigt und gemeldet.
 *
 * Dazu kommen die Griffe, die ganze Karten betreffen (alles verhüllen, alles
 * aufdecken, Figuren aus dem Kampf), die NSC-Sicht und die beiden Schalter,
 * die das Rasterfeld und die Szenenlade auf- und zuklappen.
 */
import { scenesApi } from '../../../lib/api.js';
import { IconEye, IconFog, IconMap, IconSwords, IconTarget } from '../../icons.jsx';
import Knopf from './Knopf.jsx';


// Die Werkzeuge des Tisches. `id` ist zugleich der Wert von `mode` in
// pages/Tabletop.jsx und wird in Board.jsx abgefragt – wer eines ergänzt,
// muss es also an drei Stellen kennen.
const WERKZEUGE = [
  { id: 'bewegen', label: 'Bewegen', Icon: IconMap, hinweis: 'Karte schieben, Figuren ziehen' },
  { id: 'nebel-auf', label: 'Aufdecken', Icon: IconEye, hinweis: 'Nebel wegwischen' },
  { id: 'nebel-zu', label: 'Verhüllen', Icon: IconFog, hinweis: 'Nebel zurückholen' },
  { id: 'messen', label: 'Messen', Icon: IconTarget, hinweis: 'Entfernung in Feldern' },
  { id: 'zeigen', label: 'Zeigen', Icon: IconTarget, hinweis: 'kurz aufleuchten lassen (auch Alt+Klick)' },
];

/**
 * Wie breit der Nebelpinsel streicht.
 *
 * Feld für Feld ist für Feinarbeit an einer Wand richtig; einen Saal oder
 * einen Gang so aufzudecken, dauert eine Minute. Deshalb der Block – und für
 * alles Rechteckige lieber gleich das Rechteck: aufziehen, loslassen, fertig.
 *
 * Nur ungerade Größen: Bei einer geraden gäbe es kein Feld in der Mitte, und
 * der Abdruck läge versetzt zum Zeiger.
 */
const PINSEL = [
  { id: 1, label: '1×1', hinweis: 'Feld für Feld – für die Feinarbeit' },
  { id: 3, label: '3×3', hinweis: 'neun Felder auf einen Strich' },
  { id: 5, label: '5×5', hinweis: 'fünfundzwanzig Felder auf einen Strich' },
  { id: 7, label: '7×7', hinweis: 'neunundvierzig Felder auf einen Strich' },
  { id: 'rechteck', label: 'Rechteck', hinweis: 'Aufziehen und alles darin auf einmal – für Säle und Gänge' },
];

export default function Werkzeuge({
  scene,
  vorhang,
  tokens,
  mode,
  onMode,
  pinsel,
  onPinsel,
  onChanged,
  onFogAll,
  onTokensFromEncounter,
  raster,
  onRaster,
  offen,
  onOffen,
  szenenAnzahl,
}) {
  return (
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

      {/* Die Pinselbreite steht nur da, wenn sie zählt – sonst wären es
          fünf Knöpfe mehr in einer ohnehin vollen Leiste. */}
      {scene && (mode === 'nebel-auf' || mode === 'nebel-zu') && (
        <>
          <span className="mx-1 hidden h-6 w-px bg-rule sm:block" />
          <span className="font-display text-[11px] tracking-[0.10em] text-faint uppercase">Pinsel</span>
          {PINSEL.map(({ id, label, hinweis }) => (
            <Knopf key={id} aktiv={pinsel === id} onClick={() => onPinsel?.(id)} title={hinweis}>
              {label}
            </Knopf>
          ))}
        </>
      )}

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
        <Knopf aktiv={raster} onClick={onRaster}>
          Raster
        </Knopf>
      )}
      <Knopf aktiv={offen} onClick={onOffen}>
        <IconMap size={14} /> Szenen ({szenenAnzahl})
      </Knopf>
    </div>
  );
}
