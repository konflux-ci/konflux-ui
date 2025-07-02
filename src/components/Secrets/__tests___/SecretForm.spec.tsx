import { fireEvent, screen, waitFor } from '@testing-library/react';
import KeyValueFileInputField, {
  InternalKeyValueFileInputField,
} from '../../../shared/components/formik-fields/key-value-file-input-field/KeyValueFileInputField';
import { formikRenderer } from '../../../utils/test-utils';
import {
  addSecretFormValues,
  existingSecrets,
  secretFormValues,
  secretFormValuesForSourceSecret,
} from '../__data__/mock-secrets';
import SecretForm from '../SecretForm';

jest.mock(
  '../../../shared/components/formik-fields/key-value-file-input-field/KeyValueFileInputField',
  () => {
    return {
      __esModule: true,
      ...jest.requireActual(
        '../../../shared/components/formik-fields/key-value-file-input-field/KeyValueFileInputField',
      ),
      default: jest.fn(),
    };
  },
);

const mockKeyValueFileInputField = KeyValueFileInputField as jest.Mock;

describe('SecretForm', () => {
  beforeEach(() => {
    mockKeyValueFileInputField.mockImplementation((props) => (
      <InternalKeyValueFileInputField {...props} />
    ));
  });
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
      expect(screen.getByTestId('key-0').getAttribute('name')).toBe('opaque.keyValues.0.key');
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

describe('SecretForm Image Pull Secret', () => {
  it('should show correct fields for Image Pull Secret', async () => {
    formikRenderer(<SecretForm existingSecrets={existingSecrets} />, addSecretFormValues);
    await waitFor(() => {
      expect(screen.getByText('Registry server address')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
    });
  });
});

describe('SecretForm KeyValueFileInputField', () => {
  beforeEach(() => {
    mockKeyValueFileInputField.mockImplementation((props) => (
      <>
        <div data-test="key-value-input" {...props} />
      </>
    ));
  });
  it('should render KeyValueFileInput', async () => {
    formikRenderer(<SecretForm existingSecrets={existingSecrets} />, secretFormValues);
    await waitFor(() => {
      expect(screen.getByTestId('key-value-input')).toBeInTheDocument();
    });
  });

  it('should render KeyValueFileInput with correct props', async () => {
    formikRenderer(<SecretForm existingSecrets={existingSecrets} />, secretFormValues);
    await waitFor(() => {
      expect(screen.getByTestId('key-value-input').getAttribute('name')).toBe('opaque.keyValues');
    });
  });

  it('should have called mockKeyValueFileInputField', () => {
    formikRenderer(<SecretForm existingSecrets={existingSecrets} />, secretFormValues);
    expect(mockKeyValueFileInputField).toHaveBeenLastCalledWith(
      expect.objectContaining({
        disableRemoveAction: true,
        entries: [{ key: '', readOnlyKey: false, value: '' }],
        name: 'opaque.keyValues',
        required: true,
      }),
      {},
    );
  });
});
