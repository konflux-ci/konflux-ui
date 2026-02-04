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
  plugins: [new ReactRefreshWebpackPlugin(), new ForkTsCheckerWebpackPlugin({ devServer: false })],
});
