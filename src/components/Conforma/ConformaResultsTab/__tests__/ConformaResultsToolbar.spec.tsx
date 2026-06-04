import { fireEvent, screen } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import { routerRenderer } from '~/unit-test-utils/mock-react-router';
import type { GroupByMode } from '../conforma-grouping-utils';
import { ConformaResultsToolbar } from '../ConformaResultsToolbar';
import type { ConformaResultRow } from '../useApplicationConformaResults';
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

describe('ConformaResultsToolbar', () => {
  const onGroupByChange = jest.fn();
  const onExpandAll = jest.fn();
  const onCollapseAll = jest.fn();

  const defaultProps = {
    allResults,
    groupBy: 'rule' as GroupByMode,
    onGroupByChange,
    onExpandAll,
    onCollapseAll,
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

  it('calls onExpandAll when Expand all button is clicked', () => {
    renderToolbar();

    fireEvent.click(screen.getByTestId('conforma-expand-all'));

    expect(onExpandAll).toHaveBeenCalledTimes(1);
  });

  it('calls onCollapseAll when Collapse all button is clicked', () => {
    renderToolbar();

    fireEvent.click(screen.getByTestId('conforma-collapse-all'));

    expect(onCollapseAll).toHaveBeenCalledTimes(1);
  });

  it('renders Expand all and Collapse all buttons', () => {
    renderToolbar();

    expect(screen.getByTestId('conforma-expand-all')).toHaveTextContent('Expand all');
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
    fireEvent.click(screen.getByText('Group by: Component'));

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
});
