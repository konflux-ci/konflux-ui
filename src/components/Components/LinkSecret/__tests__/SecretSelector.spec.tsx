import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SecretKind, SecretType } from '~/types';
import { formikRenderer } from '~/unit-test-utils';
import { linkSecretsToBuildServiceAccount } from '~/utils/service-account/service-account-utils';
import { SecretSelector } from '../SecretSelector';

jest.mock('react-router-dom', () => ({
  useParams: () => ({
    componentName: 'test-component',
  }),
}));

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespace: () => 'test-namespace',
}));

jest.mock('~/hooks/useSecrets', () => ({
  useSecrets: jest.fn(),
}));

jest.mock('~/hooks/useLinkedSecrets', () => ({
  useLinkedSecrets: jest.fn(),
}));

jest.mock('~/utils/service-account/service-account-utils', () => ({
  linkSecretsToBuildServiceAccount: jest.fn(),
}));

const testSecrets: SecretKind[] = [
  {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: { name: 'secret-a', namespace: 'test-namespace' },
    type: SecretType.opaque,
  },
  {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: { name: 'secret-b', namespace: 'test-namespace' },
    type: SecretType.opaque,
  },
];

describe('SecretSelector', () => {
  const renderSelector = (onClose: () => void) => {
    const { useSecrets } = jest.requireMock('~/hooks/useSecrets');
    const { useLinkedSecrets } = jest.requireMock('~/hooks/useLinkedSecrets');
    useSecrets.mockReturnValue([testSecrets, true, undefined]);
    useLinkedSecrets.mockReturnValue([[], true, undefined]);
    return formikRenderer(<SecretSelector onClose={onClose} />, { relatedSecrets: [] });
  };

  const selectFirstSecret = async () => {
    const user = userEvent.setup();
    await user.click(screen.getByText('Select secrets'));
    await user.click(screen.getByRole('checkbox', { name: /secret-a/ }));
    return user;
  };

  it('should call onClose when linking succeeds', async () => {
    (linkSecretsToBuildServiceAccount as jest.Mock).mockResolvedValue(undefined);
    const onClose = jest.fn();
    renderSelector(onClose);

    const user = await selectFirstSecret();
    await user.click(screen.getByRole('button', { name: 'Link Secrets' }));

    expect(linkSecretsToBuildServiceAccount).toHaveBeenCalledWith([testSecrets[0]], {
      metadata: { name: 'test-component', namespace: 'test-namespace' },
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('should show an error and keep the modal open when linking fails', async () => {
    (linkSecretsToBuildServiceAccount as jest.Mock).mockRejectedValue(new Error('boom'));
    const onClose = jest.fn();
    renderSelector(onClose);

    const user = await selectFirstSecret();
    await user.click(screen.getByRole('button', { name: 'Link Secrets' }));

    expect(screen.getByTestId('link-secrets-error')).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
