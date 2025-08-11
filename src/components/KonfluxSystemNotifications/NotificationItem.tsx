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
    <NotificationDrawerListItem>
      <NotificationDrawerListItemHeader variant={type} title={title?.trim() ? title : component} />
      <NotificationDrawerListItemBody timestamp={<Timestamp timestamp={created} simple />}>
        {summary}
      </NotificationDrawerListItemBody>
    </NotificationDrawerListItem>
  );
};
