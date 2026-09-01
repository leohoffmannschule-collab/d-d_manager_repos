import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewCharacter from './pages/NewCharacter.jsx';
import CharacterSheet from './pages/CharacterSheet.jsx';
import Compendium from './pages/Compendium.jsx';
import Help from './pages/Help.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/neu" element={<NewCharacter />} />
        <Route path="/charaktere/:id" element={<CharacterSheet />} />
        <Route path="/kompendium" element={<Compendium />} />
        <Route path="/hilfe" element={<Help />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
