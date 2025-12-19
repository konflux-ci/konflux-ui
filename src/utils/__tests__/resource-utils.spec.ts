import { PipelineRunKind } from '../../types';
import { K8sResourceCommon } from '../../types/k8s';
import {
  filterDeletedResources,
  filterOutStaleRunningPipelineRunsFromArchive,
} from '../resource-utils';

describe('resource-utils', () => {
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
    const createPipelineRun = (
      name: string,
      conditions?: Array<{ type: string; status: string; reason?: string }>,
    ): PipelineRunKind => ({
      apiVersion: 'tekton.dev/v1',
      kind: 'PipelineRun',
      metadata: {
        name,
        namespace: 'default',
        uid: `uid-${name}`,
        creationTimestamp: '2024-01-01T00:00:00Z',
      },
      spec: {
        pipelineSpec: {
          tasks: [],
        },
      },
      status: conditions
        ? {
            conditions,
            pipelineSpec: {
              tasks: [],
            },
          }
        : {
            pipelineSpec: {
              tasks: [],
            },
          },
    });

    describe('filtering stale running PipelineRuns', () => {
      it('should filter out PipelineRun with Unknown status, Succeeded type, and Running reason', () => {
        const stalePipelineRun = createPipelineRun('stale-run', [
          {
            type: 'Succeeded',
            status: 'Unknown',
            reason: 'Running',
          },
        ]);

        const result = filterOutStaleRunningPipelineRunsFromArchive([stalePipelineRun]);

        expect(result).toHaveLength(0);
      });

      it('should filter out PipelineRun when all conditions match the stale pattern', () => {
        const stalePipelineRun = createPipelineRun('stale-run', [
          {
            type: 'Succeeded',
            status: 'Unknown',
            reason: 'Running',
          },
          {
            type: 'Succeeded',
            status: 'Unknown',
            reason: 'Running',
          },
        ]);

        const result = filterOutStaleRunningPipelineRunsFromArchive([stalePipelineRun]);

        expect(result).toHaveLength(0);
      });

      it('should filter out PipelineRun when any condition matches the stale pattern', () => {
        const stalePipelineRun = createPipelineRun('stale-run', [
          {
            type: 'Succeeded',
            status: 'Unknown',
            reason: 'Running',
          },
          {
            type: 'Succeeded',
            status: 'True',
            reason: 'Succeeded',
          },
        ]);

        const result = filterOutStaleRunningPipelineRunsFromArchive([stalePipelineRun]);

        expect(result).toHaveLength(0);
      });
    });

    describe('keeping valid PipelineRuns', () => {
      it('should keep PipelineRun with completed status', () => {
        const completedPipelineRun = createPipelineRun('completed-run', [
          {
            type: 'Succeeded',
            status: 'True',
            reason: 'Succeeded',
          },
        ]);

        const result = filterOutStaleRunningPipelineRunsFromArchive([completedPipelineRun]);

        expect(result).toHaveLength(1);
        expect(result?.[0].metadata.name).toBe('completed-run');
      });

      it('should keep PipelineRun with failed status', () => {
        const failedPipelineRun = createPipelineRun('failed-run', [
          {
            type: 'Succeeded',
            status: 'False',
            reason: 'Failed',
          },
        ]);

        const result = filterOutStaleRunningPipelineRunsFromArchive([failedPipelineRun]);

        expect(result).toHaveLength(1);
        expect(result?.[0].metadata.name).toBe('failed-run');
      });

      it('should keep PipelineRun with Unknown status but different reason', () => {
        const pendingPipelineRun = createPipelineRun('pending-run', [
          {
            type: 'Succeeded',
            status: 'Unknown',
            reason: 'Pending',
          },
        ]);

        const result = filterOutStaleRunningPipelineRunsFromArchive([pendingPipelineRun]);

        expect(result).toHaveLength(1);
        expect(result?.[0].metadata.name).toBe('pending-run');
      });

      it('should keep PipelineRun with Unknown status and Running reason but different type', () => {
        const differentTypePipelineRun = createPipelineRun('different-type-run', [
          {
            type: 'Ready',
            status: 'Unknown',
            reason: 'Running',
          },
        ]);

        const result = filterOutStaleRunningPipelineRunsFromArchive([differentTypePipelineRun]);

        expect(result).toHaveLength(1);
        expect(result?.[0].metadata.name).toBe('different-type-run');
      });

      it('should keep PipelineRun with Running reason but different status', () => {
        const differentStatusPipelineRun = createPipelineRun('different-status-run', [
          {
            type: 'Succeeded',
            status: 'True',
            reason: 'Running',
          },
        ]);

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
        const emptyConditionsPipelineRun = createPipelineRun('empty-conditions-run', []);

        const result = filterOutStaleRunningPipelineRunsFromArchive([emptyConditionsPipelineRun]);

        expect(result).toHaveLength(1);
        expect(result?.[0].metadata.name).toBe('empty-conditions-run');
      });

      it('should keep PipelineRun with multiple valid conditions', () => {
        const multiConditionPipelineRun = createPipelineRun('multi-condition-run', [
          {
            type: 'Succeeded',
            status: 'True',
            reason: 'Succeeded',
          },
          {
            type: 'Ready',
            status: 'True',
            reason: 'Ready',
          },
        ]);

        const result = filterOutStaleRunningPipelineRunsFromArchive([multiConditionPipelineRun]);

        expect(result).toHaveLength(1);
        expect(result?.[0].metadata.name).toBe('multi-condition-run');
      });
    });
  });
});
