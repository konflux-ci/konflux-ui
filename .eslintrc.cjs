module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    comment: true,
    ecmaFeatures: {
      jsx: true,
    },
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: './',
    extraFileExtensions: ['.json'],
  },
  plugins: ['prettier', 'react-refresh'],
  rules: {
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-redundant-type-constituents': 'off',
    '@typescript-eslint/no-unsafe-enum-comparison': 'off',
    'react-refresh/only-export-components': ['off', { allowConstantExport: true }],
    camelcase: [
      'error',
      {
        allow: [
          'UNSAFE_componentWillReceiveProps',
          'UNSAFE_componentWillMount',
          'link_name',
          'snapshot_name',
          'release_plan',
          'current_path',
          'component_name',
          'component_id',
          'app_name',
          'app_id',
          'step_name',
          'git_url',
          'git_reference',
          'build_id',
          'context_dir',
          'build_pipeline',
          'detected_runtime',
          'chosen_runtime',
          'used_detected_runtime',
          'link_location',
          'integration_test_name',
          'dev_file_url',
          'dockerfile_url',
          'environment_id',
          'image_controller',
          'application_url',
          'sbom_server',
          'release_name',
        ],
      },
    ],
    'consistent-return': 0,
    'consistent-this': [1, 'that'],
    'default-case': [2],
    'dot-notation': [2],
    eqeqeq: [2, 'allow-null'],
    'guard-for-in': 2,
    'import/no-duplicates': ['error'],
    // "import/no-unresolved": "off",
    // "import/extensions": "off",

    // Sort imports into groups
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        pathGroups: [
          {
            pattern: 'react**',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '@console/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@redhat-cloud-services/**',
            group: 'internal',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
        'newlines-between': 'never',
      },
    ],

    'max-nested-callbacks': [1, 4],
    'no-alert': 2,
    'no-caller': 2,
    'no-console': 2,
    'no-else-return': ['error'],
    'no-global-strict': 0,
    'no-restricted-imports': [
      'error',
      {
        name: '@patternfly/react-icons',
        message:
          "Don't use group imports. Use @patternfly/react-icons/dist/esm/icons/(kebab-case-name) instead.",
      },
      {
        name: 'lodash',
        message: "Don't use group imports. Use lodash/(funcName) instead.",
      },
    ],
    '@typescript-eslint/no-unsafe-assignment': 'off',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    'no-underscore-dangle': 0,
    '@typescript-eslint/no-unused-vars': [
      'error',
      { varsIgnorePattern: 'React', args: 'after-used' },
    ],
    '@typescript-eslint/no-use-before-define': 2,
    'no-var': 2,
    'object-shorthand': ['error', 'properties'],
    'prefer-const': ['error', { destructuring: 'all' }],
    'prefer-template': 2,
    radix: 2,
    'react/display-name': 0,
    'react/prop-types': 0,
    'react/self-closing-comp': 2,
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
    'require-atomic-updates': 0,
    'rulesdir/forbid-pf-relative-imports': 'off', // We don't need this rule after https://github.com/patternfly/patternfly-react/pull/9298.
  },
  settings: {
    'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      alias: {
        map: [
          ['~', './src'],
          ['@routes', './src/routes'],
        ],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
      typescript: {},
    },
    react: {
      version: 'detect',
    },
  },
};
