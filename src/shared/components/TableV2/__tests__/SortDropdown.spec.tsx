import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortDropdown } from '~/shared/components/TableV2/SortDropdown';
import { type ColumnDefinition } from '~/shared/components/TableV2/types';
import { useLocalStorage } from '~/shared/hooks/useLocalStorage';
import { useSessionStorage } from '~/shared/hooks/useSessionStorage';

jest.mock('~/shared/hooks/useLocalStorage');
jest.mock('~/shared/hooks/useSessionStorage');
const mockUseLocalStorage = jest.mocked(useLocalStorage);
const mockUseSessionStorage = jest.mocked(useSessionStorage);

interface TestRow {
  name: string;
  status: string;
  id: string;
}

const columns: ColumnDefinition<TestRow>[] = [
  { id: 'name', header: 'Name', accessorFn: (row) => row.name, sortable: true },
  { id: 'status', header: 'Status', accessorFn: (row) => row.status, sortable: true },
  { id: 'id', header: 'ID', accessorFn: (row) => row.id },
];

const renderSortDropdown = (
  cols: ColumnDefinition<TestRow>[] = columns,
  columnStateKey = 'test-sort',
) => render(<SortDropdown columns={cols} columnStateKey={columnStateKey} />);

const clickToggle = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button'));
};

describe('SortDropdown', () => {
  let mockSetValue: jest.Mock;
  let mockSetSortValue: jest.Mock;
  let mockRemoveSortValue: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetValue = jest.fn();
    mockSetSortValue = jest.fn();
    mockRemoveSortValue = jest.fn();
    mockUseLocalStorage.mockReturnValue([
      { visibleColumns: ['name', 'status', 'id'], columnOrder: ['name', 'status', 'id'] },
      mockSetValue,
      jest.fn(),
    ]);
    mockUseSessionStorage.mockReturnValue([undefined, mockSetSortValue, mockRemoveSortValue]);
  });

  it('renders the sort toggle button', () => {
    renderSortDropdown();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders sortable columns in "Sort by" group', async () => {
    const user = userEvent.setup();
    renderSortDropdown();

    await clickToggle(user);

    expect(screen.getByText('Sort by')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('excludes non-sortable columns from the dropdown', async () => {
    const user = userEvent.setup();
    renderSortDropdown();

    await clickToggle(user);

    expect(screen.queryByText('ID')).not.toBeInTheDocument();
  });

  it('renders direction group with Ascending and Descending', async () => {
    const user = userEvent.setup();
    renderSortDropdown();

    await clickToggle(user);

    expect(screen.getByText('Direction')).toBeInTheDocument();
    expect(screen.getByText('Ascending')).toBeInTheDocument();
    expect(screen.getByText('Descending')).toBeInTheDocument();
  });

  it('updates sort column when a column option is selected', async () => {
    const user = userEvent.setup();
    renderSortDropdown();

    await clickToggle(user);
    await user.click(screen.getByText('Name'));

    expect(mockSetSortValue).toHaveBeenCalledWith(expect.objectContaining({ sortColumn: 'name' }));
  });

  it('clears the active sort column and direction when deselected', async () => {
    const user = userEvent.setup();
    mockUseSessionStorage.mockReturnValue([
      { sortColumn: 'name', sortDirection: 'desc' },
      mockSetSortValue,
      mockRemoveSortValue,
    ]);
    renderSortDropdown();

    await clickToggle(user);
    await user.click(screen.getByText('Name'));

    expect(mockRemoveSortValue).toHaveBeenCalled();
  });

  it('updates sort direction when a direction option is selected', async () => {
    const user = userEvent.setup();
    // Start with a persisted sort state
    mockUseSessionStorage.mockReturnValue([
      { sortColumn: 'name', sortDirection: 'asc' },
      mockSetSortValue,
      mockRemoveSortValue,
    ]);
    renderSortDropdown();

    await clickToggle(user);
    await user.click(screen.getByText('Descending'));

    expect(mockSetSortValue).toHaveBeenCalledWith(
      expect.objectContaining({ sortDirection: 'desc' }),
    );
  });

  it('renders toggle button when sort is active', () => {
    mockUseSessionStorage.mockReturnValue([
      { sortColumn: 'name', sortDirection: 'asc' },
      mockSetSortValue,
      mockRemoveSortValue,
    ]);
    renderSortDropdown();

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows descending icon when sort direction is desc', () => {
    mockUseSessionStorage.mockReturnValue([
      { sortColumn: 'name', sortDirection: 'desc' },
      mockSetSortValue,
      mockRemoveSortValue,
    ]);
    renderSortDropdown();

    expect(screen.getByTestId('sort-alpha-down-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('sort-alpha-up-icon')).not.toBeInTheDocument();
  });

  it('shows ascending icon when sort direction is asc', () => {
    mockUseSessionStorage.mockReturnValue([
      { sortColumn: 'name', sortDirection: 'asc' },
      mockSetSortValue,
      mockRemoveSortValue,
    ]);
    renderSortDropdown();

    expect(screen.getByTestId('sort-alpha-up-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('sort-alpha-down-icon')).not.toBeInTheDocument();
  });

  it('shows descending icon by default when no sort direction is set', () => {
    renderSortDropdown();

    expect(screen.getByTestId('sort-alpha-down-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('sort-alpha-up-icon')).not.toBeInTheDocument();
  });
});
