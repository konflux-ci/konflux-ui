#!/usr/bin/env bash
set -euo pipefail

MIN_NODE_VERSION=20

if ! command -v node &>/dev/null; then
  echo "Error: Node.js >= ${MIN_NODE_VERSION} is required. Install from https://nodejs.org/"
  exit 1
fi

NODE_MAJOR=$(node -e "console.log(process.version.split('.')[0].slice(1))")
if [ "$NODE_MAJOR" -lt "$MIN_NODE_VERSION" ]; then
  echo "Error: Node.js >= ${MIN_NODE_VERSION} required, found $(node --version)"
  exit 1
fi

echo "Enabling Corepack..."
corepack enable

echo "Installing dependencies..."
yarn install

echo ""
echo "Starting dev server..."
yarn start
