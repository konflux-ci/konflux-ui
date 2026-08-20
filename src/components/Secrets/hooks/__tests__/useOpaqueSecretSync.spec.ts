import { renderHook } from '@testing-library/react-hooks';
import { useFormikContext } from 'formik';
import { SecretFormValues, SecretTypeDropdownLabel, BuildTimeSecret, SecretType } from '~/types';
import { useOpaqueSecretSync } from '../useOpaqueSecretSync';

const mockSetFieldValue = jest.fn();

jest.mock('formik', () => ({
  ...jest.requireActual('formik'),
  useFormikContext: jest.fn(),
}));

const useFormikContextMock = useFormikContext as jest.Mock;

const mockFormikContext = (values: SecretFormValues) => ({
  values,
  setFieldValue: mockSetFieldValue,
});

describe('useOpaqueSecretSync', () => {
  const defaultValues: SecretFormValues = {
    secretName: '',
    type: SecretTypeDropdownLabel.opaque,
    opaque: {
      keyValues: [{ key: '', value: '', readOnlyKey: false }],
    },
    labels: [{ key: '', value: '' }],
  };

  const existingOpaqueSecret: BuildTimeSecret = {
    name: 'existing-secret',
    type: SecretType.opaque,
    providerUrl: '',
    tokenKeyName: '',
    opaque: {
      keyValuePairs: [
        { key: 'existing-key-1', value: 'value1', readOnlyKey: true },
        { key: 'existing-key-2', value: 'value2', readOnlyKey: true },
      ],
    },
    labels: [{ key: 'env', value: 'prod' }],
  };

  const existingSecrets: BuildTimeSecret[] = [existingOpaqueSecret];

  beforeEach(() => {
    jest.clearAllMocks();
    useFormikContextMock.mockReturnValue(mockFormikContext(defaultValues));
  });

  describe('clearReadOnlyKeys', () => {
    it('should remove read-only keys and keep user-entered keys', () => {
      const values = {
        ...defaultValues,
        opaque: {
          keyValues: [
            { key: 'user-key', value: 'user-value', readOnlyKey: false },
            { key: 'readonly-key', value: 'readonly-value', readOnlyKey: true },
          ],
        },
      };

      useFormikContextMock.mockReturnValue(mockFormikContext(values));

      const { result } = renderHook(() =>
        useOpaqueSecretSync({ currentType: SecretTypeDropdownLabel.opaque, existingSecrets }),
      );

      result.current.clearReadOnlyKeys();

      expect(mockSetFieldValue).toHaveBeenCalledWith('opaque.keyValues', [
        { key: 'user-key', value: 'user-value', readOnlyKey: false },
      ]);
    });

    it('should reset to default when no user-entered keys remain', () => {
      const values = {
        ...defaultValues,
        opaque: {
          keyValues: [{ key: 'readonly-key', value: 'readonly-value', readOnlyKey: true }],
        },
      };

      useFormikContextMock.mockReturnValue(mockFormikContext(values));

      const { result } = renderHook(() =>
        useOpaqueSecretSync({ currentType: SecretTypeDropdownLabel.opaque, existingSecrets }),
      );

      result.current.clearReadOnlyKeys();

      expect(mockSetFieldValue).toHaveBeenCalledWith('opaque.keyValues', [
        { key: '', value: '', readOnlyKey: false },
      ]);
    });
  });

  describe('resetOpaqueFields', () => {
    it('should reset both keyValues and labels to defaults', () => {
      const values = {
        ...defaultValues,
        opaque: {
          keyValues: [
            { key: 'some-key', value: 'some-value', readOnlyKey: false },
            { key: 'another-key', value: 'another-value', readOnlyKey: false },
          ],
        },
        labels: [{ key: 'env', value: 'prod' }],
      };

      useFormikContextMock.mockReturnValue(mockFormikContext(values));

      const { result } = renderHook(() =>
        useOpaqueSecretSync({ currentType: SecretTypeDropdownLabel.opaque, existingSecrets }),
      );

      result.current.resetOpaqueFields();

      expect(mockSetFieldValue).toHaveBeenCalledWith('opaque.keyValues', [
        { key: '', value: '', readOnlyKey: false },
      ]);
      expect(mockSetFieldValue).toHaveBeenCalledWith('labels', [{ key: '', value: '' }]);
    });
  });

  describe('resetKeyValues', () => {
    it('should keep user-entered keys with content and add .dockerconfigjson', () => {
      const values = {
        ...defaultValues,
        opaque: {
          keyValues: [
            { key: 'user-key', value: 'user-value', readOnlyKey: false },
            { key: '', value: '', readOnlyKey: false }, // empty, should be filtered
            { key: 'readonly-key', value: 'value', readOnlyKey: true }, // readonly, should be filtered
          ],
        },
      };

      useFormikContextMock.mockReturnValue(mockFormikContext(values));

      const { result } = renderHook(() =>
        useOpaqueSecretSync({ currentType: SecretTypeDropdownLabel.opaque, existingSecrets }),
      );

      result.current.resetKeyValues();

      expect(mockSetFieldValue).toHaveBeenCalledWith('opaque.keyValues', [
        { key: 'user-key', value: 'user-value', readOnlyKey: false },
        { key: '.dockerconfigjson', value: '', readOnlyKey: true },
      ]);
    });

    it('should only add .dockerconfigjson when no user keys exist', () => {
      const values = {
        ...defaultValues,
        opaque: {
          keyValues: [{ key: '', value: '', readOnlyKey: false }],
        },
      };

      useFormikContextMock.mockReturnValue(mockFormikContext(values));

      const { result } = renderHook(() =>
        useOpaqueSecretSync({ currentType: SecretTypeDropdownLabel.opaque, existingSecrets }),
      );

      result.current.resetKeyValues();

      expect(mockSetFieldValue).toHaveBeenCalledWith('opaque.keyValues', [
        { key: '.dockerconfigjson', value: '', readOnlyKey: true },
      ]);
    });
  });

  describe('populateFromExistingOpaqueSecret', () => {
    it('should populate from partner task (snyk-secret)', () => {
      const { result } = renderHook(() =>
        useOpaqueSecretSync({ currentType: SecretTypeDropdownLabel.opaque, existingSecrets }),
      );

      result.current.populateFromExistingOpaqueSecret('snyk-secret');

      // snyk-secret has a specific key 'snyk_token'
      expect(mockSetFieldValue).toHaveBeenCalledWith(
        'opaque.keyValues',
        expect.arrayContaining([
          expect.objectContaining({
            key: 'snyk_token',
            readOnlyKey: true,
          }),
        ]),
      );
      expect(mockSetFieldValue).toHaveBeenCalledWith('labels', [{ key: '', value: '' }]);
    });

    it('should populate from existing cluster secret with keyValuePairs', () => {
      const { result } = renderHook(() =>
        useOpaqueSecretSync({ currentType: SecretTypeDropdownLabel.opaque, existingSecrets }),
      );

      result.current.populateFromExistingOpaqueSecret('existing-secret');

      expect(mockSetFieldValue).toHaveBeenCalledWith('opaque.keyValues', [
        { key: 'existing-key-1', value: 'value1', readOnlyKey: true },
        { key: 'existing-key-2', value: 'value2', readOnlyKey: true },
      ]);
      expect(mockSetFieldValue).toHaveBeenCalledWith('labels', [{ key: 'env', value: 'prod' }]);
    });

    it('should populate labels with defaults if existing secret has no labels', () => {
      const secretWithoutLabels: BuildTimeSecret = {
        name: 'no-labels-secret',
        type: SecretType.opaque,
        providerUrl: '',
        tokenKeyName: '',
        opaque: {
          keyValuePairs: [{ key: 'key1', value: 'value1', readOnlyKey: true }],
        },
      };

      const { result } = renderHook(() =>
        useOpaqueSecretSync({
          currentType: SecretTypeDropdownLabel.opaque,
          existingSecrets: [secretWithoutLabels],
        }),
      );

      result.current.populateFromExistingOpaqueSecret('no-labels-secret');

      expect(mockSetFieldValue).toHaveBeenCalledWith('opaque.keyValues', [
        { key: 'key1', value: 'value1', readOnlyKey: true },
      ]);
      expect(mockSetFieldValue).toHaveBeenCalledWith('labels', [{ key: '', value: '' }]);
    });

    it('should handle non-existent secret gracefully', () => {
      const { result } = renderHook(() =>
        useOpaqueSecretSync({ currentType: SecretTypeDropdownLabel.opaque, existingSecrets }),
      );

      result.current.populateFromExistingOpaqueSecret('non-existent');

      // Should not crash, and labels should still be set to defaults
      expect(mockSetFieldValue).toHaveBeenCalledWith('labels', [{ key: '', value: '' }]);
    });
  });

  describe('useEffect - secret name changes', () => {
    it('should populate when switching to existing cluster secret', () => {
      const { rerender } = renderHook(
        (props: { secretName: string }) => {
          useFormikContextMock.mockReturnValue(
            mockFormikContext({ ...defaultValues, secretName: props.secretName }),
          );
          return useOpaqueSecretSync({
            currentType: SecretTypeDropdownLabel.opaque,
            existingSecrets,
          });
        },
        { initialProps: { secretName: '' } },
      );

      // Change to existing secret
      rerender({ secretName: 'existing-secret' });

      expect(mockSetFieldValue).toHaveBeenCalledWith('opaque.keyValues', [
        { key: 'existing-key-1', value: 'value1', readOnlyKey: true },
        { key: 'existing-key-2', value: 'value2', readOnlyKey: true },
      ]);
    });

    it('should make fields editable when switching from existing cluster secret to new', () => {
      const initialValues = {
        ...defaultValues,
        secretName: 'existing-secret',
        opaque: {
          keyValues: [
            { key: 'existing-key-1', value: 'value1', readOnlyKey: true },
            { key: 'existing-key-2', value: 'value2', readOnlyKey: true },
          ],
        },
      };

      const { rerender } = renderHook(
        (props: { secretName: string }) => {
          useFormikContextMock.mockReturnValue(
            mockFormikContext({ ...initialValues, secretName: props.secretName }),
          );
          return useOpaqueSecretSync({
            currentType: SecretTypeDropdownLabel.opaque,
            existingSecrets,
          });
        },
        { initialProps: { secretName: 'existing-secret' } },
      );

      // Change to new secret name
      rerender({ secretName: 'new-secret' });

      // Should make all keys editable
      expect(mockSetFieldValue).toHaveBeenCalledWith('opaque.keyValues', [
        { key: 'existing-key-1', value: 'value1', readOnlyKey: false, readOnlyValue: false },
        { key: 'existing-key-2', value: 'value2', readOnlyKey: false, readOnlyValue: false },
      ]);
    });

    it('should reset fields when switching from partner task to regular secret', () => {
      const initialValues = {
        ...defaultValues,
        secretName: 'snyk-secret',
      };

      const { rerender } = renderHook(
        (props: { secretName: string }) => {
          useFormikContextMock.mockReturnValue(
            mockFormikContext({ ...initialValues, secretName: props.secretName }),
          );
          return useOpaqueSecretSync({
            currentType: SecretTypeDropdownLabel.opaque,
            existingSecrets,
          });
        },
        { initialProps: { secretName: 'snyk-secret' } },
      );

      // Change from partner task to regular secret
      rerender({ secretName: 'my-new-secret' });

      expect(mockSetFieldValue).toHaveBeenCalledWith('opaque.keyValues', [
        { key: '', value: '', readOnlyKey: false },
      ]);
      expect(mockSetFieldValue).toHaveBeenCalledWith('labels', [{ key: '', value: '' }]);
    });

    it('should not trigger updates when secretName does not change', () => {
      const { rerender } = renderHook(
        (props: { secretName: string }) => {
          useFormikContextMock.mockReturnValue(
            mockFormikContext({ ...defaultValues, secretName: props.secretName }),
          );
          return useOpaqueSecretSync({
            currentType: SecretTypeDropdownLabel.opaque,
            existingSecrets,
          });
        },
        { initialProps: { secretName: 'test-secret' } },
      );

      mockSetFieldValue.mockClear();

      // Rerender with same secret name
      rerender({ secretName: 'test-secret' });

      expect(mockSetFieldValue).not.toHaveBeenCalled();
    });

    it('should not trigger updates when currentType is not opaque', () => {
      const { rerender } = renderHook(
        (props: { secretName: string; currentType: string }) => {
          useFormikContextMock.mockReturnValue(
            mockFormikContext({
              ...defaultValues,
              secretName: props.secretName,
              type: props.currentType,
            }),
          );
          return useOpaqueSecretSync({
            currentType: props.currentType,
            existingSecrets,
          });
        },
        {
          initialProps: { secretName: '', currentType: SecretTypeDropdownLabel.image },
        },
      );

      mockSetFieldValue.mockClear();

      // Change secret name while type is not opaque
      rerender({ secretName: 'new-secret', currentType: SecretTypeDropdownLabel.image });

      expect(mockSetFieldValue).not.toHaveBeenCalled();
    });
  });
});
