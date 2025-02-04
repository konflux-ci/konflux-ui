import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import { useSecrets } from '../../../../hooks/useSecrets';
import { useAccessReviewForModels } from '../../../../utils/rbac';
import { createK8sWatchResourceMock, formikRenderer } from '../../../../utils/test-utils';
import SecretSection from '../SecretSection';

jest.mock('../../../../utils/rbac', () => ({
  useAccessReviewForModels: jest.fn(),
}));

jest.mock('../../../../hooks/useSecrets', () => ({
  useSecrets: jest.fn(),
}));

const watchResourceMock = createK8sWatchResourceMock();
const accessReviewMock = useAccessReviewForModels as jest.Mock;
const useSecretsMock = useSecrets as jest.Mock;

describe('SecretSection', () => {
  beforeEach(() => {
    watchResourceMock.mockReturnValue([[], true]);
    accessReviewMock.mockReturnValue([true, true]);
    useSecretsMock.mockReturnValue([
      [
        {
          metadata: {
            name: 'snyk-secret',
            namespace: 'test-ws',
          },
          data: {
            'snyk-token': 'c255ay1zZWNyZXQ=',
          },
          type: 'Opaque',
          apiVersion: 'v1',
          kind: 'Secret',
        },
      ],
      true,
    ]);
  });

  it('should render secret section', () => {
    formikRenderer(<SecretSection />, {});

    screen.getByText('Build time secret');
    screen.getByTestId('add-secret-button');
  });

  it('should render secret section, secret do not load yet', () => {
    useSecretsMock.mockReturnValue([[], false]);
    formikRenderer(<SecretSection />, {});

    screen.getByText('Build time secret');
    screen.getByTestId('add-secret-button');
  });

  it('should render secret section with empty list of secrets', () => {
    useSecretsMock.mockReturnValue([[], true]);
    formikRenderer(<SecretSection />, {});

    screen.getByText('Build time secret');
    screen.getByTestId('add-secret-button');
  });

  it('should render added secrets in removable lists', () => {
    formikRenderer(<SecretSection />, { newSecrets: ['secret-one', 'secret-two'] });

    expect(screen.queryByDisplayValue('secret-one')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('secret-two')).toBeInTheDocument();
  });

  it('should be able to remove the newly added secrets from the list', async () => {
    formikRenderer(<SecretSection />, {
      importSecrets: [],
      newSecrets: ['secret-one', 'secret-two'],
    });

    expect(screen.queryByDisplayValue('secret-one')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('secret-two')).toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByTestId('newSecrets-1-remove-button'));
    });

    await waitFor(() => {
      expect(screen.queryByDisplayValue('secret-two')).not.toBeInTheDocument();
    });
  });

  it('should not allow adding secrets if user does not have create access', () => {
    accessReviewMock.mockReturnValue([false, true]);
    formikRenderer(<SecretSection />, {});
    expect(screen.getByRole('button', { name: 'Add secret' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});
