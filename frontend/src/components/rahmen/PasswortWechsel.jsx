/**
 * Das eigene Kennwort ändern. Verlangt das alte – auch von der
 * Spielleitung.
 *
 * Wer am fremden Rechner das Fenster offen lässt, soll nicht mit einem
 * Klick ausgesperrt werden können. Geprüft wird ohnehin im Server; das
 * Feld hier ist die Erinnerung daran, dass es so gemeint ist.
 */
import { useState } from 'react';
import { authApi } from '../../lib/api.js';

export default function PasswortWechsel({ onClose }) {
  const [alt, setAlt] = useState('');
  const [neu, setNeu] = useState('');
  const [meldung, setMeldung] = useState('');
  const [fehler, setFehler] = useState('');

  async function absenden(e) {
    e.preventDefault();
    setFehler('');
    try {
      await authApi.changePassword(alt, neu);
      setMeldung('Das Passwort ist gewechselt.');
      setTimeout(onClose, 1200);
    } catch (err) {
      setFehler(err.message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(40,28,14,0.55)] px-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={absenden} className="panel w-full max-w-sm p-5">
        <h2 className="mb-4 font-display text-[15px] font-semibold tracking-[0.14em] text-rubric uppercase">
          Passwort wechseln
        </h2>
        <input
          type="password"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="bisheriges Passwort"
          autoComplete="current-password"
          className="field-box mb-3"
        />
        <input
          type="password"
          value={neu}
          onChange={(e) => setNeu(e.target.value)}
          placeholder="neues Passwort"
          autoComplete="new-password"
          className="field-box mb-4"
        />
        {fehler && <p className="mb-3 text-rubric">{fehler}</p>}
        {meldung && <p className="mb-3 text-sepia italic">{meldung}</p>}
        <div className="flex gap-2.5">
          <button type="submit" className="btn btn-seal flex-1">
            Wechseln
          </button>
          <button type="button" onClick={onClose} className="btn btn-plate">
            Zurück
          </button>
        </div>
      </form>
    </div>
  );
}
