import {
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
} from '@patternfly/react-core/dist/esm/components';
import { Timestamp } from '~/shared/components/timestamp';
import { SystemNotificationConfig } from '~/types/notification-type';

export const NotificationItem: React.FC<SystemNotificationConfig> = ({
  title,
  type,
  summary,
  created,
}) => {
  return (
    <NotificationDrawerListItem data-test="notification-item" variant={type}>
      <NotificationDrawerListItemHeader
        data-test="notification-header"
        variant={type}
        title={title}
      />
      <NotificationDrawerListItemBody
        data-test="notification-body"
        timestamp={<Timestamp timestamp={created} simple />}
      >
        {summary}
      </NotificationDrawerListItemBody>
    </NotificationDrawerListItem>
  );
};
