import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { useApplications } from '../../../hooks/useApplications';
import { formikRenderer } from '../../../utils/test-utils';
import { ApplicationDropdown } from '../SecretsForm/ApplicationDropdown';

jest.mock('../../../hooks/useApplications', () => ({
  useApplications: jest.fn(),
}));

const useApplicationsMock = useApplications as jest.Mock;

describe('ApplicationDropdown', () => {
  beforeEach(() => {});

  it('should show loading indicator if applications arent loaded', () => {
    useApplicationsMock.mockReturnValue([[], false]);
    formikRenderer(<ApplicationDropdown name="app" />);
    expect(screen.getByText('Loading applications...')).toBeVisible();
  });

  it('should show error message if applications arent loaded', async () => {
    useApplicationsMock.mockReturnValue([undefined, true, Error()]);
    formikRenderer(<ApplicationDropdown name="app" />);
    await act(() => fireEvent.click(screen.getByTestId('dropdown-toggle')));
    await waitFor(() => {
      const errorMenuItem = screen.getByRole('menuitem', { name: 'Unable to load applications' });
      expect(errorMenuItem).toBeVisible();
      expect(errorMenuItem).toHaveClass('pf-m-disabled');
    });
  });

  it('should show dropdown if applications are loaded', async () => {
    useApplicationsMock.mockReturnValue([
      [{ metadata: { name: 'app1' } }, { metadata: { name: 'app2' } }],
      true,
    ]);
    formikRenderer(<ApplicationDropdown name="app" />);
    await act(() => fireEvent.click(screen.getByTestId('dropdown-toggle')));
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'app1' })).toBeVisible();
      expect(screen.getByRole('menuitem', { name: 'app2' })).toBeVisible();
    });
  });

  it('should change the application dropdown value', async () => {
    useApplicationsMock.mockReturnValue([
      [{ metadata: { name: 'app1' } }, { metadata: { name: 'app2' } }],
      true,
    ]);

    formikRenderer(<ApplicationDropdown name="targets.application" />, {
      targets: { application: 'app' },
    });
    await act(() => fireEvent.click(screen.getByTestId('dropdown-toggle')));

    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toEqual(2);
      screen.getByText('app2');
    });
    await act(() => fireEvent.click(screen.getByText('app2')));
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-toggle').textContent).toEqual('app2');
    });
  });
});
