#!/usr/bin/env bash
set -euo pipefail

# Configure the UI to connect to a locally running Konflux deployment.
echo "Configuring .env for locally running Konflux"
cat > .env << EOL
AUTH_URL=https://localhost:9443/
REGISTRATION_URL=https://localhost:9443/
PROXY_URL=https://localhost:9443/
PROXY_WEBSOCKET_URL=wss://localhost:9443
EOL

echo "Trust your local deployment CA in the system/browser trust stores and set NODE_EXTRA_CA_CERTS for Node if needed."
echo "Ensure AUTH_URL matches your deployment's Dex issuer hostname and use the same hostname for all four targets."
echo "Run yarn start, open https://localhost:8080, and sign in through the UI."
