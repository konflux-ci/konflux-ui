import { ReleasePlanKind } from '../../../../types/coreBuildService';

export const mockReleasePlans: ReleasePlanKind[] = [
  {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'ReleasePlan',
    metadata: {
      creationTimestamp: '2023-08-03T13:03:37Z',
      generation: 1,
      labels: {
        'release.appstudio.openshift.io/author': 'sbudhwar-1',
        'release.appstudio.openshift.io/auto-release': 'true',
        'release.appstudio.openshift.io/standing-attribution': 'true',
      },
      name: 'test-plan',
      namespace: 'sbudhwar-1-tenant',
      ownerReferences: [
        {
          apiVersion: 'appstudio.redhat.com/v1alpha1',
          blockOwnerDeletion: true,
          controller: true,
          kind: 'Application',
          name: 'my-app-1',
          uid: '2c216a41-24a6-4ebb-b2b6-af2f3f0b735e',
        },
      ],
      resourceVersion: '551125989',
      uid: '7bbabe4a-33e3-4636-9e16-6695f4ea3bef',
    },
    spec: {
      application: 'my-app-1',
      displayName: 'My Release Plan',
      target: 'rorai-tenant',
    },
  },
  {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'ReleasePlan',
    metadata: {
      creationTimestamp: '2023-08-03T13:03:37Z',
      generation: 1,
      labels: {
        'release.appstudio.openshift.io/author': 'sbudhwar-1',
        'release.appstudio.openshift.io/auto-release': 'true',
        'release.appstudio.openshift.io/standing-attribution': 'true',
      },
      name: 'test-plan-2',
      namespace: 'sbudhwar-1-tenant',
      ownerReferences: [
        {
          apiVersion: 'appstudio.redhat.com/v1alpha1',
          blockOwnerDeletion: true,
          controller: true,
          kind: 'Application',
          name: 'my-app-2',
          uid: '2c216a41-24a6-4ebb-b2b6-af2f3f1b735e',
        },
      ],
      resourceVersion: '551125989',
      uid: '7bbabe4a-33e3-4636-9e16-6695f4ea3bee',
    },
    spec: {
      application: 'my-app-2',
      displayName: 'My Second Plan',
      target: 'rorai-tenant',
    },
  },
];

export const mockReleasePlan = mockReleasePlans[0];

export const mockEditedReleasePlan = {
  ...mockReleasePlan,
  spec: {
    ...mockReleasePlan.spec,
    target: 'my-tenant',
  },
};

export const mockApplicationWithDisplayName = {
  apiVersion: 'v1',
  kind: 'Application',
  spec: { displayName: 'my application 2' },
  metadata: { name: 'my-app-2' },
};

export const mockApplicationWithoutDisplayName = {
  apiVersion: 'v1',
  kind: 'Application',
  spec: null,
  metadata: { name: 'my-app-2' },
};
