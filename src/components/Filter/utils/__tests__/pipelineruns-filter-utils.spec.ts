import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { PipelineRunKind, PipelineRunStatus } from '~/types';
import { filterPipelineRuns } from '../pipelineruns-filter-utils';

const pipelineRuns: PipelineRunKind[] = [
  {
    kind: 'PipelineRun',
    apiVersion: 'tekton.dev/v1beta1',
    metadata: {
      creationTimestamp: '2022-08-04T16:23:43Z',
      finalizers: Array['chains.tekton.dev/pipelinerun'],
      name: 'basic-node-js-first',
      namespace: 'test',
      ownerReferences: [
        {
          apiVersion: 'appstudio.redhat.com/v1alpha1',
          kind: 'Component',
          name: 'basic-node-js',
          uid: '6b79df0c-1bee-40c0-81ee-7c4d1c9a422f',
        },
      ],
      resourceVersion: '497868251',
      uid: '9c1f121c-1eb6-490f-b2d9-befbfc658df1',
      labels: {
        'appstudio.openshift.io/component': 'sample-component',
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
        [PipelineRunLabel.COMPONENT_VERSION]: 'v1.0',
      },
    },
    spec: {
      key: 'key1',
    },
    status: {
      conditions: [
        {
          status: 'True',
          type: 'Succeeded',
        },
      ],
    } as PipelineRunStatus,
  },
  {
    kind: 'PipelineRun',
    apiVersion: 'tekton.dev/v1beta1',
    metadata: {
      creationTimestamp: '2022-08-04T16:23:43Z',
      finalizers: Array['chains.tekton.dev/pipelinerun'],
      name: 'basic-node-js-second',
      namespace: 'test',
      ownerReferences: [
        {
          apiVersion: 'appstudio.redhat.com/v1alpha1',
          kind: 'Component',
          name: 'basic-node-js',
          uid: '6b79df0c-1bee-40c0-81ee-7c4d1c9a422f',
        },
      ],
      resourceVersion: '497868252',
      uid: '9c1f121c-1eb6-490f-b2d9-befbfc658dfb',
      labels: {
        'appstudio.openshift.io/component': 'test-component',
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
        [PipelineRunLabel.COMPONENT_VERSION]: 'v2.0',
      },
    },
    spec: {
      key: 'key2',
    },
  },
  {
    kind: 'PipelineRun',
    apiVersion: 'tekton.dev/v1beta1',
    metadata: {
      creationTimestamp: '2022-08-04T16:23:43Z',
      finalizers: Array['chains.tekton.dev/pipelinerun'],
      name: 'basic-node-js-third',
      namespace: 'test',
      ownerReferences: [
        {
          apiVersion: 'appstudio.redhat.com/v1alpha1',
          kind: 'Component',
          name: 'basic-node-js',
          uid: '6b79df0c-1bee-40c0-81ee-7c4d1c9a422f',
        },
      ],
      resourceVersion: '497868253',
      uid: '9c1f121c-1eb6-490f-b2d9-befbfc658dfc',
      labels: {
        'appstudio.openshift.io/component': 'sample-component',
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
        [PipelineRunLabel.COMPONENT_VERSION]: 'v1.0',
      },
    },
    spec: {
      key: 'key3',
    },
  },
];

