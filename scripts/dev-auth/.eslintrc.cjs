const { rules: projectRules } = require('../../.eslintrc.cjs');

// Reuse the project's JavaScript style rules without its browser/TypeScript rules.
const javascriptRules = Object.fromEntries(
  Object.entries(projectRules).filter(
    ([name]) =>
      !name.startsWith('@typescript-eslint/') &&
      !name.startsWith('react') &&
      !name.startsWith('rulesdir/'),
  ),
);

module.exports = {
  root: true,
  env: { node: true, es2024: true },
  extends: ['eslint:recommended'],
  plugins: ['import'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  overrides: [
    { files: ['*.cjs'], parserOptions: { sourceType: 'script' } },
    // These validators deliberately reject control bytes in untrusted URLs.
    { files: ['proxy.mjs'], rules: { 'no-control-regex': 'off' } },
  ],
  rules: {
    ...javascriptRules,
    'import/order': [
      projectRules['import/order'][0],
      {
        ...projectRules['import/order'][1],
        pathGroups: [
          ...projectRules['import/order'][1].pathGroups,
          { pattern: '#dev-auth/**', group: 'internal' },
          { pattern: '#webpack-dev-config', group: 'internal' },
        ],
      },
    ],
    'no-shadow': 'error',
    // Hoisted functions support mutually recursive startup/shutdown callbacks.
    'no-use-before-define': ['error', { functions: false }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
  },
};
