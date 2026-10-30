import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { KueueLocalQueueModel, KueueLocalQueueGroupVersionKind } from '~/models/kueue';
import type { PipelineRunKind } from '~/types';
import type { KueuePendingWorkload, KueuePendingWorkloadsSummary } from '~/types/kueue';
import { createK8sWatchResourceMock, renderHookWithQueryClient } from '~/unit-test-utils';
import {
  DEFAULT_KUEUE_POLLING_INTERVAL_MS,
  KUEUE_PENDING_WORKLOADS_PATH_SUFFIX,
  KUEUE_QUEUE_NAME_LABEL,
  KUEUE_VISIBILITY_API_GROUP,
  KUEUE_VISIBILITY_API_VERSION,
} from '../const';
import { useKueueQueuePositionForPipelineRun } from '../kueue-hooks';

jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
}));

const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;
const mockUseK8sWatchResource = createK8sWatchResourceMock();

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

const createSummary = (items: KueuePendingWorkload[] = []): KueuePendingWorkloadsSummary => ({
  apiVersion: `${KUEUE_VISIBILITY_API_GROUP}/${KUEUE_VISIBILITY_API_VERSION}`,
  kind: 'PendingWorkloadsSummary',
  metadata: {},
  items,
});

const expectRequestConfig = (
  queueName: string | undefined,
  namespace: string | undefined,
  enabled: boolean,
  pollingIntervalMs: number = DEFAULT_KUEUE_POLLING_INTERVAL_MS,
) => {
  expect(mockUseK8sWatchResource).toHaveBeenLastCalledWith(
    {
      groupVersionKind: KueueLocalQueueGroupVersionKind,
      name: queueName,
      namespace: namespace ?? '',
      watch: false,
      path: KUEUE_PENDING_WORKLOADS_PATH_SUFFIX,
    },
    KueueLocalQueueModel,
    expect.objectContaining({
      enabled,
      refetchInterval: enabled ? pollingIntervalMs : false,
      retry: false,
    }),
  );
};

