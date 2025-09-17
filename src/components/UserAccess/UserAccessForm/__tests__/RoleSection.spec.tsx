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
    mockUseRoleMap.mockReturnValue([defaultKonfluxRoleMap, true, null]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading if rolemap is not ready', () => {
    mockUseRoleMap.mockReturnValue([defaultKonfluxRoleMap, false, null]);
    formikRenderer(<RoleSection />, { role: '' });
    expect(screen.getByText('Loading...')).toBeVisible();
    const dropdownButton = screen.getByTestId('dropdown-toggle');
    expect(dropdownButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('should show error if role map fails to load', () => {
    mockUseRoleMap.mockReturnValue([undefined, true, { code: 451 }]);
    formikRenderer(<RoleSection />, { role: '' });
    expect(screen.getByText('Unable to load roles')).toBeVisible();
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
      expect(screen.getByText('Contributor')).toBeVisible();
      expect(screen.getByText('Maintainer')).toBeVisible();
      expect(screen.getByText('Admin')).toBeVisible();
    });
    act(() => {
      fireEvent.click(screen.getByText('Maintainer'));
    });
    await waitFor(() => {
      fireEvent.click(screen.getByText('Maintainer'));
      expect(screen.getByText('Show list of permissions for the Maintainer')).toBeVisible();
    });

    act(() => {
      fireEvent.click(screen.getByText('Contributor'));
      fireEvent.click(screen.getByText('Admin'));
    });
    await waitFor(() => {
      fireEvent.click(screen.getByText('Admin'));
      expect(screen.getByText('Show list of permissions for the Admin')).toBeVisible();
    });
  });
});
