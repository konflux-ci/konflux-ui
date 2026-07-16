import { fireEvent, screen } from '@testing-library/react';
import type { ApplicationConformaResults, ConformaResultRow } from '~/types/conforma';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import { routerRenderer } from '~/unit-test-utils/mock-react-router';
import { ConformaResultsTab } from '../ConformaResultsTab';
import { useApplicationConformaResults } from '../useApplicationConformaResults';
import '@testing-library/jest-dom';

jest.mock('../useApplicationConformaResults', () => ({
  useApplicationConformaResults: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    applicationName: 'test-app',
  }),
}));

let mockFilteredData: ConformaResultRow[] = [];
let mockClientFilterValues: Record<string, unknown> = { name: '', status: [] };

jest.mock('~/shared/components/Filter', () => ({
  ...jest.requireActual('~/shared/components/Filter'),
  useFilterState: jest.fn().mockImplementation(() => ({
    filterValues: { name: '', status: [] },
    clientFilterValues: mockClientFilterValues,
    isFiltered: false,
    clearAll: jest.fn(),
  })),
  useFilteredData: jest.fn().mockImplementation((_configs, data) => ({
    filteredData: mockFilteredData.length > 0 ? mockFilteredData : data,
  })),
  FilterToolbar: ({ children }: { children: React.ReactNode }) => (
    <div data-test="filter-toolbar">{children}</div>
  ),
}));

jest.mock('~/shared/components/TableV2', () => ({
  ...jest.requireActual('~/shared/components/TableV2'),
  Table: ({ data, expanded, onExpandedChange, expandedContent }: {
    data: { groupKey: string; rows: ConformaResultRow[] }[];
    expanded: Record<string, boolean>;
    onExpandedChange: (val: Record<string, boolean>) => void;
    expandedContent: (row: { groupKey: string; rows: ConformaResultRow[] }) => React.ReactNode;
  }) => (
    <div data-test="table-v2">
      {data.map((group) => (
        <div key={group.groupKey} data-test="table-group-row">
          <span>{group.groupKey}</span>
          <button
            aria-label="Details"
            aria-expanded={!!expanded?.[group.groupKey]}
            onClick={() => {
              const next = { ...expanded, [group.groupKey]: !expanded?.[group.groupKey] };
              onExpandedChange(next);
            }}
          >
            Toggle
          </button>
          {expanded?.[group.groupKey] && expandedContent && (
            <div data-test="expanded-content">{expandedContent(group)}</div>
          )}
        </div>
      ))}
    </div>
  ),
  TableContainer: ({
    children,
    loaded,
    loadError,
    emptyState,
    noDataState,
    toolbar,
    data,
    unfilteredData,
  }: {
    children: React.ReactNode;
    loaded: boolean;
    loadError?: Error;
    emptyState?: React.ReactNode;
    noDataState?: React.ReactNode;
    toolbar?: React.ReactNode;
    data: unknown[];
    unfilteredData: unknown[];
  }) => (
    <div data-test="table-container">
      {toolbar}
      {!loaded && <div role="progressbar">Loading...</div>}
      {loaded && loadError && <div data-test="table-error">{loadError.message}</div>}
      {loaded && !loadError && unfilteredData.length === 0 && noDataState}
      {loaded && !loadError && unfilteredData.length > 0 && data.length === 0 && emptyState}
      {loaded && !loadError && data.length > 0 && children}
    </div>
  ),
}));

const mockUseApplicationConformaResults = useApplicationConformaResults as jest.Mock;

const createMockRow = (overrides: Partial<ConformaResultRow> = {}): ConformaResultRow => ({
  title: 'Test rule',
  description: 'A test rule description',
  status: CONFORMA_RESULT_STATUS.violations,
  component: 'test-component',
  msg: 'Test message',
  images: [],
  ...overrides,
});

const emptyResults: ApplicationConformaResults = {
  componentStatuses: [],
  allResults: [],
  totalComponents: 0,
  totalFailed: 0,
  loaded: true,
  settling: false,
  error: undefined,
};

