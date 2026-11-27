import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table } from '~/shared/components/TableV2/Table';
import { type ColumnDefinition } from '~/shared/components/TableV2/types';

jest.mock('~/shared/hooks', () => ({
  getParentScrollableElement: jest.fn().mockReturnValue(null),
  useLayoutResizeObserver: jest.fn(),
}));

jest.mock('~/shared/components/TableV2/hooks/useVirtualization', () => ({
  useVirtualization: ({ count }: { count: number }) => ({
    virtualizer: { getTotalSize: () => count * 44, measureElement: jest.fn() },
    virtualRows: Array.from({ length: count }, (_, index) => ({
      index,
      start: index * 44,
      size: 44,
      end: (index + 1) * 44,
      key: `row-${index}`,
      lane: 0,
    })),
  }),
}));

jest.mock('~/shared/components/TableV2/hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: jest.fn(),
}));

interface TestRow {
  id: string;
  name: string;
  status: string;
}

const testData: TestRow[] = [{ id: 'row-1', name: 'Alpha', status: 'active' }];

const columns: ColumnDefinition<TestRow>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorFn: (row) => row.name,
    expandedContent: (row) => <div data-test="name-expanded">{row.name} details</div>,
  },
  {
    id: 'status',
    header: 'Status',
    accessorFn: (row) => row.status,
    expandedContent: (row) => <div data-test="status-expanded">{row.status} details</div>,
  },
];

const defaultProps = {
  data: testData,
  columns,
  getRowId: (row: TestRow) => row.id,
  'aria-label': 'Compound expansion test table',
} as const;

describe('Table compound expansion', () => {
  it('renders an expansion toggle for each column with expanded content', () => {
    render(<Table {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'active' })).toBeInTheDocument();
    expect(screen.queryByTestId('name-expanded')).not.toBeInTheDocument();
  });

  it('renders the clicked column content and collapses it when clicked again', async () => {
    const user = userEvent.setup();
    render(<Table {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(screen.getByTestId('name-expanded')).toHaveTextContent('Alpha details');

    await user.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(screen.queryByTestId('name-expanded')).not.toBeInTheDocument();
  });

  it('shows one expanded column at a time and switches to the newly clicked column', async () => {
    const user = userEvent.setup();
    render(<Table {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Alpha' }));
    await user.click(screen.getByRole('button', { name: 'active' }));

    expect(screen.queryByTestId('name-expanded')).not.toBeInTheDocument();
    expect(screen.getByTestId('status-expanded')).toHaveTextContent('active details');
  });
});
