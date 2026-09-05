#!/usr/bin/env sh
#
# Welche Adresse hat der Almanach gerade?
#
#   ./scripts/adresse.sh
#
# Die Arbeit macht scripts/adresse.mjs – in Node geschrieben, damit derselbe
# Befehl unter Windows, macOS und auf dem Raspberry Pi dasselbe tut. Diese
# Hülle bleibt bestehen, weil sie in Anleitungen und Verknüpfungen steht.
set -eu
exec node "$(dirname "$0")/adresse.mjs" "$@"
