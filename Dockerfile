# syntax=docker/dockerfile:1

# --- Frontend build stage ---
FROM node:22-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# --- Backend runtime stage ---
FROM node:22-bookworm-slim AS backend
# better-sqlite3 needs build tools to compile its native addon on arm64.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend ./
COPY --from=frontend-build /app/frontend/dist ./public

ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data
VOLUME ["/app/data"]

EXPOSE 3001
CMD ["node", "src/server.js"]
