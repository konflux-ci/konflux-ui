import { merge } from 'webpack-merge';
import commonConfig from './webpack.config.js';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

/**
 * Webpack configuration for building an instrumented version of the application
 * for collecting e2e test code coverage using Istanbul/V8.
 *
 * This configuration uses babel-loader with babel-plugin-istanbul to instrument
 * the code, which allows coverage data to be collected via window.__coverage__
 * during Cypress e2e tests.
 */
export default merge(commonConfig, {
  mode: 'production',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.s?[ac]ss$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
      {
        test: /\.[jt]sx?$/i,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: { esmodules: true } }],
              ['@babel/preset-react', { runtime: 'automatic' }],
              '@babel/preset-typescript',
            ],
            plugins: [
              [
                'istanbul',
                {
                  extension: ['.js', '.jsx', '.ts', '.tsx'],
                  exclude: [
                    '**/*.spec.ts',
                    '**/*.spec.tsx',
                    '**/*.test.ts',
                    '**/*.test.tsx',
                    '**/node_modules/**',
                    '**/coverage/**',
                    '**/__tests__/**',
                    '**/__mocks__/**',
                  ],
                },
              ],
            ],
          },
        },
      },
    ],
  },
  plugins: [new MiniCssExtractPlugin({ filename: '[name].css' })],
});
