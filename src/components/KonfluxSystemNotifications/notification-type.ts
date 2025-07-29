import { BannerConfig } from '~/components/KonfluxBanner/banner-type';

export type SystemAlertConfig = BannerConfig & {
  created: string;
};
