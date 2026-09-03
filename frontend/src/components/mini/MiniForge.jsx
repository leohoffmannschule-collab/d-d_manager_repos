import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  BAERTE,
  HAARSCHNITTE,
  RUESTUNGEN,
  STANDARD_MINI,
  VOELKER,
  WAFFEN,
  baueSzene,
  raeumeAuf,
  rendereAbzug,
  stelleKamera,
} from '../../lib/mini3d.js';
import { IconCheck, IconD20 } from '../icons.jsx';

const FARBFELDER = [
  ['haut', 'Haut'],
  ['haar', 'Haar'],
  ['primaer', 'Gewand'],
  ['sekundaer', 'Besatz'],
  ['sockel', 'Sockel'],
];

const HAUTTOENE = ['#f2d3b6', '#e0b48c', '#c68a63', '#9c6644', '#6f4a30', '#b8c4a8', '#8fa3b8', '#9c8fb0', '#c9c4b8'];
const HAARTOENE = ['#1c1410', '#3a2a1c', '#6b4423', '#a8763e', '#d9c07a', '#8c8c8c', '#e8e2cf', '#7a2a2a', '#2a4a6b'];

function Wahl({ label, options, value, onChange, spalten = 'grid-cols-3' }) {
  return (
    <div>
      <span className="mb-1.5 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">{label}</span>
      <div className={`grid ${spalten} gap-1.5`}>
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={`min-h-11 border px-2 text-[14px] ${
              value === o.key ? 'border-gold bg-gold/20 text-ink' : 'border-rule text-sepia hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Farbwahl({ label, value, onChange, vorschlaege }) {
  return (
    <div>
      <span className="mb-1.5 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {(vorschlaege ?? []).map((farbe) => (
          <button
            key={farbe}
            type="button"
            onClick={() => onChange(farbe)}
            aria-label={farbe}
            className={`h-8 w-8 rounded-full ring-2 ${value === farbe ? 'ring-gold' : 'ring-black/25'}`}
            style={{ backgroundColor: farbe }}
          />
        ))}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer border border-rule bg-transparent p-0.5"
          aria-label={`${label} frei wählen`}
        />
      </div>
    </div>
  );
}

function zufall(liste) {
  return liste[Math.floor(Math.random() * liste.length)];
}

/**
 * Die Werkbank: links dreht sich die Figur, rechts wird an ihr geschraubt.
 * Der Abzug entsteht erst beim Speichern – gerendert wird also nur, was
 * wirklich gebraucht wird.
 */
export default function MiniForge({ config, onChange, onSave, gespeichert = false, hinweis }) {
  const halter = useRef(null);
  const bau = useRef({});
  const [dreht, setDreht] = useState(false);
  const [speichert, setSpeichert] = useState(false);
  const [fehler, setFehler] = useState('');

  const werte = { ...STANDARD_MINI, ...(config ?? {}) };
  const setzen = (feld, wert) => onChange({ ...werte, [feld]: wert });

  // --- Bühne einmal aufbauen ---------------------------------------------
  useEffect(() => {
    const behaelter = halter.current;
    if (!behaelter) return undefined;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    behaelter.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';

    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
    bau.current = { renderer, camera, drehung: 0.35, zieht: false, letzteX: 0, laeuft: true };

    const groesseAnpassen = () => {
      const { clientWidth: b, clientHeight: h } = behaelter;
      if (!b || !h) return;
      renderer.setSize(b, h, false);
      camera.aspect = b / h;
      camera.updateProjectionMatrix();
    };
    groesseAnpassen();
    const beobachter = new ResizeObserver(groesseAnpassen);
    beobachter.observe(behaelter);

    const schleife = () => {
      const s = bau.current;
      if (!s.laeuft) return;
      requestAnimationFrame(schleife);
      if (!s.scene) return;
      // Steht die Figur unberührt da, dreht sie sich langsam von selbst.
      if (!s.zieht) s.drehung += 0.004;
      s.figur.rotation.y = s.drehung;
      renderer.render(s.scene, camera);
    };
    schleife();

    return () => {
      bau.current.laeuft = false;
      beobachter.disconnect();
      raeumeAuf(bau.current.scene);
      renderer.dispose();
      renderer.forceContextLoss?.();
      behaelter.removeChild(renderer.domElement);
    };
  }, []);

  // --- Figur bei jeder Änderung neu bauen ---------------------------------
  useEffect(() => {
    const s = bau.current;
    if (!s.renderer) return;
    if (s.scene) raeumeAuf(s.scene);
    const { scene, figur } = baueSzene(werte);
    s.scene = scene;
    s.figur = figur;
    stelleKamera(s.camera, figur, 'figur');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(werte)]);

  // --- Mit dem Finger drehen ----------------------------------------------
  function zeigerAb(e) {
    const s = bau.current;
    s.zieht = true;
    s.letzteX = e.clientX;
    setDreht(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function zeigerBewegt(e) {
    const s = bau.current;
    if (!s.zieht) return;
    s.drehung += (e.clientX - s.letzteX) * 0.012;
    s.letzteX = e.clientX;
  }
  function zeigerAuf() {
    bau.current.zieht = false;
    setDreht(false);
  }

  async function speichern() {
    setFehler('');
    setSpeichert(true);
    try {
      const figur = rendereAbzug(werte, { size: 320, ansicht: 'figur', drehung: bau.current.drehung });
      const portraet = rendereAbzug(werte, { size: 256, ansicht: 'portraet', drehung: bau.current.drehung });
      await onSave({ config: werte, figur, portraet });
    } catch (err) {
      setFehler(err.message);
    } finally {
      setSpeichert(false);
    }
  }

  function auswuerfeln() {
    onChange({
      ...werte,
      volk: zufall(VOELKER).key,
      statur: 0.7 + Math.random() * 0.6,
      haut: zufall(HAUTTOENE),
      haar: zufall(HAARTOENE),
      haarschnitt: zufall(HAARSCHNITTE).key,
      bart: zufall(BAERTE).key,
      ruestung: zufall(RUESTUNGEN).key,
      primaer: zufall(['#5a6b4a', '#2d4f7c', '#7a2a2a', '#4a3a6b', '#6b5a2a', '#2a5a55', '#3a3a3a']),
      sekundaer: zufall(['#7a4b2a', '#b8912f', '#8c8c8c', '#4a3423', '#9a2b22']),
      waffe: zufall(WAFFEN).key,
      helm: Math.random() > 0.65,
      umhang: Math.random() > 0.6,
      schild: Math.random() > 0.7,
    });
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div>
        <div
          ref={halter}
          onPointerDown={zeigerAb}
          onPointerMove={zeigerBewegt}
          onPointerUp={zeigerAuf}
          onPointerCancel={zeigerAuf}
          className={`aspect-square w-full border border-rule bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,246,226,0.55),transparent_70%)] ${
            dreht ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ touchAction: 'none' }}
        />
        <p className="mt-2 text-center text-[15px] text-faint italic">Zum Drehen ziehen</p>

        <div className="mt-3 flex flex-wrap gap-2.5">
          <button type="button" onClick={auswuerfeln} className="btn btn-plate flex-1">
            <IconD20 size={16} /> Auswürfeln
          </button>
          <button type="button" onClick={speichern} disabled={speichert} className="btn btn-seal flex-1 disabled:opacity-60">
            {gespeichert && !speichert ? <IconCheck size={16} /> : null}
            {speichert ? 'wird gegossen …' : 'Figur gießen'}
          </button>
        </div>
        {hinweis && <p className="mt-2 text-[15px] text-sepia italic">{hinweis}</p>}
        {fehler && <p className="mt-2 text-rubric">{fehler}</p>}
      </div>

      <div className="space-y-4">
        <Wahl
          label="Volk"
          options={VOELKER}
          value={werte.volk}
          onChange={(v) => setzen('volk', v)}
          spalten="grid-cols-2 sm:grid-cols-3"
        />

        <div>
          <span className="mb-1.5 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
            Statur – schlank bis kräftig
          </span>
          <input
            type="range"
            min={0.6}
            max={1.5}
            step={0.05}
            value={werte.statur}
            onChange={(e) => setzen('statur', Number(e.target.value))}
            className="w-full accent-[var(--color-rubric)]"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Wahl label="Rüstung" options={RUESTUNGEN} value={werte.ruestung} onChange={(v) => setzen('ruestung', v)} spalten="grid-cols-2" />
          <Wahl label="Waffe" options={WAFFEN} value={werte.waffe} onChange={(v) => setzen('waffe', v)} spalten="grid-cols-2" />
          <Wahl label="Haar" options={HAARSCHNITTE} value={werte.haarschnitt} onChange={(v) => setzen('haarschnitt', v)} spalten="grid-cols-2" />
          <Wahl label="Bart" options={BAERTE} value={werte.bart} onChange={(v) => setzen('bart', v)} spalten="grid-cols-3" />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            ['helm', 'Helm'],
            ['umhang', 'Umhang'],
            ['schild', 'Schild'],
          ].map(([feld, label]) => (
            <button
              key={feld}
              type="button"
              onClick={() => setzen(feld, !werte[feld])}
              className={`min-h-11 border px-4 font-display text-[12px] tracking-[0.10em] uppercase ${
                werte[feld] ? 'border-gold bg-gold/20 text-ink' : 'border-rule text-sepia'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FARBFELDER.map(([feld, label]) => (
            <Farbwahl
              key={feld}
              label={label}
              value={werte[feld]}
              onChange={(v) => setzen(feld, v)}
              vorschlaege={
                feld === 'haut'
                  ? HAUTTOENE
                  : feld === 'haar'
                    ? HAARTOENE
                    : ['#5a6b4a', '#2d4f7c', '#7a2a2a', '#4a3a6b', '#b8912f', '#3a3a3a']
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
