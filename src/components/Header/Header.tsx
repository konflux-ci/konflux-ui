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
import { useSystemNotifications } from '~/components/KonfluxSystemNotifications/useSystemNotifications';
import { IfFeature } from '~/feature-flags/hooks';
import { createFeatureFlagPanelModal } from '~/feature-flags/Panel';
import { ThemeDropdown } from '~/shared/theme/ThemeDropdown';
import { useModalLauncher } from '../modal/ModalProvider';
import { UserDropdown } from './UserDropdown';

interface HeaderProps {
  isDrawerExpanded: boolean;
  toggleDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isDrawerExpanded, toggleDrawer }) => {
  const showModal = useModalLauncher();
  const { notifications, error } = useSystemNotifications();

  // Handle errors gracefully - don't let notification errors break the header
  const safeNotifications = error ? [] : notifications;
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
                count={safeNotifications.length}
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
