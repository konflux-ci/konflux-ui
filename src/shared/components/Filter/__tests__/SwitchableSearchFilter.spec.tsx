import { MemoryRouter } from 'react-router-dom';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { SwitchableSearchFilter } from '~/shared/components/Filter/controls/SwitchableSearchFilter';
import { NuqsAdapter } from '~/shared/components/Filter/nuqs-adapter';
import { SwitchableSearchFilterConfig } from '~/shared/components/Filter/types';

jest.useFakeTimers();

type Item = { name: string; namespace: string };

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

const renderWithRouter = (config: SwitchableSearchFilterConfig<Item> = defaultConfig) =>
  render(
    <MemoryRouter>
      <NuqsAdapter>
        <SwitchableSearchFilter config={config} />
      </NuqsAdapter>
    </MemoryRouter>,
  );

describe('SwitchableSearchFilter', () => {
  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it('renders field picker and search input', () => {
    renderWithRouter();
    // Field picker toggle shows first field label
    expect(screen.getByRole('button', { name: 'Name' })).toBeInTheDocument();
    // Search input is present
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
  });

  it('has data-test="switchable-search-filter-{param}" attribute', () => {
    renderWithRouter();
    expect(screen.getByTestId('switchable-search-filter-searchField')).toBeInTheDocument();
  });

  it('shows field options when picker clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithRouter();

    await user.click(screen.getByRole('button', { name: 'Name' }));

    // "Name" appears in both toggle and dropdown option
    const options = screen.getAllByRole('menuitem');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('Name');
    expect(options[1]).toHaveTextContent('Namespace');
  });

  it('switches active field', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithRouter();

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
});