const archDupeResults: ApplicationConformaResults = {
  componentStatuses: [
    {
      componentName: 'api-gateway',
      status: 'fail',
      violationCount: 3,
      warningCount: 0,
      successCount: 0,
    },
  ],
  allResults: [
    createMockRow({
      title: 'CVE rule',
      component: 'api-gateway',
      msg: 'CVE-2024-001 found',
      status: CONFORMA_RESULT_STATUS.violations,
      images: ['quay.io/test/img@sha256:aaa'],
    }),
    createMockRow({
      title: 'CVE rule',
      component: 'api-gateway',
      msg: 'CVE-2024-001 found',
      status: CONFORMA_RESULT_STATUS.violations,
      images: ['quay.io/test/img@sha256:bbb'],
    }),
    createMockRow({
      title: 'CVE rule',
      component: 'api-gateway',
      msg: 'CVE-2024-001 found',
      status: CONFORMA_RESULT_STATUS.violations,
      images: ['quay.io/test/img@sha256:ccc'],
    }),
  ],
  totalComponents: 1,
  totalFailed: 1,
  loaded: true,
  settling: false,
  error: undefined,
};

const populatedResults: ApplicationConformaResults = {
  componentStatuses: [
    {
      componentName: 'api-gateway',
      status: 'fail',
      violationCount: 2,
      warningCount: 1,
      successCount: 3,
    },
    {
      componentName: 'auth-service',
      status: 'pass',
      violationCount: 0,
      warningCount: 0,
      successCount: 5,
    },
  ],
  allResults: [
    createMockRow({
      title: 'Missing CVE scan',
      component: 'api-gateway',
      status: CONFORMA_RESULT_STATUS.violations,
    }),
    createMockRow({
      title: 'Missing CVE scan',
      component: 'api-gateway',
      status: CONFORMA_RESULT_STATUS.violations,
    }),
    createMockRow({
      title: 'Deprecated API',
      component: 'api-gateway',
      status: CONFORMA_RESULT_STATUS.warnings,
    }),
    createMockRow({
      title: 'Base image allowed',
      component: 'auth-service',
      status: CONFORMA_RESULT_STATUS.successes,
    }),
  ],
  totalComponents: 2,
  totalFailed: 1,
  loaded: true,
  settling: false,
  error: undefined,
};

