import { STALE_ARCHIVE_SUCCEEDED_REASONS } from '~/consts/pipelinerun';
import { PipelineRunModel } from '../../models';
import { PipelineRunKind } from '../../types';
import { K8sResourceCommon } from '../../types/k8s';
import {
  filterDeletedResources,
  filterOutDeletedAndStaleRunningResources,
  filterOutStaleRunningPipelineRunsFromArchive,
} from '../resource-utils';

const STALE_ARCHIVE_REASONS = [...STALE_ARCHIVE_SUCCEEDED_REASONS];

describe('resource-utils', () => {
  const createPipelineRun = (
    name: string,
    {
      conditions,
      deletionTimestamp,
      completionTime,
    }: {
      conditions?: Array<{ type: string; status: string; reason?: string }>;
      deletionTimestamp?: string;
      completionTime?: string;
    } = {},
  ): PipelineRunKind => ({
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name,
      namespace: 'default',
      uid: `uid-${name}`,
      creationTimestamp: '2024-01-01T00:00:00Z',
      ...(deletionTimestamp && { deletionTimestamp }),
    },
    spec: { pipelineSpec: { tasks: [] } },
    status: {
      ...(completionTime && { completionTime }),
      ...(conditions && { conditions }),
      pipelineSpec: { tasks: [] },
    },
  });

  describe('filterDeletedResources', () => {
    it('should filter out resources with deletionTimestamp', () => {
      const resources = [
        { metadata: { name: 'resource-1' } },
        { metadata: { name: 'resource-2', deletionTimestamp: '2024-01-01T00:00:00Z' } },
        { metadata: { name: 'resource-3' } },
      ] as K8sResourceCommon[];

      const result = filterDeletedResources(resources);

      expect(result).toHaveLength(2);
      expect(result[0].metadata.name).toBe('resource-1');
      expect(result[1].metadata.name).toBe('resource-3');
    });

    it('should return all resources when none have deletionTimestamp', () => {
      const resources = [
        { metadata: { name: 'resource-1' } },
        { metadata: { name: 'resource-2' } },
      ] as K8sResourceCommon[];

      const result = filterDeletedResources(resources);

      expect(result).toHaveLength(2);
    });
  });

  describe('filterOutStaleRunningPipelineRunsFromArchive', () => {
    describe('filtering stale running PipelineRuns', () => {
      it.each(STALE_ARCHIVE_REASONS)(
        'should filter out PipelineRun with Unknown status, Succeeded type, and %s reason',
        (reason) => {
          const stalePipelineRun = createPipelineRun('stale-run', {
            conditions: [{ type: 'Succeeded', status: 'Unknown', reason }],
          });

          const result = filterOutStaleRunningPipelineRunsFromArchive([stalePipelineRun]);

          expect(result).toHaveLength(0);
        },
      );

      it('should filter out PipelineRun when all conditions match the stale pattern', () => {
        const stalePipelineRun = createPipelineRun('stale-run', {
          conditions: [
            { type: 'Succeeded', status: 'Unknown', reason: 'Running' },
            { type: 'Succeeded', status: 'Unknown', reason: 'Running' },
          ],
        });

        const result = filterOutStaleRunningPipelineRunsFromArchive([stalePipelineRun]);

        expect(result).toHaveLength(0);
      });

      it('should filter out PipelineRun when any condition matches the stale pattern', () => {
        const stalePipelineRun = createPipelineRun('stale-run', {
          conditions: [
            { type: 'Succeeded', status: 'Unknown', reason: 'Running' },
            { type: 'Succeeded', status: 'True', reason: 'Succeeded' },
          ],
        });

        const result = filterOutStaleRunningPipelineRunsFromArchive([stalePipelineRun]);

        expect(result).toHaveLength(0);
      });
    });

    describe('keeping valid PipelineRuns', () => {
      it('should keep PipelineRun with completed status', () => {
        const completedPipelineRun = createPipelineRun('completed-run', {
          conditions: [{ type: 'Succeeded', status: 'True', reason: 'Succeeded' }],
        });

        const result = filterOutStaleRunningPipelineRunsFromArchive([completedPipelineRun]);

        expect(result).toHaveLength(1);
        expect(result?.[0].metadata.name).toBe('completed-run');
      });

      it('should keep PipelineRun with failed status', () => {
        const failedPipelineRun = createPipelineRun('failed-run', {
          conditions: [{ type: 'Succeeded', status: 'False', reason: 'Failed' }],
        });

        const result = filterOutStaleRunningPipelineRunsFromArchive([failedPipelineRun]);

        expect(result).toHaveLength(1);
        expect(result?.[0].metadata.name).toBe('failed-run');
      });

      it('should keep PipelineRun with Unknown status but different reason', () => {
        const pendingPipelineRun = createPipelineRun('pending-run', {
          conditions: [{ type: 'Succeeded', status: 'Unknown', reason: 'Pending' }],
        });

        const result = filterOutStaleRunningPipelineRunsFromArchive([pendingPipelineRun]);

        expect(result).toHaveLength(1);
        expect(result?.[0].metadata.name).toBe('pending-run');
      });

      it('should keep PipelineRun with Unknown status and Running reason but different type', () => {
        const differentTypePipelineRun = createPipelineRun('different-type-run', {
          conditions: [{ type: 'Ready', status: 'Unknown', reason: 'Running' }],
        });

        const result = filterOutStaleRunningPipelineRunsFromArchive([differentTypePipelineRun]);

        expect(result).toHaveLength(1);
        expect(result?.[0].metadata.name).toBe('different-type-run');
      });

      it('should keep PipelineRun with Running reason but different status', () => {
        const differentStatusPipelineRun = createPipelineRun('different-status-run', {
          conditions: [{ type: 'Succeeded', status: 'True', reason: 'Running' }],
        });

        const result = filterOutStaleRunningPipelineRunsFromArchive([differentStatusPipelineRun]);

        expect(result).toHaveLength(1);
        expect(result?.[0].metadata.name).toBe('different-status-run');
      });

      it('should keep PipelineRun with no conditions', () => {
        const noConditionsPipelineRun = createPipelineRun('no-conditions-run');

        const result = filterOutStaleRunningPipelineRunsFromArchive([noConditionsPipelineRun]);

        expect(result).toHaveLength(1);
        expect(result?.[0].metadata.name).toBe('no-conditions-run');
      });

      it('should keep PipelineRun with empty conditions array', () => {
        const emptyConditionsPipelineRun = createPipelineRun('empty-conditions-run', {
          conditions: [],
        });

        const result = filterOutStaleRunningPipelineRunsFromArchive([emptyConditionsPipelineRun]);

        expect(result).toHaveLength(1);
        expect(result?.[0].metadata.name).toBe('empty-conditions-run');
      });

      it('should keep PipelineRun with multiple valid conditions', () => {
        const multiConditionPipelineRun = createPipelineRun('multi-condition-run', {
          conditions: [
            { type: 'Succeeded', status: 'True', reason: 'Succeeded' },
            { type: 'Ready', status: 'True', reason: 'Ready' },
          ],
        });

        const result = filterOutStaleRunningPipelineRunsFromArchive([multiConditionPipelineRun]);

        expect(result).toHaveLength(1);
        expect(result?.[0].metadata.name).toBe('multi-condition-run');
      });
    });
  });

  describe('filterOutDeletedAndStaleRunningResources', () => {
    it.each(STALE_ARCHIVE_REASONS)(
      'should filter out deleted incomplete PipelineRun with %s reason',
      (reason) => {
        const ghost = createPipelineRun('ghost-run', {
          deletionTimestamp: '2024-01-05T00:00:00Z',
          conditions: [{ type: 'Succeeded', status: 'Unknown', reason }],
        });

        const result = filterOutDeletedAndStaleRunningResources([ghost], PipelineRunModel);

        expect(result).toHaveLength(0);
      },
    );

    it('should keep deleted PipelineRun that completed successfully', () => {
      const completed = createPipelineRun('completed-deleted', {
        deletionTimestamp: '2024-01-05T00:00:00Z',
        completionTime: '2024-01-04T12:00:00Z',
        conditions: [{ type: 'Succeeded', status: 'True', reason: 'Succeeded' }],
      });

      const result = filterOutDeletedAndStaleRunningResources([completed], PipelineRunModel);

      expect(result).toHaveLength(1);
      expect(result[0].metadata.name).toBe('completed-deleted');
    });

    it('should keep live PipelineRun with resolver-pending reason', () => {
      const live = createPipelineRun('live-run', {
        conditions: [{ type: 'Succeeded', status: 'Unknown', reason: 'ResolvingTaskRef' }],
      });

      const result = filterOutDeletedAndStaleRunningResources([live], PipelineRunModel);

      expect(result).toHaveLength(1);
      expect(result[0].metadata.name).toBe('live-run');
    });
  });
});
