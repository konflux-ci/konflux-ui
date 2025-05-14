import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import yaml from 'js-yaml';
import { k8sQueryGetResource } from '~/k8s';
import { ConfigMapModel } from '~/models';

export interface BannerConfig {
  message: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
  start?: string;
  end?: string;
}

const fetchBannerPath = async (): Promise<string> => {
  const res = await k8sQueryGetResource({
    model: ConfigMapModel,
    queryOptions: { ns: 'wlin-tenant', name: 'konflux-banner-config' },
  });
  const bannerPath = res.data?.bannerPath as string;
  if (!bannerPath) throw new Error('bannerPath not found in configmap');

  return bannerPath.startsWith('https://raw.githubusercontent.com/')
    ? bannerPath
    : bannerPath
        .replace('https://github.com/', 'https://raw.githubusercontent.com/')
        .replace('/blob/', '/');
};

const fetchBannerContent = async (url: string): Promise<BannerConfig> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch banner content from ${url}`);
  const text = await res.text();
  const parsed = yaml.load(text);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('YAML content is invalid');
  }
  return parsed as BannerConfig;
};

export const useBanner = () => {
  return useQuery({
    queryKey: ['konfluxBanner'],
    queryFn: async () => {
      const url = await fetchBannerPath();
      const banner = await fetchBannerContent(url);

      const now = dayjs();
      const show =
        (!banner.start || now.isAfter(dayjs(banner.start))) &&
        (!banner.end || now.isBefore(dayjs(banner.end)));

      return show ? banner : null;
    },
    staleTime: 5 * 1000, // For testing purpose, let us set is 3s. The default value is 5 mins.
  });
};
