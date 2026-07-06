import '@testing-library/jest-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { screen } from '@testing-library/react';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { NuqsAdapter } from '~/shared/components/Filter';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import { createUseParamsMock, renderWithQueryClientAndRouter } from '../../../../utils/test-utils';
import SnapshotsListView from '../SnapshotsListView';

jest.useFakeTimers();

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(),
}));

const mockUseVirtualizer = jest.mocked(useVirtualizer);

beforeEach(() => {
  mockUseVirtualizer.mockImplementation((opts) => {
    const items = Array.from({ length: opts.count }, (_, i) => ({
      index: i,
      key: i,
      start: i * 44,
      end: (i + 1) * 44,
      size: 44,
      lane: 0,
    }));
    return {
      getVirtualItems: () => items,
      getTotalSize: () => opts.count * 44,
      measureElement: () => undefined,
      scrollToIndex: () => undefined,
      scrollToOffset: () => undefined,
      measure: () => undefined,
      getOffsetForIndex: () => [0, 0] as [number, number],
      options: { count: opts.count },
    } as unknown as ReturnType<typeof useVirtualizer>;
  });
});

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('../../../../hooks/useK8sAndKarchResources', () => ({
  useK8sAndKarchResources: jest.fn(),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
  };
});

const useMockSnapshots = useK8sAndKarchResources as jest.Mock;

// Helper function to create wrapped component
const createWrappedComponent = () => (
  <NuqsAdapter>
    <SnapshotsListView applicationName="test-app" />
  </NuqsAdapter>
);

const checkEmptyState = () => {
  // Check for the empty state title
  expect(screen.getByText('No snapshots found')).toBeInTheDocument();

  // Check for the empty state description text
  expect(
    screen.getByText(/Snapshots are created automatically by push events or pull request events/),
  ).toBeInTheDocument();
  expect(screen.getByText(/Snapshots can also be created manually if needed/)).toBeInTheDocument();
  expect(
    screen.getByText(/Once created, Snapshots will be displayed on this page/),
  ).toBeInTheDocument();

  // Check for the empty state test attribute
  expect(screen.getByTestId('snapshots-empty-state')).toBeInTheDocument();
};

describe('SnapshotsListView - Empty State', () => {
  createUseParamsMock({ applicationName: 'test-app' });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNamespaceHook('test-namespace');
  });

  it('should display empty state when no snapshots are found', () => {
    // Mock empty snapshots data
    useMockSnapshots.mockReturnValue({
      data: [],
      isLoading: false,
      archiveError: undefined,
      clusterError: undefined,
    });

    renderWithQueryClientAndRouter(createWrappedComponent());

    checkEmptyState();
  });

  it('should display empty state when snapshots data is undefined', () => {
    // Mock undefined snapshots data
    useMockSnapshots.mockReturnValue({
      data: undefined,
      isLoading: false,
      archiveError: undefined,
      clusterError: undefined,
    });

    renderWithQueryClientAndRouter(createWrappedComponent());

    checkEmptyState();
  });

  it('should display empty state when snapshots data is null', () => {
    // Mock null snapshots data
    useMockSnapshots.mockReturnValue({
      data: null,
      isLoading: false,
      archiveError: undefined,
      clusterError: undefined,
    });

    renderWithQueryClientAndRouter(createWrappedComponent());

    checkEmptyState();
  });

  it('should not display empty state when snapshots are loading', () => {
    // Mock loading state
    useMockSnapshots.mockReturnValue({
      data: [],
      isLoading: true,
      archiveError: undefined,
      clusterError: undefined,
    });

    renderWithQueryClientAndRouter(createWrappedComponent());

    // TableContainer shows skeleton when not loaded
    expect(screen.queryByText('No snapshots found')).not.toBeInTheDocument();
  });

  describe('Error Handling', () => {
    it('should render ErrorEmptyState when both cluster and archive errors occur', () => {
      useMockSnapshots.mockReturnValue({
        data: [],
        isLoading: false,
        hasError: true,
        clusterError: new Error('Cluster connection failed'),
        archiveError: new Error('Archive service unavailable'),
      });

      renderWithQueryClientAndRouter(createWrappedComponent());

      expect(screen.getByText('Unable to load snapshots')).toBeInTheDocument();
    });

    it("should render cluster ErrorEmptyState when it' error code is not 404", () => {
      useMockSnapshots.mockReturnValue({
        data: [],
        isLoading: false,
        clusterError: { code: 403 },
        archiveError: { code: 404 },
      });

      renderWithQueryClientAndRouter(createWrappedComponent());

      expect(screen.getByText('Forbidden')).toBeInTheDocument();
    });

    it('should not render ErrorEmptyState when only cluster error occurs', () => {
      useMockSnapshots.mockReturnValue({
        data: [],
        isLoading: false,
        hasError: true,
        clusterError: new Error('Cluster connection failed'),
        archiveError: null,
      });

      renderWithQueryClientAndRouter(createWrappedComponent());

      checkEmptyState();
      expect(screen.queryByText('Unable to load snapshots')).not.toBeInTheDocument();
    });

    it('should not render ErrorEmptyState when only archive error occurs', () => {
      useMockSnapshots.mockReturnValue({
        data: [],
        isLoading: false,
        hasError: true,
        clusterError: null,
        archiveError: new Error('Archive service unavailable'),
      });

      renderWithQueryClientAndRouter(createWrappedComponent());

      checkEmptyState();
      expect(screen.queryByText('Unable to load snapshots')).not.toBeInTheDocument();
    });
  });
});
