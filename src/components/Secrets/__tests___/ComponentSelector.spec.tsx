import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useFormik, FormikProvider } from 'formik';
import { useSortedGroupComponents } from '~/hooks/useComponents';
import { useNamespace } from '~/shared/providers/Namespace';
import { ComponentSelector } from '../SecretsForm/ComponentSelector';

jest.mock('~/hooks/useComponents');
jest.mock('~/shared/providers/Namespace');

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const formikBag = useFormik({
    initialValues: { relatedComponents: [] },
    onSubmit: () => {},
  });

  return <FormikProvider value={formikBag}>{children}</FormikProvider>;
};

describe('ComponentSelector', () => {
  const mockNamespace = 'test-namespace';
  const mockSortedGroupedComponents = {
    Group1: ['ComponentA', 'ComponentB'],
    Group2: ['ComponentC'],
  };

  beforeEach(() => {
    (useNamespace as jest.Mock).mockReturnValue(mockNamespace);
    (useSortedGroupComponents as jest.Mock).mockReturnValue([
      mockSortedGroupedComponents,
      true,
      null,
    ]);
  });

  it('renders the title correctly', () => {
    render(
      <TestWrapper>
        <ComponentSelector />
      </TestWrapper>,
    );

    expect(screen.getByText('Components')).toBeInTheDocument();
  });

  it('renders the help text correctly', () => {
    render(
      <TestWrapper>
        <ComponentSelector />
      </TestWrapper>,
    );

    expect(
      screen.getByText('Tell us the components you want to link this secret to'),
    ).toBeInTheDocument();
  });

  it('renders the ComponentSelectMenu with correct props', () => {
    render(
      <TestWrapper>
        <ComponentSelector />
      </TestWrapper>,
    );

    const componentSelectMenu = screen.getByTestId('component-select-menu');
    expect(componentSelectMenu).toBeInTheDocument();
    expect(screen.getByText('Selecting')).toBeInTheDocument();
  });

  it('displays grouped options in ComponentSelectMenu', async () => {
    render(
      <TestWrapper>
        <ComponentSelector />
      </TestWrapper>,
    );

    fireEvent.click(screen.getByText('Selecting'));
    await waitFor(() => {
      expect(screen.getByText('Group1')).toBeInTheDocument();
      expect(screen.getByText('Group2')).toBeInTheDocument();
      expect(screen.getByText('ComponentA')).toBeInTheDocument();
      expect(screen.getByText('ComponentB')).toBeInTheDocument();
      expect(screen.getByText('ComponentC')).toBeInTheDocument();
    });
  });

  it('handles "Select all" functionality', async () => {
    render(
      <TestWrapper>
        <ComponentSelector />
      </TestWrapper>,
    );

    fireEvent.click(screen.getByText('Selecting'));
    fireEvent.click(screen.getByText('Select all'));
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('allows selecting multiple items in multi-select mode', async () => {
    render(
      <TestWrapper>
        <ComponentSelector />
      </TestWrapper>,
    );

    fireEvent.click(screen.getByText('Selecting'));
    fireEvent.click(screen.getByText('ComponentA'));
    fireEvent.click(screen.getByText('ComponentC'));
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });
});
