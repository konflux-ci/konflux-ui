import * as React from 'react';
import {
  Button,
  NotificationBadge,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
} from '@patternfly/react-core';
import { FlaskIcon } from '@patternfly/react-icons/dist/esm/icons/flask-icon';
import { IfFeature } from '~/feature-flags/hooks';
import { createFeatureFlagPanelModal } from '~/feature-flags/Panel';
import { ThemeDropdown } from '~/shared/theme/ThemeDropdown';
import { SystemNotificationConfig } from '~/types/notification-type';
import { useModalLauncher } from '../modal/ModalProvider';
import { UserDropdown } from './UserDropdown';

interface HeaderProps {
  isDrawerExpanded: boolean;
  toggleDrawer: () => void;
  notifications: SystemNotificationConfig[];
}

export const Header: React.FC<HeaderProps> = ({
  isDrawerExpanded,
  toggleDrawer,
  notifications,
}) => {
  const showModal = useModalLauncher();
  return (
    <Toolbar isFullHeight>
      <ToolbarContent>
        <ToolbarGroup align={{ default: 'alignRight' }}>
          <ToolbarItem>
            <Tooltip content="Experimental Features">
              <Button
                variant="plain"
                onClick={() => showModal(createFeatureFlagPanelModal())}
                aria-label="Experimental Features"
              >
                <FlaskIcon />
              </Button>
            </Tooltip>
          </ToolbarItem>
          <ToolbarItem>
            <Tooltip content="System Notifications">
              <NotificationBadge
                onClick={toggleDrawer}
                aria-label="Notifications"
                isExpanded={isDrawerExpanded}
                count={notifications.length}
              />
            </Tooltip>
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
