import { merge } from 'webpack-merge';
import commonConfig from './webpack.config.js';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { config } from '@dotenvx/dotenvx';

config();
const DEV_SERVER_PORT = 8080;

export default merge(commonConfig, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    historyApiFallback: true,
    port: DEV_SERVER_PORT,
    hot: true,
    server: 'https',
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      // Enable JSON body parsing for Watson API endpoints
      devServer.app.use('/api/watson', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              req.body = body ? JSON.parse(body) : {};
              next();
            } catch (error) {
              res.status(400).json({ error: 'Invalid JSON' });
            }
          });
        } else {
          next();
        }
      });

      // Secure Watson API proxy - credentials never exposed to client
      const WATSON_BASE_URL = 'https://api.us-east.assistant.watson.cloud.ibm.com';
      const WATSON_API_KEY = process.env.API_KEY;
      const WATSON_ASSISTANT_ID = process.env.ASSISTANT_ID;
      const WATSON_ENVIRONMENT_ID = process.env.ENVIRONMENT_ID;
      const WATSON_VERSION = process.env.VERSION;

      // POST /api/watson/session - Create Watson session (no credentials exposed)
      devServer.app.post('/api/watson/session', async (req, res) => {
        try {
          const encodedAPIkey = Buffer.from(`apikey:${WATSON_API_KEY}`).toString('base64');
          const url = `${WATSON_BASE_URL}/v2/assistants/${WATSON_ASSISTANT_ID}/environments/${WATSON_ENVIRONMENT_ID}/sessions?version=${WATSON_VERSION}`;

          const response = await fetch(url, {
            headers: {
              Authorization: `Basic ${encodedAPIkey}`,
            },
            method: 'POST',
          });

          if (!response.ok) {
            throw new Error(`Watson API error: ${response.status}`);
          }

          const result = await response.json();
          res.json(result);
        } catch (error) {
          console.error('Watson session creation failed:', error);
          res.status(500).json({ error: 'Failed to create Watson session' });
        }
      });

      // POST /api/watson/message - Send message to Watson (no credentials exposed)
      devServer.app.post('/api/watson/message', async (req, res) => {
        try {
          const { userInput, sessionId, email } = req.body;

          if (!sessionId) {
            return res.status(400).json({ error: 'Missing sessionId' });
          }

          const encodedAPIkey = Buffer.from(`apikey:${WATSON_API_KEY}`).toString('base64');
          const url = `${WATSON_BASE_URL}/v2/assistants/${WATSON_ASSISTANT_ID}/environments/${WATSON_ENVIRONMENT_ID}/sessions/${sessionId}/message?version=${WATSON_VERSION}`;

          const response = await fetch(url, {
            headers: {
              Authorization: `Basic ${encodedAPIkey}`,
              'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify({
              user_id: email,
              input: {
                message_type: 'text',
                text: userInput,
              },
            }),
          });

          if (!response.ok) {
            throw new Error(`Watson API error: ${response.status}`);
          }

          const result = await response.json();
          res.json(result);
        } catch (error) {
          console.error('Watson message failed:', error);
          res.status(500).json({ error: 'Failed to send message to Watson' });
        }
      });

      return middlewares;
    },
    proxy: [
      {
        context: (path) => path.includes('/oauth2/'),
        target: process.env.AUTH_URL,
        secure: false,
        changeOrigin: true,
        autoRewrite: false,
        toProxy: true,
        headers: {
          'X-Forwarded-Host': `localhost:${DEV_SERVER_PORT}`,
        },
        onProxyRes: (proxyRes) => {
          const location = proxyRes.headers['location'];
          if (location) {
            proxyRes.headers['location'] = location.replace(
              'konflux-ui.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com%2Foauth2',
              `localhost:${DEV_SERVER_PORT}/oauth2`,
            );
          }
        },
      },
      {
        context: (path) => path.includes('/api/k8s/registration'),
        target: process.env.REGISTRATION_URL,
        secure: false,
        changeOrigin: true,
        autoRewrite: true,
        ws: true,
        toProxy: true,
        // pathRewrite: { '^/api/k8s/registration': '' },
      },
      {
        context: (path) => path.includes('/api/k8s'),
        target: process.env.PROXY_URL,
        secure: false,
        changeOrigin: true,
        autoRewrite: true,
        ws: true,
        toProxy: true,
        // pathRewrite: { '^/api/k8s': '' },
      },
      {
        context: (path) => path.includes('/wss/k8s'),
        target: process.env.PROXY_WEBSOCKET_URL,
        secure: false,
        changeOrigin: true,
        autoRewrite: true,
        ws: true,
        toProxy: true,
        // pathRewrite: { '^/wss/k8s': '' },
      },
    ],
  },
  module: {
    rules: [
      {
        test: /\.s?[ac]ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.[jt]sx?$/i,
        exclude: /(node_modules)/,
        use: [
          {
            loader: 'swc-loader',
            options: {
              jsc: {
                transform: {
                  react: {
                    development: true,
                    refresh: true,
                  },
                },
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [new ReactRefreshWebpackPlugin(), new ForkTsCheckerWebpackPlugin({ devServer: false })],
});
