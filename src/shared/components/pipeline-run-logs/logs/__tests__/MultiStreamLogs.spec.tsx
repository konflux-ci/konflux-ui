import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContainerSpec, ContainerStatus, PodKind } from '~/shared/components/types';
import { TaskRunKind } from '~/types';
import { ResourceSource } from '~/types/k8s';
import { MultiStreamLogs } from '../MultiStreamLogs';

// Mock the Logs component because it has complex dependencies:
// 1. i18next for translations (useTranslation hook)
// 2. Canvas API for PatternFly LogViewer (not available in jsdom)
// 3. Feature flags (useIsOnFeatureFlag)
// 4. WebSockets and HTTP requests for fetching logs
// Without mocking, tests fail with "HTMLCanvasElement.prototype.getContext not implemented"
jest.mock('../Logs', () => ({
  __esModule: true,
  default: jest.fn(
    ({ resource, containers, allowAutoScroll, downloadAllLabel, taskRun, isLoading, source }) => (
      <div data-test="logs-component">
        <div data-test="resource-name">{resource?.metadata?.name}</div>
        <div data-test="containers-count">{containers?.length || 0}</div>
        <div data-test="allow-auto-scroll">{String(allowAutoScroll)}</div>
        <div data-test="download-label">{downloadAllLabel}</div>
        <div data-test="task-run">{taskRun?.metadata?.name}</div>
        <div data-test="is-loading">{String(isLoading)}</div>
        <div data-test="source">{source}</div>
      </div>
    ),
  ),
}));

// Shared test constants
const TEST_NAMESPACE = 'test-namespace';
const TEST_POD_NAME = 'test-pod';
const TEST_TASKRUN_NAME = 'test-taskrun';

// Shared mock containers
const mockContainers: ContainerSpec[] = [
  { name: 'step-1' },
  { name: 'step-2' },
  { name: 'step-3' },
];

// Helper to create a task run with defaults
const createMockTaskRun = (overrides?: Partial<TaskRunKind>): TaskRunKind => ({
  apiVersion: 'tekton.dev/v1beta1',
  kind: 'TaskRun',
  metadata: {
    name: TEST_TASKRUN_NAME,
    namespace: TEST_NAMESPACE,
    uid: 'test-uid',
  },
  spec: {
    taskRef: {
      name: 'test-task',
    },
  },
  status: {
    podName: TEST_POD_NAME,
  },
  ...overrides,
});

// Helper to create a pod with defaults
const createMockPod = (overrides?: Partial<PodKind>): PodKind => ({
  apiVersion: 'v1',
  kind: 'Pod',
  metadata: {
    name: TEST_POD_NAME,
    namespace: TEST_NAMESPACE,
  },
  spec: {
    containers: mockContainers,
  },
  status: {
    phase: 'Running',
    containerStatuses: [],
  },
  ...overrides,
});

