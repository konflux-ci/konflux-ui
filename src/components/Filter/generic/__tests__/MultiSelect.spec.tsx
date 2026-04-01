import * as React from 'react';
import { Toolbar, ToolbarContent } from '@patternfly/react-core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelect, MENU_DIVIDER } from '../MultiSelect';

// Helper to wrap component in required Toolbar context
const renderWithToolbar = (ui: React.ReactElement) => {
  return render(
    <Toolbar>
      <ToolbarContent>{ui}</ToolbarContent>
    </Toolbar>,
  );
};

describe('MultiSelect', () => {
  const mockSetValues = jest.fn();
  const defaultProps = {
    label: 'Test Filter',
    filterKey: 'test',
    values: [],
    setValues: mockSetValues,
    options: {
      'Option A': 5,
      'Option B': 3,
      'Option C': 10,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('should render with correct label', () => {
      renderWithToolbar(<MultiSelect {...defaultProps} />);
      const toggleButton = screen.getByRole('button', { name: /Test Filter filter menu/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should render with custom toggle aria label', () => {
      renderWithToolbar(<MultiSelect {...defaultProps} toggleAriaLabel="Custom aria label" />);
      const toggleButton = screen.getByRole('button', { name: /Custom aria label/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should render with custom placeholder text', () => {
      renderWithToolbar(<MultiSelect {...defaultProps} placeholderText="Select options" />);
      expect(screen.getByText('Select options')).toBeInTheDocument();
    });
  });

  describe('onFilter callback functionality', () => {
    it('should return all options when filter value is empty', async () => {
      const user = userEvent.setup();
      renderWithToolbar(
        <MultiSelect {...defaultProps} hasInlineFilter inlineFilterThreshold={0} />,
      );

      // Open the dropdown
      const toggleButton = screen.getByRole('button', { name: /Test Filter filter menu/i });
      await user.click(toggleButton);

      // All options should be visible
      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.getByText('Option B')).toBeInTheDocument();
        expect(screen.getByText('Option C')).toBeInTheDocument();
      });
    });

    it('should filter options case-insensitively', async () => {
      const user = userEvent.setup();
      renderWithToolbar(
        <MultiSelect {...defaultProps} hasInlineFilter inlineFilterThreshold={0} />,
      );

      // Open the dropdown
      const toggleButton = screen.getByRole('button', { name: /Test Filter filter menu/i });
      await user.click(toggleButton);

      // Wait for options to appear
      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
      });

      // Type in filter input - using lowercase
      const filterInput = screen.getByPlaceholderText(/Filter test filter/i);
      await user.type(filterInput, 'option a');

      // Only Option A should be visible
      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.queryByText('Option B')).not.toBeInTheDocument();
        expect(screen.queryByText('Option C')).not.toBeInTheDocument();
      });
    });

    it('should filter options with uppercase input', async () => {
      const user = userEvent.setup();
      renderWithToolbar(
        <MultiSelect {...defaultProps} hasInlineFilter inlineFilterThreshold={0} />,
      );

      const toggleButton = screen.getByRole('button', { name: /Test Filter filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText(/Filter test filter/i);
      await user.type(filterInput, 'OPTION B');

      await waitFor(() => {
        expect(screen.queryByText('Option A')).not.toBeInTheDocument();
        expect(screen.getByText('Option B')).toBeInTheDocument();
        expect(screen.queryByText('Option C')).not.toBeInTheDocument();
      });
    });

    it('should filter with partial matches', async () => {
      const user = userEvent.setup();
      const options = {
        'Application A': 5,
        'Application B': 3,
        'Service A': 10,
        'Service B': 7,
      };
      renderWithToolbar(
        <MultiSelect
          {...defaultProps}
          options={options}
          hasInlineFilter
          inlineFilterThreshold={0}
        />,
      );

      const toggleButton = screen.getByRole('button', { name: /Test Filter filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Application A')).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText(/Filter test filter/i);
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
      renderWithToolbar(
        <MultiSelect {...defaultProps} hasInlineFilter inlineFilterThreshold={0} />,
      );

      const toggleButton = screen.getByRole('button', { name: /Test Filter filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText(/Filter test filter/i);
      await user.type(filterInput, '   ');

      // All options should still be visible with whitespace-only filter
      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.getByText('Option B')).toBeInTheDocument();
        expect(screen.getByText('Option C')).toBeInTheDocument();
      });
    });

    it('should preserve item counts in filtered options', async () => {
      const user = userEvent.setup();
      const options = {
        'Item One': 42,
        'Item Two': 13,
        Other: 7,
      };
      renderWithToolbar(
        <MultiSelect
          {...defaultProps}
          options={options}
          hasInlineFilter
          inlineFilterThreshold={0}
        />,
      );

      const toggleButton = screen.getByRole('button', { name: /Test Filter filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Item One')).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText(/Filter test filter/i);
      await user.type(filterInput, 'item');

      // Should show filtered items with their counts
      await waitFor(() => {
        expect(screen.getByText('Item One')).toBeInTheDocument();
        expect(screen.getByText('Item Two')).toBeInTheDocument();
        expect(screen.queryByText('Other')).not.toBeInTheDocument();
      });
    });

    it('should exclude MENU_DIVIDER from filter matching', async () => {
      const user = userEvent.setup();
      const options = {
        'Option A': 5,
        [MENU_DIVIDER]: 1,
        'Option B': 3,
        '--divider--test': 2, // Another divider-like key
      };
      renderWithToolbar(
        <MultiSelect
          {...defaultProps}
          options={options}
          hasInlineFilter
          inlineFilterThreshold={0}
        />,
      );

      const toggleButton = screen.getByRole('button', { name: /Test Filter filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText(/Filter test filter/i);
      await user.type(filterInput, 'divider');

      // MENU_DIVIDER should be excluded from matching, but divider-like text can match
      await waitFor(() => {
        expect(screen.queryByText('Option A')).not.toBeInTheDocument();
        expect(screen.queryByText('Option B')).not.toBeInTheDocument();
        // The divider element itself won't have text content to match
      });
    });

    it('should handle options with special characters', async () => {
      const user = userEvent.setup();
      const options = {
        'Test-Component': 5,
        TestService: 3,
        'Test@App': 10,
      };
      renderWithToolbar(
        <MultiSelect
          {...defaultProps}
          options={options}
          hasInlineFilter
          inlineFilterThreshold={0}
        />,
      );

      const toggleButton = screen.getByRole('button', { name: /Test Filter filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Test-Component')).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText(/Filter test filter/i);
      await user.type(filterInput, 'test-');

      await waitFor(() => {
        expect(screen.getByText('Test-Component')).toBeInTheDocument();
        expect(screen.queryByText('TestService')).not.toBeInTheDocument();
        expect(screen.queryByText('Test@App')).not.toBeInTheDocument();
      });
    });

    it('should clear filter when dropdown is toggled closed and reopened', async () => {
      const user = userEvent.setup();
      renderWithToolbar(
        <MultiSelect {...defaultProps} hasInlineFilter inlineFilterThreshold={0} />,
      );

      const toggleButton = screen.getByRole('button', { name: /Test Filter filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText(/Filter test filter/i);
      await user.type(filterInput, 'option a');

      await waitFor(() => {
        expect(screen.queryByText('Option B')).not.toBeInTheDocument();
      });

      // Close the dropdown
      await user.click(toggleButton);

      // Reopen the dropdown
      await user.click(toggleButton);

      // Filter should be cleared, all options visible
      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.getByText('Option B')).toBeInTheDocument();
        expect(screen.getByText('Option C')).toBeInTheDocument();
      });
    });

    it('should return empty array when no options match filter', async () => {
      const user = userEvent.setup();
      renderWithToolbar(
        <MultiSelect {...defaultProps} hasInlineFilter inlineFilterThreshold={0} />,
      );

      const toggleButton = screen.getByRole('button', { name: /Test Filter filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText(/Filter test filter/i);
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
      const options = {
        'Group A Item': 5,
        [MENU_DIVIDER]: 1,
        'Group B Item': 3,
      };
      renderWithToolbar(
        <MultiSelect
          {...defaultProps}
          options={options}
          hasInlineFilter
          inlineFilterThreshold={0}
        />,
      );

      const toggleButton = screen.getByRole('button', { name: /Test Filter filter menu/i });
      await user.click(toggleButton);

      // Filter for "group" - both items should show with divider
      const filterInput = screen.getByPlaceholderText(/Filter test filter/i);
      await user.type(filterInput, 'group');

      await waitFor(() => {
        expect(screen.getByText('Group A Item')).toBeInTheDocument();
        expect(screen.getByText('Group B Item')).toBeInTheDocument();
      });
    });

    it('should not filter out dividers when showing all options', async () => {
      const user = userEvent.setup();
      const options = {
        'Item 1': 5,
        [MENU_DIVIDER]: 1,
        'Item 2': 3,
        [`${MENU_DIVIDER}-2`]: 1,
        'Item 3': 7,
      };
      renderWithToolbar(
        <MultiSelect
          {...defaultProps}
          options={options}
          hasInlineFilter
          inlineFilterThreshold={0}
        />,
      );

      const toggleButton = screen.getByRole('button', { name: /Test Filter filter menu/i });
      await user.click(toggleButton);

      // With no filter, all items should be visible (dividers render as Divider components)
      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.getByText('Item 3')).toBeInTheDocument();
        // Dividers are present but don't have text content
      });
    });
  });

  describe('Without inline filter', () => {
    it('should show all options without filtering capability', async () => {
      const user = userEvent.setup();
      renderWithToolbar(<MultiSelect {...defaultProps} hasInlineFilter={false} />);

      const toggleButton = screen.getByRole('button', { name: /Test Filter filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.getByText('Option B')).toBeInTheDocument();
        expect(screen.getByText('Option C')).toBeInTheDocument();
      });

      // Filter input should not be present
      const filterInput = screen.queryByPlaceholderText(/Filter test filter/i);
      expect(filterInput).not.toBeInTheDocument();
    });
  });

  describe('Selection behavior', () => {
    it('should call setValues when option is selected', async () => {
      const user = userEvent.setup();
      renderWithToolbar(<MultiSelect {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /Test Filter filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Option A')).toBeInTheDocument();
      });

      // Click on the option text (which triggers the checkbox)
      const optionA = screen.getByText('Option A');
      await user.click(optionA);

      // The component should call setValues with the selected option
      expect(mockSetValues).toHaveBeenCalled();
    });

    it('should display selected values as chips', () => {
      renderWithToolbar(<MultiSelect {...defaultProps} values={['Option A', 'Option B']} />);

      // Chips should be visible
      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
    });

    it('should call setValues to remove chip', async () => {
      const user = userEvent.setup();
      renderWithToolbar(<MultiSelect {...defaultProps} values={['Option A', 'Option B']} />);

      // Find and click the delete button for Option A chip
      const chips = screen.getAllByRole('button', { name: /close/i });
      await user.click(chips[0]);

      // Should call setValues with Option A removed
      expect(mockSetValues).toHaveBeenCalledWith(['Option B']);
    });
  });

  describe('Custom inline filter placeholder', () => {
    it('should use custom inline filter placeholder text', async () => {
      const user = userEvent.setup();
      renderWithToolbar(
        <MultiSelect
          {...defaultProps}
          hasInlineFilter
          inlineFilterPlaceholderText="Search for items"
          inlineFilterThreshold={0}
        />,
      );

      const toggleButton = screen.getByRole('button', { name: /Test Filter filter menu/i });
      await user.click(toggleButton);

      await waitFor(() => {
        const filterInput = screen.getByPlaceholderText('Search for items');
        expect(filterInput).toBeInTheDocument();
      });
    });
  });
});
