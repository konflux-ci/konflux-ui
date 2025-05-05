import { act, fireEvent, screen } from '@testing-library/react';
import { formikRenderer } from '../../../utils/test-utils';
import { ImagePullSecretForm } from '../SecretsForm/ImagePullSecretForm';

const initialValues = {
  image: {
    authType: 'Image registry credentials',
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
});
