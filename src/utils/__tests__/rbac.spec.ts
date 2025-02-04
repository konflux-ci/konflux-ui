import { renderHook } from '@testing-library/react-hooks';
import { k8sCreateResource } from '../../k8s/k8s-fetch';
import { IntegrationTestScenarioModel } from '../../models';
import { AccessReviewResources } from '../../types';
import { mockUseNamespaceHook } from '../../unit-test-utils/mock-namespace';
import {
  checkAccess,
  useAccessReview,
  useAccessReviewForModel,
  useAccessReviewForModels,
  useAccessReviews,
} from '../rbac';

jest.mock('../../k8s/k8s-fetch', () => ({
  k8sCreateResource: jest.fn(),
  getActiveWorkspace: jest.fn(() => 'test-ws'),
}));

const createResourceMock = k8sCreateResource as jest.Mock;
const useNamespaceMock = mockUseNamespaceHook('test-ns');

describe('checkAccess', () => {
  beforeEach(() => {
    createResourceMock.mockImplementation(() => Promise.resolve({ status: { allowed: true } }));
    jest.spyOn(console, 'warn').mockImplementation(jest.fn());
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create SelfSubjectAccessReview object', async () => {
    await checkAccess('tekton.dev', 'pipelineruns', null, 'test-ns', 'get');
    expect(createResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.objectContaining({ kind: 'SelfSubjectAccessReview' }),
        resource: expect.objectContaining({
          spec: {
            resourceAttributes: expect.objectContaining({
              group: 'tekton.dev',
              resource: 'pipelineruns',
              verb: 'get',
            }),
          },
        }),
      }),
    );
  });

  it('should create access review object once and subsequent requests should be returned from cache', async () => {
    await checkAccess('tekton.dev', 'taskruns', null, 'test-ns', 'get');
    await checkAccess('tekton.dev', 'taskruns', null, 'test-ns', 'get');
    await checkAccess('tekton.dev', 'taskruns', null, 'test-ns', 'get');

    expect(createResourceMock).toHaveBeenCalledTimes(1);
  });
});

describe('useAccessReview', () => {
  beforeEach(() => {
    createResourceMock.mockClear();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return access and loading state', async () => {
    createResourceMock.mockImplementation(() => Promise.resolve({ status: { allowed: true } }));
    const { result, waitForNextUpdate } = renderHook(() =>
      useAccessReview({
        group: 'tekton.dev',
        resource: 'pipelineruns',
        namespace: 'test-ns',
        verb: 'get',
      }),
    );

    expect(result.current).toEqual([false, false]);
    await waitForNextUpdate();
    expect(result.current).toEqual([true, true]);
  });

  it('should return no access when allowed is set to false', async () => {
    createResourceMock.mockImplementation(() => Promise.resolve({ status: { allowed: false } }));

    const { result, waitForNextUpdate } = renderHook(() =>
      useAccessReview({
        group: 'tekton.dev',
        resource: 'taskruns',
        namespace: 'test-ns',
        verb: 'update',
      }),
    );
    await waitForNextUpdate();
    expect(result.current).toEqual([false, true]);
  });

  it('should return true when there API failure due to some reason', async () => {
    createResourceMock.mockImplementation(() => Promise.reject(new Error('404 not found')));

    const { result, waitForNextUpdate } = renderHook(() =>
      useAccessReview({
        group: 'tekton.dev',
        resource: 'taskruns',
        namespace: 'test-ns',
        verb: 'watch',
      }),
    );
    await waitForNextUpdate();
    expect(result.current).toEqual([true, true]);
  });
});

describe('useAccessReviews', () => {
  beforeEach(() => {
    createResourceMock.mockClear();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return access and loading state for multiple resources', async () => {
    createResourceMock
      .mockImplementation(() =>
        Promise.resolve({
          spec: { resourceAttributes: { resource: 'components', verb: 'get' } },
          status: { allowed: true },
        }),
      )
      .mockImplementation(() =>
        Promise.resolve({
          spec: { resourceAttributes: { resource: 'applications', verb: 'get' } },
          status: { allowed: true },
        }),
      );
    const { result, waitForNextUpdate } = renderHook(() =>
      useAccessReviews([
        {
          group: 'appstudio.redhat.com',
          resource: 'components',
          namespace: 'test-ns',
          verb: 'get',
        },
        {
          group: 'appstudio.redhat.com',
          resource: 'applications',
          namespace: 'test-ns',
          verb: 'get',
        },
      ]),
    );
    await waitForNextUpdate();
    expect(result.current).toEqual([true, true]);
  });

  it('should return false if one of the resource is not having access', async () => {
    createResourceMock
      .mockImplementation(() =>
        Promise.resolve({
          spec: { resourceAttributes: { resource: 'components', verb: 'update' } },
          status: { allowed: true },
        }),
      )
      .mockImplementation(() =>
        Promise.resolve({
          spec: { resourceAttributes: { resource: 'applications', verb: 'update' } },
          status: { allowed: false },
        }),
      );
    const { result, waitForNextUpdate } = renderHook(() =>
      useAccessReviews([
        {
          group: 'appstudio.redhat.com',
          resource: 'components',
          namespace: 'test-ns',
          verb: 'update',
        },
        {
          group: 'appstudio.redhat.com',
          resource: 'applications',
          namespace: 'test-ns',
          verb: 'update',
        },
      ]),
    );
    await waitForNextUpdate();
    expect(result.current).toEqual([false, true]);
  });

  it('should return true when there API failure due to some reason', async () => {
    createResourceMock.mockImplementation(() => Promise.reject(new Error('404 not found')));

    const { result, waitForNextUpdate } = renderHook(() =>
      useAccessReviews([
        {
          group: 'appstudio.redhat.com',
          resource: 'components',
          namespace: 'test-ns',
          verb: 'watch',
        },
      ]),
    );
    await waitForNextUpdate();
    expect(result.current).toEqual([true, true]);
  });
});

describe('useAccessReviewForModel', () => {
  beforeEach(() => {
    createResourceMock.mockClear();
    createResourceMock.mockImplementation(() =>
      Promise.resolve({
        status: { allowed: true },
      }),
    );
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should return values', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useAccessReviewForModel(IntegrationTestScenarioModel, 'get'),
    );
    await waitForNextUpdate();
    expect(result.current).toEqual([true, true]);
  });
});

describe('useAccessReviewForModels', () => {
  beforeEach(() => {
    createResourceMock.mockClear();

    createResourceMock.mockImplementation(() =>
      Promise.resolve({
        spec: { resourceAttributes: { resource: 'integrationtestscenarios', verb: 'update' } },
        status: { allowed: true },
      }),
    );
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return values only when namespace is set', async () => {
    useNamespaceMock.mockReturnValue('test-ns');
    const accessReviewResources: AccessReviewResources = [
      { model: IntegrationTestScenarioModel, verb: 'update' },
    ];

    const { result, waitForNextUpdate } = renderHook(() =>
      useAccessReviewForModels(accessReviewResources),
    );
    await waitForNextUpdate();
    expect(result.current).toEqual([true, true]);
  });

  it('should not create access review object when a namespace is not set', () => {
    useNamespaceMock.mockReturnValue('');
    const accessReviewResources: AccessReviewResources = [
      { model: IntegrationTestScenarioModel, verb: 'update' },
    ];
    renderHook(() => useAccessReviewForModels(accessReviewResources));
    expect(createResourceMock).toHaveBeenCalledTimes(0);
  });
});
