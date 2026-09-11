#!/usr/bin/env bash
#
# Den Vorposten einrichten – einmal, auf dem kleinen Server.
#
#   sudo bash vorposten.sh www.deinemudda.fun "ssh-ed25519 AAAA… dein@laptop" [3001] [du@example.de]
#
# Ein Laptop hat keine feste Adresse im Netz. Die Domain zeigt deshalb nicht
# auf ihn, sondern auf diesen Vorposten: einen kleinen Server, der immer am
# selben Fleck steht. Bei Oracle ist so einer dauerhaft kostenlos.
#
# Hier laufen nur zwei Dinge: ein nginx, der die Domain bedient und das
# Let's-Encrypt-Zertifikat hält, und ein Benutzer `tunnel`, bei dem sich der
# Laptop meldet. Der Almanach selbst bleibt auf dem Laptop – hier liegen keine
# Daten, keine Charaktere, keine Karten.
#
#   Browser → www.deinemudda.fun → nginx (hier) → SSH-Leitung → Laptop
#
# Das Skript darf mehrfach laufen; es ändert nur, was noch nicht stimmt.
set -euo pipefail

DOMAENE="${1:-}"
SCHLUESSEL="${2:-}"
PORT="${3:-3001}"
EPOST="${4:-}"

sagen() { printf '%s\n' "$*"; }
fehler() { printf '\n  %s\n\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fehler "Bitte mit sudo starten:  sudo bash vorposten.sh …"
[ -n "$DOMAENE" ] || fehler "Erster Wert fehlt: die Domain, etwa www.deinemudda.fun"

if [ -z "$SCHLUESSEL" ]; then
  sagen ""
  sagen "  Jetzt den öffentlichen Schlüssel des Laptops einfügen."
  sagen "  Auf dem Laptop steht er in ~/.ssh/id_ed25519.pub (Windows:"
  sagen "  C:\\Users\\DeinName\\.ssh\\id_ed25519.pub). Gibt es dort noch keinen:"
  sagen "    ssh-keygen -t ed25519"
  sagen ""
  read -r -p "  Schlüssel: " SCHLUESSEL
fi
case "$SCHLUESSEL" in
  ssh-*|ecdsa-*) : ;;
  *) fehler "Das sieht nicht nach einem öffentlichen SSH-Schlüssel aus (erwartet: ssh-ed25519 …)." ;;
esac

sagen ""
sagen "  Vorposten für $DOMAENE einrichten …"
sagen ""

# --- 1. nginx und certbot ---------------------------------------------------
sagen "  [1/5] nginx und certbot holen …"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq nginx certbot python3-certbot-nginx >/dev/null

# --- 2. Der Benutzer für die Leitung ----------------------------------------
# Ohne Anmeldeschale: Dieser Zugang soll eine Leitung halten und sonst nichts.
# `ssh -N` braucht keine, es wird ja kein Befehl ausgeführt.
sagen "  [2/5] Benutzer 'tunnel' anlegen …"
if ! id tunnel >/dev/null 2>&1; then
  useradd --create-home --shell /usr/sbin/nologin tunnel
fi
install -d -m 700 -o tunnel -g tunnel /home/tunnel/.ssh
touch /home/tunnel/.ssh/authorized_keys
grep -qxF "$SCHLUESSEL" /home/tunnel/.ssh/authorized_keys \
  || printf '%s\n' "$SCHLUESSEL" >> /home/tunnel/.ssh/authorized_keys
chown tunnel:tunnel /home/tunnel/.ssh/authorized_keys
chmod 600 /home/tunnel/.ssh/authorized_keys

# Diesem Zugang nur das erlauben, wofür er da ist: eine Rückleitung auf genau
# diesen einen Port. Wer den Schlüssel hätte, käme damit an nichts sonst heran.
cat > /etc/ssh/sshd_config.d/almanach-tunnel.conf <<SSHDENDE
Match User tunnel
    AllowTcpForwarding remote
    PermitListen localhost:$PORT
    PermitTTY no
    X11Forwarding no
    AllowAgentForwarding no
