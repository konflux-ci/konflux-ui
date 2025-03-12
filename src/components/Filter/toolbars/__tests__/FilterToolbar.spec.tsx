import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { FilterToolbar } from '../FilterToolbar';

describe('FilterToolbar', () => {
  it('should render filter toolbar accurately', () => {
    render(
      <FilterToolbar
        value="test"
        dropdownItems={['Name']}
        onInput={jest.fn()}
        onFilterTypeChange={jest.fn()}
      />,
    );
    expect(screen.getByTestId('filter-toolbar')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Name' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Name filter' })).toBeVisible();
  });

  it('should update filter type on select', () => {
    render(
      <FilterToolbar
        value="test"
        dropdownItems={['Name', 'Date']}
        onInput={jest.fn()}
        onFilterTypeChange={jest.fn()}
      />,
    );
    expect(screen.getByText('Name')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    fireEvent.click(screen.getByRole('option', { name: 'Date' }));
    expect(screen.getByText('Date')).toBeVisible();
  });

  it('should capitalize filter type items', async () => {
    render(
      <FilterToolbar
        value="test"
        dropdownItems={['name', 'date']}
        onInput={jest.fn()}
        onFilterTypeChange={jest.fn()}
      />,
    );
    expect(screen.getByText('Name')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Name' }));

    expect(screen.getByRole('option', { name: 'Name' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Date' })).toBeVisible();
  });

  it('should run callback on enter', async () => {
    const onInput = jest.fn();
    const onFilterChange = jest.fn();
    render(
      <FilterToolbar
        value="test"
        dropdownItems={['name', 'date']}
        onInput={onInput}
        onFilterTypeChange={onFilterChange}
      />,
    );
    expect(screen.getByText('Name')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    await userEvent.click(screen.getByRole('option', { name: 'Date' }));
    expect(onFilterChange).toHaveBeenCalledWith('date');
    await userEvent.type(screen.getByRole('textbox', { name: 'date filter' }), 'test');
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onInput).toHaveBeenCalledWith('');
  });
});
