/**
 * Der Rahmen um jede Seite: Kopfleiste oben, Seiteninhalt darunter, und die
 * drei schwebenden Dinge, die es überall gibt – Würfelbeutel, Chat und
 * Klangleiste.
 *
 * `<Outlet />` weiter unten ist der Platzhalter, an dem React Router die
 * jeweilige Seite einsetzt. In App.jsx stehen die Seiten deshalb als
 * Kinder von `<Route element={<Layout />}>`: Alles darin bekommt diesen
 * Rahmen, die Anmeldung und die Kampagnenwahl nicht.
 *
 * Dass Würfelbeutel und Chat *hier* hängen und nicht auf den einzelnen
 * Seiten, ist der Grund, warum ein Wurf nicht verlorengeht, wenn jemand
 * mitten im Kampf auf sein Charakterblatt wechselt.
 *
 * Was in der Kopfleiste rechts steht, steht nebenan in rahmen/:
 *
 *   rahmen/navigation.js        welche Wege es gibt (und für wen)
 *   rahmen/KampagneSchalter.jsx zwischen den eigenen Geschichten wechseln
 *   rahmen/Konto.jsx            Aussehen, Kennwort, Abmelden
 *   rahmen/PasswortWechsel.jsx  das Kennwort ändern
 *   rahmen/Verbindung.jsx       der Punkt, der zeigt, ob der Draht steht
 */
import { NavLink, Outlet } from 'react-router-dom';
import Chat from './Chat.jsx';
import DiceRoller from './DiceRoller.jsx';
import Klangleiste from './klang/Klangleiste.jsx';
import Wurfmeldung from './Wurfmeldung.jsx';
import Stoerung from './Stoerung.jsx';
import { useTheme } from '../lib/useTheme.js';
import { useAuth } from '../lib/auth.jsx';
import { IconCandle, IconD20, IconSun } from './icons.jsx';
import { navItems } from './rahmen/navigation.js';
import KampagneSchalter from './rahmen/KampagneSchalter.jsx';
import Konto from './rahmen/Konto.jsx';

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

            <KampagneSchalter />
            <Konto />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 md:pb-12">
        <Outlet />
      </main>

      <Wurfmeldung />
      <Stoerung />
      <Chat />
      <DiceRoller />
      <Klangleiste />

      <nav className="sicherer-fuss fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-gold bg-leather md:hidden">
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

