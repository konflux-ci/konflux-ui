import * as React from 'react';
import {
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
} from '@patternfly/react-core';
import { FlaskIcon } from '@patternfly/react-icons/dist/esm/icons/flask-icon';
import { IfFeature } from '~/feature-flags/hooks';
import { createFeatureFlagPanelModal } from '~/feature-flags/Panel';
import { ThemeDropdown } from '~/shared/theme';
import { NotificationBadgeWrapper } from '../KonfluxSystemNotifications/NotificationBadgeWrapper';
import { useModalLauncher } from '../modal/ModalProvider';
import { UserDropdown } from './UserDropdown';

interface HeaderProps {
  isDrawerExpanded: boolean;
  toggleDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isDrawerExpanded, toggleDrawer }) => {
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
          <IfFeature flag="system-notifications">
            <NotificationBadgeWrapper
              isDrawerExpanded={isDrawerExpanded}
              toggleDrawer={toggleDrawer}
            />
          </IfFeature>
          <ToolbarItem>
            <ThemeDropdown />
          </ToolbarItem>
          <ToolbarItem>
            <UserDropdown />
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );
};