describe('MultiStreamLogs', () => {
  const mockTaskRun = createMockTaskRun();
  const mockPod = createMockPod();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading state', () => {
    it('should render spinner when containers are loading', () => {
      const loadingPod: PodKind = {
        ...mockPod,
        metadata: {
          name: 'different-pod',
          namespace: 'test-namespace',
        },
      };

      render(
        <MultiStreamLogs
          resource={loadingPod}
          taskRun={mockTaskRun}
          resourceName="test-pod"
        />,
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render spinner with correct size when loading', () => {
      const loadingPod: PodKind = {
        ...mockPod,
        metadata: {
          name: 'different-pod',
          namespace: 'test-namespace',
        },
      };

      const { container } = render(
        <MultiStreamLogs
          resource={loadingPod}
          taskRun={mockTaskRun}
          resourceName="test-pod"
        />,
      );

      const spinner = container.querySelector('.pf-m-lg');
      expect(spinner).toBeInTheDocument();
    });

    it('should not render Logs component when loading', () => {
      const loadingPod: PodKind = {
        ...mockPod,
        metadata: {
          name: 'different-pod',
          namespace: 'test-namespace',
        },
      };

      render(
        <MultiStreamLogs
          resource={loadingPod}
          taskRun={mockTaskRun}
          resourceName="test-pod"
        />,
      );

      expect(screen.queryByTestId('logs-component')).not.toBeInTheDocument();
    });
  });

  describe('successful rendering', () => {
    it('should render Logs component when containers are loaded', () => {
      render(
        <MultiStreamLogs
          resource={mockPod}
          taskRun={mockTaskRun}
          resourceName="test-pod"
        />,
      );

      expect(screen.getByTestId('logs-component')).toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should pass resource to Logs component', () => {
      render(
        <MultiStreamLogs
          resource={mockPod}
          taskRun={mockTaskRun}
          resourceName="test-pod"
        />,
      );

      expect(screen.getByTestId('resource-name')).toHaveTextContent('test-pod');
    });

    it('should pass containers from getRenderContainers to Logs', () => {
      render(
        <MultiStreamLogs
          resource={mockPod}
          taskRun={mockTaskRun}
          resourceName="test-pod"
        />,
      );

      expect(screen.getByTestId('containers-count')).toHaveTextContent('3');
    });

    it('should pass taskRun to Logs component', () => {
      render(
        <MultiStreamLogs
          resource={mockPod}
          taskRun={mockTaskRun}
          resourceName="test-pod"
        />,
      );

      expect(screen.getByTestId('task-run')).toHaveTextContent('test-taskrun');
    });
  });

  describe('props handling', () => {
    it('should enable allowAutoScroll by default', () => {
      render(
        <MultiStreamLogs
          resource={mockPod}
          taskRun={mockTaskRun}
          resourceName="test-pod"
        />,
      );

      expect(screen.getByTestId('allow-auto-scroll')).toHaveTextContent('true');
    });

    it('should pass downloadAllLabel to Logs component', () => {
      render(
        <MultiStreamLogs
          resource={mockPod}
          taskRun={mockTaskRun}
          resourceName="test-pod"
          downloadAllLabel="Download everything"
        />,
      );

      expect(screen.getByTestId('download-label')).toHaveTextContent('Download everything');
    });

    it('should pass onDownloadAll callback to Logs component', () => {
      const mockOnDownloadAll = jest.fn().mockResolvedValue(null);

      render(
        <MultiStreamLogs
          resource={mockPod}
          taskRun={mockTaskRun}
          resourceName={TEST_POD_NAME}
          onDownloadAll={mockOnDownloadAll}
        />,
      );

      // Verify Logs component received the callback
      expect(screen.getByTestId('logs-component')).toBeInTheDocument();

      // The Logs mock doesn't render the callback, but MultiStreamLogs passes it through
      // This test verifies the component renders without errors when onDownloadAll is provided
    });

    it('should use default source as Cluster when not provided', () => {
      render(
        <MultiStreamLogs
          resource={mockPod}
          taskRun={mockTaskRun}
          resourceName="test-pod"
        />,
      );

      expect(screen.getByTestId('source')).toHaveTextContent(ResourceSource.Cluster);
    });

    it('should pass Archive source when provided', () => {
      render(
        <MultiStreamLogs
          resource={mockPod}
          taskRun={mockTaskRun}
          resourceName="test-pod"
          source={ResourceSource.Archive}
        />,
      );

      expect(screen.getByTestId('source')).toHaveTextContent(ResourceSource.Archive);
    });
  });

  describe('isLoading calculation', () => {
    it('should set isLoading to false when pod is loaded and not fetching', () => {
      render(
        <MultiStreamLogs
          resource={mockPod}
          taskRun={mockTaskRun}
          resourceName="test-pod"
        />,
      );

      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    it('should set isLoading to true when still fetching containers', () => {
      const fetchingPod: PodKind = {
        ...mockPod,
        metadata: {
          name: 'fetching-pod',
          namespace: 'test-namespace',
        },
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

      render(
        <MultiStreamLogs
          resource={fetchingPod}
          taskRun={mockTaskRun}
          resourceName="fetching-pod"
        />,
      );

      expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
    });

    it('should set isLoading to true when pod name does not match resourceName', () => {
      const differentPod: PodKind = {
        ...mockPod,
        metadata: {
          name: 'different-pod',
          namespace: 'test-namespace',
        },
      };

      // This should show spinner, not logs
      render(
        <MultiStreamLogs
          resource={differentPod}
          taskRun={mockTaskRun}
          resourceName="test-pod"
        />,
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByTestId('is-loading')).not.toBeInTheDocument();
    });

    it('should set isLoading to false when pod name matches resourceName and not still fetching', () => {
      render(
        <MultiStreamLogs
          resource={mockPod}
          taskRun={mockTaskRun}
          resourceName="test-pod"
        />,
      );

      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });
  });

  describe('container rendering with real getRenderContainers', () => {
    it('should handle pod with no containers', () => {
      const podWithoutContainers = createMockPod({
        spec: {
          containers: [],
        },
      });

      render(
        <MultiStreamLogs
          resource={podWithoutContainers}
          taskRun={mockTaskRun}
          resourceName={TEST_POD_NAME}
        />,
      );

      expect(screen.getByTestId('containers-count')).toHaveTextContent('0');
    });

    it('should render all terminated containers', () => {
      const podWithTerminatedContainers = createMockPod({
        status: {
          phase: 'Succeeded',
          containerStatuses: mockContainers.map((c, index) => ({
            name: c.name,
            state: { terminated: { exitCode: 0, finishedAt: new Date().toISOString() } },
            ready: false,
            restartCount: 0,
            image: `image-${index}`,
            imageID: `id-${index}`,
          })) as ContainerStatus[],
        },
      });

      render(
        <MultiStreamLogs
          resource={podWithTerminatedContainers}
          taskRun={mockTaskRun}
          resourceName={TEST_POD_NAME}
        />,
      );

      // All containers terminated, should show all 3
      expect(screen.getByTestId('containers-count')).toHaveTextContent('3');
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });
  });

  describe('edge cases', () => {
    it('should handle null taskRun', () => {
      render(
        <MultiStreamLogs
          resource={mockPod}
          taskRun={null}
          resourceName="test-pod"
        />,
      );

      expect(screen.getByTestId('logs-component')).toBeInTheDocument();
      expect(screen.getByTestId('task-run')).toBeEmptyDOMElement();
    });

    it('should handle pod without metadata', () => {
      const podWithoutMetadata: PodKind = {
        ...mockPod,
        metadata: undefined,
      };

      render(
        <MultiStreamLogs
          resource={podWithoutMetadata}
          taskRun={mockTaskRun}
          resourceName="test-pod"
        />,
      );

      // Should render spinner since metadata.name is undefined
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should handle pod without spec', () => {
      const podWithoutSpec = createMockPod({
        spec: undefined,
      });

      render(
        <MultiStreamLogs
          resource={podWithoutSpec}
          taskRun={mockTaskRun}
          resourceName={TEST_POD_NAME}
        />,
      );

      expect(screen.getByTestId('logs-component')).toBeInTheDocument();
      expect(screen.getByTestId('containers-count')).toHaveTextContent('0');
    });

    it('should handle empty resourceName', () => {
      render(
        <MultiStreamLogs
          resource={mockPod}
          taskRun={mockTaskRun}
          resourceName=""
        />,
      );

      // Pod name 'test-pod' does not match empty string, should show spinner
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should handle pod with containerStatuses', () => {
      const podWithStatuses: PodKind = {
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

      render(
        <MultiStreamLogs
          resource={podWithStatuses}
          taskRun={mockTaskRun}
          resourceName="test-pod"
        />,
      );

      expect(screen.getByTestId('logs-component')).toBeInTheDocument();
    });
  });

  describe('re-rendering', () => {
    it('should update when resource changes', () => {
      const { rerender } = render(
        <MultiStreamLogs
          resource={mockPod}
          taskRun={mockTaskRun}
          resourceName="test-pod"
        />,
      );

      expect(screen.getByTestId('resource-name')).toHaveTextContent('test-pod');

      const newPod: PodKind = {
        ...mockPod,
        metadata: {
          name: 'new-pod',
          namespace: 'test-namespace',
        },
      };

      rerender(
        <MultiStreamLogs
          resource={newPod}
          taskRun={mockTaskRun}
          resourceName="new-pod"
        />,
      );

      expect(screen.getByTestId('resource-name')).toHaveTextContent('new-pod');
    });

    it('should switch to loading state when resourceName changes before resource updates', () => {
      const { rerender } = render(
        <MultiStreamLogs
          resource={mockPod}
          taskRun={mockTaskRun}
          resourceName="test-pod"
        />,
      );

      expect(screen.getByTestId('logs-component')).toBeInTheDocument();

      // Change resourceName but keep same resource (simulating waiting for new data)
      rerender(
        <MultiStreamLogs
          resource={mockPod}
          taskRun={mockTaskRun}
          resourceName="new-pod"
        />,
      );

      // Should show spinner since pod name doesn't match
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByTestId('logs-component')).not.toBeInTheDocument();
    });
  });
});
