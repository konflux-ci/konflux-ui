import * as React from 'react';
import { NotificationBadge, ToolbarItem, Tooltip } from '@patternfly/react-core';
import { useSystemNotifications } from './useSystemNotifications';

interface NotificationBadgeWrapperProps {
  isDrawerExpanded: boolean;
  toggleDrawer: () => void;
}

export const NotificationBadgeWrapper: React.FC<NotificationBadgeWrapperProps> = ({
  isDrawerExpanded,
  toggleDrawer,
}) => {
  const { notifications, error } = useSystemNotifications();

  // Handle errors gracefully - don't let notification errors break the header
  const safeNotifications = error ? [] : notifications;

  return (
    <ToolbarItem>
      <Tooltip content="System Notifications">
        <NotificationBadge
          onClick={toggleDrawer}
          aria-label="Notifications"
          isExpanded={isDrawerExpanded}
          count={safeNotifications.length}
        />
      </Tooltip>
    </ToolbarItem>
  );
};
