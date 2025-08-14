import React from 'react';
import {
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerList,
  Bullseye,
  Spinner,
} from '@patternfly/react-core';
import { useSystemNotifications } from '~/components/KonfluxSystemNotifications/useSystemNotifications';
import { HttpError } from '~/k8s/error';
import ErrorEmptyState from '~/shared/components/empty-state/ErrorEmptyState';
import { NotificationHeader } from './NotificationHeader';
import { NotificationItem } from './NotificationItem';

interface NotificationCenterProps {
  isDrawerExpanded: boolean;
  closeDrawer: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isDrawerExpanded,
  closeDrawer,
}) => {
  const { notifications, isLoading, error } = useSystemNotifications();
  if (isLoading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error) {
    const httpError = HttpError.fromCode((error as unknown as { code: number }).code);
    return (
      <ErrorEmptyState
        httpError={httpError}
        title={`Unable to load system notifications`}
        body={(error as { message: string }).message}
      />
    );
  }

  return (
    isDrawerExpanded && (
      <NotificationDrawer>
        <NotificationHeader onClose={closeDrawer} notifications={notifications} />
        <NotificationDrawerBody>
          <NotificationDrawerList>
            {notifications.map((notification, index) => {
              return (
                <NotificationItem
                  key={`${notification.created}-${notification.type}-${index}`}
                  title={notification.title}
                  type={notification.type}
                  summary={notification.summary}
                  created={notification.created}
                />
              );
            })}
          </NotificationDrawerList>
        </NotificationDrawerBody>
      </NotificationDrawer>
    )
  );
};

export default NotificationCenter;
