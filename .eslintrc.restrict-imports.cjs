module.exports = {
  extends: './.eslintrc.cjs',
  rules: {
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // Zone 1: Files in `./src/utils` may only import from:
          // `./src/utils`, `./src/types`, `./src/k8s`, `./src/models`, `./src/consts`, `./src/unit-test-utils`, `./src/__data__` or `./src/kubearchive`.
          {
            target: './src/utils/**/*',
            from: [
              './src/!(utils|types|k8s|models|consts|kubearchive|unit-test-utils|__data__)/**/*',
            ],
            message:
              'Files in `./src/utils` may only import from `./src/utils`, `./src/types`, `./src/k8s`, `./src/models`, `./src/consts`, `./src/unit-test-utils`, `./src/__data__` or `./src/kubearchive`',
          },
          // Zone 2: Files in `./src/types` may only import from `./src/types`.
          {
            target: './src/types/**/*',
            from: ['./src/!(types)/**/*'],
            message: 'Files in `./src/types` may only import from `./src/types`.',
          },
          // Zone 3: Files in `./src/models` may only import from `./src/models` or `./src/types`.
          {
            target: './src/models/**/*',
            from: ['./src/!(models|types)/**/*'],
            message:
              'Files in `./src/models` may only import from `./src/models` or `./src/types`.',
          },
          // Zone 4: Files in `./src/k8s` may only import from `./src/k8s` or from `./src/types/k8s.ts`.
          {
            target: './src/k8s/**/*',
            from: ['./src/!(k8s|types/k8s)/**/*'],
            message:
              'Files in `./src/k8s` may only import from `./src/k8s` or from `./src/types/k8s`.',
          },
          // Zone 5: Files in `./src/shared` may only import from `./src/shared` or `./src/k8s`.
          {
            target: './src/shared/**/*',
            from: ['./src/!(shared|k8s)/**/*'],
            message: 'Files in `./src/shared` may only import from `./src/shared` or `./src/k8s`.',
          },
          // Zone 6: 'Files in `./src/feature-flags` may only import from `./src/feature-flags`'.
          {
            target: './src/feature-flags/**/*',
            from: ['./src/!(feature-flags|components/modal)/**/*'],
            message: 'Files in `./src/feature-flags` may only import from `./src/feature-flags`.',
          },
          // Zone 7: Files in `./src/kubearchive` may only import from `./src/kubearchive`, `./src/k8s` or `./src/types/k8s`.
          {
            target: './src/kubearchive/**/*',
            from: ['./src/!(kubearchive|k8s|types/k8s)/**/*'],
            message:
              'Files in `./src/kubearchive` may only import from `./src/kubearchive`, `./src/k8s` or `./src/types/k8s`.',
          },
        ],
      },
    ],
  },
};
