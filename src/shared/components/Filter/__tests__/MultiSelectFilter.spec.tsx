import { Toolbar, ToolbarContent } from '@patternfly/react-core';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelectFilter } from '~/shared/components/Filter/controls/MultiSelectFilter';
import { MultiSelectFilterConfig, OptionItem } from '~/shared/components/Filter/types';
import { renderWithNuqs } from '~/unit-test-utils';

type Item = { status: string };

const defaultConfig: MultiSelectFilterConfig<Item> = {
  type: 'multiSelect',
  param: 'status',
  label: 'Status',
  filterFn: (item, values) => values.includes(item.status),
};

const defaultOptions: OptionItem[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { type: 'divider' },
  { label: 'Archived', value: 'archived' },
];

const renderFilter = (
  config: MultiSelectFilterConfig<Item> = defaultConfig,
  options: OptionItem[] = defaultOptions,
) =>
  renderWithNuqs(
    <Toolbar>
      <ToolbarContent>
        <MultiSelectFilter config={config} options={options} />
      </ToolbarContent>
    </Toolbar>,
  );

const clickToggle = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTestId('multi-select-filter-status'));
};

describe('MultiSelectFilter', () => {
  it('renders toggle with label', () => {
    renderFilter();
    expect(screen.getByTestId('multi-select-filter-status')).toHaveTextContent('Status');
  });

  it('has data-test="multi-select-filter-{param}" on the toggle', () => {
    renderFilter();
    expect(screen.getByTestId('multi-select-filter-status')).toBeInTheDocument();
  });

  it('shows options when opened', async () => {
    const user = userEvent.setup();
    renderFilter();

    await clickToggle(user);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('selects an option (checkbox select)', async () => {
    const user = userEvent.setup();
    renderFilter();

    await clickToggle(user);
    await user.click(screen.getByText('Active'));

    // Badge should show count of 1
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders dividers in dropdown', async () => {
    const user = userEvent.setup();
    renderFilter();

    await clickToggle(user);

    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('handles empty options', async () => {
    const user = userEvent.setup();
    renderFilter(defaultConfig, []);

    await clickToggle(user);

    // dropdown opens but no options
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
});
