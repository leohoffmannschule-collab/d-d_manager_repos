# syntax=docker/dockerfile:1

# --- Oberfläche bauen ---
FROM node:22-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# --- Server ---
FROM node:22-bookworm-slim AS backend
WORKDIR /app

# Kein Compiler nötig: Node 22 bringt SQLite selbst mit (node:sqlite).
# Deshalb wird die optionale Abhängigkeit better-sqlite3 hier weggelassen.
COPY backend/package*.json ./
RUN npm install --omit=dev --omit=optional

COPY backend ./
COPY --from=frontend-build /app/frontend/dist ./public

ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data
VOLUME ["/app/data"]

EXPOSE 3001
CMD ["node", "src/server.js"]
