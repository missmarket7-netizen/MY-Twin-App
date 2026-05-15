#!/usr/bin/env bash
set -euo pipefail

echo "Trying to start Expo with tunnel (ngrok)..."

PORT=8081
if command -v lsof >/dev/null 2>&1 && lsof -i :8081 >/dev/null 2>&1; then
  echo "Port 8081 is busy; using 8082 instead."
  PORT=8082
fi

if npx expo start --tunnel --clear --port "$PORT"; then
  echo "Expo started with tunnel on port $PORT."
  exit 0
else
  echo "Tunnel failed or exited. Falling back to LAN on port $PORT..."
  npx expo start --lan --clear --port "$PORT"
fi
