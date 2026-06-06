import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { SearchFilter } from '~/shared/components/Filter/controls/SearchFilter';
import { SearchFilterConfig } from '~/shared/components/Filter/types';
import { renderWithNuqsRouter } from '~/unit-test-utils';

jest.useFakeTimers();

type Item = { name: string };

const defaultConfig: SearchFilterConfig<Item> = {
  type: 'search',
  param: 'name',
  label: 'Name',
  filterFn: (item, value) => item.name.includes(value),
};

const renderFilter = (config: SearchFilterConfig<Item> = defaultConfig) =>
  renderWithNuqsRouter(<SearchFilter config={config} />);

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
    renderFilter();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
  });

  it('has data-test="search-filter-{param}" attribute', () => {
    renderFilter();
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
    renderFilter();
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
    renderFilter({
      ...defaultConfig,
      placeholder: 'Search names...',
    });
    expect(screen.getByPlaceholderText('Search names...')).toBeInTheDocument();
  });

  it('uses default placeholder when none provided', () => {
    renderFilter();
    expect(screen.getByPlaceholderText('Filter by Name...')).toBeInTheDocument();
  });
});
