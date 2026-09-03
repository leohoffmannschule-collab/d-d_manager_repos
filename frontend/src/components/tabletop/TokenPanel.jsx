import { useRef, useState } from 'react';
import { mediaApi, scenesApi } from '../../lib/api.js';
import { bildLesen } from '../../lib/bilder.js';
import { IconEye, IconEyeOff, IconTrash, IconUpload } from '../icons.jsx';

const FARBEN = ['#9a2b22', '#2d4f7c', '#2f6b4f', '#6b3f8c', '#a86a1f', '#1f6f74', '#8c3f5f', '#4a5d23', '#3a3a3a'];

/** Die ausgewählte Figur bearbeiten – nur die Spielleitung sieht das. */
export default function TokenPanel({ token, onChanged, onRemoved }) {
  const datei = useRef(null);
  const [laedt, setLaedt] = useState(false);

  if (!token) {
    return (
      <p className="text-sepia italic">
        Eine Figur auf dem Tisch antippen, um sie zu benennen, einzufärben oder zu verbergen.
      </p>
    );
  }

  const aendern = async (payload) => {
    await scenesApi.moveToken(token.id, payload);
    onChanged?.();
  };

  async function bildSetzen(file) {
    setLaedt(true);
    try {
      // Figuren sind klein auf dem Schirm – 512 Pixel genügen reichlich.
      const bild = await bildLesen(file, 512);
      const { id } = await mediaApi.upload(bild.dataUrl, bild.name);
      await aendern({ mediaId: id });
    } finally {
      setLaedt(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">Name</span>
        <input
          value={token.name}
          onChange={(e) => aendern({ name: e.target.value })}
          className="field-box"
          placeholder="ohne Namen"
        />
      </label>

      <div>
        <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
          Größe in Feldern
        </span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((groesse) => (
            <button
              key={groesse}
              onClick={() => aendern({ size: groesse })}
              className={`h-11 flex-1 border font-display ${
                token.size === groesse ? 'border-gold bg-gold/20 text-ink' : 'border-rule text-sepia'
              }`}
            >
              {groesse}×{groesse}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">Farbe</span>
        <div className="flex flex-wrap gap-1.5">
          {FARBEN.map((farbe) => (
            <button
              key={farbe}
              onClick={() => aendern({ color: farbe })}
              aria-label={`Farbe ${farbe}`}
              className={`h-9 w-9 rounded-full ring-2 ${
                token.color === farbe ? 'ring-gold' : 'ring-black/30'
              }`}
              style={{ backgroundColor: farbe }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={datei}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) bildSetzen(file);
          }}
        />
        <button onClick={() => datei.current?.click()} disabled={laedt} className="btn btn-plate flex-1 disabled:opacity-60">
          <IconUpload size={16} /> {laedt ? 'lädt …' : 'Bildnis'}
        </button>
        {token.mediaId && (
          <button onClick={() => aendern({ mediaId: null })} className="btn btn-plate">
            zurücknehmen
          </button>
        )}
      </div>

      <button
        onClick={() => aendern({ hidden: !token.hidden })}
        className={`btn w-full ${token.hidden ? 'btn-seal' : 'btn-plate'}`}
      >
        {token.hidden ? <IconEyeOff size={16} /> : <IconEye size={16} />}
        {token.hidden ? 'für die Runde verborgen' : 'für alle sichtbar'}
      </button>

      <button
        onClick={async () => {
          await scenesApi.removeToken(token.id);
          onRemoved?.();
        }}
        className="flex min-h-11 w-full items-center justify-center gap-2 border border-rule text-sepia hover:border-rubric hover:text-rubric"
      >
        <IconTrash size={16} /> Figur vom Tisch nehmen
      </button>
    </div>
  );
}
