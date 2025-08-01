export const mockReleasePlanAdmissions = [
  {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'ReleasePlanAdmission',
    metadata: {
      creationTimestamp: '2023-08-03T15:08:32Z',
      generation: 1,
      labels: {
        'release.appstudio.openshift.io/block-releases': 'true',
      },
      name: 'test-rpa',
      namespace: 'rorai-tenant',
      resourceVersion: '526510785',
      uid: '5f77cca8-8610-4f94-ae74-2b5b0e806d4d',
    },
    spec: {
      application: 'my-app-1',
      displayName: 'My Release Plan Admission',
      origin: 'sbudhwar-1-tenant',
      releaseStrategy: 'test-rs',
    },
  },
  {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'ReleasePlanAdmission',
    metadata: {
      creationTimestamp: '2023-08-03T15:08:33Z',
      generation: 1,
      labels: {
        'release.appstudio.openshift.io/block-releases': 'false',
      },
      name: 'test-rpa-2',
      namespace: 'rorai-tenant',
      resourceVersion: '526510785',
      uid: '5f77cca8-8610-4f94-ae74-2b5b0e806d4e',
    },
    spec: {
      application: 'my-app-1',
      displayName: 'My Release Plan Admission',
      origin: 'sbudhwar-1-tenant',
      releaseStrategy: 'test-rs',
    },
  },
];

export const mockReleasePlanAdmission = mockReleasePlanAdmissions[0];
