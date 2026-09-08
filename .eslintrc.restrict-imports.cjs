module.exports = {
  extends: './.eslintrc.cjs',
  rules: {
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // Zone 1: Files in `./src/utils` (excluding test files) may only import from:
          // `./src/utils`, `./src/types`, `./src/k8s`, `./src/models`, `./src/consts`, `./src/unit-test-utils`, `./src/__data__`, `./src/kubearchive`, `./src/auth`, `./src/shared` or `./src/routes`.
          {
            target: './src/utils/!(__tests__)/**/*',
            from: [
              './src/!(utils|types|k8s|models|consts|kubearchive|unit-test-utils|__data__|auth|shared|routes)/**/*',
            ],
            message:
              'Files in `./src/utils` may only import from `./src/utils`, `./src/types`, `./src/k8s`, `./src/models`, `./src/consts`, `./src/unit-test-utils`, `./src/__data__`, `./src/kubearchive`, `./src/auth`, `./src/shared` or `./src/routes`',
          },
          // Zone 1b: Non-test files directly in `./src/utils` (like `./src/utils/*.ts` or `./src/utils/*.tsx`) have the same restrictions.
          {
            target: './src/utils/*.ts?(x)',
            from: [
              './src/!(utils|types|k8s|models|consts|kubearchive|unit-test-utils|__data__|auth|shared|routes)/**/*',
            ],
            message:
              'Files in `./src/utils` may only import from `./src/utils`, `./src/types`, `./src/k8s`, `./src/models`, `./src/consts`, `./src/unit-test-utils`, `./src/__data__`, `./src/kubearchive`, `./src/auth`, `./src/shared` or `./src/routes`',
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
          // Zone 4: Files in `./src/k8s` may only import from `./src/k8s`, `./src/types/k8s.ts` or `./src/types/common.ts`.
          {
            target: './src/k8s/**/*',
            from: [
              './src/!(k8s|types)/**/*',
              './src/types/!(k8s.ts|common.ts)',
              './src/types/!(k8s.ts|common.ts)/**/*',
            ],
            message:
              'Files in `./src/k8s` may only import from `./src/k8s`, `./src/types/k8s` or `./src/types/common`.',
          },
          // Zone 5: Files in `./src/shared` may import from `./src/shared`, `./src/k8s`,
          // `./src/types`, `./src/unit-test-utils`, `./src/monitoring`, `./src/feature-flags`,
          // `./src/__data__`, `./src/consts`, `./src/kubearchive`, `./src/routes`, selected
          // `./src/models` files and the temporary `except` whitelist below.
          {
            target: './src/shared/**/*',
            from: [
              './src/!(shared|k8s|types|unit-test-utils|monitoring|feature-flags|__data__|models|consts|kubearchive|routes)/**/*',
              './src/models/!(pod.ts|pipelineruns.ts|release.ts|namespace.ts)',
              './src/models/!(pod.ts|pipelineruns.ts|release.ts|namespace.ts)/**/*',
            ],
            // TODO: temporary whitelist until the shared consumers are decoupled
            // from `src/components`, `src/hooks`, `src/utils` and `src/image-controller`
            // (either by moving the reusable views/components into `src/shared`
            // or by moving the consumers out of it).
            except: [
              '**/src/components/Commits/CommitsListPage/CommitsListViewV2.tsx',
              '**/src/components/Commits/CommitIcon.tsx',
              '**/src/components/Filter/generic/FilterContext.tsx',
              '**/src/components/PipelineRun/PipelineRunListView/PipelineRunsListViewV2.tsx',
              '**/src/components/AnalyticsButton/AnalyticsButton.tsx',
              '**/src/components/FeedbackSection/components/FeedbackForm.tsx',
              '**/src/components/FeedbackSection/components/BugRFEForm.tsx',
              '**/src/components/topology/StatusIcon.tsx',
              '**/src/components/modal/createModalLauncher.tsx',
              '**/src/components/modal/ModalProvider.tsx',
              '**/src/hooks/useImageProxy.ts',
              '**/src/hooks/useImageRepository.ts',
              '**/src/image-controller/conditional-checks.ts',
              '**/src/hooks/useK8sAndKarchResources.ts',
              '**/src/hooks/useTektonResults.ts',
              '**/src/utils/text-filter-utils.ts',
              '**/src/utils/analytics.ts',
              '**/src/utils/test-utils.tsx',
              '**/src/utils/task-store.ts',
              '**/src/utils/rbac.ts',
              '**/src/utils/pipeline-utils.ts',
              '**/src/utils/tekton-results.ts',
              '**/src/utils/component-utils.ts',
              '**/src/utils/validation-utils.ts',
            ],
            message:
              'Files in `./src/shared` may only import from `./src/shared`, `./src/k8s`, `./src/types`, `./src/unit-test-utils`, `./src/monitoring`, `./src/feature-flags`, `./src/__data__`, `./src/consts`, `./src/kubearchive`, `./src/routes`, `./src/models` (pod, pipelineruns, release, namespace only) or the temporary `except` whitelist (see TODO above).',
          },
          // Zone 6: Files in `./src/feature-flags` may only import from
          // `./src/feature-flags`, `./src/components/modal`, `./src/k8s/error.ts` or `./src/shared/utils`.
          {
            target: './src/feature-flags/**/*',
            from: [
              './src/!(feature-flags|components|k8s|shared)/**/*',
              './src/components/!(modal)/**/*',
              './src/components/!(modal)',
              './src/k8s/!(error.ts)',
              './src/k8s/!(error.ts)/**/*',
              './src/shared/!(utils)',
              './src/shared/!(utils)/**/*',
            ],
            message:
              'Files in `./src/feature-flags` may only import from `./src/feature-flags`, `./src/components/modal`, `./src/k8s/error` or `./src/shared/utils`.',
          },
          // Zone 7: Files in `./src/kubearchive` may only import from `./src/kubearchive`,
          // `./src/k8s`, `./src/feature-flags`, `./src/unit-test-utils`, `./src/types`
          // (release, k8s, pipeline-run only), `./src/consts` (pipelinerun only), `./src/utils`
          // (test-utils, resource-utils only) or `./src/models` (release, pipelineruns only).
          {
            target: './src/kubearchive/**/*',
            from: [
              './src/!(kubearchive|k8s|types|feature-flags|consts|utils|models|unit-test-utils)/**/*',
              './src/consts/!(pipelinerun.ts)',
              './src/consts/!(pipelinerun.ts)/**/*',
              './src/utils/!(test-utils.tsx|resource-utils.ts)',
              './src/utils/!(test-utils.tsx|resource-utils.ts)/**/*',
              './src/models/!(release.ts|pipelineruns.ts)',
              './src/models/!(release.ts|pipelineruns.ts)/**/*',
              './src/types/!(release.ts|k8s.ts|pipeline-run.ts)',
              './src/types/!(release.ts|k8s.ts|pipeline-run.ts)/**/*',
            ],
            message:
              'Files in `./src/kubearchive` may only import from `./src/kubearchive`, `./src/k8s`, `./src/feature-flags`, `./src/unit-test-utils`, `./src/types` (release, k8s, pipeline-run only), `./src/consts` (pipelinerun only), `./src/utils` (test-utils, resource-utils only) or `./src/models` (release, pipelineruns only).',
          },
        ],
      },
    ],
  },
};
