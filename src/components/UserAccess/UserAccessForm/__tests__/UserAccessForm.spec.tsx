import { screen } from '@testing-library/react';
import { FormikProps } from 'formik';
import { createUseWorkspaceInfoMock, formikRenderer } from '../../../../utils/test-utils';
import { UserAccessFormValues } from '../form-utils';
import { UserAccessForm } from '../UserAccessForm';

jest.mock('../../../../utils/breadcrumb-utils', () => ({
  useWorkspaceBreadcrumbs: jest.fn(() => []),
}));

jest.mock('../../../../shared/hooks/useScrollShadows', () => ({
  useScrollShadows: jest.fn().mockReturnValue('none'),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

describe('UserAccessForm', () => {
  createUseWorkspaceInfoMock({ workspace: 'test-ws' });

  it('should show create form', () => {
    const values = { usernames: [], role: null };
    const props = { values } as FormikProps<UserAccessFormValues>;
    formikRenderer(<UserAccessForm {...props} />, values);
    expect(screen.getByText('Grant access to namespace, test-ws')).toBeVisible();
    expect(
      screen.getByText(
        'Invite users to collaborate with you by granting them access to your namespace.',
      ),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Grant access' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Grant access' })).toBeDisabled();
  });

  it('should show edit form', () => {
    const values = { usernames: [], role: null };
    const props = { values } as FormikProps<UserAccessFormValues>;
    formikRenderer(<UserAccessForm {...props} edit />, values);
    expect(screen.getByText('Edit access to namespace, test-ws')).toBeVisible();
    expect(
      screen.getByText(
        'Change permissions for this user by adding a role or removing a current role.',
      ),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    expect(screen.getByRole('searchbox')).toBeDisabled();
  });
});
