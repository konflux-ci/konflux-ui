import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { FeatureFlagsStore } from '~/feature-flags/store';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { ModalProvider } from '~/shared/components/modal';
import { useVirtualization } from '~/shared/components/TableV2/hooks/useVirtualization';
import { createUseParamsMock, renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { RELEASES_LIST_COLUMN_STATE_KEY } from '../../Release/releases-table-config';
import { mockReleases } from '../__data__/mock-release-data';
import ReleasesListView from '../ReleasesListView';

jest.mock('react-i18next', () => ({ useTranslation: jest.fn(() => ({ t: (x: string) => x })) }));
jest.mock('../../../hooks/useK8sAndKarchResources', () => ({
  useK8sAndKarchResources: jest.fn(),
}));
jest.mock('~/shared/components/TableV2/hooks/useVirtualization');
const useMockReleases = useK8sAndKarchResources as jest.Mock;
const releasesWithRoutingMetadata = mockReleases.map((release) => ({
  ...release,
  metadata: {
    ...release.metadata,
    namespace: 'test-ns',
    labels: { ...release.metadata.labels, 'appstudio.openshift.io/application': 'test-app' },
  },
}));
const renderReleases = () =>
  renderWithQueryClientAndRouter(
    <ModalProvider>
      <FilterContextProvider filterParams={['name', 'release plan', 'release snapshot']}>
        <ReleasesListView />
      </FilterContextProvider>
    </ModalProvider>,
  );

jest.useFakeTimers();

mockUseNamespaceHook('test-ns');
createUseParamsMock({ applicationName: 'test-app' });

describe('ReleasesListView', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
    FeatureFlagsStore.set('column-management', true);
    useMockReleases.mockReset();
    jest.mocked(useVirtualization).mockReturnValue({
      virtualizer: { getTotalSize: () => 0, measureElement: jest.fn() } as never,
      virtualRows: releasesWithRoutingMetadata.map(
        (_, index) => ({ index, start: index * 44, size: 44 }) as never,
      ),
    });
  });

  it('renders the TableV2 loading state', () => {
    useMockReleases.mockReturnValue({ data: [], isLoading: true });
    renderReleases();
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders default sorted rows and hides pipeline columns', () => {
    useMockReleases.mockReturnValue({ data: releasesWithRoutingMetadata, isLoading: false });
    renderReleases();
    const table = screen.getByRole('grid', { name: 'Release List' });
    expect(within(table).getByRole('columnheader', { name: 'Created' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('test-release-2');
    expect(within(table).getAllByRole('row')[2]).toHaveTextContent('test-release');
    expect(
      within(table).queryByRole('columnheader', { name: 'Tenant Collector' }),
    ).not.toBeInTheDocument();
    expect(
      within(table).queryByRole('columnheader', { name: 'Tenant Pipeline' }),
    ).not.toBeInTheDocument();
    expect(
      within(table).queryByRole('columnheader', { name: 'Managed Pipeline' }),
    ).not.toBeInTheDocument();
    expect(
      within(table).queryByRole('columnheader', { name: 'Final Pipeline' }),
    ).not.toBeInTheDocument();
  });

  it.each(['clusterError', 'archiveError'])(
    'preserves available releases when %s occurs',
    (errorSource) => {
      useMockReleases.mockReturnValue({
        data: releasesWithRoutingMetadata,
        isLoading: false,
        hasError: true,
        [errorSource]: new Error('Source unavailable'),
      });
      renderReleases();
      const table = screen.getByRole('grid', { name: 'Release List' });
      expect(within(table).getByRole('link', { name: 'test-release' })).toBeInTheDocument();
      expect(within(table).getByRole('link', { name: 'test-release-2' })).toBeInTheDocument();
      expect(screen.getByText('Some releases could not be loaded')).toBeInTheDocument();
      expect(screen.getByText(/The list may be incomplete or out of date/)).toBeInTheDocument();
      expect(screen.queryByTestId('table-error')).not.toBeInTheDocument();
    },
  );

  it('renders an error when both sources fail with no available releases', () => {
    useMockReleases.mockReturnValue({
      data: [],
      isLoading: false,
      hasError: true,
      clusterError: new Error('Cluster unavailable'),
      archiveError: new Error('Archive unavailable'),
    });
    renderReleases();
    expect(screen.getByTestId('table-error')).toHaveTextContent('Unable to load releases');
    expect(screen.queryByRole('grid', { name: 'Release List' })).not.toBeInTheDocument();
    expect(screen.queryByText('Some releases could not be loaded')).not.toBeInTheDocument();
    expect(screen.queryByText('Learn more about setting up release plans')).not.toBeInTheDocument();
  });

  it('renders the filtered empty state rather than a blocking error after a source failure', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    useMockReleases.mockReturnValue({
      data: releasesWithRoutingMetadata,
      isLoading: false,
      hasError: true,
      archiveError: new Error('Archive unavailable'),
    });
    renderReleases();
    await user.type(screen.getByRole('textbox'), 'does-not-exist');
    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText('Some releases could not be loaded')).toBeInTheDocument();
    expect(screen.queryByTestId('table-error')).not.toBeInTheDocument();
  });

  it('keeps pagination available when filtering to a short list', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const fetchNextPage = jest.fn();
    useMockReleases.mockReturnValue({
      data: releasesWithRoutingMetadata,
      isLoading: false,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
    });
    renderReleases();
    await user.type(screen.getByRole('textbox'), 'test-release-2');
    const table = screen.getByRole('grid', { name: 'Release List' });
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    const loadMore = screen.getByRole('button', { name: 'Load more releases' });
    expect(loadMore).toBeEnabled();
    await user.click(loadMore);
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('disables pagination while fetching the next page', () => {
    useMockReleases.mockReturnValue({
      data: releasesWithRoutingMetadata,
      isLoading: false,
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage: jest.fn(),
    });
    renderReleases();
    expect(screen.getByRole('button', { name: /Load more releases/ })).toBeDisabled();
  });

  it('renders the no-data state', () => {
    useMockReleases.mockReturnValue({ data: [], isLoading: false });
    renderReleases();
    expect(screen.getByText('Learn more about setting up release plans')).toBeInTheDocument();
  });

  it('renders the filtered empty state', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    useMockReleases.mockReturnValue({ data: releasesWithRoutingMetadata, isLoading: false });
    renderReleases();
    await user.type(screen.getByRole('textbox'), 'does-not-exist');
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it.each([
    ['name', 'test-release-2'],
    ['Release plan', 'test-plan-2'],
    ['Release snapshot', 'test-snapshot-2'],
  ])('filters by %s', async (filter, value) => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    useMockReleases.mockReturnValue({ data: releasesWithRoutingMetadata, isLoading: false });
    renderReleases();
    if (filter !== 'name') {
      await user.click(screen.getByRole('button', { name: /name/i }));
      await user.click(screen.getByRole('option', { name: filter }));
    }
    await user.type(screen.getByRole('textbox'), value);
    const rows = within(screen.getByRole('grid', { name: 'Release List' })).getAllByRole('row');
    expect(rows).toHaveLength(2);
    const expectedColumn = filter === 'Release snapshot' ? 6 : filter === 'Release plan' ? 5 : 0;
    expect(rows[1].children[expectedColumn]).toHaveTextContent(value);
  });

  it('keeps sort control separate from column management without persisting defaults', () => {
    useMockReleases.mockReturnValue({ data: releasesWithRoutingMetadata, isLoading: false });
    renderReleases();
    expect(screen.getByTestId('sort-dropdown')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manage columns' })).toBeInTheDocument();
    // Defaults are used in memory and are persisted only after the user changes state.
    expect(localStorage.getItem(RELEASES_LIST_COLUMN_STATE_KEY)).toBeNull();
  });

  it('allows a hidden pipeline column to be enabled from column management', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    useMockReleases.mockReturnValue({ data: releasesWithRoutingMetadata, isLoading: false });
    renderReleases();

    await user.click(screen.getByRole('button', { name: 'Manage columns' }));
    const modal = screen.getByRole('dialog');
    const pipelineCheckbox = within(modal).getByRole('checkbox', { name: 'Tenant Pipeline' });
    expect(pipelineCheckbox).not.toBeChecked();

    await user.click(pipelineCheckbox);
    await user.click(within(modal).getByRole('button', { name: 'Save' }));

    expect(
      within(screen.getByRole('grid', { name: 'Release List' })).getByRole('columnheader', {
        name: 'Tenant Pipeline',
      }),
    ).toBeInTheDocument();
  });

  it('sorts rows through the toolbar dropdown and persists the selection', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    useMockReleases.mockReturnValue({ data: releasesWithRoutingMetadata, isLoading: false });
    renderReleases();
    const toggle = screen.getByTestId('sort-dropdown');
    await user.click(toggle);
    await user.click(screen.getByRole('option', { name: 'Name' }));
    await user.click(screen.getByRole('option', { name: 'Ascending' }));
    const table = screen.getByRole('grid', { name: 'Release List' });
    expect(within(table).getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    const rows = within(table).getAllByRole('row');
    expect(within(rows[1]).getByRole('link', { name: 'test-release' })).toBeInTheDocument();
    expect(within(rows[2]).getByRole('link', { name: 'test-release-2' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(RELEASES_LIST_COLUMN_STATE_KEY))).toEqual(
      expect.objectContaining({ sortColumn: 'name', sortDirection: 'asc' }),
    );
  });

  it('renders release links and action menus', () => {
    useMockReleases.mockReturnValue({ data: releasesWithRoutingMetadata, isLoading: false });
    renderReleases();
    expect(screen.getByRole('link', { name: 'test-release-2' })).toHaveAttribute(
      'href',
      '/ns/test-ns/applications/test-app/releases/test-release-2',
    );
    expect(screen.getAllByRole('button', { name: /actions/i }).length).toBeGreaterThan(0);
  });
});
