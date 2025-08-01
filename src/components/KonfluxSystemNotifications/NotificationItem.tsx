import {
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
} from '@patternfly/react-core/dist/esm/components';
import { BannerType } from '../KonfluxBanner/banner-type';

interface NotificationItemProps {
  type: BannerType;
  summary: string;
  created: string;
  isRead: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  type,
  summary,
  created,
  isRead,
}) => {
  return (
    <NotificationDrawerListItem variant={type} isRead={isRead}>
      <NotificationDrawerListItemHeader variant={type} title="testing" />
      <NotificationDrawerListItemBody timestamp={created}>{summary}</NotificationDrawerListItemBody>
    </NotificationDrawerListItem>
  );
};
