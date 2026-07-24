import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import {
  addSecretFormValues,
  existingSecrets,
  secretFormValues,
  secretFormValuesForSourceSecret,
} from '~/components/Secrets/__data__/mock-secrets';
import SecretForm from '~/components/Secrets/SecretForm';
import KeyValueFileInputField, {
  InternalKeyValueFileInputField,
} from '~/shared/components/formik-fields/key-value-file-input-field/KeyValueFileInputField';
import { SecretType } from '~/types';
import { formikRenderer } from '~/utils/test-utils';

jest.mock(
  '~/shared/components/formik-fields/key-value-file-input-field/KeyValueFileInputField',
  () => {
    return {
      __esModule: true,
      ...jest.requireActual(
        '~/shared/components/formik-fields/key-value-file-input-field/KeyValueFileInputField',
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
      expect(screen.getByRole('textbox', { name: 'Key' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'File upload' })).toBeInTheDocument();
    });
  });

  it('should set correct values', async () => {
    const user = userEvent.setup();
    formikRenderer(<SecretForm existingSecrets={existingSecrets} />, secretFormValues);
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Key' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Key' })).toHaveValue('test');
    });
    const keyInput = screen.getByRole('textbox', { name: 'Key' });
    await user.clear(keyInput);
    await user.type(keyInput, 'key1');
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Key' })).toHaveAttribute(
        'name',
        'opaque.keyValues.0.key',
      );
      expect(screen.getByRole('textbox', { name: 'Key' })).toHaveValue('key1');
    });
  });

  it('should show a file upload button', async () => {
    formikRenderer(<SecretForm existingSecrets={existingSecrets} />, secretFormValues);
    await waitFor(() => {
      expect(screen.getByText('Upload')).toBeInTheDocument();
    });
  });

  it('should add new Key value pair', async () => {
    const user = userEvent.setup();
    formikRenderer(<SecretForm existingSecrets={existingSecrets} />, secretFormValues);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add key/value' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Add key/value' }));
    await waitFor(() => {
      expect(screen.getAllByRole('textbox', { name: 'Key' })).toHaveLength(2);
    });
  });
});

describe('SecretForm labels', () => {
  beforeEach(() => {
    mockKeyValueFileInputField.mockImplementation((props) => (
      <InternalKeyValueFileInputField {...props} />
    ));
  });

  it('renders Labels section with helper text for key/value secret type', async () => {
    formikRenderer(<SecretForm existingSecrets={existingSecrets} />, secretFormValues);
    await waitFor(() => {
      expect(screen.getByText('Labels')).toBeInTheDocument();
      expect(
        screen.getByText('You can add labels to provide more context or tag your secret.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Add label')).toBeInTheDocument();
    });
  });

  it('renders Labels section for source secret type', async () => {
    formikRenderer(
      <SecretForm existingSecrets={existingSecrets} />,
      secretFormValuesForSourceSecret,
    );
    await waitFor(() => {
      expect(screen.getByText('Labels')).toBeInTheDocument();
    });
  });

  it('allows editing label key and value fields', async () => {
    const user = userEvent.setup();
    formikRenderer(<SecretForm existingSecrets={existingSecrets} />, secretFormValues);
    await waitFor(() => {
      expect(screen.getByLabelText('Key 0-1')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Key 0-1'), 'team');
    await user.type(screen.getByLabelText('Value 0-1'), 'konflux');

    await waitFor(() => {
      expect(screen.getByLabelText('Key 0-1')).toHaveValue('team');
      expect(screen.getByLabelText('Value 0-1')).toHaveValue('konflux');
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
      expect(screen.getByRole('textbox', { name: 'Host' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Repository' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Username' })).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });
  });

  it('should load with correct input values', async () => {
    formikRenderer(
      <SecretForm existingSecrets={existingSecrets} />,
      secretFormValuesForSourceSecret,
    );
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Username' })).toHaveValue('username-test');
      expect(screen.getByLabelText('Password')).toHaveValue('password-test');
    });
  });

  it('should load update correct input values', async () => {
    const user = userEvent.setup();
    formikRenderer(
      <SecretForm existingSecrets={existingSecrets} />,
      secretFormValuesForSourceSecret,
    );

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Username' })).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    const usernameInput = screen.getByRole('textbox', { name: 'Username' });
    const passwordInput = screen.getByLabelText('Password');
    await user.clear(usernameInput);
    await user.type(usernameInput, 'username-changed');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'password-changed');

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Username' })).toHaveValue('username-changed');
      expect(screen.getByLabelText('Password')).toHaveValue('password-changed');
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

describe('SecretForm SecretLinkOptions', () => {
  beforeEach(() => {
    mockKeyValueFileInputField.mockImplementation((props) => (
      <InternalKeyValueFileInputField {...props} />
    ));
  });

  it('should show "Do not link" option for basic auth source secrets', async () => {
    formikRenderer(
      <SecretForm existingSecrets={existingSecrets} />,
      secretFormValuesForSourceSecret,
    );
    await waitFor(() => {
      expect(screen.getByText('Do not link')).toBeInTheDocument();
    });
  });

  it('should show "Do not link" option for image pull secrets', async () => {
    formikRenderer(<SecretForm existingSecrets={existingSecrets} />, addSecretFormValues);
    await waitFor(() => {
      expect(screen.getByText('Do not link')).toBeInTheDocument();
    });
  });

  it('should select "Do not link" by default when secretForComponentOption is none', async () => {
    formikRenderer(<SecretForm existingSecrets={existingSecrets} />, {
      ...secretFormValuesForSourceSecret,
      secretForComponentOption: 'none',
    });
    await waitFor(() => {
      const doNotLinkRadio = screen.getByRole('radio', { name: 'Do not link' });
      expect(doNotLinkRadio).toBeChecked();
    });
  });
});

describe('SecretForm KeyValueFileInputField', () => {
  beforeEach(() => {
    mockKeyValueFileInputField.mockImplementation(() => null);
  });

  it('should render KeyValueFileInput with correct props', () => {
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

describe('SecretForm secret name field', () => {
  beforeEach(() => {
    mockKeyValueFileInputField.mockImplementation((props) => (
      <InternalKeyValueFileInputField {...props} />
    ));
  });

  it('should show typeahead for opaque secrets', async () => {
    formikRenderer(<SecretForm existingSecrets={existingSecrets} />, secretFormValues);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'secret-name-dropdown' })).toBeInTheDocument();
    });
  });

  it('should show plain secret name input for image pull secrets', async () => {
    const user = userEvent.setup();
    formikRenderer(<SecretForm existingSecrets={existingSecrets} />, secretFormValues);

    await user.click(screen.getByRole('button', { name: 'Key/value secret' }));
    await user.click(screen.getByRole('option', { name: 'Image pull secret' }));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Secret name' })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'secret-name-dropdown' }),
      ).not.toBeInTheDocument();
    });
  });

  it('should show plain secret name input for source secrets', async () => {
    const user = userEvent.setup();
    formikRenderer(<SecretForm existingSecrets={existingSecrets} />, secretFormValues);

    await user.click(screen.getByRole('button', { name: 'Key/value secret' }));
    await user.click(screen.getByRole('option', { name: 'Source secret' }));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Secret name' })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'secret-name-dropdown' }),
      ).not.toBeInTheDocument();
    });
  });
});

