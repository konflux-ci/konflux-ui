import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { Base64 } from 'js-base64';
import { formikRenderer } from '../../../utils/test-utils';
import { ImagePullSecretForm } from '../SecretsForm/ImagePullSecretForm';

const initialValues = {
  image: {
    authType: 'Image registry credentials',
  },
};

const uploadConfigInitialValues = {
  image: {
    authType: 'Upload configuration file',
    dockerconfig: '',
  },
};

// Valid docker config with correct auth format (username:password)
const validDockerConfig = {
  auths: {
    'registry.redhat.io': {
      auth: Base64.encode('testuser:testpassword'),
    },
  },
};

// Invalid docker config with wrong auth format
const invalidDockerConfig = {
  auths: {
    'registry.redhat.io': {
      auth: Base64.encode('invalid-no-colon'),
    },
  },
};

// Docker config with corrupted base64
const corruptedDockerConfig = {
  auths: {
    'registry.redhat.io': {
      auth: 'not-valid-base64!!!',
    },
  },
};

// Docker config with missing auth field
const missingAuthDockerConfig = {
  auths: {
    'registry.redhat.io': {},
  },
};

describe('ImagePullSecretForm', () => {
  it('should show correct fields based on selected auth type', () => {
    formikRenderer(<ImagePullSecretForm />, initialValues);
    expect(screen.getByText('Authentication type')).toBeVisible();

    act(() => {
      expect(screen.getByTestId('dropdown-toggle').textContent).toBe('Image registry credentials');
      fireEvent.click(screen.getByTestId('dropdown-toggle'));
    });

    act(() => {
      fireEvent.click(screen.getByText('Upload configuration file'));
    });

    expect(screen.getByText('Upload a .dockercfg or .docker/config.json file')).toBeVisible();
  });

  it('should show file upload field when upload config file is selected', () => {
    formikRenderer(<ImagePullSecretForm />, uploadConfigInitialValues);
    expect(screen.getByText('Upload a .dockercfg or .docker/config.json file')).toBeVisible();
    expect(
      screen.getByText(
        'This file contains configuration details and credentials to connect to a secure image registry',
      ),
    ).toBeVisible();
  });

  it('should show success alert for valid credentials format', async () => {
    formikRenderer(<ImagePullSecretForm />, uploadConfigInitialValues);

    const textarea = screen.getByRole('textbox', { name: 'File upload' });
    act(() => {
      fireEvent.change(textarea, {
        target: { value: JSON.stringify(validDockerConfig) },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('registry.redhat.io: Valid credentials format')).toBeVisible();
    });
  });

  it('should show danger alert for invalid credentials format', async () => {
    formikRenderer(<ImagePullSecretForm />, uploadConfigInitialValues);

    const textarea = screen.getByRole('textbox', { name: 'File upload' });
    act(() => {
      fireEvent.change(textarea, {
        target: { value: JSON.stringify(invalidDockerConfig) },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('registry.redhat.io: Invalid credentials format')).toBeVisible();
    });
  });

  it('should show danger alert for corrupted base64 auth', async () => {
    formikRenderer(<ImagePullSecretForm />, uploadConfigInitialValues);

    const textarea = screen.getByRole('textbox', { name: 'File upload' });
    act(() => {
      fireEvent.change(textarea, {
        target: { value: JSON.stringify(corruptedDockerConfig) },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('registry.redhat.io: Invalid credentials format')).toBeVisible();
    });
  });

  it('should show danger alert for missing auth field', async () => {
    formikRenderer(<ImagePullSecretForm />, uploadConfigInitialValues);

    const textarea = screen.getByRole('textbox', { name: 'File upload' });
    act(() => {
      fireEvent.change(textarea, {
        target: { value: JSON.stringify(missingAuthDockerConfig) },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('registry.redhat.io: Invalid credentials format')).toBeVisible();
    });
  });

  it('should clear validations when content is cleared', async () => {
    formikRenderer(<ImagePullSecretForm />, uploadConfigInitialValues);

    const textarea = screen.getByRole('textbox', { name: 'File upload' });

    // First add valid content
    act(() => {
      fireEvent.change(textarea, {
        target: { value: JSON.stringify(validDockerConfig) },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('registry.redhat.io: Valid credentials format')).toBeVisible();
    });

    // Then clear it
    act(() => {
      fireEvent.change(textarea, {
        target: { value: '' },
      });
    });

    await waitFor(() => {
      expect(
        screen.queryByText('registry.redhat.io: Valid credentials format'),
      ).not.toBeInTheDocument();
    });
  });

  it('should handle invalid JSON gracefully', async () => {
    formikRenderer(<ImagePullSecretForm />, uploadConfigInitialValues);

    const textarea = screen.getByRole('textbox', { name: 'File upload' });
    act(() => {
      fireEvent.change(textarea, {
        target: { value: 'not valid json {{{' },
      });
    });

    // Should not crash and should not show any validation alerts
    await waitFor(() => {
      expect(
        screen.queryByText(/Valid credentials format|Invalid credentials format/),
      ).not.toBeInTheDocument();
    });
  });

  it('should validate multiple registries', async () => {
    const multiRegistryConfig = {
      auths: {
        'registry.redhat.io': {
          auth: Base64.encode('user1:pass1'),
        },
        'quay.io': {
          auth: Base64.encode('invalid-no-colon'),
        },
      },
    };

    formikRenderer(<ImagePullSecretForm />, uploadConfigInitialValues);

    const textarea = screen.getByRole('textbox', { name: 'File upload' });
    act(() => {
      fireEvent.change(textarea, {
        target: { value: JSON.stringify(multiRegistryConfig) },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('registry.redhat.io: Valid credentials format')).toBeVisible();
      expect(screen.getByText('quay.io: Invalid credentials format')).toBeVisible();
    });
  });
});
