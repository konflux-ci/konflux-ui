import {
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
} from '@patternfly/react-core/dist/esm/components';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { SystemNotificationConfig } from '~/types/notification-type';

dayjs.extend(relativeTime);

// Enjoy a relative time within one hour, while absolute time after it.
export const formatTimestamp = (created: string): string => {
  const createdDate = dayjs(created);
  const ageInMinutes = dayjs().diff(createdDate, 'minute');
  return ageInMinutes < 60 ? createdDate.fromNow() : createdDate.format('MMM D YYYY h:mm A');
};

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
      <NotificationDrawerListItemBody timestamp={formatTimestamp(created)}>
        {summary}
      </NotificationDrawerListItemBody>
    </NotificationDrawerListItem>
  );
};
