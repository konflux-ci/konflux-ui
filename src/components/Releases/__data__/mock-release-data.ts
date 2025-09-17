export const mockReleases = [
  {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Release',
    metadata: {
      name: 'test-release',
      creationTimestamp: '2023-02-01T10:30:00Z',
      labels: {
        'appstudio.openshift.io/application': 'test-app',
      },
    },
    spec: {
      releasePlan: 'test-plan',
      snapshot: 'test-snapshot',
    },
    status: {
      startTime: '2023-01-01T10:30:00Z',
      completionTime: '2023-01-01T10:30:10Z',
      target: 'test-target',
      tenantProcessing: {
        releaseStrategy: 'my-ns/test-strategy',
        pipelineRun: 'my-ns/test-pipelinerun',
      },
    },
  },
  {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Release',
    metadata: {
      name: 'test-release-2',
      creationTimestamp: '2023-03-01T10:30:00Z',
    },
    spec: {
      releasePlan: 'test-plan-2',
      snapshot: 'test-snapshot-2',
    },
    status: {
      startTime: '2023-01-01T10:30:00Z',
      completionTime: '2023-01-01T10:30:10Z',
      target: 'test-target',
      tenantProcessing: {
        releaseStrategy: 'my-ns/test-strategy',
        pipelineRun: 'my-ns/test-pipelinerun',
      },
    },
  },
  {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Release',
    metadata: {
      name: 'test-release-3',
      creationTimestamp: '2023-01-01T10:30:00Z',
    },
    spec: {
      releasePlan: 'test-plan-3',
      snapshot: 'test-snapshot-3',
    },
    status: {
      startTime: '2023-01-01T10:30:00Z',
      completionTime: '2023-01-01T10:30:10Z',
      target: 'test-target',
      tenantProcessing: {
        releaseStrategy: 'my-ns/test-strategy',
        pipelineRun: 'my-ns/test-pipelinerun',
      },
    },
  },
];

export const mockReleaseWithManagedProcessing = {
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'Release',
  metadata: {
    name: 'test-release-3',
    creationTimestamp: '2023-01-01T10:30:00Z',
    labels: {
      'appstudio.openshift.io/application': 'test-app',
    },
  },
  spec: {
    releasePlan: 'test-plan-3',
    snapshot: 'test-snapshot-3',
  },
  status: {
    startTime: '2023-01-01T10:30:00Z',
    completionTime: '2023-01-01T10:30:10Z',
    target: 'test-target',
    managedProcessing: {
      pipelineRun: 'my-ns/test-pipelinerun',
    },
  },
};

export const mockReleaseWithAllProcessing = {
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'Release',
  metadata: {
    name: 'test-release-3',
    creationTimestamp: '2023-01-01T10:30:00Z',
  },
  spec: {
    releasePlan: 'test-plan-3',
    snapshot: 'test-snapshot-3',
  },
  status: {
    startTime: '2023-01-01T10:30:00Z',
    completionTime: '2023-01-01T10:30:10Z',
    target: 'test-target',
    managedProcessing: {
      pipelineRun: 'my-ns/test-pipelinerun',
    },
    tenantProcessing: {
      pipelineRun: 'my-ns/test-pipelinerun',
    },
    tenantCollectorProcessing: {
      pipelineRun: 'my-ns/test-pipelinerun',
      startTime: '2023-01-01T10:30:00Z',
      completionTime: '2023-01-01T10:30:10Z',
    },
    finalProcessing: {
      pipelineRun: 'my-ns/test-pipelinerun',
      startTime: '2023-01-01T10:30:00Z',
      completionTime: '2023-01-01T10:30:10Z',
    },
  },
};
