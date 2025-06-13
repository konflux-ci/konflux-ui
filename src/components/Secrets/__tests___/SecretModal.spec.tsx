import { act } from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { SecretTypeDropdownLabel, SecretType, SourceSecretType } from '../../../types';
import { formikRenderer } from '../../../utils/test-utils';
import SecretModal, { SecretModalValues } from '../SecretModal';
import { supportedPartnerTasksSecrets } from '../utils/secret-utils';

const initialValues: SecretModalValues = {
  secretName: '',
  type: SecretTypeDropdownLabel.opaque,
  opaque: { keyValues: [{ key: '', value: '', readOnlyKey: false }] },
  existingSecrets: [],
  relatedComponents: [],
  secretForComponentOption: null,
};

const snykSecret = {
  type: SecretType.opaque,
  name: 'snyk-secret',
  tokenKeyName: 'snyk-secret',
  providerUrl: '',
  keyValuePairs: [{ key: 'snyk_token', value: 'snyk_value', readOnlyKey: true }],
};

const testSecret = {
  type: SecretType.opaque,
  name: 'test-secret',
  tokenKeyName: 'test-secret',
  providerUrl: '',
  keyValuePairs: [{ key: 'test_token', value: 'test_value', readOnlyKey: true }],
};

const renderSecretModal = async (
  customInitialValues = initialValues,
  existingSecrets = [],
  onSubmit = jest.fn(),
  onClose = jest.fn(),
) => {
  formikRenderer(
    <SecretModal
      onSubmit={onSubmit}
      existingSecrets={existingSecrets}
      modalProps={{ isOpen: true, onClose }}
    />,
    customInitialValues,
  );

  await waitFor(() => {
    expect(screen.getByTestId('build-secret-modal')).toBeInTheDocument();
  });
};

const selectSecretTypeAndVerifyLinkOptions = async (
  secretTypeText: string,
  sshAuthType: boolean = false,
  showOption: boolean = true,
) => {
  fireEvent.click(screen.getByText('Key/value secret'));
  fireEvent.click(screen.getByText(secretTypeText));

  if (sshAuthType) {
    fireEvent.click(screen.getByText(SourceSecretType.basic));
    fireEvent.click(screen.getByText(SourceSecretType.ssh));
  }

  await waitFor(() => {
    if (showOption) {
      expect(screen.getByText('Link secret options')).toBeInTheDocument();
    } else {
      expect(screen.queryAllByText('Link secret options').length).toEqual(0);
    }
  });
};

const clickButtonAndVerifyCallback = async (buttonName: string, callback: jest.Mock) => {
  fireEvent.click(screen.getByRole('button', { name: buttonName }));
  await waitFor(() => {
    expect(callback).toHaveBeenCalled();
  });
};

describe('SecretModal', () => {
  it('should show SecretLinkOptions when authType is basic and secret type is source', async () => {
    await renderSecretModal(initialValues);
    await selectSecretTypeAndVerifyLinkOptions('Source secret');
  });

  it('should not show SecretLinkOptions when authType is ssh and secret type is source', async () => {
    await renderSecretModal(initialValues);
    await selectSecretTypeAndVerifyLinkOptions('Source secret', true, false);
  });

  it('should show SecretLinkOptions when secret type is image', async () => {
    await renderSecretModal(initialValues);
    await selectSecretTypeAndVerifyLinkOptions('Image pull secret');
  });

  it('should show secret form in a modal', async () => {
    await renderSecretModal(initialValues);
  });

  it('should show different secret types', async () => {
    await renderSecretModal(initialValues);

    await waitFor(() => {
      expect(screen.getByText('Secret type')).toBeInTheDocument();
      expect(screen.getByText('Key/value secret')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Key/value secret'));
    expect(screen.getByText('Image pull secret')).toBeInTheDocument();
    expect(screen.getByText('Source secret')).toBeInTheDocument();
  });

  it('should render validation message when user clicks on create button without filling the form', async () => {
    const onSubmit = jest.fn();
    formikRenderer(
      <SecretModal
        onSubmit={jest.fn()}
        existingSecrets={[]}
        modalProps={{ isOpen: true, onClose: onSubmit }}
      />,
      initialValues,
    );

    act(() => {
      expect(screen.queryByTestId('build-secret-modal')).toBeInTheDocument();
      const modal = screen.queryByTestId('build-secret-modal');
      fireEvent.click(modal.querySelector('#secret-name-toggle-select-typeahead'));
    });
    act(() => {
      fireEvent.click(screen.queryByText('snyk-secret'));
      fireEvent.input(screen.getByTestId('file-upload-value').querySelector('textarea'), {
        target: { value: 'Value' },
      });
      fireEvent.input(screen.getByTestId('key-0'), { target: { value: 'key1' } });
    });

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /Create/ }));
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('should call onClose callback when cancel button is clicked', async () => {
    const onClose = jest.fn();
    await renderSecretModal(initialValues, [], jest.fn(), onClose);

    await clickButtonAndVerifyCallback('Cancel', onClose);
  });

  it('should show all the predefined tasks in the select dropdown', async () => {
    await renderSecretModal(initialValues, [testSecret]);

    const modal = screen.getByTestId('build-secret-modal');
    fireEvent.click(modal.querySelector('#secret-name-toggle-select-typeahead'));

    await waitFor(() => {
      Object.values(supportedPartnerTasksSecrets).forEach((partnerSecret) => {
        expect(screen.getByText(partnerSecret.name)).toBeInTheDocument();
      });
    });
  });

  it('should not show the secrets in the select dropdown if it is already existing', async () => {
    await renderSecretModal(initialValues, [snykSecret]);

    const modal = screen.getByTestId('build-secret-modal');
    fireEvent.click(modal.querySelector('#secret-name-toggle-select-typeahead'));

    expect(screen.queryByText('snyk-secret')).toBeInTheDocument();
  });

  it('should remove the selected value when clear button is clicked', async () => {
    await renderSecretModal(initialValues);

    const modal = screen.getByTestId('build-secret-modal');
    fireEvent.click(modal.querySelector('#secret-name-toggle-select-typeahead'));

    fireEvent.click(screen.getByText('snyk-secret'));

    await waitFor(() => {
      fireEvent.click(modal.querySelector('.pf-v5-c-select__toggle-clear'));
      expect(screen.queryByText('snyk-secret')).not.toBeInTheDocument();
    });
  });

  it('should call onSubmit handler with newly added secret', async () => {
    const onSubmit = jest.fn();
    formikRenderer(
      <SecretModal
        onSubmit={jest.fn()}
        existingSecrets={[]}
        modalProps={{ isOpen: true, onClose: onSubmit }}
      />,
      initialValues,
    );

    act(() => {
      expect(screen.queryByTestId('build-secret-modal')).toBeInTheDocument();
      const modal = screen.queryByTestId('build-secret-modal');
      fireEvent.click(modal.querySelector('#secret-name-toggle-select-typeahead'));
    });

    act(() => {
      fireEvent.click(screen.queryByText('snyk-secret'));
      fireEvent.input(screen.getByTestId('file-upload-value').querySelector('textarea'), {
        target: { value: 'Value' },
      });
      fireEvent.input(screen.getByTestId('key-0'), { target: { value: 'key1' } });
    });

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /Create/ }));
      expect(onSubmit).toHaveBeenCalled();
    });
  });
});
