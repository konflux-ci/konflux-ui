import { fireEvent } from '@testing-library/dom';
import { FormikProps } from 'formik';
import { createUseWorkspaceInfoMock, formikRenderer } from '../../../../../utils/test-utils';
import { ReleasePlanForm } from '../ReleasePlanForm';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/path/name' }),
  Link: (props) => <a href={props.to}>{props.children}</a>,
  useNavigate: () => jest.fn(),
}));

jest.mock('../../../../../hooks/useApplications', () => ({
  useApplications: jest.fn(() => [[], true]),
}));

jest.mock('../../../../../shared/hooks/useScrollShadows', () => ({
  useScrollShadows: jest.fn().mockReturnValue('none'),
}));

describe('ReleasePlanForm', () => {
  createUseWorkspaceInfoMock({ namespace: 'test-ns', workspace: 'test-ws' });

  it('should show create form if edit flag is not provided', () => {
    const values = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props = { values } as FormikProps<any>;
    const result = formikRenderer(<ReleasePlanForm {...props} />, values);
    expect(result.getByRole('heading', { name: 'Create release plan' })).toBeVisible();
    expect(result.getByRole('button', { name: 'Create' })).toBeVisible();
    expect(result.getByRole('button', { name: 'Create' })).toBeVisible();
    expect(result.getByRole('radio', { name: 'In this namespace: test-ns' })).toBeVisible();
    expect(result.getByRole('radio', { name: 'In a target namespace' })).toBeVisible();
    expect(result.getByRole('checkbox', { name: 'Auto release' })).toBeVisible();
    expect(result.getByRole('checkbox', { name: 'Standing attribution' })).toBeVisible();
    expect(result.getByRole('textbox', { name: 'Release plan name' })).toBeVisible();
    const breadcrumbLink = result.getByRole('link', { name: /release/i });
    fireEvent.click(breadcrumbLink);
    expect(breadcrumbLink).toHaveAttribute('href', '/workspaces/test-ws/release');
  });

  it('should show edit form if edit flag is provided', () => {
    const values = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props = { values } as FormikProps<any>;
    const result = formikRenderer(<ReleasePlanForm {...props} edit />, values);
    expect(result.getByRole('heading', { name: 'Edit release plan' })).toBeVisible();
    expect(result.getByRole('button', { name: 'Save' })).toBeVisible();
    expect(result.getByRole('textbox', { name: 'Release plan name' })).toBeDisabled();
  });
});
