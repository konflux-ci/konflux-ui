import { Snapshot } from '../types/coreBuildService';

export const mockSnapshot: Snapshot = {
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'Snapshot',
  metadata: {
    name: 'my-app-snapshot-1',
    namespace: 'test-namespace',
    creationTimestamp: '2023-01-01T10:00:00Z',
    uid: 'snapshot-1-uid',
    labels: {
      'appstudio.openshift.io/application': 'test-app',
      'appstudio.openshift.io/component': 'frontend-component',
      'pac.test.appstudio.openshift.io/sha': 'abc123def4567890',
      'pac.test.appstudio.openshift.io/branch': 'main',
      'pac.test.appstudio.openshift.io/sender': 'test-user',
      'pac.test.appstudio.openshift.io/pull-request': '42',
      'pac.test.appstudio.openshift.io/event-type': 'pull_request',
      'pac.test.appstudio.openshift.io/git-provider': 'github',
      'pac.test.appstudio.openshift.io/url-org': 'test-org',
      'pac.test.appstudio.openshift.io/url-repository': 'frontend-repo',
      'pac.test.appstudio.openshift.io/repository': 'frontend-component',
    },
    annotations: {
      'pac.test.appstudio.openshift.io/repo-url': 'https://github.com/test-org/frontend-repo',
      'pac.test.appstudio.openshift.io/sha-url':
        'https://github.com/test-org/frontend-repo/commit/abc123def4567890',
      'pac.test.appstudio.openshift.io/sha-title': 'Add new feature',
      'pac.test.appstudio.openshift.io/branch': 'main',
      'pac.test.appstudio.openshift.io/sender': 'test-user',
      'pac.test.appstudio.openshift.io/sha': 'abc123def4567890',
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
};

export const mockSnapshots: Snapshot[] = [mockSnapshot];
