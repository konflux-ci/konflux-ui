import { PipelineRunLabel } from '~/consts/pipelinerun';
import { fetchResourceWithK8sAndKubeArchive } from '~/kubearchive/resource-utils';
import { PipelineRunModel, TaskRunModel } from '~/models';
import { PipelineRunKind, TaskRunKind } from '~/types';
import { ResourceSource } from '~/types/k8s';
import {
  getSourceUrl,
  QueryPipelineRunWithKubearchive,
  QueryTaskRunWithKubearchive,
  stripQueryStringParams,
} from '../pipelinerun-utils';

jest.mock('~/kubearchive/resource-utils', () => ({
  fetchResourceWithK8sAndKubeArchive: jest.fn(),
}));

const fetchResourceWithK8sAndKubeArchiveMock = fetchResourceWithK8sAndKubeArchive as jest.Mock;

describe('pipelinerun-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('stripQueryStringParams', () => {
    it('should strip query params from a valid URL', () => {
      expect(stripQueryStringParams('https://github.com/org/repo?token=abc')).toBe(
        'https://github.com/org/repo',
      );
    });

    it('should return the URL unchanged when there are no query params', () => {
      expect(stripQueryStringParams('https://github.com/org/repo')).toBe(
        'https://github.com/org/repo',
      );
    });

    it('should return undefined for an empty string', () => {
      expect(stripQueryStringParams('')).toBeUndefined();
    });

    it('should return undefined for an invalid URL', () => {
      expect(stripQueryStringParams('not-a-url')).toBeUndefined();
    });
  });

  describe('getSourceUrl', () => {
    it('should return undefined when pipelineRun is undefined', () => {
      expect(getSourceUrl(undefined)).toBeUndefined();
    });

    it('should prefer PAC annotation over build service annotation', () => {
      const plr = {
        metadata: {
          annotations: {
            [PipelineRunLabel.COMMIT_FULL_REPO_URL_ANNOTATION]: 'https://github.com/pac/repo?a=1',
            [PipelineRunLabel.BUILD_SERVICE_REPO_ANNOTATION]: 'https://github.com/build/repo?b=2',
          },
        },
      } as unknown as PipelineRunKind;
      expect(getSourceUrl(plr)).toBe('https://github.com/pac/repo');
    });

    it('should fall back to build service annotation', () => {
      const plr = {
        metadata: {
          annotations: {
            [PipelineRunLabel.BUILD_SERVICE_REPO_ANNOTATION]: 'https://github.com/build/repo?b=2',
          },
        },
      } as unknown as PipelineRunKind;
      expect(getSourceUrl(plr)).toBe('https://github.com/build/repo');
    });

    it('should return undefined when annotation is an invalid URL', () => {
      const plr = {
        metadata: {
          annotations: {
            [PipelineRunLabel.COMMIT_FULL_REPO_URL_ANNOTATION]: 'not-a-url',
          },
        },
      } as unknown as PipelineRunKind;
      expect(getSourceUrl(plr)).toBeUndefined();
    });
  });

  describe('QueryPipelineRunWithKubearchive', () => {
    it('should return pipeline run from cluster when available', async () => {
      const mockPipelineRun = { metadata: { name: 'test-pipeline-run' } } as PipelineRunKind;
      fetchResourceWithK8sAndKubeArchiveMock.mockResolvedValue({
        resource: mockPipelineRun,
        source: ResourceSource.Cluster,
      });

      const result = await QueryPipelineRunWithKubearchive('test-ns', 'test-pipeline-run');

      expect(result).toBe(mockPipelineRun);
      expect(fetchResourceWithK8sAndKubeArchiveMock).toHaveBeenCalledWith(
        { model: PipelineRunModel, queryOptions: { ns: 'test-ns', name: 'test-pipeline-run' } },
        { retry: false },
      );
    });

    it('should return pipeline run from archive when cluster returns 404', async () => {
      const mockPipelineRun = { metadata: { name: 'test-pipeline-run' } } as PipelineRunKind;
      fetchResourceWithK8sAndKubeArchiveMock.mockResolvedValue({
        resource: mockPipelineRun,
        source: ResourceSource.Archive,
      });

      const result = await QueryPipelineRunWithKubearchive('test-ns', 'test-pipeline-run');

      expect(result).toBe(mockPipelineRun);
      expect(fetchResourceWithK8sAndKubeArchiveMock).toHaveBeenCalledWith(
        { model: PipelineRunModel, queryOptions: { ns: 'test-ns', name: 'test-pipeline-run' } },
        { retry: false },
      );
    });

    it('should throw error when both cluster and archive fail', async () => {
      const notFoundError = { code: 404, message: 'Not found' };
      fetchResourceWithK8sAndKubeArchiveMock.mockRejectedValue(notFoundError);

      await expect(QueryPipelineRunWithKubearchive('test-ns', 'test-pipeline-run')).rejects.toBe(
        notFoundError,
      );

      expect(fetchResourceWithK8sAndKubeArchiveMock).toHaveBeenCalledWith(
        { model: PipelineRunModel, queryOptions: { ns: 'test-ns', name: 'test-pipeline-run' } },
        { retry: false },
      );
    });

    it('should throw error when utility function fails with non-404 error', async () => {
      const serverError = { code: 500, message: 'Server error' };
      fetchResourceWithK8sAndKubeArchiveMock.mockRejectedValue(serverError);

      await expect(QueryPipelineRunWithKubearchive('test-ns', 'test-pipeline-run')).rejects.toBe(
        serverError,
      );

      expect(fetchResourceWithK8sAndKubeArchiveMock).toHaveBeenCalledWith(
        { model: PipelineRunModel, queryOptions: { ns: 'test-ns', name: 'test-pipeline-run' } },
        { retry: false },
      );
    });
  });

  describe('QueryTaskRunWithKubearchive', () => {
    it('should return task run from cluster when available', async () => {
      const mockTaskRun = { metadata: { name: 'test-task-run' } } as TaskRunKind;
      fetchResourceWithK8sAndKubeArchiveMock.mockResolvedValue({
        resource: mockTaskRun,
        source: ResourceSource.Cluster,
      });

      const result = await QueryTaskRunWithKubearchive('test-ns', 'test-task-run');

      expect(result).toBe(mockTaskRun);
      expect(fetchResourceWithK8sAndKubeArchiveMock).toHaveBeenCalledWith(
        { model: TaskRunModel, queryOptions: { ns: 'test-ns', name: 'test-task-run' } },
        { retry: false },
      );
    });

    it('should return task run from archive when cluster returns 404', async () => {
      const mockTaskRun = { metadata: { name: 'test-task-run' } } as TaskRunKind;
      fetchResourceWithK8sAndKubeArchiveMock.mockResolvedValue({
        resource: mockTaskRun,
        source: ResourceSource.Archive,
      });

      const result = await QueryTaskRunWithKubearchive('test-ns', 'test-task-run');

      expect(result).toBe(mockTaskRun);
      expect(fetchResourceWithK8sAndKubeArchiveMock).toHaveBeenCalledWith(
        { model: TaskRunModel, queryOptions: { ns: 'test-ns', name: 'test-task-run' } },
        { retry: false },
      );
    });

    it('should throw error when both cluster and archive fail', async () => {
      const notFoundError = { code: 404, message: 'Not found' };
      fetchResourceWithK8sAndKubeArchiveMock.mockRejectedValue(notFoundError);

      await expect(QueryTaskRunWithKubearchive('test-ns', 'test-task-run')).rejects.toBe(
        notFoundError,
      );

      expect(fetchResourceWithK8sAndKubeArchiveMock).toHaveBeenCalledWith(
        { model: TaskRunModel, queryOptions: { ns: 'test-ns', name: 'test-task-run' } },
        { retry: false },
      );
    });

    it('should throw error when utility function fails with non-404 error', async () => {
      const serverError = { code: 500, message: 'Server error' };
      fetchResourceWithK8sAndKubeArchiveMock.mockRejectedValue(serverError);

      await expect(QueryTaskRunWithKubearchive('test-ns', 'test-task-run')).rejects.toBe(
        serverError,
      );

      expect(fetchResourceWithK8sAndKubeArchiveMock).toHaveBeenCalledWith(
        { model: TaskRunModel, queryOptions: { ns: 'test-ns', name: 'test-task-run' } },
        { retry: false },
      );
    });
  });
});
