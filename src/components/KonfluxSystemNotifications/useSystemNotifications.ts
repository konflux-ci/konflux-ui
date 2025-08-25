import { useMemo } from 'react';
import { KONFLUX_INFO_NAMESPACE } from '~/consts/constants';
import { useK8sWatchResource } from '~/k8s';
import { ConfigMapGroupVersionKind, ConfigMapModel } from '~/models/config-map';
import { BANNER_TYPES } from '~/types/banner-type';
import { ConfigMap } from '~/types/configmap';
import { RawNotificationConfig, SystemNotificationConfig } from '~/types/notification-type';

const SYSTEM_NOTIFICATION_LABEL_SELECTOR = { 'appstudio.openshift.io/system-notification': 'true' };

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
    },
    ConfigMapModel,
  );
  const isActiveNotification = (creationTimestamp: string, activeTimestamp?: string): boolean => {
    const notificationTimestamp = activeTimestamp ?? creationTimestamp;
    const timestampMs = new Date(notificationTimestamp).getTime();
    const active = !isNaN(timestampMs) && timestampMs <= Date.now();

    if (!active) {
      // eslint-disable-next-line no-console
      console.warn(
        `Inactive notification in ConfigMap: created=${creationTimestamp}, activeTimestamp=${activeTimestamp}`,
      );
    }
    return active;
  };

  const isValidNotification = (notification: RawNotificationConfig): boolean => {
    const isValidType = BANNER_TYPES.includes(notification.type);
    const isValidSummary = notification.summary.trim().length > 0;
    if (!isValidType || !isValidSummary) {
      // eslint-disable-next-line no-console
      console.warn(
        `Invalid type or summary in ConfigMap: type=${notification.type}, summary=${notification.summary}`,
      );
    }
    return isValidType && isValidSummary;
  };

  return useMemo(() => {
    if (isLoading || error || !Array.isArray(configMaps)) {
      return { notifications: [], isLoading, error };
    }

    const notifications = configMaps.reduce<SystemNotificationConfig[]>((acc, cm) => {
      const rawContent = cm?.data?.['notification-content.json'];
      if (!rawContent) {
        // eslint-disable-next-line no-console
        console.warn(`No notification-content.json found in ConfigMap: ${cm?.metadata?.name}`);
        return acc;
      }

      try {
        const parsed = JSON.parse(rawContent);

        // Handle multiple notifications per config map
        // Currently we do not recommend user to enjoy several notifications in one configmap, but
        // let us just support here.
        const notificationArray: RawNotificationConfig[] = Array.isArray(parsed)
          ? parsed
          : [parsed];

        notificationArray.forEach((notification) => {
          if (
            isValidNotification(notification) &&
            isActiveNotification(cm.metadata.creationTimestamp, notification?.activeTimestamp)
          ) {
            acc.push({
              title: notification?.title?.trim() || cm.metadata.name,
              type: notification.type,
              summary: notification.summary,
              created: notification?.activeTimestamp ?? cm.metadata.creationTimestamp,
            });
          }
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(
          `Invalid notification-content.json in ConfigMap: ${cm?.metadata?.name}. The error is: ${e instanceof Error ? e.message : String(e)}`,
        );
      }

      return acc;
    }, []);

    notifications.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    return { notifications, isLoading, error };
  }, [configMaps, isLoading, error]);
};
