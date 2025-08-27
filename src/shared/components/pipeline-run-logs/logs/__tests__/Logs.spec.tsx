import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { ResourceSource } from '~/types/k8s';
import { commonFetchText } from '../../../../../k8s';
import {
  getK8sResourceURL,
  getWebsocketSubProtocolAndPathPrefix,
} from '../../../../../k8s/k8s-utils';
import { TaskRunKind } from '../../../../../types';
import { ContainerStatus, PodKind, ContainerSpec } from '../../../types';
import { containerToLogSourceStatus } from '../../utils';
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

// Mock external dependencies
jest.mock('../../../../../k8s', () => ({
  commonFetchText: jest.fn(),
}));

jest.mock('../../../../../k8s/k8s-utils', () => ({
  getK8sResourceURL: jest.fn(),
  getWebsocketSubProtocolAndPathPrefix: jest.fn(),
}));

const mockWebSocketInstance = {
  onMessage: jest.fn().mockReturnThis(),
  onError: jest.fn().mockReturnThis(),
  destroy: jest.fn(),
};

jest.mock('../../../../../k8s/web-socket/WebSocketFactory', () => ({
  WebSocketFactory: jest.fn().mockImplementation(() => mockWebSocketInstance),
}));

jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
}));

jest.mock('~/shared/providers/Namespace');

