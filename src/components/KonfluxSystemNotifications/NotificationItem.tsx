import {
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
} from '@patternfly/react-core/dist/esm/components';
import { Timestamp } from '~/shared/components/timestamp';
import { SystemNotificationConfig } from '~/types/notification-type';

export const NotificationItem: React.FC<SystemNotificationConfig> = ({
  component,
  title,
  type,
  summary,
  created,
}) => {
  return (
    <NotificationDrawerListItem variant={type}>
      <NotificationDrawerListItemHeader
        variant={type}
        title={title?.trim() ? title.trim() : component}
      />
      <NotificationDrawerListItemBody timestamp={<Timestamp timestamp={created} simple />}>
        {summary}
      </NotificationDrawerListItemBody>
    </NotificationDrawerListItem>
  );
};
