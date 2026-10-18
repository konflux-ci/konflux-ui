import { PipelineRunKind } from '~/types';
import { OwnerReference } from '~/types/k8s';
import { KUEUE_QUEUE_NAME_LABEL } from '../const';
import { buildQueuePositionsByPipelineRun, getKueueQueueNames } from '../kueue-utils';
import { KueuePendingWorkload } from '../types';

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

const createWorkload = (
  pipelineRunName: string | undefined,
  overrides: Partial<KueuePendingWorkload> & { ownerReferences?: OwnerReference[] } = {},
): KueuePendingWorkload => {
  const { ownerReferences, ...workloadOverrides } = overrides;
  return {
    metadata: {
      name: `workload-${pipelineRunName ?? 'unowned'}`,
      creationTimestamp: '2026-01-01T00:00:00Z',
      ownerReferences:
        ownerReferences ??
        (pipelineRunName
          ? [
              {
                apiVersion: 'tekton.dev/v1',
                kind: 'PipelineRun',
                name: pipelineRunName,
                uid: `uid-${pipelineRunName}`,
              },
            ]
          : []),
    },
    priority: 500,
    localQueueName: 'pipelines-queue',
    positionInClusterQueue: 0,
    positionInLocalQueue: 0,
    ...workloadOverrides,
  };
};

describe('getKueueQueueNames', () => {
  it('should return an empty array when no PipelineRuns are queued', () => {
    expect(getKueueQueueNames([])).toEqual([]);
  });

  it('should collect queue names from the kueue.x-k8s.io/queue-name label', () => {
    const pipelineRuns = [
      createPipelineRun('plr-1', 'pipelines-queue'),
      createPipelineRun('plr-2', 'other-queue'),
    ];

    expect(getKueueQueueNames(pipelineRuns)).toEqual(['pipelines-queue', 'other-queue']);
  });

  it('should dedupe queue names shared by multiple PipelineRuns', () => {
    const pipelineRuns = [
      createPipelineRun('plr-1', 'pipelines-queue'),
      createPipelineRun('plr-2', 'pipelines-queue'),
      createPipelineRun('plr-3', 'pipelines-queue'),
    ];

    expect(getKueueQueueNames(pipelineRuns)).toEqual(['pipelines-queue']);
  });

  it('should ignore PipelineRuns without the queue-name label', () => {
    const pipelineRuns = [createPipelineRun('plr-1'), createPipelineRun('plr-2', 'pipelines-queue')];

    expect(getKueueQueueNames(pipelineRuns)).toEqual(['pipelines-queue']);
  });

  it('should ignore PipelineRuns with no labels object at all', () => {
    const pipelineRunWithoutLabels = {
      ...createPipelineRun('plr-1'),
      metadata: { name: 'plr-1', namespace: 'test-ns', uid: 'uid-plr-1' },
    } as PipelineRunKind;

    expect(getKueueQueueNames([pipelineRunWithoutLabels])).toEqual([]);
  });

  it('should ignore an empty-string queue-name label value', () => {
    const pipelineRuns = [createPipelineRun('plr-1', '')];

    expect(getKueueQueueNames(pipelineRuns)).toEqual([]);
  });
});

describe('buildQueuePositionsByPipelineRun', () => {
  it('should return an empty map when there are no workloads', () => {
    expect(buildQueuePositionsByPipelineRun([])).toEqual({});
    expect(buildQueuePositionsByPipelineRun([[]])).toEqual({});
  });

  it('should key the resulting map by PipelineRun name resolved from ownerReferences', () => {
    const workload = createWorkload('plr-1', {
      positionInClusterQueue: 3,
      positionInLocalQueue: 1,
      priority: 700,
    });

    const result = buildQueuePositionsByPipelineRun([[workload]]);

    expect(result).toEqual({
      'plr-1': {
        positionInClusterQueue: 3,
        positionInLocalQueue: 1,
        priority: 700,
        creationTimestamp: '2026-01-01T00:00:00Z',
      },
    });
  });

  it('should flatten workloads from multiple LocalQueues into a single map', () => {
    const workloadA = createWorkload('plr-1', { positionInClusterQueue: 0 });
    const workloadB = createWorkload('plr-2', { positionInClusterQueue: 1 });

    const result = buildQueuePositionsByPipelineRun([[workloadA], [workloadB]]);

    expect(Object.keys(result)).toEqual(['plr-1', 'plr-2']);
  });

  it('should skip workloads with no resolvable PipelineRun owner reference', () => {
    const unowned = createWorkload(undefined);
    const owned = createWorkload('plr-1');

    const result = buildQueuePositionsByPipelineRun([[unowned, owned]]);

    expect(Object.keys(result)).toEqual(['plr-1']);
  });

  it('should ignore owner references that are not of kind PipelineRun', () => {
    const workload = createWorkload('plr-1', {
      ownerReferences: [
        { apiVersion: 'v1', kind: 'ConfigMap', name: 'not-a-pipelinerun', uid: 'uid-cm' },
      ],
    });

    const result = buildQueuePositionsByPipelineRun([[workload]]);

    expect(result).toEqual({});
  });

  it('should find the PipelineRun owner reference even when other owner kinds are present', () => {
    const workload = createWorkload('plr-1', {
      ownerReferences: [
        { apiVersion: 'v1', kind: 'ConfigMap', name: 'not-a-pipelinerun', uid: 'uid-cm' },
        { apiVersion: 'tekton.dev/v1', kind: 'PipelineRun', name: 'plr-1', uid: 'uid-plr-1' },
      ],
    });

    const result = buildQueuePositionsByPipelineRun([[workload]]);

    expect(Object.keys(result)).toEqual(['plr-1']);
  });

  it('should skip a workload with no metadata at all rather than throwing', () => {
    const workloadWithoutMetadata = { ...createWorkload('plr-1'), metadata: undefined };

    expect(() => buildQueuePositionsByPipelineRun([[workloadWithoutMetadata]])).not.toThrow();
    expect(buildQueuePositionsByPipelineRun([[workloadWithoutMetadata]])).toEqual({});
  });

  it('should let the later workload win when two workloads resolve to the same PipelineRun name', () => {
    const stale = createWorkload('plr-1', { positionInClusterQueue: 10 });
    const fresh = createWorkload('plr-1', { positionInClusterQueue: 2 });

    const result = buildQueuePositionsByPipelineRun([[stale], [fresh]]);

    expect(result['plr-1'].positionInClusterQueue).toBe(2);
  });
});
