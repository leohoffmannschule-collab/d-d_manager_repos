import { useState } from 'react';
import MiniForge from '../mini/MiniForge.jsx';
import { STANDARD_MINI } from '../../lib/mini3d.js';
import { mediaApi } from '../../lib/api.js';
import { Card } from '../ui.jsx';

/**
 * Die eigene Zinnfigur. Was hier gegossen wird, steht danach als Bildnis auf
 * dem Blatt und als Figur auf dem Spieltisch.
 */
export default function MiniTab({ data, update }) {
  const [entwurf, setEntwurf] = useState(data.mini ?? STANDARD_MINI);
  const [gespeichert, setGespeichert] = useState(false);

  async function giessen({ config, figur, portraet }) {
    const [figurBild, portraetBild] = await Promise.all([
      mediaApi.upload(figur, 'figur.png'),
      mediaApi.upload(portraet, 'bildnis.png'),
    ]);
    update('mini', config);
    update('miniMediaId', figurBild.id);
    // Das Bildnis ersetzt auch das Porträt auf Blatt und Übersicht.
    update('portrait', mediaApi.url(portraetBild.id));
    setGespeichert(true);
  }

  return (
    <Card title="Figurenschmiede">
      <p className="mb-4 text-sepia italic">
        Stelle deine Figur zusammen, wie du sie auf dem Tisch sehen möchtest. Beim Gießen entsteht daraus das
        Bildnis für dein Blatt und die Figur, mit der du über die Karte ziehst.
      </p>
      <MiniForge
        config={entwurf}
        onChange={(c) => {
          setEntwurf(c);
          setGespeichert(false);
        }}
        onSave={giessen}
        gespeichert={gespeichert}
        hinweis={
          gespeichert
            ? 'Gegossen. Die Spielleitung legt die Figur beim nächsten Kampf aus.'
            : data.miniMediaId
              ? 'Es gibt bereits eine gegossene Figur – neu gießen ersetzt sie.'
              : 'Noch ist nichts gegossen.'
        }
      />
    </Card>
  );
}
