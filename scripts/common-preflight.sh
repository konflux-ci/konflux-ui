#!/usr/bin/env bash
set -euo pipefail
if ! python3 -c "import jsonschema" 2>/dev/null; then
  echo "ERROR: Python package 'jsonschema' is not installed." >&2
  echo "Install it with: pip3 install jsonschema" >&2
  exit 1
fi
