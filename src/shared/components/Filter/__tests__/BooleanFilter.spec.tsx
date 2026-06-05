import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { BooleanFilter } from '~/shared/components/Filter/controls/BooleanFilter';
import { NuqsAdapter } from '~/shared/components/Filter/nuqs-adapter';
import { BooleanFilterConfig } from '~/shared/components/Filter/types';

const defaultConfig: BooleanFilterConfig = {
  type: 'boolean',
  param: 'active',
  label: 'Active',
};

const renderWithRouter = (config: BooleanFilterConfig = defaultConfig) =>
  render(
    <MemoryRouter>
      <NuqsAdapter>
        <BooleanFilter config={config} />
      </NuqsAdapter>
    </MemoryRouter>,
  );

describe('BooleanFilter', () => {
  it('renders switch with label', () => {
    renderWithRouter();
    expect(screen.getByRole('checkbox', { name: 'Active' })).toBeInTheDocument();
  });

  it('has data-test="boolean-filter-{param}" attribute', () => {
    renderWithRouter();
    expect(screen.getByTestId('boolean-filter-active')).toBeInTheDocument();
  });

  it('is unchecked by default', () => {
    renderWithRouter();
    expect(screen.getByRole('checkbox', { name: 'Active' })).not.toBeChecked();
  });

  it('is checked when URL param is true', () => {
    render(
      <NuqsTestingAdapter searchParams="?active=true">
        <BooleanFilter config={defaultConfig} />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByRole('checkbox', { name: 'Active' })).toBeChecked();
  });

  it('toggles on when clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter();
    const toggle = screen.getByRole('checkbox', { name: 'Active' });
    expect(toggle).not.toBeChecked();
    await user.click(toggle);
    expect(toggle).toBeChecked();
  });

  it('toggles off when clicked again', async () => {
    const user = userEvent.setup();
    render(
      <NuqsTestingAdapter searchParams="?active=true">
        <BooleanFilter config={defaultConfig} />
      </NuqsTestingAdapter>,
    );
    const toggle = screen.getByRole('checkbox', { name: 'Active' });
    expect(toggle).toBeChecked();
    await user.click(toggle);
    expect(toggle).not.toBeChecked();
  });
});
