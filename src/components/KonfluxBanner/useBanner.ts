import { useMemo } from 'react';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import yaml from 'js-yaml';
import * as yup from 'yup';
import { BannerConfig, RepeatType } from '~/components/KonfluxBanner/banner-type';
import { KONFLUX_INFO_NAMESPACE } from '~/consts/constants';
import { useK8sWatchResource } from '~/k8s';
import { ConfigMap } from '~/types/configmap';
import { ConfigMapGroupVersionKind, ConfigMapModel } from '../../models/config-map';
import { bannerConfigYupSchema } from './banner-validation-utils';

dayjs.extend(utc);
dayjs.extend(timezone);

const BANNER_CONTENT_FILE = 'konflux-banner-configmap';
export function inferRepeatType(banner: BannerConfig): RepeatType {
  // Sunday is 0, so we can not enjoy 'true' check here.
  if (banner.dayOfWeek !== undefined) return RepeatType.WEEKLY;
  if (banner.dayOfMonth) {
    if (banner.month) return RepeatType.NONE; // specific date
    return RepeatType.MONTHLY; // repeats every month on this day
  }
  return RepeatType.NONE; // fallback
}

function convertToTimeZone(date: Date, timeZone: string): Date {
  return dayjs(date).tz(timeZone).toDate();
}

// For repeated banners
function parseHM(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Parses and validates a YAML banner list string.
 * Filters out any invalid entries silently.
 */
export const parseBannerList = (yamlContent: string): BannerConfig[] => {
  try {
    const parsed = yaml.load(yamlContent);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((banner) => {
        try {
          const validated = bannerConfigYupSchema.validateSync(banner, {
            strict: false,
            abortEarly: false,
          });
          return validated as BannerConfig;
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Invalid banner skipped:', banner);

          if (err instanceof yup.ValidationError) {
            // eslint-disable-next-line no-console
            console.warn('Validation errors:', err.errors);
          } else {
            // eslint-disable-next-line no-console
            console.warn('Unexpected validation error:', err);
          }
          return null;
        }
      })
      .filter((banner): banner is BannerConfig => banner !== null);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error parsing banner YAML:', e);
    return [];
  }
};

/**
 * Determines whether a banner is currently active based on its configuration and the given time.
 *
 * The function supports three types of banners:
 * - 'none': A one-time banner active within a specified date(today, or year,month, dayOfMonth) and time range (startTime, endTime).
 * - 'weekly': A recurring banner active on a specific day of the week and time range.
 * - 'monthly': A recurring banner active on a specific day of the month and time range.
 *
 * It handles time zone conversions based on the banner's `timeZone` property (defaulting to UTC),
 * ensuring accurate time comparisons regardless of the local environment.
 *
 * @param banner - The banner configuration containing scheduling and activation details.
 * @returns `true` if the banner is active at the given time, otherwise `false`.
 */
export function isBannerActive(banner: BannerConfig): boolean {
  const timeZone = banner.timeZone || 'UTC';
  const zonedNow = convertToTimeZone(new Date(), timeZone);
  const nowHM = zonedNow.getHours() * 60 + zonedNow.getMinutes();

  switch (inferRepeatType(banner)) {
    case RepeatType.NONE: {
      const hasDate = banner.year && banner.month && banner.dayOfMonth;
      // If user does not specify the year/month/day, let us assume it is today.
      const year = hasDate ? Number(banner.year) : zonedNow.getUTCFullYear();
      const month = hasDate ? Number(banner.month) - 1 : zonedNow.getUTCMonth(); // 0-based
      const day = hasDate ? Number(banner.dayOfMonth) : zonedNow.getUTCDate();

      // When there is no any time specified, we assume the banner should be shown at once
      if (!banner.startTime || !banner.endTime) return true;

      const [startHour, startMinute] = banner.startTime.split(':').map(Number);
      const [endHour, endMinute] = banner.endTime.split(':').map(Number);

      const start = new Date(Date.UTC(year, month, day, startHour, startMinute));
      const end = new Date(Date.UTC(year, month, day, endHour, endMinute));
      const startZoned = convertToTimeZone(start, timeZone);
      const endZoned = convertToTimeZone(end, timeZone);

      return zonedNow >= startZoned && zonedNow <= endZoned;
    }

    case RepeatType.WEEKLY: {
      if (zonedNow.getDay() !== banner.dayOfWeek) return false;
      const startHM = parseHM(banner.startTime);
      const endHM = parseHM(banner.endTime);
      return nowHM >= startHM && nowHM <= endHM;
    }

    case RepeatType.MONTHLY: {
      if (zonedNow.getDate() !== banner.dayOfMonth) return false;
      const startHM = parseHM(banner.startTime);
      const endHM = parseHM(banner.endTime);
      return nowHM >= startHM && nowHM <= endHM;
    }

    default:
      return false;
  }
}

export const useBanner = () => {
  const {
    data: bannerYamlData,
    isLoading,
    error,
  } = useK8sWatchResource<ConfigMap>(
    {
      groupVersionKind: ConfigMapGroupVersionKind,
      namespace: KONFLUX_INFO_NAMESPACE,
      name: BANNER_CONTENT_FILE,
      watch: true,
    },
    ConfigMapModel,
  );

  return useMemo(() => {
    if (isLoading || error) return null;

    const yamlContent = bannerYamlData?.data?.['banner-content.yaml'];
    if (typeof yamlContent !== 'string') return null;

    const activeBanner = parseBannerList(yamlContent).find(isBannerActive) ?? null;
    return activeBanner;
  }, [bannerYamlData, isLoading, error]);
};
