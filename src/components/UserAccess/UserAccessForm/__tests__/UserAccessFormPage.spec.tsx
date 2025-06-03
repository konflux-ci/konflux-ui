import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import identity from 'lodash-es/identity';
import { defaultKonfluxRoleMap } from '../../../../__data__/role-data';
import { mockRoleBinding } from '../../../../__data__/rolebinding-data';
import { useRoleMap } from '../../../../hooks/useRole';
import { createK8sWatchResourceMock, namespaceRenderer } from '../../../../utils/test-utils';
import { createRBs, editRB } from '../form-utils';
import { UserAccessFormPage } from '../UserAccessFormPage';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: identity })),
}));

jest.mock('../../../../utils/analytics', () => ({
  ...jest.requireActual('../../../../utils/analytics'),
  useTrackEvent: jest.fn(() => jest.fn),
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
  createRBs: jest.fn(),
  editRB: jest.fn(),
}));

jest.mock('../../../../hooks/useRole', () => ({
  useRoleMap: jest.fn(),
}));

const watchMock = createK8sWatchResourceMock();
const createRBsMock = createRBs as jest.Mock;
const editRBsMock = editRB as jest.Mock;

describe('UserAccessFormPage', () => {
  const mockUseRoleMap = useRoleMap as jest.Mock;
  beforeEach(() => {
    mockUseRoleMap.mockReturnValue([defaultKonfluxRoleMap, true, null]);
    watchMock.mockReturnValue([[], true]);
  });

  afterEach(jest.clearAllMocks);

  it('should create resources on submit', async () => {
    createRBsMock.mockResolvedValue({});
    namespaceRenderer(<UserAccessFormPage />, 'test-ns', {
      namespace: 'test-ns',
    });
    expect(screen.getByText('Grant access to namespace, test-ns')).toBeVisible();
    act(() => {
      const inputElement = screen.getByRole('searchbox');
      fireEvent.change(inputElement, { target: { value: 'user1' } });
      fireEvent.keyDown(inputElement, { key: 'Enter', code: 'Enter', charCode: 13 });
    });
    await act(() => fireEvent.click(screen.getByText('Select role')));
    await act(() => fireEvent.click(screen.getByText('Maintainer')));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Grant access' })).toBeEnabled());
    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Grant access' })));
    expect(createRBsMock).toHaveBeenCalledTimes(2);
    expect(createRBsMock).toHaveBeenCalledWith(
      { role: 'Maintainer', usernames: ['user1'], roleMap: defaultKonfluxRoleMap },
      'test-ns',
    );
  });

  it('should report error when just assign role when granting', async () => {
    createRBsMock.mockResolvedValue({});
    namespaceRenderer(<UserAccessFormPage />, 'test-ns', {
      namespace: 'test-ns',
    });
    expect(screen.getByText('Grant access to namespace, test-ns')).toBeVisible();
    await act(() => fireEvent.click(screen.getByText('Select role')));
    await act(() => fireEvent.click(screen.getByText('Maintainer')));
    expect(screen.getByText('Must have at least 1 username.')).toBeVisible();
  });

  it('should update resources when existing rb is provided', async () => {
    namespaceRenderer(<UserAccessFormPage existingRb={mockRoleBinding} edit />, 'test-ns');
    expect(screen.getByText('Edit access to namespace, test-ns')).toBeVisible();
    expect(screen.getByRole('searchbox')).toBeDisabled();
    await act(() => fireEvent.click(screen.getByText('Contributor')));
    await act(() => fireEvent.click(screen.getByText('Maintainer')));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled());
    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Save changes' })));
    expect(editRBsMock).toHaveBeenCalledTimes(2);
    expect(editRBsMock).toHaveBeenCalledWith(
      { role: 'Maintainer', usernames: ['user1'], roleMap: defaultKonfluxRoleMap },
      mockRoleBinding,
    );
  });

  it('should handle undefined subjects in role bindings', () => {
    namespaceRenderer(
      <UserAccessFormPage existingRb={{ ...mockRoleBinding, subjects: undefined }} edit />,
      'test-ns',
    );
    expect(screen.getByText('Edit access to namespace, test-ns')).toBeVisible();
    expect(screen.getByRole('searchbox')).not.toBeDisabled();
  });
});
