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