SSHDENDE
sshd -t
systemctl reload ssh 2>/dev/null || systemctl reload sshd

# --- 3. nginx: die Domain auf die Leitung ----------------------------------
# Wichtig ist `proxy_buffering off`: Der Almanach hält eine offene Leitung, über
# die er Würfe, Züge und Kartenwechsel sofort an alle schickt. Mit Pufferung
# hielte nginx das zurück, und am Tisch käme alles erst verspätet an – der
# Almanach sähe dann "kaputt" aus, ohne dass ein Fehler zu sehen wäre.
sagen "  [3/5] nginx auf $DOMAENE einstellen …"
cat > /etc/nginx/sites-available/almanach <<NGINXENDE
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAENE;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;

        proxy_set_header Host              \$host;
        proxy_set_header X-Real-IP         \$remote_addr;
        proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Der Live-Kanal des Almanachs (Server-Sent Events) darf nicht
        # gepuffert und nicht nach einer Minute gekappt werden.
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 24h;

        # Karten und Bildnisse dürfen bis 12 MB groß sein.
        client_max_body_size 16m;
    }
}
NGINXENDE
ln -sf /etc/nginx/sites-available/almanach /etc/nginx/sites-enabled/almanach
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# --- 4. Die Wand aufmachen --------------------------------------------------
# Oracle-Abbilder bringen eigene Regeln mit, die alles außer SSH verwerfen.
# Das ist die Stolperstelle schlechthin: In der Weboberfläche steht Port 443
# längst offen, und trotzdem kommt niemand herein.
sagen "  [4/5] Ports 80 und 443 örtlich freigeben …"
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow 80/tcp >/dev/null
  ufw allow 443/tcp >/dev/null
else
  for p in 80 443; do
    iptables -C INPUT -p tcp --dport "$p" -j ACCEPT 2>/dev/null \
      || iptables -I INPUT 1 -p tcp --dport "$p" -m state --state NEW -j ACCEPT
  done
  command -v netfilter-persistent >/dev/null 2>&1 && netfilter-persistent save >/dev/null || true
fi

# --- 5. Das Zertifikat ------------------------------------------------------
sagen "  [5/5] Zertifikat von Let's Encrypt holen …"
sagen ""
# Mit E-Post warnt Let's Encrypt, wenn eine Erneuerung ausbleibt – ohne sie
# merkt man es erst daran, dass die Runde vor einer Warnseite steht.
if [ -n "$EPOST" ]; then ANMELDUNG=(-m "$EPOST"); else ANMELDUNG=(--register-unsafely-without-email); fi
if certbot --nginx -d "$DOMAENE" --non-interactive --agree-tos "${ANMELDUNG[@]}" --redirect; then
  sagen ""
  sagen "  ────────────────────────────────────────────────────────────"
  sagen "  Der Vorposten steht."
  sagen ""
  sagen "  Auf dem Laptop gehört jetzt in die .env:"
  sagen "    DOMAENE=$DOMAENE"
  sagen "    TUNNEL_ZIEL=tunnel@$DOMAENE"
  sagen ""
  sagen "  Dann dort:  npm start   und   npm run tunnel"
  sagen "  ────────────────────────────────────────────────────────────"
  sagen ""
else
  sagen ""
  fehler "Das Zertifikat kam nicht. Fast immer liegt es daran, dass die Domain
  noch nicht auf diesen Server zeigt oder die Wand in der Oracle-Weboberfläche
  noch zu ist:

    - Zeigt $DOMAENE hierher?   dig +short $DOMAENE
    - Ingress-Regeln für 80 und 443 unter Networking → Virtual Cloud Networks
      → dein VCN → Security Lists?

  Beides richten und dieses Skript noch einmal laufen lassen."
fi
