import { fileURLToPath } from 'url';
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { getWebpackAliases } from './aliases.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: './src/main.tsx',
  output: {
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    clean: true,
  },
  module: {
    rules: [
      // SVGR rule specifically for overview SVGs
      {
        test: /\.svg$/i,
        include: [
          path.resolve(__dirname, 'src/assets'),
          path.resolve(__dirname, 'src/shared/assets'),
        ],
        exclude: path.resolve(__dirname, 'src/assets/iconsUrl'),
        issuer: /\.[jt]sx?$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              typescript: true,
              replaceAttrValues: {
                '#FC783D': 'var(--konflux-primary-color)',
                '#fc783d': 'var(--konflux-primary-color)',
                '#D36634': 'var(--konflux-primary-hover-color)',
                '#d36634': 'var(--konflux-primary-hover-color)',
              },
              svgoConfig: {
                plugins: [
                  {
                    name: 'removeViewBox',
                    active: false, // Keep viewBox for proper scaling
                  },
                ],
              },
            },
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        include: path.resolve(__dirname, 'src/assets/iconsUrl'),
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './public/index.html', favicon: './public/favicon.ico' }),
  ],
  optimization: {
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        react: {
          // Split React core libraries into their own chunk
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 30,
          enforce: true,
        },
        victory: {
          // Split Victory charting libraries (victory and victory-*) into their own chunk
          test: /[\\/]node_modules[\\/]victory(?:-[^\\/]+)?[\\/]/,
          name: 'victory',
          chunks: 'all',
          priority: 25,
          enforce: true,
        },
        patternfly: {
          // Split all @patternfly packages into their own chunk
          test: /[\\/]node_modules[\\/]@patternfly[\\/]/,
          name: 'patternfly',
          chunks: 'all',
          priority: 20,
          enforce: true,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
          priority: 10,
        },
      },
    },
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '...'],
    modules: ['src', 'node_modules'],
    alias: getWebpackAliases(),
  },
};
