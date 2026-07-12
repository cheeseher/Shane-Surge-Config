#!/bin/zsh
set -euo pipefail

ROOT="${0:A:h:h}"
BRAND="$ROOT/assets/brand"
OUT="$ROOT/assets/site-icons"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$OUT"

sips -s format png "$BRAND/app-icon.svg" --out "$TMP/app-1024.png" >/dev/null
sips -z 1024 1024 "$TMP/app-1024.png" --out "$OUT/icon-1024.png" >/dev/null
sips -z 512 512 "$TMP/app-1024.png" --out "$OUT/icon-512.png" >/dev/null
sips -z 512 512 "$TMP/app-1024.png" --out "$OUT/icon-512-maskable.png" >/dev/null
sips -z 192 192 "$TMP/app-1024.png" --out "$OUT/icon-192.png" >/dev/null
sips -z 180 180 "$TMP/app-1024.png" --out "$ROOT/apple-touch-icon.png" >/dev/null

sips -s format png "$BRAND/favicon.svg" --out "$TMP/favicon-1024.png" >/dev/null
sips -z 32 32 "$TMP/favicon-1024.png" --out "$OUT/favicon-32.png" >/dev/null
sips -z 16 16 "$TMP/favicon-1024.png" --out "$OUT/favicon-16.png" >/dev/null
sips -z 32 32 "$TMP/favicon-1024.png" --out "$TMP/favicon-32-source.png" >/dev/null
sips -s format ico "$TMP/favicon-32-source.png" --out "$ROOT/favicon.ico" >/dev/null

sips -s format png "$BRAND/social-preview.svg" --out "$OUT/social-preview.png" >/dev/null
sips -z 630 1200 "$OUT/social-preview.png" >/dev/null

echo "Generated Shane-Surge site icons in $OUT"
