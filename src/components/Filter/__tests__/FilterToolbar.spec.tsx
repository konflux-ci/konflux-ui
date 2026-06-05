import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterToolbar } from '~/components/Filter/FilterToolbar';
import { NuqsAdapter } from '~/components/Filter/nuqs-adapter';
import type {
  BooleanFilterConfig,
  FilterConfig,
  MultiSelectFilterConfig,
  OptionItem,
  SearchFilterConfig,
} from '~/components/Filter/types';

type Item = { name: string; status: string; active: boolean };

const searchConfig: SearchFilterConfig<Item> = {
  type: 'search',
  param: 'name',
  label: 'Name',
  filterFn: (item, value) => item.name.includes(value),
};

const multiSelectConfig: MultiSelectFilterConfig<Item> = {
  type: 'multiSelect',
  param: 'status',
  label: 'Status',
  filterFn: (item, values) => values.includes(item.status),
};

const booleanConfig: BooleanFilterConfig = {
  type: 'boolean',
  param: 'active',
  label: 'Active only',
};

const statusOptions: OptionItem[] = [
  { label: 'Running', value: 'running' },
  { label: 'Stopped', value: 'stopped' },
];

const renderToolbar = (
  configs: readonly FilterConfig<unknown>[] = [searchConfig],
  options?: Record<string, OptionItem[]>,
  children?: React.ReactNode,
) =>
  render(
    <MemoryRouter>
      <NuqsAdapter>
        <FilterToolbar configs={configs} options={options}>
          {children}
        </FilterToolbar>
      </NuqsAdapter>
    </MemoryRouter>,
  );

describe('FilterToolbar', () => {
  it('renders search input for search config', () => {
    renderToolbar([searchConfig]);
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
  });

  it('has data-test="filter-toolbar" attribute', () => {
    renderToolbar([searchConfig]);
    expect(screen.getByTestId('filter-toolbar')).toBeInTheDocument();
  });

  it('renders correct controls for each config type', () => {
    renderToolbar([searchConfig, multiSelectConfig, booleanConfig], {
      status: statusOptions,
    });

    // search control
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
    // multi-select toggle
    expect(screen.getByTestId('multi-select-filter-status')).toBeInTheDocument();
    // boolean switch
    expect(screen.getByTestId('boolean-filter-active')).toBeInTheDocument();
  });

  it('passes options to multi-select controls', async () => {
    const user = userEvent.setup();
    renderToolbar([multiSelectConfig], { status: statusOptions });

    // open dropdown
    await user.click(screen.getByTestId('multi-select-filter-status'));

    // verify options visible
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('Stopped')).toBeInTheDocument();
  });

  it('renders children in toolbar', () => {
    renderToolbar([searchConfig], undefined, <button data-test="extra-action">Export</button>);
    expect(screen.getByTestId('extra-action')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });
});
