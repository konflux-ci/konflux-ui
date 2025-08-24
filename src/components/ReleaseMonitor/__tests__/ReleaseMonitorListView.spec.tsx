import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useNamespaceInfo } from '../../../shared/providers/Namespace';
import { mockReleases, mockNamespaces } from '../__data__/mock-release-data';
import ReleaseMonitorListView from '../ReleaseMonitorListView';
import ReleasesInNamespace from '../ReleasesInNamespace';

// Mock dependencies
jest.useFakeTimers();

// Mock useNamespaceInfo
jest.mock('../../../shared/providers/Namespace', () => ({
  useNamespaceInfo: jest.fn(),
}));

// Mock ReleasesInNamespace
jest.mock('../ReleasesInNamespace', () => {
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

// Mock table component

jest.mock('../../../shared/components/table/TableComponent', () => {
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

// Mock other dependencies
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('../../../utils/commits-utils', () => ({
  statuses: ['Succeeded', 'Failed', 'Progressing'],
}));

//jest.mock('../ReleaseListHeader', () => {
//  return jest.fn(() => <div data-test="release-list-header">Release List Header</div>);
//});

jest.mock('../ReleaseEmptyState', () => {
  return jest.fn(() => <div data-test="release-empty-state">No releases found</div>);
});

jest.mock('../../../shared/components/empty-state/ErrorEmptyState', () => {
  return jest.fn(({ httpError }) => (
    <div data-test="error-empty-state">Error: {httpError?.message}</div>
  ));
});

jest.mock('../../../shared/components/empty-state/FilteredEmptyState', () => {
  return jest.fn(({ onClearFilters }) => (
    <div data-test="filtered-empty-state">
      No matching releases
      <button onClick={onClearFilters}>Clear filters</button>
    </div>
  ));
});

// Type casts for mocked functions
const mockUseNamespaceInfo = useNamespaceInfo as jest.Mock;
const mockReleasesInNamespace = ReleasesInNamespace as jest.Mock;

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    <FilterContextProvider
      filterParams={['name', 'status', 'application', 'releasePlan', 'namespace', 'component']}
    >
      {children}
    </FilterContextProvider>
  </MemoryRouter>
);

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

  it('should render loading state when namespaces are not loaded', () => {
    mockUseNamespaceInfo.mockReturnValue({
      ...mockNamespacesInfo,
      namespacesLoaded: false,
    });

    render(
      <TestWrapper>
        <ReleaseMonitorListView />
      </TestWrapper>,
    );

    expect(screen.getByTestId('data-table-skeleton')).toBeVisible();
  });

  it('should render ReleasesInNamespace for each namespace', async () => {
    render(
      <TestWrapper>
        <ReleaseMonitorListView />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(mockReleasesInNamespace).toHaveBeenCalledTimes(mockNamespaces.length);
    });
  });

  it('should display releases when loaded and can filter releases by name', async () => {
    const r = render(
      <TestWrapper>
        <ReleaseMonitorListView />
      </TestWrapper>,
    );

    await waitFor(() => {
      mockReleases.forEach((release) => {
        expect(screen.getByText(release.metadata.name)).toBeInTheDocument();
      });
    });

    screen.queryByText('Release Name');
    screen.queryByText('Completion Time');
    screen.queryAllByText('Status');
    screen.queryByText('Component');
    screen.queryByText('Namespace');
    screen.queryByText('Application');
    screen.queryByText('Release Plan');

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');

    fireEvent.change(filter, {
      target: { value: 'test-release-2' },
    });
    expect(filter.value).toBe('test-release-2');

    act(() => {
      jest.advanceTimersByTime(700);
    });

    r.rerender(
      <TestWrapper>
        <ReleaseMonitorListView />
      </TestWrapper>,
    );
    await waitFor(() => {
      expect(screen.queryByText('test-release-1')).not.toBeInTheDocument();
      expect(screen.queryByText('test-release-2')).toBeInTheDocument();
      expect(screen.queryByText('test-release-3')).not.toBeInTheDocument();
    });

    fireEvent.change(filter, {
      target: { value: '' },
    });

    expect(filter.value).toBe('');

    act(() => {
      jest.advanceTimersByTime(700);
    });
  });

  it('can filter releases by status', async () => {
    const r = render(
      <TestWrapper>
        <ReleaseMonitorListView />
      </TestWrapper>,
    );

    await waitFor(() => {
      mockReleases.forEach((release) => {
        expect(screen.getByText(release.metadata.name)).toBeInTheDocument();
      });
    });

    const statusFilter = screen.getByRole('button', {
      name: /status filter menu/i,
    });

    fireEvent.click(statusFilter);
    expect(statusFilter).toHaveAttribute('aria-expanded', 'true');

    const succeededOption = r.getByLabelText(/succeeded/i, {
      selector: 'input',
    });

    await act(() => fireEvent.click(succeededOption));

    await waitFor(() => {
      expect(succeededOption).toBeChecked();
    });

    await waitFor(() => {
      expect(screen.getByText('test-release-2')).toBeInTheDocument();
      expect(screen.queryByText('test-release-1')).not.toBeInTheDocument();
      expect(screen.queryByText('test-release-3')).not.toBeInTheDocument();
    });

    // clean up for other tests
    expect(statusFilter).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(succeededOption);
    expect(succeededOption).not.toBeChecked();
  });

  it('can filter releases by namespace', async () => {
    const r = render(
      <TestWrapper>
        <ReleaseMonitorListView />
      </TestWrapper>,
    );

    await waitFor(() => {
      mockReleases.forEach((release) => {
        expect(screen.getByText(release.metadata.name)).toBeInTheDocument();
      });
    });

    const namespaceFilter = screen.getByRole('button', {
      name: /namespace filter menu/i,
    });

    fireEvent.click(namespaceFilter);
    expect(namespaceFilter).toHaveAttribute('aria-expanded', 'true');

    const namespaceOption = r.getByLabelText(/namespace-1/i, {
      selector: 'input',
    });

    await act(() => fireEvent.click(namespaceOption));

    await waitFor(() => {
      expect(namespaceOption).toBeChecked();
    });

    await waitFor(() => {
      expect(screen.getByText('test-release-1')).toBeInTheDocument();
      expect(screen.queryByText('test-release-2')).toBeInTheDocument();
      expect(screen.queryByText('test-release-3')).not.toBeInTheDocument();
    });

    // clean up for other tests
    expect(namespaceFilter).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(namespaceOption);
    expect(namespaceOption).not.toBeChecked();
  });

  it('can filter releases by application', async () => {
    const r = render(
      <TestWrapper>
        <ReleaseMonitorListView />
      </TestWrapper>,
    );

    await waitFor(() => {
      mockReleases.forEach((release) => {
        expect(screen.getByText(release.metadata.name)).toBeInTheDocument();
      });
    });

    const applicationFilter = screen.getByRole('button', {
      name: /application filter menu/i,
    });

    fireEvent.click(applicationFilter);
    expect(applicationFilter).toHaveAttribute('aria-expanded', 'true');

    const applicationOption = r.getByLabelText(/test/i, {
      selector: 'input',
    });

    await act(() => fireEvent.click(applicationOption));

    await waitFor(() => {
      expect(applicationOption).toBeChecked();
    });

    await waitFor(() => {
      expect(screen.getByText('test-release-2')).toBeInTheDocument();
      expect(screen.queryByText('test-release-1')).not.toBeInTheDocument();
      expect(screen.queryByText('test-release-3')).not.toBeInTheDocument();
    });

    // clean up for other tests
    expect(applicationFilter).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(applicationOption);
    expect(applicationOption).not.toBeChecked();
  });

  it('can filter releases by component', async () => {
    const r = render(
      <TestWrapper>
        <ReleaseMonitorListView />
      </TestWrapper>,
    );

    await waitFor(() => {
      mockReleases.forEach((release) => {
        expect(screen.getByText(release.metadata.name)).toBeInTheDocument();
      });
    });

    const componentFilter = screen.getByRole('button', {
      name: /component filter menu/i,
    });

    fireEvent.click(componentFilter);
    expect(componentFilter).toHaveAttribute('aria-expanded', 'true');

    const componentOption = r.getByLabelText(/bar-01-component/i, {
      selector: 'input',
    });

    await act(() => fireEvent.click(componentOption));

    await waitFor(() => {
      expect(componentOption).toBeChecked();
    });

    await waitFor(() => {
      expect(screen.getByText('test-release-3')).toBeInTheDocument();
      expect(screen.queryByText('test-release-1')).not.toBeInTheDocument();
      expect(screen.queryByText('test-release-2')).not.toBeInTheDocument();
    });

    // clean up for other tests
    expect(componentFilter).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(componentOption);
    expect(componentOption).not.toBeChecked();
  });

  it('can filter releases by releasePlan', async () => {
    const r = render(
      <TestWrapper>
        <ReleaseMonitorListView />
      </TestWrapper>,
    );

    await waitFor(() => {
      mockReleases.forEach((release) => {
        expect(screen.getByText(release.metadata.name)).toBeInTheDocument();
      });
    });

    const releasePlanFilter = screen.getByRole('button', {
      name: /Release Plan filter menu/i,
    });

    fireEvent.click(releasePlanFilter);
    expect(releasePlanFilter).toHaveAttribute('aria-expanded', 'true');

    const releasePlanOption = r.getByLabelText(/test-plan-3/i, {
      selector: 'input',
    });

    await act(() => fireEvent.click(releasePlanOption));

    await waitFor(() => {
      expect(releasePlanOption).toBeChecked();
    });

    await waitFor(() => {
      expect(screen.getByText('test-release-3')).toBeInTheDocument();
      expect(screen.queryByText('test-release-1')).not.toBeInTheDocument();
      expect(screen.queryByText('test-release-2')).not.toBeInTheDocument();
    });

    // clean up for other tests
    expect(releasePlanFilter).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(releasePlanOption);
    expect(releasePlanOption).not.toBeChecked();
  });

  it('should clear filters', async () => {
    const r = render(
      <TestWrapper>
        <ReleaseMonitorListView />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('test-release-1')).toBeInTheDocument();
    });

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');

    fireEvent.change(filter, {
      target: { value: 'no-release' },
    });
    expect(filter.value).toBe('no-release');

    act(() => {
      jest.advanceTimersByTime(700);
    });

    r.rerender(
      <TestWrapper>
        <ReleaseMonitorListView />
      </TestWrapper>,
    );
    await waitFor(() => {
      expect(screen.queryByText('test-release-1')).not.toBeInTheDocument();
      expect(screen.queryByText('test-release-3')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('filtered-empty-state')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Clear filters');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText('test-release-1')).toBeInTheDocument();
    });
  });

  it('should display empty state when no releases are found', async () => {
    mockUseNamespaceInfo.mockReturnValue({
      namespaces: [],
      namespacesLoaded: true,
      lastUsedNamespace: '',
    });

    render(
      <TestWrapper>
        <ReleaseMonitorListView />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('release-empty-state')).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    mockReleasesInNamespace.mockImplementation(({ onError }) => {
      React.useEffect(() => {
        const handleError = () => {
          onError(new Error('Failed to load releases'));
        };
        setTimeout(handleError, 0);
      }, [onError]);

      return null;
    });

    render(
      <TestWrapper>
        <ReleaseMonitorListView />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-empty-state')).toBeInTheDocument();
    });
  });
});
