/**
 * Das Menü hinter dem eigenen Namen: Aussehen, Kennwort, Abmelden.
 *
 * Das Aussehen (hell oder Kerzenlicht) merkt sich der Browser, nicht der
 * Server – siehe lib/useTheme.js und public/aussehen.js. Deshalb steht es
 * hier und nicht bei den Kontodaten.
 */
import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../lib/auth.jsx';
import { useLiveStatus } from '../../lib/live.jsx';
import { IconCrown, IconHelp, IconKey, IconLogout, IconQuill, IconUsers } from '../icons.jsx';
import PasswortWechsel from './PasswortWechsel.jsx';
import Verbindung from './Verbindung.jsx';

export default function Konto() {
  const { user, logout, isDm } = useAuth();
  const { connected, presence } = useLiveStatus();
  const [offen, setOffen] = useState(false);
  const [passwort, setPasswort] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!offen) return undefined;
    const schliessen = (e) => {
      if (!box.current?.contains(e.target)) setOffen(false);
    };
    document.addEventListener('pointerdown', schliessen);
    return () => document.removeEventListener('pointerdown', schliessen);
  }, [offen]);

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOffen((o) => !o)}
        className="flex min-h-11 items-center gap-2 border border-transparent px-2.5 text-leather-ink hover:border-gold"
        aria-label="Konto"
      >
        <Verbindung connected={connected} />
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full font-display text-[13px] font-semibold text-[#f0dca8]"
          style={{ backgroundColor: user.color }}
        >
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden font-display text-[13px] tracking-[0.08em] sm:inline">{user.name}</span>
      </button>

      {offen && (
        <div className="panel absolute right-0 z-50 mt-2 w-64 p-4">
          <p className="font-display text-[15px] text-ink">{user.name}</p>
          <p className="mb-3 text-[15px] text-sepia italic">{isDm ? 'Spielleitung' : 'Spielerin oder Spieler'}</p>

          <div className="mb-3 border-t border-dashed border-rule pt-3">
            <span className="mb-1.5 flex items-center gap-2 font-display text-[10px] tracking-[0.16em] text-faint uppercase">
              <IconUsers size={13} /> Am Tisch
            </span>
            {presence.length === 0 ? (
              <p className="text-[15px] text-faint italic">niemand sonst</p>
            ) : (
              <ul className="space-y-1">
                {presence.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 text-[15px] text-sepia">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.name}
                    {p.role === 'sl' && <IconCrown size={12} className="text-gold" />}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <NavLink
            to="/chronik"
            onClick={() => setOffen(false)}
            className="flex min-h-11 items-center gap-2.5 text-sepia hover:text-ink md:hidden"
          >
            <IconQuill size={16} /> Chronik
          </NavLink>
          <NavLink
            to="/hilfe"
            onClick={() => setOffen(false)}
            className="flex min-h-11 items-center gap-2.5 text-sepia hover:text-ink"
          >
            <IconHelp size={16} /> Hilfe
          </NavLink>
          <button
            onClick={() => {
              setPasswort(true);
              setOffen(false);
            }}
            className="flex min-h-11 w-full items-center gap-2.5 text-sepia hover:text-ink"
          >
            <IconKey size={16} /> Passwort wechseln
          </button>
          <button onClick={logout} className="flex min-h-11 w-full items-center gap-2.5 text-rubric hover:underline">
            <IconLogout size={16} /> Abmelden
          </button>
        </div>
      )}

      {passwort && <PasswortWechsel onClose={() => setPasswort(false)} />}
    </div>
  );
}
