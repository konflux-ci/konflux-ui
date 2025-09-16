import * as React from 'react';
import { screen, waitFor, act, fireEvent } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import {
  mockReleases,
  mockNamespaces,
} from '~/components/ReleaseMonitor/__data__/mock-release-data';
import ReleaseMonitorListView from '~/components/ReleaseMonitor/ReleaseMonitorListView';
import ReleasesInNamespace from '~/components/ReleaseMonitor/ReleasesInNamespace';
import { useNamespaceInfo } from '~/shared/providers/Namespace';
import { routerRenderer } from '../../../utils/test-utils';

// Mock dependencies
jest.useFakeTimers();

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespaceInfo: jest.fn(),
}));

jest.mock('~/components/ReleaseMonitor/ReleasesInNamespace', () => {
  return jest.fn(({ namespace, onReleasesLoaded, onError }) => {
    React.useEffect(() => {
      const namespaceReleases = mockReleases.filter(
        (release) => release.metadata.namespace === namespace,
      );
      setTimeout(() => {
        onReleasesLoaded(namespaceReleases);
      }, 0);
    }, [namespace, onReleasesLoaded, onError]);

    return null;
  });
});

jest.mock('~/shared/components/table/TableComponent', () => {
  return ({ data }) => (
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
  );
});

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

const mockUseNamespaceInfo = useNamespaceInfo as jest.Mock;
const mockReleasesInNamespace = ReleasesInNamespace as jest.Mock;

const renderWithProviders = (ui: React.ReactElement) =>
  routerRenderer(
    <FilterContextProvider
      filterParams={['name', 'status', 'application', 'releasePlan', 'namespace', 'component']}
    >
      {ui}
    </FilterContextProvider>,
  );

const waitForReleasesLoaded = async () => {
  await waitFor(() => {
    mockReleases.forEach((release) => {
      expect(screen.getByText(release.metadata.name)).toBeInTheDocument();
    });
  });
};

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
  const mockNamespacesInfo = {
    namespaces: mockNamespaces,
    namespacesLoaded: true,
    lastUsedNamespace: 'namespace-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNamespaceInfo.mockReturnValue(mockNamespacesInfo);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders ReleasesInNamespace for each namespace', () => {
    renderWithProviders(<ReleaseMonitorListView />);
    expect(mockReleasesInNamespace).toHaveBeenCalledTimes(mockNamespaces.length);
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

    const option = await toggleFilter(/application filter menu/i, /test/i);

    await waitFor(() => {
      expect(screen.getByText('test-release-2')).toBeInTheDocument();
    });

    fireEvent.click(option);
    expect(option).not.toBeChecked();
  });

  it('filters releases by component', async () => {
    renderWithProviders(<ReleaseMonitorListView />);
    await waitForReleasesLoaded();

    const option = await toggleFilter(/component filter menu/i, /bar-01-component/i);

    await waitFor(() => {
      expect(screen.getByText('test-release-3')).toBeInTheDocument();
    });

    fireEvent.click(option);
    expect(option).not.toBeChecked();
  });

  it('filters releases by releasePlan', async () => {
    renderWithProviders(<ReleaseMonitorListView />);
    await waitForReleasesLoaded();

    const option = await toggleFilter(/Release Plan filter menu/i, /test-plan-3/i);

    await waitFor(() => {
      expect(screen.getByText('test-release-3')).toBeInTheDocument();
    });

    fireEvent.click(option);
    expect(option).not.toBeChecked();
  });

  it('clears filters', async () => {
    renderWithProviders(<ReleaseMonitorListView />);
    await waitFor(() => expect(screen.getByText('test-release-1')).toBeInTheDocument());

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    fireEvent.change(filter, { target: { value: 'no-release' } });
    act(() => jest.advanceTimersByTime(700));

    await waitFor(() => expect(screen.getByText('No results found')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Clear all filters'));
    await waitFor(() => expect(screen.getByText('test-release-1')).toBeInTheDocument());
  });

  it('renders empty state when no releases are found', async () => {
    mockUseNamespaceInfo.mockReturnValue({ namespaces: [], namespacesLoaded: true, lastUsedNamespace: '' });
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
});
