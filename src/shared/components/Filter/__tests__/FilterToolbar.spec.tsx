import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterToolbar } from '~/shared/components/Filter/FilterToolbar';
import type { ToolbarGroupConfig } from '~/shared/components/Filter/FilterToolbar';
import { NuqsAdapter } from '~/shared/components/Filter/nuqs-adapter';
import type {
  BooleanFilterConfig,
  FilterConfig,
  MultiSelectFilterConfig,
  OptionItem,
  SearchFilterConfig,
  SingleSelectFilterConfig,
} from '~/shared/components/Filter/types';

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

const singleSelectConfig: SingleSelectFilterConfig<Item> = {
  type: 'singleSelect',
  param: 'env',
  label: 'Environment',
  group: 'actions',
  filterFn: (item, value) => item.status === value,
};

const renderToolbar = (
  configs: readonly FilterConfig<unknown>[] = [searchConfig],
  options?: Record<string, OptionItem[]>,
  children?: React.ReactNode,
  groups?: Record<string, ToolbarGroupConfig>,
) =>
  render(
    <MemoryRouter>
      <NuqsAdapter>
        <FilterToolbar configs={configs} options={options} groups={groups}>
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

  it('renders grouped configs in separate ToolbarGroup elements', () => {
    const groupedSearch: SearchFilterConfig<Item> = {
      ...searchConfig,
      group: 'actions',
    };

    renderToolbar([groupedSearch, multiSelectConfig, singleSelectConfig], {
      status: statusOptions,
      env: statusOptions,
    });

    // default group contains multiSelectConfig (no group)
    const defaultGroup = screen.getByTestId('filter-group-default');
    expect(defaultGroup).toBeInTheDocument();
    expect(
      defaultGroup.querySelector('[data-test="multi-select-filter-status"]'),
    ).toBeInTheDocument();

    // 'actions' group contains searchConfig and singleSelectConfig
    const actionsGroup = screen.getByTestId('filter-group-actions');
    expect(actionsGroup).toBeInTheDocument();
    expect(actionsGroup.querySelector('[aria-label="Name"]')).toBeInTheDocument();
    expect(
      actionsGroup.querySelector('[data-test="single-select-filter-env"]'),
    ).toBeInTheDocument();
  });

  it('applies variant from groups prop to named groups', () => {
    const groupedBoolean: BooleanFilterConfig = {
      ...booleanConfig,
      group: 'toggles',
    };

    renderToolbar([searchConfig, groupedBoolean], undefined, undefined, {
      toggles: { variant: 'icon-button-group' },
    });

    const defaultGroup = screen.getByTestId('filter-group-default');
    expect(defaultGroup).toHaveClass('pf-m-filter-group');

    const togglesGroup = screen.getByTestId('filter-group-toggles');
    expect(togglesGroup).toHaveClass('pf-m-icon-button-group');
  });
});
