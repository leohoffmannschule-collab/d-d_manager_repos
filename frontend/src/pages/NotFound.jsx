import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-16 text-center text-parchment-100/60">
      <p className="mb-4 text-4xl">🗺️</p>
      <p className="mb-4">Diese Seite existiert nicht (noch nicht kartografiert).</p>
      <Link to="/" className="text-gold-400 underline">
        Zurück zur Übersicht
      </Link>
    </div>
  );
}
