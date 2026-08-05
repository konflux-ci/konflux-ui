import { renderHook, render, screen } from '@testing-library/react';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { PipelineRunKind, PipelineRunStatus } from '~/types';
import { MintmakerLogViewer, useMintmakerLogViewerModal } from '../MintmakerLogViewer';

jest.mock('~/components/modal/ModalProvider', () => ({
  useModalLauncher: jest.fn(),
}));

jest.mock('../MintmakerLogs', () => ({
  MintmakerLogs: () => <div data-test="mintmaker-logs">Logs</div>,
}));

const useModalLauncherMock = useModalLauncher as jest.Mock;

const makePipelineRun = (overrides: Partial<PipelineRunKind> = {}): PipelineRunKind => ({
  kind: 'PipelineRun',
  apiVersion: 'tekton.dev/v1beta1',
  metadata: {
    name: 'mintmaker-run-1',
    namespace: 'mintmaker',
    creationTimestamp: '2023-01-01T00:00:00Z',
    labels: {
      [PipelineRunLabel.MINTMAKER_COMPONENT_LABEL]: 'my-component',
    },
  },
  spec: {},
  status: {
    conditions: [{ status: 'True', type: 'Succeeded' }],
    startTime: '2023-01-01T00:00:00Z',
    completionTime: '2023-01-01T00:05:00Z',
  } as PipelineRunStatus,
  ...overrides,
});

describe('MintmakerLogViewer', () => {
  beforeEach(() => {
    useModalLauncherMock.mockReturnValue(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('metadata details', () => {
    it('always renders the run details section', () => {
      render(<MintmakerLogViewer dependencyRun={makePipelineRun()} />);
      expect(screen.getByTestId('mintmaker-run-details')).toBeInTheDocument();
    });

    it('shows the component label from pipeline run labels', () => {
      render(<MintmakerLogViewer dependencyRun={makePipelineRun()} />);
      expect(screen.getByText('my-component')).toBeInTheDocument();
    });

    it('shows "-" for component when the Mintmaker component label is absent', () => {
      const run = makePipelineRun({
        metadata: {
          name: 'mintmaker-run-1',
          namespace: 'mintmaker',
          creationTimestamp: '2023-01-01T00:00:00Z',
        },
      });
      render(<MintmakerLogViewer dependencyRun={run} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('shows the pipeline run name', () => {
      render(<MintmakerLogViewer dependencyRun={makePipelineRun()} />);
      expect(screen.getByText('mintmaker-run-1')).toBeInTheDocument();
    });
  });

  it('renders the MintmakerLogs component with the dependency run', () => {
    render(<MintmakerLogViewer dependencyRun={makePipelineRun()} />);
    expect(screen.getByTestId('mintmaker-logs')).toBeInTheDocument();
  });
});

describe('useMintmakerLogViewerModal', () => {
  beforeEach(() => {
    useModalLauncherMock.mockReturnValue(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns a function', () => {
    const { result } = renderHook(() => useMintmakerLogViewerModal(makePipelineRun()));
    expect(typeof result.current).toBe('function');
  });

  it('calls showModal when the returned function is invoked', () => {
    const showModal = jest.fn();
    useModalLauncherMock.mockReturnValue(showModal);

    const { result } = renderHook(() => useMintmakerLogViewerModal(makePipelineRun()));
    result.current();

    expect(showModal).toHaveBeenCalledTimes(1);
  });

  it('passes a launcher function to showModal', () => {
    const showModal = jest.fn();
    useModalLauncherMock.mockReturnValue(showModal);

    const { result } = renderHook(() => useMintmakerLogViewerModal(makePipelineRun()));
    result.current();

    expect(showModal).toHaveBeenCalledWith(expect.any(Function));
  });
});
