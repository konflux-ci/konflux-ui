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
        (plr) => plr.kind === 'PipelineRun',
      );
      const expected = {
        build: 2,
        test: 1,
      };

      expect(result).toStrictEqual(expected);
    });
  });
});
