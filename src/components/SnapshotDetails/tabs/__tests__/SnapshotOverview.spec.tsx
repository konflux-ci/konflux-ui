import { screen } from '@testing-library/react';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { ScanResults, useScanResults } from '~/hooks/useScanResults';
import { useSnapshot } from '~/hooks/useSnapshots';
import { renderWithQueryClientAndRouter } from '../../../../utils/test-utils';
import { SnapshotComponentTableData } from '../SnapshotComponentsListRow';
import SnapshotOverview from '../SnapshotOverview';

// Mock router to turn Link into a simple anchor and control params
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props: {
      to: string;
      'data-test': string;
      title: string;
      children: React.ReactNode;
    }) => (
      <a href={props.to} data-test={props['data-test']} title={props.title}>
        {props.children}
      </a>
    ),
    useParams: jest.fn(() => ({ snapshotName: 'snap-1' })),
  };
});

// Mock namespace hook
jest.mock('~/shared/providers/Namespace', () => ({
  useNamespace: jest.fn(() => 'test-ns'),
}));

// Mock snapshot hook
jest.mock('~/hooks/useSnapshots', () => ({
  useSnapshot: jest.fn(),
}));

// Mock pipelinerun hook
jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunV2: jest.fn(),
}));

// Mock scan results hook
jest.mock('~/hooks/useScanResults', () => ({
  useScanResults: jest.fn(),
}));

// Mock scroll hook to be a no-op
jest.mock('~/hooks/useScrollToHash', () => ({
  useScrollToHash: jest.fn(),
}));

// Mock commit util to return a stable commit object
jest.mock('~/utils/commits-utils', () => ({
  createCommitObjectFromPLR: jest.fn(() => ({
    sha: 'abc123',
    shaTitle: 'abc123',
    displayName: 'Commit title',
    gitProvider: 'github',
    shaURL: 'https://example.com/commit/abc123',
  })),
}));

// Mock CommitLabel to avoid internal util dependencies
jest.mock('~/components/Commits/commit-label/CommitLabel', () => ({
  __esModule: true,
  default: ({ sha }: { sha: string }) => <span data-test="commit-label">{sha}</span>,
}));

// Mock ScanStatus to render a recognizable marker
jest.mock('~/components/PipelineRun/PipelineRunListView/ScanStatus', () => ({
  ScanStatus: ({ scanResults }: { scanResults: ScanResults }) => (
    <div data-test="scan-status">{JSON.stringify(scanResults)}</div>
  ),
}));

// Mock SnapshotComponentsList to capture props
jest.mock('../SnapshotComponentsList', () => ({
  __esModule: true,
  default: ({
    components,
    applicationName,
  }: {
    components: SnapshotComponentTableData[];
    applicationName: string;
  }) => (
    <div data-test="snapshot-components-list" data-count={components?.length}>
      {applicationName}
    </div>
  ),
}));

const useSnapshotMock = useSnapshot as jest.Mock;
const usePipelineRunV2Mock = usePipelineRunV2 as jest.Mock;
const useScanResultsMock = useScanResults as jest.Mock;

const baseSnapshot = {
  metadata: {
    name: 'snap-1',
    namespace: 'test-ns',
    creationTimestamp: '2024-01-01T00:00:00Z',
    labels: {
      'appstudio.openshift.io/build-pipeline': 'build-plr-1',
    },
  },
  spec: {
    application: 'app-1',
    components: [{ name: 'comp-a' }, { name: 'comp-b' }],
  },
};

describe('SnapshotOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSnapshotMock.mockReturnValue([baseSnapshot, true, undefined]);
    usePipelineRunV2Mock.mockReturnValue([{}, true, false]);
    useScanResultsMock.mockReturnValue([[{ critical: 0 }], true]);
  });

  it('renders commit link when commit is available', () => {
    renderWithQueryClientAndRouter(<SnapshotOverview />);
    const commitDesc = screen.getByTestId('snapshot-commit-link');
    const link = commitDesc.querySelector('a');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toContain('/ns/test-ns/applications/app-1/commit/abc123');
    expect(link.textContent).toContain('Commit title');
  });

  it('omits commit section when pipelinerun load fails', () => {
    usePipelineRunV2Mock.mockReturnValue([{}, true, true]);
    renderWithQueryClientAndRouter(<SnapshotOverview />);
    expect(screen.queryByTestId('snapshot-commit-link')).toBeNull();
  });

  it('shows skeleton while scan results are loading, then shows ScanStatus', () => {
    useScanResultsMock.mockReturnValueOnce([undefined, false]);
    const { rerender } = renderWithQueryClientAndRouter(<SnapshotOverview />);
    // When not loaded, ScanStatus should not be present
    expect(screen.queryByTestId('scan-status')).toBeNull();

    // After loaded
    useScanResultsMock.mockReturnValueOnce([[{ critical: 1 }], true]);
    rerender(<SnapshotOverview />);
    expect(screen.getByTestId('scan-status')).toBeInTheDocument();
  });

  it('passes mapped components and applicationName to SnapshotComponentsList', () => {
    renderWithQueryClientAndRouter(<SnapshotOverview />);
    const list = screen.getByTestId('snapshot-components-list');
    expect(list).toHaveAttribute('data-count', '2');
    expect(list.textContent).toBe('app-1');
  });

  it('falls back to dash when creationTimestamp is missing', () => {
    useSnapshotMock.mockReturnValueOnce([
      {
        ...baseSnapshot,
        metadata: { ...baseSnapshot.metadata, creationTimestamp: undefined },
      },
      true,
      undefined,
    ]);
    renderWithQueryClientAndRouter(<SnapshotOverview />);
    // Expect a dash to appear somewhere under Created at section
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });
});
