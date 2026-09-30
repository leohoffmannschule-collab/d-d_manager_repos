/**
 * Ein Hinweis auf der Anmeldeseite: „Hier geht dein Kennwort unverschlüsselt
 * durchs WLAN – nimm lieber den verschlüsselten Eingang.“
 *
 * Erscheint nur, wenn alle drei Dinge zutreffen:
 *
 *   – die Seite kam über `http://`,
 *   – nicht vom eigenen Rechner (localhost verlässt das Gerät nie),
 *   – und der Almanach hat einen HTTPS-Eingang offen (npm run zertifikat;
 *     der Server nennt seinen Port unter /api/health).
 *
 * Über den Tunnel kommt die Seite ohnehin als `https://` – dort schweigt
 * der Hinweis. Weitergeleitet wird bewusst nicht von selbst: Wer das
 * Stammzertifikat noch nicht installiert hat, stünde sonst vor einer
 * Warnseite, ohne zu wissen, warum.
 */
import { useEffect, useState } from 'react';
import { authApi } from '../lib/api.js';
import { IconKey } from './icons.jsx';

const EIGENER_RECHNER = new Set(['localhost', '127.0.0.1', '[::1]']);

export default function HttpsHinweis() {
  const [port, setPort] = useState(null);
  const unverschluesselt =
    window.location.protocol === 'http:' && !EIGENER_RECHNER.has(window.location.hostname);

  useEffect(() => {
    if (!unverschluesselt) return;
    authApi
      .lebenszeichen()
      .then((antwort) => setPort(antwort?.https ?? null))
      .catch(() => setPort(null));
  }, [unverschluesselt]);

  if (!unverschluesselt || !port) return null;
  const ziel = `https://${window.location.hostname}:${port}${window.location.pathname}`;

  return (
    <p className="mb-4 flex items-start gap-2.5 border border-gold bg-gold/12 p-3 text-[15px] text-sepia">
      <IconKey size={16} className="mt-0.5 shrink-0 text-gold" />
      <span>
        Diese Verbindung ist unverschlüsselt – im selben WLAN könnte jemand das Kennwort mitlesen.{' '}
        <a href={ziel} className="text-rubric underline">
          Verschlüsselt anmelden
        </a>
      </span>
    </p>
  );
}
