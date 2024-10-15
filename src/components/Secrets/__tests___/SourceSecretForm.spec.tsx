import { act, fireEvent, screen } from '@testing-library/react';
import { formikRenderer } from '../../../utils/test-utils';
import { SourceSecretForm } from '../SecretsForm/SourceSecretForm';

const initialValues = {
  source: {
    authType: 'Basic authentication',
  },
};

describe('SourceSecretForm', () => {
  it('should show correct fields based on selected auth type', () => {
    formikRenderer(<SourceSecretForm />, initialValues);
    expect(screen.getByText('Authentication type')).toBeVisible();
    expect(screen.getByText('Username')).toBeVisible();
    expect(screen.getByText('Password')).toBeVisible();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Basic authentication' }));
    });

    act(() => {
      fireEvent.click(screen.getByText('SSH Key'));
    });

    expect(screen.getByText('SSH private key')).toBeVisible();
  });
});
