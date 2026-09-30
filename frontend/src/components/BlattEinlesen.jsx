/**
 * Ein mitgenommenes Blatt wieder einlesen – der Gegenknopf zu „Mitnehmen“.
 *
 * Steht in der Übersicht neben „Neuer Charakter“. Die gewählte Datei wird
 * im Browser gelesen (lib/blattEinfuhr.js) und als neues Blatt in der
 * gewählten Kampagne angelegt; es gehört danach der Person, die angemeldet
 * ist. Ein vorhandenes Blatt wird nie überschrieben – wer zwei Stände hat,
 * soll beide vor sich sehen und selbst entscheiden.
 */
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { charactersApi } from '../lib/api.js';
import { leseBlattdatei } from '../lib/blattEinfuhr.js';
import { IconUpload } from './icons.jsx';

export default function BlattEinlesen() {
  const navigate = useNavigate();
  const datei = useRef(null);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState('');

  async function einlesen(file) {
    setLaedt(true);
    setFehler('');
    try {
      const { name, system, data } = leseBlattdatei(await file.text());
      const blatt = await charactersApi.create({ name, system, data });
      navigate(`/charaktere/${blatt.id}`);
    } catch (err) {
      setFehler(err.message);
      setLaedt(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={datei}
        type="file"
        accept=".html,.htm,.json,text/html,application/json"
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
        className="btn btn-plate disabled:opacity-60"
        title="Eine mit „Mitnehmen“ gesicherte Blattdatei als neues Blatt anlegen"
      >
        <IconUpload size={16} />
        {laedt ? 'liest …' : 'Blatt einlesen'}
      </button>
      {fehler && <p className="max-w-xs text-right text-[14px] text-rubric">{fehler}</p>}
    </div>
  );
}
