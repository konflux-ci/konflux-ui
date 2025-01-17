# Change configs to connect the UI with locally running Konflux
# Mainly for the PR check but can be used locally too  
echo "Patching .env and webpack.dev.config.js"
cat > .env << EOL 
AUTH_URL=https://127.0.0.1:9443/
REGISTRATION_URL=https://127.0.0.1:9443/
PROXY_URL=https://127.0.0.1:9443/
PROXY_WEBSOCKET_URL=wss://127.0.0.1:9443
EOL

# regex cheatsheet
# [^ ].* - take everything before the text but leave spaces
#  0, - replace just the first occurence
# 
sed -i "s%[^ ].*\/oauth2\/.*%context: (path) => path.includes('/oauth2/') || path.includes('/idp/'),%g" webpack.dev.config.js 
sed -i '0,/autoRewrite: false,/s//autoRewrite: true,/' webpack.dev.config.js 
sed -i "s/[^ ].*stone-stg-rh01.*/'localhost:9443',/" webpack.dev.config.js
sed -i "s/[^ ].*stone-stg-rh01.*/'localhost:9443',/" webpack.dev.config.js
sed -i "s/[^ ].*DEV_SERVER_PORT}\/oauth2\`,/\`localhost:\${DEV_SERVER_PORT}\`,/" webpack.dev.config.js

echo "Patching done, UI is connected to locally running Konflux."