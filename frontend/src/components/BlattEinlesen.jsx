/**
 * Ein mitgenommenes Blatt wieder einlesen – der Gegenknopf zu „Mitnehmen“.
 *
 * Gedacht für den Weg hin und zurück: Blatt mitnehmen, die Datei bearbeiten
 * – von Hand oder von einer KI („mach ihn Stufe 5“) –, und hier wieder
 * hereinholen. Danach ist es ein ganz gewöhnliches Blatt im Almanach.
 *
 * Steht an zwei Stellen:
 *   – in der Übersicht („Blätter einlesen“): eine Datei oder mehrere auf
 *     einmal. Trägt eine die Kennung eines Blattes, das man ändern darf,
 *     wird angeboten, dieses zu aktualisieren; sonst entsteht ein neues –
 *     bei der Spielleitung auf Wunsch gleich als NSC.
 *   – im Kopf eines Blattes („Einlesen“, mit `ziel`): genau eine Datei, die
 *     dieses Blatt aktualisiert – über denselben Weg wie jede Änderung am
 *     Blatt (`onErsetzen`, gespeichert von pages/blatt/useBlatt.js).
 *
 * Gespeichert wird nie sofort: Erst zeigt die Vorschau, was die Dateien
 * enthalten und was sich ändern würde – für eine Datei ausführlich
 * (einlesen/Vorschau.jsx), für mehrere als Liste mit einer Wahl je Datei
 * (einlesen/Sammelvorschau.jsx). Gelesen wird im Browser
 * (lib/blattEinfuhr.js, lib/einfuhr/stapel.js) – die Dateien gehen nicht
 * als Ganzes an den Server, nur die fertigen Blätter.
 */
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { charactersApi } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { dateiLesen, stapelLesen, stapelUebernehmen } from '../lib/einfuhr/stapel.js';
import { IconUpload } from './icons.jsx';
import Vorschau from './einlesen/Vorschau.jsx';
import Sammelvorschau from './einlesen/Sammelvorschau.jsx';

/**
 * @param {object} props
 * @param {object[]} [props.charaktere]  die Blätter der Übersicht – um das passende zu finden
 * @param {object} [props.ziel]          das geöffnete Blatt (im Kopf eines Blattes)
 * @param {(name: string, data: object) => void} [props.onErsetzen]  übernimmt den Stand ins geöffnete Blatt
 * @param {() => void} [props.onEingelesen]  nach mehreren Dateien: die Übersicht neu laden
 */
export default function BlattEinlesen({ charaktere, ziel, onErsetzen, onEingelesen }) {
  const navigate = useNavigate();
  const { user, isDm } = useAuth();
  const datei = useRef(null);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState('');
  const [vorschau, setVorschau] = useState(null);
  const [stapel, setStapel] = useState(null);

  /** Das vorhandene Blatt, das die Datei aktualisieren darf – vollständig geladen – oder null. */
  async function passendesBlatt(gelesen) {
    if (ziel) return ziel.system === gelesen.system ? ziel : null;
    const eintrag = gelesen.id && charaktere?.find((c) => c.id === gelesen.id);
    if (!eintrag || !(eintrag.ownerId === user.id || isDm)) return null;
    const blatt = await charactersApi.get(eintrag.id);
    return blatt.system === gelesen.system && blatt.editable !== false ? blatt : null;
  }

  /** Eine Datei: die ausführliche Vorschau. */
  async function einlesen(file) {
    setLaedt(true);
    setFehler('');
    try {
      const text = await file.text();
      const { gelesen, passend, aenderungen } = await dateiLesen(text, { passendesBlatt, ersatzName: ziel?.name });
      setVorschau({
        gelesen,
        passend,
        aenderungen,
        fremd: Boolean(ziel && gelesen.id && gelesen.id !== ziel.id && passend),
      });
    } catch (err) {
      setFehler(err.message);
    } finally {
      setLaedt(false);
    }
  }

  /** Mehrere Dateien: lesen, was sich lesen lässt, und die Sammelvorschau zeigen. */
  async function mehrereEinlesen(files) {
    setLaedt(true);
    setFehler('');
    try {
      const dateien = await Promise.all(files.map(async (f) => ({ name: f.name, text: await f.text() })));
      setStapel(await stapelLesen(dateien, { passendesBlatt }));
    } catch (err) {
      setFehler(err.message);
    } finally {
      setLaedt(false);
    }
  }

  /** Den Stapel speichern; die Sammelvorschau zeigt den Ausgang je Datei. */
  async function stapelSpeichern(posten, fortschritt) {
    await stapelUebernehmen(posten, {
      anlegen: (blatt) => charactersApi.create(isDm ? blatt : { ...blatt, npc: false }),
      aktualisieren: (id, blatt) => charactersApi.update(id, blatt),
      fortschritt,
    });
    onEingelesen?.();
  }

  async function neu({ npc = false } = {}) {
    const { name, system, data } = vorschau.gelesen;
    const blatt = await charactersApi.create({ name, system, data, npc: isDm && npc });
    setVorschau(null);
    navigate(`/charaktere/${blatt.id}`);
  }

  async function aktualisieren() {
    const { name, data } = vorschau.gelesen;
    if (onErsetzen) {
      onErsetzen(name, data);
      setVorschau(null);
      return;
    }
    await charactersApi.update(vorschau.passend.id, { name, data });
    setVorschau(null);
    navigate(`/charaktere/${vorschau.passend.id}`);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={datei}
        type="file"
        accept=".html,.htm,.json,.txt,.md,text/html,application/json,text/plain,text/markdown"
        multiple={!ziel}
        className="hidden"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          // Zurücksetzen, damit dieselbe Datei ein zweites Mal gewählt werden kann.
          e.target.value = '';
          if (files.length === 1) einlesen(files[0]);
          else if (files.length > 1) mehrereEinlesen(files);
        }}
      />
      <button
        type="button"
        onClick={() => datei.current?.click()}
        disabled={laedt}
        className={
          ziel
            ? 'btn-plate flex min-h-11 items-center gap-1.5 px-3 text-[13px] disabled:opacity-60'
            : 'btn btn-plate disabled:opacity-60'
        }
        title={
          ziel
            ? 'Eine bearbeitete Blattdatei (von Hand oder von einer KI) in dieses Blatt übernehmen – mit Vorschau'
            : 'Mitgenommene Blattdateien einlesen – eine oder mehrere auf einmal, auch nach Bearbeitung durch eine KI'
        }
      >
        <IconUpload size={ziel ? 15 : 16} />
        {laedt ? 'liest …' : ziel ? 'Einlesen' : 'Blätter einlesen'}
      </button>
      {fehler && <p className="max-w-sm text-right text-[14px] text-rubric">{fehler}</p>}
      {vorschau && (
        <Vorschau
          gelesen={vorschau.gelesen}
          passend={vorschau.passend}
          aenderungen={vorschau.aenderungen}
          fremd={vorschau.fremd}
          nscMoeglich={isDm && !ziel}
          onNeu={neu}
          onAktualisieren={aktualisieren}
          onAbbrechen={() => setVorschau(null)}
        />
      )}
      {stapel && (
        <Sammelvorschau
          posten={stapel}
          nscMoeglich={isDm}
          onUebernehmen={stapelSpeichern}
          onSchliessen={() => setStapel(null)}
        />
      )}
    </div>
  );
}
