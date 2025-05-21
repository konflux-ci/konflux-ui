import { K8sResourceCommon } from '~/types/k8s';
import { ReleaseKind, ReleaseCondition } from '~/types/release';

export const mockReleases: ReleaseKind[] = [
  {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Release',
    metadata: {
      name: 'test-release-1',
      creationTimestamp: '2023-02-01T10:30:00Z',
      labels: {
        'appstudio.openshift.io/application': 'foo',
        'appstudio.openshift.io/component': 'foo-component',
      },
      namespace: 'namespace-1',
    },
    spec: {
      releasePlan: 'test-plan',
      snapshot: 'test-snapshot',
    },
    status: {
      startTime: '2023-01-01T10:30:00Z',
      target: 'test-target',
      conditions: [
        {
          message: '',
          reason: 'Progressing',
          status: 'False',
          type: ReleaseCondition.Released,
        },
      ],
    },
  },
  {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Release',
    metadata: {
      name: 'test-release-2',
      creationTimestamp: '2023-03-01T10:30:00Z',
      labels: {
        'appstudio.openshift.io/application': 'test',
        'appstudio.openshift.io/component': 'test-01-component',
      },
      namespace: 'namespace-1',
    },
    spec: {
      releasePlan: 'test-plan-2',
      snapshot: 'test-snapshot-2',
    },
    status: {
      startTime: '2023-01-01T10:30:00Z',
      completionTime: '2023-01-01T10:30:10Z',
      target: 'test-target',
      conditions: [
        {
          message: '',
          reason: 'Succeeded',
          status: 'True',
          type: ReleaseCondition.Released,
        },
      ],
    },
  },
  {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Release',
    metadata: {
      name: 'test-release-3',
      creationTimestamp: '2023-01-01T10:30:00Z',
      labels: {
        'appstudio.openshift.io/application': 'foo',
        'appstudio.openshift.io/component': 'bar-01-component',
      },
      namespace: 'namespace-2',
    },
    spec: {
      releasePlan: 'test-plan-3',
      snapshot: 'test-snapshot-3',
    },
    status: {
      startTime: '2023-01-01T10:30:00Z',
      completionTime: '2023-01-01T10:30:10Z',
      target: 'test-target',
      conditions: [
        {
          message: 'Release processing failed on managed pipelineRun',
          reason: 'Failed',
          status: 'False',
          type: ReleaseCondition.Released,
        },
      ],
    },
  },
];

export const mockNamespaceData = {
  namespace: '',
  namespaceResource: undefined,
  namespacesLoaded: false,
  namespaces: [],
  lastUsedNamespace: '',
};

export const mockNamespaces = [
  { metadata: { name: 'namespace-1', creationTimestamp: '2023-12-01T00:00:00Z' } },
] as K8sResourceCommon[];
