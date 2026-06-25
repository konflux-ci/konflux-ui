import '@testing-library/jest-dom';
import { screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { ResourceSource } from '~/types/k8s';
import { setupVirtualizerMock } from '~/unit-test-utils';
import { mockSnapshots } from '../../../../__data__/mock-snapshots';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import { createUseParamsMock, renderWithQueryClientAndRouter } from '../../../../utils/test-utils';
import SnapshotsListView from '../SnapshotsListView';

jest.useFakeTimers();

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(),
}));

beforeEach(() => {
  setupVirtualizerMock();
});

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('../../../../hooks/useK8sAndKarchResources', () => ({
  useK8sAndKarchResources: jest.fn(),
}));

jest.mock('../../../../hooks/useApplicationReleases', () => ({
  useApplicationReleases: jest.fn(() => []),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
  };
});


const useMockSnapshots = useK8sAndKarchResources as jest.Mock;

const createWrappedComponent = () => <SnapshotsListView applicationName="test-app" />;

describe('SnapshotsListView - Column Headers', () => {
  createUseParamsMock({ applicationName: 'test-app' });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNamespaceHook('test-namespace');
    // Reset URL state between tests (BrowserRouter shares window.location)
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    jest.useFakeTimers();
  });

  it('should display all expected column headers correctly', () => {
    useMockSnapshots.mockReturnValue({
      data: mockSnapshots,
      getSource: () => ResourceSource.Cluster,
      isLoading: false,
      hasError: false,
    });

    act(() => {
      renderWithQueryClientAndRouter(createWrappedComponent());
    });

    expect(screen.getByText('Created at')).toBeInTheDocument();
    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByText('Commit message')).toBeInTheDocument();
    expect(screen.getByText('Reference')).toBeInTheDocument();
  });

  it('should filter out archive snapshots when releasable filter is enabled', async () => {
    jest.useRealTimers();

    const clusterSnapshot = {
      ...mockSnapshots[0],
      metadata: { ...mockSnapshots[0].metadata, name: 'cluster-snapshot', uid: 'uid-cluster' },
    };
    const archiveSnapshot = {
      ...mockSnapshots[0],
      metadata: { ...mockSnapshots[0].metadata, name: 'archive-snapshot', uid: 'uid-archive' },
    };

    const mockGetSource = (resource) => {
      if (resource.metadata?.uid === 'uid-cluster') return ResourceSource.Cluster;
      if (resource.metadata?.uid === 'uid-archive') return ResourceSource.Archive;
      return undefined;
    };

    useMockSnapshots.mockImplementation(
      (_resourceInit, _model, _queryOptions, _options, queryControl) => {
        const enableArchive = queryControl?.enableArchive === true;

        return {
          data: enableArchive ? [clusterSnapshot, archiveSnapshot] : [clusterSnapshot],
          getSource: mockGetSource,
          isLoading: false,
          hasError: false,
        };
      },
    );

    renderWithQueryClientAndRouter(createWrappedComponent());

    // By default, enableArchive is true (no releasable filter), so both snapshots shown
    expect(screen.getByText('cluster-snapshot')).toBeInTheDocument();
    expect(screen.getByText('archive-snapshot')).toBeInTheDocument();

    expect(useMockSnapshots).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      undefined,
      undefined,
      expect.objectContaining({ enableArchive: true }),
    );

    // Open the multiSelect dropdown and select "Show only releasable snapshots"
    const user = userEvent.setup();
    await user.click(screen.getByTestId('multi-select-filter-filterBy'));
    await user.click(screen.getByText('Show only releasable snapshots'));

    // After selecting the releasable filter, enableArchive is false, so only cluster snapshot shown
    await waitFor(() => {
      expect(screen.queryByText('archive-snapshot')).not.toBeInTheDocument();
    });

    expect(screen.getByText('cluster-snapshot')).toBeInTheDocument();
  });

  it('should show filter dashboard if no results but filters are applied', async () => {
    jest.useRealTimers();

    const clusterSnapshot = {
      ...mockSnapshots[0],
      metadata: { ...mockSnapshots[0].metadata, name: 'cluster-snapshot', uid: 'uid-cluster' },
    };

    useMockSnapshots.mockImplementation(
      (_resourceInit, _model, _queryOptions, _options, queryControl) => {
        const enableArchive = queryControl?.enableArchive === true;

        return {
          data: enableArchive ? [clusterSnapshot] : [],
          getSource: () => ResourceSource.Cluster,
          isLoading: false,
          hasError: false,
        };
      },
    );
    renderWithQueryClientAndRouter(createWrappedComponent());

    // Initially enableArchive is true (default), so data is available and toolbar is visible
    await waitFor(() => {
      expect(screen.getByText('cluster-snapshot')).toBeInTheDocument();
    });

    // Open the multiSelect dropdown and select "Show only releasable snapshots"
    const user = userEvent.setup();
    await user.click(screen.getByTestId('multi-select-filter-filterBy'));
    await user.click(screen.getByRole('menuitem', { name: /show only releasable snapshots/i }));

    // After selecting the releasable filter, enableArchive is false and mock returns [], so the filter toolbar should still be visible
    await waitFor(() => {
      expect(screen.getByTestId('multi-select-filter-filterBy')).toBeInTheDocument();
    });
  });
});
