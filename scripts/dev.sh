#!/usr/bin/env bash
# dev.sh — Start full VibeCart dev environment:
#   1. Docker infrastructure (db, auth, rest, realtime, kong)
#   2. ngrok tunnel on host
#   3. Next.js with hot reloading on host (fast — not inside Docker)
#
# Run via: npm run dev

PORT=3500
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker/docker-compose.yml"

# Load .env.local so NGROK_DOMAIN, NGROK_AUTHTOKEN, etc. are available
if [ -f "$PROJECT_DIR/.env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_DIR/.env.local"
  set +a
fi

# ─── 1. Docker infrastructure ────────────────────────────────────────────────
if command -v docker &>/dev/null && [ -f "$COMPOSE_FILE" ]; then
  echo "▶ Starting Docker infrastructure (db, auth, rest, realtime, kong)..."

  # Start containers; if stale network error, wipe containers (keeps volumes) and retry
  docker compose -f "$COMPOSE_FILE" up -d db auth rest realtime kong || {
    echo "  Stale network detected — cleaning up containers and retrying..."
    docker compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true
    docker compose -f "$COMPOSE_FILE" up -d db auth rest realtime kong
  }

  # Wait for GoTrue (auth) to be ready — required for Instagram OAuth
  printf "  Waiting for auth service"
  for i in $(seq 1 40); do
    if curl -sf http://localhost:9999/health >/dev/null 2>&1; then
      echo " ✓"
      break
    fi
    if [ "$i" -eq 40 ]; then
      echo " (timed out, continuing anyway)"
    fi
    printf "."
    sleep 1
  done
else
  echo "⚠️  Docker not available or docker-compose.yml not found — skipping infrastructure"
  echo "   Install Docker Desktop: https://www.docker.com/products/docker-desktop"
fi

# ─── 2. ngrok tunnel (on host for better performance) ───────────────────────
cleanup() {
  if [ -n "$NGROK_PID" ] && kill -0 "$NGROK_PID" 2>/dev/null; then
    kill "$NGROK_PID"
  fi
}
trap cleanup EXIT INT TERM

if [ -n "$NGROK_AUTHTOKEN" ]; then
  if [ -n "$NGROK_DOMAIN" ]; then
    ngrok http --domain="$NGROK_DOMAIN" --authtoken="$NGROK_AUTHTOKEN" $PORT >/dev/null 2>&1 &
  else
    ngrok http --authtoken="$NGROK_AUTHTOKEN" $PORT >/dev/null 2>&1 &
  fi
  NGROK_PID=$!
  echo ""
  echo "▶ ngrok tunnel:  https://${NGROK_DOMAIN:-see http://localhost:4040}"
  echo "  Local URL:     http://localhost:$PORT"
  echo "  ngrok UI:      http://localhost:4040"
  echo ""
else
  echo "⚠️  NGROK_AUTHTOKEN not set — skipping tunnel (add to .env.local to enable)"
fi

# ─── 3. Next.js dev server (hot reload, on host machine) ─────────────────────
exec npx next dev -p $PORT
