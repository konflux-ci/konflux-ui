import { screen } from '@testing-library/react';
import { mockSnapshot } from '~/__data__/mock-snapshots';
import { DataState, testPipelineRuns } from '~/__data__/pipelinerun-data';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useScanResults } from '~/hooks/useScanResults';
import { useSnapshot } from '~/hooks/useSnapshots';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClientAndRouter } from '~/utils/test-utils';
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
    sha: 'abc5b3ad0a2c16726523b12cf3b8f0365be33566',
    shaTitle: 'abc123',
    displayName: 'Commit title',
    gitProvider: 'github',
    shaURL: 'https://example.com/commit/abc5b3ad0a2c16726523b12cf3b8f0365be33566',
  })),
  ...jest.requireActual('~/utils/commits-utils'),
  getCommitShortName: jest.fn((sha: string) => sha.slice(0, 7)),
}));

const useSnapshotMock = useSnapshot as jest.Mock;
const usePipelineRunV2Mock = usePipelineRunV2 as jest.Mock;
const useScanResultsMock = useScanResults as jest.Mock;
const useNamespaceMock = mockUseNamespaceHook('test-ns');

const baseSnapshot = mockSnapshot;
const basePipelineRun = testPipelineRuns[DataState.SUCCEEDED];

describe('SnapshotOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSnapshotMock.mockReturnValue([baseSnapshot, true, undefined]);
    usePipelineRunV2Mock.mockReturnValue([basePipelineRun, true, false]);
    useScanResultsMock.mockReturnValue([
      { vulnerabilities: { critical: 1, high: 0, medium: 0, low: 0, unknown: 0 } },
      true,
    ]);
  });

  it('renders commit link when commit is available', () => {
    useNamespaceMock.mockReturnValue('test-ns');
    renderWithQueryClientAndRouter(<SnapshotOverview />);
    const commitDesc = screen.getByTestId('snapshot-commit-link');
    const link = commitDesc.querySelector('a');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toContain(
      '/ns/test-ns/applications/test-app/commit/c782c8f81145fc13f516420a960247f5ffa2f7e0',
    );
  });

  it('renders CommitLabel when commit is available', () => {
    useNamespaceMock.mockReturnValue('test-ns');
    renderWithQueryClientAndRouter(<SnapshotOverview />);

    const commitLabel = screen.queryByTestId('commit-label-c782c8f');

    expect(commitLabel).toBeInTheDocument();
  });

  it('omits commit section when pipelinerun load fails', () => {
    usePipelineRunV2Mock.mockReturnValue([basePipelineRun, true, true]);
    renderWithQueryClientAndRouter(<SnapshotOverview />);
    expect(screen.queryByTestId('snapshot-commit-link')).toBeNull();
  });

  it('shows skeleton while scan results are loading, then shows ScanStatus', () => {
    useScanResultsMock.mockReturnValueOnce([null, false]);
    const { rerender } = renderWithQueryClientAndRouter(<SnapshotOverview />);
    // When not loaded, ScanStatus should not be present
    expect(screen.queryByTestId('scan-status-critical-test-id')).toBeNull();

    // After loaded
    useScanResultsMock.mockReturnValueOnce([
      { vulnerabilities: { critical: 1, high: 0, medium: 0, low: 0, unknown: 0 } },
      true,
    ]);
    rerender(<SnapshotOverview />);
    expect(screen.getByTestId('scan-status-critical-test-id')).toBeInTheDocument();
  });

  it('renders SnapshotComponentsList with components and applicationName', () => {
    renderWithQueryClientAndRouter(<SnapshotOverview />);
    // Check that the Components section is rendered
    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(
      screen.getByText('Component builds that are included in this snapshot'),
    ).toBeInTheDocument();
    // Check that the component list toolbar is present
    expect(screen.getByTestId('component-list-toolbar')).toBeInTheDocument();
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
