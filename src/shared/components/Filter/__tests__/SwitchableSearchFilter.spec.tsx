import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { SwitchableSearchFilter } from '~/shared/components/Filter/controls/SwitchableSearchFilter';
import { SwitchableSearchFilterConfig } from '~/shared/components/Filter/types';
import { renderWithNuqs } from '~/unit-test-utils';

jest.useFakeTimers();

type Item = { name: string; namespace: string; labels?: string[] };

const defaultConfig: SwitchableSearchFilterConfig<Item> = {
  type: 'switchableSearch',
  param: 'searchField',
  label: 'Search',
  fields: [
    {
      label: 'Name',
      value: 'name',
      param: 'name',
      filterFn: (item, text) => item.name.includes(text),
    },
    {
      label: 'Namespace',
      value: 'ns',
      param: 'ns',
      filterFn: (item, text) => item.namespace.includes(text),
    },
  ],
};

const multiValueConfig: SwitchableSearchFilterConfig<Item> = {
  type: 'switchableSearch',
  param: 'searchField',
  label: 'Search',
  fields: [
    {
      label: 'Name',
      value: 'name',
      param: 'name',
      filterFn: (item, text) => item.name.includes(text),
    },
    {
      label: 'Labels',
      value: 'labels',
      param: 'labels',
      multiValue: true,
      filterFn: (item, text) => item.labels?.includes(text) ?? false,
    },
  ],
};

const renderFilter = (config: SwitchableSearchFilterConfig<Item> = defaultConfig) =>
  renderWithNuqs(<SwitchableSearchFilter config={config} />);

describe('SwitchableSearchFilter', () => {
  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it('renders field picker and search input', () => {
    renderFilter();
    // Field picker toggle shows first field label
    expect(screen.getByRole('button', { name: 'Name' })).toBeInTheDocument();
    // Search input is present
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
  });

  it('has data-test="switchable-search-filter-{param}" attribute', () => {
    renderFilter();
    expect(screen.getByTestId('switchable-search-filter-searchField')).toBeInTheDocument();
  });

  it('shows field options when picker clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderFilter();

    await user.click(screen.getByRole('button', { name: 'Name' }));

    // "Name" appears in both toggle and dropdown option
    const options = screen.getAllByRole('menuitem');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('Name');
    expect(options[1]).toHaveTextContent('Namespace');
  });

  it('switches active field', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderFilter();

    // Open picker and select Namespace
    await user.click(screen.getByRole('button', { name: 'Name' }));
    await user.click(screen.getByText('Namespace'));

    // Toggle now shows Namespace
    expect(screen.getByRole('button', { name: 'Namespace' })).toBeInTheDocument();
    // Search input updated
    expect(screen.getByRole('textbox', { name: 'Namespace' })).toBeInTheDocument();
  });

  it('reads initial field from URL', () => {
    render(
      <NuqsTestingAdapter searchParams="?searchField=ns">
        <SwitchableSearchFilter config={defaultConfig} />
      </NuqsTestingAdapter>,
    );
    // Should show Namespace as the active field
    expect(screen.getByRole('button', { name: 'Namespace' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Namespace' })).toBeInTheDocument();
  });

  it('reads initial search text from URL', () => {
    render(
      <NuqsTestingAdapter searchParams="?name=hello">
        <SwitchableSearchFilter config={defaultConfig} />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('hello');
  });

  describe('multi-value field', () => {
    const renderMultiValueAtLabels = () =>
      render(
        <NuqsTestingAdapter searchParams="?searchField=labels">
          <SwitchableSearchFilter config={multiValueConfig} />
        </NuqsTestingAdapter>,
      );

    it('renders chip input when active field has multiValue: true', () => {
      renderMultiValueAtLabels();

      // Should have an input for Labels
      expect(screen.getByRole('textbox', { name: 'Labels' })).toBeInTheDocument();
      // SearchInput clear button should NOT be present (chip input uses its own clear)
      expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
    });

    it('adds a chip when typing and pressing Enter', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderMultiValueAtLabels();

      const input = screen.getByRole('textbox', { name: 'Labels' });
      await user.type(input, 'frontend{Enter}');

      // Chip should appear
      expect(screen.getByText('frontend')).toBeInTheDocument();
      // Input should be cleared
      expect(input).toHaveValue('');
    });

    it('does not add duplicate chips', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderMultiValueAtLabels();

      const input = screen.getByRole('textbox', { name: 'Labels' });
      await user.type(input, 'frontend{Enter}');
      await user.type(input, 'frontend{Enter}');

      // Only one chip should exist
      const chips = screen.getAllByText('frontend');
      expect(chips).toHaveLength(1);
    });

    it('removes a chip when its close button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderMultiValueAtLabels();

      const input = screen.getByRole('textbox', { name: 'Labels' });
      await user.type(input, 'frontend{Enter}');
      await user.type(input, 'backend{Enter}');

      // Both chips should be present
      expect(screen.getByText('frontend')).toBeInTheDocument();
      expect(screen.getByText('backend')).toBeInTheDocument();

      // Remove the first chip — find the close button inside the chip element
      const frontendChipText = screen.getByText('frontend');
      const chipElement = frontendChipText.closest('.pf-v6-c-label');
      const closeButton = chipElement.querySelector('button');
      await user.click(closeButton);

      expect(screen.queryByText('frontend')).not.toBeInTheDocument();
      expect(screen.getByText('backend')).toBeInTheDocument();
    });

    it('clears all chips when clear-all button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderMultiValueAtLabels();

      const input = screen.getByRole('textbox', { name: 'Labels' });
      await user.type(input, 'frontend{Enter}');
      await user.type(input, 'backend{Enter}');

      // Click clear all
      await user.click(screen.getByRole('button', { name: 'Clear all' }));

      expect(screen.queryByText('frontend')).not.toBeInTheDocument();
      expect(screen.queryByText('backend')).not.toBeInTheDocument();
    });

    it('renders search input for non-multiValue field', () => {
      renderFilter(multiValueConfig);
      // Default first field (Name) is not multiValue — should render SearchInput
      expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
    });
  });
});
