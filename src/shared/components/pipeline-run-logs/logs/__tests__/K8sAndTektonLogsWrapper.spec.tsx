import { UseQueryResult } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContainerStatus, PodKind } from '~/shared/components/types';
import { TaskRunKind } from '~/types';
import { createK8sWatchResourceMock } from '~/unit-test-utils/mock-k8s';
import K8sAndTektonLogsWrapper from '../K8sAndTektonLogsWrapper';

// Mock MultiStreamLogs component
jest.mock('../MultiStreamLogs', () => ({
  MultiStreamLogs: jest.fn(({ taskRun, resourceName, resource }) => (
    <div data-test="multi-stream-logs">
      <div data-test="task-run">{taskRun?.metadata?.name}</div>
      <div data-test="resource-name">{resourceName}</div>
      <div data-test="pod-name">{resource?.metadata?.name}</div>
    </div>
  )),
}));

// Mock TektonTaskRunLog component
jest.mock('../TektonTaskRunLog', () => ({
  TektonTaskRunLog: jest.fn(({ taskRun, downloadAllLabel }) => (
    <div data-test="tekton-task-run-log">
      <div data-test="task-run">{taskRun?.metadata?.name}</div>
      <div data-test="download-label">{downloadAllLabel}</div>
    </div>
  )),
}));

