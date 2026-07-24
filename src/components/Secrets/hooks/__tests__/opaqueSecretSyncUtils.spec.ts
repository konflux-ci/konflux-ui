import {
  DEFAULT_IMAGE_PULL_KEY_VALUES,
  DEFAULT_OPAQUE_KEY_VALUES,
  DEFAULT_OPAQUE_LABELS,
} from '~/consts/secrets';
import { SecretTypeDropdownLabel, BuildTimeSecret, SecretType } from '~/types';
import {
  getEditableKeyValues,
  getKeyValuesWithoutReadOnlyKeys,
  getOpaqueFieldsFromExistingSecret,
  getOpaqueSecretSyncTransition,
  getResetKeyValuesForImage,
} from '../opaqueSecretSyncUtils';

describe('opaqueSecretSyncUtils', () => {
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

  describe('getKeyValuesWithoutReadOnlyKeys', () => {
    it('removes read-only keys and keeps user-entered keys', () => {
      expect(
        getKeyValuesWithoutReadOnlyKeys([
          { key: 'user-key', value: 'user-value', readOnlyKey: false },
          { key: 'readonly-key', value: 'readonly-value', readOnlyKey: true },
        ]),
      ).toEqual([{ key: 'user-key', value: 'user-value', readOnlyKey: false }]);
    });

    it('returns defaults when no user-entered keys remain', () => {
      expect(
        getKeyValuesWithoutReadOnlyKeys([
          { key: 'readonly-key', value: 'readonly-value', readOnlyKey: true },
        ]),
      ).toEqual(DEFAULT_OPAQUE_KEY_VALUES);
    });
  });

  describe('getResetKeyValuesForImage', () => {
    it('keeps user-entered keys with content and adds .dockerconfigjson', () => {
      expect(
        getResetKeyValuesForImage([
          { key: 'user-key', value: 'user-value', readOnlyKey: false },
          { key: '', value: '', readOnlyKey: false },
          { key: 'readonly-key', value: 'value', readOnlyKey: true },
        ]),
      ).toEqual([
        { key: 'user-key', value: 'user-value', readOnlyKey: false },
        ...DEFAULT_IMAGE_PULL_KEY_VALUES,
      ]);
    });
  });

  describe('getEditableKeyValues', () => {
    it('clears read-only flags from all key values', () => {
      expect(
        getEditableKeyValues([
          { key: 'existing-key-1', value: 'value1', readOnlyKey: true },
          { key: 'existing-key-2', value: 'value2', readOnlyKey: true },
        ]),
      ).toEqual([
        { key: 'existing-key-1', value: 'value1', readOnlyKey: false, readOnlyValue: false },
        { key: 'existing-key-2', value: 'value2', readOnlyKey: false, readOnlyValue: false },
      ]);
    });
  });

  const populatedSnykSecret: BuildTimeSecret = {
    name: 'snyk-secret',
    type: SecretType.opaque,
    providerUrl: 'https://snyk.io/',
    tokenKeyName: 'snyk_token',
    opaque: {
      keyValuePairs: [
        { key: 'snyk_token', value: 'configured', readOnlyKey: true, readOnlyValue: true },
      ],
    },
    labels: [{ key: 'partner', value: 'snyk' }],
  };

  describe('getOpaqueFieldsFromExistingSecret', () => {
    it('returns partner task template key values when cluster secret is not populated', () => {
      expect(getOpaqueFieldsFromExistingSecret('snyk-secret', existingSecrets)).toEqual({
        keyValues: expect.arrayContaining([
          expect.objectContaining({
            key: 'snyk_token',
            readOnlyKey: true,
            readOnlyValue: false,
          }),
        ]),
        labels: DEFAULT_OPAQUE_LABELS,
      });
    });

    it('returns populated cluster values for partner tasks already in cluster', () => {
      expect(getOpaqueFieldsFromExistingSecret('snyk-secret', [populatedSnykSecret])).toEqual({
        keyValues: [
          { key: 'snyk_token', value: 'configured', readOnlyKey: true, readOnlyValue: true },
        ],
        labels: [{ key: 'partner', value: 'snyk' }],
      });
    });

    it('returns existing cluster secret fields', () => {
      expect(getOpaqueFieldsFromExistingSecret('existing-secret', existingSecrets)).toEqual({
        keyValues: [
          { key: 'existing-key-1', value: 'value1', readOnlyKey: true },
          { key: 'existing-key-2', value: 'value2', readOnlyKey: true },
        ],
        labels: [{ key: 'env', value: 'prod' }],
      });
    });

    it('returns default labels for non-existent secrets', () => {
      expect(getOpaqueFieldsFromExistingSecret('non-existent', existingSecrets)).toEqual({
        keyValues: undefined,
        labels: DEFAULT_OPAQUE_LABELS,
      });
    });
  });

  describe('getOpaqueSecretSyncTransition', () => {
    it('returns none when secret name is unchanged', () => {
      expect(
        getOpaqueSecretSyncTransition({
          previousName: 'test-secret',
          currentName: 'test-secret',
          currentType: SecretTypeDropdownLabel.opaque,
          existingSecrets,
        }),
      ).toEqual({ action: 'none' });
    });

    it('returns none when current type is not opaque', () => {
      expect(
        getOpaqueSecretSyncTransition({
          previousName: '',
          currentName: 'new-secret',
          currentType: SecretTypeDropdownLabel.image,
          existingSecrets,
        }),
      ).toEqual({ action: 'none' });
    });

    it('returns populateFromExisting when switching to an existing cluster secret', () => {
      expect(
        getOpaqueSecretSyncTransition({
          previousName: '',
          currentName: 'existing-secret',
          currentType: SecretTypeDropdownLabel.opaque,
          existingSecrets,
        }),
      ).toEqual({ action: 'populateFromExisting', secretName: 'existing-secret' });
    });

    it('returns makeEditable when switching from an existing cluster secret to a new name', () => {
      expect(
        getOpaqueSecretSyncTransition({
          previousName: 'existing-secret',
          currentName: 'new-secret',
          currentType: SecretTypeDropdownLabel.opaque,
          existingSecrets,
        }),
      ).toEqual({ action: 'makeEditable' });
    });

    it('returns resetOpaque when switching from a partner task to a regular secret', () => {
      expect(
        getOpaqueSecretSyncTransition({
          previousName: 'snyk-secret',
          currentName: 'my-new-secret',
          currentType: SecretTypeDropdownLabel.opaque,
          existingSecrets,
        }),
      ).toEqual({ action: 'resetOpaque' });
    });
  });
});
