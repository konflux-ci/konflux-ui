import { OwnerReference } from '~/types/k8s';
import type { KueuePendingWorkload } from '~/types/kueue';
import { getKueueQueuePositionForPipelineRun } from '../kueue-utils';

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
      priority: 700,
      creationTimestamp: '2026-01-01T00:00:00Z',
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
      ownerReferences: [
        { apiVersion: 'v1', kind: 'ConfigMap', name: 'plr-1', uid: 'uid-plr-1' },
      ],
    });

    expect(getKueueQueuePositionForPipelineRun([workload], 'uid-plr-1')).toBeUndefined();
  });

  it('should not match a recreated PipelineRun with the same name but different UID', () => {
    const workload = createWorkload('plr-1', {
      ownerReferences: [
        { apiVersion: 'tekton.dev/v1', kind: 'PipelineRun', name: 'plr-1', uid: 'uid-old' },
      ],
    });

    expect(getKueueQueuePositionForPipelineRun([workload], 'uid-new')).toBeUndefined();
  });

  it('should find the PipelineRun owner reference even when other owner kinds are present', () => {
    const workload = createWorkload('plr-1', {
      ownerReferences: [
        { apiVersion: 'v1', kind: 'ConfigMap', name: 'not-a-pipelinerun', uid: 'uid-cm' },
        { apiVersion: 'tekton.dev/v1', kind: 'PipelineRun', name: 'plr-1', uid: 'uid-plr-1' },
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
