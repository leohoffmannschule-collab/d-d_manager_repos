/**
 * Die Seite für Adressen, die es nicht gibt.
 *
 * Eingehängt in App.jsx als `path="*"` – der Stern greift, wenn keine der
 * davor genannten Adressen passt. Sie steht *innerhalb* des Layouts, damit
 * die Kopfleiste stehen bleibt und man mit einem Klick zurückfindet.
 */
import { Link } from 'react-router-dom';
import { IconMap } from '../components/icons.jsx';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <IconMap size={38} className="text-faint" />
      <p className="text-sepia italic">Diese Seite ist noch nicht kartografiert.</p>
      <Link to="/" className="btn btn-plate">
        Zurück zum Almanach
      </Link>
    </div>
  );
}
