import { ComponentGroupKind } from '~/types';

const componentGroupResource = {
  apiVersion: 'appstudio.redhat.com/v1beta2',
  kind: 'ComponentGroup',
} as const;

const baseMetadata = (name: string, namespace: string) => ({
  name,
  namespace,
  uid: `mock-uid-${name}`,
  resourceVersion: '1',
  creationTimestamp: '2026-08-01T10:15:00Z',
  labels: {
    'app.kubernetes.io/managed-by': 'konflux',
  },
});

export const MOCK_COMPONENT_GROUPS: ComponentGroupKind[] = [
  {
    ...componentGroupResource,
    metadata: baseMetadata('frontend-stack', 'test-ns'),
    spec: {
      components: [
        { name: 'konflux-ui' },
        { name: 'konflux-ui-docs', componentVersion: { name: 'konflux-ui-docs', version: 'main' } },
        { name: 'design-tokens' },
      ],
      testGraph: {
        'integration-tests': [{ name: 'e2e-suite', failFast: true }],
      },
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          reason: 'OK',
          message: 'All components have promoted builds',
          lastTransitionTime: '2026-08-20T14:30:00Z',
        },
      ],
      globalCandidateList: [
        {
          name: 'konflux-ui',
          version: 'v1.2.0',
          url: 'https://github.com/konflux-ci/konflux-ui',
          lastPromotedImage: 'quay.io/redhat-user-workloads/test-ns/konflux-ui:v1.2.0',
          lastPromotedCommit: 'a1b2c3d4e5f6789012345678abcdef9012345678',
          lastPromotedBuildTime: '2026-08-20T14:22:00Z',
        },
        {
          name: 'design-tokens',
          url: 'https://github.com/konflux-ci/design-tokens',
          lastPromotedImage: 'quay.io/redhat-user-workloads/test-ns/design-tokens:latest',
          lastPromotedCommit: 'fedcba9876543210fedcba9876543210fedcba98',
          lastPromotedBuildTime: '2026-08-18T09:45:00Z',
        },
        {
          name: 'konflux-ui-docs',
          version: 'main',
          url: 'https://github.com/konflux-ci/konflux-ui-docs',
          lastPromotedImage: 'quay.io/redhat-user-workloads/test-ns/konflux-ui-docs:main',
          lastPromotedCommit: '1234567890abcdef1234567890abcdef12345678',
          lastPromotedBuildTime: '2026-08-19T11:10:00Z',
        },
      ],
    },
  },
  {
    ...componentGroupResource,
    metadata: baseMetadata('backend-services', 'test-ns'),
    spec: {
      components: [
        { name: 'build-service' },
        { name: 'image-controller' },
        { name: 'release-service' },
      ],
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          reason: 'OK',
          message: 'All components have promoted builds',
          lastTransitionTime: '2026-08-21T08:00:00Z',
        },
      ],
      globalCandidateList: [
        {
          name: 'release-service',
          version: '0.4.1',
          url: 'https://github.com/konflux-ci/release-service',
          lastPromotedImage: 'quay.io/redhat-user-workloads/test-ns/release-service:0.4.1',
          lastPromotedCommit: '9988776655443322110099887766554433221100',
          lastPromotedBuildTime: '2026-08-21T07:55:00Z',
        },
        {
          name: 'build-service',
          url: 'https://github.com/konflux-ci/build-service',
          lastPromotedImage: 'quay.io/redhat-user-workloads/test-ns/build-service:latest',
          lastPromotedCommit: 'abcdef1234567890abcdef1234567890abcdef12',
          lastPromotedBuildTime: '2026-08-15T16:20:00Z',
        },
      ],
    },
  },
  {
    ...componentGroupResource,
    metadata: baseMetadata('platform-operators', 'test-ns'),
    spec: {
      components: [
        { name: 'operator-controller' },
        { name: 'tenant-controller' },
      ],
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'False',
          reason: 'Error',
          message: 'Waiting for first promoted build',
          lastTransitionTime: '2026-08-10T12:00:00Z',
        },
      ],
      globalCandidateList: [],
    },
  },
  {
    ...componentGroupResource,
    metadata: baseMetadata('sample-app', 'test-ns'),
    spec: {
      components: [{ name: 'sample-app-frontend' }],
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          reason: 'OK',
          message: 'All components have promoted builds',
          lastTransitionTime: '2026-08-12T18:40:00Z',
        },
      ],
      globalCandidateList: [
        {
          name: 'sample-app-frontend',
          url: 'https://github.com/example/sample-app',
          lastPromotedImage: 'quay.io/redhat-user-workloads/test-ns/sample-app-frontend:latest',
          lastPromotedCommit: '1111222233334444555566667777888899990000',
          lastPromotedBuildTime: '2026-08-12T18:35:00Z',
        },
      ],
    },
  },
];
