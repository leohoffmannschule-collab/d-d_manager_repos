/**
 * Der Startpunkt der Oberfläche – die erste Datei, die der Browser ausführt.
 *
 * Hier wird React an das leere `<div id="root">` aus der index.html gehängt.
 * Alles, was du später auf dem Schirm siehst, hängt an diesem einen Aufruf.
 *
 * Die drei Umhüllungen von außen nach innen:
 *
 *   StrictMode     – nur beim Entwickeln: React ruft manches absichtlich
 *                    doppelt auf, um unsaubere Nebenwirkungen aufzudecken.
 *                    Im fertigen Bau (npm run build) tut er nichts.
 *   BrowserRouter  – macht aus der Adresszeile den Zustand der Anwendung:
 *                    „/tisch“ zeigt den Spieltisch, ohne die Seite neu zu
 *                    laden. Welche Adresse was zeigt, steht in App.jsx.
 *   AuthProvider   – weiß, wer angemeldet ist. Muss außen liegen, weil
 *                    fast alles darunter danach fragt (siehe lib/auth.jsx).
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './lib/auth.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
