import { PipelineRunLabel } from '~/consts/pipelinerun';
import { pipelineRunTypes } from '~/utils/pipelinerun-utils';
import { mockPipelineRuns } from '../../../Components/__data__/mock-pipeline-run';
import { createFilterObj } from '../filter-utils';

const pipelineRuns = [
  {
    ...mockPipelineRuns[0],
    metadata: {
      ...mockPipelineRuns[0].metadata,
      labels: {
        ...mockPipelineRuns[0].metadata.labels,
        [PipelineRunLabel.COMMIT_TYPE_LABEL]: 'build',
      },
    },
  },
  {
    ...mockPipelineRuns[0],
    metadata: {
      ...mockPipelineRuns[0].metadata,
      labels: {
        ...mockPipelineRuns[0].metadata.labels,
        [PipelineRunLabel.COMMIT_TYPE_LABEL]: 'build',
      },
    },
  },
  {
    ...mockPipelineRuns[0],
    metadata: {
      ...mockPipelineRuns[0].metadata,
      labels: {
        ...mockPipelineRuns[0].metadata.labels,
        [PipelineRunLabel.COMMIT_TYPE_LABEL]: 'test',
      },
    },
  },
];

describe('filter-utils', () => {
  describe('createFilterObj', () => {
    it('should count pipelinerun keys for filter options', () => {
      const result = createFilterObj(
        pipelineRuns,
        (plr) => plr?.metadata.labels[PipelineRunLabel.COMMIT_TYPE_LABEL],
        pipelineRunTypes,
        undefined,
        true,
        (plr) => plr.kind === 'PipelineRun',
      );

      expect(result).toStrictEqual([
        { key: 'build', count: 2, label: undefined },
        { key: 'release', count: 0, label: undefined },
        { key: 'test', count: 1, label: undefined },
        { key: 'tenant', count: 0, label: undefined },
        { key: 'managed', count: 0, label: undefined },
        { key: 'final', count: 0, label: undefined },
      ]);
    });

    it('should return unique keys without counts when count is false', () => {
      const result = createFilterObj(
        pipelineRuns,
        (plr) => plr?.metadata.labels[PipelineRunLabel.COMMIT_TYPE_LABEL],
        undefined,
        undefined,
        false,
        (plr) => plr.kind === 'PipelineRun',
      );

      expect(result).toStrictEqual([
        { key: 'build', label: undefined },
        { key: 'test', label: undefined },
      ]);
    });

    it('should include labels when provided', () => {
      const labels = { build: 'Build', test: 'Test' };
      const result = createFilterObj(
        pipelineRuns,
        (plr) => plr?.metadata.labels[PipelineRunLabel.COMMIT_TYPE_LABEL],
        ['build', 'test'],
        labels,
      );

      expect(result).toStrictEqual([
        { key: 'build', count: undefined, label: 'Build' },
        { key: 'test', count: undefined, label: 'Test' },
      ]);
    });
  });
});
