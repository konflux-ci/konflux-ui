import { useMemo } from 'react';
import { KONFLUX_INFO_NAMESPACE } from '~/consts/constants';
import { useK8sWatchResource } from '~/k8s';
import { ConfigMapGroupVersionKind, ConfigMapModel } from '~/models/config-map';
import { BANNER_TYPES, BannerType } from '~/types/banner-type';
import { ConfigMap } from '~/types/configmap';
import { SystemNotificationConfig } from '~/types/notification-type';

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

    const notifications = configMaps
      .reduce<SystemNotificationConfig[]>((acc, cm) => {
        // Skip if no notification content
        if (!cm?.data?.['notification-content.json']) {
          // eslint-disable-next-line no-console
          console.warn('No notification-content.json found in ConfigMap:', cm?.metadata?.name);
          return acc;
        }

        try {
          const parsed = JSON.parse(cm.data['notification-content.json']);

          // Handle multiple notifications per config map
          // Currently we do not recommend user to enjoy several notifications in one configmap, but
          // let us just support here.
          const notificationArray = Array.isArray(parsed) ? parsed : [parsed];

          notificationArray.forEach((notification) => {
            const { type, summary } = notification;
            const isValidType =
              typeof type === 'string' && BANNER_TYPES.includes(type as BannerType);
            const isValidSummary = typeof summary === 'string' && summary.trim().length > 0;

            if (isValidType && isValidSummary) {
              acc.push({
                title: notification.title ?? '',
                component: cm.metadata.name,
                type: notification.type as BannerType,
                summary: notification.summary,
                created: cm.metadata.creationTimestamp || '',
              });
            }
          });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Invalid notification-content.json in ConfigMap:', cm?.metadata?.name);
        }

        return acc;
      }, [])
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    return { notifications, isLoading, error };
  }, [configMaps, isLoading, error]);
};