describe('SecretForm existing opaque secret', () => {
  const clusterSecret = {
    type: SecretType.opaque,
    name: 'cluster-secret',
    providerUrl: '',
    tokenKeyName: 'cluster-secret',
    opaque: {
      keyValuePairs: [
        { key: 'token', value: 'secret-value', readOnlyKey: true, readOnlyValue: true },
      ],
    },
    labels: [{ key: 'app', value: 'konflux' }],
  };

  beforeEach(() => {
    mockKeyValueFileInputField.mockImplementation((props) => (
      <InternalKeyValueFileInputField {...props} />
    ));
  });

  it('should display labels when selecting an existing cluster secret', async () => {
    const user = userEvent.setup();
    formikRenderer(<SecretForm existingSecrets={[clusterSecret]} />, secretFormValues);

    await user.click(screen.getByRole('button', { name: 'secret-name-dropdown' }));
    await user.click(screen.getByText('cluster-secret'));

    await waitFor(() => {
      expect(screen.getByLabelText('Key 0-1')).toHaveValue('app');
      expect(screen.getByLabelText('Value 0-1')).toHaveValue('konflux');
    });
  });

  it('should disable label fields when using an existing cluster secret', async () => {
    const user = userEvent.setup();
    formikRenderer(<SecretForm existingSecrets={[clusterSecret]} />, secretFormValues);

    await user.click(screen.getByRole('button', { name: 'secret-name-dropdown' }));
    await user.click(screen.getByText('cluster-secret'));

    await waitFor(() => {
      expect(screen.getByLabelText('Key 0-1')).toBeDisabled();
      expect(screen.getByLabelText('Value 0-1')).toBeDisabled();
    });
  });

  it('should hide Add key/value when using an existing cluster secret', async () => {
    const user = userEvent.setup();
    formikRenderer(<SecretForm existingSecrets={[clusterSecret]} />, secretFormValues);

    await user.click(screen.getByRole('button', { name: 'secret-name-dropdown' }));
    await user.click(screen.getByText('cluster-secret'));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Add key/value' })).not.toBeInTheDocument();
    });
  });

  it('should disable value fields when using an existing cluster secret', async () => {
    const user = userEvent.setup();
    formikRenderer(<SecretForm existingSecrets={[clusterSecret]} />, secretFormValues);

    await user.click(screen.getByRole('button', { name: 'secret-name-dropdown' }));
    await user.click(screen.getByText('cluster-secret'));

    await waitFor(() => {
      expect(
        screen.getByRole('textbox', { name: 'Key' }).closest('.key-value--wrapper'),
      ).toHaveClass('key-value--value-read-only');
      expect(screen.getByRole('textbox', { name: 'File upload' })).toBeDisabled();
    });
  });

  it('should keep key values editable when renaming an existing cluster secret', async () => {
    const user = userEvent.setup();
    formikRenderer(<SecretForm existingSecrets={[clusterSecret]} />, secretFormValues);

    await user.click(screen.getByRole('button', { name: 'secret-name-dropdown' }));
    await user.click(screen.getByText('cluster-secret'));

    const combobox = screen.getByRole('combobox');
    await user.clear(combobox);
    await user.type(combobox, 'new-secret-name');

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Key' })).toHaveValue('token');
      expect(screen.getByRole('textbox', { name: 'Key' })).not.toBeDisabled();
    });
  });

  it('should repopulate read-only fields when switching between existing cluster secrets', async () => {
    const user = userEvent.setup();
    const otherClusterSecret = {
      type: SecretType.opaque,
      name: 'other-secret',
      providerUrl: '',
      tokenKeyName: 'other-secret',
      opaque: {
        keyValuePairs: [
          { key: 'other-key', value: 'other-value', readOnlyKey: true, readOnlyValue: true },
        ],
      },
      labels: [{ key: 'env', value: 'prod' }],
    };

    formikRenderer(
      <SecretForm existingSecrets={[clusterSecret, otherClusterSecret]} />,
      secretFormValues,
    );

    await user.click(screen.getByRole('button', { name: 'secret-name-dropdown' }));
    await user.click(screen.getByText('cluster-secret'));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Key' })).toHaveValue('token');
      expect(screen.getByRole('textbox', { name: 'Key' })).toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: 'secret-name-dropdown' }));
    await user.click(screen.getByText('other-secret'));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Key' })).toHaveValue('other-key');
      expect(screen.getByRole('textbox', { name: 'Key' })).toBeDisabled();
      expect(screen.getByLabelText('Key 0-1')).toHaveValue('env');
      expect(screen.getByLabelText('Value 0-1')).toHaveValue('prod');
      expect(screen.getByLabelText('Key 0-1')).toBeDisabled();
    });
  });
});

