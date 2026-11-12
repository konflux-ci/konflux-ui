import { PipelineRunModel } from '~/models/pipelineruns';
import type { PipelineRunKind } from '~/types';
import { OwnerReference } from '~/types/k8s';
import type { KueuePendingWorkloadKind } from '~/types/kueue';
import { KUEUE_QUEUE_NAME_LABEL } from '../const';
import { getKueueQueuePositionForPipelineRun, isKueueQueueWaitVisible } from '../kueue-utils';

const createWorkload = (
  pipelineRunName: string | undefined,
  overrides: Partial<KueuePendingWorkloadKind> & { ownerReferences?: OwnerReference[] } = {},
): KueuePendingWorkloadKind => {
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
                kind: PipelineRunModel.kind,
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

describe('getKueueQueuePositionForPipelineRun', () => {
  it('should return the position for a matching PipelineRun by UID', () => {
    const workload = createWorkload('plr-1', {
      positionInClusterQueue: 3,
      positionInLocalQueue: 1,
      priority: 700,
    });

    const result = getKueueQueuePositionForPipelineRun([workload], 'uid-plr-1');

    expect(result).toEqual({
      positionInClusterQueue: 3,
      positionInLocalQueue: 1,
      localQueueName: 'pipelines-queue',
      priority: 700,
    });
  });

  it('should return undefined when the PipelineRun UID does not match', () => {
    const workload = createWorkload('plr-other');

    expect(getKueueQueuePositionForPipelineRun([workload], 'uid-plr-1')).toBeUndefined();
  });

  it('should return undefined for an empty workload list', () => {
    expect(getKueueQueuePositionForPipelineRun([], 'uid-plr-1')).toBeUndefined();
  });

  it('should skip workloads whose ownerReference is not kind PipelineRun', () => {
    const workload = createWorkload('plr-1', {
      ownerReferences: [{ apiVersion: 'v1', kind: 'ConfigMap', name: 'plr-1', uid: 'uid-plr-1' }],
    });

    expect(getKueueQueuePositionForPipelineRun([workload], 'uid-plr-1')).toBeUndefined();
  });

  it('should not match a recreated PipelineRun with the same name but different UID', () => {
    const workload = createWorkload('plr-1', {
      ownerReferences: [
        { apiVersion: 'tekton.dev/v1', kind: PipelineRunModel.kind, name: 'plr-1', uid: 'uid-old' },
      ],
    });

    expect(getKueueQueuePositionForPipelineRun([workload], 'uid-new')).toBeUndefined();
  });

  it('should find the PipelineRun owner reference even when other owner kinds are present', () => {
    const workload = createWorkload('plr-1', {
      ownerReferences: [
        { apiVersion: 'v1', kind: 'ConfigMap', name: 'not-a-pipelinerun', uid: 'uid-cm' },
        {
          apiVersion: 'tekton.dev/v1',
          kind: PipelineRunModel.kind,
          name: 'plr-1',
          uid: 'uid-plr-1',
        },
      ],
    });

    const result = getKueueQueuePositionForPipelineRun([workload], 'uid-plr-1');

    expect(result).toBeDefined();
    expect(result?.positionInClusterQueue).toBe(0);
  });

  it('should skip a workload with no metadata at all rather than throwing', () => {
    const workloadWithoutMetadata = { ...createWorkload('plr-1'), metadata: undefined };

    expect(() =>
      getKueueQueuePositionForPipelineRun([workloadWithoutMetadata], 'uid-plr-1'),
    ).not.toThrow();
    expect(
      getKueueQueuePositionForPipelineRun([workloadWithoutMetadata], 'uid-plr-1'),
    ).toBeUndefined();
  });
});

describe('isKueueQueueWaitVisible', () => {
  const createRun = (
    specStatus: string | undefined,
    labels: Record<string, string> | undefined,
  ): PipelineRunKind =>
    ({
      apiVersion: 'tekton.dev/v1',
      kind: 'PipelineRun',
      metadata: { name: 'plr-1', labels },
      spec: specStatus ? { status: specStatus } : {},
    }) as unknown as PipelineRunKind;

  const queueLabel = { [KUEUE_QUEUE_NAME_LABEL]: 'pipelines-queue' };

  it('should be true when the flag is on, the run is pending, and the queue label is set', () => {
    expect(isKueueQueueWaitVisible(createRun('PipelineRunPending', queueLabel), true)).toBe(true);
  });

  it('should be false when the flag is off', () => {
    expect(isKueueQueueWaitVisible(createRun('PipelineRunPending', queueLabel), false)).toBe(false);
  });

  it('should be false for a PAC-only queued run without the Kueue queue label', () => {
    const pacRun = createRun('PipelineRunPending', {
      'pipelinesascode.tekton.dev/state': 'queued',
    });
    expect(isKueueQueueWaitVisible(pacRun, true)).toBe(false);
  });

  it('should be false when the run has no labels', () => {
    expect(isKueueQueueWaitVisible(createRun('PipelineRunPending', undefined), true)).toBe(false);
  });

  it('should be false for a running run that still carries the queue label', () => {
    expect(isKueueQueueWaitVisible(createRun(undefined, queueLabel), true)).toBe(false);
  });

  it('should be false for a run with another spec.status', () => {
    expect(isKueueQueueWaitVisible(createRun('CancelledRunFinally', queueLabel), true)).toBe(false);
  });
});
