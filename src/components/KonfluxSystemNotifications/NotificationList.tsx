import React from 'react';
import {
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerList,
  Bullseye,
  Spinner,
} from '@patternfly/react-core';
import { HttpError } from '~/k8s/error';
import ErrorEmptyState from '~/shared/components/empty-state/ErrorEmptyState';
import { SystemAlertConfig } from './notification-type';
import { NotificationHeader } from './NotificationHeader';
import { NotificationItem } from './NotificationItem';

interface NotificationCenterProps {
  isDrawerExpanded: boolean;
  closeDrawer: () => void;
  alerts: SystemAlertConfig[];
  isLoading: boolean;
  error: unknown;
  unreadCount: number;
  onMarkAllRead: () => void;
  lastReadTimeState: number;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isDrawerExpanded,
  closeDrawer,
  alerts,
  isLoading,
  error,
  unreadCount,
  onMarkAllRead,
  lastReadTimeState,
}) => {
  if (isLoading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error) {
    const httpError = HttpError.fromCode((error as { code: number }).code);
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
        <NotificationHeader
          unreadCount={unreadCount}
          onMarkAllRead={onMarkAllRead}
          onClose={closeDrawer}
        />

        <NotificationDrawerBody>
          <NotificationDrawerList>
            {alerts.map((alert, index) => {
              const alertTimestamp = new Date(alert.created).getTime();
              const isRead = alertTimestamp <= lastReadTimeState;

              return (
                <NotificationItem
                  key={`${alert.created}-${alert.type}-${index}`}
                  type={alert.type}
                  summary={alert.summary}
                  created={alert.created}
                  isRead={isRead}
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
