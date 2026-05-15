#!/usr/bin/env bash
set -euo pipefail

echo "Trying to start Expo with tunnel (ngrok)..."

# Attempt to start Expo with tunnel first. If it exits with non-zero, fall back to LAN.
if npx expo start --tunnel --clear; then
  echo "Expo started with tunnel."
  exit 0
else
  echo "Tunnel failed or exited. Falling back to LAN..."
  npx expo start --lan --clear
fi
