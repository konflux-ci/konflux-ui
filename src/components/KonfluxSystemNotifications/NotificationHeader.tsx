import { NotificationDrawerHeader } from '@patternfly/react-core';
import { SystemNotificationConfig } from '~/types/notification-type';

interface NotificationHeaderProps {
  onClose: () => void;
  notifications: SystemNotificationConfig[];
}

const getCustomText = (notifications: SystemNotificationConfig[]): string => {
  const total = notifications.length;

  // Calculate notifications from the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = notifications.filter(
    (notification) => new Date(notification.created) > oneHourAgo,
  ).length;

  return `${total} total, ${recentCount} new (past hour)`;
};

export const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  onClose,
  notifications,
}) => {
  return <NotificationDrawerHeader onClose={onClose} customText={getCustomText(notifications)} />;
};
