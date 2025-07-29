import { useMemo } from 'react';
import { KONFLUX_INFO_NAMESPACE } from '~/consts/constants';
import { useK8sWatchResource } from '~/k8s';
import { ConfigMapGroupVersionKind, ConfigMapModel } from '~/models/config-map';
import { BANNER_TYPES, BannerType } from '~/types/banner-type';
import { ConfigMap } from '~/types/configmap';
import { SystemNotificationConfig } from '~/types/notification-type';

export const MAX_NOTIFICATION_SUMMARY_LENGTH = 500;
const SYSTEM_NOTIFICATION_LABEL_SELECTOR = { 'konflux.system.notification': 'true' };

export const useSystemNotifications = () => {
  const {
    data: configMaps,
    isLoading,
    error,
  } = useK8sWatchResource<ConfigMap[]>(
    {
      groupVersionKind: ConfigMapGroupVersionKind,
      isList: true,
      selector: { matchLabels: SYSTEM_NOTIFICATION_LABEL_SELECTOR },
      namespace: KONFLUX_INFO_NAMESPACE,
      watch: true,
    },
    ConfigMapModel,
  );

  return useMemo(() => {
    if (isLoading || error || !Array.isArray(configMaps)) {
      return { notifications: [], isLoading, error };
    }

    const notifications: SystemNotificationConfig[] = [];

    for (const cm of configMaps) {
      const jsonString = cm?.data?.['notification-content.json'];
      if (!jsonString) continue;

      try {
        const parsed = JSON.parse(jsonString);
        const { type, summary, title } = parsed;
        const isValidType = typeof type === 'string' && BANNER_TYPES.includes(type as BannerType);
        const isValidSummary = typeof summary === 'string' && summary.trim().length > 0;

        if (!isValidType || !isValidSummary) continue;

        notifications.push({
          title: title ?? '',
          component: cm.metadata.name,
          type: type as BannerType,
          summary: summary.slice(0, MAX_NOTIFICATION_SUMMARY_LENGTH),
          created: cm.metadata.creationTimestamp || '',
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Invalid notification-content.json in ConfigMap:', cm?.metadata?.name);
      }
    }

    // Sort valid alerts by creationTimestamp (newest first)
    notifications.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    return { notifications, isLoading: false, error };
  }, [configMaps, isLoading, error]);
};
