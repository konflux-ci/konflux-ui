import { ImagePullSecretType, SecretTypeDropdownLabel, SourceSecretType } from '../../types';
import { SecretFromSchema } from '../validation-utils';

describe('validation-utils', () => {
  it('should return error for incorrect secret name', async () => {
    await expect(() =>
      SecretFromSchema.validate({
        secretName: '1234',
        type: SecretTypeDropdownLabel.image,
        image: { keyValues: [{ key: '', value: null }] },
        existingSecrets: [],
      }),
    ).rejects.toThrow(
      'Must start with a letter and end with a letter or number. Valid characters include lowercase letters from a to z, numbers from 0 to 9, and hyphens ( - ).',
    );
  });

  it('should validate correct key value secrets', () => {
    expect(() =>
      SecretFromSchema.validate({
        secretName: 'secret1',
        type: SecretTypeDropdownLabel.opaque,
        opaque: { keyValues: [{ key: 'key-a', value: 'val-a', readOnlyKey: false }] },
        existingSecrets: [],
      }),
    ).not.toThrow();
  });

  it('should validate correct image pull secrets', () => {
    expect(() =>
      SecretFromSchema.validate({
        secretName: 'secret1',
        type: SecretTypeDropdownLabel.image,
        image: {
          authType: ImagePullSecretType.ImageRegistryCreds,
          registryCreds: [
            { registry: 'test-registry', username: 'testusername', password: 'password' },
          ],
        },
        existingSecrets: [],
      }),
    ).not.toThrow();
  });

  it('should return error for incorrect image pull secret', async () => {
    await expect(() =>
      SecretFromSchema.validate({
        secretName: 'secret1',
        type: SecretTypeDropdownLabel.image,
        image: { keyValues: [{ key: '', value: 'val1' }] },
        existingSecrets: [],
      }),
    ).rejects.toThrow('Required');
  });

  it('should return error for incorrect key secret', async () => {
    await expect(() =>
      SecretFromSchema.validate({
        secretName: 'secret1',
        type: SecretTypeDropdownLabel.opaque,
        opaque: { keyValues: [{ key: '', value: 'val1' }] },
        existingSecrets: [],
      }),
    ).rejects.toThrow('Required');
  });

  it('should return error for incorrect value secret', async () => {
    await expect(() =>
      SecretFromSchema.validate({
        secretName: 'secret1',
        type: SecretTypeDropdownLabel.opaque,
        opaque: { keyValues: [{ key: 'key1', value: '' }] },
        existingSecrets: [],
      }),
    ).rejects.toThrow('Required');
  });

  it('should validate correct source secrets of basic type', () => {
    expect(() =>
      SecretFromSchema.validate({
        secretName: 'secret1',
        type: SecretTypeDropdownLabel.source,
        source: { authType: SourceSecretType.basic, username: 'username', password: 'pass' },
        existingSecrets: [],
      }),
    ).not.toThrow();
  });

  it('should return error for incorrect source secret', async () => {
    await expect(() =>
      SecretFromSchema.validate({
        secretName: 'secret1',
        type: SecretTypeDropdownLabel.source,
        source: { authType: SourceSecretType.basic, password: 'pass' },
        existingSecrets: [],
      }),
    ).rejects.toThrow('Required');
  });

  it('should return error when password not provided', async () => {
    await expect(() =>
      SecretFromSchema.validate({
        secretName: 'secret1',
        type: SecretTypeDropdownLabel.source,
        source: { authType: SourceSecretType.basic, password: '', ['ssh-privatekey']: 'key1' },
        existingSecrets: [],
      }),
    ).rejects.toThrow('Required');
  });

  it('should return error when ssh-key not provided', async () => {
    await expect(() =>
      SecretFromSchema.validate({
        secretName: 'secret1',
        type: SecretTypeDropdownLabel.source,
        source: { authType: SourceSecretType.basic, password: 'pass', ['ssh-privatekey']: '' },
        existingSecrets: [],
      }),
    ).rejects.toThrow('Required');
  });

  it('should validate correct source secrets of basic type', () => {
    expect(() =>
      SecretFromSchema.validate({
        secretName: 'secret1',
        type: SecretTypeDropdownLabel.source,
        source: { authType: SourceSecretType.ssh, ['ssh-privatekey']: 'key1' },
        existingSecrets: [],
      }),
    ).not.toThrow();
  });
});
