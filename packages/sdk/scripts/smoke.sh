#!/bin/bash
# Builds an IIFE bundle of the requested config flavor (default: development,
# i.e. staging backends) and serves the smoke page over local HTTP. The page
# asks for an API key at runtime and never persists it.
# Usage: ./scripts/smoke.sh [development|production|local]
# `local` expects a gitignored src/config/config.local.ts (per-developer backends).
set -euo pipefail
cd "$(dirname "$0")/.."

FLAVOR="${1:-development}"

./scripts/set-config.sh "$FLAVOR"
pnpm exec esbuild src/index.ts --bundle --platform=browser --format=iife \
  --global-name=DialogSDK --outfile=smoke/dialog-sdk.dev.js
./scripts/set-config.sh production

echo "Smoke page: http://localhost:4173/search.html"
python3 -m http.server 4173 --directory smoke
