import { fireEvent, screen } from '@testing-library/react';
import { mockSourceSecretBasicAuthForEdit } from '~/components/Secrets/__data__/mock-secrets';
import { SecretEditSensitiveProvider } from '~/components/Secrets/SecretsForm/SecretEditSensitiveContext';
import { SecretPasswordInputField } from '~/components/Secrets/SecretsForm/SecretPasswordInputField';
import { formikRenderer } from '~/utils/test-utils';

const sensitiveContextValue = {
  fullSecret: mockSourceSecretBasicAuthForEdit,
  isLoadingFullSecret: false,
  requestFullSecret: jest.fn(),
  clearFullSecretAndSensitiveFields: jest.fn(),
};

describe('SecretPasswordInputField', () => {
  it('renders a standard password field when full secret is not loaded', () => {
    formikRenderer(
      <SecretPasswordInputField
        name="source.password"
        label="Password"
        data-test="secret-source-password"
      />,
      { source: { password: '' } },
    );

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(screen.queryByRole('button', { name: 'Show password' })).not.toBeInTheDocument();
  });

  it('shows a visibility toggle when full secret is loaded', () => {
    formikRenderer(
      <SecretEditSensitiveProvider value={sensitiveContextValue}>
        <SecretPasswordInputField
          name="source.password"
          label="Password"
          data-test="secret-source-password"
        />
      </SecretEditSensitiveProvider>,
      { source: { password: 'gitpass' } },
    );

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveValue('gitpass');

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
