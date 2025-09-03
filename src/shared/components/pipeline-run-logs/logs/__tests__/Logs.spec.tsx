import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PodKind, ContainerSpec } from '../../../types';
import Logs, { processLogs } from '../Logs';

const mockLogViewer = jest.fn();
jest.mock('../LogViewer', () => {
  return function MockLogViewer(props: {
    data: string;
    allowAutoScroll: boolean;
    onScroll?: () => void;
  }) {
    mockLogViewer(props);
    return <div data-test="mock-log-viewer" />;
  };
});

jest.mock('../../../../../k8s', () => ({
  commonFetchText: jest.fn(),
}));

jest.mock('../../../../../k8s/k8s-utils', () => ({
  getK8sResourceURL: jest.fn(),
  getWebsocketSubProtocolAndPathPrefix: jest.fn(),
}));

jest.mock('../../../../../k8s/web-socket/WebSocketFactory', () => ({
  WebSocketFactory: jest.fn().mockImplementation(() => ({
    onMessage: jest.fn().mockReturnThis(),
    onError: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
  })),
}));

jest.mock('~/shared/providers/Namespace');

jest.mock('../../utils', () => ({
  containerToLogSourceStatus: jest.fn(() => 'running'),
  LOG_SOURCE_TERMINATED: 'terminated',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('Logs', () => {
  const mockOnLogsChange = jest.fn();

  const mockResource: PodKind = {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: 'test-pod',
      namespace: 'test-namespace',
    },
    spec: {
      containers: [],
    },
    status: {
      phase: 'Running',
      containerStatuses: [],
    },
  };

  const mockContainers: ContainerSpec[] = [{ name: 'container1' }, { name: 'container2' }];

  const defaultProps = {
    resource: mockResource,
    containers: mockContainers,
    allowAutoScroll: false,
    taskName: 'task-test',
    taskRun: null,
    isLoading: false,
    onLogsChange: mockOnLogsChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render logs container', () => {
      render(<Logs {...defaultProps} />);

      expect(screen.getByTestId('mock-log-viewer')).toBeInTheDocument();
    });

    it('should render LogViewer with correct props', () => {
      render(<Logs {...defaultProps} allowAutoScroll={true} />);

      expect(mockLogViewer).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(String),
          allowAutoScroll: true,
          onScroll: undefined,
        }),
      );
    });

    it('should pass onScroll prop to LogViewer', () => {
      const mockOnScroll = jest.fn();
      render(<Logs {...defaultProps} onScroll={mockOnScroll} />);

      expect(mockLogViewer).toHaveBeenCalledWith(
        expect.objectContaining({
          onScroll: mockOnScroll,
        }),
      );
    });
  });

  describe('error handling', () => {
    it('should not show error message initially', () => {
      render(<Logs {...defaultProps} />);

      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    describe('empty containers', () => {
      it('should handle empty containers array', () => {
        render(<Logs {...defaultProps} containers={[]} />);

        expect(screen.getByTestId('mock-log-viewer')).toBeInTheDocument();
        expect(mockLogViewer).toHaveBeenCalledWith(
          expect.objectContaining({
            data: '',
          }),
        );
      });
    });
  });

  describe('processLogs function', () => {
    it('should format logs with container headers and indentation', () => {
      const logSources = {
        container1: 'log line 1\nlog line 2',
        container2: 'log line 3\nlog line 4',
      };
      const containers: ContainerSpec[] = [{ name: 'container1' }, { name: 'container2' }];

      const result = processLogs(logSources, containers);

      // should contain container headers and indented logs
      expect(result).toContain('CONTAINER1'); // Header should be uppercase
      expect(result).toContain('CONTAINER2');
      expect(result).toContain('  log line 1'); // Logs should be indented
      expect(result).toContain('  log line 2');
      expect(result).toContain('  log line 3');
      expect(result).toContain('  log line 4');
    });

    it('should handle containers with no logs', () => {
      const logSources = {};
      const containers: ContainerSpec[] = [{ name: 'container1' }];

      const result = processLogs(logSources, containers);

      expect(result).toBe('');
    });

    it('should handle empty containers array', () => {
      const logSources = { container1: 'some logs' };
      const containers: ContainerSpec[] = [];

      const result = processLogs(logSources, containers);

      expect(result).toBe('');
    });

    it('should process containers in specific order', () => {
      const logSources = {
        container1: 'first container logs',
        container2: 'second container logs',
      };
      const containers: ContainerSpec[] = [{ name: 'container2' }, { name: 'container1' }];

      const result = processLogs(logSources, containers);

      const container2Index = result.indexOf('CONTAINER2');
      const container1Index = result.indexOf('CONTAINER1');

      // container2 should appear first since it's first in the containers array
      expect(container2Index).toBeLessThan(container1Index);
      expect(container2Index).toBeGreaterThanOrEqual(0);
      expect(container1Index).toBeGreaterThanOrEqual(0);
    });

    it('should skip containers without log sources', () => {
      const logSources = {
        container1: 'has logs',
        // container2 has no logs
      };
      const containers: ContainerSpec[] = [{ name: 'container1' }, { name: 'container2' }];

      const result = processLogs(logSources, containers);

      expect(result).toContain('CONTAINER1');
      expect(result).not.toContain('CONTAINER2');
      expect(result).toContain('  has logs');
    });

    it('should handle multi-line logs with proper indentation', () => {
      const logSources = {
        'test-container': 'line 1\nline 2\nline 3',
      };
      const containers: ContainerSpec[] = [{ name: 'test-container' }];

      const result = processLogs(logSources, containers);

      expect(result).toContain('TEST-CONTAINER');
      expect(result).toContain('  line 1');
      expect(result).toContain('  line 2');
      expect(result).toContain('  line 3');
    });
  });
});
