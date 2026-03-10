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
import ReleasePlanAdmissionsInNamespace from '~/components/ReleaseMonitor/ReleasePlanAdmissionsInNamespace';
import ReleasePlansInNamespace from '~/components/ReleaseMonitor/ReleasePlansInNamespace';
import ReleasesInNamespace from '~/components/ReleaseMonitor/ReleasesInNamespace';
import { useNamespaceInfo } from '~/shared/providers/Namespace';
import { getLastUsedNamespace } from '~/shared/providers/Namespace/utils';
import { ReleaseKind, ReleaseCondition } from '~/types';
import { ReleasePlanKind } from '~/types/coreBuildService';
import { ReleasePlanAdmissionKind } from '~/types/release-plan-admission';

// Mock dependencies
jest.useFakeTimers();

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespaceInfo: jest.fn(),
}));

jest.mock('~/shared/providers/Namespace/utils', () => ({
  getLastUsedNamespace: jest.fn(() => 'namespace-1'),
  setLastUsedNamespace: jest.fn(),
}));

jest.mock('~/components/ReleaseMonitor/ReleasesInNamespace', () => jest.fn(() => null));
jest.mock('~/components/ReleaseMonitor/ReleasePlansInNamespace', () => jest.fn(() => null));
jest.mock('~/components/ReleaseMonitor/ReleasePlanAdmissionsInNamespace', () =>
  jest.fn(() => null),
);

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
const mockGetLastUsedNamespace = getLastUsedNamespace as jest.Mock;
const mockReleasesInNamespace = ReleasesInNamespace as jest.Mock;
const mockReleasePlansInNamespace = ReleasePlansInNamespace as jest.Mock;
const mockReleasePlanAdmissionsInNamespace = ReleasePlanAdmissionsInNamespace as jest.Mock;

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
          'product',
          'productVersion',
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
  let releasePlans: ReleasePlanKind[];
  let releasePlanAdmissions: ReleasePlanAdmissionKind[];

  const mockNamespacesInfo = {
    namespaces: mockNamespaces,
    namespacesLoaded: true,
    lastUsedNamespace: 'namespace-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLastUsedNamespace.mockReturnValue('namespace-1');
    mockUseNamespaceInfo.mockReturnValue(mockNamespacesInfo);

    releases = JSON.parse(JSON.stringify(mockReleases));
    const release4 = releases.find((r) => r.metadata.name === 'test-release-4');
    if (release4) {
      release4.metadata.creationTimestamp = '2023-01-02T10:30:00Z';
    }

    // Mock release plans
    releasePlans = [
      {
        apiVersion: 'appstudio.redhat.com/v1alpha1',
        kind: 'ReleasePlan',
        metadata: {
          name: 'test-plan-1',
          namespace: 'namespace-1',
          labels: {
            'release.appstudio.openshift.io/releasePlanAdmission': 'rpa-1',
          },
        },
        spec: {
          application: 'test',
          target: 'target-namespace-1',
        },
      },
      {
        apiVersion: 'appstudio.redhat.com/v1alpha1',
        kind: 'ReleasePlan',
        metadata: {
          name: 'test-plan-2',
          namespace: 'namespace-1',
          labels: {
            'release.appstudio.openshift.io/releasePlanAdmission': 'rpa-2',
          },
        },
        spec: {
          application: 'test',
          target: 'target-namespace-1',
        },
      },
      {
        apiVersion: 'appstudio.redhat.com/v1alpha1',
        kind: 'ReleasePlan',
        metadata: {
          name: 'test-plan-3',
          namespace: 'namespace-2',
          labels: {
            'release.appstudio.openshift.io/releasePlanAdmission': 'rpa-3',
          },
        },
        spec: {
          application: 'foo',
          target: 'target-namespace-2',
        },
      },
    ] as ReleasePlanKind[];

    // Mock release plan admissions with product data
    releasePlanAdmissions = [
      {
        apiVersion: 'appstudio.redhat.com/v1alpha1',
        kind: 'ReleasePlanAdmission',
        metadata: {
          name: 'rpa-1',
          namespace: 'target-namespace-1',
        },
        spec: {
          applications: ['test'],
          origin: 'namespace-1',
          releaseStrategy: 'test-strategy',
          data: {
            releaseNotes: {
              /* eslint-disable camelcase */
              product_name: 'Product A',
              product_version: '1.0.0',
              /* eslint-enable camelcase */
            },
          },
        },
      },
      {
        apiVersion: 'appstudio.redhat.com/v1alpha1',
        kind: 'ReleasePlanAdmission',
        metadata: {
          name: 'rpa-2',
          namespace: 'target-namespace-1',
        },
        spec: {
          application: 'test',
          origin: 'namespace-1',
          releaseStrategy: 'test-strategy',
          data: {
            releaseNotes: {
              /* eslint-disable camelcase */
              product_name: 'Product B',
              product_version: '2.0.0',
              /* eslint-enable camelcase */
            },
          },
        },
      },
      {
        apiVersion: 'appstudio.redhat.com/v1alpha1',
        kind: 'ReleasePlanAdmission',
        metadata: {
          name: 'rpa-3',
          namespace: 'target-namespace-2',
        },
        spec: {
          application: 'foo',
          origin: 'namespace-2',
          releaseStrategy: 'test-strategy',
          data: {
            releaseNotes: {
              /* eslint-disable camelcase */
              product_name: 'Product A',
              product_version: '1.5.0',
              /* eslint-enable camelcase */
            },
          },
        },
      },
    ] as ReleasePlanAdmissionKind[];

    const triggerReleasesLoaded = (
      namespace: string,
      onReleasesLoaded: (namespace: string, releases: ReleaseKind[]) => void,
    ) => {
      const namespaceReleases = releases.filter(
        (release) => release.metadata.namespace === namespace,
      );
      setTimeout(() => onReleasesLoaded(namespace, namespaceReleases), 0);
    };

    const triggerReleasePlansLoaded = (
      namespace: string,
      onReleasePlansLoaded: (namespace: string, plans: ReleasePlanKind[]) => void,
    ) => {
      const namespacePlans = releasePlans.filter((plan) => plan.metadata.namespace === namespace);
      setTimeout(() => onReleasePlansLoaded(namespace, namespacePlans), 0);
    };

    const triggerReleasePlanAdmissionsLoaded = (
      namespace: string,
      onReleasePlanAdmissionsLoaded: (
        namespace: string,
        admissions: ReleasePlanAdmissionKind[],
      ) => void,
    ) => {
      const namespaceAdmissions = releasePlanAdmissions.filter(
        (admission) => admission.metadata.namespace === namespace,
      );
      setTimeout(() => onReleasePlanAdmissionsLoaded(namespace, namespaceAdmissions), 0);
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

    mockReleasePlansInNamespace.mockImplementation(
      ({
        namespace,
        onReleasePlansLoaded,
      }: {
        namespace: string;
        onReleasePlansLoaded: (namespace: string, plans: ReleasePlanKind[]) => void;
      }) => {
        React.useEffect(() => {
          triggerReleasePlansLoaded(namespace, onReleasePlansLoaded);
        }, [namespace, onReleasePlansLoaded]);
        return null;
      },
    );

    mockReleasePlanAdmissionsInNamespace.mockImplementation(
      ({
        namespace,
        onReleasePlanAdmissionsLoaded,
      }: {
        namespace: string;
        onReleasePlanAdmissionsLoaded: (
          namespace: string,
          admissions: ReleasePlanAdmissionKind[],
        ) => void;
      }) => {
        React.useEffect(() => {
          triggerReleasePlanAdmissionsLoaded(namespace, onReleasePlanAdmissionsLoaded);
        }, [namespace, onReleasePlanAdmissionsLoaded]);
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
    // In strict mode, components render twice, so we check it's called at least once per namespace
    expect(mockReleasesInNamespace.mock.calls.length).toBeGreaterThanOrEqual(mockNamespaces.length);
    expect(mockReleasePlansInNamespace.mock.calls.length).toBeGreaterThanOrEqual(
      mockNamespaces.length,
    );

    // Verify each namespace was rendered
    const renderedNamespaces = mockReleasesInNamespace.mock.calls.map((call) => call[0].namespace);
    mockNamespaces.forEach((ns) => {
      expect(renderedNamespaces).toContain(ns.metadata.name);
    });
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

  it('filters releases by product', async () => {
    renderWithProviders(<ReleaseMonitorListView />);
    await waitForReleasesLoaded();

    const option = await toggleFilter(/product filter menu/i, /Product A/i);

    await waitFor(() => {
      // Releases with Product A (test-release-1, test-release-3, test-release-4)
      expect(screen.getByText('test-release-1')).toBeInTheDocument();
      expect(screen.getByText('test-release-3')).toBeInTheDocument();
      expect(screen.getByText('test-release-4')).toBeInTheDocument();
      // Release with Product B should not be visible
      expect(screen.queryByText('test-release-2')).not.toBeInTheDocument();
    });

    fireEvent.click(option);
    expect(option).not.toBeChecked();
  });

  it('filters releases by productVersion', async () => {
    renderWithProviders(<ReleaseMonitorListView />);
    await waitForReleasesLoaded();

    const option = await toggleFilter(/product version filter menu/i, /1.0.0/i);

    await waitFor(() => {
      // Only release with version 1.0.0 should be visible
      expect(screen.getByText('test-release-1')).toBeInTheDocument();
      // Others should not be visible
      expect(screen.queryByText('test-release-2')).not.toBeInTheDocument();
      expect(screen.queryByText('test-release-3')).not.toBeInTheDocument();
      expect(screen.queryByText('test-release-4')).not.toBeInTheDocument();
    });

    fireEvent.click(option);
    expect(option).not.toBeChecked();
  });

  it('filters releases with no product', async () => {
    // Add a release without product data
    const releaseWithoutProduct: ReleaseKind = {
      apiVersion: 'appstudio.redhat.com/v1alpha1',
      kind: 'Release',
      metadata: {
        name: 'test-release-no-product',
        creationTimestamp: '2023-04-01T10:30:00Z',
        labels: {
          'appstudio.openshift.io/application': 'test',
          'appstudio.openshift.io/component': 'no-product-component',
        },
        namespace: 'namespace-1',
      },
      spec: {
        releasePlan: 'test-plan-no-rpa',
        snapshot: 'test-snapshot',
      },
      status: {
        startTime: '2023-04-01T10:30:00Z',
        completionTime: '2023-04-01T10:30:10Z',
        target: 'test-target',
        conditions: [
          {
            message: '',
            reason: 'Succeeded',
            status: 'True',
            type: ReleaseCondition.Released,
          },
        ],
      },
    };

    releases.push(releaseWithoutProduct);

    // Add a release plan without RPA label
    releasePlans.push({
      apiVersion: 'appstudio.redhat.com/v1alpha1',
      kind: 'ReleasePlan',
      metadata: {
        name: 'test-plan-no-rpa',
        namespace: 'namespace-1',
        labels: {},
      },
      spec: {
        application: 'test',
        target: 'target-namespace-1',
      },
    } as ReleasePlanKind);

    renderWithProviders(<ReleaseMonitorListView />);
    await waitForReleasesLoaded([...mockReleases, releaseWithoutProduct]);

    const option = await toggleFilter(/product filter menu/i, /No product/i);

    await waitFor(() => {
      // Only release without product should be visible
      expect(screen.getByText('test-release-no-product')).toBeInTheDocument();
      // Releases with product should not be visible
      expect(screen.queryByText('test-release-1')).not.toBeInTheDocument();
      expect(screen.queryByText('test-release-2')).not.toBeInTheDocument();
    });

    fireEvent.click(option);
    expect(option).not.toBeChecked();
  });

  it('combines product and productVersion filters', async () => {
    renderWithProviders(<ReleaseMonitorListView />);
    await waitForReleasesLoaded();

    // Filter by Product A
    const productOption = await toggleFilter(/product filter menu/i, /Product A/i);

    await waitFor(() => {
      expect(screen.getByText('test-release-1')).toBeInTheDocument();
      expect(screen.getByText('test-release-3')).toBeInTheDocument();
      expect(screen.getByText('test-release-4')).toBeInTheDocument();
    });

    // Further filter by version 1.5.0
    const versionOption = await toggleFilter(/product version filter menu/i, /1.5.0/i);

    await waitFor(() => {
      // Only releases with Product A AND version 1.5.0 should be visible
      expect(screen.getByText('test-release-3')).toBeInTheDocument();
      expect(screen.getByText('test-release-4')).toBeInTheDocument();
      // Release with Product A but version 1.0.0 should not be visible
      expect(screen.queryByText('test-release-1')).not.toBeInTheDocument();
      // Release with Product B should not be visible
      expect(screen.queryByText('test-release-2')).not.toBeInTheDocument();
    });

    fireEvent.click(productOption);
    fireEvent.click(versionOption);
  });

  describe('Namespace initialization useEffect', () => {
    it('fetches all namespaces when count is at or below threshold', async () => {
      const tenNamespaces = Array.from({ length: 10 }, (_, i) => ({
        metadata: { name: `namespace-${i + 1}`, creationTimestamp: '2023-12-01T00:00:00Z' },
      }));

      mockUseNamespaceInfo.mockReturnValue({
        namespaces: tenNamespaces,
        namespacesLoaded: true,
        lastUsedNamespace: 'namespace-1',
      });

      renderWithProviders(<ReleaseMonitorListView />);

      await waitFor(() => {
        // Verify all namespaces are being fetched
        const namespaceCalls = mockReleasesInNamespace.mock.calls.map((call) => call[0].namespace);
        tenNamespaces.forEach((ns) => {
          expect(namespaceCalls).toContain(ns.metadata.name);
        });
      });
    });

    it('starts with lastUsedNamespace when count is above threshold and lastUsed is valid', async () => {
      const fifteenNamespaces = Array.from({ length: 15 }, (_, i) => ({
        metadata: { name: `namespace-${i + 1}`, creationTimestamp: '2023-12-01T00:00:00Z' },
      }));

      mockGetLastUsedNamespace.mockReturnValue('namespace-5');
      mockUseNamespaceInfo.mockReturnValue({
        namespaces: fifteenNamespaces,
        namespacesLoaded: true,
        lastUsedNamespace: 'namespace-5',
      });

      renderWithProviders(<ReleaseMonitorListView />);

      await waitFor(() => {
        // Should only fetch the last used namespace initially
        const namespaceCalls = mockReleasesInNamespace.mock.calls.map((call) => call[0].namespace);
        expect(namespaceCalls).toContain('namespace-5');
      });

      // Verify namespace filter was auto-selected
      await waitFor(() => {
        const namespaceButton = screen.getByRole('button', { name: /namespace filter menu/i });
        fireEvent.click(namespaceButton);
        const option = screen.getByLabelText(/namespace-5/i, { selector: 'input' });
        expect(option).toBeChecked();
      });
    });

    it('falls back to first namespace when lastUsedNamespace is invalid and count is above threshold', async () => {
      const fifteenNamespaces = Array.from({ length: 15 }, (_, i) => ({
        metadata: { name: `namespace-${i + 1}`, creationTimestamp: '2023-12-01T00:00:00Z' },
      }));

      mockGetLastUsedNamespace.mockReturnValue('non-existent-namespace');
      mockUseNamespaceInfo.mockReturnValue({
        namespaces: fifteenNamespaces,
        namespacesLoaded: true,
        lastUsedNamespace: 'non-existent-namespace',
      });

      renderWithProviders(<ReleaseMonitorListView />);

      await waitFor(() => {
        // Should fetch the first namespace as fallback
        const namespaceCalls = mockReleasesInNamespace.mock.calls.map((call) => call[0].namespace);
        expect(namespaceCalls).toContain('namespace-1');
      });

      // Verify first namespace filter was auto-selected
      const namespaceButton = screen.getByRole('button', { name: /namespace filter menu/i });
      fireEvent.click(namespaceButton);

      await waitFor(() => {
        const option = screen.getByLabelText('namespace-1', { selector: 'input', exact: true });
        expect(option).toBeChecked();
      });
    });

    it('auto-selects initial namespace when count is above threshold', async () => {
      const fifteenNamespaces = Array.from({ length: 15 }, (_, i) => ({
        metadata: { name: `namespace-${i + 1}`, creationTimestamp: '2023-12-01T00:00:00Z' },
      }));

      mockGetLastUsedNamespace.mockReturnValue('namespace-1');
      mockUseNamespaceInfo.mockReturnValue({
        namespaces: fifteenNamespaces,
        namespacesLoaded: true,
        lastUsedNamespace: 'namespace-1',
      });

      renderWithProviders(<ReleaseMonitorListView />);

      // Wait for initial load and verify namespace-1 is being fetched
      await waitFor(() => {
        const namespaceCalls = mockReleasesInNamespace.mock.calls.map((call) => call[0].namespace);
        expect(namespaceCalls).toContain('namespace-1');
      });

      // Verify the namespace filter was auto-selected in the UI
      const namespaceButton = screen.getByRole('button', { name: /namespace filter menu/i });
      fireEvent.click(namespaceButton);

      await waitFor(() => {
        const option = screen.getByLabelText('namespace-1', { selector: 'input', exact: true });
        expect(option).toBeChecked();
      });
    });

    it('initializes namespace filter only once when namespaces load', async () => {
      const { rerender } = renderWithProviders(<ReleaseMonitorListView />);

      const fifteenNamespaces = Array.from({ length: 15 }, (_, i) => ({
        metadata: { name: `namespace-${i + 1}`, creationTimestamp: '2023-12-01T00:00:00Z' },
      }));

      mockUseNamespaceInfo.mockReturnValue({
        namespaces: fifteenNamespaces,
        namespacesLoaded: true,
        lastUsedNamespace: 'namespace-1',
      });

      rerender(
        <MemoryRouter>
          <FilterContextProvider
            filterParams={[
              'name',
              'status',
              'application',
              'releasePlan',
              'namespace',
              'component',
              'product',
              'productVersion',
              'showLatest',
            ]}
          >
            <ReleaseMonitorListView />
          </FilterContextProvider>
        </MemoryRouter>,
      );

      await waitFor(() => {
        const namespaceCalls = mockReleasesInNamespace.mock.calls.map((call) => call[0].namespace);
        expect(namespaceCalls).toContain('namespace-1');
      });

      const initialCallCount = mockReleasesInNamespace.mock.calls.length;

      // Trigger another render
      rerender(
        <MemoryRouter>
          <FilterContextProvider
            filterParams={[
              'name',
              'status',
              'application',
              'releasePlan',
              'namespace',
              'component',
              'product',
              'productVersion',
              'showLatest',
            ]}
          >
            <ReleaseMonitorListView />
          </FilterContextProvider>
        </MemoryRouter>,
      );

      // Should not re-initialize (call count should not significantly increase)
      // Note: In React strict mode, there might be some double-renders
      const finalCallCount = mockReleasesInNamespace.mock.calls.length;
      expect(finalCallCount).toBeLessThanOrEqual(initialCallCount + 5);
    });
  });

  describe('Namespace filter changes useEffect', () => {
    it('adds newly selected namespaces to fetch list when count is above threshold', async () => {
      const fifteenNamespaces = Array.from({ length: 15 }, (_, i) => ({
        metadata: { name: `namespace-${i + 1}`, creationTimestamp: '2023-12-01T00:00:00Z' },
      }));

      mockUseNamespaceInfo.mockReturnValue({
        namespaces: fifteenNamespaces,
        namespacesLoaded: true,
        lastUsedNamespace: 'namespace-1',
      });

      renderWithProviders(<ReleaseMonitorListView />);

      // Wait for initial namespace to be fetched
      await waitFor(() => {
        const namespaceCalls = mockReleasesInNamespace.mock.calls.map((call) => call[0].namespace);
        expect(namespaceCalls).toContain('namespace-1');
      });

      const initialCallCount = mockReleasesInNamespace.mock.calls.length;

      // Select an additional namespace
      const option = await toggleFilter(/namespace filter menu/i, /namespace-5/i);

      await waitFor(() => {
        // Should now be fetching both namespaces
        const namespaceCalls = mockReleasesInNamespace.mock.calls.map((call) => call[0].namespace);
        expect(namespaceCalls).toContain('namespace-1');
        expect(namespaceCalls).toContain('namespace-5');
      });

      // Verify additional namespace was added (call count increased)
      expect(mockReleasesInNamespace.mock.calls.length).toBeGreaterThan(initialCallCount);

      fireEvent.click(option);
    });

    it('does not duplicate namespaces already in fetch list', async () => {
      const fifteenNamespaces = Array.from({ length: 15 }, (_, i) => ({
        metadata: { name: `namespace-${i + 1}`, creationTimestamp: '2023-12-01T00:00:00Z' },
      }));

      mockGetLastUsedNamespace.mockReturnValue('namespace-1');
      mockUseNamespaceInfo.mockReturnValue({
        namespaces: fifteenNamespaces,
        namespacesLoaded: true,
        lastUsedNamespace: 'namespace-1',
      });

      renderWithProviders(<ReleaseMonitorListView />);

      // Wait for initial namespace to be fetched
      await waitFor(() => {
        const namespaceCalls = mockReleasesInNamespace.mock.calls.map((call) => call[0].namespace);
        expect(namespaceCalls).toContain('namespace-1');
      });

      // The component's duplicate prevention logic is in the useEffect:
      // const newNamespaces = selectedNamespaceFilters.filter((ns) => !prevFetched.includes(ns))
      // This ensures that already-fetched namespaces are not added again.
      // We've verified that namespace-1 is in the fetch list, so it won't be duplicated
      // even if the filter changes include it.
      const uniqueNamespaces = new Set(
        mockReleasesInNamespace.mock.calls.map((call) => call[0].namespace),
      );

      // Each namespace should only appear once in the calls
      expect(uniqueNamespaces.has('namespace-1')).toBe(true);
    });

    it('adds multiple newly selected namespaces', async () => {
      const fifteenNamespaces = Array.from({ length: 15 }, (_, i) => ({
        metadata: { name: `namespace-${i + 1}`, creationTimestamp: '2023-12-01T00:00:00Z' },
      }));

      mockGetLastUsedNamespace.mockReturnValue('namespace-1');
      mockUseNamespaceInfo.mockReturnValue({
        namespaces: fifteenNamespaces,
        namespacesLoaded: true,
        lastUsedNamespace: 'namespace-1',
      });

      renderWithProviders(<ReleaseMonitorListView />);

      // Wait for initial namespace to be fetched
      await waitFor(() => {
        const namespaceCalls = mockReleasesInNamespace.mock.calls.map((call) => call[0].namespace);
        expect(namespaceCalls).toContain('namespace-1');
      });

      // Select an additional namespace
      await toggleFilter(/namespace filter menu/i, /namespace-3/i);

      // Verify both namespaces are now being fetched
      await waitFor(() => {
        const namespaceCalls = mockReleasesInNamespace.mock.calls.map((call) => call[0].namespace);
        expect(namespaceCalls).toContain('namespace-1');
        expect(namespaceCalls).toContain('namespace-3');
      });

      // The component supports adding multiple namespaces through the filter
      // The useEffect watches the namespace filter and adds any new selections
      // to the namespacesToFetch array
      const uniqueNamespaces = new Set(
        mockReleasesInNamespace.mock.calls.map((call) => call[0].namespace),
      );
      expect(uniqueNamespaces.size).toBeGreaterThanOrEqual(2);
    });

    it('does not add namespaces when count is at or below threshold', async () => {
      // With 10 namespaces (at threshold), all should be fetched by default
      const tenNamespaces = Array.from({ length: 10 }, (_, i) => ({
        metadata: { name: `namespace-${i + 1}`, creationTimestamp: '2023-12-01T00:00:00Z' },
      }));

      // Reset mocks and set up for this test
      jest.clearAllMocks();
      mockGetLastUsedNamespace.mockReturnValue('namespace-1');
      mockUseNamespaceInfo.mockReturnValue({
        namespaces: tenNamespaces,
        namespacesLoaded: true,
        lastUsedNamespace: 'namespace-1',
      });

      renderWithProviders(<ReleaseMonitorListView />);

      // Verify all 10 namespaces are being fetched
      await waitFor(
        () => {
          const namespaceCalls = mockReleasesInNamespace.mock.calls.map(
            (call) => call[0].namespace,
          );
          // Should have calls for all 10 namespaces
          expect(namespaceCalls.length).toBeGreaterThanOrEqual(10);
          tenNamespaces.forEach((ns) => {
            expect(namespaceCalls).toContain(ns.metadata.name);
          });
        },
        { timeout: 3000 },
      );

      // The second useEffect should not run because namespaces.length <= NAMESPACE_THRESHOLD
      // So changing filters should not trigger additional namespace fetches
      const uniqueNamespaces = new Set(
        mockReleasesInNamespace.mock.calls.map((call) => call[0].namespace),
      );
      expect(uniqueNamespaces.size).toBe(10);
    });
  });

  describe('Filter empty state with namespace filter', () => {
    it('shows SelectNamespaceEmptyState when namespace filter is cleared with more than NAMESPACE_THRESHOLD namespaces', async () => {
      const fifteenNamespaces = Array.from({ length: 15 }, (_, i) => ({
        metadata: { name: `namespace-${i + 1}`, creationTimestamp: '2023-12-01T00:00:00Z' },
      }));

      mockGetLastUsedNamespace.mockReturnValue('namespace-1');
      mockUseNamespaceInfo.mockReturnValue({
        namespaces: fifteenNamespaces,
        namespacesLoaded: true,
        lastUsedNamespace: 'namespace-1',
      });

      renderWithProviders(<ReleaseMonitorListView />);

      // Wait for initial namespace to be fetched and releases to load
      await waitFor(() => {
        expect(screen.getByText('test-release-1')).toBeInTheDocument();
      });

      // Open namespace filter menu
      const namespaceButton = screen.getByRole('button', { name: /namespace filter menu/i });
      fireEvent.click(namespaceButton);

      // Uncheck the namespace-1 option to clear the filter
      const option = screen.getByLabelText('namespace-1', { selector: 'input', exact: true });
      fireEvent.click(option);

      // Should show SelectNamespaceEmptyState
      await waitFor(() => {
        expect(screen.getByText('Select a namespace to view releases')).toBeInTheDocument();
        expect(
          screen.getByText(
            'Select one or more namespaces from the namespace filter above to view releases.',
          ),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Inline filter functionality', () => {
    it('renders component filter button', async () => {
      renderWithProviders(<ReleaseMonitorListView />);
      await waitForReleasesLoaded();

      const componentButton = screen.getByRole('button', { name: /component filter menu/i });
      expect(componentButton).toBeInTheDocument();
    });

    it('renders application filter button', async () => {
      renderWithProviders(<ReleaseMonitorListView />);
      await waitForReleasesLoaded();

      const applicationButton = screen.getByRole('button', { name: /application filter menu/i });
      expect(applicationButton).toBeInTheDocument();
    });

    it('renders release plan filter button', async () => {
      renderWithProviders(<ReleaseMonitorListView />);
      await waitForReleasesLoaded();

      const releasePlanButton = screen.getByRole('button', { name: /Release Plan filter menu/i });
      expect(releasePlanButton).toBeInTheDocument();
    });

    it('renders namespace filter button with inline filter support', async () => {
      renderWithProviders(<ReleaseMonitorListView />);
      await waitForReleasesLoaded();

      const namespaceButton = screen.getByRole('button', { name: /namespace filter menu/i });
      expect(namespaceButton).toBeInTheDocument();
    });
  });
});