describe('useKueueQueuePositionForPipelineRun', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should disable the request and return no position when the feature flag is off', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(false);
    mockUseK8sWatchResource.mockReturnValue({ data: undefined, isLoading: false, error: null });
    const plr = createPipelineRun('plr-1', 'pipelines-queue');

    const { result } = renderHookWithQueryClient(() =>
      useKueueQueuePositionForPipelineRun('test-ns', plr),
    );

    expect(result.current.queuePosition).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expectRequestConfig('pipelines-queue', 'test-ns', false);
  });

  it('should disable the request when namespace is undefined', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockUseK8sWatchResource.mockReturnValue({ data: undefined, isLoading: false, error: null });
    const plr = createPipelineRun('plr-1', 'pipelines-queue');

    renderHookWithQueryClient(() => useKueueQueuePositionForPipelineRun(undefined, plr));

    expectRequestConfig('pipelines-queue', undefined, false);
  });

  it('should disable the request when the PipelineRun has no queue label', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockUseK8sWatchResource.mockReturnValue({ data: undefined, isLoading: false, error: null });
    const plr = createPipelineRun('plr-1');

    renderHookWithQueryClient(() => useKueueQueuePositionForPipelineRun('test-ns', plr));

    expectRequestConfig(undefined, 'test-ns', false);
  });

  it('should resolve the queue position for a matching PipelineRun', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockUseK8sWatchResource.mockReturnValue({
      data: createSummary([
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
      ]),
      isLoading: false,
      error: null,
    });

    const plr = createPipelineRun('plr-1', 'pipelines-queue');
    const { result } = renderHookWithQueryClient(() =>
      useKueueQueuePositionForPipelineRun('test-ns', plr),
    );

    expect(result.current.queuePosition).toEqual({
      positionInClusterQueue: 3,
      positionInLocalQueue: 1,
      priority: 700,
      creationTimestamp: '2026-01-01T00:00:00Z',
    });
    expect(result.current.error).toBeNull();
    expectRequestConfig('pipelines-queue', 'test-ns', true);
  });

  it('should return no position when the PipelineRun is not among pending workloads', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockUseK8sWatchResource.mockReturnValue({
      data: createSummary([
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
      ]),
      isLoading: false,
      error: null,
    });

    const plr = createPipelineRun('plr-1', 'pipelines-queue');
    const { result } = renderHookWithQueryClient(() =>
      useKueueQueuePositionForPipelineRun('test-ns', plr),
    );

    expect(result.current.queuePosition).toBeUndefined();
  });

  it('should expose the error when the request fails and suppress position', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    const error = new Error('Forbidden');
    mockUseK8sWatchResource.mockReturnValue({ data: undefined, isLoading: false, error });

    const plr = createPipelineRun('plr-1', 'pipelines-queue');
    const { result } = renderHookWithQueryClient(() =>
      useKueueQueuePositionForPipelineRun('test-ns', plr),
    );

    expect(result.current.queuePosition).toBeUndefined();
    expect(result.current.error).toBe(error);
  });

  it('should suppress cached position when the request has errored', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    const error = new Error('NetworkError');
    mockUseK8sWatchResource.mockReturnValue({
      data: createSummary([
        {
          metadata: {
            name: 'workload-plr-1',
            creationTimestamp: '2026-01-01T00:00:00Z',
            ownerReferences: [
              { apiVersion: 'tekton.dev/v1', kind: 'PipelineRun', name: 'plr-1', uid: 'uid-plr-1' },
            ],
          },
          priority: 700,
          localQueueName: 'pipelines-queue',
          positionInClusterQueue: 3,
          positionInLocalQueue: 1,
        },
      ]),
      isLoading: false,
      error,
    });

    const plr = createPipelineRun('plr-1', 'pipelines-queue');
    const { result } = renderHookWithQueryClient(() =>
      useKueueQueuePositionForPipelineRun('test-ns', plr),
    );

    expect(result.current.queuePosition).toBeUndefined();
    expect(result.current.error).toBe(error);
  });

  it('should suppress cached position when the feature flag is off', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(false);
    mockUseK8sWatchResource.mockReturnValue({
      data: createSummary([
        {
          metadata: {
            name: 'workload-plr-1',
            creationTimestamp: '2026-01-01T00:00:00Z',
            ownerReferences: [
              { apiVersion: 'tekton.dev/v1', kind: 'PipelineRun', name: 'plr-1', uid: 'uid-plr-1' },
            ],
          },
          priority: 700,
          localQueueName: 'pipelines-queue',
          positionInClusterQueue: 3,
          positionInLocalQueue: 1,
        },
      ]),
      isLoading: false,
      error: null,
    });

    const plr = createPipelineRun('plr-1', 'pipelines-queue');
    const { result } = renderHookWithQueryClient(() =>
      useKueueQueuePositionForPipelineRun('test-ns', plr),
    );

    expect(result.current.queuePosition).toBeUndefined();
  });

  it('should report isLoading true while the request is in flight', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockUseK8sWatchResource.mockReturnValue({ data: undefined, isLoading: true, error: null });

    const plr = createPipelineRun('plr-1', 'pipelines-queue');
    const { result } = renderHookWithQueryClient(() =>
      useKueueQueuePositionForPipelineRun('test-ns', plr),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.queuePosition).toBeUndefined();
  });

  it('should configure polling at the default interval', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockUseK8sWatchResource.mockReturnValue({ data: createSummary(), isLoading: false, error: null });

    const plr = createPipelineRun('plr-1', 'pipelines-queue');
    renderHookWithQueryClient(() => useKueueQueuePositionForPipelineRun('test-ns', plr));

    expectRequestConfig('pipelines-queue', 'test-ns', true);
  });

  it('should configure polling at a custom interval', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockUseK8sWatchResource.mockReturnValue({ data: createSummary(), isLoading: false, error: null });

    const plr = createPipelineRun('plr-1', 'pipelines-queue');
    renderHookWithQueryClient(() =>
      useKueueQueuePositionForPipelineRun('test-ns', plr, 5_000),
    );

    expectRequestConfig('pipelines-queue', 'test-ns', true, 5_000);
  });

  it('should disable polling when the feature flag is off', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(false);
    mockUseK8sWatchResource.mockReturnValue({ data: undefined, isLoading: false, error: null });

    const plr = createPipelineRun('plr-1', 'pipelines-queue');
    renderHookWithQueryClient(() => useKueueQueuePositionForPipelineRun('test-ns', plr));

    expectRequestConfig('pipelines-queue', 'test-ns', false);
  });

  it('should build the same K8s request for PipelineRuns sharing a queue', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockUseK8sWatchResource.mockReturnValue({ data: createSummary(), isLoading: false, error: null });

    const plrA = createPipelineRun('plr-a', 'pipelines-queue');
    const plrB = createPipelineRun('plr-b', 'pipelines-queue');

    renderHookWithQueryClient(() => useKueueQueuePositionForPipelineRun('test-ns', plrA));
    renderHookWithQueryClient(() => useKueueQueuePositionForPipelineRun('test-ns', plrB));

    const [resourceA, modelA, queryOptionsA] = mockUseK8sWatchResource.mock.calls[0];
    const [resourceB, modelB, queryOptionsB] = mockUseK8sWatchResource.mock.calls[1];

    expect(resourceA).toEqual(resourceB);
    expect(modelA).toEqual(modelB);
    expect(queryOptionsA).toEqual(queryOptionsB);
  });
});
