import { useMemo } from 'react';
import { BANNER_TYPES, BannerType } from '~/components/KonfluxBanner/banner-type';
import { SystemAlertConfig } from '~/components/KonfluxSystemNotifications/notification-type';
import { KONFLUX_INFO_NAMESPACE } from '~/consts/constants';
import { useK8sWatchResource } from '~/k8s';
import { ConfigMapGroupVersionKind, ConfigMapModel } from '~/models/config-map';
import { ConfigMap } from '~/types/configmap';

export const MAX_ALERT_SUMMARY_LENGTH = 200;
const SYSTEM_ALERT_LABEL_SELECTOR = { 'konflux.system.alert': 'true' };

export const useSystemNotifications = () => {
  const {
    data: configMaps,
    isLoading,
    error,
  } = useK8sWatchResource<ConfigMap[]>(
    {
      groupVersionKind: ConfigMapGroupVersionKind,
      isList: true,
      selector: { matchLabels: SYSTEM_ALERT_LABEL_SELECTOR },
      namespace: KONFLUX_INFO_NAMESPACE,
      watch: true,
    },
    ConfigMapModel,
  );

  return useMemo(() => {
    if (isLoading || error || !Array.isArray(configMaps)) {
      return { alerts: [], isLoading, error };
    }

    const alerts: SystemAlertConfig[] = [];

    for (const cm of configMaps) {
      const jsonString = cm?.data?.['alert-content.json'];
      if (!jsonString) continue;

      try {
        const parsed = JSON.parse(jsonString);
        const { type, summary } = parsed;
        const isValidType = typeof type === 'string' && BANNER_TYPES.includes(type as BannerType);
        const isValidSummary = typeof summary === 'string' && summary.trim().length > 0;

        if (!isValidType || !isValidSummary) continue;

        alerts.push({
          type: type as BannerType,
          summary: summary.slice(0, MAX_ALERT_SUMMARY_LENGTH),
          created: cm.metadata?.creationTimestamp || '',
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Invalid alert-content.json in ConfigMap:', cm?.metadata?.name);
      }
    }

    // Sort valid alerts by creationTimestamp (newest first)
    alerts.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    return { alerts, isLoading: false, error };
  }, [configMaps, isLoading, error]);
};
