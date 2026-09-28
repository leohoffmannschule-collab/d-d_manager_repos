/**
 * Die Werkzeugleiste über dem Spieltisch – nur für die Spielleitung.
 *
 * Diese Datei stellt vier Teile untereinander und hält das wenige, was sie
 * sich teilen. Gebaut wird nebenan, im Ordner `leiste/`:
 *
 *   1. leiste/Vorhangriegel.jsx – *Der Vorhang.* Steht ganz vorn und wird
 *      rot, wenn er zu ist. Wer ihn vergisst, spielt vor einer Runde, die
 *      nichts sieht – deshalb die auffälligste Anzeige der Oberfläche.
 *   2. leiste/Werkzeuge.jsx – *Die Werkzeuge* (Bewegen, Aufdecken,
 *      Verhüllen, Messen, Zeigen) samt Pinselbreite. Welches gewählt ist,
 *      hält pages/Tabletop.jsx; hier wird nur gezeigt und gemeldet.
 *   3. leiste/Rasterfeld.jsx – *Das Raster* zum Ausklappen: Feldgröße,
 *      Versatz, Maßstab, dunkle Szene, Sichtweite. Alles davon gehört zur
 *      Szene und wird gespeichert.
 *   4. leiste/Szenenlade.jsx – *Die Szenen*: neu aus einer Karte, aus einer
 *      Datei oder ganz ohne, und die Liste der vorhandenen.
 *
 * Hier bleiben nur drei Dinge, weil sie mehr als einen Teil angehen: ob das
 * Rasterfeld und die Lade offen stehen, die Fehlermeldung (das Rasterfeld
 * schreibt hinein, die Lade zeigt sie), und die beiden Listen aus der
 * Datenschicht, die Werkzeuge und Lade gemeinsam brauchen.
 *
 * Diese Datei zeigt viel und entscheidet wenig – der Zustand liegt eine
 * Ebene höher, die Regeln liegen im Server.
 */
import { useEffect, useRef, useState } from 'react';
import { useKarten, useSzenenListe } from '../../lib/daten.jsx';
import Rasterfeld from './leiste/Rasterfeld.jsx';
import Szenenlade from './leiste/Szenenlade.jsx';
import Vorhangriegel from './leiste/Vorhangriegel.jsx';
import Werkzeuge from './leiste/Werkzeuge.jsx';

/** Werkzeugleiste und Szenenverwaltung – nur für die Spielleitung. */
export default function SceneBar({
  scene,
  vorhang,
  laedtSzene,
  tokens = [],
  mode,
  onMode,
  pinsel = 1,
  onPinsel,
  onChanged,
  onFogAll,
  onTokensFromEncounter,
}) {
  const { szenen, laden } = useSzenenListe();
  const { karten, laden: kartenLaden } = useKarten();
  const [offen, setOffen] = useState(false);
  const [raster, setRaster] = useState(false);
  const [fehler, setFehler] = useState('');
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

  return (
    <div className="border-b border-rule bg-panel-soft">
      {vorhang && <Vorhangriegel onChanged={onChanged} />}

      <Werkzeuge
        scene={scene}
        vorhang={vorhang}
        tokens={tokens}
        mode={mode}
        onMode={onMode}
        pinsel={pinsel}
        onPinsel={onPinsel}
        onChanged={onChanged}
        onFogAll={onFogAll}
        onTokensFromEncounter={onTokensFromEncounter}
        raster={raster}
        onRaster={() => setRaster((r) => !r)}
        offen={offen}
        onOffen={() => setOffen((o) => !o)}
        szenenAnzahl={szenen.length}
      />

      {raster && scene && (
        <Rasterfeld
          scene={scene}
          tokens={tokens}
          kartenLaden={kartenLaden}
          onChanged={onChanged}
          setFehler={setFehler}
        />
      )}

      {offen && (
        <Szenenlade
          szenen={szenen}
          laden={laden}
          karten={karten}
          kartenLaden={kartenLaden}
          onChanged={onChanged}
          fehler={fehler}
          setFehler={setFehler}
        />
      )}
    </div>
  );
}
