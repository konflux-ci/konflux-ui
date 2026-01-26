import '@testing-library/jest-dom';
import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { act, fireEvent, screen } from '@testing-library/react';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { createUseParamsMock, renderWithQueryClientAndRouter } from '~/utils/test-utils';
import { mockSnapshots } from '../../../../__data__/mock-snapshots';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import SnapshotsListRow from '../SnapshotsListRow';
import { SnapshotsListViewTab } from '../SnapshotsTab';

jest.useFakeTimers();

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

jest.mock('../../../../shared/components/table', () => {
  const actual = jest.requireActual('../../../../shared/components/table');
  return {
    ...actual,
    Table: (props) => {
      const { data, filters, selected, match, kindObj } = props;
      const cProps = { data, filters, selected, match, kindObj };
      const columns = props.Header(cProps);
      return (
        <PfTable role="table" aria-label="table" cells={columns} variant="compact" borders={false}>
          <TableHeader role="rowgroup" />
          <tbody>
            {props.data.map((obj, i) => (
              <tr key={i}>
                <SnapshotsListRow obj={obj} columns={null} customData={props.customData} />
              </tr>
            ))}
          </tbody>
        </PfTable>
      );
    },
  };
});

const useMockSnapshots = useK8sAndKarchResources as jest.Mock;

describe('SnapshotsListViewTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNamespaceHook('test-namespace');
    useMockSnapshots.mockReturnValue({
      data: mockSnapshots,
      isLoading: false,
      clusterError: undefined,
      archiveError: undefined,
      hasError: false,
    });
  });

  it('should display the filtered empty state when no results match the filter', () => {
    createUseParamsMock({ applicationName: 'test-app' });

    renderWithQueryClientAndRouter(<SnapshotsListViewTab />);

    // Verify the snapshot data is displayed initially
    expect(screen.getByText('my-app-snapshot-1')).toBeInTheDocument();

    // Filter by name
    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
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

  it('should display the snapshot data when the filter matches a snapshot', () => {
    createUseParamsMock({ applicationName: 'test-app' });

    renderWithQueryClientAndRouter(<SnapshotsListViewTab />);

    // Filter by name
    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
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

  it('should allow filtering by commit message', () => {
    createUseParamsMock({ applicationName: 'test-app' });

    renderWithQueryClientAndRouter(<SnapshotsListViewTab />);

    fireEvent.click(screen.getAllByRole('button')[0], { name: 'Name' });
    fireEvent.click(screen.getByRole('option', { name: 'Commit message' }));
    act(() => {
      fireEvent.input(screen.getByRole('textbox'), { target: { value: 'Add new feature' } });
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(2);
    expect(rows[1]).toHaveTextContent('my-app-snapshot-1');
  });

  it('should display the filtered empty state when no results match the filter', () => {
    createUseParamsMock({ applicationName: 'test-app' });

    renderWithQueryClientAndRouter(<SnapshotsListViewTab />);

    fireEvent.click(screen.getAllByRole('button')[0], { name: 'Name' });
    fireEvent.click(screen.getByRole('option', { name: 'Commit message' }));
    act(() => {
      fireEvent.input(screen.getByRole('textbox'), { target: { value: 'Invalid commit message' } });
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    expect(
      screen.getByText('No results match this filter criteria. Clear all filters and try again.'),
    ).toBeInTheDocument();
  });
});
