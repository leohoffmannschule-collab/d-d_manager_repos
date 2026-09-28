/**
 * Der Grundriss der Oberfläche: welche Adresse welche Seite zeigt – und
 * welche drei Tore jemand passieren muss, bevor er überhaupt eine sieht.
 *
 * Die Tore stehen ineinander, und die Reihenfolge ist kein Zufall:
 *
 *   1. angemeldet?      – sonst die Anmeldung (Login)
 *   2. Kampagne gewählt? – sonst die Kampagnenauswahl
 *   3. Live-Draht offen  – erst jetzt lohnt er sich, denn er hängt an
 *                          genau einer Kampagne (siehe lib/live.jsx)
 *
 * Erst hinter allen dreien stehen die eigentlichen Seiten.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewCharacter from './pages/NewCharacter.jsx';
import CharacterSheet from './pages/CharacterSheet.jsx';
import Compendium from './pages/Compendium.jsx';
import Tabletop from './pages/Tabletop.jsx';
import DmBoard from './pages/DmBoard.jsx';
import Chronicle from './pages/Chronicle.jsx';
import Login from './pages/Login.jsx';
import Kampagnenwahl from './pages/Kampagnenwahl.jsx';
import Help from './pages/Help.jsx';
import NotFound from './pages/NotFound.jsx';
import { useAuth } from './lib/auth.jsx';
import { CampaignProvider, useCampaign } from './lib/campaign.jsx';
import { LiveProvider } from './lib/live.jsx';

/** Was dasteht, solange der Server noch nicht gesagt hat, wer wir sind. */
function Ladeblatt() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sepia italic">Der Almanach wird aufgeschlagen …</p>
    </div>
  );
}

/**
 * Der Spielleitung vorbehaltene Seiten.
 *
 * Wichtig für das Verständnis: Das ist reine Höflichkeit, kein Schutz. Wer
 * die Adresse von Hand eintippt, käme hier zwar nicht vorbei – aber die
 * Daten dahinter schützt allein der Server (siehe backend/src/auth.js,
 * `requireDm`). Eine Oberfläche kann man umgehen, einen Server nicht.
 */
function NurSpielleitung({ children }) {
  const { isDm } = useAuth();
  return isDm ? children : <Navigate to="/" replace />;
}

/**
 * Erst wenn eine Kampagne aktiv ist, geht es hinter die Pforte.
 *
 * Der `key={activeId}` ist der Trick in diesen zwanzig Zeilen: Ändert sich
 * der `key` eines Elements, wirft React das alte weg und baut ein neues auf,
 * statt das bestehende weiterzuverwenden. Genau das wollen wir beim Wechsel
 * der Kampagne – sonst bliebe der Live-Draht darunter an der alten Kampagne
 * hängen und der neue Tisch bekäme die Ereignisse des alten.
 */
function KampagnenTor({ children }) {
  const { activeId, loading } = useCampaign();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sepia italic">Die Kampagnen werden gesichtet …</p>
      </div>
    );
  }
  if (!activeId) return <Kampagnenwahl />;
  return <div key={activeId}>{children}</div>;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <Ladeblatt />;
  if (!user) return <Login />;

  return (
    <CampaignProvider>
      <KampagnenTor>
        <LiveProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/neu" element={<NewCharacter />} />
              <Route path="/charaktere/:id" element={<CharacterSheet />} />
              <Route path="/tisch" element={<Tabletop />} />
              <Route path="/kompendium" element={<Compendium />} />
              <Route path="/chronik" element={<Chronicle />} />
              <Route
                path="/spielleitung"
                element={
                  <NurSpielleitung>
                    <DmBoard />
                  </NurSpielleitung>
                }
              />
              <Route path="/hilfe" element={<Help />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </LiveProvider>
      </KampagnenTor>
    </CampaignProvider>
  );
}
