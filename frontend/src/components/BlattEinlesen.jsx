/**
 * Ein mitgenommenes Blatt wieder einlesen – der Gegenknopf zu „Mitnehmen“.
 *
 * Gedacht für den Weg hin und zurück: Blatt mitnehmen, die Datei bearbeiten
 * – von Hand oder von einer KI („mach ihn Stufe 5“) –, und hier wieder
 * hereinholen. Danach ist es ein ganz gewöhnliches Blatt im Almanach.
 *
 * Steht an zwei Stellen:
 *   – in der Übersicht („Blatt einlesen“): Trägt die Datei die Kennung eines
 *     Blattes, das man ändern darf, wird angeboten, dieses zu aktualisieren;
 *     sonst entsteht ein neues.
 *   – im Kopf eines Blattes („Einlesen“, mit `ziel`): Die Datei aktualisiert
 *     dieses Blatt – über denselben Weg wie jede Änderung am Blatt
 *     (`onErsetzen`, gespeichert von pages/blatt/useBlatt.js).
 *
 * Gespeichert wird nie sofort: Erst zeigt die Vorschau
 * (einlesen/Vorschau.jsx), was die Datei enthält und was sich ändern würde.
 * Gelesen wird im Browser (lib/blattEinfuhr.js) – die Datei geht nicht als
 * Ganzes an den Server, nur das fertige Blatt.
 */
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { charactersApi } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { leseBlattdatei } from '../lib/blattEinfuhr.js';
import { withDefaults } from '../lib/dnd5e.js';
import { unterschiede } from '../lib/einfuhr/unterschiede.js';
import { IconUpload } from './icons.jsx';
import Vorschau from './einlesen/Vorschau.jsx';

/** Ein Blatt so, wie es zum Vergleichen gebraucht wird – ältere 5e-Blätter aufgefüllt. */
const zumVergleich = (blatt) => ({
  name: blatt.name,
  data: blatt.system === 'dnd5e' ? withDefaults(blatt.data) : blatt.data,
});

/**
 * @param {object} props
 * @param {object[]} [props.charaktere]  die Blätter der Übersicht – um das passende zu finden
 * @param {object} [props.ziel]          das geöffnete Blatt (im Kopf eines Blattes)
 * @param {(name: string, data: object) => void} [props.onErsetzen]  übernimmt den Stand ins geöffnete Blatt
 */
export default function BlattEinlesen({ charaktere, ziel, onErsetzen }) {
  const navigate = useNavigate();
  const { user, isDm } = useAuth();
  const datei = useRef(null);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState('');
  const [vorschau, setVorschau] = useState(null);

  /** Das vorhandene Blatt, das die Datei aktualisieren darf – vollständig geladen – oder null. */
  async function passendesBlatt(gelesen) {
    if (ziel) return ziel.system === gelesen.system ? ziel : null;
    const eintrag = gelesen.id && charaktere?.find((c) => c.id === gelesen.id);
    if (!eintrag || !(eintrag.ownerId === user.id || isDm)) return null;
    const blatt = await charactersApi.get(eintrag.id);
    return blatt.system === gelesen.system && blatt.editable !== false ? blatt : null;
  }

  async function einlesen(file) {
    setLaedt(true);
    setFehler('');
    try {
      const text = await file.text();
      const ersterBlick = leseBlattdatei(text, { ersatzName: ziel?.name });
      const passend = await passendesBlatt(ersterBlick);
      // Noch einmal, jetzt mit dem vorhandenen Blatt daneben: So behalten neue
      // Einträge, die es dort schon gibt, ihre Kennung (lib/einfuhr/angleichen.js).
      const gelesen = passend ? leseBlattdatei(text, { ersatzName: ziel?.name, bekannt: passend.data }) : ersterBlick;
      setVorschau({
        gelesen,
        passend,
        aenderungen: passend ? unterschiede(gelesen.system, zumVergleich(passend), gelesen) : null,
        fremd: Boolean(ziel && gelesen.id && gelesen.id !== ziel.id && passend),
      });
    } catch (err) {
      setFehler(err.message);
    } finally {
      setLaedt(false);
    }
  }

  async function neu() {
    const { name, system, data } = vorschau.gelesen;
    const blatt = await charactersApi.create({ name, system, data });
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
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Zurücksetzen, damit dieselbe Datei ein zweites Mal gewählt werden kann.
          e.target.value = '';
          if (file) einlesen(file);
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
            : 'Eine mitgenommene Blattdatei einlesen – auch nach Bearbeitung durch eine KI'
        }
      >
        <IconUpload size={ziel ? 15 : 16} />
        {laedt ? 'liest …' : ziel ? 'Einlesen' : 'Blatt einlesen'}
      </button>
      {fehler && <p className="max-w-sm text-right text-[14px] text-rubric">{fehler}</p>}
      {vorschau && (
        <Vorschau
          gelesen={vorschau.gelesen}
          passend={vorschau.passend}
          aenderungen={vorschau.aenderungen}
          fremd={vorschau.fremd}
          onNeu={neu}
          onAktualisieren={aktualisieren}
          onAbbrechen={() => setVorschau(null)}
        />
      )}
    </div>
  );
}