describe('ConformaResultsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFilteredData = [];
    mockClientFilterValues = { name: '', status: [] };
  });

  it('shows a spinner when data is loading', () => {
    mockUseApplicationConformaResults.mockReturnValue({
      ...emptyResults,
      loaded: false,
    });

    routerRenderer(<ConformaResultsTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows an error message when there is an error', () => {
    mockUseApplicationConformaResults.mockReturnValue({
      ...emptyResults,
      loaded: true,
      error: new Error('Unable to load Conforma results'),
    });

    routerRenderer(<ConformaResultsTab />);

    expect(screen.getByText('Unable to load Conforma results')).toBeInTheDocument();
  });

  it('shows empty state when allResults is empty', () => {
    mockUseApplicationConformaResults.mockReturnValue(emptyResults);

    routerRenderer(<ConformaResultsTab />);

    expect(
      screen.getByText('No Conforma results available for this application.'),
    ).toBeInTheDocument();
  });

  it('renders summary bar and grouped table when results are populated', () => {
    mockUseApplicationConformaResults.mockReturnValue(populatedResults);

    routerRenderer(<ConformaResultsTab />);

    expect(screen.getByTestId('conforma-summary-bar')).toBeInTheDocument();
    expect(screen.getByTestId('conforma-grouped-table')).toBeInTheDocument();
  });

  it('renders the page title and description', () => {
    mockUseApplicationConformaResults.mockReturnValue(populatedResults);

    routerRenderer(<ConformaResultsTab />);

    expect(screen.getByText('Conforma results summary')).toBeInTheDocument();
    expect(
      screen.getByText(/Conforma is a set of tools for verifying the provenance/),
    ).toBeInTheDocument();
  });

  it('shows group rows matching the grouped data', () => {
    mockUseApplicationConformaResults.mockReturnValue(populatedResults);

    routerRenderer(<ConformaResultsTab />);

    expect(screen.getAllByText('Missing CVE scan').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Deprecated API').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Base image allowed').length).toBeGreaterThanOrEqual(1);
  });

  it('expands and collapses groups via Expand all / Collapse all', () => {
    mockUseApplicationConformaResults.mockReturnValue(populatedResults);

    routerRenderer(<ConformaResultsTab />);

    fireEvent.click(screen.getByTestId('conforma-expand-all'));

    const expandedButtons = screen.getAllByRole('button', { name: /details/i });
    expect(expandedButtons.some((b) => b.getAttribute('aria-expanded') === 'true')).toBe(true);

    fireEvent.click(screen.getByTestId('conforma-collapse-all'));

    const collapsedButtons = screen.getAllByRole('button', { name: /details/i });
    expect(collapsedButtons.every((b) => b.getAttribute('aria-expanded') === 'false')).toBe(true);
  });

  it('toggles individual group expansion', () => {
    mockUseApplicationConformaResults.mockReturnValue(populatedResults);

    routerRenderer(<ConformaResultsTab />);

    const toggleButtons = screen.getAllByRole('button', { name: /details/i });
    fireEvent.click(toggleButtons[0]);

    expect(toggleButtons[0]).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggleButtons[0]);

    expect(toggleButtons[0]).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders "Show multi-arch duplicates" switch unchecked by default (duplicates collapsed)', () => {
    mockUseApplicationConformaResults.mockReturnValue(archDupeResults);

    routerRenderer(<ConformaResultsTab />);

    expect(screen.getByRole('switch', { name: /show multi-arch duplicates/i })).not.toBeChecked();
  });

  it('collapses arch-duplicate rows by default and shows image name with variant count', () => {
    mockUseApplicationConformaResults.mockReturnValue(archDupeResults);

    routerRenderer(<ConformaResultsTab />);

    const toggleButtons = screen.getAllByRole('button', { name: /details/i });
    fireEvent.click(toggleButtons[0]);

    expect(screen.getByText('quay.io/test/img')).toBeInTheDocument();
    expect(screen.getByText('3 arch variants')).toBeInTheDocument();
  });

  it('shows the raw violation count alongside the collapsed count when duplicates are collapsed', () => {
    mockUseApplicationConformaResults.mockReturnValue(archDupeResults);

    routerRenderer(<ConformaResultsTab />);

    expect(screen.getByText('(3 incl. multi-arch)')).toBeInTheDocument();
  });

  it('hides the raw-count qualifier once "Show multi-arch duplicates" is enabled', () => {
    mockUseApplicationConformaResults.mockReturnValue(archDupeResults);

    routerRenderer(<ConformaResultsTab />);

    fireEvent.click(screen.getByRole('switch', { name: /show multi-arch duplicates/i }));

    expect(screen.queryByText(/incl\. multi-arch/i)).not.toBeInTheDocument();
  });

  it('shows all raw rows after enabling the show duplicates switch', () => {
    mockUseApplicationConformaResults.mockReturnValue(archDupeResults);

    routerRenderer(<ConformaResultsTab />);

    fireEvent.click(screen.getByRole('switch', { name: /show multi-arch duplicates/i }));

    const toggleButtons = screen.getAllByRole('button', { name: /details/i });
    fireEvent.click(toggleButtons[0]);

    expect(screen.queryByText(/affects.*images/i)).not.toBeInTheDocument();
    expect(screen.getByText(/sha256:aaa/)).toBeInTheDocument();
    expect(screen.getByText(/sha256:bbb/)).toBeInTheDocument();
    expect(screen.getByText(/sha256:ccc/)).toBeInTheDocument();
  });

  it('shows "no results match" when filters exclude all results', () => {
    mockUseApplicationConformaResults.mockReturnValue(populatedResults);

    const { useFilteredData } = jest.requireMock('~/shared/components/Filter');
    (useFilteredData as jest.Mock).mockReturnValue({ filteredData: [] });

    routerRenderer(<ConformaResultsTab />);

    expect(screen.getByText('No results match the current filters.')).toBeInTheDocument();
  });
});
