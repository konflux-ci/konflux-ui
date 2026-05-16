import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importX from 'eslint-plugin-import-x';
import prettier from 'eslint-plugin-prettier';

export default tseslint.config(
  // Global ignores (replaces .eslintignore)
  {
    ignores: [
      'node_modules/**',
      'static/**',
      'dist/**',
      '@types/**',
      'e2e-tests/**',
      'commitlint.config.js',
      '**/*.config.js',
      '**/*.config.mjs',
      'config/**',
      'scripts/**',
      'public/runtime-config.js',
    ],
  },

  // Base recommended configs
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,

  // Main config
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import-x/extensions': ['.js', '.jsx', '.ts', '.tsx'],
      'import-x/resolver': {
        typescript: {},
      },
      react: {
        version: 'detect',
      },
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': ['error'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: 'React', args: 'after-used' },
      ],
      '@typescript-eslint/no-use-before-define': 2,

      // React rules
      'react-refresh/only-export-components': ['off', { allowConstantExport: true }],
      'react/display-name': 0,
      'react/prop-types': 0,
      'react/self-closing-comp': 2,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // Import rules (import → import-x)
      'import-x/no-duplicates': ['error'],
      'import-x/order': [
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

      // General rules
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
      'no-underscore-dangle': 0,
      'no-var': 2,
      'object-shorthand': ['error', 'properties'],
      'prefer-const': ['error', { destructuring: 'all' }],
      'prefer-template': 2,
      radix: 2,
      'require-atomic-updates': 0,
    },
  },
);
