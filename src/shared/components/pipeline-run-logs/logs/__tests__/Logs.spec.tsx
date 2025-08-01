import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PodKind, ContainerSpec } from '../../../types';
import Logs, { processLogs } from '../Logs';

const mockLogViewer = jest.fn();
jest.mock('../LogViewer', () => {
  return function MockLogViewer(props: {
    data: string;
    autoScroll: boolean;
    onScroll?: () => void;
  }) {
    mockLogViewer(props);
    return <div data-testid="mock-log-viewer" />;
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
  const mockSetCurrentLogsGetter = jest.fn();

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
    setCurrentLogsGetter: mockSetCurrentLogsGetter,
    autoScroll: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render logs container', () => {
      render(<Logs {...defaultProps} />);

      expect(screen.getByTestId('logs-container')).toBeInTheDocument();
    });

    it('should render LogViewer with correct props', () => {
      render(<Logs {...defaultProps} autoScroll={true} />);

      expect(mockLogViewer).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(String),
          autoScroll: true,
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

    it('should show error message when fetch fails', async () => {
      // mock the commonFetchText to throw an error (simulating a failed request)
      const mockCommonFetchText = jest.requireMock('../../../../../k8s').commonFetchText;
      mockCommonFetchText.mockRejectedValueOnce(new Error('Network error'));

      // mock containerToLogSourceStatus to return 'terminated' so it uses fetch instead of WebSocket
      const mockUtils = jest.requireMock('../../utils');
      mockUtils.containerToLogSourceStatus.mockReturnValueOnce('terminated');

      render(<Logs {...defaultProps} />);

      // wait for the error message to appear
      await screen.findByTestId('error-message');

      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'An error occurred while retrieving the requested logs.',
      );
    });
  });

  describe('setCurrentLogsGetter callback', () => {
    it('should call setCurrentLogsGetter with formatted logs', async () => {
      render(<Logs {...defaultProps} />);

      await waitFor(() => {
        expect(mockSetCurrentLogsGetter).toHaveBeenCalled();
      });

      // the callback should be called with a function that returns the formatted logs
      const callback = mockSetCurrentLogsGetter.mock.calls[0][0];
      expect(typeof callback).toBe('function');
      expect(typeof callback()).toBe('string');
    });
  });

  describe('empty containers', () => {
    it('should handle empty containers array', () => {
      render(<Logs {...defaultProps} containers={[]} />);

      expect(screen.getByTestId('logs-container')).toBeInTheDocument();
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

  it('should include ANSI escape codes for styling', () => {
    const logSources = { container1: 'test logs' };
    const containers: ContainerSpec[] = [{ name: 'container1' }];

    const result = processLogs(logSources, containers);

    // should include ANSI codes for bold, background color, text color, and reset
    expect(result).toContain('\x1b[1m'); // BOLD
    expect(result).toContain('\x1b[47m'); // WHITE_BACKGROUND_COLOR
    expect(result).toContain('\x1b[30m'); // BLACK_TEXT_COLOR
    expect(result).toContain('\x1b[0m'); // RESET
  });
});