describe('SecretForm edit mode', () => {
  const clusterSecret = {
    type: SecretType.opaque,
    name: 'cluster-secret',
    providerUrl: '',
    tokenKeyName: 'cluster-secret',
    opaque: {
      keyValuePairs: [
        { key: 'token', value: 'secret-value', readOnlyKey: true, readOnlyValue: true },
      ],
    },
    labels: [{ key: 'app', value: 'konflux' }],
  };

  const uniqueEditValues = {
    ...secretFormValues,
    secretName: 'my-unique-secret',
    opaque: {
      keyValues: [{ key: 'api-key', value: 'dGVzdA==' }],
    },
  };

  const clusterBackedEditValues = {
    ...secretFormValues,
    secretName: 'cluster-secret',
    opaque: {
      keyValues: [{ key: 'token', value: 'secret-value', readOnlyKey: true, readOnlyValue: true }],
    },
    labels: [{ key: 'app', value: 'konflux' }],
  };

  beforeEach(() => {
    mockKeyValueFileInputField.mockImplementation((props) => (
      <InternalKeyValueFileInputField {...props} />
    ));
  });

  it('allows renaming a unique build secret in edit mode', async () => {
    const user = userEvent.setup();
    formikRenderer(<SecretForm existingSecrets={[clusterSecret]} isEdit />, uniqueEditValues);

    await waitFor(() => {
      expect(screen.getByText('Unique name of the new secret.')).toBeInTheDocument();
    });

    const combobox = screen.getByRole('combobox');
    expect(combobox).not.toBeDisabled();

    await user.clear(combobox);
    await user.type(combobox, 'renamed-secret');

    await waitFor(() => {
      expect(combobox).toHaveValue('renamed-secret');
    });
  });

  it('allows changing secret type for a unique build secret in edit mode', async () => {
    const user = userEvent.setup();
    formikRenderer(<SecretForm existingSecrets={[clusterSecret]} isEdit />, uniqueEditValues);

    const secretTypeToggle = screen.getByRole('button', { name: 'Key/value secret' });
    expect(secretTypeToggle).not.toHaveAttribute('aria-disabled', 'true');

    await user.click(secretTypeToggle);
    await user.click(screen.getByRole('option', { name: 'Source secret' }));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Secret name' })).toBeInTheDocument();
    });
  });

  it('keeps name and secret type locked when editing a cluster-backed secret', async () => {
    formikRenderer(
      <SecretForm existingSecrets={[clusterSecret]} isEdit />,
      clusterBackedEditValues,
    );

    await waitFor(() => {
      expect(screen.getByText('You cannot edit the existing secret name')).toBeInTheDocument();
      expect(screen.getByText('You cannot edit the secret type in edit mode')).toBeInTheDocument();
    });

    expect(screen.getByRole('combobox')).toBeDisabled();

    const secretTypeToggle = screen.getByRole('button', { name: 'Key/value secret' });
    expect(secretTypeToggle).toHaveAttribute('aria-disabled', 'true');
  });
});
