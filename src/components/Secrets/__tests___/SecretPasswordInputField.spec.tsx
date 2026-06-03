import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { mockSourceSecretBasicAuthForEdit } from '~/components/Secrets/__data__/mock-secrets';
import { SecretEditSensitiveProvider } from '~/components/Secrets/SecretsForm/SecretEditSensitiveContext';
import { SecretPasswordInputField } from '~/components/Secrets/SecretsForm/SecretPasswordInputField';
import { formikRenderer } from '~/unit-test-utils';

const sensitiveContextValue = {
  fullSecret: mockSourceSecretBasicAuthForEdit,
  isLoadingFullSecret: false,
  requestFullSecret: jest.fn(),
  clearFullSecretAndSensitiveFields: jest.fn(),
};

describe('SecretPasswordInputField', () => {
  it('does not show visibility toggle outside edit sensitive context', () => {
    formikRenderer(<SecretPasswordInputField name="source.password" label="Password" />, {
      source: { password: '' },
    });

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(screen.queryByRole('button', { name: 'Show password' })).not.toBeInTheDocument();
  });

  it('shows visibility toggle when full secret is loaded', async () => {
    const user = userEvent.setup();
    formikRenderer(
      <SecretEditSensitiveProvider value={sensitiveContextValue}>
        <SecretPasswordInputField name="source.password" label="Password" />
      </SecretEditSensitiveProvider>,
      { source: { password: 'gitpass' } },
    );

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveValue('gitpass');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
