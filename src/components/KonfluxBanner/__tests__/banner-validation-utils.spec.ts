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
} from '../__data__/banner-data';
import { bannerConfigYupSchema } from '../banner-validation-utils';

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

  it('fails when summary is absent', async () => {
    const parsed = { type: 'info' };
    await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow(
      'summary is a required field',
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
      endTime: 0,
    };
    await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow(
      'endTime must be in HH:mm 24-hour format',
    );
  });

  it('pass if startTime is valid', async () => {
    const parsed = {
      summary: 'Valid summary',
      type: 'info',
      startTime: '12:00',
    };
    await expect(bannerConfigYupSchema.validate(parsed)).resolves.toBeTruthy();
  });

  it('pass if endTime is valid', async () => {
    const parsed = {
      summary: 'Valid summary',
      type: 'info',
      endTime: '12:00',
    };
    await expect(bannerConfigYupSchema.validate(parsed)).resolves.toBeTruthy();
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
    await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow('year must be >= 1970');
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
      'month must be between 1 and 12',
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
    await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow('dayOfMonth is required');
  });

  it('allows obsoleted monthly config with time range', async () => {
    const parsed = getParsedBanner(mockedObsoletedMonthlyBannerConfigWithTimeRange);
    await expect(bannerConfigYupSchema.validate(parsed)).resolves.toBeTruthy();
  });

  it('allows valid monthly config with future time range', async () => {
    const parsed = getParsedBanner(mockedValidMonthlyBannerConfigWithInvalidTimeRange);
    await expect(bannerConfigYupSchema.validate(parsed)).resolves.toBeTruthy();
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
      year: '100000',
      month: '07',
      dayOfMonth: 8,
      startTime: '08:00',
      endTime: '18:00',
    };
    await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow('year must be <= 9999');
  });

  it('fails when summary is only whitespace', async () => {
    const parsed = {
      summary: '   ',
      type: 'info',
    };
    await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow(
      'Must be at least 5 characters',
    );
  });

  it('fails when type is missing', async () => {
    const parsed = {
      summary: 'Missing type',
    };
    await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow(
      'type is a required field',
    );
  });

  it('fails when dayOfWeek is out of range', async () => {
    const parsed = {
      summary: 'Invalid weekday',
      type: 'info',
      dayOfWeek: 7,
      startTime: '10:00',
      endTime: '12:00',
    };
    await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow(
      'dayOfWeek must be less than or equal to 6',
    );
  });

  it('fails when dayOfMonth is out of range', async () => {
    const parsed = {
      summary: 'Invalid day',
      type: 'info',
      dayOfMonth: 32,
      startTime: '10:00',
      endTime: '12:00',
    };
    await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow(
      'dayOfMonth must be between 1 and 31',
    );
  });

  it('fails when dayOfMonth is smaller than 1', async () => {
    const parsed = {
      summary: 'Invalid day',
      type: 'info',
      dayOfMonth: 0,
      startTime: '10:00',
      endTime: '12:00',
    };
    await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow(
      'dayOfMonth must be between 1 and 31',
    );
  });

  it('fails when year is out of range', async () => {
    const parsed = {
      summary: 'Invalid day',
      type: 'info',
      year: 1910,
      month: 12,
      dayOfMonth: 2,
      startTime: '10:00',
      endTime: '12:00',
    };
    await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow('year must be >= 1970');
  });

  it('fails when year is larger than 9999', async () => {
    const parsed = {
      summary: 'Invalid day',
      type: 'info',
      year: 200000,
      month: 12,
      dayOfMonth: 1,
      startTime: '10:00',
      endTime: '12:00',
    };
    await expect(bannerConfigYupSchema.validate(parsed)).rejects.toThrow('year must be <= 9999');
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
