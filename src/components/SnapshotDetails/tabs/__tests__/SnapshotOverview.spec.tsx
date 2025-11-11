import { screen } from '@testing-library/react';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useScanResults } from '~/hooks/useScanResults';
import { useSnapshot } from '~/hooks/useSnapshots';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClientAndRouter } from '../../../../utils/test-utils';
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
}));

// Mock getCommitShortName utility function used by CommitLabel
jest.mock('~/utils/commits-utils', () => ({
  ...jest.requireActual('~/utils/commits-utils'),
  getCommitShortName: jest.fn((sha: string) => sha.slice(0, 7)),
}));

const useSnapshotMock = useSnapshot as jest.Mock;
const usePipelineRunV2Mock = usePipelineRunV2 as jest.Mock;
const useScanResultsMock = useScanResults as jest.Mock;
const useNamespaceMock = mockUseNamespaceHook('test-ns');

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

const basePipelineRun = {
  metadata: {
    name: 'build-plr-1',
    namespace: 'test-ns',
    labels: {
      'pipelinesascode.tekton.dev/sha': 'abc123',
      'appstudio.openshift.io/application': 'app-1',
      'appstudio.openshift.io/component': 'comp-a',
    },
    annotations: {
      'appstudio.openshift.io/commit-url': 'https://example.com/commit/abc123',
      'pipelinesascode.tekton.dev/sha-title': 'Commit title',
    },
  },
  status: {
    startTime: '2024-01-01T00:00:00Z',
  },
};

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
    expect(link.getAttribute('href')).toContain('/ns/test-ns/applications/app-1/commit/abc123');
    expect(link.textContent).toContain('Commit title');
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
