import type { ConfigMap } from '~/types/configmap';
import { sortByTime } from '~/utils/common-utils';

export type MintMakerScheduleEntry = {
  manager: string;
  scheduledRuns: string[];
};

const SCHEDULE_SUFFIX = '_scheduled_times.txt';

export const getMintMakerSchedule = (
  data: ConfigMap['data'],
  now: number,
): MintMakerScheduleEntry[] => {
  const entries = Object.entries(data).reduce<MintMakerScheduleEntry[]>((acc, [key, value]) => {
    if (!key.endsWith(SCHEDULE_SUFFIX)) {
      return acc;
    }

    const manager = key.slice(0, -SCHEDULE_SUFFIX.length);
    const scheduledRuns = sortByTime(
      value
        .trim()
        .split(/\r?\n/)
        .map((timestamp) => timestamp.trim())
        .filter(Boolean)
        .filter((timestamp) => Date.parse(timestamp) > now),
      (timestamp) => timestamp,
    );

    if (scheduledRuns.length > 0) {
      acc.push({ manager, scheduledRuns });
    }

    return acc;
  }, []);

  return sortByTime(entries, (entry) => entry.scheduledRuns[0]);
};
