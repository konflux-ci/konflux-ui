import { act, fireEvent, screen } from '@testing-library/react';
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
      error: new Error('fetch failed'),
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
    expect(screen.getByTestId('conforma-results-toolbar')).toBeInTheDocument();
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

    // Expand all — detail rows become visible
    fireEvent.click(screen.getByTestId('conforma-expand-all'));
    expect(screen.getAllByText('api-gateway').length).toBeGreaterThanOrEqual(1);

    // Collapse all — detail rows should no longer be visible (S3 assertion)
    fireEvent.click(screen.getByTestId('conforma-collapse-all'));
    // After collapsing, the detail sub-table rows are hidden. The only remaining
    // 'api-gateway' occurrences would be in the toolbar or summary, not in
    // expanded row content. We verify the grouped table still exists (collapsed).
    expect(screen.getByTestId('conforma-grouped-table')).toBeInTheDocument();
    expect(screen.queryAllByText('Test message').length).toBe(0);
  });

  it('toggles individual group expansion', () => {
    mockUseApplicationConformaResults.mockReturnValue(populatedResults);

    routerRenderer(<ConformaResultsTab />);

    // Click the first group expand button
    const toggleButtons = screen.getAllByRole('button', { name: /details/i });
    fireEvent.click(toggleButtons[0]);

    // After expanding, detail row content becomes visible
    expect(screen.getAllByText('api-gateway').length).toBeGreaterThanOrEqual(1);

    // Collapse it again
    fireEvent.click(toggleButtons[0]);
    // After collapse, detail sub-table content is hidden (S3 assertion)
    expect(screen.queryAllByText('Test message').length).toBe(0);
  });

  it('renders "Show multi-arch duplicates" switch unchecked by default (duplicates collapsed)', () => {
    mockUseApplicationConformaResults.mockReturnValue(archDupeResults);

    routerRenderer(<ConformaResultsTab />);

    expect(screen.getByRole('checkbox', { name: /show multi-arch duplicates/i })).not.toBeChecked();
  });

  it('collapses arch-duplicate rows by default and shows image name with variant count', () => {
    mockUseApplicationConformaResults.mockReturnValue(archDupeResults);

    routerRenderer(<ConformaResultsTab />);

    // Expand the single collapsed group
    const toggleButtons = screen.getAllByRole('button', { name: /details/i });
    fireEvent.click(toggleButtons[0]);

    expect(screen.getByText('quay.io/test/img')).toBeInTheDocument();
    expect(screen.getByText('3 arch variants')).toBeInTheDocument();
  });

  it('shows the raw violation count alongside the collapsed count when duplicates are collapsed', () => {
    mockUseApplicationConformaResults.mockReturnValue(archDupeResults);

    routerRenderer(<ConformaResultsTab />);

    // 3 arch-duplicate violations collapse into 1 row; the true count (3)
    // must still be surfaced, not silently dropped.
    expect(screen.getByText('(3 incl. multi-arch)')).toBeInTheDocument();
  });

  it('hides the raw-count qualifier once "Show multi-arch duplicates" is enabled', () => {
    mockUseApplicationConformaResults.mockReturnValue(archDupeResults);

    routerRenderer(<ConformaResultsTab />);

    fireEvent.click(screen.getByRole('checkbox', { name: /show multi-arch duplicates/i }));

    // Once duplicates are shown individually, the displayed count already
    // matches the raw count, so the qualifier is no longer needed.
    expect(screen.queryByText(/incl\. multi-arch/i)).not.toBeInTheDocument();
  });

  it('shows all raw rows after enabling the show duplicates switch', () => {
    mockUseApplicationConformaResults.mockReturnValue(archDupeResults);

    routerRenderer(<ConformaResultsTab />);

    // Turn on the show duplicates switch
    fireEvent.click(screen.getByRole('checkbox', { name: /show multi-arch duplicates/i }));

    // Expand the group — now all 3 raw rows are visible
    const toggleButtons = screen.getAllByRole('button', { name: /details/i });
    fireEvent.click(toggleButtons[0]);

    expect(screen.queryByText(/affects.*images/i)).not.toBeInTheDocument();
    // All 3 image digests appear individually
    expect(screen.getByText(/sha256:aaa/)).toBeInTheDocument();
    expect(screen.getByText(/sha256:bbb/)).toBeInTheDocument();
    expect(screen.getByText(/sha256:ccc/)).toBeInTheDocument();
  });

  it('shows "no results match" when filters exclude all results', () => {
    jest.useFakeTimers();
    mockUseApplicationConformaResults.mockReturnValue(populatedResults);

    routerRenderer(<ConformaResultsTab />);

    // S4: Use getByRole('textbox') instead of PF internal class selectors
    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'zzz-no-match-zzz' } });

    // Advance the debounce timer used by BaseTextFilterToolbar
    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(
      screen.getByText('No results match the current filters.'),
    ).toBeInTheDocument();

    jest.useRealTimers();
  });
});
