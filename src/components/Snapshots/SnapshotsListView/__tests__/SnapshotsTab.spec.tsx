import '@testing-library/jest-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { createUseParamsMock, renderWithQueryClientAndRouter } from '~/utils/test-utils';
import { mockSnapshots } from '../../../../__data__/mock-snapshots';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import { SNAPSHOTS_LIST_COLUMN_STATE_KEY } from '../snapshots-table-config';
import { SnapshotsListViewTab } from '../SnapshotsTab';

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

jest.mock('~/hooks/useK8sAndKarchResources', () => ({
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

describe('SnapshotsListViewTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    window.localStorage.removeItem(SNAPSHOTS_LIST_COLUMN_STATE_KEY);
    window.sessionStorage.removeItem(SNAPSHOTS_LIST_COLUMN_STATE_KEY);
    mockUseNamespaceHook('test-namespace');
    useMockSnapshots.mockReturnValue({
      data: mockSnapshots,
      isLoading: false,
      clusterError: undefined,
      archiveError: undefined,
      hasError: false,
    });
  });

  it('should display the filtered empty state when no results match the filter by name', () => {
    createUseParamsMock({ applicationName: 'test-app' });

    renderWithQueryClientAndRouter(<SnapshotsListViewTab />);

    // Verify the snapshot data is displayed initially
    expect(screen.getByText('my-app-snapshot-1')).toBeInTheDocument();

    // Filter by name
    const filter = screen.getByRole<HTMLInputElement>('textbox', { name: 'Name' });
    act(() => {
      fireEvent.change(filter, {
        target: { value: 'my-app-snapshot-invalid' },
      });
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(
      screen.getByText('No results match this filter criteria. Clear all filters and try again.'),
    ).toBeInTheDocument();
  });

  it('should display the snapshot data when the filter matches a snapshot by name', () => {
    createUseParamsMock({ applicationName: 'test-app' });

    renderWithQueryClientAndRouter(<SnapshotsListViewTab />);

    // Filter by name
    const filter = screen.getByRole<HTMLInputElement>('textbox', { name: 'Name' });
    act(() => {
      fireEvent.change(filter, {
        target: { value: 'my-app-snapshot-1' },
      });
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(screen.getByText('my-app-snapshot-1')).toBeInTheDocument();
  });

  it('should allow filtering by commit message', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    createUseParamsMock({ applicationName: 'test-app' });

    renderWithQueryClientAndRouter(<SnapshotsListViewTab />);

    // Open the switchable search dropdown and select "Commit message"
    const filterContainer = screen.getByTestId('switchable-search-filter-searchField');
    const filterDropdown = within(filterContainer).getByRole('button', { name: /name/i });
    await user.click(filterDropdown);

    const option = screen.getByRole('menuitem', { name: /commit message/i });
    await user.click(option);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Add new feature');

    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(screen.getByText('my-app-snapshot-1')).toBeInTheDocument();
  });

  it('sorts snapshots and restores their input order when the sort is cleared', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    createUseParamsMock({ applicationName: 'test-app' });

    const [snapshot] = mockSnapshots;
    const snapshots = [
      {
        ...snapshot,
        metadata: {
          ...snapshot.metadata,
          name: 'b-snapshot',
          uid: 'b-snapshot-uid',
          creationTimestamp: '2023-01-02T10:00:00Z',
        },
      },
      {
        ...snapshot,
        metadata: {
          ...snapshot.metadata,
          name: 'a-snapshot',
          uid: 'a-snapshot-uid',
          creationTimestamp: '2023-01-01T10:00:00Z',
        },
      },
      {
        ...snapshot,
        metadata: {
          ...snapshot.metadata,
          name: 'c-snapshot',
          uid: 'c-snapshot-uid',
          creationTimestamp: '2023-01-03T10:00:00Z',
        },
      },
    ];
    useMockSnapshots.mockReturnValue({
      data: snapshots,
      isLoading: false,
      clusterError: undefined,
      archiveError: undefined,
      hasError: false,
    });

    renderWithQueryClientAndRouter(<SnapshotsListViewTab />);

    expect(screen.getByTestId('sort-dropdown')).toBeInTheDocument();

    const getSnapshotNames = () =>
      screen.getAllByText(/^(a|b|c)-snapshot$/).map((link) => link.textContent);

    await screen.findByText('b-snapshot');
    expect(getSnapshotNames()).toEqual(['b-snapshot', 'a-snapshot', 'c-snapshot']);

    await user.click(screen.getByTestId('sort-dropdown'));
    await user.click(screen.getByRole('option', { name: 'Name' }));
    expect(getSnapshotNames()).toEqual(['a-snapshot', 'b-snapshot', 'c-snapshot']);
    expect(
      JSON.parse(window.sessionStorage.getItem(SNAPSHOTS_LIST_COLUMN_STATE_KEY) ?? '{}'),
    ).toEqual({
      sortColumn: 'name',
      sortDirection: 'asc',
    });
    expect(
      JSON.parse(window.localStorage.getItem(SNAPSHOTS_LIST_COLUMN_STATE_KEY) ?? '{}'),
    ).not.toHaveProperty('sortColumn');

    await user.click(screen.getByRole('option', { name: 'Descending' }));
    expect(getSnapshotNames()).toEqual(['c-snapshot', 'b-snapshot', 'a-snapshot']);

    await user.click(screen.getByRole('option', { name: 'Name' }));
    expect(getSnapshotNames()).toEqual(['b-snapshot', 'a-snapshot', 'c-snapshot']);
    expect(window.sessionStorage.getItem(SNAPSHOTS_LIST_COLUMN_STATE_KEY)).toBeNull();

    await user.click(screen.getByRole('option', { name: 'Created at' }));
    expect(getSnapshotNames()).toEqual(['a-snapshot', 'b-snapshot', 'c-snapshot']);
    await user.click(screen.getByRole('option', { name: 'Descending' }));
    expect(getSnapshotNames()).toEqual(['c-snapshot', 'b-snapshot', 'a-snapshot']);
  });

  it('should display the filtered empty state when no results match the filter by commit message', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    createUseParamsMock({ applicationName: 'test-app' });

    renderWithQueryClientAndRouter(<SnapshotsListViewTab />);

    // Open the switchable search dropdown and select "Commit message"
    const filterContainer2 = screen.getByTestId('switchable-search-filter-searchField');
    const filterDropdown = within(filterContainer2).getByRole('button', {
      name: /name|commit message/i,
    });
    await user.click(filterDropdown);

    const option = screen.getByRole('menuitem', { name: /commit message/i });
    await user.click(option);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Invalid commit message');

    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(
      screen.getByText('No results match this filter criteria. Clear all filters and try again.'),
    ).toBeInTheDocument();
  });
});
