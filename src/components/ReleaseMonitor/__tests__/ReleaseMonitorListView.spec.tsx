import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SortByDirection, ThProps } from '@patternfly/react-table';
import { screen, waitFor, act, fireEvent, render } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import {
  mockReleases,
  mockNamespaces,
} from '~/components/ReleaseMonitor/__data__/mock-release-data';
import ReleaseMonitorListView from '~/components/ReleaseMonitor/ReleaseMonitorListView';
import ReleasesInNamespace from '~/components/ReleaseMonitor/ReleasesInNamespace';
import { useNamespaceInfo } from '~/shared/providers/Namespace';
import { ReleaseKind } from '~/types';

// Mock dependencies
jest.useFakeTimers();

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespaceInfo: jest.fn(),
}));

jest.mock('~/components/ReleaseMonitor/ReleasesInNamespace', () => jest.fn(() => null));

jest.mock('~/shared/components/table/TableComponent', () => {
  type MockColumn = { title: React.ReactNode; props: ThProps };
  type RowData = { metadata: { name: string } };

  return ({
    data,
    Header,
    EmptyMsg,
  }: {
    data: RowData[];
    Header?: () => MockColumn[];
    EmptyMsg?: React.ComponentType;
  }) => {
    const columns: MockColumn[] = Header ? Header() : [];

    const handleSortClick = (
      idx: number,
      currentDirection: ThProps['sort']['sortBy']['direction'],
    ) => {
      const nextDirection: SortByDirection =
        String(currentDirection) === 'asc' ? SortByDirection.desc : SortByDirection.asc;
      const sort: ThProps['sort'] | undefined = columns[idx]?.props?.sort;
      if (sort?.onSort) {
        const onSort = sort.onSort as (
          e: React.SyntheticEvent,
          index: number,
          direction: SortByDirection,
          extra: unknown,
        ) => void;
        onSort({} as React.SyntheticEvent, idx, nextDirection, {});
      }
    };

    if (data.length === 0 && EmptyMsg) {
      return (
        <div>
          <EmptyMsg />
        </div>
      );
    }

    return (
      <div>
        <div>
          {columns.map((col, idx) => {
            const sort = col?.props?.sort;
            if (sort) {
              return (
                <button
                  key={idx}
                  aria-label={`Column ${idx} sort`}
                  onClick={() => handleSortClick(idx, sort.sortBy.direction)}
                >
                  {col.title}
                </button>
              );
            }
            return <span key={idx}>{col.title}</span>;
          })}
        </div>
        <table role="table" aria-label="mock-table">
          <thead>
            <tr>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <td>{d.metadata.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

const mockUseNamespaceInfo = useNamespaceInfo as jest.Mock;
const mockReleasesInNamespace = ReleasesInNamespace as jest.Mock;

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <FilterContextProvider
        filterParams={[
          'name',
          'status',
          'application',
          'releasePlan',
          'namespace',
          'component',
          'showLatest',
        ]}
      >
        {ui}
      </FilterContextProvider>
    </MemoryRouter>,
  );

const toggleFilter = async (buttonName: RegExp, optionLabel: RegExp) => {
  const filterButton = screen.getByRole('button', { name: buttonName });
  fireEvent.click(filterButton);

  expect(filterButton).toHaveAttribute('aria-expanded', 'true');

  const option = screen.getByLabelText(optionLabel, { selector: 'input' });
  await act(() => fireEvent.click(option));

  await waitFor(() => expect(option).toBeChecked());
  return option;
};

describe('ReleaseMonitorListView', () => {
  let releases: ReleaseKind[];

  const mockNamespacesInfo = {
    namespaces: mockNamespaces,
    namespacesLoaded: true,
    lastUsedNamespace: 'namespace-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNamespaceInfo.mockReturnValue(mockNamespacesInfo);

    releases = JSON.parse(JSON.stringify(mockReleases));
    const release4 = releases.find((r) => r.metadata.name === 'test-release-4');
    if (release4) {
      release4.metadata.creationTimestamp = '2023-01-02T10:30:00Z';
    }

    const triggerReleasesLoaded = (
      namespace: string,
      onReleasesLoaded: (namespace: string, releases: ReleaseKind[]) => void,
    ) => {
      const namespaceReleases = releases.filter(
        (release) => release.metadata.namespace === namespace,
      );
      setTimeout(() => onReleasesLoaded(namespace, namespaceReleases), 0);
    };

    mockReleasesInNamespace.mockImplementation(
      ({
        namespace,
        onReleasesLoaded,
      }: {
        namespace: string;
        onReleasesLoaded: (namespace: string, releases: ReleaseKind[]) => void;
      }) => {
        React.useEffect(() => {
          triggerReleasesLoaded(namespace, onReleasesLoaded);
        }, [namespace, onReleasesLoaded]);
        return null;
      },
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const waitForReleasesLoaded = async (expectedReleases: ReleaseKind[] = releases) => {
    await waitFor(() => {
      expectedReleases.forEach((release) => {
        expect(screen.getByText(release.metadata.name)).toBeInTheDocument();
      });
    });
  };

  it('renders ReleasesInNamespace for each namespace', () => {
    renderWithProviders(<ReleaseMonitorListView />);
    expect(mockReleasesInNamespace).toHaveBeenCalledTimes(mockNamespaces.length);
  });

  it('renders loading state when namespaces are not loaded', () => {
    mockUseNamespaceInfo.mockReturnValue({ ...mockNamespacesInfo, namespacesLoaded: false });
    renderWithProviders(<ReleaseMonitorListView />);
    expect(screen.getByRole('progressbar')).toBeVisible();
  });

  it('filters releases by status', async () => {
    renderWithProviders(<ReleaseMonitorListView />);
    await waitForReleasesLoaded();

    const option = await toggleFilter(/status filter menu/i, /succeeded/i);

    await waitFor(() => {
      expect(screen.getByText('test-release-2')).toBeInTheDocument();
      expect(screen.queryByText('test-release-1')).not.toBeInTheDocument();
    });

    fireEvent.click(option); // cleanup
    expect(option).not.toBeChecked();
  });

  it('filters releases by namespace', async () => {
    renderWithProviders(<ReleaseMonitorListView />);
    await waitForReleasesLoaded();

    const option = await toggleFilter(/namespace filter menu/i, /namespace-1/i);

    await waitFor(() => {
      expect(screen.getByText('test-release-1')).toBeInTheDocument();
      expect(screen.queryByText('test-release-3')).not.toBeInTheDocument();
    });

    fireEvent.click(option);
    expect(option).not.toBeChecked();
  });

  it('filters releases by application', async () => {
    renderWithProviders(<ReleaseMonitorListView />);
    await waitForReleasesLoaded();

    const option = await toggleFilter(/application filter menu/i, /foo/i);

    await waitFor(() => {
      expect(screen.getByText('test-release-3')).toBeInTheDocument();
      expect(screen.getByText('test-release-4')).toBeInTheDocument();
      expect(screen.queryByText('test-release-1')).not.toBeInTheDocument();
      expect(screen.queryByText('test-release-2')).not.toBeInTheDocument();
    });

    fireEvent.click(option);
    expect(option).not.toBeChecked();
  });

  it('filters releases by component', async () => {
    renderWithProviders(<ReleaseMonitorListView />);
    await waitForReleasesLoaded();

    const option = await toggleFilter(/component filter menu/i, /bar-01-component/i);

    await waitFor(() => {
      // Both should be visible since they share the component
      expect(screen.getByText('test-release-3')).toBeInTheDocument();
      expect(screen.getByText('test-release-4')).toBeInTheDocument();

      // Other components should be gone
      expect(screen.queryByText('test-release-1')).not.toBeInTheDocument();
      expect(screen.queryByText('test-release-2')).not.toBeInTheDocument();
    });

    fireEvent.click(option);
    expect(option).not.toBeChecked();
  });

  it('filters releases by releasePlan', async () => {
    renderWithProviders(<ReleaseMonitorListView />);
    await waitForReleasesLoaded();

    const option = await toggleFilter(/Release Plan filter menu/i, /test-plan-3/i);

    await waitFor(() => {
      // Both releases with this plan should be visible
      expect(screen.getByText('test-release-3')).toBeInTheDocument();
      expect(screen.getByText('test-release-4')).toBeInTheDocument();

      // Others should not be visible
      expect(screen.queryByText('test-release-1')).not.toBeInTheDocument();
      expect(screen.queryByText('test-release-2')).not.toBeInTheDocument();
    });

    fireEvent.click(option);
    expect(option).not.toBeChecked();
  });

  it('clears filters', async () => {
    renderWithProviders(<ReleaseMonitorListView />);
    await waitForReleasesLoaded();

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');

    // Filter to a specific release
    fireEvent.change(filter, { target: { value: 'test-release-2' } });
    act(() => jest.advanceTimersByTime(700));

    // Wait for filter to be applied
    await waitFor(() => {
      expect(screen.getByText('test-release-2')).toBeInTheDocument();
      expect(screen.queryByText('test-release-1')).not.toBeInTheDocument();
    });

    // Clear the filter by setting it to empty string
    fireEvent.change(filter, { target: { value: '' } });
    act(() => jest.advanceTimersByTime(700));

    // Wait for all releases to reappear
    await waitFor(() => {
      expect(screen.getByText('test-release-1')).toBeInTheDocument();
      expect(screen.getByText('test-release-2')).toBeInTheDocument();
      expect(screen.getByText('test-release-3')).toBeInTheDocument();
    });
  });

  it('renders empty state when no releases are found', async () => {
    mockUseNamespaceInfo.mockReturnValue({
      namespaces: [],
      namespacesLoaded: true,
      lastUsedNamespace: '',
    });
    renderWithProviders(<ReleaseMonitorListView />);
    await waitFor(() => expect(screen.getByText('No releases found')).toBeInTheDocument());
  });

  it('filters releases by name', async () => {
    renderWithProviders(<ReleaseMonitorListView />);
    await waitForReleasesLoaded();

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    fireEvent.change(filter, { target: { value: 'test-release-2' } });
    act(() => jest.advanceTimersByTime(700));

    await waitFor(() => {
      expect(screen.getByText('test-release-2')).toBeInTheDocument();
      expect(screen.queryByText('test-release-1')).not.toBeInTheDocument();
    });

    fireEvent.change(filter, { target: { value: '' } });
    expect(filter.value).toBe('');
  });

  it('defaults to sorting by completion time (desc) among completed items', async () => {
    renderWithProviders(<ReleaseMonitorListView />);

    // Wait for releases to load first
    await waitForReleasesLoaded();

    await waitFor(() => {
      expect(screen.getByText('test-release-1')).toBeInTheDocument();
      expect(screen.getByText('test-release-2')).toBeInTheDocument();
      expect(screen.getByText('test-release-3')).toBeInTheDocument();
    });

    const rows = screen.getAllByRole('row');
    const names = rows
      .slice(1) // skip header row in our simple table mock
      .map((r) => r.querySelector('td')?.textContent);

    // Among completed, newest first: test-release-3 before test-release-2
    expect(names.indexOf('test-release-3')).toBeLessThan(names.indexOf('test-release-2'));
  });

  it('toggles sorting on completion time header', async () => {
    renderWithProviders(<ReleaseMonitorListView />);

    // Wait for data to load to ensure toolbar is rendered
    await waitFor(() => {
      expect(screen.getByText('test-release-2')).toBeInTheDocument();
    });

    // Ensure any persisted filters are cleared
    const filterEl = screen.getByPlaceholderText('Filter by name...');
    if (filterEl instanceof HTMLInputElement && filterEl.value) {
      fireEvent.change(filterEl, { target: { value: '' } });
      act(() => {
        jest.advanceTimersByTime(700);
      });
    }
    const clear = screen.queryByText('Clear all filters');
    if (clear) fireEvent.click(clear);

    await waitFor(() => {
      expect(screen.getByText('test-release-1')).toBeInTheDocument();
      expect(screen.getByText('test-release-2')).toBeInTheDocument();
      expect(screen.getByText('test-release-3')).toBeInTheDocument();
    });

    // Toggle to ascending (Completion Time column index is 2)
    const completionSortButton = screen.getByRole('button', { name: /Column 2 sort/i });
    fireEvent.click(completionSortButton);

    let rows = screen.getAllByRole('row');
    let names = rows.slice(1).map((r) => r.querySelector('td')?.textContent);

    // Among completed, oldest first in asc: test-release-2 before test-release-3
    expect(names.indexOf('test-release-2')).toBeLessThan(names.indexOf('test-release-3'));

    // Toggle back to descending
    fireEvent.click(completionSortButton);

    rows = screen.getAllByRole('row');
    names = rows.slice(1).map((r) => r.querySelector('td')?.textContent);

    expect(names.indexOf('test-release-3')).toBeLessThan(names.indexOf('test-release-2'));
  });

  it('filters to show only the latest release for each component', async () => {
    renderWithProviders(<ReleaseMonitorListView />);
    await waitForReleasesLoaded();

    // Initially, all releases are shown
    expect(screen.getByText('test-release-3')).toBeInTheDocument();
    expect(screen.getByText('test-release-4')).toBeInTheDocument();

    // Find and click the switch
    const showLatestSwitch = screen.getByLabelText('Show latest release for each component');
    fireEvent.click(showLatestSwitch);

    // After switching, only the latest release for the component should be visible
    await waitFor(() => {
      expect(screen.getByText('test-release-4')).toBeInTheDocument();
      expect(screen.getByText('test-release-1')).toBeInTheDocument();
      expect(screen.getByText('test-release-2')).toBeInTheDocument();
      expect(screen.queryByText('test-release-3')).not.toBeInTheDocument();
    });

    // Toggle back
    fireEvent.click(showLatestSwitch);

    // All releases should be visible again
    await waitFor(() => {
      expect(screen.getByText('test-release-3')).toBeInTheDocument();
      expect(screen.getByText('test-release-4')).toBeInTheDocument();
    });
  });
});
