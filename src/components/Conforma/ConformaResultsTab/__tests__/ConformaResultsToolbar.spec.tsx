import { fireEvent, screen } from '@testing-library/react';
import { routerRenderer } from '~/unit-test-utils/mock-react-router';
import type { GroupByMode } from '../conforma-grouping-utils';
import { ConformaResultsToolbar } from '../ConformaResultsToolbar';
import '@testing-library/jest-dom';

describe('ConformaResultsToolbar', () => {
  const onSearchChange = jest.fn();
  const onGroupByChange = jest.fn();
  const onStatusFiltersChange = jest.fn();
  const onExpandAll = jest.fn();
  const onCollapseAll = jest.fn();

  const defaultProps = {
    searchText: '',
    onSearchChange,
    groupBy: 'rule' as GroupByMode,
    onGroupByChange,
    statusFilters: [] as string[],
    onStatusFiltersChange,
    onExpandAll,
    onCollapseAll,
  };

  const renderToolbar = (props: Partial<typeof defaultProps> = {}) => {
    routerRenderer(<ConformaResultsToolbar {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the toolbar with the correct data-test attribute', () => {
    renderToolbar();

    expect(screen.getByTestId('conforma-results-toolbar')).toBeInTheDocument();
  });

  it('renders search input with placeholder text', () => {
    renderToolbar();

    const searchInput = screen.getByTestId('conforma-search-input');
    const textInput = searchInput.querySelector('.pf-v5-c-text-input-group__text-input');

    expect(textInput).toHaveAttribute('placeholder', 'Search by rule or com...');
  });

  it('calls onSearchChange when typing in search', () => {
    renderToolbar();

    const searchInput = screen.getByTestId('conforma-search-input');
    const textInput = searchInput.querySelector('.pf-v5-c-text-input-group__text-input');

    fireEvent.change(textInput, { target: { value: 'cve' } });

    expect(onSearchChange).toHaveBeenCalledWith('cve');
  });

  it('calls onSearchChange with empty string when clearing search', () => {
    renderToolbar({ searchText: 'cve' });

    const clearButton = screen.getByRole('button', { name: 'Reset' });
    fireEvent.click(clearButton);

    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  it('shows correct group-by toggle text', () => {
    renderToolbar({ groupBy: 'rule' });

    expect(screen.getByTestId('conforma-group-by-select')).toHaveTextContent('Group by: Rule');
  });

  it('shows "Status" as default status toggle text when no filters selected', () => {
    renderToolbar({ statusFilters: [] });

    expect(screen.getByTestId('conforma-status-filter')).toHaveTextContent('Status');
  });

  it('shows "Status (N)" when status filters are selected', () => {
    renderToolbar({ statusFilters: ['violations'] });

    expect(screen.getByTestId('conforma-status-filter')).toHaveTextContent('Status (1)');
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
});