describe('pipelineruns-filter-utils', () => {
  describe('filterPipelineRuns', () => {
    it('should filter pipeline runs by name', () => {
      const filters = {
        name: 'basic-node-js-first',
        status: [],
        type: [],
      };
      const result = filterPipelineRuns(pipelineRuns, filters);
      expect(result.length).toBe(1);
      expect(result[0].metadata.name).toBe('basic-node-js-first');
    });

    it('should filter pipeline runs by status', () => {
      const filters = {
        name: '',
        status: ['Succeeded'],
        type: [],
      };
      const result = filterPipelineRuns(pipelineRuns, filters);
      expect(result.length).toBe(1);
      expect(result[0].metadata.name).toBe('basic-node-js-first');
    });

    it('should filter pipeline runs by type', () => {
      const filters = {
        name: '',
        status: [],
        type: ['build'],
      };
      const expectedNames = ['basic-node-js-second', 'basic-node-js-third'];

      const result = filterPipelineRuns(pipelineRuns, filters);
      expect(result.length).toBe(2);
      const resultNames = [result[0].metadata.name, result[1].metadata.name];
      expect(resultNames.sort()).toStrictEqual(expectedNames.sort());
    });

    it('should filter pipeline runs by custom filter', () => {
      const filters = {
        name: '',
        status: [],
        type: [],
      };
      const expectedNames = ['basic-node-js-first', 'basic-node-js-third'];
      const customFilter = (plr: PipelineRunKind) =>
        plr.metadata.labels['appstudio.openshift.io/component'] === 'sample-component';

      const result = filterPipelineRuns(pipelineRuns, filters, customFilter);
      expect(result.length).toBe(2);
      const resultNames = [result[0].metadata.name, result[1].metadata.name];
      expect(resultNames.sort()).toStrictEqual(expectedNames.sort());
    });

    it('should filter pipeline runs by version using textMatch', () => {
      const filters = {
        name: '',
        status: [],
        type: [],
        version: 'v2.0',
      };
      const result = filterPipelineRuns(pipelineRuns, filters);
      expect(result).toHaveLength(1);
      expect(result[0].metadata.name).toBe('basic-node-js-second');
    });

    it('should match multiple pipeline runs when version text is shared', () => {
      const filters = {
        name: '',
        status: [],
        type: [],
        version: 'v1.0',
      };
      const result = filterPipelineRuns(pipelineRuns, filters);
      expect(result).toHaveLength(2);
    });

    it('should filter pipeline runs by component name when componentName is provided', () => {
      const filters = {
        name: '',
        status: [],
        type: [],
      };
      const result = filterPipelineRuns(pipelineRuns, filters, undefined, 'sample-component');
      expect(result).toHaveLength(2);
      expect(result.map((plr) => plr.metadata.name).sort()).toStrictEqual(
        ['basic-node-js-first', 'basic-node-js-third'].sort(),
      );
    });

    it('should not filter by status or type when they are undefined', () => {
      const filters = {
        name: '',
        version: '',
      };
      const result = filterPipelineRuns(pipelineRuns, filters);
      expect(result).toHaveLength(3);
    });

    it('should return all pipeline runs when version is an empty string', () => {
      const filters = {
        name: '',
        status: [],
        type: [],
        version: '',
      };
      const result = filterPipelineRuns(pipelineRuns, filters);
      expect(result).toHaveLength(3);
    });

    it('should return all pipeline runs when version is undefined (backward compat)', () => {
      const filters = {
        name: '',
        status: [],
        type: [],
      };
      const result = filterPipelineRuns(pipelineRuns, filters);
      expect(result).toHaveLength(3);
    });

    const makeRun = (
      labels: Record<string, string>,
      annotations?: Record<string, string>,
    ): PipelineRunKind =>
      ({
        ...pipelineRuns[0],
        metadata: {
          ...pipelineRuns[0].metadata,
          labels,
          ...(annotations ? { annotations } : {}),
        },
      }) as PipelineRunKind;

    describe('version sources (V2 label, legacy label, V2 annotation)', () => {
      const versionFilters = (version: string) => ({
        name: '',
        status: [],
        type: [],
        version,
      });

      it('should match a run whose version is only set as the V2 label', () => {
        const run = makeRun({ [PipelineRunLabel.V2_COMPONENT_VERSION]: 'v9.0' });
        expect(filterPipelineRuns([run], versionFilters('v9.0'))).toHaveLength(1);
      });

      it('should match a run whose version is only set as the legacy label', () => {
        const run = makeRun({ [PipelineRunLabel.COMPONENT_VERSION]: 'v9.0' });
        expect(filterPipelineRuns([run], versionFilters('v9.0'))).toHaveLength(1);
      });

      it('should match a run whose version is only set as the V2 annotation', () => {
        const run = makeRun({}, { [PipelineRunLabel.V2_COMPONENT_VERSION]: 'v9.0' });
        expect(filterPipelineRuns([run], versionFilters('v9.0'))).toHaveLength(1);
      });

      it('should prefer the V2 label over the legacy label', () => {
        const run = makeRun({
          [PipelineRunLabel.V2_COMPONENT_VERSION]: 'v2-label',
          [PipelineRunLabel.COMPONENT_VERSION]: 'legacy-label',
        });
        expect(filterPipelineRuns([run], versionFilters('v2-label'))).toHaveLength(1);
        expect(filterPipelineRuns([run], versionFilters('legacy-label'))).toHaveLength(0);
      });

      it('should exclude a run with no version source when filtering by version', () => {
        const run = makeRun({});
        expect(filterPipelineRuns([run], versionFilters('v9.0'))).toHaveLength(0);
      });
    });

    describe('type and component sources (V2 vs legacy labels)', () => {
      it('should match a run whose type is only set as the V2 label', () => {
        const run = makeRun({ [PipelineRunLabel.V2_PIPELINE_TYPE]: PipelineRunType.BUILD });
        expect(filterPipelineRuns([run], { name: '', status: [], type: ['build'] })).toHaveLength(
          1,
        );
      });

      it('should match a run whose component is only set as the V2 label', () => {
        const run = makeRun({ [PipelineRunLabel.V2_COMPONENT]: 'sample-component' });
        expect(
          filterPipelineRuns(
            [run],
            { name: '', status: [], type: [] },
            undefined,
            'sample-component',
          ),
        ).toHaveLength(1);
      });
    });
  });
});
