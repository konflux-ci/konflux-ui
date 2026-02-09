import { saveAs } from 'file-saver';
import { FeatureFlagsStore } from '~/feature-flags/store';
import { fetchResourceWithK8sAndKubeArchive } from '~/kubearchive/resource-utils';
import { ResourceSource } from '~/types/k8s';
import { commonFetchText } from '../../../../../k8s';
import { getK8sResourceURL } from '../../../../../k8s/k8s-utils';
import { PodModel } from '../../../../../models/pod';
import { TaskRunKind } from '../../../../../types';
import { getTaskRunLog } from '../../../../../utils/tekton-results';
import { LineBuffer } from '../../../../utils/line-buffer';
import { ContainerSpec, ContainerStatus, PodKind } from '../../../types';
import {
  containerToLogSourceStatus,
  LOG_SOURCE_TERMINATED,
  LOG_SOURCE_WAITING,
  LOG_SOURCE_RUNNING,
} from '../../utils';
import { getRenderContainers, getDownloadAllLogsCallback } from '../logs-utils';

// Mock all external dependencies
jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

jest.mock('~/feature-flags/store', () => ({
  FeatureFlagsStore: {
    isOn: jest.fn(),
  },
}));

jest.mock('~/feature-flags/flags', () => ({
  FLAGS: {
    'kubearchive-logs': { key: 'kubearchive-logs' },
  },
}));

jest.mock('~/kubearchive/resource-utils', () => ({
  fetchResourceWithK8sAndKubeArchive: jest.fn(),
}));

jest.mock('~/types/k8s', () => ({
  ResourceSource: {
    Cluster: 'cluster',
    Archive: 'archive',
  },
}));

jest.mock('../../../../../k8s', () => ({
  commonFetchText: jest.fn(),
}));

jest.mock('../../../../../k8s/k8s-utils', () => ({
  getK8sResourceURL: jest.fn(),
}));

jest.mock('../../../../../models/pod', () => ({
  PodModel: {
    apiVersion: 'v1',
    kind: 'Pod',
    namespaced: true,
    plural: 'pods',
  },
}));

jest.mock('../../../../../types');

jest.mock('../../../../../utils/tekton-results', () => ({
  getTaskRunLog: jest.fn(),
}));

jest.mock('../../../../utils/line-buffer', () => ({
  LineBuffer: jest.fn().mockImplementation(() => ({
    ingest: jest.fn(),
    getBlob: jest.fn().mockReturnValue(new Blob(['test logs'])),
    clear: jest.fn(),
    append: jest.fn(),
    getData: jest.fn(),
    isEmpty: jest.fn(),
    getLines: jest.fn(),
    getHasTruncated: jest.fn(),
    getTail: jest.fn(),
    length: jest.fn().mockReturnValue(0),
  })),
}));

jest.mock('../../utils', () => ({
  containerToLogSourceStatus: jest.fn(),
  LOG_SOURCE_TERMINATED: 'terminated',
  LOG_SOURCE_WAITING: 'waiting',
  LOG_SOURCE_RUNNING: 'running',
}));

const mockSaveAs = saveAs as jest.Mock;
const mockFeatureFlagsStore = FeatureFlagsStore as jest.Mocked<typeof FeatureFlagsStore>;
const mockFetchResourceWithK8sAndKubeArchive =
  fetchResourceWithK8sAndKubeArchive as jest.MockedFunction<
    typeof fetchResourceWithK8sAndKubeArchive
  >;
const mockCommonFetchText = commonFetchText as jest.MockedFunction<typeof commonFetchText>;
const mockGetK8sResourceURL = getK8sResourceURL as jest.MockedFunction<typeof getK8sResourceURL>;
const mockGetTaskRunLog = getTaskRunLog as jest.MockedFunction<typeof getTaskRunLog>;
const mockLineBuffer = LineBuffer as jest.MockedClass<typeof LineBuffer>;
const mockContainerToLogSourceStatus = containerToLogSourceStatus as jest.MockedFunction<
  typeof containerToLogSourceStatus
>;

