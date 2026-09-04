import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import DiceRoller from './DiceRoller.jsx';
import Wurfmeldung from './Wurfmeldung.jsx';
import { useTheme } from '../lib/useTheme.js';
import { useAuth } from '../lib/auth.jsx';
import { useLiveStatus } from '../lib/live.jsx';
import { authApi } from '../lib/api.js';
import {
  IconBook,
  IconCandle,
  IconCrown,
  IconD20,
  IconHelp,
  IconKey,
  IconLogout,
  IconMap,
  IconQuill,
  IconScroll,
  IconSun,
  IconUsers,
} from './icons.jsx';

function navItems(isDm) {
  return [
    { to: '/', label: 'Charaktere', Icon: IconScroll, end: true },
    { to: '/tisch', label: 'Spieltisch', Icon: IconMap },
    { to: '/kompendium', label: 'Kompendium', Icon: IconBook },
    { to: '/chronik', label: 'Chronik', Icon: IconQuill },
    ...(isDm ? [{ to: '/spielleitung', label: 'Spielleitung', Icon: IconCrown }] : []),
  ];
}

/** Kleiner Punkt, der zeigt, ob der Draht zum Spieltisch steht. */
function Verbindung({ connected }) {
  return (
    <span
      title={connected ? 'Mit dem Spieltisch verbunden' : 'Verbindung unterbrochen – es wird neu geknüpft'}
      className={`h-2 w-2 shrink-0 rounded-full ${connected ? 'bg-gold-soft' : 'animate-pulse bg-rubric'}`}
    />
  );
}

function PasswortWechsel({ onClose }) {
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

function Konto() {
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

export default function Layout() {
  const { theme, toggleTheme } = useTheme();
  const { isDm } = useAuth();
  const items = navItems(isDm);

  // Auf dem Telefon ist unten nur Platz für das, was während des Spiels
  // angetippt wird. Die Chronik liest man hinterher – sie steht oben in der
  // Leiste und im Kontomenü, aber nicht im Daumenbereich.
  const unten = items.filter((i) => i.to !== '/chronik');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b-2 border-gold bg-leather">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-3 text-leather-ink">
            <IconD20 size={26} className="text-gold-soft" />
            <span className="font-display text-base tracking-[0.16em] uppercase sm:text-lg">Abenteuer-Almanach</span>
          </NavLink>

          <div className="flex items-center gap-1">
            <nav className="hidden gap-1 md:flex">
              {items.map(({ to, label, Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 border px-3.5 py-2.5 font-display text-[13px] tracking-[0.10em] transition ${
                      isActive
                        ? 'border-gold bg-gold/15 text-leather-ink'
                        : 'border-transparent text-leather-dim hover:text-leather-ink'
                    }`
                  }
                >
                  <Icon size={17} />
                  {label}
                </NavLink>
              ))}
            </nav>

            <button
              onClick={toggleTheme}
              className="flex h-11 w-11 items-center justify-center border border-transparent text-leather-dim hover:border-gold hover:text-leather-ink"
              aria-label={theme === 'kerzenlicht' ? 'Zu Pergament wechseln' : 'Zu Kerzenlicht wechseln'}
              title={theme === 'kerzenlicht' ? 'Pergament' : 'Kerzenlicht'}
            >
              {theme === 'kerzenlicht' ? <IconSun size={19} /> : <IconCandle size={19} />}
            </button>

            <Konto />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 md:pb-12">
        <Outlet />
      </main>

      <Wurfmeldung />
      <DiceRoller />

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-gold bg-leather md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {unten.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 font-display text-[11px] tracking-[0.06em] ${
                isActive ? 'text-gold-soft' : 'text-leather-dim'
              }`
            }
          >
            <Icon size={20} />
            <span className="w-full truncate text-center">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
