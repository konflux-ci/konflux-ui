import { render, screen } from '@testing-library/react';
import { TableContainer } from '~/shared/components/TableV2/TableContainer';

describe('TableContainer', () => {
  const defaultProps = {
    data: [],
    unfilteredData: [],
    loaded: true,
    children: <div>Table content</div>,
  };

  it('renders skeleton when loaded is false', () => {
    render(<TableContainer {...defaultProps} loaded={false} />);
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  });

  it('renders custom skeleton when provided and loaded is false', () => {
    render(
      <TableContainer
        {...defaultProps}
        loaded={false}
        skeleton={<div data-test="custom-skeleton">Loading...</div>}
      />,
    );
    expect(screen.getByTestId('custom-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('table-skeleton')).not.toBeInTheDocument();
  });

  it('renders error message when loaded with loadError', () => {
    render(<TableContainer {...defaultProps} loadError={new Error('Something went wrong')} />);
    expect(screen.getByTestId('table-error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders noDataState when unfilteredData is empty', () => {
    render(
      <TableContainer
        {...defaultProps}
        noDataState={<div data-test="no-data">No resources found</div>}
      />,
    );
    expect(screen.getByTestId('no-data')).toBeInTheDocument();
  });

  it('renders emptyState when data is empty but unfilteredData has items', () => {
    render(
      <TableContainer
        {...defaultProps}
        unfilteredData={[{ id: '1' }]}
        emptyState={<div data-test="empty-state">No matching results</div>}
      />,
    );
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('renders children when data is present', () => {
    render(
      <TableContainer {...defaultProps} data={[{ id: '1' }]} unfilteredData={[{ id: '1' }]} />,
    );
    expect(screen.getByText('Table content')).toBeInTheDocument();
  });

  it('renders toolbar in all states', () => {
    const toolbar = <div data-test="toolbar">Toolbar</div>;

    // Loading state
    const { unmount: u1 } = render(
      <TableContainer {...defaultProps} loaded={false} toolbar={toolbar} />,
    );
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    u1();

    // Error state
    const { unmount: u2 } = render(
      <TableContainer {...defaultProps} loadError={new Error('fail')} toolbar={toolbar} />,
    );
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    u2();

    // Data state
    const { unmount: u3 } = render(
      <TableContainer
        {...defaultProps}
        data={[{ id: '1' }]}
        unfilteredData={[{ id: '1' }]}
        toolbar={toolbar}
      />,
    );
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    u3();
  });

  it('has data-test attribute on outer element', () => {
    render(<TableContainer {...defaultProps} />);
    expect(screen.getByTestId('table-container')).toBeInTheDocument();
  });
});
