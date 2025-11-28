import { mergeWithRules } from 'webpack-merge';
import prodConfig from './webpack.prod.config.js';

/**
 * Webpack configuration for building an instrumented version of the application
 * for collecting e2e test code coverage using Istanbul.
 *
 * Extends the production config but replaces swc-loader with babel-loader + istanbul
 * to instrument the code for coverage collection via window.__coverage__.
 */
export default mergeWithRules({
  module: {
    rules: {
      test: 'match',
      use: 'replace',
    },
  },
})(prodConfig, {
  module: {
    rules: [
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
});
