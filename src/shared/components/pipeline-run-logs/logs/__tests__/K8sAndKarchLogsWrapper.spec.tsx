import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  useK8sAndKarchResource,
  useK8sAndKarchResourceResult,
} from '~/hooks/useK8sAndKarchResources';
import { PodKind } from '~/shared/components/types';
import { TaskRunKind } from '~/types';
import { ResourceSource } from '~/types/k8s';
import K8sAndKarchLogWrapper from '../K8sAndKarchLogsWrapper';

// Mock dependencies
jest.mock('~/hooks/useK8sAndKarchResources');
jest.mock('~/shared/utils/error-utils', () => ({
  getErrorState: jest.fn((error) => <div data-test="error-state">{error.message}</div>),
}));

// Mock MultiStreamLogs component
// MultilStreamLogs.tsx would be tested by MultilStreamLogs.spec.tsx
jest.mock('../MultiStreamLogs', () => ({
  MultiStreamLogs: jest.fn(({ taskRun, resourceName, resource, source }) => (
    <div data-test="multi-stream-logs">
      <div data-test="task-run">{taskRun?.metadata?.name}</div>
      <div data-test="resource-name">{resourceName}</div>
      <div data-test="pod-name">{resource?.metadata?.name}</div>
      <div data-test="source">{source}</div>
    </div>
  )),
}));

const mockUseK8sAndKarchResource = useK8sAndKarchResource as jest.MockedFunction<
  typeof useK8sAndKarchResource
>;

