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
import { ReleaseKind, ReleaseCondition } from '~/types';
import { ReleasePlanKind } from '~/types/coreBuildService';
import { ReleasePlanAdmissionKind } from '~/types/release-plan-admission';

// Mock dependencies
jest.useFakeTimers();

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespaceInfo: jest.fn(),
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
});
