#!/usr/bin/env sh
#
# Welche Adresse hat der Almanach gerade?
#
# Der Schnelltunnel bekommt seine Adresse bei jedem Start neu geliehen. Sie
# steht im Protokoll von cloudflared; dieses Skript fischt sie heraus, damit
# man sie nicht suchen muss.
#
#   ./scripts/adresse.sh
#
set -eu

cd "$(dirname "$0")/.."

if ! docker compose ps --status running --services 2>/dev/null | grep -q '^cloudflared$'; then
  echo "  Der Tunnel läuft nicht. Starte ihn mit:"
  echo "    docker compose --profile tunnel up -d"
  exit 1
fi

# Die jüngste Nennung gewinnt: Nach einem Neuaufbau der Verbindung steht die
# alte Adresse noch weiter oben im Protokoll.
ADRESSE=$(docker compose logs cloudflared 2>&1 \
  | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' \
  | tail -1)

if [ -z "$ADRESSE" ]; then
  echo "  Noch keine Adresse im Protokoll. Der Tunnel braucht meist zehn bis"
  echo "  zwanzig Sekunden. Danach noch einmal versuchen."
  exit 1
fi

echo ""
echo "  Der Almanach ist erreichbar unter:"
echo ""
echo "    $ADRESSE"
echo ""
echo "  Diese Adresse ist geliehen und wechselt, wenn der Tunnel neu startet."
echo "  Nach einem Neustart des Pi also noch einmal hier nachsehen und der"
echo "  Runde die neue schicken."
echo ""
