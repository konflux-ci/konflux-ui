import { ImagePullSecretType, SecretTypeDropdownLabel, SourceSecretType } from '../../types';
import { bannerConfigYupSchema, SecretFromSchema } from '../validation-utils';

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

  describe('bannerConfigYupSchema', () => {
    it('should validate correct banner config', async () => {
      const validData = {
        enable: true,
        summary: 'This is a valid summary.',
        type: 'info',
        startTime: '2024-06-01T12:00:00Z',
        endTime: '2024-06-02T12:00:00Z',
      };
      await expect(bannerConfigYupSchema.validate(validData)).resolves.toBeTruthy();
    });

    it('should fail if enable is missing', async () => {
      const data = {
        summary: 'Valid summary',
        type: 'info',
      };
      await expect(bannerConfigYupSchema.validate(data)).rejects.toThrow();
    });

    it('should fail if summary is too short', async () => {
      const data = {
        enable: true,
        summary: '1234',
        type: 'info',
      };
      await expect(bannerConfigYupSchema.validate(data)).rejects.toThrow(
        'Must be at least 5 characters',
      );
    });

    it('should fail if summary is too long', async () => {
      const data = {
        enable: true,
        summary: 'a'.repeat(201),
        type: 'info',
      };
      await expect(bannerConfigYupSchema.validate(data)).rejects.toThrow(
        'Must be at most 200 characters',
      );
    });

    it('should fail if type is invalid', async () => {
      const data = {
        enable: true,
        summary: 'Valid summary',
        type: 'invalid',
      };
      await expect(bannerConfigYupSchema.validate(data)).rejects.toThrow();
    });

    it('should fail if startTime is invalid date', async () => {
      const data = {
        enable: true,
        summary: 'Valid summary',
        type: 'info',
        startTime: 'not-a-date',
      };
      await expect(bannerConfigYupSchema.validate(data)).rejects.toThrow('Invalid startTime');
    });

    it('should fail if endTime is invalid date', async () => {
      const data = {
        enable: true,
        summary: 'Valid summary',
        type: 'info',
        endTime: 'not-a-date',
      };
      await expect(bannerConfigYupSchema.validate(data)).rejects.toThrow('Invalid endTime');
    });

    it('should allow missing startTime and endTime', async () => {
      const data = {
        enable: true,
        summary: 'Valid summary',
        type: 'warning',
      };
      await expect(bannerConfigYupSchema.validate(data)).resolves.toBeTruthy();
    });
  });
});