describe('K8sAndKarchLogWrapper', () => {
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

  // Helper function to create mock hook return values
  const createMockHookResult = (
    overrides: Partial<useK8sAndKarchResourceResult<PodKind>> = {},
  ): useK8sAndKarchResourceResult<PodKind> =>
    ({
      data: undefined,
      source: ResourceSource.Cluster,
      isLoading: false,
      fetchError: null,
      wsError: null,
      isError: false,
      ...overrides,
    }) as useK8sAndKarchResourceResult<PodKind>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading state', () => {
    it('should render spinner when loading', () => {
      mockUseK8sAndKarchResource.mockReturnValue(createMockHookResult({ isLoading: true }));

      render(
        <K8sAndKarchLogWrapper taskRun={mockTaskRun} resource={mockResource} />,
      )

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render spinner with correct size', () => {
      mockUseK8sAndKarchResource.mockReturnValue(createMockHookResult({ isLoading: true }));

      const { container } = render(
        <K8sAndKarchLogWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      const spinner = container.querySelector('.pf-m-xl');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should render error state when fetch error occurs', () => {
      const mockError = new Error('Failed to fetch pod');
      mockUseK8sAndKarchResource.mockReturnValue(
        createMockHookResult({ fetchError: mockError, isError: true }),
      );

      render(
        <K8sAndKarchLogWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch pod')).toBeInTheDocument();
    });

    it('should not render error state when still loading', () => {
      const mockError = new Error('Failed to fetch pod');
      mockUseK8sAndKarchResource.mockReturnValue(
        createMockHookResult({ isLoading: true, fetchError: mockError, isError: true }),
      );

      render(
        <K8sAndKarchLogWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      // Should still show spinner, not error
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });
  });

  describe('successful data loading', () => {
    it('should render MultiStreamLogs when data is loaded successfully', () => {
      mockUseK8sAndKarchResource.mockReturnValue(createMockHookResult({ data: mockPod }));

      render(
        <K8sAndKarchLogWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      expect(screen.getByTestId('multi-stream-logs')).toBeInTheDocument();
      expect(screen.getByTestId('task-run')).toHaveTextContent('test-taskrun');
      expect(screen.getByTestId('resource-name')).toHaveTextContent('test-pod');
      expect(screen.getByTestId('pod-name')).toHaveTextContent('test-pod');
    });

    it('should pass correct source to MultiStreamLogs from cluster', () => {
      mockUseK8sAndKarchResource.mockReturnValue(createMockHookResult({ data: mockPod }));

      render(
        <K8sAndKarchLogWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      expect(screen.getByTestId('source')).toHaveTextContent(ResourceSource.Cluster);
    });

    it('should pass correct source to MultiStreamLogs from archive', () => {
      mockUseK8sAndKarchResource.mockReturnValue(
        createMockHookResult({ data: mockPod, source: ResourceSource.Archive }),
      );

      render(
        <K8sAndKarchLogWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      expect(screen.getByTestId('source')).toHaveTextContent(ResourceSource.Archive);
    });
  });

  describe('props handling', () => {
    it('should pass onDownloadAll callback to MultiStreamLogs', () => {
      const mockOnDownloadAll = jest.fn().mockResolvedValue(null);
      mockUseK8sAndKarchResource.mockReturnValue(createMockHookResult({ data: mockPod }));

      render(
        <K8sAndKarchLogWrapper
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

    it('should use default downloadAllLabel when not provided', () => {
      mockUseK8sAndKarchResource.mockReturnValue(createMockHookResult({ data: mockPod }));

      render(
        <K8sAndKarchLogWrapper taskRun={mockTaskRun} resource={mockResource} />,
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

    it('should use custom downloadAllLabel when provided', () => {
      mockUseK8sAndKarchResource.mockReturnValue(createMockHookResult({ data: mockPod }));

      render(
        <K8sAndKarchLogWrapper
          taskRun={mockTaskRun}
          resource={mockResource}
          downloadAllLabel="Download everything"
        />,
      );

      // Verify MultiStreamLogs was called with custom downloadAllLabel
      const { MultiStreamLogs } = jest.requireMock('../MultiStreamLogs');
      expect(MultiStreamLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          downloadAllLabel: 'Download everything',
        }),
        expect.anything(),
      );
    });
  });

  describe('hook initialization', () => {
    it('should initialize useK8sAndKarchResource with correct parameters', () => {
      mockUseK8sAndKarchResource.mockReturnValue(createMockHookResult({ data: mockPod }));

      render(
        <K8sAndKarchLogWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      expect(mockUseK8sAndKarchResource).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.objectContaining({
            kind: 'Pod',
          }),
          queryOptions: {
            name: 'test-pod',
            ns: 'test-namespace',
          },
        }),
        { retry: false },
        true,
      );
    });

    it('should update hook initialization when resource changes', () => {
      mockUseK8sAndKarchResource.mockReturnValue(createMockHookResult({ data: mockPod }));

      const { rerender } = render(
        <K8sAndKarchLogWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      const newResource = {
        groupVersionKind: {
          version: 'v1',
          kind: 'Pod',
        },
        name: 'new-pod',
        namespace: 'new-namespace',
      };

      rerender(
        <K8sAndKarchLogWrapper taskRun={mockTaskRun} resource={newResource} />,
      );

      expect(mockUseK8sAndKarchResource).toHaveBeenCalledWith(
        expect.objectContaining({
          queryOptions: {
            name: 'new-pod',
            ns: 'new-namespace',
          },
        }),
        { retry: false },
        true,
      );
    })
  })


  describe('edge cases', () => {
    it('should handle undefined pod data gracefully', () => {
      mockUseK8sAndKarchResource.mockReturnValue(createMockHookResult());

      render(
        <K8sAndKarchLogWrapper taskRun={mockTaskRun} resource={mockResource} />,
      );

      // Should render MultiStreamLogs even with undefined data
      expect(screen.getByTestId('multi-stream-logs')).toBeInTheDocument();
    });

    it('should handle null taskRun gracefully', () => {
      mockUseK8sAndKarchResource.mockReturnValue(createMockHookResult({ data: mockPod }));

      render(
        <K8sAndKarchLogWrapper taskRun={null} resource={mockResource} />,
      );

      expect(screen.getByTestId('multi-stream-logs')).toBeInTheDocument();
    });
  })
});
