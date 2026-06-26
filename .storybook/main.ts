import type { StorybookConfig } from '@storybook/react-webpack5';
import path from 'path';
import { fileURLToPath } from 'url';
import { getWebpackAliases } from '../aliases.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  stories: ['../src/**/__stories__/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-webpack5-compiler-swc'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  swc: () => ({
    // Ignore .swcrc — it sets jsc.target which conflicts with the addon's env option.
    swcrc: false,
    jsc: {
      parser: {
        syntax: 'typescript',
        tsx: true,
      },
      transform: {
        react: {
          runtime: 'automatic',
        },
      },
    },
  }),
  webpackFinal: async (config) => {
    // Path aliases from tsconfig (~/ -> src/, @routes/ -> src/routes/)
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      ...getWebpackAliases(),
    };
    config.resolve.extensions = ['.ts', '.tsx', '.js', '.jsx'];
    config.resolve.modules = [path.resolve(__dirname, '..', 'src'), 'node_modules'];

    // SCSS support (matching webpack.dev.config.js)
    config.module = config.module || { rules: [] };
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.s[ac]ss$/i,
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
    });

    // SVG as React components (matching webpack.config.js)
    // Remove existing SVG rule from Storybook defaults
    const fileLoaderRule = config.module.rules.find(
      (rule): rule is { test: RegExp } =>
        typeof rule === 'object' &&
        rule !== null &&
        'test' in rule &&
        rule.test instanceof RegExp &&
        rule.test.test('.svg'),
    );
    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }

    config.module.rules.push({
      test: /\.svg$/i,
      include: [
        path.resolve(__dirname, '..', 'src/assets'),
        path.resolve(__dirname, '..', 'src/shared/assets'),
      ],
      exclude: path.resolve(__dirname, '..', 'src/assets/iconsUrl'),
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
              plugins: [{ name: 'removeViewBox', active: false }],
            },
          },
        },
      ],
    });

    return config;
  },
};

export default config;
