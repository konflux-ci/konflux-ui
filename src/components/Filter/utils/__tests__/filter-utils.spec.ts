import { PipelineRunLabel } from '~/consts/pipelinerun';
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
        ['build', 'test'],
        (plr) => plr.kind === 'PipelineRun',
      );
      const expected = {
        build: 2,
        test: 1,
      };

      expect(result).toStrictEqual(expected);
    });

    it('should order keys by descending count', () => {
      const runs = [
        ...pipelineRuns.slice(0, 2).map((plr) => ({
          ...plr,
          metadata: {
            ...plr.metadata,
            labels: {
              ...plr.metadata.labels,
              [PipelineRunLabel.COMMIT_TYPE_LABEL]: 'test',
            },
          },
        })),
        {
          ...pipelineRuns[0],
          metadata: {
            ...pipelineRuns[0].metadata,
            labels: {
              ...pipelineRuns[0].metadata.labels,
              [PipelineRunLabel.COMMIT_TYPE_LABEL]: 'build',
            },
          },
        },
      ];

      const result = createFilterObj(
        runs,
        (plr) => plr?.metadata.labels[PipelineRunLabel.COMMIT_TYPE_LABEL],
        ['build', 'test'],
        (plr) => plr.kind === 'PipelineRun',
      );

      expect(Object.keys(result)).toEqual(['test', 'build']);
      expect(result).toEqual({ test: 2, build: 1 });
    });

    it('counts keys dynamically when validKeys is omitted', () => {
      const result = createFilterObj(
        pipelineRuns,
        (plr) => plr?.metadata.labels[PipelineRunLabel.COMMIT_TYPE_LABEL],
      );
      expect(result).toEqual({ build: 2, test: 1 });
    });
  });
});
