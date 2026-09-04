# syntax=docker/dockerfile:1

# --- Oberfläche bauen ---
FROM node:22-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
# `npm ci` statt `npm install`: baut genau die Fassungen aus der Sperrdatei.
# Sonst könnte derselbe Befehl in einem halben Jahr etwas anderes ergeben.
RUN npm ci
COPY frontend ./
RUN npm run build

# --- Server ---
FROM node:22-bookworm-slim AS backend
WORKDIR /app

# Kein Compiler nötig: Node 22 bringt SQLite selbst mit (node:sqlite).
# Deshalb wird die optionale Abhängigkeit better-sqlite3 hier weggelassen.
COPY backend/package*.json ./
RUN npm ci --omit=dev --omit=optional

COPY backend ./
COPY --from=frontend-build /app/frontend/dist ./public

ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data

# Der Almanach läuft nicht als Root. Der Ordner wird schon hier angelegt und
# übereignet, damit das Datenverzeichnis beim ersten Start der richtigen
# Kennung gehört.
RUN mkdir -p /app/data && chown -R node:node /app
USER node

VOLUME ["/app/data"]
EXPOSE 3001

# Ein abgestürzter Server wird von Docker neu gestartet – ein hängender nicht.
# Deshalb fragt der Container sich selbst, ob er noch antwortet. Node bringt
# `fetch` mit; es braucht also weder curl noch wget im Abbild.
HEALTHCHECK --interval=60s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
