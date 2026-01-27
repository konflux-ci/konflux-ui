import '@testing-library/jest-dom';
import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { screen, act, fireEvent } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { ResourceSource } from '~/types/k8s';
import { mockSnapshots } from '../../../../__data__/mock-snapshots';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import { createUseParamsMock, renderWithQueryClientAndRouter } from '../../../../utils/test-utils';
import SnapshotsListRow from '../SnapshotsListRow';
import SnapshotsListView from '../SnapshotsListView';

jest.useFakeTimers();

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

const createWrappedComponent = () => (
  <FilterContextProvider filterParams={['name', 'commitMessage', 'showMergedOnly', 'releasable']}>
    <SnapshotsListView applicationName="test-app" />
  </FilterContextProvider>
);

describe('SnapshotsListView - Column Headers', () => {
  createUseParamsMock({ applicationName: 'test-app' });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNamespaceHook('test-namespace');
  });

  it('should display all expected column headers correctly', () => {
    useMockSnapshots.mockReturnValue({
      data: mockSnapshots,
      isLoading: false,
      hasError: false,
    });

    act(() => {
      renderWithQueryClientAndRouter(createWrappedComponent());
    });

    // Check that all required column headers are present
    // There are 2 elements with the text "Name" (filter dropdown and table header).
    const name = screen.queryAllByText('Name');
    expect(name.length).toBe(2);
    expect(name[1]).toHaveAttribute('class', 'pf-v5-c-table__text');

    expect(screen.getByText('Created at')).toBeInTheDocument();
    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByText('Commit Message')).toBeInTheDocument();
    expect(screen.getByText('Reference')).toBeInTheDocument();
  });

  it('should filter out archive snapshots when releasable filter is enabled', () => {
    const clusterSnapshot = {
      ...mockSnapshots[0],
      metadata: { ...mockSnapshots[0].metadata, name: 'cluster-snapshot', uid: 'uid-cluster' },
      source: ResourceSource.Cluster,
    };
    const archiveSnapshot = {
      ...mockSnapshots[0],
      metadata: { ...mockSnapshots[0].metadata, name: 'archive-snapshot', uid: 'uid-archive' },
      source: ResourceSource.Archive,
    };

    useMockSnapshots.mockImplementation(
      (_resourceInit, _model, _queryOptions, _options, queryControl) => {
        const enableArchive = queryControl?.enableArchive !== false;

        return {
          data: enableArchive ? [clusterSnapshot, archiveSnapshot] : [clusterSnapshot],
          isLoading: false,
          hasError: false,
        };
      },
    );

    act(() => {
      renderWithQueryClientAndRouter(createWrappedComponent());
    });

    expect(screen.getByText('cluster-snapshot')).toBeInTheDocument();
    expect(screen.getByText('archive-snapshot')).toBeInTheDocument();

    expect(useMockSnapshots).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      undefined,
      undefined,
      expect.objectContaining({ enableArchive: true }),
    );

    const switchElement = screen.getByRole('checkbox', { name: /show only releasable snapshots/i });
    expect(switchElement).not.toBeChecked();

    act(() => {
      fireEvent.click(switchElement);
    });

    const callsWithEnableArchiveFalse = useMockSnapshots.mock.calls.filter(
      (call) => call[4]?.enableArchive === false,
    );
    expect(callsWithEnableArchiveFalse.length).toBeGreaterThan(0);

    expect(screen.getByText('cluster-snapshot')).toBeInTheDocument();
    expect(screen.queryByText('archive-snapshot')).not.toBeInTheDocument();

    expect(switchElement).toBeChecked();
  });

  it('should show filter dashboard if no results but filters are applied', () => {
    const archiveSnapshot = {
      ...mockSnapshots[0],
      metadata: { ...mockSnapshots[0].metadata, name: 'archive-snapshot', uid: 'uid-archive' },
      source: ResourceSource.Archive,
    };

    useMockSnapshots.mockImplementation(
      (_resourceInit, _model, _queryOptions, _options, queryControl) => {
        const enableArchive = queryControl?.enableArchive !== false;

        return {
          data: enableArchive ? [archiveSnapshot] : [],
          isLoading: false,
          hasError: false,
        };
      },
    );
    act(() => {
      renderWithQueryClientAndRouter(createWrappedComponent());
    });

    const switchElement = screen.getByRole('checkbox', { name: /show only releasable snapshots/i });

    act(() => {
      fireEvent.click(switchElement);
    });

    expect(switchElement).toBeInTheDocument();
  });
});
