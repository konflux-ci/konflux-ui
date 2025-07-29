import * as React from 'react';
import {
  Button,
  NotificationBadge,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { BellIcon } from '@patternfly/react-icons/dist/esm/icons';
import { FlaskIcon } from '@patternfly/react-icons/dist/esm/icons/flask-icon';
import { IfFeature } from '~/feature-flags/hooks';
import { createFeatureFlagPanelModal } from '~/feature-flags/Panel';
import { ThemeDropdown } from '~/shared/theme/ThemeDropdown';
import { useModalLauncher } from '../modal/ModalProvider';
import { UserDropdown } from './UserDropdown';

interface HeaderProps {
  isDrawerExpanded: boolean;
  toggleDrawer: () => void;
  unreadCount: number;
}

export const Header: React.FC<HeaderProps> = ({ isDrawerExpanded, toggleDrawer, unreadCount }) => {
  const showModal = useModalLauncher();
  return (
    <Toolbar isFullHeight>
      <ToolbarContent>
        <ToolbarGroup align={{ default: 'alignRight' }}>
          <ToolbarItem>
            <Button
              variant="plain"
              title="Experimental Features"
              onClick={() => showModal(createFeatureFlagPanelModal())}
            >
              <FlaskIcon />
            </Button>
          </ToolbarItem>
          <ToolbarItem>
            <NotificationBadge
              variant={unreadCount === 0 ? 'read' : 'unread'}
              onClick={toggleDrawer}
              aria-label="Notifications"
              isExpanded={isDrawerExpanded}
            >
              <BellIcon />
            </NotificationBadge>
          </ToolbarItem>
          <IfFeature flag="dark-theme">
            <ToolbarItem>
              <ThemeDropdown />
            </ToolbarItem>
          </IfFeature>
          <ToolbarItem>
            <UserDropdown />
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );
};
