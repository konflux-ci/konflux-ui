import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortDropdown } from '~/shared/components/TableV2/SortDropdown';
import { type ColumnDefinition } from '~/shared/components/TableV2/types';
import { useLocalStorage } from '~/shared/hooks/useLocalStorage';

jest.mock('~/shared/hooks/useLocalStorage');
const mockUseLocalStorage = jest.mocked(useLocalStorage);

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

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetValue = jest.fn();
    mockUseLocalStorage.mockReturnValue([undefined, mockSetValue, jest.fn()]);
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

    expect(mockSetValue).toHaveBeenCalledWith(expect.objectContaining({ sortColumn: 'name' }));
  });

  it('updates sort direction when a direction option is selected', async () => {
    const user = userEvent.setup();
    // Start with a persisted sort state
    mockUseLocalStorage.mockReturnValue([
      {
        visibleColumns: ['name', 'status', 'id'],
        columnOrder: ['name', 'status', 'id'],
        sortColumn: 'name',
        sortDirection: 'asc',
      },
      mockSetValue,
      jest.fn(),
    ]);
    renderSortDropdown();

    await clickToggle(user);
    await user.click(screen.getByText('Descending'));

    expect(mockSetValue).toHaveBeenCalledWith(expect.objectContaining({ sortDirection: 'desc' }));
  });

  it('renders toggle button when sort is active', () => {
    mockUseLocalStorage.mockReturnValue([
      {
        visibleColumns: ['name', 'status', 'id'],
        columnOrder: ['name', 'status', 'id'],
        sortColumn: 'name',
        sortDirection: 'asc',
      },
      mockSetValue,
      jest.fn(),
    ]);
    renderSortDropdown();

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
