/* eslint-disable max-nested-callbacks */
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
        [PipelineRunLabel.COMMIT_LABEL]: '686abc123def456',
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
        [PipelineRunLabel.COMMIT_LABEL]: 'abc123def456789',
      },
    },
    spec: {
      key: 'key2',
    },
    status: {
      conditions: [
        {
          status: 'False',
          type: 'Succeeded',
          reason: 'Failed',
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
      annotations: {
        [PipelineRunLabel.COMMIT_ANNOTATION]: '686def789abc012',
      },
    },
    spec: {
      key: 'key3',
    },
    status: {
      conditions: [
        {
          status: 'Unknown',
          type: 'Succeeded',
          reason: 'Running',
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
      name: 'test-service-run',
      namespace: 'test',
      ownerReferences: [
        {
          apiVersion: 'appstudio.redhat.com/v1alpha1',
          kind: 'Component',
          name: 'basic-node-js',
          uid: '6b79df0c-1bee-40c0-81ee-7c4d1c9a422f',
        },
      ],
      resourceVersion: '497868254',
      uid: '9c1f121c-1eb6-490f-b2d9-befbfc658dfd',
      labels: {
        'appstudio.openshift.io/component': 'test-component',
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
        [PipelineRunLabel.TEST_SERVICE_COMMIT]: 'xyz789abc456def',
      },
    },
    spec: {
      key: 'key4',
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
      name: 'cancelled-run',
      namespace: 'test',
      ownerReferences: [
        {
          apiVersion: 'appstudio.redhat.com/v1alpha1',
          kind: 'Component',
          name: 'basic-node-js',
          uid: '6b79df0c-1bee-40c0-81ee-7c4d1c9a422f',
        },
      ],
      resourceVersion: '497868255',
      uid: '9c1f121c-1eb6-490f-b2d9-befbfc658dfe',
      labels: {
        'appstudio.openshift.io/component': 'sample-component',
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
        [PipelineRunLabel.COMMIT_LABEL]: 'def456ghi789jkl',
      },
    },
    spec: {
      key: 'key5',
    },
    status: {
      conditions: [
        {
          status: 'False',
          type: 'Succeeded',
          reason: 'Cancelled',
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
      name: 'pending-run',
      namespace: 'test',
      ownerReferences: [
        {
          apiVersion: 'appstudio.redhat.com/v1alpha1',
          kind: 'Component',
          name: 'basic-node-js',
          uid: '6b79df0c-1bee-40c0-81ee-7c4d1c9a422f',
        },
      ],
      resourceVersion: '497868256',
      uid: '9c1f121c-1eb6-490f-b2d9-befbfc658dff',
      labels: {
        'appstudio.openshift.io/component': 'test-component',
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
      },
    },
    spec: {
      key: 'key6',
    },
    status: {
      conditions: [
        {
          status: 'Unknown',
          type: 'Succeeded',
          reason: 'PipelineRunPending',
        },
      ],
    } as PipelineRunStatus,
  },
];

describe('pipelineruns-filter-utils', () => {
  describe('filterPipelineRuns', () => {
    describe('name filtering', () => {
      it('should filter pipeline runs by exact name match', () => {
        const filters = {
          name: 'basic-node-js-first',
          commit: '',
          status: [],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(1);
        expect(result[0].metadata.name).toBe('basic-node-js-first');
      });

      it('should filter pipeline runs by partial name match (contains)', () => {
        const filters = {
          name: 'first',
          commit: '',
          status: [],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(1);
        expect(result[0].metadata.name).toBe('basic-node-js-first');
      });

      it('should filter pipeline runs by name prefix', () => {
        const filters = {
          name: 'basic-node-js',
          commit: '',
          status: [],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(3);
        const resultNames = result.map((plr) => plr.metadata.name);
        expect(resultNames).toContain('basic-node-js-first');
        expect(resultNames).toContain('basic-node-js-second');
        expect(resultNames).toContain('basic-node-js-third');
      });

      it('should return empty array when name does not match any pipeline run', () => {
        const filters = {
          name: 'non-existent-pipeline',
          commit: '',
          status: [],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(0);
      });

      it('should return all pipeline runs when name is empty', () => {
        const filters = {
          name: '',
          commit: '',
          status: [],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(6);
      });

      it('should handle name with whitespace by returning no matches for extra whitespace', () => {
        const filters = {
          name: ' first ',
          commit: '',
          status: [],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(0); // No pipeline run names have leading/trailing spaces
      });
    });

    describe('commit filtering', () => {
      it('should filter pipeline runs by commit SHA prefix from label', () => {
        const filters = {
          name: '',
          commit: '686',
          status: [],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(2);
        const resultNames = result.map((plr) => plr.metadata.name);
        expect(resultNames).toContain('basic-node-js-first'); // 686abc123def456
        expect(resultNames).toContain('basic-node-js-third'); // 686def789abc012
      });

      it('should filter pipeline runs by full commit SHA', () => {
        const filters = {
          name: '',
          commit: '686abc123def456',
          status: [],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(1);
        expect(result[0].metadata.name).toBe('basic-node-js-first');
      });

      it('should filter pipeline runs by commit SHA from annotation', () => {
        const filters = {
          name: '',
          commit: '686def',
          status: [],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(1);
        expect(result[0].metadata.name).toBe('basic-node-js-third');
      });

      it('should filter pipeline runs by test service commit label', () => {
        const filters = {
          name: '',
          commit: 'xyz789',
          status: [],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(1);
        expect(result[0].metadata.name).toBe('test-service-run');
      });

      it('should be case insensitive when filtering by commit', () => {
        const filters = {
          name: '',
          commit: '686ABC',
          status: [],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(1);
        expect(result[0].metadata.name).toBe('basic-node-js-first'); // 686abc123def456 starts with 686abc
      });

      it('should match multiple commits with same prefix (case insensitive)', () => {
        const filters = {
          name: '',
          commit: '686', // Shorter prefix that matches both
          status: [],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(2);
        const resultNames = result.map((plr) => plr.metadata.name);
        expect(resultNames).toContain('basic-node-js-first'); // 686abc123def456
        expect(resultNames).toContain('basic-node-js-third'); // 686def789abc012
      });

      it('should return empty array when commit does not match any pipeline run', () => {
        const filters = {
          name: '',
          commit: 'nonexistent',
          status: [],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(0);
      });

      it('should exclude pipeline runs without commit SHA when filtering by commit', () => {
        const pipelineRunsWithoutCommit: PipelineRunKind[] = [
          {
            kind: 'PipelineRun',
            apiVersion: 'tekton.dev/v1beta1',
            metadata: {
              creationTimestamp: '2022-08-04T16:23:43Z',
              finalizers: Array['chains.tekton.dev/pipelinerun'],
              name: 'no-commit-run',
              namespace: 'test',
              uid: 'test-uid',
              labels: {
                [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
              },
            },
            spec: {},
          },
        ];
        const filters = {
          name: '',
          commit: '686',
          status: [],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRunsWithoutCommit, filters);
        expect(result.length).toBe(0);
      });

      it('should handle commit with whitespace by trimming', () => {
        const filters = {
          name: '',
          commit: ' 686 ',
          status: [],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(2);
      });

      it('should not use startsWith logic when commit is empty', () => {
        const filters = {
          name: '',
          commit: '',
          status: [],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(6);
      });
    });

    describe('commit takes priority over name', () => {
      it('should filter by commit when both name and commit are provided', () => {
        const filters = {
          name: 'basic-node-js-second',
          commit: '686',
          status: [],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        // Should filter by commit (686), not by name (basic-node-js-second)
        expect(result.length).toBe(2);
        const resultNames = result.map((plr) => plr.metadata.name);
        expect(resultNames).toContain('basic-node-js-first');
        expect(resultNames).toContain('basic-node-js-third');
      });
    });

    describe('status filtering', () => {
      it('should filter pipeline runs by single status (Succeeded)', () => {
        const filters = {
          name: '',
          commit: '',
          status: ['Succeeded'],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(2);
        const resultNames = result.map((plr) => plr.metadata.name).sort();
        expect(resultNames).toEqual(['basic-node-js-first', 'test-service-run']);
      });

      it('should filter pipeline runs by single status (Failed)', () => {
        const filters = {
          name: '',
          commit: '',
          status: ['Failed'],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(1);
        expect(result[0].metadata.name).toBe('basic-node-js-second');
      });

      it('should filter pipeline runs by single status (Running)', () => {
        const filters = {
          name: '',
          commit: '',
          status: ['Running'],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(1);
        expect(result[0].metadata.name).toBe('basic-node-js-third');
      });

      it('should filter pipeline runs by single status (Cancelled)', () => {
        const filters = {
          name: '',
          commit: '',
          status: ['Cancelled'],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(1);
        expect(result[0].metadata.name).toBe('cancelled-run');
      });

      it('should filter pipeline runs by single status (Pending)', () => {
        const filters = {
          name: '',
          commit: '',
          status: ['Pending'],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(1);
        expect(result[0].metadata.name).toBe('pending-run');
      });

      it('should filter pipeline runs by multiple statuses', () => {
        const filters = {
          name: '',
          commit: '',
          status: ['Succeeded', 'Failed'],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(3);
        const resultNames = result.map((plr) => plr.metadata.name).sort();
        expect(resultNames).toEqual([
          'basic-node-js-first',
          'basic-node-js-second',
          'test-service-run',
        ]);
      });

      it('should return all pipeline runs when status array is empty', () => {
        const filters = {
          name: '',
          commit: '',
          status: [],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(6);
      });

      it('should return empty array when status does not match any pipeline run', () => {
        const filters = {
          name: '',
          commit: '',
          status: ['NonExistentStatus'],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(0);
      });

      it('should combine status filter with name filter', () => {
        const filters = {
          name: 'basic-node-js',
          commit: '',
          status: ['Succeeded'],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(1);
        expect(result[0].metadata.name).toBe('basic-node-js-first');
      });

      it('should combine status filter with commit filter', () => {
        const filters = {
          name: '',
          commit: '686',
          status: ['Succeeded'],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(1);
        expect(result[0].metadata.name).toBe('basic-node-js-first');
      });

      it('should combine status filter with type filter', () => {
        const filters = {
          name: '',
          commit: '',
          status: ['Succeeded'],
          type: ['test'],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(2);
        const resultNames = result.map((plr) => plr.metadata.name).sort();
        expect(resultNames).toEqual(['basic-node-js-first', 'test-service-run']);
      });
    });

    describe('type filtering', () => {
      it('should filter pipeline runs by type (build)', () => {
        const filters = {
          name: '',
          commit: '',
          status: [],
          type: ['build'],
        };
        const expectedNames = ['basic-node-js-second', 'basic-node-js-third', 'cancelled-run'];

        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(3);
        const resultNames = result.map((plr) => plr.metadata.name);
        expect(resultNames.sort()).toStrictEqual(expectedNames.sort());
      });

      it('should filter pipeline runs by type (test)', () => {
        const filters = {
          name: '',
          commit: '',
          status: [],
          type: ['test'],
        };
        const expectedNames = ['basic-node-js-first', 'test-service-run', 'pending-run'];

        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(3);
        const resultNames = result.map((plr) => plr.metadata.name);
        expect(resultNames.sort()).toStrictEqual(expectedNames.sort());
      });

      it('should filter pipeline runs by multiple types', () => {
        const filters = {
          name: '',
          commit: '',
          status: [],
          type: ['build', 'test'],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(6);
      });

      it('should return empty array when type does not match any pipeline run', () => {
        const filters = {
          name: '',
          commit: '',
          status: [],
          type: ['nonexistent-type'],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(0);
      });
    });

    describe('custom filter', () => {
      it('should filter pipeline runs by custom filter', () => {
        const filters = {
          name: '',
          commit: '',
          status: [],
          type: [],
        };
        const expectedNames = ['basic-node-js-first', 'basic-node-js-third', 'cancelled-run'];
        const customFilter = (plr: PipelineRunKind) =>
          plr.metadata.labels['appstudio.openshift.io/component'] === 'sample-component';

        const result = filterPipelineRuns(pipelineRuns, filters, customFilter);
        expect(result.length).toBe(3);
        const resultNames = result.map((plr) => plr.metadata.name);
        expect(resultNames.sort()).toStrictEqual(expectedNames.sort());
      });

      it('should combine custom filter with name filter', () => {
        const filters = {
          name: 'first',
          commit: '',
          status: [],
          type: [],
        };
        const customFilter = (plr: PipelineRunKind) =>
          plr.metadata.labels['appstudio.openshift.io/component'] === 'sample-component';

        const result = filterPipelineRuns(pipelineRuns, filters, customFilter);
        expect(result.length).toBe(1);
        expect(result[0].metadata.name).toBe('basic-node-js-first');
      });
    });

    describe('combined filters', () => {
      it('should filter by commit and type', () => {
        const filters = {
          name: '',
          commit: '686',
          status: [],
          type: ['test'],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(1);
        expect(result[0].metadata.name).toBe('basic-node-js-first');
      });

      it('should filter by name and type', () => {
        const filters = {
          name: 'basic-node-js',
          commit: '',
          status: [],
          type: ['build'],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(2);
        const resultNames = result.map((plr) => plr.metadata.name);
        expect(resultNames).toContain('basic-node-js-second');
        expect(resultNames).toContain('basic-node-js-third');
      });

      it('should filter by commit and status', () => {
        const filters = {
          name: '',
          commit: '686',
          status: ['Succeeded'],
          type: [],
        };
        const result = filterPipelineRuns(pipelineRuns, filters);
        expect(result.length).toBe(1);
        expect(result[0].metadata.name).toBe('basic-node-js-first');
      });
    });
  });
});
