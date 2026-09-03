import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { Fleuron, IconD20Detailed, IconKey, IconQuill } from '../components/icons.jsx';

export default function Login() {
  const { needsSetup, login, register } = useAuth();
  // Ohne Konten führt kein Weg an der Einrichtung vorbei.
  const [modus, setModus] = useState(needsSetup ? 'einrichten' : 'anmelden');
  const [name, setName] = useState('');
  const [passwort, setPasswort] = useState('');
  const [einladung, setEinladung] = useState('');
  const [fehler, setFehler] = useState('');
  const [laeuft, setLaeuft] = useState(false);

  const aktuellerModus = needsSetup ? 'einrichten' : modus;

  async function absenden(e) {
    e.preventDefault();
    setFehler('');
    setLaeuft(true);
    try {
      if (aktuellerModus === 'anmelden') {
        await login(name, passwort);
      } else {
        await register({ name, password: passwort, invite: einladung });
      }
    } catch (err) {
      setFehler(err.message);
    } finally {
      setLaeuft(false);
    }
  }

  const titel = {
    anmelden: 'Tritt ein',
    einrichten: 'Den Almanach eröffnen',
    beitreten: 'Der Runde beitreten',
  }[aktuellerModus];

  const untertitel = {
    anmelden: 'Nenne deinen Namen, und die Pforte öffnet sich.',
    einrichten: 'Das erste Konto führt die Spielleitung und verwaltet die Runde.',
    beitreten: 'Mit dem Einladungscode deiner Spielleitung.',
  }[aktuellerModus];

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <IconD20Detailed size={44} className="text-gold" />
          <h1 className="font-initial text-4xl text-ink">Abenteuer-Almanach</h1>
          <div className="flex items-center gap-2.5">
            <span className="h-px w-10 bg-rule" />
            <Fleuron className="text-gold" />
            <span className="h-px w-10 bg-rule" />
          </div>
        </div>

        <form onSubmit={absenden} className="panel p-6">
          <h2 className="font-display text-[15px] font-semibold tracking-[0.14em] text-rubric uppercase">{titel}</h2>
          <p className="mt-1 mb-5 text-sepia italic">{untertitel}</p>

          <label className="mb-4 block">
            <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="username"
              autoFocus
              className="field-box"
              placeholder="Wie man dich am Tisch ruft"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">Passwort</span>
            <input
              type="password"
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
              autoComplete={aktuellerModus === 'anmelden' ? 'current-password' : 'new-password'}
              className="field-box"
              placeholder={aktuellerModus === 'anmelden' ? '' : 'mindestens acht Zeichen'}
            />
          </label>

          {aktuellerModus === 'beitreten' && (
            <label className="mb-4 block">
              <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
                Einladungscode
              </span>
              <input
                value={einladung}
                onChange={(e) => setEinladung(e.target.value.toUpperCase())}
                className="field-box font-display tracking-[0.14em]"
                placeholder="ABCD-EFGH-JKLM"
              />
            </label>
          )}

          {fehler && (
            <p className="mb-4 border-l-[3px] border-rubric bg-rubric/10 px-3.5 py-2.5 text-rubric">{fehler}</p>
          )}

          <button type="submit" disabled={laeuft} className="btn btn-seal w-full disabled:opacity-60">
            {aktuellerModus === 'anmelden' ? <IconKey size={17} /> : <IconQuill size={17} />}
            {laeuft ? 'einen Augenblick …' : aktuellerModus === 'anmelden' ? 'Anmelden' : 'Konto anlegen'}
          </button>

          {!needsSetup && (
            <button
              type="button"
              onClick={() => {
                setModus(aktuellerModus === 'anmelden' ? 'beitreten' : 'anmelden');
                setFehler('');
              }}
              className="mt-4 min-h-11 w-full text-sepia italic hover:text-ink"
            >
              {aktuellerModus === 'anmelden'
                ? 'Du hast einen Einladungscode? Konto anlegen'
                : 'Du hast schon ein Konto? Anmelden'}
            </button>
          )}
        </form>

        <p className="mt-5 text-center text-[15px] text-faint italic">
          Der Almanach läuft auf dem eigenen Rechner. Nichts davon verlässt dein Haus.
        </p>
      </div>
    </div>
  );
}
