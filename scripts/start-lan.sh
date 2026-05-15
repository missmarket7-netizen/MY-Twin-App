#!/usr/bin/env bash
set -e

echo "Detecting host IP to set EXPO_PUBLIC_API_URL..."
# try to get the primary IP address
HOST_IP=""
if command -v ip >/dev/null 2>&1; then
  HOST_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '/src/ {print $7; exit}')
fi
if [ -z "$HOST_IP" ]; then
  # fallback
  HOST_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi
if [ -z "$HOST_IP" ]; then
  echo "Could not detect host IP. Please set EXPO_PUBLIC_API_URL manually to http://<HOST_IP>:8000"
  exec npx expo start --lan --clear
else
  export EXPO_PUBLIC_API_URL="http://$HOST_IP:8000"
  echo "Set EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL"
  echo "Starting Expo (LAN). Ensure your phone is on the same Wi-Fi network:"
  echo " - Open Expo Go and scan the QR or enter: exp://$HOST_IP:8081"
  exec npx expo start --lan --clear
fi
