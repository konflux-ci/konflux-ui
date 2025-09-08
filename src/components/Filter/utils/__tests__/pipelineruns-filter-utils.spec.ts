import { PipelineRunLabel, PipelineRunType } from '../../../../consts/pipelinerun';
import { PipelineRunKind, PipelineRunStatus } from '../../../../types';
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
  });
});
