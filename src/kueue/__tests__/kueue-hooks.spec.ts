import { waitFor } from '@testing-library/react';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { createTestQueryClient, renderHookWithQueryClient } from '~/unit-test-utils';
import { fetchKueuePendingWorkloads } from '../kueue-fetch';
import { useKueuePendingWorkloads } from '../kueue-hooks';

// `refetchInterval` is a real, runtime-populated field on a Query's merged options,
// but it isn't part of the public `QueryOptions` TS type -- widen locally to read it.
const getRefetchInterval = (query: { options: unknown }): number | false | undefined =>
  (query.options as { refetchInterval?: number | false }).refetchInterval;

jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
}));

jest.mock('../kueue-fetch', () => ({
  fetchKueuePendingWorkloads: jest.fn(),
}));

const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;
const mockFetchKueuePendingWorkloads = fetchKueuePendingWorkloads as jest.MockedFunction<
  typeof fetchKueuePendingWorkloads
>;

describe('useKueuePendingWorkloads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not fetch and return an empty map when the feature flag is off', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(false);

    const { result } = renderHookWithQueryClient(() =>
      useKueuePendingWorkloads('test-ns', ['pipelines-queue']),
    );

    expect(result.current.queuePositionsByPipelineRun).toEqual({});
    expect(result.current.isLoading).toBe(false);
    expect(mockFetchKueuePendingWorkloads).not.toHaveBeenCalled();
  });

  it('should not fetch when namespace is undefined', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);

    renderHookWithQueryClient(() => useKueuePendingWorkloads(undefined, ['pipelines-queue']));

    expect(mockFetchKueuePendingWorkloads).not.toHaveBeenCalled();
  });

  it('should not fetch when there are no queue names', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);

    renderHookWithQueryClient(() => useKueuePendingWorkloads('test-ns', []));

    expect(mockFetchKueuePendingWorkloads).not.toHaveBeenCalled();
  });

  it('should fetch once per unique queue name and merge results into a single lookup map', async () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockFetchKueuePendingWorkloads.mockImplementation((_ns, queueName) =>
      Promise.resolve({
        items: [
          {
            metadata: {
              name: `workload-${queueName}`,
              creationTimestamp: '2026-01-01T00:00:00Z',
              ownerReferences: [
                {
                  apiVersion: 'tekton.dev/v1',
                  kind: 'PipelineRun',
                  name: `plr-${queueName}`,
                  uid: `uid-${queueName}`,
                },
              ],
            },
            priority: 700,
            localQueueName: queueName,
            positionInClusterQueue: 2,
            positionInLocalQueue: 0,
          },
        ],
      }),
    );

    const { result } = renderHookWithQueryClient(() =>
      useKueuePendingWorkloads('test-ns', ['pipelines-queue', 'other-queue']),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetchKueuePendingWorkloads).toHaveBeenCalledTimes(2);
    expect(mockFetchKueuePendingWorkloads).toHaveBeenCalledWith('test-ns', 'pipelines-queue');
    expect(mockFetchKueuePendingWorkloads).toHaveBeenCalledWith('test-ns', 'other-queue');
    expect(result.current.queuePositionsByPipelineRun).toEqual({
      'plr-pipelines-queue': {
        positionInClusterQueue: 2,
        positionInLocalQueue: 0,
        priority: 700,
        creationTimestamp: '2026-01-01T00:00:00Z',
      },
      'plr-other-queue': {
        positionInClusterQueue: 2,
        positionInLocalQueue: 0,
        priority: 700,
        creationTimestamp: '2026-01-01T00:00:00Z',
      },
    });
  });

  it('should return an empty map and surface the error when a queue request fails (e.g. missing RBAC)', async () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    const error = new Error('Forbidden');
    mockFetchKueuePendingWorkloads.mockRejectedValue(error);

    const { result } = renderHookWithQueryClient(() =>
      useKueuePendingWorkloads('test-ns', ['pipelines-queue']),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.queuePositionsByPipelineRun).toEqual({});
    expect(result.current.error).toBe(error);
  });

  it('should report isLoading true while requests are in flight', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockFetchKueuePendingWorkloads.mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderHookWithQueryClient(() =>
      useKueuePendingWorkloads('test-ns', ['pipelines-queue']),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.queuePositionsByPipelineRun).toEqual({});
  });

  it('should keep data from queues that succeed even when a sibling queue fails (partial failure)', async () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    const error = new Error('Forbidden');
    mockFetchKueuePendingWorkloads.mockImplementation((_ns, queueName) => {
      if (queueName === 'broken-queue') {
        return Promise.reject(error);
      }
      return Promise.resolve({
        items: [
          {
            metadata: {
              name: 'workload-ok',
              creationTimestamp: '2026-01-01T00:00:00Z',
              ownerReferences: [
                { apiVersion: 'tekton.dev/v1', kind: 'PipelineRun', name: 'plr-ok', uid: 'uid-ok' },
              ],
            },
            priority: 500,
            localQueueName: queueName,
            positionInClusterQueue: 1,
            positionInLocalQueue: 0,
          },
        ],
      });
    });

    const { result } = renderHookWithQueryClient(() =>
      useKueuePendingWorkloads('test-ns', ['pipelines-queue', 'broken-queue']),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.queuePositionsByPipelineRun).toEqual({
      'plr-ok': {
        positionInClusterQueue: 1,
        positionInLocalQueue: 0,
        priority: 500,
        creationTimestamp: '2026-01-01T00:00:00Z',
      },
    });
    expect(result.current.error).toBe(error);
  });

  it('should configure React Query to poll on the given interval, defaulting to 30s', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockFetchKueuePendingWorkloads.mockResolvedValue({ items: [] });

    const defaultClient = createTestQueryClient();
    renderHookWithQueryClient(() => useKueuePendingWorkloads('test-ns', ['pipelines-queue']), {
      client: defaultClient,
    });
    const [defaultQuery] = defaultClient.getQueryCache().findAll();
    expect(getRefetchInterval(defaultQuery)).toBe(30_000);

    const customClient = createTestQueryClient();
    renderHookWithQueryClient(
      () => useKueuePendingWorkloads('test-ns', ['pipelines-queue'], 5_000),
      { client: customClient },
    );
    const [customQuery] = customClient.getQueryCache().findAll();
    expect(getRefetchInterval(customQuery)).toBe(5_000);
  });

  it('should set refetchInterval to false (no polling) when disabled', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(false);

    const client = createTestQueryClient();
    renderHookWithQueryClient(() => useKueuePendingWorkloads('test-ns', ['pipelines-queue']), {
      client,
    });

    const [query] = client.getQueryCache().findAll();
    expect(getRefetchInterval(query)).toBe(false);
  });
});
