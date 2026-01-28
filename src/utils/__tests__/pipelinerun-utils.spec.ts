import { fetchResourceWithK8sAndKubeArchive } from '~/kubearchive/resource-utils';
import { PipelineRunModel, TaskRunModel } from '~/models';
import { PipelineRunKind, TaskRunKind } from '~/types';
import { ResourceSource } from '~/types/k8s';
import { QueryPipelineRunWithKubearchive, QueryTaskRunWithKubearchive } from '../pipelinerun-utils';

jest.mock('~/kubearchive/resource-utils', () => ({
  fetchResourceWithK8sAndKubeArchive: jest.fn(),
}));

const fetchResourceWithK8sAndKubeArchiveMock = fetchResourceWithK8sAndKubeArchive as jest.Mock;

describe('pipelinerun-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('QueryPipelineRunWithKubearchive', () => {
    it('should return pipeline run from cluster when available', async () => {
      const mockPipelineRun = {
        metadata: { name: 'test-pipeline-run' },
        source: ResourceSource.Cluster,
      } as PipelineRunKind;
      fetchResourceWithK8sAndKubeArchiveMock.mockResolvedValue(mockPipelineRun);

      const result = await QueryPipelineRunWithKubearchive('test-ns', 'test-pipeline-run');

      expect(result).toBe(mockPipelineRun);
      expect(fetchResourceWithK8sAndKubeArchiveMock).toHaveBeenCalledWith(
        { model: PipelineRunModel, queryOptions: { ns: 'test-ns', name: 'test-pipeline-run' } },
        { retry: false },
      );
    });

    it('should return pipeline run from archive when cluster returns 404', async () => {
      const mockPipelineRun = {
        metadata: { name: 'test-pipeline-run' },
        source: ResourceSource.Archive,
      } as PipelineRunKind;
      fetchResourceWithK8sAndKubeArchiveMock.mockResolvedValue(mockPipelineRun);

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
      const mockTaskRun = {
        metadata: { name: 'test-task-run' },
        source: ResourceSource.Cluster,
      } as TaskRunKind;
      fetchResourceWithK8sAndKubeArchiveMock.mockResolvedValue(mockTaskRun);

      const result = await QueryTaskRunWithKubearchive('test-ns', 'test-task-run');

      expect(result).toBe(mockTaskRun);
      expect(fetchResourceWithK8sAndKubeArchiveMock).toHaveBeenCalledWith(
        { model: TaskRunModel, queryOptions: { ns: 'test-ns', name: 'test-task-run' } },
        { retry: false },
      );
    });

    it('should return task run from archive when cluster returns 404', async () => {
      const mockTaskRun = {
        metadata: { name: 'test-task-run' },
        source: ResourceSource.Archive,
      } as TaskRunKind;
      fetchResourceWithK8sAndKubeArchiveMock.mockResolvedValue(mockTaskRun);

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
