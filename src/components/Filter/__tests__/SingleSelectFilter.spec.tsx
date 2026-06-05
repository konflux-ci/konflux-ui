import { MemoryRouter } from 'react-router-dom';
import { Toolbar, ToolbarContent } from '@patternfly/react-core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { SingleSelectFilter } from '~/components/Filter/controls/SingleSelectFilter';
import { NuqsAdapter } from '~/components/Filter/nuqs-adapter';
import { OptionItem, SingleSelectFilterConfig } from '~/components/Filter/types';

type Item = { status: string };

const defaultConfig: SingleSelectFilterConfig<Item> = {
  type: 'singleSelect',
  param: 'status',
  label: 'Status',
  filterFn: (item, value) => item.status === value,
};

const defaultOptions: OptionItem[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Archived', value: 'archived' },
];

const renderWithRouter = (
  config: SingleSelectFilterConfig<Item> = defaultConfig,
  options: OptionItem[] = defaultOptions,
) =>
  render(
    <MemoryRouter>
      <NuqsAdapter>
        <Toolbar>
          <ToolbarContent>
            <SingleSelectFilter config={config} options={options} />
          </ToolbarContent>
        </Toolbar>
      </NuqsAdapter>
    </MemoryRouter>,
  );

const clickToggle = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTestId('single-select-filter-status'));
};

describe('SingleSelectFilter', () => {
  it('renders toggle with label', () => {
    renderWithRouter();
    expect(screen.getByTestId('single-select-filter-status')).toHaveTextContent('Status');
  });

  it('has data-test="single-select-filter-{param}" on the toggle', () => {
    renderWithRouter();
    expect(screen.getByTestId('single-select-filter-status')).toBeInTheDocument();
  });

  it('shows options when opened', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await clickToggle(user);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('selects option and shows label in toggle', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await clickToggle(user);
    await user.click(screen.getByText('Active'));

    // toggle shows selected label
    expect(screen.getByTestId('single-select-filter-status')).toHaveTextContent('Active');
  });

  it('reads initial value from URL', () => {
    render(
      <NuqsTestingAdapter searchParams="?status=inactive">
        <Toolbar>
          <ToolbarContent>
            <SingleSelectFilter config={defaultConfig} options={defaultOptions} />
          </ToolbarContent>
        </Toolbar>
      </NuqsTestingAdapter>,
    );
    expect(screen.getByTestId('single-select-filter-status')).toHaveTextContent('Inactive');
  });
});
