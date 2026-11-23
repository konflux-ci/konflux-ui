import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '@dotenvx/dotenvx';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { merge } from 'webpack-merge';
import {
  DEV_SERVER_HOST,
  DEV_SERVER_HOSTNAME,
  DEV_SERVER_PORT,
  LOCAL_ORIGIN,
} from '#dev-auth/constants.mjs';
import commonConfig from './webpack.config.js';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start with `yarn start`: the launcher supplies authProxy. Webpack CLI's
// (env, argv) factory arguments do not provide the authentication middleware.
export default function createDevConfig(authProxy) {
  return merge(commonConfig, {
    mode: 'development',
    devtool: 'inline-source-map',
    resolve: {
      symlinks: false,
    },
    devServer: {
      host: DEV_SERVER_HOST,
      port: DEV_SERVER_PORT,
      allowedHosts: [DEV_SERVER_HOSTNAME],
      open: [LOCAL_ORIGIN],
      historyApiFallback: { disableDotRule: true },
      hot: true,
      server: 'https',
      // The launcher owns authentication subprocesses and shutdown cleanup.
      setupExitSignals: false,
      // Authentication and Kubernetes traffic use the middleware below. Optional
      // Lightspeed traffic keeps its own proxy and never receives CLI credentials.
      proxy: [
        {
          context: ['/api/plugins/lightspeed'],
          target: process.env.LIGHTSPEED_URL,
          secure: false,
          changeOrigin: true,
          pathRewrite: (requestPath) => requestPath.replace(/^\/api\/plugins\/lightspeed/, ''),
        },
      ],
      webSocketServer: { type: 'ws', options: { path: '/ws' } },
      client: {
        webSocketURL: {
          protocol: 'wss',
          hostname: DEV_SERVER_HOSTNAME,
          port: DEV_SERVER_PORT,
          pathname: '/ws',
        },
      },
      setupMiddlewares(middlewares) {
        return [{ name: 'cli-auth', middleware: authProxy.middleware }, ...middlewares];
      },
      onListening(devServer) {
        devServer.server.on('upgrade', (req, socket, head) => {
          if (authProxy.handlesUpgrade(req)) {
            try {
              void Promise.resolve(authProxy.upgrade(req, socket, head)).catch(() =>
                socket.destroy(),
              );
            } catch {
              socket.destroy();
            }
          }
        });
        devServer.server.once('close', () => {
          void Promise.resolve()
            .then(() => authProxy.close())
            .catch(() => {});
        });
      },
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          include: path.resolve(__dirname, 'node_modules/monaco-editor'),
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.s?[ac]ss$/i,
          exclude: path.resolve(__dirname, 'node_modules/monaco-editor'), // Exclude Monaco's CSS
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'sass-loader',
              options: {
                api: 'modern-compiler',
                sassOptions: {
                  silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'if-function'],
                },
              },
            },
          ],
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
    plugins: [
      new ReactRefreshWebpackPlugin(),
      new ForkTsCheckerWebpackPlugin({ devServer: false }),
    ],
  });
}
