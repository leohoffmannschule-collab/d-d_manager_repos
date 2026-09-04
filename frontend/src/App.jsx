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
import Help from './pages/Help.jsx';
import NotFound from './pages/NotFound.jsx';
import { useAuth } from './lib/auth.jsx';
import { LiveProvider } from './lib/live.jsx';

function Ladeblatt() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sepia italic">Der Almanach wird aufgeschlagen …</p>
    </div>
  );
}

/** Der Spielleitung vorbehaltene Seiten. */
function NurSpielleitung({ children }) {
  const { isDm } = useAuth();
  return isDm ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <Ladeblatt />;
  if (!user) return <Login />;

  return (
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
  );
}
