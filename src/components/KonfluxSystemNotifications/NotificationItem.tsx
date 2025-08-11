import {
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
} from '@patternfly/react-core/dist/esm/components';
import { Timestamp } from '~/shared/components/timestamp';
import { SystemNotificationConfig } from '~/types/notification-type';

// This is the exact notifaction for drawer.
// Our current implementation does not support individual notification read state for
// we do not have backend to keep the read & unread status for each item
// This diverges slightly from PatternFly's recommendation, but aligns with our current
// technical constraints and still provides a clear, consistent UX.
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