describe('logs-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRenderContainers', () => {
    const createMockContainer = (name: string): ContainerSpec => ({
      name,
      volumeMounts: [],
      volumeDevices: [],
      env: [],
      ports: [],
    });

    const createMockContainerStatus = (
      name: string,
      state: Record<string, unknown> = {},
    ): ContainerStatus => ({
      name,
      state,
      ready: true,
      restartCount: 0,
      image: 'test-image',
      imageID: 'test-image-id',
    });

    it('should return empty containers and stillFetching false when pod is undefined', () => {
      const result = getRenderContainers(undefined);
      expect(result).toEqual({
        containers: [],
        stillFetching: false,
      });
    });

    it('should return empty containers and stillFetching false when pod has no spec', () => {
      const pod: PodKind = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'test-pod' },
        spec: { containers: [] },
      };

      const result = getRenderContainers(pod);
      expect(result).toEqual({
        containers: [],
        stillFetching: false,
      });
    });

    it('should return all containers when no container statuses exist', () => {
      const containers = [createMockContainer('container-1'), createMockContainer('container-2')];

      const pod: PodKind = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'test-pod' },
        spec: { containers },
      };

      mockContainerToLogSourceStatus.mockReturnValue(LOG_SOURCE_TERMINATED);

      const result = getRenderContainers(pod);
      expect(result).toEqual({
        containers,
        stillFetching: false,
      });
    });

    it('should sort container statuses correctly and return all terminated containers', () => {
      const containers = [
        createMockContainer('container-1'),
        createMockContainer('container-2'),
        createMockContainer('container-3'),
      ];

      const containerStatuses = [
        createMockContainerStatus('container-3'),
        createMockContainerStatus('container-1'),
        createMockContainerStatus('container-2'),
      ];

      const pod: PodKind = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'test-pod' },
        spec: { containers },
        status: {
          phase: 'Running',
          containerStatuses,
        },
      };

      mockContainerToLogSourceStatus.mockReturnValue(LOG_SOURCE_TERMINATED);

      const result = getRenderContainers(pod);
      expect(result).toEqual({
        containers,
        stillFetching: false,
      });
    });

    it('should return subset of containers when first running container is found and set stillFetching true', () => {
      const containers = [
        createMockContainer('container-1'),
        createMockContainer('container-2'),
        createMockContainer('container-3'),
      ];

      const containerStatuses = [
        createMockContainerStatus('container-1'),
        createMockContainerStatus('container-2'),
        createMockContainerStatus('container-3'),
      ];

      const pod: PodKind = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'test-pod' },
        spec: { containers },
        status: {
          phase: 'Running',
          containerStatuses,
        },
      };

      mockContainerToLogSourceStatus
        .mockReturnValueOnce(LOG_SOURCE_TERMINATED)
        .mockReturnValueOnce(LOG_SOURCE_RUNNING)
        .mockReturnValueOnce(LOG_SOURCE_WAITING);

      const result = getRenderContainers(pod);
      expect(result).toEqual({
        containers: containers.slice(0, 2),
        stillFetching: true,
      });
    });

    it('should handle missing container status in sorted array', () => {
      const containers = [createMockContainer('container-1'), createMockContainer('container-2')];

      const containerStatuses = [
        createMockContainerStatus('container-2'), // Only second container has status
      ];

      const pod: PodKind = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'test-pod' },
        spec: { containers },
        status: {
          phase: 'Running',
          containerStatuses,
        },
      };

      mockContainerToLogSourceStatus
        .mockReturnValueOnce(LOG_SOURCE_TERMINATED) // For undefined status
        .mockReturnValueOnce(LOG_SOURCE_RUNNING);

      const result = getRenderContainers(pod);
      expect(result).toEqual({
        containers: containers.slice(0, 1),
        stillFetching: true,
      });
    });
  });

  describe('getDownloadAllLogsCallback', () => {
    const mockTaskRun: TaskRunKind = {
      apiVersion: 'tekton.dev/v1beta1',
      kind: 'TaskRun',
      metadata: {
        name: 'test-taskrun',
        uid: 'test-uid',
        ownerReferences: [
          {
            kind: 'PipelineRun',
            name: 'test-pipelinerun',
            uid: 'pipelinerun-uid',
            apiVersion: 'tekton.dev/v1beta1',
          },
        ],
      },
      spec: {
        taskRef: {
          name: 'test-task',
        },
      },
      status: {
        podName: 'test-pod',
      },
    };

    const mockContainerStatus: ContainerStatus = {
      name: 'step-test',
      state: { running: {} },
      ready: true,
      restartCount: 0,
      image: 'test-image',
      imageID: 'test-image-id',
    };

    it('should handle empty task run names', async () => {
      const callback = getDownloadAllLogsCallback([], [], 'test-ns', 'test-pipeline');

      mockFeatureFlagsStore.isOn.mockReturnValue(false);

      await callback();

      expect(mockLineBuffer).toHaveBeenCalled();
      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'test-pipeline.log');
    });

    it('should download logs from cluster using commonFetchText', async () => {
      const sortedTaskRunNames = ['test-taskrun'];
      const taskRuns = [mockTaskRun];

      mockFetchResourceWithK8sAndKubeArchive.mockResolvedValue({
        resource: {
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: { name: 'test-pod' },
          spec: {
            containers: [{ name: 'step-test' }],
          },
          status: {
            containerStatuses: [mockContainerStatus],
          },
        },
        source: ResourceSource.Cluster,
      });

      mockFeatureFlagsStore.isOn.mockReturnValue(false);
      mockContainerToLogSourceStatus.mockReturnValue(LOG_SOURCE_TERMINATED);
      mockGetK8sResourceURL.mockReturnValue('http://test-url');
      mockCommonFetchText.mockResolvedValue('test log content');

      const callback = getDownloadAllLogsCallback(
        sortedTaskRunNames,
        taskRuns,
        'test-ns',
        'test-pipeline',
      );

      await callback();

      expect(mockFetchResourceWithK8sAndKubeArchive).toHaveBeenCalledWith({
        model: PodModel,
        queryOptions: { ns: 'test-ns', name: 'test-pod' },
      });
      // Cluster source should use commonFetchText without kubearchive prefix
      expect(mockCommonFetchText).toHaveBeenCalledWith('http://test-url', undefined);
      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'test-pipeline.log');
    });

    it('should handle mixed container statuses correctly', async () => {
      const sortedTaskRunNames = ['test-taskrun'];
      const taskRuns = [mockTaskRun];

      const mockWaitingContainer: ContainerStatus = {
        name: 'step-waiting',
        state: { waiting: { reason: 'PodInitializing' } },
        ready: false,
        restartCount: 0,
        image: 'test-image',
        imageID: 'test-image-id',
      };

      const mockTerminatedContainer: ContainerStatus = {
        name: 'step-terminated',
        state: { terminated: { exitCode: 0 } },
        ready: false,
        restartCount: 0,
        image: 'test-image',
        imageID: 'test-image-id',
      };

      mockFetchResourceWithK8sAndKubeArchive.mockResolvedValue({
        resource: {
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: { name: 'test-pod' },
          spec: {
            containers: [{ name: 'step-waiting' }, { name: 'step-terminated' }],
          },
          status: {
            containerStatuses: [mockWaitingContainer, mockTerminatedContainer],
          },
        },
        source: ResourceSource.Cluster,
      });

      mockFeatureFlagsStore.isOn.mockReturnValue(false);

      // Mock different statuses for different containers
      mockContainerToLogSourceStatus
        .mockReturnValueOnce(LOG_SOURCE_WAITING) // For waiting container
        .mockReturnValueOnce(LOG_SOURCE_TERMINATED); // For terminated container

      mockGetK8sResourceURL.mockReturnValue('http://test-url');
      mockCommonFetchText.mockResolvedValue('test log content');

      const callback = getDownloadAllLogsCallback(
        sortedTaskRunNames,
        taskRuns,
        'test-ns',
        'test-pipeline',
      );

      await callback();

      // Should only call commonFetchText for non-waiting containers
      expect(mockCommonFetchText).toHaveBeenCalledTimes(1);
      expect(mockCommonFetchText).toHaveBeenCalledWith('http://test-url', undefined);
      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'test-pipeline.log');
    });

    it('should handle commonFetchText errors gracefully and continue processing', async () => {
      const sortedTaskRunNames = ['test-taskrun'];
      const taskRuns = [mockTaskRun];

      mockFetchResourceWithK8sAndKubeArchive.mockResolvedValue({
        resource: {
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: { name: 'test-pod' },
          spec: {
            containers: [{ name: 'step-test' }],
          },
          status: {
            containerStatuses: [mockContainerStatus],
          },
        },
        source: ResourceSource.Cluster,
      });

      mockFeatureFlagsStore.isOn.mockReturnValue(false);
      mockContainerToLogSourceStatus.mockReturnValue(LOG_SOURCE_TERMINATED);
      mockGetK8sResourceURL.mockReturnValue('http://test-url');
      mockCommonFetchText.mockRejectedValue(new Error('Fetch failed'));

      // Mock console.warn to avoid noise in test output
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const callback = getDownloadAllLogsCallback(
        sortedTaskRunNames,
        taskRuns,
        'test-ns',
        'test-pipeline',
      );

      await callback();

      // Should log the error but continue processing
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Error downloading logs for 'step-test' of task 'test-task'",
        expect.any(Error),
      );
      // Should still save the file even with fetch errors
      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'test-pipeline.log');

      consoleWarnSpy.mockRestore();
    });

    it('should use tekton when archive source and kubearchive disabled', async () => {
      const sortedTaskRunNames = ['test-taskrun'];
      const taskRuns = [mockTaskRun];

      // When kubearchive is disabled and source is Archive, stepsList should be empty
      mockFetchResourceWithK8sAndKubeArchive.mockResolvedValue({
        resource: {
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: { name: 'test-pod' },
          spec: {
            containers: [],
          },
          status: {
            containerStatuses: [],
          },
        },
        source: ResourceSource.Archive,
      });

      mockFeatureFlagsStore.isOn.mockReturnValue(false);
      mockGetTaskRunLog.mockResolvedValue('task run log content');

      const callback = getDownloadAllLogsCallback(
        sortedTaskRunNames,
        taskRuns,
        'test-ns',
        'test-pipeline',
      );

      await callback();

      // Should use tekton when steps.length === 0
      expect(mockGetTaskRunLog).toHaveBeenCalledWith('test-ns', 'test-uid', 'pipelinerun-uid');
      expect(mockCommonFetchText).not.toHaveBeenCalled();
      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'test-pipeline.log');
    });

    it('should handle pod fetch errors', async () => {
      const sortedTaskRunNames = ['test-taskrun'];
      const taskRuns = [mockTaskRun];

      mockFetchResourceWithK8sAndKubeArchive.mockRejectedValue(new Error('Pod fetch failed'));

      // Mock console.warn to avoid noise in test output
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const callback = getDownloadAllLogsCallback(
        sortedTaskRunNames,
        taskRuns,
        'test-ns',
        'test-pipeline',
      );

      await callback();

      expect(consoleWarnSpy).toHaveBeenCalledWith('Error Downloading logs', expect.any(Error));
      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'test-pipeline.log');

      consoleWarnSpy.mockRestore();
    });

    it('should use kubearchive with prefix when archive source and kubearchive enabled', async () => {
      const sortedTaskRunNames = ['test-taskrun'];
      const taskRuns = [mockTaskRun];

      // When kubearchive is enabled and source is Archive, should have steps and use kubearchive prefix
      mockFetchResourceWithK8sAndKubeArchive.mockResolvedValue({
        resource: {
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: { name: 'test-pod' },
          spec: {
            containers: [{ name: 'step-test' }],
          },
          status: {
            containerStatuses: [mockContainerStatus],
          },
        },
        source: ResourceSource.Archive,
      });

      mockFeatureFlagsStore.isOn.mockReturnValue(true); // kubearchive enabled
      mockContainerToLogSourceStatus.mockReturnValue(LOG_SOURCE_TERMINATED);
      mockGetK8sResourceURL.mockReturnValue('http://test-url');
      mockCommonFetchText.mockResolvedValue('kubearchive log content');

      const callback = getDownloadAllLogsCallback(
        sortedTaskRunNames,
        taskRuns,
        'test-ns',
        'test-pipeline',
      );

      await callback();

      // Should use commonFetchText with kubearchive prefix when enabled and source is Archive
      expect(mockCommonFetchText).toHaveBeenCalledWith('http://test-url', {
        pathPrefix: 'plugins/kubearchive',
      });
      expect(mockGetTaskRunLog).not.toHaveBeenCalled();
      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'test-pipeline.log');
    });

    it('should use tekton when pod has no containers (empty steps)', async () => {
      const sortedTaskRunNames = ['test-taskrun'];
      const taskRuns = [mockTaskRun];

      // Pod with no containers should result in empty steps, triggering tekton path
      mockFetchResourceWithK8sAndKubeArchive.mockResolvedValue({
        resource: {
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: { name: 'test-pod' },
          spec: {
            containers: [], // No containers
          },
          status: {
            containerStatuses: [],
          },
        },
        source: ResourceSource.Cluster,
      });

      mockFeatureFlagsStore.isOn.mockReturnValue(false);
      mockGetTaskRunLog.mockResolvedValue('tekton log content');

      const callback = getDownloadAllLogsCallback(
        sortedTaskRunNames,
        taskRuns,
        'test-ns',
        'test-pipeline',
      );

      await callback();

      // Should use tekton when steps.length === 0 (no containers)
      expect(mockGetTaskRunLog).toHaveBeenCalledWith('test-ns', 'test-uid', 'pipelinerun-uid');
      expect(mockCommonFetchText).not.toHaveBeenCalled();
      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'test-pipeline.log');
    });

    it('should handle empty tekton logs gracefully', async () => {
      const sortedTaskRunNames = ['test-taskrun'];
      const taskRuns = [mockTaskRun];

      mockFetchResourceWithK8sAndKubeArchive.mockResolvedValue({
        resource: {
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: { name: 'test-pod' },
          spec: {
            containers: [],
          },
          status: {
            containerStatuses: [],
          },
        },
        source: ResourceSource.Archive,
      });

      mockFeatureFlagsStore.isOn.mockReturnValue(false);
      // Mock tekton returning empty logs
      mockGetTaskRunLog.mockResolvedValue('');

      const callback = getDownloadAllLogsCallback(
        sortedTaskRunNames,
        taskRuns,
        'test-ns',
        'test-pipeline',
      );

      await callback();

      // Should still save the file even with empty tekton logs
      expect(mockGetTaskRunLog).toHaveBeenCalledWith('test-ns', 'test-uid', 'pipelinerun-uid');
      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'test-pipeline.log');
    });

    it('should use timeout for running containers (not terminated)', async () => {
      const sortedTaskRunNames = ['test-taskrun'];
      const taskRuns = [mockTaskRun];

      mockFetchResourceWithK8sAndKubeArchive.mockResolvedValue({
        resource: {
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: { name: 'test-pod' },
          spec: {
            containers: [{ name: 'step-test' }],
          },
          status: {
            containerStatuses: [mockContainerStatus],
          },
        },
        source: ResourceSource.Cluster,
      });

      mockFeatureFlagsStore.isOn.mockReturnValue(false);
      mockContainerToLogSourceStatus.mockReturnValue(LOG_SOURCE_RUNNING); // Not terminated
      mockGetK8sResourceURL.mockReturnValue('http://test-url');

      // Simulate a slow response that would hit the timeout
      mockCommonFetchText.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('slow log content'), 2000)),
      );

      const callback = getDownloadAllLogsCallback(
        sortedTaskRunNames,
        taskRuns,
        'test-ns',
        'test-pipeline',
      );

      await callback();

      // Should still call commonFetchText for running containers, but with timeout
      expect(mockCommonFetchText).toHaveBeenCalledWith('http://test-url', undefined);
      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'test-pipeline.log');
    });
  });
});
