export const BANNER_TYPES = ['info', 'warning', 'danger'] as const;
export type BannerType = (typeof BANNER_TYPES)[number];
export type BannerConfig = {
  summary: string;
  type: BannerType;
  startTime?: string;
  endTime?: string;
  timeZone?: string;
  year?: number; // 1970-9999
  month?: number; // 1-12
  dayOfWeek?: number; // 0-6 for Sunday-Saturday
  dayOfMonth?: number; // 1-31 for the day of the month
};
export enum RepeatType {
  NONE = 'none',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}
export enum BannerVariant {
  BLUE = 'blue',
  GOLD = 'gold',
  RED = 'red',
}
