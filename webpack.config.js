import { fileURLToPath } from 'url';
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { getWebpackAliases } from './aliases.config.js';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: './src/main.tsx',
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.css$/,
        include: path.resolve(__dirname, 'node_modules/monaco-editor'),
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './public/index.html', favicon: './public/favicon.ico' }),
    new MonacoWebpackPlugin({
      languages: ['yaml'], // add only 'yaml' language, since that's the only one we're going to support for now
      features: ['find', 'quickCommand', 'hover'], // only basic features we might need for now
      globalAPI: true,
      customLanguages: [
        {
          label: 'yaml',
          entry: 'monaco-yaml',
          worker: {
            id: 'monaco-yaml/yamlWorker',
            entry: 'monaco-yaml/yaml.worker',
          },
        },
      ],
    }),
  ],
  optimization: {
    moduleIds: 'deterministic',
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
        },
        // isolate 'monaco' dependencies in a separate chunk, it'll decrease the 'vendor' size
        monaco: {
          test: /[\\/]node_modules[\\/](monaco-editor|monaco-yaml)/,
          name: 'monaco',
          chunks: 'async',
          priority: 20,
          enforce: true,
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
