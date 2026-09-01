export default function Help() {
  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="font-display text-2xl text-parchment-50">Hilfe</h1>

      <section className="rounded-2xl border border-ink-800 bg-ink-900 p-4">
        <h2 className="mb-2 font-display text-lg text-gold-400">Über den Abenteuer-Almanach</h2>
        <p className="text-sm leading-relaxed text-parchment-100/80">
          Dieser Charaktermanager läuft auf deinem eigenen Raspberry Pi im Heimnetzwerk. Alle Charakterdaten
          werden ausschließlich lokal in einer Datenbank auf dem Pi gespeichert – nichts wird an einen
          fremden Server geschickt. Referenzdaten zu Völkern, Klassen, Zaubern und mehr werden über die
          öffentliche{' '}
          <span className="text-parchment-50">D&amp;D 5e API</span> geladen und danach lokal zwischengespeichert,
          damit das Kompendium auch bei wackeligem Internet schnell bleibt.
        </p>
      </section>

      <section className="rounded-2xl border border-ink-800 bg-ink-900 p-4">
        <h2 className="mb-2 font-display text-lg text-gold-400">Auf dem iPad zum Home-Bildschirm hinzufügen</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-parchment-100/80">
          <li>Öffne diese Seite in Safari.</li>
          <li>Tippe auf das Teilen-Symbol (Quadrat mit Pfeil nach oben).</li>
          <li>Wähle „Zum Home-Bildschirm“.</li>
          <li>Die App startet danach im Vollbild – wie eine native App, inklusive Offline-Zugriff auf zuvor geladene Inhalte.</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-ink-800 bg-ink-900 p-4">
        <h2 className="mb-2 font-display text-lg text-gold-400">Quellen &amp; Weiterführendes</h2>
        <ul className="space-y-1 text-sm text-parchment-100/80">
          <li>
            Referenzdaten:{' '}
            <a className="text-gold-400 underline" href="https://www.dnd5eapi.co/" target="_blank" rel="noreferrer">
              dnd5eapi.co
            </a>{' '}
            (5e-bits) – basiert auf dem D&amp;D 5e SRD (OGL / CC).
          </li>
          <li>
            API-Dokumentation &amp; Tutorials:{' '}
            <a className="text-gold-400 underline" href="https://5e-bits.github.io/docs/tutorials" target="_blank" rel="noreferrer">
              5e-bits.github.io/docs/tutorials
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
