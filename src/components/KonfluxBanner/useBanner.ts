import { useMemo } from 'react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import yaml from 'js-yaml';
import * as yup from 'yup';
import { KONFLUX_INFO_NAMESPACE } from '~/consts/constants';
import { useK8sWatchResource } from '~/k8s';
import { BannerConfig, RepeatType } from '~/types/banner-type';
import { ConfigMap } from '~/types/configmap';
import { ConfigMapGroupVersionKind, ConfigMapModel } from '../../models/config-map';
import { bannerConfigYupSchema } from './banner-validation-utils';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

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

// For repeated banners
function parseHM(timeStr?: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
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

  // Current time in banner timezone
  const zonedNow = dayjs().tz(timeZone);
  const nowHM = zonedNow.hour() * 60 + zonedNow.minute();

  switch (inferRepeatType(banner)) {
    case RepeatType.NONE: {
      const hasDate =
        banner.year !== undefined && banner.month !== undefined && banner.dayOfMonth !== undefined;
      const year = hasDate ? Number(banner.year) : zonedNow.year();
      const month = hasDate ? Number(banner.month) - 1 : zonedNow.month(); // 0-based for dayjs
      const day = hasDate ? Number(banner.dayOfMonth) : zonedNow.date();

      if (!banner.startTime || !banner.endTime) return true;

      const format = 'YYYY-MM-DD HH:mm';
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const start = dayjs.tz(`${dateStr} ${banner.startTime}`, format, timeZone);
      const end = dayjs.tz(`${dateStr} ${banner.endTime}`, format, timeZone);

      return zonedNow.isAfter(start) && zonedNow.isBefore(end);
    }

    case RepeatType.WEEKLY: {
      if (zonedNow.day() !== banner.dayOfWeek) return false;

      const startHM = parseHM(banner.startTime);
      const endHM = parseHM(banner.endTime);

      return nowHM >= startHM && nowHM <= endHM;
    }

    case RepeatType.MONTHLY: {
      if (zonedNow.date() !== banner.dayOfMonth) return false;

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
