import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { PipelineRunKind } from '~/types';
import { createTestQueryClient, renderHookWithQueryClient } from '~/unit-test-utils';
import { KUEUE_QUEUE_NAME_LABEL } from '../const';
import { fetchKueuePendingWorkloads } from '../kueue-fetch';
import { useKueueQueuePositionForPipelineRun } from '../kueue-hooks';

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

const createPipelineRun = (name: string, queueName?: string): PipelineRunKind =>
  ({
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name,
      namespace: 'test-ns',
      uid: `uid-${name}`,
      labels: queueName ? { [KUEUE_QUEUE_NAME_LABEL]: queueName } : {},
    },
  }) as PipelineRunKind;

describe('useKueueQueuePositionForPipelineRun', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not fetch and return undefined queuePosition when the feature flag is off', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(false);
    const plr = createPipelineRun('plr-1', 'pipelines-queue');

    const { result } = renderHookWithQueryClient(() =>
      useKueueQueuePositionForPipelineRun('test-ns', plr),
    );

    expect(result.current.queuePosition).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(mockFetchKueuePendingWorkloads).not.toHaveBeenCalled();
  });

  it('should not fetch when namespace is undefined', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    const plr = createPipelineRun('plr-1', 'pipelines-queue');

    const { result } = renderHookWithQueryClient(() =>
      useKueueQueuePositionForPipelineRun(undefined, plr),
    );

    expect(result.current.queuePosition).toBeUndefined();
    expect(mockFetchKueuePendingWorkloads).not.toHaveBeenCalled();
  });

  it('should not fetch when the PipelineRun has no queue label', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    const plr = createPipelineRun('plr-1');

    const { result } = renderHookWithQueryClient(() =>
      useKueueQueuePositionForPipelineRun('test-ns', plr),
    );

    expect(result.current.queuePosition).toBeUndefined();
    expect(mockFetchKueuePendingWorkloads).not.toHaveBeenCalled();
  });

  it('should resolve the queue position for a matching PipelineRun', async () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockFetchKueuePendingWorkloads.mockResolvedValue({
      items: [
        {
          metadata: {
            name: 'workload-plr-1',
            creationTimestamp: '2026-01-01T00:00:00Z',
            ownerReferences: [
              {
                apiVersion: 'tekton.dev/v1',
                kind: 'PipelineRun',
                name: 'plr-1',
                uid: 'uid-plr-1',
              },
            ],
          },
          priority: 700,
          localQueueName: 'pipelines-queue',
          positionInClusterQueue: 3,
          positionInLocalQueue: 1,
        },
      ],
    });

    const plr = createPipelineRun('plr-1', 'pipelines-queue');
    const { result } = renderHookWithQueryClient(() =>
      useKueueQueuePositionForPipelineRun('test-ns', plr),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetchKueuePendingWorkloads).toHaveBeenCalledTimes(1);
    expect(mockFetchKueuePendingWorkloads).toHaveBeenCalledWith('test-ns', 'pipelines-queue');
    expect(result.current.queuePosition).toEqual({
      positionInClusterQueue: 3,
      positionInLocalQueue: 1,
      priority: 700,
      creationTimestamp: '2026-01-01T00:00:00Z',
    });
    expect(result.current.error).toBeNull();
  });

  it('should return undefined queuePosition when the PipelineRun is not among pending workloads', async () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockFetchKueuePendingWorkloads.mockResolvedValue({
      items: [
        {
          metadata: {
            name: 'workload-other',
            ownerReferences: [
              {
                apiVersion: 'tekton.dev/v1',
                kind: 'PipelineRun',
                name: 'plr-other',
                uid: 'uid-other',
              },
            ],
          },
          priority: 500,
          localQueueName: 'pipelines-queue',
          positionInClusterQueue: 0,
          positionInLocalQueue: 0,
        },
      ],
    });

    const plr = createPipelineRun('plr-1', 'pipelines-queue');
    const { result } = renderHookWithQueryClient(() =>
      useKueueQueuePositionForPipelineRun('test-ns', plr),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.queuePosition).toBeUndefined();
  });

  it('should expose the error when the fetch fails', async () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    const error = new Error('Forbidden');
    mockFetchKueuePendingWorkloads.mockRejectedValue(error);

    const plr = createPipelineRun('plr-1', 'pipelines-queue');
    const { result } = renderHookWithQueryClient(() =>
      useKueueQueuePositionForPipelineRun('test-ns', plr),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.queuePosition).toBeUndefined();
    expect(result.current.error).toBe(error);
  });

  it('should report isLoading true while the request is in flight', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockFetchKueuePendingWorkloads.mockReturnValue(new Promise(() => {}));

    const plr = createPipelineRun('plr-1', 'pipelines-queue');
    const { result } = renderHookWithQueryClient(() =>
      useKueueQueuePositionForPipelineRun('test-ns', plr),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.queuePosition).toBeUndefined();
  });

  it('should configure polling at the default 30s interval', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockFetchKueuePendingWorkloads.mockResolvedValue({ items: [] });

    const client = createTestQueryClient();
    const plr = createPipelineRun('plr-1', 'pipelines-queue');

    renderHookWithQueryClient(() => useKueueQueuePositionForPipelineRun('test-ns', plr), {
      client,
    });

    const [query] = client.getQueryCache().findAll();
    expect(getRefetchInterval(query)).toBe(30_000);
  });

  it('should configure polling at a custom interval', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockFetchKueuePendingWorkloads.mockResolvedValue({ items: [] });

    const client = createTestQueryClient();
    const plr = createPipelineRun('plr-1', 'pipelines-queue');

    renderHookWithQueryClient(
      () => useKueueQueuePositionForPipelineRun('test-ns', plr, 5_000),
      { client },
    );

    const [query] = client.getQueryCache().findAll();
    expect(getRefetchInterval(query)).toBe(5_000);
  });

  it('should set refetchInterval to false when disabled (flag off)', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(false);

    const client = createTestQueryClient();
    const plr = createPipelineRun('plr-1', 'pipelines-queue');

    renderHookWithQueryClient(
      () => useKueueQueuePositionForPipelineRun('test-ns', plr),
      { client },
    );

    const [query] = client.getQueryCache().findAll();
    expect(getRefetchInterval(query)).toBe(false);
  });

  it('should share a single fetch when two hook instances use the same queue', async () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockFetchKueuePendingWorkloads.mockResolvedValue({ items: [] });

    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client }, children);

    const plrA = createPipelineRun('plr-a', 'pipelines-queue');
    const plrB = createPipelineRun('plr-b', 'pipelines-queue');

    renderHook(() => useKueueQueuePositionForPipelineRun('test-ns', plrA), { wrapper });
    renderHook(() => useKueueQueuePositionForPipelineRun('test-ns', plrB), { wrapper });

    await waitFor(() => {
      expect(mockFetchKueuePendingWorkloads).toHaveBeenCalledTimes(1);
    });

    expect(client.getQueryCache().findAll()).toHaveLength(1);
  });
});
