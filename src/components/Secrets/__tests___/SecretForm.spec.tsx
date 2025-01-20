import { configure, fireEvent, screen, waitFor } from '@testing-library/react';
import { formikRenderer } from '../../../utils/test-utils';
import {
  existingSecrets,
  secretFormValues,
  secretFormValuesForSourceSecret,
} from '../__data__/mock-secrets';
import SecretForm from '../SecretForm';

configure({ testIdAttribute: 'data-test' });

describe('SecretForm', () => {
  it('should show correct fields based on selected auth type', async () => {
    formikRenderer(<SecretForm existingSecrets={existingSecrets} />, secretFormValues);
    await waitFor(() => {
      expect(screen.getByTestId('secret-form')).toBeInTheDocument();
      expect(screen.getByTestId('key-value-pair')).toBeInTheDocument();
    });
  });

  it('should set correct values', async () => {
    formikRenderer(<SecretForm existingSecrets={existingSecrets} />, secretFormValues);
    await waitFor(() => {
      expect(screen.getByTestId('key-0')).toBeInTheDocument();
      expect(screen.getByTestId('key-0').getAttribute('value')).toBe('test');
    });
    fireEvent.input(screen.getByTestId('key-0'), { target: { value: 'key1' } });
    await waitFor(() => {
      expect(screen.getByTestId('key-0').getAttribute('name')).toBe('image.keyValues.0.key');
      expect(screen.getByTestId('key-0').getAttribute('value')).toBe('key1');
    });
  });

  it('should show a file upload button', async () => {
    formikRenderer(<SecretForm existingSecrets={existingSecrets} />, secretFormValues);
    await waitFor(() => {
      expect(screen.getByText('Upload')).toBeInTheDocument();
    });
  });

  it('should add new Key value pair', async () => {
    formikRenderer(<SecretForm existingSecrets={existingSecrets} />, secretFormValues);
    await waitFor(() => {
      expect(screen.getByText('Add key/value')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Add key/value'));
    await waitFor(() => {
      expect(screen.getByTestId('key-1')).toBeInTheDocument();
    });
  });
});

describe('SecretForm SourceSecret', () => {
  it('should show correct fields for Source Secret', async () => {
    formikRenderer(
      <SecretForm existingSecrets={existingSecrets} />,
      secretFormValuesForSourceSecret,
    );
    await waitFor(() => {
      expect(screen.getByTestId('secret-form')).toBeInTheDocument();
      expect(screen.getByText('Host')).toBeInTheDocument();
      expect(screen.getByText('Repository')).toBeInTheDocument();
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
    });
  });

  it('should load with correct input values', async () => {
    formikRenderer(
      <SecretForm existingSecrets={existingSecrets} />,
      secretFormValuesForSourceSecret,
    );
    await waitFor(() => {
      expect(screen.getByTestId('secret-form')).toBeInTheDocument();
      expect(screen.getByTestId('secret-source-username').getAttribute('value')).toBe(
        'username-test',
      );
      expect(screen.getByTestId('secret-source-password').getAttribute('value')).toBe(
        'password-test',
      );
    });
  });

  it('should load update correct input values', async () => {
    formikRenderer(
      <SecretForm existingSecrets={existingSecrets} />,
      secretFormValuesForSourceSecret,
    );

    await waitFor(() => {
      expect(screen.getByTestId('secret-form')).toBeInTheDocument();
      expect(screen.getByTestId('secret-source-username')).toBeInTheDocument();
      expect(screen.getByTestId('secret-source-password')).toBeInTheDocument();
    });

    fireEvent.input(screen.getByTestId('secret-source-username'), {
      target: { value: 'username-changed' },
    });

    fireEvent.input(screen.getByTestId('secret-source-password'), {
      target: { value: 'password-changed' },
    });

    await waitFor(() => {
      expect(screen.getByTestId('secret-form')).toBeInTheDocument();
      expect(screen.getByTestId('secret-source-username').getAttribute('value')).toBe(
        'username-changed',
      );
      expect(screen.getByTestId('secret-source-password').getAttribute('value')).toBe(
        'password-changed',
      );
    });
  });
});
