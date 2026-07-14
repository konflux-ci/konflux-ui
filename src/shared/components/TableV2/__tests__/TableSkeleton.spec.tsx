import { render, screen } from '@testing-library/react';
import { TableSkeleton } from '~/shared/components/TableV2';

describe('TableSkeleton', () => {
  it('renders correct number of columns', () => {
    render(<TableSkeleton columns={3} />);
    const headerCells = screen.getAllByRole('columnheader');
    expect(headerCells).toHaveLength(3);
  });

  it('renders correct number of rows when specified', () => {
    render(<TableSkeleton columns={2} rows={3} />);
    // body rows only (exclude header row)
    const allRows = screen.getAllByRole('row');
    // 1 header row + 3 body rows = 4
    expect(allRows).toHaveLength(4);
  });

  it('renders 5 body rows by default', () => {
    render(<TableSkeleton columns={2} />);
    const allRows = screen.getAllByRole('row');
    // 1 header row + 5 body rows = 6
    expect(allRows).toHaveLength(6);
  });

  it('has screenreader text on the first skeleton', () => {
    render(<TableSkeleton columns={3} />);
    expect(screen.getByText('Loading table')).toBeInTheDocument();
  });

  it('has data-test attribute', () => {
    render(<TableSkeleton columns={2} />);
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  });

  it('renders a PF table structure', () => {
    render(<TableSkeleton columns={2} />);
    // PF Table renders with role="grid"
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });
});
