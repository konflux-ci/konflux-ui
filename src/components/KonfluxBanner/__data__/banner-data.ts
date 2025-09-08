import yaml from 'js-yaml';
import { BannerConfig } from '~/types/banner-type';

function formatTimeUTC(date: Date): string {
  const h = date.getUTCHours().toString().padStart(2, '0');
  const m = date.getUTCMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

const now = new Date();
const oneHourEarlier = new Date(now.getTime() - 60 * 60 * 1000);
const halfHourEarlier = new Date(now.getTime() - 30 * 60 * 1000);

const pastStartTime = formatTimeUTC(oneHourEarlier);
const pastEndTime = formatTimeUTC(halfHourEarlier);

const mockedDayOfWeek = now.getUTCDay();
const mockedDayOfMonth = now.getUTCDate(); // return the exact current day: 1-31
const mockedYear = now.getUTCFullYear();
const mockedMonth = now.getUTCMonth() + 1;

// === YAML Banner Generator ===
export function generateBannerYAML({
  type = 'info',
  summary = 'Default banner',
  dayOfWeek,
  dayOfMonth,
  year,
  month,
  startTime,
  endTime,
}: Partial<BannerConfig>): string {
  const lines = [`type: ${type}`, `summary: ${summary}`];

  if (dayOfWeek !== undefined) {
    lines.push(`dayOfWeek: ${dayOfWeek}`);
  }
  if (dayOfMonth !== undefined) {
    lines.push(`dayOfMonth: ${dayOfMonth}`);
  }
  if (year !== undefined) {
    lines.push(`year: ${year}`);
  }
  if (month !== undefined) {
    lines.push(`month: ${month}`);
  }
  if (startTime) {
    lines.push(`startTime: "${startTime}"`);
  }
  if (endTime) {
    lines.push(`endTime: "${endTime}"`);
  }

  return lines.join('\n');
}

export function generateBannerYAMLList(banners: ReturnType<typeof generateBannerYAML>[]): string {
  return yaml.dump(banners.map((b) => yaml.load(b)));
}

// === Base ConfigMap Template ===
const baseConfigMap = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: 'konflux-banner-configmap',
    namespace: 'konflux-info',
  },
};

// === Exported Mock Configs ===
export const mockedValidBannerConfig = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary:
          'This is a <strong>test banner</strong>. Free to check more details in [channel](https://test.com)',
        startTime: pastStartTime,
        endTime: '23:59',
      }),
    ]),
  },
};

export const mockedObsoletedBannerConfig = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'This is a <strong>test banner</strong>. Free to check more details in [channel]',
        year: mockedYear,
        month: mockedMonth,
        dayOfMonth: mockedDayOfMonth,
        startTime: pastStartTime,
        endTime: pastEndTime,
      }),
    ]),
  },
};

export const mockedValidBannerConfigWithNoTimeRange = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'This is a test banner',
      }),
    ]),
  },
};

export const mockedInvalidBannerConfig = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': 'invalid yaml content',
  },
};

export const mockedOneTimeBannerConfigWithTime = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'One-time banner with time fields',
        year: mockedYear,
        month: mockedMonth,
        dayOfMonth: mockedDayOfMonth,
        startTime: pastStartTime,
        endTime: '23:59',
      }),
    ]),
  },
};

// === Weekly Banners ===
export const mockedWeeklyBannerConfig = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'Weekly banner',
        dayOfWeek: mockedDayOfWeek,
        startTime: pastStartTime,
        endTime: '23:59',
      }),
    ]),
  },
};

export const mockedInvalidWeeklyBannerConfig = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'Weekly banner',
        dayOfWeek: (mockedDayOfWeek + 1) % 7, // tomorrow
        startTime: pastStartTime,
        endTime: '23:59',
      }),
    ]),
  },
};

// === Monthly Banners ===
export const mockedMonthlyBannerConfig = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'Monthly banner',
        dayOfMonth: mockedDayOfMonth,
        startTime: pastStartTime,
        endTime: '23:59',
      }),
    ]),
  },
};

export const mockedInvalidMonthlyBannerConfig = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'Monthly banner',
        dayOfMonth: mockedDayOfMonth + 2,
        startTime: '00:00',
        endTime: '23:59',
      }),
    ]),
  },
};

export const mockedValidMonthlyBannerConfigWithInvalidTimeRange = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'Monthly banner',
        dayOfMonth: mockedDayOfMonth,
        startTime: '23:59',
        endTime: '23:59',
      }),
    ]),
  },
};

export const mockedObsoletedMonthlyBannerConfigWithTimeRange = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'Monthly banner',
        dayOfMonth: mockedDayOfMonth,
        startTime: pastStartTime,
        endTime: pastEndTime,
      }),
    ]),
  },
};

export const mockedBannerListWithSeveralActive = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'Inactive old banner',
        startTime: pastStartTime,
        endTime: pastEndTime,
      }),
      generateBannerYAML({
        summary: 'Active banner-1',
        startTime: pastStartTime,
        endTime: '23:59',
      }),
      generateBannerYAML({
        type: 'info',
        summary: 'Active banner-latest',
        startTime: pastStartTime,
        endTime: '23:59',
      }),
      generateBannerYAML({
        summary: 'Another inactive',
        startTime: pastStartTime,
        endTime: pastEndTime,
      }),
    ]),
  },
};
