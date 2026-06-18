import { fireEvent, screen } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import {
  CONFORMA_RESULT_STATUS,
  type ConformaRefreshState,
  type ConformaResultRow,
} from '~/types/conforma';
import { routerRenderer } from '~/unit-test-utils/mock-react-router';
import type { GroupByMode } from '../conforma-grouping-utils';
import { ConformaResultsToolbar } from '../ConformaResultsToolbar';
import '@testing-library/jest-dom';

const mockRow = (overrides: Partial<ConformaResultRow> = {}): ConformaResultRow => ({
  title: 'Test rule',
  description: 'A test rule description',
  status: CONFORMA_RESULT_STATUS.violations,
  component: 'test-component',
  ...overrides,
});

const allResults: ConformaResultRow[] = [
  mockRow({ status: CONFORMA_RESULT_STATUS.violations }),
  mockRow({ status: CONFORMA_RESULT_STATUS.violations }),
  mockRow({ status: CONFORMA_RESULT_STATUS.warnings }),
  mockRow({ status: CONFORMA_RESULT_STATUS.successes }),
];

const makeRefresh = (overrides: Partial<ConformaRefreshState> = {}): ConformaRefreshState => ({
  lastFetchedAt: 0,
  isRefreshing: false,
  hasLiveUpdatesPaused: false,
  onRefresh: jest.fn(),
  ...overrides,
});

describe('ConformaResultsToolbar', () => {
  const onGroupByChange = jest.fn();
  const onToggleExpandAll = jest.fn();

  const defaultProps = {
    allResults,
    groupBy: 'rule' as GroupByMode,
    onGroupByChange,
    allExpanded: false,
    onToggleExpandAll,
    refresh: makeRefresh(),
  };

  const renderToolbar = (props: Partial<typeof defaultProps> = {}) => {
    routerRenderer(
      <FilterContextProvider filterParams={['name', 'status']}>
        <ConformaResultsToolbar {...defaultProps} {...props} />
      </FilterContextProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the toolbar with the correct data-test attribute', () => {
    renderToolbar();

    expect(screen.getByTestId('conforma-results-toolbar')).toBeInTheDocument();
  });

  it('renders search input with proper placeholder text', () => {
    renderToolbar();

    // S4: Use role-based query instead of PF internal DOM class selectors
    const textInput = screen.getByRole('textbox');
    expect(textInput).toHaveAttribute('placeholder', 'Filter by rule...');
  });

  it('calls onToggleExpandAll when Expand all button is clicked', () => {
    renderToolbar();

    fireEvent.click(screen.getByTestId('conforma-expand-all'));

    expect(onToggleExpandAll).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleExpandAll when Collapse all button is clicked', () => {
    renderToolbar({ allExpanded: true });

    fireEvent.click(screen.getByTestId('conforma-collapse-all'));

    expect(onToggleExpandAll).toHaveBeenCalledTimes(1);
  });

  it('renders Expand all when not all expanded', () => {
    renderToolbar({ allExpanded: false });

    expect(screen.getByTestId('conforma-expand-all')).toHaveTextContent('Expand all');
  });

  it('renders Collapse all when all expanded', () => {
    renderToolbar({ allExpanded: true });

    expect(screen.getByTestId('conforma-collapse-all')).toHaveTextContent('Collapse all');
  });

  it('shows correct group-by toggle text for "rule"', () => {
    renderToolbar({ groupBy: 'rule' });

    expect(screen.getByTestId('conforma-group-by-select')).toHaveTextContent('Group by: Rule');
  });

  it('shows correct group-by toggle text for "component"', () => {
    renderToolbar({ groupBy: 'component' });

    expect(screen.getByTestId('conforma-group-by-select')).toHaveTextContent(
      'Group by: Component',
    );
  });

  it('calls onGroupByChange when a group-by option is selected', () => {
    renderToolbar();

    fireEvent.click(screen.getByTestId('conforma-group-by-select'));
    fireEvent.click(screen.getByText('Component'));

    expect(onGroupByChange).toHaveBeenCalledWith('component');
  });

  it('renders Status filter toggle', () => {
    renderToolbar();

    // MultiSelect renders with aria-label "{label} filter menu"
    expect(
      screen.getByRole('button', { name: /status filter menu/i }),
    ).toBeInTheDocument();
  });

  it('opens Status filter menu when clicked', () => {
    renderToolbar();

    fireEvent.click(screen.getByRole('button', { name: /status filter menu/i }));

    expect(screen.getByText(CONFORMA_RESULT_STATUS.violations)).toBeInTheDocument();
    expect(screen.getByText(CONFORMA_RESULT_STATUS.warnings)).toBeInTheDocument();
    expect(screen.getByText(CONFORMA_RESULT_STATUS.successes)).toBeInTheDocument();
  });

  it('renders the refresh button', () => {
    renderToolbar();

    expect(screen.getByTestId('conforma-refresh-button')).toBeInTheDocument();
  });

  it('calls onRefresh when the refresh button is clicked', () => {
    const onRefresh = jest.fn();
    renderToolbar({ refresh: makeRefresh({ onRefresh }) });

    fireEvent.click(screen.getByTestId('conforma-refresh-button'));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('disables the refresh button when isRefreshing is true', () => {
    renderToolbar({ refresh: makeRefresh({ isRefreshing: true }) });

    expect(screen.getByTestId('conforma-refresh-button')).toBeDisabled();
  });

  it('shows a spinner when isRefreshing is true', () => {
    renderToolbar({ refresh: makeRefresh({ isRefreshing: true }) });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('does not show a spinner when isRefreshing is false', () => {
    renderToolbar({ refresh: makeRefresh({ isRefreshing: false }) });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows "last checked" text when lastFetchedAt is non-zero', () => {
    // A timestamp far enough in the past to produce a non-empty fromNow string.
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    renderToolbar({ refresh: makeRefresh({ lastFetchedAt: twoMinutesAgo }) });

    expect(screen.getByTestId('conforma-last-checked')).toBeInTheDocument();
    expect(screen.getByTestId('conforma-last-checked').textContent).toContain('Last checked:');
  });

  it('does not show "last checked" text when lastFetchedAt is 0', () => {
    renderToolbar({ refresh: makeRefresh({ lastFetchedAt: 0 }) });

    expect(screen.queryByTestId('conforma-last-checked')).not.toBeInTheDocument();
  });

  it('shows the "Live updates paused" label when hasLiveUpdatesPaused is true', () => {
    renderToolbar({ refresh: makeRefresh({ hasLiveUpdatesPaused: true }) });

    expect(screen.getByTestId('conforma-live-updates-paused')).toBeInTheDocument();
    expect(screen.getByTestId('conforma-live-updates-paused')).toHaveTextContent(
      'Live updates paused',
    );
  });

  it('does not show "Live updates paused" label when hasLiveUpdatesPaused is false', () => {
    renderToolbar({ refresh: makeRefresh({ hasLiveUpdatesPaused: false }) });

    expect(screen.queryByTestId('conforma-live-updates-paused')).not.toBeInTheDocument();
  });
});
