import { useState } from 'react';
import {
  MenuToggle,
  Dropdown,
  DropdownItem,
  DropdownList,
  NotificationDrawerHeader,
} from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons';

interface NotificationHeaderProps {
  unreadCount: number;
  onClose: () => void;
  onMarkAllRead: () => void;
}

export const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  unreadCount,
  onClose,
  onMarkAllRead,
}) => {
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState<boolean>(false);
  const closeActionsMenu = () => setIsActionsMenuOpen(false);
  const toggleActionsMenu = () => setIsActionsMenuOpen(!isActionsMenuOpen);

  const notificationDrawerActions = (
    <>
      <DropdownItem key="markAllRead" onClick={onMarkAllRead}>
        Mark all read
      </DropdownItem>
    </>
  );
  return (
    <NotificationDrawerHeader count={unreadCount} onClose={onClose}>
      <Dropdown
        onSelect={closeActionsMenu}
        isOpen={isActionsMenuOpen}
        id="notification-header-actions"
        toggle={(toggleRef) => (
          <MenuToggle
            ref={toggleRef}
            id="header-toggle-id"
            aria-label="Notification drawer actions"
            variant="plain"
            onClick={toggleActionsMenu}
            isExpanded={isActionsMenuOpen || false}
          >
            <EllipsisVIcon aria-hidden="true" />
          </MenuToggle>
        )}
      >
        <DropdownList>{notificationDrawerActions}</DropdownList>
      </Dropdown>
    </NotificationDrawerHeader>
  );
};
