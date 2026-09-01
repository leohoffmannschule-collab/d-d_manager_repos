import { NavLink, Outlet } from 'react-router-dom';
import DiceRoller from './DiceRoller.jsx';
import { useTheme } from '../lib/useTheme.js';
import { IconBook, IconCandle, IconD20, IconHelp, IconScroll, IconSun } from './icons.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Charaktere', Icon: IconScroll, end: true },
  { to: '/kompendium', label: 'Kompendium', Icon: IconBook },
  { to: '/hilfe', label: 'Hilfe', Icon: IconHelp },
];

export default function Layout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b-2 border-gold bg-leather">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-3 text-leather-ink">
            <IconD20 size={26} className="text-gold-soft" />
            <span className="font-display text-base tracking-[0.16em] uppercase sm:text-lg">Abenteuer-Almanach</span>
          </NavLink>

          <div className="flex items-center gap-1">
            <nav className="hidden gap-1 md:flex">
              {NAV_ITEMS.map(({ to, label, Icon, end }) => (
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
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 md:pb-12">
        <Outlet />
      </main>

      <DiceRoller />

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-gold bg-leather md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 font-display text-[11px] tracking-[0.08em] ${
                isActive ? 'text-gold-soft' : 'text-leather-dim'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
