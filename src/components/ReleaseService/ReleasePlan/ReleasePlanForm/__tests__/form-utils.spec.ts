import '@testing-library/jest-dom';
import { ReleasePlanKind } from '../../../../../types/coreBuildService';
import { createK8sUtilMock } from '../../../../../utils/test-utils';
import { mockReleasePlan } from '../../__data__/release-plan.mock';
import {
  createReleasePlan,
  editReleasePlan,
  getReleasePlanFormBreadcrumbs,
  ReleasePipelineLocation,
  releasePlanFormParams,
} from '../form-utils';

const k8sCreateMock = createK8sUtilMock('K8sQueryCreateResource');
const k8sUpdateMock = createK8sUtilMock('K8sQueryUpdateResource');

describe('createReleasePlan', () => {
  beforeEach(() => {
    k8sCreateMock.mockImplementation((obj) => obj.resource);
    k8sUpdateMock.mockImplementation((obj) => obj.resource);
  });

  it('should use active namespace for current release pipeline location', async () => {
    const result = await createReleasePlan(
      {
        name: 'test-plan',
        application: 'test-app',
        releasePipelineLocation: ReleasePipelineLocation.current,
        labels: [],
        params: [],
        git: {
          url: 'https://github.com/example/repo',
          revision: 'main',
          path: '/',
        },
      },
      'test-ns-tenant',
      'test-ws-tenant',
    );
    expect(result).toEqual(
      expect.objectContaining({
        metadata: {
          labels: {
            'release.appstudio.openshift.io/auto-release': 'false',
            'release.appstudio.openshift.io/standing-attribution': 'false',
          },
          name: 'test-plan',
          namespace: 'test-ns-tenant',
        },
        spec: {
          application: 'test-app',
          pipelineRef: {
            params: [
              {
                name: 'url',
                value: 'https://github.com/example/repo',
              },
              {
                name: 'revision',
                value: 'main',
              },
              {
                name: 'pathInRepo',
                value: '/',
              },
            ],
            resolver: 'git',
          },
          target: 'test-ns-tenant',
        },
      }),
    );
  });

  it('should use provided workspace for target release pipeline location', async () => {
    const result = await createReleasePlan(
      {
        name: 'test-plan',
        application: 'test-app',
        target: 'target-ws-tenant',
        releasePipelineLocation: ReleasePipelineLocation.target,
        labels: [],
        params: [],
        git: {
          url: 'https://github.com/example/repo',
          revision: 'main',
          path: '/',
        },
      },
      'test-ns-tenant',
      'test-ws-tenant',
    );
    expect(result).toEqual(
      expect.objectContaining({
        spec: {
          application: 'test-app',
          pipelineRef: {
            params: [
              {
                name: 'url',
                value: 'https://github.com/example/repo',
              },
              {
                name: 'revision',
                value: 'main',
              },
              {
                name: 'pathInRepo',
                value: '/',
              },
            ],
            resolver: 'git',
          },
          target: 'target-ws-tenant',
        },
      }),
    );
  });

  it('should add correct labels for auto release and attribution options', async () => {
    let result = await createReleasePlan(
      {
        name: 'test-plan',
        application: 'test-app',
        autoRelease: true,
        standingAttribution: true,
        releasePipelineLocation: ReleasePipelineLocation.current,
        labels: [],
        params: [],
        git: {
          url: 'https://github.com/example/repo',
          revision: 'main',
          path: '/',
        },
      },
      'test-ns-tenant',
      'test-ws-tenant',
    );
    expect(result.metadata.labels).toEqual({
      'release.appstudio.openshift.io/auto-release': 'true',
      'release.appstudio.openshift.io/standing-attribution': 'true',
    });

    result = await createReleasePlan(
      {
        name: 'test-plan',
        application: 'test-app',
        autoRelease: true,
        standingAttribution: false,
        releasePipelineLocation: ReleasePipelineLocation.current,
        labels: [],
        params: [],
        git: {
          url: 'https://github.com/example/repo',
          revision: 'main',
          path: '/',
        },
      },
      'test-ns-tenant',
      'test-ws-tenant',
    );
    expect(result.metadata.labels).toEqual({
      'release.appstudio.openshift.io/auto-release': 'true',
      'release.appstudio.openshift.io/standing-attribution': 'false',
    });
  });
});

describe('editReleasePlan', () => {
  it('should update to use the active workspace for current release location', async () => {
    const result = await editReleasePlan(
      mockReleasePlan,
      {
        name: 'test-plan',
        application: 'test-app',
        autoRelease: true,
        standingAttribution: false,
        releasePipelineLocation: ReleasePipelineLocation.current,
        labels: [],
        params: [],
        git: {
          url: 'https://github.com/example/repo',
          revision: 'main',
          path: '/',
        },
      },
      'my-ws-tenant',
    );

    expect(result.spec.target).toBe('my-ws-tenant');
  });
});

describe('releasePlanFormParams', () => {
  it('should omit git fields from params', () => {
    const result = releasePlanFormParams({
      spec: {
        pipelineRef: {
          params: [
            { name: 'url', value: 'https://github.com/example/repo' },
            { name: 'revision', value: 'main' },
            { name: 'pathInRepo', value: '/test' },
            { name: 'test-key', value: 'test-val' },
          ],
        },
      },
    } as ReleasePlanKind);

    expect(result).toEqual([{ name: 'test-key', value: 'test-val' }]);
  });
});

describe('getReleasePlanFormBreadcrumbs', () => {
  it('should return the correct breadcrumbs for creating a release plan', () => {
    const workspace = 'testWorkspace';
    const edit = false;

    const breadcrumbs = getReleasePlanFormBreadcrumbs([], workspace, edit);

    expect(breadcrumbs).toEqual([
      {
        path: `/workspaces/${workspace}/release`,
        name: 'Releases',
      },
      {
        path: '#',
        name: 'Create release plan',
      },
    ]);
  });

  it('should return the correct breadcrumbs for editing a release plan', () => {
    const workspace = 'testWorkspace';
    const edit = true;

    const breadcrumbs = getReleasePlanFormBreadcrumbs([], workspace, edit);

    expect(breadcrumbs).toEqual([
      {
        path: `/workspaces/${workspace}/release`,
        name: 'Releases',
      },
      {
        path: '#',
        name: 'Edit release plan',
      },
    ]);
  });
});
