import { Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MENU_DIVIDER, MultiSelect } from '../MultiSelect';

const renderMultiSelect = (props: React.ComponentProps<typeof MultiSelect>) =>
  render(
    <Toolbar>
      <ToolbarContent>
        <ToolbarItem>
          <MultiSelect {...props} />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>,
  );

const defaultOptions = [{ key: 'main' }, { key: 'release-1.0' }];

describe('MultiSelect', () => {
  const mockSetValues = jest.fn();
  const defaultProps = {
    label: 'Version',
    filterKey: 'version',
    values: [] as string[],
    setValues: jest.fn(),
    options: defaultOptions,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render options with raw keys when labels are not provided', async () => {
    const user = userEvent.setup();

    renderMultiSelect(defaultProps);

    await user.click(screen.getByRole('button', { name: 'Version filter menu' }));

    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('release-1.0')).toBeInTheDocument();
  });

  it('should render display labels from options instead of raw keys', async () => {
    const user = userEvent.setup();
    const options = [
      { key: 'main', label: 'Main Branch' },
      { key: 'release-1.0', label: 'Release 1.0' },
    ];

    renderMultiSelect({ ...defaultProps, options });

    await user.click(screen.getByRole('button', { name: 'Version filter menu' }));

    expect(screen.getByText('Main Branch')).toBeInTheDocument();
    expect(screen.getByText('Release 1.0')).toBeInTheDocument();
  });

  it('should use custom placeholder, toggle aria label, and start expanded when configured', async () => {
    const user = userEvent.setup();

    renderMultiSelect({
      ...defaultProps,
      placeholderText: 'Pick a version',
      toggleAriaLabel: 'Custom version filter',
      defaultExpanded: true,
    });

    const toggle = screen.getByRole('button', { name: 'Custom version filter' });
    expect(toggle).toHaveTextContent('Pick a version');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('should show chip labels using option label mapping', () => {
    const options = [
      { key: 'main', label: 'Main Branch' },
      { key: 'release-1.0', label: 'Release 1.0' },
    ];

    renderMultiSelect({ ...defaultProps, values: ['main'], options });

    expect(screen.getByText('Main Branch')).toBeInTheDocument();
  });

  it('should show badge with selected count when values are selected', () => {
    renderMultiSelect({ ...defaultProps, values: ['main', 'release-1.0'] });

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should remove the correct key when a chip with a mapped label is deleted', async () => {
    const setValues = jest.fn();
    const user = userEvent.setup();
    const options = [
      { key: 'main', label: 'Main Branch' },
      { key: 'release-1.0', label: 'Release 1.0' },
    ];

    renderMultiSelect({
      ...defaultProps,
      values: ['main', 'release-1.0'],
      setValues,
      options,
    });

    const mainChip = screen.getByText('Main Branch');
    const closeButton = mainChip.closest('li')?.querySelector('button');
    expect(closeButton).toBeTruthy();
    await user.click(closeButton);

    expect(setValues).toHaveBeenCalledWith(['release-1.0']);
  });

  it('should remove chip using raw key when label is not in the mapping', async () => {
    const setValues = jest.fn();
    const user = userEvent.setup();

    renderMultiSelect({
      ...defaultProps,
      values: ['unknown-key'],
      setValues,
      options: [{ key: 'main', label: 'Main Branch' }],
    });

    const chip = screen.getByText('unknown-key');
    const closeButton = chip.closest('li')?.querySelector('button');
    expect(closeButton).toBeTruthy();
    await user.click(closeButton);

    expect(setValues).toHaveBeenCalledWith([]);
  });

  it('should clear all values when chip group is deleted', async () => {
    const setValues = jest.fn();
    const user = userEvent.setup();

    renderMultiSelect({
      ...defaultProps,
      values: ['main', 'release-1.0'],
      setValues,
    });

    await user.click(screen.getByRole('button', { name: 'Close chip group Version' }));

    expect(setValues).toHaveBeenCalledWith([]);
  });

  it('should add a value when an unselected option is chosen', async () => {
    const setValues = jest.fn();
    const user = userEvent.setup();

    renderMultiSelect({ ...defaultProps, setValues });

    await user.click(screen.getByRole('button', { name: 'Version filter menu' }));
    await user.click(
      screen.getByLabelText(/main/i, {
        selector: 'input',
      }),
    );

    expect(setValues).toHaveBeenCalledWith(['main']);
  });

  it('should remove a value when a selected option is chosen again', async () => {
    const setValues = jest.fn();
    const user = userEvent.setup();

    renderMultiSelect({ ...defaultProps, values: ['main'], setValues });

    await user.click(screen.getByRole('button', { name: 'Version filter menu' }));
    await user.click(
      screen.getByLabelText(/main/i, {
        selector: 'input',
      }),
    );

    expect(setValues).toHaveBeenCalledWith([]);
  });

  it('should render a divider for menu divider options', async () => {
    const user = userEvent.setup();
    const options = [{ key: `${MENU_DIVIDER}1` }, { key: 'main' }];

    renderMultiSelect({ ...defaultProps, options });

    await user.click(screen.getByRole('button', { name: 'Version filter menu' }));

    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
  });

  it('should show raw key in chips when labels are not provided', () => {
    renderMultiSelect({ ...defaultProps, values: ['main'] });

    expect(screen.getByText('main')).toBeInTheDocument();
  });

  describe('Basic rendering', () => {
    it('should render with correct label', () => {
      renderMultiSelect(defaultProps);
      const toggleButton = screen.getByRole('button', { name: /Version filter menu/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should render with custom toggle aria label', () => {
      renderMultiSelect({ ...defaultProps, toggleAriaLabel: 'Custom aria label' });
      const toggleButton = screen.getByRole('button', { name: /Custom aria label/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should render with custom placeholder text', () => {
      renderMultiSelect({ ...defaultProps, placeholderText: 'Select options' });
      expect(screen.getByText('Select options')).toBeInTheDocument();
    });
  });

  describe('onFilter callback functionality', () => {
    const filterOptions = [
      { key: 'Option A', count: 5 },
      { key: 'Option B', count: 3 },
      { key: 'Option C', count: 10 },
    ];

    it('should return all options when filter value is empty', async () => {
      const user = userEvent.setup();
      renderMultiSelect({
        ...defaultProps,
        options: filterOptions,
        hasInlineFilter: true,
        inlineFilterThreshold: 0,
      });

      const toggleButton = screen.getByRole('button', { name: /Version filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.getByText('Option B')).toBeInTheDocument();
        expect(screen.getByText('Option C')).toBeInTheDocument();
      });
    });

    it('should filter options case-insensitively', async () => {
      const user = userEvent.setup();
      renderMultiSelect({
        ...defaultProps,
        options: filterOptions,
        hasInlineFilter: true,
        inlineFilterThreshold: 0,
      });

      const toggleButton = screen.getByRole('button', { name: /Version filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText(/Filter version/i);
      await user.type(filterInput, 'option a');

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.queryByText('Option B')).not.toBeInTheDocument();
        expect(screen.queryByText('Option C')).not.toBeInTheDocument();
      });
    });

    it('should filter options with uppercase input', async () => {
      const user = userEvent.setup();
      renderMultiSelect({
        ...defaultProps,
        options: filterOptions,
        hasInlineFilter: true,
        inlineFilterThreshold: 0,
      });

      const toggleButton = screen.getByRole('button', { name: /Version filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText(/Filter version/i);
      await user.type(filterInput, 'OPTION B');

      await waitFor(() => {
        expect(screen.queryByText('Option A')).not.toBeInTheDocument();
        expect(screen.getByText('Option B')).toBeInTheDocument();
        expect(screen.queryByText('Option C')).not.toBeInTheDocument();
      });
    });

    it('should filter with partial matches', async () => {
      const user = userEvent.setup();
      const options = [
        { key: 'Application A', count: 5 },
        { key: 'Application B', count: 3 },
        { key: 'Service A', count: 10 },
        { key: 'Service B', count: 7 },
      ];
      renderMultiSelect({
        ...defaultProps,
        options,
        hasInlineFilter: true,
        inlineFilterThreshold: 0,
      });

      const toggleButton = screen.getByRole('button', { name: /Version filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Application A')).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText(/Filter version/i);
      await user.type(filterInput, 'app');

      await waitFor(() => {
        expect(screen.getByText('Application A')).toBeInTheDocument();
        expect(screen.getByText('Application B')).toBeInTheDocument();
        expect(screen.queryByText('Service A')).not.toBeInTheDocument();
        expect(screen.queryByText('Service B')).not.toBeInTheDocument();
      });
    });

    it('should handle empty filter value (whitespace only)', async () => {
      const user = userEvent.setup();
      renderMultiSelect({
        ...defaultProps,
        options: filterOptions,
        hasInlineFilter: true,
        inlineFilterThreshold: 0,
      });

      const toggleButton = screen.getByRole('button', { name: /Version filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText(/Filter version/i);
      await user.type(filterInput, '   ');

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.getByText('Option B')).toBeInTheDocument();
        expect(screen.getByText('Option C')).toBeInTheDocument();
      });
    });

    it('should preserve item counts in filtered options', async () => {
      const user = userEvent.setup();
      const options = [
        { key: 'Item One', count: 42 },
        { key: 'Item Two', count: 13 },
        { key: 'Other', count: 7 },
      ];
      renderMultiSelect({
        ...defaultProps,
        options,
        hasInlineFilter: true,
        inlineFilterThreshold: 0,
      });

      const toggleButton = screen.getByRole('button', { name: /Version filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Item One')).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText(/Filter version/i);
      await user.type(filterInput, 'item');

      await waitFor(() => {
        expect(screen.getByText('Item One')).toBeInTheDocument();
        expect(screen.getByText('Item Two')).toBeInTheDocument();
        expect(screen.queryByText('Other')).not.toBeInTheDocument();
      });
    });

    it('should exclude MENU_DIVIDER from filter matching', async () => {
      const user = userEvent.setup();
      const options = [
        { key: 'Option A', count: 5 },
        { key: MENU_DIVIDER, count: 1 },
        { key: 'Option B', count: 3 },
        { key: '--divider--test', count: 2 },
      ];
      renderMultiSelect({
        ...defaultProps,
        options,
        hasInlineFilter: true,
        inlineFilterThreshold: 0,
      });

      const toggleButton = screen.getByRole('button', { name: /Version filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText(/Filter version/i);
      await user.type(filterInput, 'divider');

      await waitFor(() => {
        expect(screen.queryByText('Option A')).not.toBeInTheDocument();
        expect(screen.queryByText('Option B')).not.toBeInTheDocument();
      });
    });

    it('should handle options with special characters', async () => {
      const user = userEvent.setup();
      const options = [
        { key: 'Test-Component', count: 5 },
        { key: 'TestService', count: 3 },
        { key: 'Test@App', count: 10 },
      ];
      renderMultiSelect({
        ...defaultProps,
        options,
        hasInlineFilter: true,
        inlineFilterThreshold: 0,
      });

      const toggleButton = screen.getByRole('button', { name: /Version filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Test-Component')).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText(/Filter version/i);
      await user.type(filterInput, 'test-');

      await waitFor(() => {
        expect(screen.getByText('Test-Component')).toBeInTheDocument();
        expect(screen.queryByText('TestService')).not.toBeInTheDocument();
        expect(screen.queryByText('Test@App')).not.toBeInTheDocument();
      });
    });

    it('should clear filter when dropdown is toggled closed and reopened', async () => {
      const user = userEvent.setup();
      renderMultiSelect({
        ...defaultProps,
        options: filterOptions,
        hasInlineFilter: true,
        inlineFilterThreshold: 0,
      });

      const toggleButton = screen.getByRole('button', { name: /Version filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText(/Filter version/i);
      await user.type(filterInput, 'option a');

      await waitFor(() => {
        expect(screen.queryByText('Option B')).not.toBeInTheDocument();
      });

      await user.click(toggleButton);
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.getByText('Option B')).toBeInTheDocument();
        expect(screen.getByText('Option C')).toBeInTheDocument();
      });
    });

    it('should return empty array when no options match filter', async () => {
      const user = userEvent.setup();
      renderMultiSelect({
        ...defaultProps,
        options: filterOptions,
        hasInlineFilter: true,
        inlineFilterThreshold: 0,
      });

      const toggleButton = screen.getByRole('button', { name: /Version filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText(/Filter version/i);
      await user.type(filterInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.queryByText('Option A')).not.toBeInTheDocument();
        expect(screen.queryByText('Option B')).not.toBeInTheDocument();
        expect(screen.queryByText('Option C')).not.toBeInTheDocument();
      });
    });
  });

  describe('onFilter with dividers', () => {
    it('should render dividers in filtered results', async () => {
      const user = userEvent.setup();
      const options = [
        { key: 'Group A Item', count: 5 },
        { key: MENU_DIVIDER, count: 1 },
        { key: 'Group B Item', count: 3 },
      ];
      renderMultiSelect({
        ...defaultProps,
        options,
        hasInlineFilter: true,
        inlineFilterThreshold: 0,
      });

      const toggleButton = screen.getByRole('button', { name: /Version filter menu/i });
      await user.click(toggleButton);

      const filterInput = screen.getByPlaceholderText(/Filter version/i);
      await user.type(filterInput, 'group');

      await waitFor(() => {
        expect(screen.getByText('Group A Item')).toBeInTheDocument();
        expect(screen.getByText('Group B Item')).toBeInTheDocument();
      });
    });

    it('should not filter out dividers when showing all options', async () => {
      const user = userEvent.setup();
      const options = [
        { key: 'Item 1', count: 5 },
        { key: MENU_DIVIDER, count: 1 },
        { key: 'Item 2', count: 3 },
        { key: `${MENU_DIVIDER}-2`, count: 1 },
        { key: 'Item 3', count: 7 },
      ];
      renderMultiSelect({
        ...defaultProps,
        options,
        hasInlineFilter: true,
        inlineFilterThreshold: 0,
      });

      const toggleButton = screen.getByRole('button', { name: /Version filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.getByText('Item 3')).toBeInTheDocument();
      });
    });
  });

  describe('Without inline filter', () => {
    it('should show all options without filtering capability', async () => {
      const user = userEvent.setup();
      const options = [
        { key: 'Option A', count: 5 },
        { key: 'Option B', count: 3 },
        { key: 'Option C', count: 10 },
      ];
      renderMultiSelect({ ...defaultProps, options, hasInlineFilter: false });

      const toggleButton = screen.getByRole('button', { name: /Version filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.getByText('Option B')).toBeInTheDocument();
        expect(screen.getByText('Option C')).toBeInTheDocument();
      });

      const filterInput = screen.queryByPlaceholderText(/Filter version/i);
      expect(filterInput).not.toBeInTheDocument();
    });
  });

  describe('Selection behavior', () => {
    it('should call setValues when option is selected', async () => {
      const user = userEvent.setup();
      const options = [
        { key: 'Option A', count: 5 },
        { key: 'Option B', count: 3 },
      ];
      renderMultiSelect({ ...defaultProps, options, setValues: mockSetValues });

      const toggleButton = screen.getByRole('button', { name: /Version filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
      });

      const optionA = screen.getByText('Option A');
      await user.click(optionA);

      expect(mockSetValues).toHaveBeenCalled();
    });

    it('should display selected values as chips', () => {
      const options = [
        { key: 'Option A', count: 5 },
        { key: 'Option B', count: 3 },
      ];
      renderMultiSelect({
        ...defaultProps,
        options,
        values: ['Option A', 'Option B'],
      });

      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
    });

    it('should call setValues to remove chip', async () => {
      const user = userEvent.setup();
      const options = [
        { key: 'Option A', count: 5 },
        { key: 'Option B', count: 3 },
      ];
      renderMultiSelect({
        ...defaultProps,
        options,
        values: ['Option A', 'Option B'],
        setValues: mockSetValues,
      });

      const chips = screen.getAllByRole('button', { name: /close/i });
      await user.click(chips[0]);

      expect(mockSetValues).toHaveBeenCalledWith(['Option B']);
    });
  });

  describe('Custom inline filter placeholder', () => {
    it('should use custom inline filter placeholder text', async () => {
      const user = userEvent.setup();
      renderMultiSelect({
        ...defaultProps,
        hasInlineFilter: true,
        inlineFilterPlaceholderText: 'Search for items',
        inlineFilterThreshold: 0,
      });

      const toggleButton = screen.getByRole('button', { name: /Version filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        const filterInput = screen.getByPlaceholderText('Search for items');
        expect(filterInput).toBeInTheDocument();
      });
    });
  });
});
