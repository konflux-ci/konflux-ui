import { BannerType } from '~/types/banner-type';

export type SystemNotificationConfig = {
  created: string;
  component: string;
  title?: string;
  summary: string;
  type: BannerType;
};
