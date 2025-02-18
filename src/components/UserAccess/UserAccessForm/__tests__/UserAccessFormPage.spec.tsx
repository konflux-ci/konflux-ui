import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import identity from 'lodash-es/identity';
import { SpaceBindingRequest, Workspace } from '../../../../types';
import { namespaceRenderer } from '../../../../utils/test-utils';
import { createSBRs, editSBR, validateUsername } from '../form-utils';
import { UserAccessFormPage } from '../UserAccessFormPage';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: identity })),
}));

jest.mock('../../../../utils/analytics', () => ({
  ...jest.requireActual('../../../../utils/analytics'),
  useTrackEvent: jest.fn(() => jest.fn),
}));

jest.mock('../../../../utils/breadcrumb-utils', () => ({
  useWorkspaceBreadcrumbs: jest.fn(() => []),
}));

jest.mock('../../../../shared/hooks/useScrollShadows', () => ({
  useScrollShadows: jest.fn().mockReturnValue('none'),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../form-utils', () => ({
  ...jest.requireActual('../form-utils'),
  validateUsername: jest.fn(),
  createSBRs: jest.fn(),
  editSBR: jest.fn(),
}));

const createSBRsMock = createSBRs as jest.Mock;
const editSBRsMock = editSBR as jest.Mock;
const validateUsernameMock = validateUsername as jest.Mock;

describe('UserAccessFormPage', () => {
  // beforeEach(jest.useFakeTimers);
  afterEach(jest.clearAllMocks);

  // afterEach(() => {
  //   jest.useRealTimers();
  // });

  it('should create resources on submit', async () => {
    createSBRsMock.mockResolvedValue({});
    validateUsernameMock.mockResolvedValue(true);
    namespaceRenderer(<UserAccessFormPage />, 'test-ns', {
      workspace: 'test-ws',
      workspaceResource: {} as Workspace,
    });
    expect(screen.getByText('Grant access to namespace, test-ws')).toBeVisible();
    await act(() => fireEvent.input(screen.getByRole('searchbox'), { target: { value: 'user1' } }));
    // act(() => jest.runAllTimers());
    await act(() => fireEvent.click(screen.getByText('Select role')));
    await act(() => fireEvent.click(screen.getByText('maintainer')));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Grant access' })).toBeEnabled());
    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Grant access' })));
    expect(createSBRsMock).toHaveBeenCalledTimes(2);
    expect(createSBRsMock).toHaveBeenCalledWith(
      { role: 'maintainer', usernames: ['user1'] },
      'test-ns',
    );
  });

  it('should create resources for edit when existing sbr is not available', async () => {
    validateUsernameMock.mockResolvedValue(true);
    namespaceRenderer(<UserAccessFormPage username="myuser" edit />, 'test-ns', {
      workspace: 'test-ws',
      workspaceResource: {} as Workspace,
    });
    expect(screen.getByText('Edit access to namespace, test-ws')).toBeVisible();
    expect(screen.getByRole('searchbox')).toBeDisabled();
    await act(() => fireEvent.click(screen.getByText('Select role')));
    await act(() => fireEvent.click(screen.getByText('maintainer')));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled());
    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Save changes' })));
    expect(createSBRsMock).toHaveBeenCalledTimes(2);
    expect(createSBRsMock).toHaveBeenCalledWith(
      { role: 'maintainer', usernames: ['myuser'] },
      'test-ns',
    );
  });

  it('should update resources when existing sbr is provided', async () => {
    editSBRsMock.mockResolvedValue({});
    validateUsernameMock.mockResolvedValue(true);
    const mockSBR: SpaceBindingRequest = {
      apiVersion: 'appstudio.redhat.com/v1alpha1',
      kind: 'SpaceBindingRequest',
      metadata: {
        name: 'test-sbr',
      },
      spec: {
        masterUserRecord: 'user1',
        spaceRole: 'contributor',
      },
    };
    namespaceRenderer(
      <UserAccessFormPage username="user1" existingSbr={mockSBR} edit />,
      'test-ns',
      {
        workspace: 'test-ws',
        workspaceResource: {} as Workspace,
      },
    );
    expect(screen.getByRole('searchbox')).toBeDisabled();
    await act(() => fireEvent.click(screen.getByText('contributor')));
    await act(() => fireEvent.click(screen.getByText('maintainer')));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled());
    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Save changes' })));
    expect(editSBRsMock).toHaveBeenCalledTimes(2);
    expect(editSBRsMock).toHaveBeenCalledWith(
      { role: 'maintainer', usernames: ['user1'] },
      mockSBR,
    );
  });
});