jest.mock('../../utils', () => ({
  containerToLogSourceStatus: jest.fn(),
  LOG_SOURCE_TERMINATED: 'terminated',
  LOG_SOURCE_RUNNING: 'running',
  LOG_SOURCE_WAITING: 'waiting',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock Base64 decoding
jest.mock('js-base64', () => ({
  Base64: {
    decode: jest.fn((str: string) => `decoded-${str}`),
  },
}));

describe('Logs', () => {
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

  const mockTaskRun: TaskRunKind = {
    apiVersion: 'tekton.dev/v1beta1',
    kind: 'TaskRun',
    metadata: {
      name: 'test-taskrun',
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

  const defaultProps = {
    resource: mockResource,
    containers: mockContainers,
    allowAutoScroll: false,
    taskRun: mockTaskRun,
    isLoading: false,
    source: ResourceSource.Cluster,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useIsOnFeatureFlag as jest.Mock).mockReturnValue(false);
    (getK8sResourceURL as jest.Mock).mockReturnValue('http://test-url');
    (getWebsocketSubProtocolAndPathPrefix as jest.Mock).mockReturnValue({});
    (containerToLogSourceStatus as jest.Mock).mockReturnValue('running');
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

  describe('container log fetching', () => {
    it('should use HTTP request for terminated containers', () => {
      const terminatedContainer: ContainerStatus = {
        name: 'container1',
        state: { terminated: { exitCode: 0 } },
        ready: false,
        restartCount: 0,
        image: 'test-image',
        imageID: 'test-image-id',
      };

      const resourceWithStatus: PodKind = {
        ...mockResource,
        status: {
          phase: 'Succeeded',
          containerStatuses: [terminatedContainer],
        },
      };

      (containerToLogSourceStatus as jest.Mock).mockReturnValue('terminated');
      (commonFetchText as jest.Mock).mockResolvedValue('terminated container logs');

      render(
        <Logs
          {...defaultProps}
          resource={resourceWithStatus}
          containers={[{ name: 'container1' }]}
        />,
      );

      expect(commonFetchText as jest.Mock).toHaveBeenCalledWith(
        'http://test-url',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );

      expect(getK8sResourceURL as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'Pod' }),
        undefined,
        expect.objectContaining({
          ns: 'test-namespace',
          name: 'test-pod',
          path: 'log',
          queryParams: {
            container: 'container1',
            follow: 'false', // terminated containers don't follow
          },
        }),
      );
    });

    it('should use kubearchive prefix for terminated containers from archive source', () => {
      const terminatedContainer: ContainerStatus = {
        name: 'container1',
        state: { terminated: { exitCode: 0 } },
        ready: false,
        restartCount: 0,
        image: 'test-image',
        imageID: 'test-image-id',
      };

      const resourceWithStatus: PodKind = {
        ...mockResource,
        status: {
          phase: 'Succeeded',
          containerStatuses: [terminatedContainer],
        },
      };

      (containerToLogSourceStatus as jest.Mock).mockReturnValue('terminated');
      (useIsOnFeatureFlag as jest.Mock).mockReturnValue(true); // kubearchive enabled
      (commonFetchText as jest.Mock).mockResolvedValue('kubearchive logs');

      render(
        <Logs
          {...defaultProps}
          resource={resourceWithStatus}
          containers={[{ name: 'container1' }]}
          source={ResourceSource.Archive}
        />,
      );

      expect(commonFetchText as jest.Mock).toHaveBeenCalledWith(
        'http://test-url',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          pathPrefix: 'plugins/kubearchive',
        }),
      );
    });

    it('should handle fetch errors for terminated containers', async () => {
      const terminatedContainer: ContainerStatus = {
        name: 'container1',
        state: { terminated: { exitCode: 1 } },
        ready: false,
        restartCount: 0,
        image: 'test-image',
        imageID: 'test-image-id',
      };

      const resourceWithStatus: PodKind = {
        ...mockResource,
        status: {
          phase: 'Failed',
          containerStatuses: [terminatedContainer],
        },
      };

      (containerToLogSourceStatus as jest.Mock).mockReturnValue('terminated');
      (commonFetchText as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(
        <Logs
          {...defaultProps}
          resource={resourceWithStatus}
          containers={[{ name: 'container1' }]}
        />,
      );

      expect(commonFetchText as jest.Mock).toHaveBeenCalled();

      // Should show error message in LogViewer
      await waitFor(() => {
        expect(mockLogViewer).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.stringContaining('LOG FETCH ERROR'),
          }),
        );
      });
    });

    it('should use websocket for running containers', async () => {
      const runningContainer: ContainerStatus = {
        name: 'container1',
        state: { running: { startedAt: new Date().toISOString() } },
        ready: true,
        restartCount: 0,
        image: 'test-image',
        imageID: 'test-image-id',
      };

      const resourceWithStatus: PodKind = {
        ...mockResource,
        status: {
          phase: 'Running',
          containerStatuses: [runningContainer],
        },
      };

      (containerToLogSourceStatus as jest.Mock).mockReturnValue('running');
      (getWebsocketSubProtocolAndPathPrefix as jest.Mock).mockReturnValue({
        subprotocol: 'v4.channel.k8s.io',
      });

      render(
        <Logs
          {...defaultProps}
          resource={resourceWithStatus}
          containers={[{ name: 'container1' }]}
        />,
      );

      await waitFor(() => {
        expect(getWebsocketSubProtocolAndPathPrefix as jest.Mock).toHaveBeenCalledWith(
          'http://test-url',
        );
      });

      expect(getK8sResourceURL as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'Pod' }),
        undefined,
        expect.objectContaining({
          ns: 'test-namespace',
          name: 'test-pod',
          path: 'log',
          queryParams: {
            container: 'container1',
            follow: 'true', // running containers follow logs
          },
        }),
      );
    });

    it('should handle websocket messages and decode base64 logs', async () => {
      const runningContainer: ContainerStatus = {
        name: 'container1',
        state: { running: { startedAt: new Date().toISOString() } },
        ready: true,
        restartCount: 0,
        image: 'test-image',
        imageID: 'test-image-id',
      };

      const resourceWithStatus: PodKind = {
        ...mockResource,
        status: {
          phase: 'Running',
          containerStatuses: [runningContainer],
        },
      };

      (containerToLogSourceStatus as jest.Mock).mockReturnValue('running');

      render(
        <Logs
          {...defaultProps}
          resource={resourceWithStatus}
          containers={[{ name: 'container1' }]}
        />,
      );

      // Simulate websocket message
      const messageHandler = mockWebSocketInstance.onMessage.mock.calls[0][0];

      act(() => {
        messageHandler('aGVsbG8gd29ybGQ='); // base64 encoded message
      });

      await waitFor(() => {
        expect(mockLogViewer).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.stringContaining('decoded-aGVsbG8gd29ybGQ='),
          }),
        );
      });
    });
  });

  it('should handle waiting containers', () => {
    const waitingContainer: ContainerStatus = {
      name: 'container1',
      state: { waiting: { reason: 'PodInitializing' } },
      ready: false,
      restartCount: 0,
      image: 'test-image',
      imageID: 'test-image-id',
    };

    const resourceWithStatus: PodKind = {
      ...mockResource,
      status: {
        phase: 'Pending',
        containerStatuses: [waitingContainer],
      },
    };

    (containerToLogSourceStatus as jest.Mock).mockReturnValue('waiting');

    render(
      <Logs
        {...defaultProps}
        resource={resourceWithStatus}
        containers={[{ name: 'container1' }]}
      />,
    );

    // Should use websocket for waiting containers (follow=true)
    expect(getK8sResourceURL as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'Pod' }),
      undefined,
      expect.objectContaining({
        queryParams: expect.objectContaining({
          follow: 'true',
        }),
      }),
    );
  });

  it('should not use kubearchive prefix when feature flag is disabled', () => {
    const terminatedContainer: ContainerStatus = {
      name: 'container1',
      state: { terminated: { exitCode: 0 } },
      ready: false,
      restartCount: 0,
      image: 'test-image',
      imageID: 'test-image-id',
    };

    const resourceWithStatus: PodKind = {
      ...mockResource,
      status: {
        phase: 'Succeeded',
        containerStatuses: [terminatedContainer],
      },
    };

    (containerToLogSourceStatus as jest.Mock).mockReturnValue('terminated');
    (useIsOnFeatureFlag as jest.Mock).mockReturnValue(false); // kubearchive disabled
    (commonFetchText as jest.Mock).mockResolvedValue('cluster logs');

    render(
      <Logs
        {...defaultProps}
        resource={resourceWithStatus}
        containers={[{ name: 'container1' }]}
        source={ResourceSource.Archive}
      />,
    );

    expect(commonFetchText as jest.Mock).toHaveBeenCalledWith(
      'http://test-url',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
        // Should not have pathPrefix when kubearchive is disabled
      }),
    );

    // Verify pathPrefix is not included
    const fetchCall = (commonFetchText as jest.Mock).mock.calls[0][1];
    expect(fetchCall).not.toHaveProperty('pathPrefix');
  });

  it('should use kubearchive prefix when feature flag is enabled and source is Archive', () => {
    const terminatedContainer: ContainerStatus = {
      name: 'container1',
      state: { terminated: { exitCode: 0 } },
      ready: false,
      restartCount: 0,
      image: 'test-image',
      imageID: 'test-image-id',
    };

    const resourceWithStatus: PodKind = {
      ...mockResource,
      status: {
        phase: 'Succeeded',
        containerStatuses: [terminatedContainer],
      },
    };

    (containerToLogSourceStatus as jest.Mock).mockReturnValue('terminated');
    (useIsOnFeatureFlag as jest.Mock).mockReturnValue(true); // kubearchive enabled
    (commonFetchText as jest.Mock).mockResolvedValue('kubearchive logs');

    render(
      <Logs
        {...defaultProps}
        resource={resourceWithStatus}
        containers={[{ name: 'container1' }]}
        source={ResourceSource.Archive}
      />,
    );

    expect(commonFetchText as jest.Mock).toHaveBeenCalledWith(
      'http://test-url',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
        pathPrefix: 'plugins/kubearchive',
      }),
    );
  });

  it('should not use kubearchive prefix for cluster source even when flag is enabled', () => {
    const terminatedContainer: ContainerStatus = {
      name: 'container1',
      state: { terminated: { exitCode: 0 } },
      ready: false,
      restartCount: 0,
      image: 'test-image',
      imageID: 'test-image-id',
    };

    const resourceWithStatus: PodKind = {
      ...mockResource,
      status: {
        phase: 'Succeeded',
        containerStatuses: [terminatedContainer],
      },
    };

    (containerToLogSourceStatus as jest.Mock).mockReturnValue('terminated');
    (useIsOnFeatureFlag as jest.Mock).mockReturnValue(true); // kubearchive enabled
    (commonFetchText as jest.Mock).mockResolvedValue('cluster logs');

    render(
      <Logs
        {...defaultProps}
        resource={resourceWithStatus}
        containers={[{ name: 'container1' }]}
        source={ResourceSource.Cluster} // Cluster source
      />,
    );

    expect(commonFetchText as jest.Mock).toHaveBeenCalledWith(
      'http://test-url',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );

    // Verify pathPrefix is not included for cluster source
    const fetchCall = (commonFetchText as jest.Mock).mock.calls[0][1];
    expect(fetchCall).not.toHaveProperty('pathPrefix');
  });

  it('should disable auto scroll when all containers are terminated', () => {
    const terminatedContainer1: ContainerStatus = {
      name: 'container1',
      state: { terminated: { exitCode: 0 } },
      ready: false,
      restartCount: 0,
      image: 'test-image',
      imageID: 'test-image-id',
    };

    const terminatedContainer2: ContainerStatus = {
      name: 'container2',
      state: { terminated: { exitCode: 0 } },
      ready: false,
      restartCount: 0,
      image: 'test-image',
      imageID: 'test-image-id',
    };

    const resourceWithStatus: PodKind = {
      ...mockResource,
      status: {
        phase: 'Succeeded',
        containerStatuses: [terminatedContainer1, terminatedContainer2],
      },
    };

    (containerToLogSourceStatus as jest.Mock).mockReturnValue('terminated');

    render(
      <Logs
        {...defaultProps}
        resource={resourceWithStatus}
        containers={[{ name: 'container1' }, { name: 'container2' }]}
        allowAutoScroll={true}
      />,
    );

    expect(mockLogViewer).toHaveBeenCalledWith(
      expect.objectContaining({
        allowAutoScroll: false, // Should be false when all containers terminated
      }),
    );
  });

  it('should enable auto scroll when some containers are still running', () => {
    const terminatedContainer: ContainerStatus = {
      name: 'container1',
      state: { terminated: { exitCode: 0 } },
      ready: false,
      restartCount: 0,
      image: 'test-image',
      imageID: 'test-image-id',
    };

    const runningContainer: ContainerStatus = {
      name: 'container2',
      state: { running: { startedAt: new Date().toISOString() } },
      ready: true,
      restartCount: 0,
      image: 'test-image',
      imageID: 'test-image-id',
    };

    const resourceWithStatus: PodKind = {
      ...mockResource,
      status: {
        phase: 'Running',
        containerStatuses: [terminatedContainer, runningContainer],
      },
    };

    (containerToLogSourceStatus as jest.Mock)
      .mockReturnValueOnce('terminated')
      .mockReturnValue('running');

    render(
      <Logs
        {...defaultProps}
        resource={resourceWithStatus}
        containers={[{ name: 'container1' }, { name: 'container2' }]}
        allowAutoScroll={true}
      />,
    );

    expect(mockLogViewer).toHaveBeenCalledWith(
      expect.objectContaining({
        allowAutoScroll: true, // Should be true when some containers still running
      }),
    );
  });

  it('should return false for allLogsTerminated when containers array is empty', () => {
    render(<Logs {...defaultProps} containers={[]} allowAutoScroll={true} />);

    expect(mockLogViewer).toHaveBeenCalledWith(
      expect.objectContaining({
        allowAutoScroll: true, // Should be true when no containers (empty array)
      }),
    );
  });

  it('should handle containers that are not yet started', () => {
    const resourceWithNoContainerStatuses: PodKind = {
      ...mockResource,
      status: {
        phase: 'Pending',
        containerStatuses: [], // No container statuses yet
      },
    };

    // When no container status is found, containerToLogSourceStatus should handle undefined
    (containerToLogSourceStatus as jest.Mock).mockReturnValue('waiting');

    render(
      <Logs
        {...defaultProps}
        resource={resourceWithNoContainerStatuses}
        containers={[{ name: 'container1' }]}
      />,
    );

    // Should still try to create websocket connection for waiting containers
    expect(getK8sResourceURL as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'Pod' }),
      undefined,
      expect.objectContaining({
        queryParams: expect.objectContaining({
          follow: 'true',
        }),
      }),
    );
  });
});