describe('K8sAndTektonLogsWrapper', () => {
  const mockUseK8sWatchResource = createK8sWatchResourceMock();
  const mockTaskRun: TaskRunKind = {
    apiVersion: 'tekton.dev/v1beta1',
    kind: 'TaskRun',
    metadata: {
      name: 'test-taskrun',
      namespace: 'test-namespace',
      uid: 'test-uid',
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

  const mockPod: PodKind = {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: 'test-pod',
      namespace: 'test-namespace',
    },
    spec: {
      containers: [{ name: 'step-1' }],
    },
    status: {
      phase: 'Running',
      containerStatuses: [],
    },
  };

  const mockResource = {
    groupVersionKind: {
      version: 'v1',
      kind: 'Pod',
    },
    name: 'test-pod',
    namespace: 'test-namespace',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading state', () => {
    it('should render spinner when loading', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as UseQueryResult<PodKind>);

      render(
        <K8sAndTektonLogsWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render spinner with correct size', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as UseQueryResult<PodKind>);

      const { container } = render(
        <K8sAndTektonLogsWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      const spinner = container.querySelector('.pf-m-lg');
      expect(spinner).toBeInTheDocument();
    });

    it('should not render logs while loading even if data exists', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: mockPod,
        isLoading: true,
        error: null,
      } as UseQueryResult<PodKind>);

      render(
        <K8sAndTektonLogsWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByTestId('multi-stream-logs')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tekton-task-run-log')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should render TektonTaskRunLog when error occurs', () => {
      const mockError = new Error('Failed to fetch pod');
      mockUseK8sWatchResource.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      } as UseQueryResult<PodKind>);

      render(
        <K8sAndTektonLogsWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      expect(screen.getByTestId('tekton-task-run-log')).toBeInTheDocument();
      expect(screen.getByTestId('task-run')).toHaveTextContent('test-taskrun');
      expect(screen.queryByTestId('multi-stream-logs')).not.toBeInTheDocument();
    });

    it('should pass downloadAllLabel to TektonTaskRunLog on error', () => {
      const mockError = new Error('Failed to fetch pod');
      mockUseK8sWatchResource.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      } as UseQueryResult<PodKind>);

      render(
        <K8sAndTektonLogsWrapper
          taskRun={mockTaskRun}
          resource={mockResource}
          downloadAllLabel="Download everything"
        />,
      );

      expect(screen.getByTestId('download-label')).toHaveTextContent('Download everything');
    });

    it('should use default downloadAllLabel for TektonTaskRunLog on error', () => {
      const mockError = new Error('Failed to fetch pod');
      mockUseK8sWatchResource.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      } as UseQueryResult<PodKind>);

      render(
        <K8sAndTektonLogsWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      expect(screen.getByTestId('download-label')).toHaveTextContent('Download all');
    });
  });

  describe('successful data loading', () => {
    it('should render MultiStreamLogs when data is loaded successfully', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: mockPod,
        isLoading: false,
        error: null,
      } as UseQueryResult<PodKind>);

      render(
        <K8sAndTektonLogsWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      expect(screen.getByTestId('multi-stream-logs')).toBeInTheDocument();
      expect(screen.getByTestId('task-run')).toHaveTextContent('test-taskrun');
      expect(screen.getByTestId('resource-name')).toHaveTextContent('test-pod');
      expect(screen.getByTestId('pod-name')).toHaveTextContent('test-pod');
    });

    it('should not render TektonTaskRunLog when data loads successfully', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: mockPod,
        isLoading: false,
        error: null,
      } as UseQueryResult<PodKind>);

      render(
        <K8sAndTektonLogsWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      expect(screen.queryByTestId('tekton-task-run-log')).not.toBeInTheDocument();
    });
  });

  describe('props handling', () => {
    it('should pass onDownloadAll callback to MultiStreamLogs', () => {
      const mockOnDownloadAll = jest.fn().mockResolvedValue(null);

      mockUseK8sWatchResource.mockReturnValue({
        data: mockPod,
        isLoading: false,
        error: null,
      } as UseQueryResult<PodKind>);

      render(
        <K8sAndTektonLogsWrapper
          taskRun={mockTaskRun}
          resource={mockResource}
          onDownloadAll={mockOnDownloadAll}
        />,
      );

      expect(screen.getByTestId('multi-stream-logs')).toBeInTheDocument();

      // Verify MultiStreamLogs was called with onDownloadAll prop
      const { MultiStreamLogs } = jest.requireMock('../MultiStreamLogs');
      expect(MultiStreamLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          onDownloadAll: mockOnDownloadAll,
        }),
        expect.anything(),
      );
    });

    it('should use default downloadAllLabel for MultiStreamLogs', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: mockPod,
        isLoading: false,
        error: null,
      } as UseQueryResult<PodKind>);

      render(
        <K8sAndTektonLogsWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      // Verify MultiStreamLogs was called with default downloadAllLabel
      const { MultiStreamLogs } = jest.requireMock('../MultiStreamLogs');
      expect(MultiStreamLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          downloadAllLabel: 'Download all',
        }),
        expect.anything(),
      );
    });

    it('should use custom downloadAllLabel for MultiStreamLogs', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: mockPod,
        isLoading: false,
        error: null,
      } as UseQueryResult<PodKind>);

      render(
        <K8sAndTektonLogsWrapper
          taskRun={mockTaskRun}
          resource={mockResource}
          downloadAllLabel="Get all logs"
        />,
      );

      // Verify MultiStreamLogs was called with custom downloadAllLabel
      const { MultiStreamLogs } = jest.requireMock('../MultiStreamLogs');
      expect(MultiStreamLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          downloadAllLabel: 'Get all logs',
        }),
        expect.anything(),
      );
    });

    it('should pass additional props to MultiStreamLogs', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: mockPod,
        isLoading: false,
        error: null,
      } as UseQueryResult<PodKind>);

      render(
        <K8sAndTektonLogsWrapper
          taskRun={mockTaskRun}
          resource={mockResource}
          data-custom="test-prop"
        />,
      );

      // Verify MultiStreamLogs was called with additional props
      const { MultiStreamLogs } = jest.requireMock('../MultiStreamLogs');
      expect(MultiStreamLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          'data-custom': 'test-prop',
        }),
        expect.anything(),
      );
    });
  });

  describe('hook initialization', () => {
    it('should initialize useK8sWatchResource with correct parameters', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: mockPod,
        isLoading: false,
        error: null,
      } as UseQueryResult<PodKind>);

      render(
        <K8sAndTektonLogsWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      expect(mockUseK8sWatchResource).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-pod',
          namespace: 'test-namespace',
          watch: true,
        }),
        expect.objectContaining({
          kind: 'Pod',
        }),
        { retry: false },
      );
    });

    it('should enable watch mode', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: mockPod,
        isLoading: false,
        error: null,
      } as UseQueryResult<PodKind>);

      render(
        <K8sAndTektonLogsWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      expect(mockUseK8sWatchResource).toHaveBeenCalledWith(
        expect.objectContaining({
          watch: true,
        }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('should disable retry', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: mockPod,
        isLoading: false,
        error: null,
      } as UseQueryResult<PodKind>);

      render(
        <K8sAndTektonLogsWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      expect(mockUseK8sWatchResource).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { retry: false },
      );
    });
  });

  describe('edge cases', () => {
    it('should handle undefined pod data when not loading and no error', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as UseQueryResult<PodKind>);

      render(
        <K8sAndTektonLogsWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      // Should render MultiStreamLogs even with undefined data
      expect(screen.getByTestId('multi-stream-logs')).toBeInTheDocument();
    });

    it('should handle null taskRun gracefully', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: mockPod,
        isLoading: false,
        error: null,
      } as UseQueryResult<PodKind>);

      render(
        <K8sAndTektonLogsWrapper taskRun={null} resource={mockResource} />,
      );

      expect(screen.getByTestId('multi-stream-logs')).toBeInTheDocument();
    });

    it('should prioritize error over loading state', () => {
      const mockError = new Error('Failed to fetch');
      mockUseK8sWatchResource.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: mockError,
      } as UseQueryResult<PodKind>);

      render(
        <K8sAndTektonLogsWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      // Should show TektonTaskRunLog when error exists, even if loading
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.getByTestId('tekton-task-run-log')).toBeInTheDocument();
    });

    it('should handle successful load with error being cleared', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: mockPod,
        isLoading: false,
        error: null,
      } as UseQueryResult<PodKind>);

      const { rerender } = render(
        <K8sAndTektonLogsWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      expect(screen.getByTestId('multi-stream-logs')).toBeInTheDocument();

      // Simulate error occurring
      const mockError = new Error('Network error');
      mockUseK8sWatchResource.mockReturnValue({
        data: mockPod,
        isLoading: false,
        error: mockError,
      } as UseQueryResult<PodKind>);

      rerender(
        <K8sAndTektonLogsWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      expect(screen.getByTestId('tekton-task-run-log')).toBeInTheDocument();
      expect(screen.queryByTestId('multi-stream-logs')).not.toBeInTheDocument();
    });

    it('should handle pod with containerStatuses', () => {
      const podWithContainers: PodKind = {
        ...mockPod,
        status: {
          phase: 'Running',
          containerStatuses: [
            {
              name: 'step-1',
              state: { running: { startedAt: new Date().toISOString() } },
              ready: true,
              restartCount: 0,
              image: 'test-image',
              imageID: 'test-image-id',
            } as ContainerStatus,
          ],
        },
      };

      mockUseK8sWatchResource.mockReturnValue({
        data: podWithContainers,
        isLoading: false,
        error: null,
      } as UseQueryResult<PodKind>);

      render(
        <K8sAndTektonLogsWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      expect(screen.getByTestId('multi-stream-logs')).toBeInTheDocument();
      expect(screen.getByTestId('pod-name')).toHaveTextContent('test-pod');
    });
  });
});
