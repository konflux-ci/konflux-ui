import { Snapshot } from '../../../../types/coreBuildService';

// Mock snapshot data
export const mockSnapshots: Snapshot[] = [
  {
    kind: 'Snapshot',
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    metadata: {
      name: 'my-app-snapshot-1',
      namespace: 'test-namespace',
      creationTimestamp: '2023-01-01T10:00:00Z',
      uid: 'snapshot-1-uid',
      labels: {
        'appstudio.openshift.io/application': 'test-app',
        'appstudio.openshift.io/component': 'frontend-component',
      },
    },
    spec: {
      application: 'test-app',
      displayName: 'Frontend Snapshot 1',
      components: [
        {
          containerImage: 'quay.io/test/frontend:v1.0.0',
          name: 'frontend-component',
          source: {
            git: {
              url: 'https://github.com/test/frontend',
              revision: 'main',
            },
          },
        },
        {
          containerImage: 'quay.io/test/backend:v1.0.0',
          name: 'backend-component',
          source: {
            git: {
              url: 'https://github.com/test/backend',
              revision: 'main',
            },
          },
        },
      ],
    },
    status: {
      conditions: [
        {
          type: 'AppStudioTestSucceeded',
          status: 'True',
          reason: 'Passed',
          message: 'All Integration Pipeline tests passed',
          lastTransitionTime: '2023-01-01T12:00:00Z',
        },
        {
          type: 'AutoReleased',
          status: 'True',
          reason: 'AutoReleased',
          message: 'The Snapshot was auto-released',
          lastTransitionTime: '2023-01-01T12:30:00Z',
        },
      ],
    },
  },
];
