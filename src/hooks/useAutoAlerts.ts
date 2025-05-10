import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import yaml from 'js-yaml';
import { useK8sWatchResource } from '~/k8s';
import { ConfigMap } from '~/types/configmap';
import { autoAlertConfigYupSchema } from '~/utils/validation-utils';
import { ConfigMapGroupVersionKind, ConfigMapModel } from './../models/config-map';
import { BannerType } from './useBanner';

export type AutoAlertConfig = {
  type: BannerType;
  summary: string;
  enable?: boolean;
};

const parseAutoAlert = (yamlContent: string): AutoAlertConfig | null => {
  const parsed = yaml.load(yamlContent, { schema: yaml.FAILSAFE_SCHEMA });
  if (typeof parsed !== 'object' || parsed === null) return null;
  try {
    const alert = autoAlertConfigYupSchema.validateSync(parsed, { abortEarly: false });
    return alert?.enable === false
      ? null
      : {
          type: alert.type,
          summary: DOMPurify.sanitize(alert.summary),
        };
  } catch {
    return null;
  }
};

export const useAutoAlerts = () => {
  const {
    data: configMaps,
    isLoading,
    error,
  } = useK8sWatchResource<ConfigMap[]>(
    {
      groupVersionKind: ConfigMapGroupVersionKind,
      isList: true,
      selector: { matchLabels: { 'konflux-auto-alert': 'true' } },
      namespace: 'konflux-info',
    },
    ConfigMapModel,
  );

  return useMemo(() => {
    if (isLoading || error || !Array.isArray(configMaps))
      return { alerts: [], isLoading, isError: !!error };

    const alerts: AutoAlertConfig[] = configMaps
      .map((cm) => {
        const yamlContent =
          cm?.['auto-alert-content.yaml'] || cm?.data?.['auto-alert-content.yaml'];
        if (typeof yamlContent !== 'string') return null;
        return parseAutoAlert(yamlContent);
      })
      .filter((a): a is AutoAlertConfig => a !== null);

    return { alerts, isLoading: false, isError: false };
  }, [configMaps, isLoading, error]);
};
