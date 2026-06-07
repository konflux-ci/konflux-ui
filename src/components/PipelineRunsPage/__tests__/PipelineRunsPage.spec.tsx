import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { useApplications } from '~/hooks/useApplications';
import { useAllComponents } from '~/hooks/useComponents';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { useFilterState, useFilteredData } from '~/shared/components/Filter';
import { useActiveSavedView } from '~/shared/components/SavedViews';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { PipelineRunsPage } from '../PipelineRunsPage';

mockUseNamespaceHook('test-ns');

jest.mock('~/shared/components/SavedViews', () => ({
  ...jest.requireActual('~/shared/components/SavedViews'),
  useActiveSavedView: jest.fn(),
  SavedViewStar: () => <div data-test="saved-view-star" />,
}));

jest.mock('~/hooks/useApplications', () => ({
  useApplications: jest.fn(),
}));

jest.mock('~/hooks/useComponents', () => ({
  useAllComponents: jest.fn(),
}));

jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunsV2: jest.fn(),
}));

jest.mock('~/shared/components/Filter', () => ({
  ...jest.requireActual('~/shared/components/Filter'),
  useFilterState: jest.fn(),
  useFilteredData: jest.fn(),
  FilterToolbar: ({ children }: { children: React.ReactNode }) => (
    <div data-test="filter-toolbar">{children}</div>
  ),
}));

jest.mock('~/shared/components/TableV2', () => ({
  ...jest.requireActual('~/shared/components/TableV2'),
  Table: () => <div data-test="table-v2" />,
  TableContainer: ({
    children,
    loaded,
    emptyState,
    data,
    unfilteredData,
  }: {
    children: React.ReactNode;
    loaded: boolean;
    emptyState?: React.ReactNode;
    data: unknown[];
    unfilteredData: unknown[];
  }) => (
    <div data-test="table-container">
      {loaded && unfilteredData.length > 0 && data.length === 0 ? emptyState : null}
      {loaded && data.length > 0 ? children : null}
    </div>
  ),
}));

const mockUseApplications = jest.mocked(useApplications);
const mockUseAllComponents = jest.mocked(useAllComponents);
const mockUsePipelineRunsV2 = jest.mocked(usePipelineRunsV2);
const mockUseFilterState = jest.mocked(useFilterState);
const mockUseFilteredData = jest.mocked(useFilteredData);
const mockUseActiveSavedView = jest.mocked(useActiveSavedView);

const defaultFilterState = {
  filterValues: { app: [], component: [], name: '', status: [], type: [] },
  clientFilterValues: { name: '', status: [] },
  isFiltered: false,
  clearAll: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();

  mockUseActiveSavedView.mockReturnValue(undefined);
  mockUseApplications.mockReturnValue([[], true, undefined]);
  mockUseAllComponents.mockReturnValue([[], true, undefined]);
  mockUsePipelineRunsV2.mockReturnValue([
    [],
    true,
    undefined,
    jest.fn(),
    { isFetchingNextPage: false, hasNextPage: false },
  ]);
  mockUseFilterState.mockReturnValue(
    defaultFilterState as unknown as ReturnType<typeof useFilterState>,
  );
  mockUseFilteredData.mockReturnValue({ filteredData: [] });
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <PipelineRunsPage />
    </MemoryRouter>,
  );

describe('PipelineRunsPage', () => {
  it('shows spinner when applications are loading', () => {
    mockUseApplications.mockReturnValue([[], false, undefined]);
    renderPage();
    expect(screen.getByTestId('pipeline-runs-spinner')).toBeInTheDocument();
  });

  it('shows spinner when components are loading', () => {
    mockUseAllComponents.mockReturnValue([[], false, undefined]);
    renderPage();
    expect(screen.getByTestId('pipeline-runs-spinner')).toBeInTheDocument();
  });

  it('renders page title as "Pipeline Runs" by default', () => {
    renderPage();
    expect(screen.getByText('Pipeline Runs')).toBeInTheDocument();
  });

  it('renders empty state when no required filters are selected', () => {
    renderPage();
    expect(screen.getByTestId('pipeline-runs-empty-state')).toBeInTheDocument();
  });

  it('renders filter toolbar', () => {
    renderPage();
    expect(screen.getByTestId('filter-toolbar')).toBeInTheDocument();
  });

  it('renders saved view star inside toolbar', () => {
    renderPage();
    expect(screen.getByTestId('saved-view-star')).toBeInTheDocument();
  });

  it('uses saved view label as page title when active', () => {
    mockUseActiveSavedView.mockReturnValue({
      slug: 'my-view',
      label: 'My Custom View',
      searchParams: 'app=%5B%22my-app%22%5D',
      columnStateKey: 'prns-columns-my-view',
    });
    renderPage();
    expect(screen.getByText('My Custom View')).toBeInTheDocument();
  });

  it('renders table when required filters are selected', () => {
    mockUseFilterState.mockReturnValue({
      ...defaultFilterState,
      filterValues: { app: ['my-app'], component: [], name: '', status: [], type: [] },
      isFiltered: true,
    } as unknown as ReturnType<typeof useFilterState>);
    mockUseFilteredData.mockReturnValue({
      filteredData: [{ metadata: { uid: 'uid-1', name: 'plr-1', labels: {} } }] as never[],
    });
    renderPage();
    expect(screen.getByTestId('table-v2')).toBeInTheDocument();
  });

  it('renders page description', () => {
    renderPage();
    expect(
      screen.getByText('Monitor pipeline runs across applications and components.'),
    ).toBeInTheDocument();
  });
});
