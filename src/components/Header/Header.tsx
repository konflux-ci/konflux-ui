import * as React from 'react';
import { Button, Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import { BellIcon } from '@patternfly/react-icons/dist/esm/icons/bell-icon';
import { FlaskIcon } from '@patternfly/react-icons/dist/esm/icons/flask-icon';
import { createFeatureFlagPanelModal } from '~/feature-flags/Panel';
import { useAutoAlerts } from '~/hooks/useAutoAlerts';
import { createAutoAlertModal } from '../AutoAlerts/AutoAlert';
import { useModalLauncher } from '../modal/ModalProvider';
import { UserDropdown } from './UserDropdown';
import './bell-blink.scss';

export const Header: React.FC = () => {
  const showModal = useModalLauncher();
  const { alerts, isLoading, isError } = useAutoAlerts();
  const hasAlerts = !isLoading && !isError && alerts.length > 0;
  return (
    <Toolbar isFullHeight>
      <ToolbarContent>
        {/* Other left/center-aligned items could go here if needed */}

        <ToolbarGroup align={{ default: 'alignRight' }}>
          <ToolbarItem>
            <Button
              variant="plain"
              title="Auto Alerts"
              onClick={() => {
                showModal(createAutoAlertModal());
              }}
            >
              <BellIcon className={hasAlerts ? 'bell-blink' : ''} />
            </Button>
          </ToolbarItem>
          <ToolbarItem>
            <Button
              variant="plain"
              title="Experimental Features"
              onClick={() => {
                showModal(createFeatureFlagPanelModal());
              }}
            >
              <FlaskIcon />
            </Button>
          </ToolbarItem>
          <ToolbarItem>
            <UserDropdown />
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );
};
