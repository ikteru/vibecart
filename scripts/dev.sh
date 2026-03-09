#!/usr/bin/env bash
# dev.sh — Start Next.js dev server + ngrok tunnel together.
# Run via: npm run dev
# Access the app at: https://$NGROK_DOMAIN  (or http://localhost:3500)

set -e

PORT=3500

# Load .env.local so NGROK_DOMAIN and NGROK_AUTHTOKEN are available
if [ -f ".env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

# Validate ngrok config
if [ -z "$NGROK_AUTHTOKEN" ]; then
  echo "⚠️  NGROK_AUTHTOKEN not set in .env.local — skipping ngrok tunnel"
  echo "   Add NGROK_AUTHTOKEN=<token> to .env.local to enable tunneling"
  exec npx next dev -p $PORT
fi

if [ -z "$NGROK_DOMAIN" ]; then
  echo "⚠️  NGROK_DOMAIN not set in .env.local — ngrok will use a random URL"
fi

# Kill any leftover ngrok processes on exit
cleanup() {
  if [ -n "$NGROK_PID" ] && kill -0 "$NGROK_PID" 2>/dev/null; then
    kill "$NGROK_PID"
  fi
}
trap cleanup EXIT INT TERM

# Start ngrok in the background
if [ -n "$NGROK_DOMAIN" ]; then
  ngrok http --domain="$NGROK_DOMAIN" --authtoken="$NGROK_AUTHTOKEN" $PORT > /dev/null 2>&1 &
else
  ngrok http --authtoken="$NGROK_AUTHTOKEN" $PORT > /dev/null 2>&1 &
fi
NGROK_PID=$!

echo ""
echo "🚇 ngrok tunnel starting..."
echo "   Tunnel URL : https://${NGROK_DOMAIN:-see http://localhost:4040}"
echo "   Local URL  : http://localhost:$PORT"
echo "   ngrok UI   : http://localhost:4040"
echo ""

# Start Next.js dev server (foreground — Ctrl+C stops everything)
exec npx next dev -p $PORT
