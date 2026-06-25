import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { BooleanFilter } from '~/shared/components/Filter/controls/BooleanFilter';
import { BooleanFilterConfig } from '~/shared/components/Filter/types';
import { renderWithNuqs } from '~/unit-test-utils';

const defaultConfig: BooleanFilterConfig = {
  type: 'boolean',
  param: 'active',
  label: 'Active',
};

const renderFilter = (config: BooleanFilterConfig = defaultConfig) =>
  renderWithNuqs(<BooleanFilter config={config} />);

describe('BooleanFilter', () => {
  it('renders switch with label', () => {
    renderFilter();
    expect(screen.getByRole('checkbox', { name: 'Active' })).toBeInTheDocument();
  });

  it('has data-test="boolean-filter-{param}" attribute', () => {
    renderFilter();
    expect(screen.getByTestId('boolean-filter-active')).toBeInTheDocument();
  });

  it('is unchecked by default', () => {
    renderFilter();
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
    renderFilter();
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
