#!/usr/bin/env sh
#
# Abenteuer-Almanach starten – für macOS und Linux.
#
#   ./starten.sh
#
# Unter macOS lässt sich diese Datei auch doppelklicken, wenn man sie einmal
# in "starten.command" umbenennt. Dieses Fenster ist der Almanach: Solange es
# offen ist, läuft er. Beenden mit Strg+C.
set -eu
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js ist auf diesem Rechner nicht zu finden."
  echo "  Zu holen unter https://nodejs.org – die LTS-Fassung genügt."
  echo ""
  exit 1
fi

exec node scripts/start.mjs "$@"
