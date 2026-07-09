import { fireEvent, screen } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { CONFORMA_RESULT_STATUS, type ConformaResultRow } from '~/types/conforma';
import { routerRenderer } from '~/unit-test-utils/mock-react-router';
import type { GroupByMode } from '../conforma-grouping-utils';
import { ConformaResultsToolbar } from '../ConformaResultsToolbar';
import '@testing-library/jest-dom';

const mockRow = (overrides: Partial<ConformaResultRow> = {}): ConformaResultRow => ({
  title: 'Test rule',
  description: 'A test rule description',
  status: CONFORMA_RESULT_STATUS.violations,
  component: 'test-component',
  images: [],
  ...overrides,
});

const allResults: ConformaResultRow[] = [
  mockRow({ status: CONFORMA_RESULT_STATUS.violations }),
  mockRow({ status: CONFORMA_RESULT_STATUS.violations }),
  mockRow({ status: CONFORMA_RESULT_STATUS.warnings }),
  mockRow({ status: CONFORMA_RESULT_STATUS.successes }),
];

describe('ConformaResultsToolbar', () => {
  const onGroupByChange = jest.fn();
  const onToggleExpandAll = jest.fn();

  const onShowDuplicatesChange = jest.fn();

  const defaultProps = {
    allResults,
    groupBy: 'rule' as GroupByMode,
    onGroupByChange,
    allExpanded: false,
    onToggleExpandAll,
    showDuplicates: false,
    onShowDuplicatesChange,
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

  it('renders show duplicates switch as unchecked by default (duplicates are collapsed)', () => {
    renderToolbar({ showDuplicates: false });

    const switchEl = screen.getByRole('checkbox', { name: /show multi-arch duplicates/i });
    expect(switchEl).not.toBeChecked();
  });

  it('renders show duplicates switch as checked when showDuplicates is true', () => {
    renderToolbar({ showDuplicates: true });

    const switchEl = screen.getByRole('checkbox', { name: /show multi-arch duplicates/i });
    expect(switchEl).toBeChecked();
  });

  it('calls onShowDuplicatesChange with true when an unchecked switch is clicked', () => {
    renderToolbar({ showDuplicates: false, onShowDuplicatesChange });

    fireEvent.click(screen.getByRole('checkbox', { name: /show multi-arch duplicates/i }));

    expect(onShowDuplicatesChange).toHaveBeenCalledWith(true);
  });

  it('calls onShowDuplicatesChange with false when a checked switch is clicked', () => {
    renderToolbar({ showDuplicates: true, onShowDuplicatesChange });

    fireEvent.click(screen.getByRole('checkbox', { name: /show multi-arch duplicates/i }));

    expect(onShowDuplicatesChange).toHaveBeenCalledWith(false);
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

    expect(screen.getByTestId('conforma-group-by-select')).toHaveTextContent('Group by: Component');
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
    expect(screen.getByRole('button', { name: /status filter menu/i })).toBeInTheDocument();
  });

  it('opens Status filter menu when clicked', () => {
    renderToolbar();

    fireEvent.click(screen.getByRole('button', { name: /status filter menu/i }));

    expect(screen.getByText(CONFORMA_RESULT_STATUS.violations)).toBeInTheDocument();
    expect(screen.getByText(CONFORMA_RESULT_STATUS.warnings)).toBeInTheDocument();
    expect(screen.getByText(CONFORMA_RESULT_STATUS.successes)).toBeInTheDocument();
  });
});
