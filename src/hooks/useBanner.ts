import { useMemo } from 'react';
import dayjs from 'dayjs';
import DOMPurify from 'dompurify';
import yaml from 'js-yaml';
import { useK8sWatchResource } from '~/k8s';
import { ConfigMap } from '~/types/configmap';
import { bannerConfigYupSchema } from '~/utils/validation-utils';
import { ConfigMapGroupVersionKind, ConfigMapModel } from './../models/config-map';

export type BannerType = 'info' | 'warning' | 'danger';
export type BannerConfig = {
  enable: boolean;
  summary: string;
  type: BannerType;
  startTime?: string;
  endTime?: string;
};

const parseBanner = (yamlContent: string): BannerConfig | null => {
  const parsed = yaml.load(yamlContent, { schema: yaml.FAILSAFE_SCHEMA });
  if (typeof parsed !== 'object' || parsed === null) return null;
  try {
    const banner = bannerConfigYupSchema.validateSync(parsed, { abortEarly: false });
    return {
      ...banner,
      summary: DOMPurify.sanitize(banner.summary),
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Banner config validation error:', error);
    return null;
  }
};

export const useBanner = () => {
  const {
    data: bannerYamlData,
    isLoading,
    error,
  } = useK8sWatchResource<ConfigMap>(
    {
      groupVersionKind: ConfigMapGroupVersionKind,
      namespace: 'konflux-info',
      name: 'konflux-banner-configmap',
    },
    ConfigMapModel,
  );

  return useMemo(() => {
    if (isLoading || error) return null;
    const yamlContent = bannerYamlData?.data?.['banner-content.yaml'];
    if (typeof yamlContent !== 'string') return null;
    const parsedBanner = parseBanner(yamlContent);
    if (!parsedBanner) return null;
    const now = dayjs();
    const show =
      parsedBanner.enable &&
      (!parsedBanner.startTime || now.isAfter(dayjs(parsedBanner.startTime))) &&
      (!parsedBanner.endTime || now.isBefore(dayjs(parsedBanner.endTime)));
    return show ? parsedBanner : null;
  }, [bannerYamlData, isLoading, error]);
};
