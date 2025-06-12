import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useFormik, FormikProvider } from 'formik';
import { CurrentComponentRef } from '~/types';
import { ComponentSelectMenu } from '../ComponentSelectMenu';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const formikBag = useFormik({
    initialValues: { components: [] },
    onSubmit: () => {},
  });

  return <FormikProvider value={formikBag}>{children}</FormikProvider>;
};

describe('ComponentSelectMenu', () => {
  const options = ['Item 1', 'Item 2', 'Item 3'];
  const groupedOptions = {
    Group1: ['Item 1', 'Item 2'],
    Group2: ['Item 3'],
  };

  it('renders correctly with default props', () => {
    render(
      <TestWrapper>
        <ComponentSelectMenu name="components" options={options} />
      </TestWrapper>,
    );

    expect(screen.getByText('Select components')).toBeInTheDocument();
  });

  it('filters options based on search query', async () => {
    render(
      <TestWrapper>
        <ComponentSelectMenu name="components" options={options} />
      </TestWrapper>,
    );

    fireEvent.click(screen.getByText('Select components'));

    const searchInput = screen.getByPlaceholderText('Search components...');
    fireEvent.change(searchInput, { target: { value: 'Item 1' } });

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.queryByText('Item 2')).not.toBeInTheDocument();
    });
  });

  it('selects a single item in single-select mode', async () => {
    render(
      <TestWrapper>
        <ComponentSelectMenu name="components" options={options} />
      </TestWrapper>,
    );

    fireEvent.click(screen.getByText('Select components'));
    fireEvent.click(screen.getByText('Item 1'));

    await waitFor(() => {
      expect(screen.getByText('Select components')).toBeInTheDocument();
    });
  });

  it('selects multiple items in multi-select mode', async () => {
    render(
      <TestWrapper>
        <ComponentSelectMenu name="components" options={options} isMulti />
      </TestWrapper>,
    );

    fireEvent.click(screen.getByText('Select components'));
    fireEvent.click(screen.getByText('Item 1'));
    fireEvent.click(screen.getByText('Item 2'));

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('handles "Select all" functionality', async () => {
    render(
      <TestWrapper>
        <ComponentSelectMenu name="components" options={options} isMulti includeSelectAll />
      </TestWrapper>,
    );

    fireEvent.click(screen.getByText('Select components'));
    fireEvent.click(screen.getByText('Select all'));
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('renders with defaultSelected items checked', () => {
    const defaultSelected = [
      { componentName: 'Item 1', applicationName: 'Group1' },
    ] as CurrentComponentRef[];

    render(
      <TestWrapper>
        <ComponentSelectMenu
          name="components"
          options={groupedOptions}
          isMulti
          defaultSelected={defaultSelected}
        />
      </TestWrapper>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'toggle component menu' }));
    const checkbox = screen.getByRole('checkbox', { name: /Item 1/i });
    expect(checkbox).toBeChecked();
  });

  it('renders with disableItem', () => {
    const disableItem = (item: string) => item === 'Item 2';

    render(
      <TestWrapper>
        <ComponentSelectMenu
          name="components"
          options={groupedOptions}
          disableItem={disableItem}
          isMulti
        />
      </TestWrapper>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'toggle component menu' }));

    const item2 = screen.getByRole('menuitem', { name: 'Item 2' });
    expect(item2).toHaveClass('pf-m-disabled');
  });

  it('renders grouped options correctly', () => {
    render(
      <TestWrapper>
        <ComponentSelectMenu name="components" options={groupedOptions} />
      </TestWrapper>,
    );

    fireEvent.click(screen.getByText('Select components'));

    expect(screen.getByText('Group1')).toBeInTheDocument();
    expect(screen.getByText('Group2')).toBeInTheDocument();
  });
});
