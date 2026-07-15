import { TEXT_SEARCH_TYPES } from '~/consts/constants';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { PipelineRunKind, PipelineRunStatus } from '~/types';
import { pipelineRunTypes } from '~/utils/pipelinerun-utils';
import { mockPipelineRuns } from '../../../Components/__data__/mock-pipeline-run';
import { createFilterObj, createTextSearchFilterObj, filterPipelineRuns } from '../filter-utils';

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

const filterablePipelineRuns: PipelineRunKind[] = [
  {
    kind: 'PipelineRun',
    apiVersion: 'tekton.dev/v1beta1',
    metadata: {
      name: 'plr-build',
      namespace: 'test',
      labels: {
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
        [PipelineRunLabel.COMPONENT]: 'my-component',
      },
    },
    spec: {},
    status: {
      conditions: [{ status: 'True', type: 'Succeeded' }],
    } as PipelineRunStatus,
  },
  {
    kind: 'PipelineRun',
    apiVersion: 'tekton.dev/v1beta1',
    metadata: {
      name: 'plr-test',
      namespace: 'test',
      labels: {
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
        [PipelineRunLabel.COMPONENT]: 'other-component',
      },
    },
    spec: {},
    status: {
      conditions: [{ status: 'False', type: 'Succeeded' }],
    } as PipelineRunStatus,
  },
];

describe('filter-utils', () => {
  describe('filterPipelineRuns', () => {
    it('should filter pipeline runs by name', () => {
      const result = filterPipelineRuns(filterablePipelineRuns, {
        name: 'plr-build',
        status: [],
        type: [],
      });
      expect(result).toHaveLength(1);
      expect(result[0].metadata.name).toBe('plr-build');
    });

    it('should filter pipeline runs by component label when name matches component', () => {
      const result = filterPipelineRuns(filterablePipelineRuns, {
        name: 'my-component',
        status: [],
        type: [],
      });
      expect(result).toHaveLength(1);
      expect(result[0].metadata.name).toBe('plr-build');
    });

    it('should filter pipeline runs by status', () => {
      const result = filterPipelineRuns(filterablePipelineRuns, {
        name: '',
        status: ['Succeeded'],
        type: [],
      });
      expect(result).toHaveLength(1);
      expect(result[0].metadata.name).toBe('plr-build');
    });

    it('should filter pipeline runs by type', () => {
      const result = filterPipelineRuns(filterablePipelineRuns, {
        name: '',
        status: [],
        type: ['build'],
      });
      expect(result).toHaveLength(1);
      expect(result[0].metadata.name).toBe('plr-build');
    });

    it('should apply custom filter', () => {
      const result = filterPipelineRuns(
        filterablePipelineRuns,
        { name: '', status: [], type: [] },
        (plr) => plr.metadata.name === 'plr-test',
      );
      expect(result).toHaveLength(1);
      expect(result[0].metadata.name).toBe('plr-test');
    });

    it('should return all pipeline runs when filters are empty', () => {
      const result = filterPipelineRuns(filterablePipelineRuns, {
        name: '',
        status: [],
        type: [],
      });
      expect(result).toHaveLength(2);
    });

    it('should throw when filters are invalid', () => {
      expect(() =>
        filterPipelineRuns(filterablePipelineRuns, {
          name: 123 as unknown as string,
          status: [],
          type: [],
        }),
      ).toThrow('Invalid filter');
    });
  });

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

    it('should skip items excluded by filterFn when counting', () => {
      const result = createFilterObj(
        pipelineRuns,
        (plr) => plr?.metadata.labels[PipelineRunLabel.COMMIT_TYPE_LABEL],
        undefined,
        undefined,
        true,
        () => false,
      );

      expect(result).toStrictEqual([]);
    });

    it('should return counts without validKeys when count is true', () => {
      const result = createFilterObj(
        pipelineRuns,
        (plr) => plr?.metadata.labels[PipelineRunLabel.COMMIT_TYPE_LABEL],
        undefined,
        { build: 'Build', test: 'Test' },
        true,
      );

      expect(result).toStrictEqual([
        { key: 'build', count: 2, label: 'Build' },
        { key: 'test', count: 1, label: 'Test' },
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

    it('should skip items with empty keys when building unique keys', () => {
      const result = createFilterObj([{ id: 'a' }, { id: 'b' }], () => undefined);

      expect(result).toStrictEqual([]);
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

  describe('createTextSearchFilterObj', () => {
    it('should set name filter and clear version when search type is Name', () => {
      const setFilters = jest.fn();
      const filters = { name: '', version: 'old' };

      createTextSearchFilterObj('test-name', TEXT_SEARCH_TYPES.NAME, filters, setFilters);

      expect(setFilters).toHaveBeenCalledWith({ name: 'test-name', version: '' });
    });

    it('should set version filter and clear name when search type is Version', () => {
      const setFilters = jest.fn();
      const filters = { name: 'old', version: '' };

      createTextSearchFilterObj('v1.0', TEXT_SEARCH_TYPES.VERSION, filters, setFilters);

      expect(setFilters).toHaveBeenCalledWith({ name: '', version: 'v1.0' });
    });

    it('should set name and clear version when search type is unknown', () => {
      const setFilters = jest.fn();
      const filters = { name: '', version: 'stale' };

      createTextSearchFilterObj('test', 'unknown', filters, setFilters);

      expect(setFilters).toHaveBeenCalledWith({ name: 'test', version: '' });
    });
  });
});
