import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKlang } from '../lib/klang.jsx';
import { rueckkehrEinloesen } from '../lib/spotify.js';

/**
 * Die Landestelle nach der Anmeldung bei Spotify.
 *
 * Diese Adresse – `/spotify` – muss im Spotify-Dashboard als Redirect URI
 * eingetragen sein, sonst schickt Spotify den Browser gar nicht erst zurück.
 */
export default function SpotifyRueckkehr() {
  const navigate = useNavigate();
  const { einrichtung } = useKlang();
  const [fehler, setFehler] = useState('');
  const eingeloest = useRef(false);

  useEffect(() => {
    if (eingeloest.current || !einrichtung.clientId) return;
    eingeloest.current = true;

    const suche = new URLSearchParams(window.location.search);
    const abgelehnt = suche.get('error');
    if (abgelehnt) {
      setFehler(
        abgelehnt === 'access_denied'
          ? 'Die Anmeldung wurde abgebrochen. Ohne sie bleibt der Almanach hier still.'
          : abgelehnt
      );
      return;
    }

    rueckkehrEinloesen(einrichtung.clientId, suche.get('code'), suche.get('state'))
      .then((zurueck) => navigate(zurueck, { replace: true }))
      .catch((err) => setFehler(err.message));
  }, [einrichtung.clientId, navigate]);

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      {fehler ? (
        <>
          <h1 className="mb-3 font-display text-xl text-rubric">Das hat nicht geklappt</h1>
          <p className="mb-5 text-sepia">{fehler}</p>
          <button onClick={() => navigate('/', { replace: true })} className="btn btn-plate">
            Zurück zum Almanach
          </button>
        </>
      ) : (
        <p className="text-sepia italic">Spotify wird eingehängt …</p>
      )}
    </div>
  );
}
