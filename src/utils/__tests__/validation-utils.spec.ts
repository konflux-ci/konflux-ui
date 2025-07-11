import yaml from 'js-yaml';
import {
  mockedInvalidBannerConfig,
  mockedMonthlyBannerConfig,
  mockedObsoletedBannerConfig,
  mockedObsoletedMonthlyBannerConfigWithTimeRange,
  mockedValidBannerConfig,
  mockedValidBannerConfigWithNoTimeRange,
  mockedValidMonthlyBannerConfigWithInvalidTimeRange,
  mockedWeeklyBannerConfig,
} from '~/hooks/__data__/mock-data';
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
    function getParsedBanner(config: { data: { [key: string]: string } }) {
      return yaml.load(config.data['banner-content.yaml'])[0];
    }

    it('validates a correct weekly banner (from mock)', async () => {
      const parsed = getParsedBanner(mockedWeeklyBannerConfig);
      await expect(bannerConfigYupSchema.validate(parsed)).resolves.toBeTruthy();
    });

    it('validates a correct monthly banner (from mock)', async () => {
      const parsed = getParsedBanner(mockedMonthlyBannerConfig);
      await expect(bannerConfigYupSchema.validate(parsed)).resolves.toBeTruthy();
    });

    it('validates a correct minimal config with no time range', async () => {
      const parsed = getParsedBanner(mockedValidBannerConfigWithNoTimeRange);
      await expect(bannerConfigYupSchema.validate(parsed)).resolves.toBeTruthy();
    });

    it('validates a valid banner with full time window', async () => {
      const parsed = getParsedBanner(mockedValidBannerConfig);
      await expect(bannerConfigYupSchema.validate(parsed)).resolves.toBeTruthy();
    });

    it('fails when YAML content is invalid', async () => {
      const parsed = getParsedBanner(mockedInvalidBannerConfig);
      await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow();
    });

    it('fails when summary is too short', async () => {
      const parsed = { summary: '1234', type: 'info' };
      await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow(
        'Must be at least 5 characters',
      );
    });

    it('fails when summary is too long', async () => {
      const parsed = { summary: 'a'.repeat(501), type: 'info' };
      await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow(
        'Must be at most 500 characters',
      );
    });

    it('fails when type is invalid', async () => {
      const parsed = { summary: 'Valid summary', type: 'fatal' };
      await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow();
    });

    it('validates all correct type values', async () => {
      for (const type of ['info', 'warning', 'danger']) {
        const parsed = {
          summary: 'Valid summary',
          type,
          startTime: '10:00',
          endTime: '12:00',
        };
        await expect(bannerConfigYupSchema.validate(parsed)).resolves.toBeTruthy();
      }
    });

    it('fails if startTime is invalid', async () => {
      const parsed = {
        summary: 'Valid summary',
        type: 'info',
        startTime: 'bad-time',
        endTime: '12:00',
      };
      await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow(
        'startTime must be in HH:mm 24-hour format',
      );
    });

    it('fails if endTime is invalid', async () => {
      const parsed = {
        summary: 'Valid summary',
        type: 'info',
        startTime: '10:00',
        endTime: 'bad-end',
      };
      await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow(
        'endTime must be in HH:mm 24-hour format',
      );
    });

    it('fails if timeZone format is invalid', async () => {
      const parsed = {
        summary: 'Valid summary',
        type: 'info',
        startTime: '10:00',
        endTime: '11:00',
        timeZone: 'AsiaShanghai',
      };
      await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow(
        'Invalid time zone specified: AsiaShanghai',
      );
    });

    it('allows banner with no startTime/endTime if not required', async () => {
      const parsed = {
        summary: 'No time window',
        type: 'info',
        repeatType: 'none',
      };
      await expect(bannerConfigYupSchema.validate(parsed)).resolves.toBeTruthy();
    });

    it('allows obsoleted banner config', async () => {
      const parsed = getParsedBanner(mockedObsoletedBannerConfig);
      await expect(bannerConfigYupSchema.validate(parsed)).resolves.toBeTruthy();
    });

    it('validates one-time banner with year/month/day/time', async () => {
      const parsed = {
        summary: 'One-time event banner',
        type: 'info',
        year: '2025',
        month: '07',
        dayOfMonth: 8,
        startTime: '08:00',
        endTime: '18:00',
      };
      await expect(bannerConfigYupSchema.validate(parsed)).resolves.toBeTruthy();
    });

    it('fails one-time banner with invalid year format', async () => {
      const parsed = {
        summary: 'Invalid year',
        type: 'info',
        repeatType: 'none',
        year: '25',
        month: '07',
        dayOfMonth: 8,
        startTime: '08:00',
        endTime: '18:00',
      };
      await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow(
        'year must be a 4-digit string',
      );
    });

    it('fails one-time banner with invalid month format', async () => {
      const parsed = {
        summary: 'Invalid month',
        type: 'info',
        repeatType: 'none',
        year: '2025',
        month: '13',
        dayOfMonth: 8,
        startTime: '08:00',
        endTime: '18:00',
      };
      await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow(
        'month must be 1-12 or 01-12',
      );
    });

    it('fails when year/month is set but missing dayOfMonth/startTime/endTime', async () => {
      const parsed = {
        summary: 'Missing time fields',
        type: 'info',
        repeatType: 'none',
        year: '2025',
        month: '07',
      };
      await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow(
        'dayOfMonth is required',
      );
    });

    it('allows obsoleted monthly config with time range', async () => {
      const parsed = getParsedBanner(mockedObsoletedMonthlyBannerConfigWithTimeRange);
      await expect(bannerConfigYupSchema.validate(parsed)).resolves.toBeTruthy();
    });

    it('allows valid monthly config with future time range', async () => {
      const parsed = getParsedBanner(mockedValidMonthlyBannerConfigWithInvalidTimeRange);
      await expect(bannerConfigYupSchema.validate(parsed)).resolves.toBeTruthy();
    });

    it('validates all correct type values', async () => {
      for (const type of ['info', 'warning', 'danger']) {
        const parsed = {
          summary: 'Valid summary',
          type,
          startTime: '10:00',
          endTime: '12:00',
        };
        await expect(bannerConfigYupSchema.validate(parsed)).resolves.toBeTruthy();
      }
    });

    it('fails when year/month/dayOfMonth is set but missing startTime/endTime', async () => {
      const parsed = {
        summary: 'Missing time fields',
        type: 'info',
        repeatType: 'none',
        year: '2025',
        month: '07',
        dayOfMonth: '14',
      };
      await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow('endTime is required');
    });

    it('fails when year/month/dayOfMonth/endTime is set but missing startTime', async () => {
      const parsed = {
        summary: 'Missing time fields',
        type: 'info',
        repeatType: 'none',
        year: '2025',
        month: '07',
        dayOfMonth: '14',
        endTime: '10:30',
      };
      await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow('startTime is required');
    });

    it('fails one-time banner with invalid year format', async () => {
      const parsed = {
        summary: 'Invalid year',
        type: 'info',
        year: '25',
        month: '07',
        dayOfMonth: 8,
        startTime: '08:00',
        endTime: '18:00',
      };
      await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow(
        'year must be a 4-digit string',
      );
    });

    it('fails when summary is only whitespace', async () => {
      const parsed = {
        summary: '   ',
        type: 'info',
      };
      await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow();
    });

    it('fails when type is missing', async () => {
      const parsed = {
        summary: 'Missing type',
      };
      await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow();
    });

    it('fails when dayOfWeek is out of range', async () => {
      const parsed = {
        summary: 'Invalid weekday',
        type: 'info',
        dayOfWeek: 7,
        startTime: '10:00',
        endTime: '12:00',
      };
      await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow();
    });

    it('fails when dayOfMonth is out of range', async () => {
      const parsed = {
        summary: 'Invalid day',
        type: 'info',
        dayOfMonth: 32,
        startTime: '10:00',
        endTime: '12:00',
      };
      await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow();
    });
  });

  it('requires startTime and endTime when year/month present', async () => {
    const parsed = {
      summary: 'Test summary',
      type: 'info',
      year: '2025',
      month: '07',
      dayOfMonth: 8,
    };
    await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow('endTime is required');
  });

  it('does not require startTime and endTime if year/month are not present', async () => {
    const parsed = {
      summary: 'Test summary',
      type: 'info',
      repeatType: 'none',
    };
    await expect(bannerConfigYupSchema.validate(parsed)).resolves.toBeTruthy();
  });

  it('passes validation for valid IANA timeZone', async () => {
    const parsed = {
      summary: 'Test summary',
      type: 'info',
      startTime: '09:00',
      endTime: '18:00',
      timeZone: 'Asia/Shanghai',
    };
    await expect(bannerConfigYupSchema.validate(parsed)).resolves.toBeTruthy();
  });

  it('passes validation when timeZone is not provided', async () => {
    const parsed = {
      summary: 'Test summary',
      type: 'info',
      startTime: '09:00',
      endTime: '18:00',
    };
    await expect(bannerConfigYupSchema.validate(parsed)).resolves.toBeTruthy();
  });
});
