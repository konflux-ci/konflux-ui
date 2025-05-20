import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import DOMPurify from 'dompurify';
import yaml from 'js-yaml';
import { k8sQueryGetResource } from '~/k8s';
import { ConfigMapModel } from '~/models';

export interface BannerConfig {
  enable: boolean;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger';
  startTime?: string;
  endTime?: string;
  details?: string;
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

const fetchBannerContent = async (url: string): Promise<BannerConfig | null> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch banner content from ${url}`);
  const text = await res.text();
  const parsed = yaml.load(text, { schema: yaml.FAILSAFE_SCHEMA });

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('YAML content is invalid');
  }

  const banner = parsed as BannerConfig;

  if (!banner.enable) {
    return null;
  }

  return banner;
};

export const useBanner = () => {
  return useQuery({
    queryKey: ['konfluxBanner'],
    queryFn: async () => {
      try {
        const url = await fetchBannerPath();
        const banner = await fetchBannerContent(url);

        if (!banner) {
          return null;
        }

        // 严格校验BannerConfig结构和字段类型
        if (
          typeof banner.title !== 'string' ||
          typeof banner.message !== 'string' ||
          !['info', 'warning', 'danger'].includes(banner.type) ||
          (banner.startTime && isNaN(Date.parse(banner.startTime))) ||
          (banner.endTime && isNaN(Date.parse(banner.endTime))) ||
          (banner.details && typeof banner.details !== 'string')
        ) {
          // eslint-disable-next-line no-console
          console.warn('Invalid banner content structure, ignoring banner');
          return null;
        }

        // XSS防护
        const safeBanner = {
          ...banner,
          title: DOMPurify.sanitize(banner.title),
          message: DOMPurify.sanitize(banner.message),
          details: banner.details ? DOMPurify.sanitize(banner.details) : undefined,
        };

        const now = dayjs();
        const show =
          (!safeBanner.startTime || now.isAfter(dayjs(safeBanner.startTime))) &&
          (!safeBanner.endTime || now.isBefore(dayjs(safeBanner.endTime)));

        return show ? safeBanner : null;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to fetch or parse banner, ignoring banner:', error);
        return null;
      }
    },
    staleTime: 5 * 1000,
  });
};
