#!/usr/bin/env sh
#
# Den Weg von außen aufmachen – für macOS und Linux.
#
#   ./tunnel.sh
#
# Dieses Fenster ist die Leitung: Solange es offen ist, erreicht die Runde den
# Almanach von überall. Beenden mit Strg+C – der Almanach selbst läuft davon
# unbeirrt weiter, der steht im anderen Fenster.
set -eu
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js ist auf diesem Rechner nicht zu finden."
  echo "  Zu holen unter https://nodejs.org – die LTS-Fassung genügt."
  echo ""
  exit 1
fi

exec node scripts/tunnel.mjs "$@"
