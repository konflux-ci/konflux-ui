import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { PipelineRunModel } from '~/models';
import { PipelineRunKind } from '~/types';
import { createTestQueryClient, createK8sUtilMock } from '~/unit-test-utils';
import { K8sModelCommon, K8sResourceCommon, WatchK8sResource } from '../../types/k8s';
import { useKubearchiveListResourceQuery } from '../hooks';

// Mock the kubearchive utilities
jest.mock('../fetch-utils', () => {
  const actual = jest.requireActual('../fetch-utils');
  return { ...actual, withKubearchivePathPrefix: jest.fn((options) => options) };
});

jest.mock('../conditional-checks', () => ({
  useIsKubeArchiveEnabled: jest.fn(() => ({ isKubearchiveEnabled: true })),
}));

const mockK8sListResource = createK8sUtilMock('k8sListResource');

describe('useKubearchiveListResourceQuery', () => {
  const createWrapper = () => {
    const queryClient = createTestQueryClient();
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  const mockModel: K8sModelCommon = {
    apiGroup: 'apps',
    apiVersion: 'v1',
    kind: 'Release',
    plural: 'releases',
    namespaced: true,
  };

  const mockResourceInit: WatchK8sResource = {
    groupVersionKind: {
      group: 'apps',
      version: 'v1',
      kind: 'Release',
    },
    namespace: 'test-namespace',
  };

  const mockReleaseList: K8sResourceCommon[] = [
    {
      apiVersion: 'v1',
      kind: 'Release',
      metadata: {
        name: 'test-release-1',
        namespace: 'test-namespace',
        uid: 'uid-1',
      },
    },
    {
      apiVersion: 'v1',
      kind: 'Release',
      metadata: {
        name: 'test-release-2',
        namespace: 'test-namespace',
        uid: 'uid-2',
      },
    },
  ];

  const mockListResponse = {
    apiVersion: 'v1',
    kind: 'ReleaseList',
    metadata: {},
    items: mockReleaseList,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch kubearchive resources successfully', async () => {
    mockK8sListResource.mockResolvedValue(mockListResponse);

    const { result } = renderHook(
      () => useKubearchiveListResourceQuery(mockResourceInit, mockModel),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.pages).toHaveLength(1);
    expect(result.current.data?.pages[0]).toEqual(mockReleaseList);
    expect(mockK8sListResource).toHaveBeenCalledWith(
      expect.objectContaining({
        model: mockModel,
        queryOptions: expect.objectContaining({
          queryParams: expect.objectContaining({
            continue: undefined,
          }),
        }),
      }),
    );
  });

  it('should handle no continue token correctly', async () => {
    mockK8sListResource.mockResolvedValue(mockListResponse);

    const { result } = renderHook(
      () => useKubearchiveListResourceQuery(mockResourceInit, mockModel),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasNextPage).toBe(false);
  });

  it('should handle errors properly', async () => {
    const mockError = new Error('Network error');
    mockK8sListResource.mockRejectedValue(mockError);

    const { result } = renderHook(
      () => useKubearchiveListResourceQuery(mockResourceInit, mockModel),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });

  it('should handle empty resource list', async () => {
    const emptyResponse = {
      ...mockListResponse,
      items: [],
    };
    mockK8sListResource.mockResolvedValue(emptyResponse);

    const { result } = renderHook(
      () => useKubearchiveListResourceQuery(mockResourceInit, mockModel),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.pages[0]).toEqual([]);
  });

  it('should pass through query parameters correctly', async () => {
    const resourceInitWithParams: WatchK8sResource = {
      ...mockResourceInit,
      fieldSelector: 'name=*example*',
      selector: { app: 'test' },
    };

    mockK8sListResource.mockResolvedValue(mockListResponse);

    renderHook(() => useKubearchiveListResourceQuery(resourceInitWithParams, mockModel), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockK8sListResource).toHaveBeenCalledWith(
        expect.objectContaining({
          queryOptions: expect.objectContaining({
            queryParams: expect.objectContaining({
              name: '*example*',
              labelSelector: { app: 'test' },
            }),
          }),
        }),
      );
    });
  });

  it('should be loading initially', () => {
    mockK8sListResource.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(
      () => useKubearchiveListResourceQuery(mockResourceInit, mockModel),
      {
        wrapper: createWrapper(),
      },
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should not fail if resourceInit is undefined', () => {
    mockK8sListResource.mockResolvedValue(mockListResponse);

    const { result } = renderHook(
      () => useKubearchiveListResourceQuery(undefined as WatchK8sResource, mockModel),
      {
        wrapper: createWrapper(),
      },
    );

    expect(result.current).toBeDefined();
    expect(result.current.status).toBeDefined();
    expect(result.current.isError).toBe(false);
  });

  describe('filtering stale running PipelineRuns from archive data', () => {
    const pipelineRunResourceInit: WatchK8sResource = {
      groupVersionKind: {
        group: 'tekton.dev',
        version: 'v1',
        kind: 'PipelineRun',
      },
      namespace: 'test-namespace',
      isList: true,
    };

    it('should filter out PipelineRuns with Unknown status, Succeeded type, and Running reason', async () => {
      const runningPipelineRun: PipelineRunKind = {
        apiVersion: 'tekton.dev/v1',
        kind: 'PipelineRun',
        metadata: {
          name: 'running-pipeline-run',
          namespace: 'test-namespace',
          uid: 'running-uid',
          creationTimestamp: '2024-01-04T00:00:00Z',
        },
        spec: {},
        status: {
          conditions: [
            {
              type: 'Succeeded',
              status: 'Unknown',
              reason: 'Running',
            },
          ],
          pipelineSpec: {
            tasks: [],
          },
        },
      };

      const completedPipelineRun: PipelineRunKind = {
        apiVersion: 'tekton.dev/v1',
        kind: 'PipelineRun',
        metadata: {
          name: 'completed-pipeline-run',
          namespace: 'test-namespace',
          uid: 'completed-uid',
          creationTimestamp: '2024-01-03T00:00:00Z',
        },
        spec: {},
        status: {
          conditions: [
            {
              type: 'Succeeded',
              status: 'True',
              reason: 'Succeeded',
            },
          ],
          pipelineSpec: {
            tasks: [],
          },
        },
      };

      mockK8sListResource.mockResolvedValue({
        apiVersion: 'tekton.dev/v1',
        kind: 'PipelineRunList',
        metadata: {},
        items: [runningPipelineRun, completedPipelineRun],
      });

      const { result } = renderHook(
        () => useKubearchiveListResourceQuery(pipelineRunResourceInit, PipelineRunModel),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.pages[0]).toHaveLength(1);
      expect(result.current.data?.pages[0][0].metadata?.name).toBe('completed-pipeline-run');
    });

    it('should keep PipelineRuns with no conditions', async () => {
      const pipelineRunNoConditions: PipelineRunKind = {
        apiVersion: 'tekton.dev/v1',
        kind: 'PipelineRun',
        metadata: {
          name: 'no-conditions-pipeline-run',
          namespace: 'test-namespace',
          uid: 'no-conditions-uid',
          creationTimestamp: '2024-01-04T00:00:00Z',
        },
        spec: {},
        status: {
          pipelineSpec: {
            tasks: [],
          },
        },
      };

      mockK8sListResource.mockResolvedValue({
        apiVersion: 'tekton.dev/v1',
        kind: 'PipelineRunList',
        metadata: {},
        items: [pipelineRunNoConditions],
      });

      const { result } = renderHook(
        () => useKubearchiveListResourceQuery(pipelineRunResourceInit, PipelineRunModel),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.pages[0]).toHaveLength(1);
      expect(result.current.data?.pages[0][0].metadata?.name).toBe('no-conditions-pipeline-run');
    });
  });
});
