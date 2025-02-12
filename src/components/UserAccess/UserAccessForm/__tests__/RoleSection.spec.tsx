import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import { defaultKonfluxRoleMap } from '../../../../__data__/role-data';
import { useRoleMap } from '../../../../hooks/useRole';
import { formikRenderer } from '../../../../utils/test-utils';
import { RoleSection } from '../RoleSection';

jest.mock('../../../../hooks/useRole', () => ({
  useRoleMap: jest.fn(),
}));

describe('RoleSection', () => {
  const mockUseRoleMap = useRoleMap as jest.Mock;
  beforeEach(() => {
    mockUseRoleMap.mockReturnValue([defaultKonfluxRoleMap, false, null]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading if rolemap is not ready', () => {
    mockUseRoleMap.mockReturnValue([defaultKonfluxRoleMap, true, null]);
    formikRenderer(<RoleSection />, { role: '' });
    expect(screen.getByText('Loading...')).toBeVisible();
    const dropdownButton = screen.getByTestId('dropdown-toggle');
    expect(dropdownButton).toBeDisabled();
  });

  it('should not render permissions if role is not selected', () => {
    formikRenderer(<RoleSection />, { role: '' });
    expect(screen.getByText('Select role')).toBeVisible();
    expect(
      screen.getByText('Select a role to assign to all of the users you added.'),
    ).toBeVisible();
    expect(screen.queryByText('Show list of permissions')).toBeNull();
  });

  it('should render permissions if role is selected', async () => {
    formikRenderer(<RoleSection />, { role: '' });
    act(() => {
      fireEvent.click(screen.getByText('Select role'));
    });
    await waitFor(() => {
      expect(screen.getByText('contributor')).toBeVisible();
      expect(screen.getByText('maintainer')).toBeVisible();
      expect(screen.getByText('admin')).toBeVisible();
    });
    act(() => {
      fireEvent.click(screen.getByText('maintainer'));
    });
    await waitFor(() => {
      fireEvent.click(screen.getByText('maintainer'));
      expect(screen.getByText('Show list of permissions for the maintainer')).toBeVisible();
    });

    act(() => {
      fireEvent.click(screen.getByText('contributor'));
      fireEvent.click(screen.getByText('admin'));
    });
    await waitFor(() => {
      fireEvent.click(screen.getByText('admin'));
      expect(screen.getByText('Show list of permissions for the admin')).toBeVisible();
    });
  });
});
