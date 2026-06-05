import { MemoryRouter } from 'react-router-dom';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { SearchFilter } from '~/shared/components/Filter/controls/SearchFilter';
import { NuqsAdapter } from '~/shared/components/Filter/nuqs-adapter';
import { SearchFilterConfig } from '~/shared/components/Filter/types';

jest.useFakeTimers();

type Item = { name: string };

const defaultConfig: SearchFilterConfig<Item> = {
  type: 'search',
  param: 'name',
  label: 'Name',
  filterFn: (item, value) => item.name.includes(value),
};

const renderWithRouter = (config: SearchFilterConfig<Item> = defaultConfig) =>
  render(
    <MemoryRouter>
      <NuqsAdapter>
        <SearchFilter config={config} />
      </NuqsAdapter>
    </MemoryRouter>,
  );

describe('SearchFilter', () => {
  afterEach(() => {
    // flush pending debounce timers inside act to avoid React warnings
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it('renders a search input with aria-label', () => {
    renderWithRouter();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
  });

  it('has data-test="search-filter-{param}" attribute', () => {
    renderWithRouter();
    expect(screen.getByTestId('search-filter-name')).toBeInTheDocument();
  });

  it('reads initial value from URL', () => {
    render(
      <NuqsTestingAdapter searchParams="?name=hello">
        <SearchFilter config={defaultConfig} />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('hello');
  });

  it('updates local value immediately on typing', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithRouter();
    const input = screen.getByRole('textbox', { name: 'Name' });
    await user.type(input, 'test');
    expect(input).toHaveValue('test');
  });

  it('clears value on clear button click', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <NuqsTestingAdapter searchParams="?name=hello">
        <SearchFilter config={defaultConfig} />
      </NuqsTestingAdapter>,
    );
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveValue('hello');

    const clearButton = screen.getByRole('button', { name: /reset/i });
    await user.click(clearButton);
    expect(input).toHaveValue('');
  });

  it('uses custom placeholder when provided', () => {
    renderWithRouter({
      ...defaultConfig,
      placeholder: 'Search names...',
    });
    expect(screen.getByPlaceholderText('Search names...')).toBeInTheDocument();
  });

  it('uses default placeholder when none provided', () => {
    renderWithRouter();
    expect(screen.getByPlaceholderText('Filter by Name...')).toBeInTheDocument();
  });
});
