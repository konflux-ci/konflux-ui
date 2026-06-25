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
                '#FC783D': 'var(--konflux-brand-primary)',
                '#fc783d': 'var(--konflux-brand-primary)',
                '#D36634': 'var(--konflux-brand-primary-hover)',
                '#d36634': 'var(--konflux-brand-primary-hover)',
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
    new MonacoWebpackPlugin({
      languages: ['yaml'], // add only 'yaml' language, since that's the only one we're going to support for now
      features: ['find', 'quickCommand', 'hover'], // only basic features we might need for now
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
  // TODO: Remove once formik-pf is updated to support PatternFly v6.
  // formik-pf@0.0.1-alpha11 imports Select/SelectVariant/SelectOption from
  // @patternfly/react-core/deprecated, which no longer exports them in PF v6.
  // Only the unused SelectField and FormikWizard components are affected.
  ignoreWarnings: [
    {
      module: /node_modules\/formik-pf/,
      message: /export .* was not found in '@patternfly\/react-core\/deprecated'/,
    },
  ],
};
