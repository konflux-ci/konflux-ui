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
import Logs from '../Logs';

const mockLogViewer = jest.fn();

const getLastSectionsLines = (): string[] => {
  const lastCall = mockLogViewer.mock.calls[mockLogViewer.mock.calls.length - 1][0];
  return (lastCall.sections || []).flatMap((s: { lines: string[] }) => s.lines);
};

jest.mock('../LogViewer', () => {
  return function MockLogViewer(props: {
    sections?: Array<{ containerName: string; lines: string[] }>;
    data?: string;
    allowAutoScroll: boolean;
    isLoading?: boolean;
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
          sections: expect.any(Array),
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
            sections: [],
          }),
        );
      });
    });
  });

  describe('sections prop', () => {
    it('should pass sections with correct container names and pre-split lines', async () => {
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
      (commonFetchText as jest.Mock)
        .mockResolvedValueOnce('log line 1\nlog line 2')
        .mockResolvedValueOnce('log line 3\nlog line 4');

      render(
        <Logs
          {...defaultProps}
          resource={resourceWithStatus}
          containers={[{ name: 'container1' }, { name: 'container2' }]}
        />,
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockLogViewer).toHaveBeenLastCalledWith(
        expect.objectContaining({
          sections: expect.arrayContaining([
            { containerName: 'container1', lines: ['log line 1', 'log line 2'] },
            { containerName: 'container2', lines: ['log line 3', 'log line 4'] },
          ]),
        }),
      );
    });

    it('should preserve container ordering from containers prop', async () => {
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
      (commonFetchText as jest.Mock).mockResolvedValueOnce('first').mockResolvedValueOnce('second');

      render(
        <Logs
          {...defaultProps}
          resource={resourceWithStatus}
          containers={[{ name: 'container2' }, { name: 'container1' }]}
        />,
      );

      await act(async () => {
        await Promise.resolve();
      });

      const lastCall = mockLogViewer.mock.calls[mockLogViewer.mock.calls.length - 1][0];
      expect(lastCall.sections[0].containerName).toBe('container2');
      expect(lastCall.sections[1].containerName).toBe('container1');
    });

    it('should skip containers without log sources', async () => {
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
      (commonFetchText as jest.Mock).mockResolvedValueOnce('has logs').mockResolvedValueOnce(''); // container2 returns empty string (no logs)

      render(
        <Logs
          {...defaultProps}
          resource={resourceWithStatus}
          containers={[{ name: 'container1' }, { name: 'container2' }]}
        />,
      );

      await act(async () => {
        await Promise.resolve();
      });

      // container2 has empty logs, so it should be filtered out by the sections memo
      const lastCall = mockLogViewer.mock.calls[mockLogViewer.mock.calls.length - 1][0];
      expect(lastCall.sections).toHaveLength(1);
      expect(lastCall.sections[0].containerName).toBe('container1');
    });

    it('should pass empty sections when no containers have logs', () => {
      render(<Logs {...defaultProps} containers={[]} />);

      expect(mockLogViewer).toHaveBeenCalledWith(
        expect.objectContaining({
          sections: [],
        }),
      );
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
        expect(getLastSectionsLines().join('\n')).toContain('LOG FETCH ERROR');
      });
    });

    it('should gracefully handle 404 errors (empty logs) from kubearch', async () => {
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
      const error404 = Object.assign(new Error('Not Found'), { code: 404 });
      (commonFetchText as jest.Mock).mockRejectedValue(error404);

      render(
        <Logs
          {...defaultProps}
          resource={resourceWithStatus}
          containers={[{ name: 'container1' }]}
        />,
      );

      expect(commonFetchText as jest.Mock).toHaveBeenCalled();

      // Should NOT show error message for 404 (missing logs) - should remain empty
      await waitFor(() => {
        expect(getLastSectionsLines().join('\n')).not.toContain('LOG FETCH ERROR');
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
        expect(getLastSectionsLines().join('\n')).toContain('decoded-aGVsbG8gd29ybGQ=');
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

  describe('loading indicator while processing logs', () => {
    it('should not add processingLogs to isLoading', () => {
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
      (commonFetchText as jest.Mock).mockResolvedValue('some log output');

      render(
        <Logs
          {...defaultProps}
          resource={resourceWithStatus}
          containers={[{ name: 'container1' }]}
        />,
      );

      // isLoading should only reflect the prop, not internal processing
      expect(mockLogViewer).toHaveBeenCalledWith(
        expect.objectContaining({
          isLoading: false,
        }),
      );
    });

    it('should not show loading when there are no log sources', () => {
      render(<Logs {...defaultProps} containers={[]} />);

      expect(mockLogViewer).toHaveBeenCalledWith(
        expect.objectContaining({
          isLoading: false,
          sections: [],
        }),
      );
    });
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
