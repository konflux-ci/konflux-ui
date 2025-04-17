import '@testing-library/jest-dom';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { useComponents } from '../../../hooks/useComponents';
import { formikRenderer } from '../../../utils/test-utils';
import { ComponentDropdown } from '../SecretsForm/ComponentDropdown';

jest.mock('../../../hooks/useComponents', () => ({
  useComponents: jest.fn(),
}));

const useComponentsMock = useComponents as jest.Mock;

describe('ComponentDropdown', () => {
  mockUseNamespaceHook('test-ns');

  it('should show loading indicator if components arent loaded', () => {
    useComponentsMock.mockReturnValue([[], false]);
    formikRenderer(<ComponentDropdown name="test" />, { targets: { application: 'app' } });
    expect(screen.getByText('Loading components...')).toBeVisible();
  });

  it('should show disable dropdown if application is not selected', () => {
    useComponentsMock.mockReturnValue([[], true]);
    formikRenderer(<ComponentDropdown name="test" />, { targets: { application: '' } });
    expect(screen.getByTestId('dropdown-toggle')).toHaveAttribute('aria-disabled', 'true');
  });

  it('should show dropdown if components are loaded', async () => {
    useComponentsMock.mockReturnValue([
      [{ metadata: { name: 'comp1' } }, { metadata: { name: 'comp2' } }],
      true,
    ]);
    formikRenderer(<ComponentDropdown name="test" />, {
      targets: { application: 'app' },
    });
    await act(() => fireEvent.click(screen.getByTestId('dropdown-toggle')));

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'All components' })).toBeVisible();
      expect(screen.getByRole('menuitem', { name: 'comp1' })).toBeVisible();
      expect(screen.getByRole('menuitem', { name: 'comp2' })).toBeVisible();
    });
  });

  it('should change the dropdown value', async () => {
    useComponentsMock.mockReturnValue([
      [{ metadata: { name: 'comp1' } }, { metadata: { name: 'comp2' } }],
      true,
    ]);

    formikRenderer(<ComponentDropdown name="test" />, { targets: { application: 'app' } });
    await act(() => fireEvent.click(screen.getByTestId('dropdown-toggle')));
    await act(() => fireEvent.click(screen.getByText('comp2')));
    await waitFor(() => {
      expect(screen.getByText('comp2'));
    });
  });
});
