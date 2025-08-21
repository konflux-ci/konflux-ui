import { BannerType } from '~/types/banner-type';

// Notifications for components
export type SystemNotificationConfig = {
  created: string;
  title?: string;
  summary: string;
  type: BannerType;
};

// Raw Notifications from configmap
export type RawNotificationConfig = {
  title?: string;
  activeTimestamp?: string;
  summary: string;
  type: BannerType;
};
