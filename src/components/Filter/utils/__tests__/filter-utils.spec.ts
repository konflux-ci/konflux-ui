import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { PipelineRunKind, PipelineRunStatus } from '~/types';
import { mockPipelineRuns } from '../../../Components/__data__/mock-pipeline-run';
import { filterPipelineRuns } from '../filter-utils';

const basePlr = mockPipelineRuns[0] as PipelineRunKind;

const plrBuildSucceeded: PipelineRunKind = {
  ...basePlr,
  metadata: {
    ...basePlr.metadata,
    name: 'python-sample-942fq',
    labels: {
      ...basePlr.metadata.labels,
      [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD as string,
    },
  },
};

const plrTestPending: PipelineRunKind = {
  ...basePlr,
  metadata: {
    ...basePlr.metadata,
    name: 'other-run-xyz',
    labels: {
      ...basePlr.metadata.labels,
      [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST as string,
    },
  },
  status: {
    conditions: [],
  } as PipelineRunStatus,
};

const runs = [plrBuildSucceeded, plrTestPending];

describe('filter-utils', () => {
  describe('filterPipelineRuns', () => {
    it('throws when name is not a string', () => {
      expect(() =>
        filterPipelineRuns(runs, { name: [] as unknown as string, status: [], type: [] }),
      ).toThrow('Invalid filter');
    });

    it('throws when status is not an array', () => {
      expect(() =>
        filterPipelineRuns(runs, { name: '', status: 'bad' as unknown as string[], type: [] }),
      ).toThrow('Invalid filter');
    });

    it('throws when type is not an array', () => {
      expect(() =>
        filterPipelineRuns(runs, { name: '', status: [], type: 'bad' as unknown as string[] }),
      ).toThrow('Invalid filter');
    });

    it('returns all runs when filters are empty', () => {
      expect(filterPipelineRuns(runs, { name: '', status: [], type: [] })).toHaveLength(2);
    });

    it('filters by pipeline run name substring', () => {
      const result = filterPipelineRuns(runs, { name: '942fq', status: [], type: [] });
      expect(result).toEqual([plrBuildSucceeded]);
    });

    it('filters by component label substring (case-insensitive query)', () => {
      const result = filterPipelineRuns(runs, { name: '  BASIC-node ', status: [], type: [] });
      expect(result).toEqual([plrBuildSucceeded, plrTestPending]);
    });

    it('filters by status', () => {
      const result = filterPipelineRuns(runs, { name: '', status: ['Pending'], type: [] });
      expect(result).toEqual([plrTestPending]);
    });

    it('filters by pipeline type label', () => {
      const result = filterPipelineRuns(runs, {
        name: '',
        status: [],
        type: [PipelineRunType.TEST],
      });
      expect(result).toEqual([plrTestPending]);
    });

    it('applies customFilter when provided', () => {
      const result = filterPipelineRuns(
        runs,
        { name: '', status: [], type: [] },
        (plr) => plr.metadata.name === 'other-run-xyz',
      );
      expect(result).toEqual([plrTestPending]);
    });

    it('combines name, status, and type filters', () => {
      const result = filterPipelineRuns(runs, {
        name: 'other',
        status: ['Pending'],
        type: [PipelineRunType.TEST],
      });
      expect(result).toEqual([plrTestPending]);
    });
  });
});
