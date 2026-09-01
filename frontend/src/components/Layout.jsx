import { NavLink, Outlet } from 'react-router-dom';
import DiceRoller from './DiceRoller.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Charaktere', icon: '📜', end: true },
  { to: '/kompendium', label: 'Kompendium', icon: '📖' },
  { to: '/hilfe', label: 'Hilfe', icon: '❓' },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-ink-950">
      <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <NavLink to="/" className="font-display text-xl tracking-wide text-gold-400">
            Abenteuer-Almanach
          </NavLink>
          <nav className="hidden gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-ink-800 text-gold-400' : 'text-parchment-100/70 hover:bg-ink-900'
                  }`
                }
              >
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-4 md:pb-10">
        <Outlet />
      </main>

      <DiceRoller />

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-ink-800 bg-ink-950/95 backdrop-blur md:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                isActive ? 'text-gold-400' : 'text-parchment-100/60'
              }`
            }
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
