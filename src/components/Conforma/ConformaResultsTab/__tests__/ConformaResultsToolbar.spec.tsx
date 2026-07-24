import { fireEvent, screen } from '@testing-library/react';
import { routerRenderer } from '~/unit-test-utils/mock-react-router';
import type { GroupByMode } from '../conforma-grouping-utils';
import { STATUS_FILTER_OPTIONS } from '../conforma-table-config';
import { ConformaResultsToolbar } from '../ConformaResultsToolbar';
import '@testing-library/jest-dom';

describe('ConformaResultsToolbar', () => {
  const onGroupByChange = jest.fn();
  const onToggleExpandAll = jest.fn();
  const onShowDuplicatesChange = jest.fn();

  const defaultProps = {
    statusOptions: STATUS_FILTER_OPTIONS,
    groupBy: 'rule' as GroupByMode,
    onGroupByChange,
    allExpanded: false,
    onToggleExpandAll,
    showDuplicates: false,
    onShowDuplicatesChange,
  };

  const renderToolbar = (props: Partial<typeof defaultProps> = {}) => {
    routerRenderer(<ConformaResultsToolbar {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders show duplicates switch as unchecked by default (duplicates are collapsed)', () => {
    renderToolbar({ showDuplicates: false });

    const switchEl = screen.getByRole('switch', { name: /show multi-arch duplicates/i });
    expect(switchEl).not.toBeChecked();
  });

  it('renders show duplicates switch as checked when showDuplicates is true', () => {
    renderToolbar({ showDuplicates: true });

    const switchEl = screen.getByRole('switch', { name: /show multi-arch duplicates/i });
    expect(switchEl).toBeChecked();
  });

  it('calls onShowDuplicatesChange with true when an unchecked switch is clicked', () => {
    renderToolbar({ showDuplicates: false, onShowDuplicatesChange });

    fireEvent.click(screen.getByRole('switch', { name: /show multi-arch duplicates/i }));

    expect(onShowDuplicatesChange).toHaveBeenCalledWith(true);
  });

  it('calls onShowDuplicatesChange with false when a checked switch is clicked', () => {
    renderToolbar({ showDuplicates: true, onShowDuplicatesChange });

    fireEvent.click(screen.getByRole('switch', { name: /show multi-arch duplicates/i }));

    expect(onShowDuplicatesChange).toHaveBeenCalledWith(false);
  });

  it('renders the toolbar with the correct data-test attribute', () => {
    renderToolbar();

    expect(screen.getByTestId('conforma-results-toolbar')).toBeInTheDocument();
  });

  it('renders search input with proper placeholder text', () => {
    renderToolbar();

    const textInput = screen.getByRole('textbox', { name: /rule or component/i });
    expect(textInput).toHaveAttribute('placeholder', 'Filter by Rule or component...');
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
    fireEvent.click(screen.getByRole('option', { name: 'Component' }));

    expect(onGroupByChange).toHaveBeenCalledWith('component');
  });

  it('renders Status filter toggle', () => {
    renderToolbar();

    expect(screen.getByTestId('multi-select-filter-status')).toBeInTheDocument();
  });

  it('opens Status filter menu when clicked', () => {
    renderToolbar();

    fireEvent.click(screen.getByTestId('multi-select-filter-status'));

    expect(screen.getByText('Violations')).toBeInTheDocument();
    expect(screen.getByText('Warnings')).toBeInTheDocument();
    expect(screen.getByText('Successes')).toBeInTheDocument();
  });
});
